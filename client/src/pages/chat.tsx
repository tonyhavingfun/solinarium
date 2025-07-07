import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useCityContext } from "@/contexts/CityContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, MapPin, Calendar, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import CityBadge from "@/components/city-badge";
import ChatRoom from "@/components/chat-room";
import type { Community, Event, Friend, User } from "@shared/schema";

export default function Chat() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const { selectedCities } = useCityContext();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("people");
  const [activeChatRoom, setActiveChatRoom] = useState<{
    type: "community" | "event" | "city" | "user";
    id: number | string;
    name: string;
  } | null>(null);

  // Update URL when entering/leaving chat rooms
  const updateChatRoom = (room: typeof activeChatRoom) => {
    setActiveChatRoom(room);
    if (room) {
      setLocation(`/chat?chat=${room.type}-${room.id}`);
    } else {
      setLocation('/chat');
    }
    // Trigger custom event to notify navigation change
    setTimeout(() => {
      window.dispatchEvent(new Event('urlchange'));
    }, 0);
  };

  // Get user's joined communities and events
  const { data: userCommunities = [] } = useQuery<Community[]>({
    queryKey: ["/api/user/communities"],
    enabled: isAuthenticated,
  });

  const { data: userEvents = [] } = useQuery<Event[]>({
    queryKey: ["/api/user/events"],
    enabled: isAuthenticated,
  });

  // Get user's friends (connected families) - temporarily disabled
  const userFriends: any[] = [];

  // Check if profile is complete
  const isProfileComplete = user?.firstName && user?.lastName && (user?.city || selectedCities.length > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-black dark:text-white">{t("loading")}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <MessageCircle className="w-16 h-16 text-orange-500 mx-auto" />
          <h1 className="text-2xl font-bold text-black dark:text-white">{t("chat")}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access chat features and connect with your community.
          </p>
          <Button 
            asChild
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Link href="/api/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto" />
          <h1 className="text-2xl font-bold text-black dark:text-white">Complete Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please complete your profile with your name and city before accessing chat features.
          </p>
          <Button 
            asChild
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Link href="/profile">Complete Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Filter joined communities and events by selected cities
  const selectedCitiesSet = selectedCities.length > 0 ? new Set(selectedCities) : null;
  const filteredCommunities = selectedCitiesSet 
    ? userCommunities.filter(c => selectedCitiesSet.has(c.city))
    : userCommunities;
  const filteredEvents = selectedCitiesSet 
    ? userEvents.filter(e => selectedCitiesSet.has(e.city))
    : userEvents;
  

  
  // Get connected families (friends)
  const connectedFamilies = userFriends.map(f => f.friend);
  
  // Get unique cities for city chats from selected cities
  const availableCities = selectedCities.length > 0 ? selectedCities : [];

  // Check for chat room to open from sessionStorage
  useEffect(() => {
    const chatRoomData = sessionStorage.getItem('openChatRoom');
    if (chatRoomData) {
      try {
        const parsedData = JSON.parse(chatRoomData);
        updateChatRoom(parsedData);
        sessionStorage.removeItem('openChatRoom'); // Clear after use
      } catch (error) {
        console.error('Error parsing chat room data:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        {/* Show chat room if one is active */}
        {activeChatRoom ? (
          <ChatRoom 
            type={activeChatRoom.type}
            id={activeChatRoom.id}
            name={activeChatRoom.name}
            onBack={() => updateChatRoom(null)}
          />
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-black dark:text-white">{t("chat")}</h1>
                {/* City Badge */}
                <CityBadge />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex w-full">
            <TabsTrigger value="people">
              {t("people")}
            </TabsTrigger>
            <TabsTrigger value="cities">
              {t("cities")}
            </TabsTrigger>
            <TabsTrigger value="communities">
              {t("communities")}
            </TabsTrigger>
            <TabsTrigger value="events">
              {t("events")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people">
            <div className="space-y-4">
              {connectedFamilies.length > 0 ? (
                connectedFamilies.map((family) => (
                  <Card key={family.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-black dark:text-white">
                            {family.firstName} {family.lastName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {family.city}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => updateChatRoom({
                          type: "user",
                          id: family.id,
                          name: `${family.firstName} ${family.lastName}`
                        })}
                      >
                        Chat
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-black dark:text-white">{t("connectedFamilies")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {t("notConnectedYet")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cities">
            <div className="space-y-4">
              {availableCities.map((city) => (
                <Card key={city} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                          <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-black dark:text-white">{city} Community</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Chat with families in {city}
                          </p>
                        </div>
                      </div>
                      {city === user?.city && (
                        <Badge variant="secondary">Your City</Badge>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => updateChatRoom({
                          type: "city",
                          id: city,
                          name: `${city} Community`
                        })}
                      >
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="communities">
            <div className="space-y-4">
              {filteredCommunities.length > 0 ? (
                filteredCommunities.map((community) => (
                  <Card key={community.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                          <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-black dark:text-white">{community.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {community.description || `Community chat for ${community.city}`}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Users className="w-3 h-3 mr-1" />
                            {community.memberCount || 0} members
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => updateChatRoom({
                          type: "community",
                          id: community.id,
                          name: community.name
                        })}
                      >
                        Chat
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-black dark:text-white mb-2">No Community Chats</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Join communities in your city to access their chat rooms.
                    </p>
                    <Button asChild className="bg-orange-500 hover:bg-orange-600">
                      <Link href="/">Browse Communities</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <Card key={`${event.id}-${index}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-black dark:text-white">{event.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event.description}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => updateChatRoom({
                          type: "event",
                          id: event.id,
                          name: event.title
                        })}
                      >
                        Chat
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-black dark:text-white mb-2">No Event Chats</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Join events in your city to access their chat rooms.
                    </p>
                    <Button asChild className="bg-orange-500 hover:bg-orange-600">
                      <Link href="/">Browse Events</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>
    </div>
  );
}