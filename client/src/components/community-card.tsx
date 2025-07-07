import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useCityContext } from "@/contexts/CityContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { Community } from "@shared/schema";

interface CommunityCardProps {
  community: Community;
}

export default function CommunityCard({ community }: CommunityCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { selectedCities } = useCityContext();
  const { t } = useTranslation();
  
  // Check if profile is complete - name is required, city from context or user profile
  const hasName = user?.firstName && user?.lastName;
  const hasCity = selectedCities.length > 0 || user?.city;
  const isProfileComplete = hasName && hasCity;

  const { data: membership } = useQuery({
    queryKey: [`/api/communities/${community.id}/membership`],
    enabled: isAuthenticated,
    retry: false,
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/communities/${community.id}/join`);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: `Joined ${community.name} successfully!`,
      });
      // Invalidate queries and refetch immediately to update button state
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${community.id}/membership`] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      // Refetch to immediately update the UI
      queryClient.refetchQueries({ queryKey: [`/api/communities/${community.id}/membership`] });
      
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
        description: "Failed to join community. Please try again.",
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
        description: `Please add your ${missing.join(" and ")} in Profile settings before joining communities`,
        variant: "destructive",
      });
      return;
    }
    joinCommunityMutation.mutate();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-80 flex flex-col">
      <CardContent className="pt-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
            {community.logo ? (
              <img src={community.logo} alt={community.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Users className="w-6 h-6 text-orange-500" />
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{community.memberCount} {t("members")}</p>
            <p className="text-xs text-gray-500">{community.city}</p>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-black mb-2">{community.name}</h3>
        
        {community.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{community.description}</p>
        )}
        
        <div className="flex gap-2 mt-auto">
          {isAuthenticated ? (
            (membership as any)?.isMember ? (
              <Button 
                onClick={() => {
                  // Store chat room data in sessionStorage for retrieval
                  sessionStorage.setItem('openChatRoom', JSON.stringify({
                    type: 'community',
                    id: community.id,
                    name: community.name
                  }));
                  setLocation("/chat");
                  // Trigger custom event to notify navigation change
                  setTimeout(() => {
                    window.dispatchEvent(new Event('urlchange'));
                  }, 0);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {t("chat")}
              </Button>
            ) : (
              <Button 
                onClick={handleJoin} 
                disabled={joinCommunityMutation.isPending}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {joinCommunityMutation.isPending ? t("waiting") : t("join")}
              </Button>
            )
          ) : (
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {t("connect")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
