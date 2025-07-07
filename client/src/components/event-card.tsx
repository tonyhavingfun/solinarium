import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, MessageSquare } from "lucide-react";
import { format, parseISO } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { useCityContext } from "@/contexts/CityContext";
import type { Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
  showJoinButton?: boolean;
}

export default function EventCard({ event, showJoinButton = false }: EventCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { selectedCities } = useCityContext();
  
  // Check if profile is complete - name is required, city from context or user profile
  const hasName = user?.firstName && user?.lastName;
  const hasCity = selectedCities.length > 0 || user?.city;
  const isProfileComplete = hasName && hasCity;

  const { data: attendance } = useQuery({
    queryKey: [`/api/events/${event.id}/attendance`],
    enabled: showJoinButton && isAuthenticated,
    retry: false,
  });

  const joinEventMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/events/${event.id}/join`);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: `Joined "${event.title}" successfully!`,
      });
      // Invalidate queries and refetch immediately to update button state
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/attendance`] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/events"] });
      // Refetch to immediately update the UI
      queryClient.refetchQueries({ queryKey: [`/api/events/${event.id}/attendance`] });
      
      // Redirect to chat if profile is complete
      if (isProfileComplete) {
        setTimeout(() => {
          setLocation("/chat");
        }, 1000);
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to join event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleJoin = () => {
    if (!isProfileComplete) {
      const missing = [];
      if (!hasName) missing.push("name");
      if (!hasCity) missing.push("city");
      
      toast({
        title: "Complete your profile",
        description: `Please add your ${missing.join(" and ")} in Profile settings before joining events`,
        variant: "destructive",
      });
      return;
    }
    joinEventMutation.mutate();
  };

  const eventDate = typeof event.date === 'string' ? parseISO(event.date) : event.date;
  const dayOfMonth = format(eventDate, "d");
  const month = format(eventDate, "MMM").toUpperCase();

  return (
    <Card className="hover:shadow-lg transition-shadow h-80 flex flex-col">
      <CardContent className="p-6 h-full flex flex-col">
        {/* Header with photo/date and title */}
        <div className="flex items-start gap-4 mb-4">
          {/* Event Photo or Date Block */}
          <div className="flex-shrink-0">
            {event.photo ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden">
                <img src={event.photo} alt={event.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white bg-gray-400 dark:bg-[#002145]">
                <span className="text-sm font-medium">{month}</span>
                <span className="text-lg font-bold">{dayOfMonth}</span>
              </div>
            )}
          </div>
          
          {/* Event Title */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2 line-clamp-2">{event.title}</h3>
          </div>
        </div>

        {/* Time, Location, and Attendance info */}
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span>{event.time}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span>{event.attendeeCount} {t("attendingCount")}</span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3 flex-1">{event.description}</p>
        )}
            
        {/* Action Button - Aligned to the right and at bottom */}
        {showJoinButton && (
          <div className="mt-auto flex justify-end">
            {isAuthenticated ? (
              (attendance as any)?.isAttending ? (
                <Button 
                  onClick={() => {
                    // Store chat room data in sessionStorage for retrieval
                    sessionStorage.setItem('openChatRoom', JSON.stringify({
                      type: 'event',
                      id: event.id,
                      name: event.title
                    }));
                    setLocation("/chat");
                    // Trigger custom event to notify navigation change
                    setTimeout(() => {
                      window.dispatchEvent(new Event('urlchange'));
                    }, 0);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t("chat")}
                </Button>
              ) : (
                <Button 
                  onClick={handleJoin}
                  disabled={joinEventMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {joinEventMutation.isPending ? t("waiting") : t("joinEvent")}
                </Button>
              )
            ) : (
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {t("connect")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
