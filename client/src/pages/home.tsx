import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/contexts/CityContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertCommunitySchema,
  insertEventSchema,
  type Community,
  type Event,
  type User,
  type InsertCommunity,
  type InsertEvent,
} from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Users,
  MapPin,
  Calendar,
  Plus,
  Heart,
  Navigation,
  X,
  Settings,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import CommunityCard from "@/components/community-card";
import EventCard from "@/components/event-card";
import FamilyCard from "@/components/family-card";
import CityBadge from "@/components/city-badge";

type CreateCommunityData = typeof insertCommunitySchema._output;
type CreateEventData = typeof insertEventSchema._output;

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedCities, setSelectedCities, radiusKm, setRadiusKm } = useCityContext();
  const [activeTab, setActiveTab] = useState("all");
  const [communityDialogOpen, setCommunityDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [radiusKmStr, setRadiusKmStr] = useState(radiusKm.toString());
  
  // Sync radiusKmStr with context
  useEffect(() => {
    setRadiusKmStr(radiusKm.toString());
  }, [radiusKm]);
  const [citySearch, setCitySearch] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Popular cities for autocomplete
  const popularCities = [
    "London",
    "Madrid",
    "Paris",
    "Berlin",
    "Tokyo",
    "New York",
    "Sydney",
    "Toronto",
    "São Paulo",
    "Amsterdam",
    "Barcelona",
    "Rome",
    "Vienna",
    "Munich",
    "Prague",
    "Warsaw",
    "Stockholm",
    "Copenhagen",
    "Helsinki",
    "Oslo",
    "Dublin",
    "Edinburgh",
    "Manchester",
    "Birmingham",
    "Brussels",
    "Zurich",
    "Geneva",
    "Milan",
    "Florence",
    "Venice",
    "Lisbon",
    "Porto",
    "Budapest",
    "Athens",
    "Istanbul",
    "Moscow",
    "St. Petersburg",
    "Kiev",
    "Riga",
    "Tallinn",
    "Vilnius",
  ];

  // Initialize selected cities with user's city
  useEffect(() => {
    if (user?.city && selectedCities.length === 0) {
      setSelectedCities([user.city]);
    }
  }, [user?.city, selectedCities.length]);

  // Get current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`,
          );
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const city =
              data.results[0].components.city ||
              data.results[0].components.town ||
              data.results[0].components.village;
            if (city) {
              setCitySearch(city);
              if (!selectedCities.includes(city)) {
                setSelectedCities([...selectedCities, city]);
              }
            }
          }
        } catch (error) {
          console.error("Error getting city from coordinates:", error);
          toast({
            title: "Location Error",
            description: "Could not determine city from your location",
            variant: "destructive",
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Location Error",
          description:
            "Could not access your location. Please enter city manually.",
          variant: "destructive",
        });
        setIsGettingLocation(false);
      },
    );
  };

  // Filter cities based on search input
  const filteredCities = popularCities
    .filter(
      (city) =>
        city.toLowerCase().includes(citySearch.toLowerCase()) &&
        !selectedCities.includes(city),
    )
    .slice(0, 8);

  // Add city to selected cities
  const addCity = (city: string) => {
    if (!selectedCities.includes(city)) {
      setSelectedCities([...selectedCities, city]);
    }
    setCitySearch("");
    setShowCitySuggestions(false);
  };

  // Remove city from selected cities
  const removeCity = (cityToRemove: string) => {
    setSelectedCities(selectedCities.filter((city) => city !== cityToRemove));
  };

  const { data: communities = [] } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: families = [] } = useQuery<User[]>({
    queryKey: ["/api/families"],
  });

  const communityForm = useForm<CreateCommunityData>({
    resolver: zodResolver(insertCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      logo: "",
      city: user?.city || "",
    },
  });

  const eventForm = useForm<CreateEventData>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      photo: "",
      city: user?.city || "",
      date: new Date(),
      time: "",
      location: "",
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: CreateCommunityData) => {
      await apiRequest("POST", "/api/communities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      setCommunityDialogOpen(false);
      communityForm.reset();
      toast({
        title: t("communityCreated"),
        description: t("communityCreated"),
      });
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
        description: "Failed to create community",
        variant: "destructive",
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventData) => {
      await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEventDialogOpen(false);
      eventForm.reset();
      toast({
        title: t("eventCreated"),
        description: t("eventCreated"),
      });
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
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const onCommunitySubmit = (data: CreateCommunityData) => {
    createCommunityMutation.mutate(data);
  };

  const onEventSubmit = (data: CreateEventData) => {
    createEventMutation.mutate(data);
  };

  // Filter data by selected cities if any, otherwise show all
  const userCommunities =
    selectedCities.length > 0
      ? communities.filter((c) => selectedCities.includes(c.city))
      : communities;
  const userEvents =
    selectedCities.length > 0
      ? events.filter((e) => selectedCities.includes(e.city))
      : events;
  const userFamilies = (
    selectedCities.length > 0
      ? families.filter((f) => f.city && selectedCities.includes(f.city))
      : families
  ).filter((f) => f.id !== user?.id); // Exclude current user from families list

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl md:max-w-full mx-auto p-4 md:px-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Solinarium
            </h1>

            {/* City Badge */}
            <CityBadge />
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="inline-flex w-full">
            <TabsTrigger value="all">
              {t("all")}
            </TabsTrigger>
            <TabsTrigger value="families">
              {t("families")}
            </TabsTrigger>
            <TabsTrigger value="communities">
              {t("communities")}
            </TabsTrigger>
            <TabsTrigger value="events">
              {t("events")}
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all">
            <div className="space-y-8">
              {/* Families Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-black dark:text-white">
                    {t("families")}
                  </h2>
                  {userFamilies.length > 6 && (
                    <button 
                      onClick={() => setActiveTab("families")}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium flex items-center gap-1"
                    >
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto md:overflow-visible">
                  <div className="flex space-x-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-x-0 md:pb-0" style={{ minWidth: 'max-content' }}>
                    {userFamilies.slice(0, 6).map((family) => (
                      <div key={family.id} className="flex-shrink-0 w-80 md:w-auto">
                        <FamilyCard family={family} />
                      </div>
                    ))}
                    {userFamilies.length === 0 && (
                      <Card className="flex-shrink-0 w-80 md:w-auto">
                        <CardContent className="p-8 text-center">
                          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="font-semibold text-black dark:text-white mb-2">
                            No families found
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {isAuthenticated
                              ? selectedCities.length > 0
                                ? `No families found in ${selectedCities.join(", ")}`
                                : "No families found"
                              : "Login to discover families in your area"}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Communities Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-black dark:text-white">
                    {t("communities")}
                  </h2>
                  {userCommunities.length > 6 && (
                    <button 
                      onClick={() => setActiveTab("communities")}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium flex items-center gap-1"
                    >
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto md:overflow-visible">
                  <div className="flex space-x-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:space-x-0 md:pb-0" style={{ minWidth: 'max-content' }}>
                    {userCommunities.slice(0, 6).map((community) => (
                      <div key={community.id} className="flex-shrink-0 w-80 md:w-auto">
                        <CommunityCard community={community} />
                      </div>
                    ))}
                    {userCommunities.length === 0 && (
                      <Card className="flex-shrink-0 w-80">
                        <CardContent className="p-8 text-center">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="font-semibold text-black dark:text-white mb-2">
                            No communities found
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            {isAuthenticated
                              ? selectedCities.length > 0
                                ? `Be the first to create a community in ${selectedCities.join(", ")}!`
                                : "Be the first to create a community and start connecting families."
                              : "Login to discover communities in your area"}
                          </p>
                          {isAuthenticated && (
                            <Dialog
                              open={communityDialogOpen}
                              onOpenChange={setCommunityDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button className="bg-orange-500 hover:bg-orange-600">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t("createNewCommunity")}</DialogTitle>
                                </DialogHeader>
                                <Form {...communityForm}>
                                  <form
                                    onSubmit={communityForm.handleSubmit(
                                      onCommunitySubmit,
                                    )}
                                    className="space-y-4"
                                  >
                                    <FormField
                                      control={communityForm.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Community Name</FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="Enter community name"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={communityForm.control}
                                      name="description"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Description</FormLabel>
                                          <FormControl>
                                            <Textarea
                                              placeholder="Describe your community"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={communityForm.control}
                                      name="city"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>City</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Enter city" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <Button
                                      type="submit"
                                      disabled={createCommunityMutation.isPending}
                                      className="w-full bg-orange-500 hover:bg-orange-600"
                                    >
                                      {createCommunityMutation.isPending
                                        ? t("loading")
                                        : t("create")}
                                    </Button>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Events Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-black dark:text-white">
                    {t("events")}
                  </h2>
                  {userEvents.length > 6 && (
                    <button 
                      onClick={() => setActiveTab("events")}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium flex items-center gap-1"
                    >
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto md:overflow-visible">
                  <div className="flex space-x-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:space-x-0 md:pb-0" style={{ minWidth: 'max-content' }}>
                    {userEvents.slice(0, 6).map((event) => (
                      <div key={event.id} className="flex-shrink-0 w-80 md:w-auto">
                        <EventCard event={event} showJoinButton={isAuthenticated} />
                      </div>
                    ))}
                    {userEvents.length === 0 && (
                      <Card className="flex-shrink-0 w-80 md:w-auto">
                        <CardContent className="p-8 text-center">
                          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="font-semibold text-black dark:text-white mb-2">
                            No events found
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            {isAuthenticated
                              ? selectedCities.length > 0
                                ? `Be the first to organize an event in ${selectedCities.join(", ")}!`
                                : "Be the first to organize an event and bring families together."
                              : "Login to discover events in your area"}
                          </p>
                          {isAuthenticated && (
                            <Dialog
                              open={eventDialogOpen}
                              onOpenChange={setEventDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button className="bg-orange-500 hover:bg-orange-600">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t("createNewEvent")}</DialogTitle>
                                </DialogHeader>
                                <Form {...eventForm}>
                                  <form
                                    onSubmit={eventForm.handleSubmit(onEventSubmit)}
                                    className="space-y-4"
                                  >
                                    <FormField
                                      control={eventForm.control}
                                      name="title"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Event Title</FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="Enter event title"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={eventForm.control}
                                      name="description"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Description</FormLabel>
                                          <FormControl>
                                            <Textarea
                                              placeholder="Describe your event"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={eventForm.control}
                                      name="date"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Date</FormLabel>
                                          <FormControl>
                                            <Input type="datetime-local" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={eventForm.control}
                                      name="location"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Location</FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="Enter location"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={eventForm.control}
                                      name="city"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>City</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Enter city" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <Button
                                      type="submit"
                                      disabled={createEventMutation.isPending}
                                      className="w-full bg-orange-500 hover:bg-orange-600"
                                    >
                                      {createEventMutation.isPending
                                        ? t("loading")
                                        : t("create")}
                                    </Button>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Families Tab */}
          <TabsContent value="families">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  Families
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userFamilies.map((family) => (
                  <FamilyCard key={family.id} family={family} />
                ))}
              </div>

              {userFamilies.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-black dark:text-white mb-2">
                      Be the first family here!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isAuthenticated
                        ? "Start building your local homeschool community."
                        : "Join to connect with families in your area."}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Show in other cities link */}
              {selectedCities.length > 0 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setCityDialogOpen(true)}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium underline decoration-dotted underline-offset-4"
                  >
                    {t("showInOtherCities")}
                  </button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Communities Tab */}
          <TabsContent value="communities">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  Communities
                </h2>
                <div className="flex gap-2">
                  {isAuthenticated && (
                    <Dialog
                      open={communityDialogOpen}
                      onOpenChange={setCommunityDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Create
                        </Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("createNewCommunity")}</DialogTitle>
                      </DialogHeader>
                      <Form {...communityForm}>
                        <form
                          onSubmit={communityForm.handleSubmit(
                            onCommunitySubmit,
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={communityForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Community Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter community name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={communityForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe your community"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={communityForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter city" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            disabled={createCommunityMutation.isPending}
                            className="w-full bg-orange-500 hover:bg-orange-600"
                          >
                            {createCommunityMutation.isPending
                              ? t("loading")
                              : t("create")}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userCommunities.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>

              {userCommunities.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-black dark:text-white mb-2">
                      Be the first to create a community!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isAuthenticated
                        ? "Start a homeschool community and connect local families."
                        : "Join to see and create communities in your area."}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Show in other cities link */}
              {selectedCities.length > 0 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setCityDialogOpen(true)}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium underline decoration-dotted underline-offset-4"
                  >
                    {t("showInOtherCities")}
                  </button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  Events
                </h2>
                <div className="flex gap-2">
                  {isAuthenticated && (
                  <Dialog
                    open={eventDialogOpen}
                    onOpenChange={setEventDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("createNewEvent")}</DialogTitle>
                      </DialogHeader>
                      <Form {...eventForm}>
                        <form
                          onSubmit={eventForm.handleSubmit(onEventSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={eventForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter event title"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={eventForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe your event"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={eventForm.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={eventForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter location"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={eventForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter city" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            disabled={createEventMutation.isPending}
                            className="w-full bg-orange-500 hover:bg-orange-600"
                          >
                            {createEventMutation.isPending
                              ? t("loading")
                              : t("create")}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    showJoinButton={isAuthenticated}
                  />
                ))}
              </div>

              {userEvents.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-black dark:text-white mb-2">
                      Be the first to create an event!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isAuthenticated
                        ? "Organize a homeschool meetup, field trip, or activity."
                        : "Join to see and create events in your area."}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Show in other cities link */}
              {selectedCities.length > 0 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setCityDialogOpen(true)}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium underline decoration-dotted underline-offset-4"
                  >
                    {t("showInOtherCities")}
                  </button>
                </div>
              )}
            </div>
          </TabsContent>


        </Tabs>

        {/* City Selection Dialog */}
        <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">
                Choose Your Cities
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Radius Selection */}
              <div>
                <label className="text-sm font-medium text-black dark:text-white mb-2 block">
                  Search Radius
                </label>
                <Select value={radiusKm.toString()} onValueChange={(value) => setRadiusKm(parseInt(value, 10))}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="20">20 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                    <SelectItem value="100">100 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City Search */}
              <div className="relative">
                <label className="text-sm font-medium text-black dark:text-white mb-2 block">
                  Add Cities
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search for a city or type any city name..."
                    value={citySearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCitySearch(value);
                      setShowCitySuggestions(value.length > 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && citySearch.trim()) {
                        e.preventDefault();
                        addCity(citySearch.trim());
                      }
                    }}
                    onFocus={() =>
                      setShowCitySuggestions(citySearch.length > 0)
                    }
                    onBlur={() => {
                      setTimeout(() => setShowCitySuggestions(false), 200);
                    }}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white pr-10"
                  />
                  <Button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isGettingLocation ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                  </Button>

                  {/* City suggestions dropdown */}
                  {showCitySuggestions && citySearch.trim() && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {/* Show matching cities from predefined list */}
                      {filteredCities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => addCity(city)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-black dark:text-white text-sm flex items-center gap-2"
                        >
                          <MapPin className="w-3 h-3 text-orange-500" />
                          {city}
                        </button>
                      ))}

                      {/* Always show option to add current search as custom city */}
                      {citySearch.trim() &&
                        !selectedCities.includes(citySearch.trim()) && (
                          <button
                            key="custom"
                            type="button"
                            onClick={() => addCity(citySearch.trim())}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-black dark:text-white text-sm flex items-center gap-2 border-t border-gray-200 dark:border-gray-600"
                          >
                            <Plus className="w-3 h-3 text-orange-500" />
                            Add "{citySearch.trim()}" as custom city
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Cities */}
              {selectedCities.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-black dark:text-white mb-2 block">
                    Selected Cities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCities.map((city) => (
                      <Badge
                        key={city}
                        variant="secondary"
                        className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        {city}
                        <X
                          className="w-3 h-3 ml-1 hover:text-red-500 cursor-pointer"
                          onClick={() => removeCity(city)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCityDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setCityDialogOpen(false)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
