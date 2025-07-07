import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/contexts/ThemeContext";
import { useCityContext } from "@/contexts/CityContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, insertCommunitySchema, insertEventSchema, type InsertUser, type InsertCommunity, type InsertEvent, type Community, type Event } from "@shared/schema";
import { z } from "zod";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Camera, Settings, User, Globe, Shield, Moon, Sun, Monitor, LogOut, Trash2, Edit, Users, Calendar, ChevronDown, ChevronUp, Navigation, MapPin, Plus, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";

const profileSchema = insertUserSchema.pick({
  firstName: true,
  lastName: true,
  numKids: true,
  bio: true,
  maritalStatus: true,
});

const settingsSchema = z.object({
  language: z.enum(["en", "lt", "ru", "es"]),
  theme: z.enum(["light", "dark", "system"]),
  privacyLevel: z.enum(["public", "friends", "private"]),
});

type ProfileData = z.infer<typeof profileSchema>;
type SettingsData = z.infer<typeof settingsSchema>;
type CreateCommunityData = z.infer<typeof insertCommunitySchema>;
type CreateEventData = z.infer<typeof insertEventSchema>;

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { selectedCities, setSelectedCities } = useCityContext();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [communityDialogOpen, setCommunityDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Popular cities for autocomplete
  const popularCities = [
    "London", "Madrid", "Paris", "Berlin", "Tokyo", "New York City", "Sydney", 
    "Toronto", "São Paulo", "Amsterdam", "Barcelona", "Rome", "Vienna", "Munich",
    "Prague", "Warsaw", "Stockholm", "Copenhagen", "Helsinki", "Oslo", "Dublin",
    "Edinburgh", "Manchester", "Birmingham", "Brussels", "Zurich", "Geneva",
    "Milan", "Florence", "Venice", "Lisbon", "Porto", "Budapest", "Athens",
    "Istanbul", "Moscow", "St. Petersburg", "Kiev", "Riga", "Tallinn", "Vilnius"
  ];

  // Multi-city management functions (similar to CityBadge component)
  const filteredCities = popularCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase()) &&
    !selectedCities.includes(city)
  ).slice(0, 5);

  const addCity = (cityName: string) => {
    const trimmedCity = cityName.trim();
    if (trimmedCity && !selectedCities.includes(trimmedCity)) {
      setSelectedCities([...selectedCities, trimmedCity]);
      setCitySearch("");
      setShowCitySuggestions(false);
      toast({
        title: "City added",
        description: `${trimmedCity} has been added to your city list.`,
        duration: 2000,
      });
    }
  };

  const removeCity = (cityToRemove: string) => {
    setSelectedCities(selectedCities.filter(city => city !== cityToRemove));
    toast({
      title: "City removed",
      description: `${cityToRemove} has been removed from your city list.`,
      duration: 2000,
    });
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding to get city name
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      const city = data.city || data.locality || data.principalSubdivision;
      if (city) {
        addCity(city);
      } else {
        toast({
          title: "Location not found",
          description: "Could not determine your city from your location",
          variant: "destructive",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
      toast({
        title: "Location error",
        description: "Could not determine your location.",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle file selection for avatar
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert file to base64 for upload
  const uploadAvatar = async () => {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      avatarMutation.mutate(base64);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Queries for user's created communities and events
  const { data: userCommunities = [] } = useQuery<Community[]>({
    queryKey: ["/api/user/created-communities"],
  });

  const { data: userEvents = [] } = useQuery<Event[]>({
    queryKey: ["/api/user/created-events"],
  });

  // Check if profile is completed (use user's actual city data)
  const isProfileComplete = user?.firstName && user?.lastName && (user?.city || selectedCities.length > 0);

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      numKids: user?.numKids || 0,
      bio: user?.bio || "",
      maritalStatus: user?.maritalStatus || "single",
    },
  });

  // Initialize selected cities with user's city if available
  useEffect(() => {
    if (user?.city && selectedCities.length === 0) {
      setSelectedCities([user.city]);
    }
  }, [user?.city, selectedCities.length, setSelectedCities]);

  const settingsForm = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      language: (user?.language as "en" | "lt" | "ru" | "es") || "en",
      theme: (user?.theme as "light" | "dark" | "system") || "system",
      privacyLevel: (user?.privacyLevel as "public" | "friends" | "private") || "public",
    },
  });

  const communityForm = useForm<CreateCommunityData>({
    resolver: zodResolver(insertCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      city: selectedCities[0] || "",
    },
  });

  const eventForm = useForm<CreateEventData>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      city: selectedCities[0] || "",
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t("profileUpdated"),
        description: t("profileUpdated"),
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
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      await apiRequest("PUT", "/api/settings", data);
    },
    onSuccess: (_, variables) => {
      // Update theme context immediately
      if (variables.theme) {
        setTheme(variables.theme);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t("settingsUpdated"),
        description: t("settingsUpdated"),
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
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: CreateCommunityData) => {
      await apiRequest("POST", "/api/communities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/created-communities"] });
      setCommunityDialogOpen(false);
      communityForm.reset();
      toast({
        title: t("communityCreated"),
        description: t("communityCreated"),
        duration: 2000,
      });
    },
    onError: (error: Error) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/user/created-events"] });
      setEventDialogOpen(false);
      eventForm.reset();
      toast({
        title: t("eventCreated"),
        description: t("eventCreated"),
        duration: 2000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const onCommunitySubmit = (data: CreateCommunityData) => {
    createCommunityMutation.mutate({
      ...data,
      city: selectedCities[0] || data.city,
    });
  };

  const onEventSubmit = (data: CreateEventData) => {
    createEventMutation.mutate({
      ...data,
      city: selectedCities[0] || data.city,
    });
  };

  // Handle instant settings updates
  const handleLanguageChange = (language: string) => {
    const langValue = language as "en" | "lt" | "ru" | "es";
    settingsForm.setValue("language", langValue);
    settingsMutation.mutate({
      language: langValue,
      theme: settingsForm.getValues("theme"),
      privacyLevel: settingsForm.getValues("privacyLevel"),
    });
  };

  const handleThemeChange = (theme: string) => {
    const themeValue = theme as "light" | "dark" | "system";
    settingsForm.setValue("theme", themeValue);
    // Update theme immediately for better UX
    setTheme(themeValue);
    settingsMutation.mutate({
      language: settingsForm.getValues("language"),
      theme: themeValue,
      privacyLevel: settingsForm.getValues("privacyLevel"),
    });
  };

  const handlePrivacyChange = (privacyLevel: string) => {
    const privacyValue = privacyLevel as "public" | "friends" | "private";
    settingsForm.setValue("privacyLevel", privacyValue);
    settingsMutation.mutate({
      language: settingsForm.getValues("language"),
      theme: settingsForm.getValues("theme"),
      privacyLevel: privacyValue,
    });
  };

  const avatarMutation = useMutation({
    mutationFn: async (profileImageUrl: string) => {
      await apiRequest("PUT", "/api/profile/avatar", { profileImageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setAvatarDialogOpen(false);
      setAvatarUrl("");
      toast({
        title: t("avatarUpdated"),
        description: t("avatarUpdated"),
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
        description: "Failed to update avatar",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/account");
    },
    onSuccess: () => {
      toast({
        title: t("accountDeleted"),
        description: t("accountDeleted"),
      });
      window.location.href = "/";
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
        description: "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileData) => {
    profileMutation.mutate(data, {
      onSuccess: () => {
        setIsEditingProfile(false);
      },
    });
  };

  const onSettingsSubmit = (data: SettingsData) => {
    settingsMutation.mutate(data);
  };

  const handleAvatarSubmit = () => {
    if (avatarUrl.trim()) {
      avatarMutation.mutate(avatarUrl.trim());
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-black dark:text-white">{t("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-black dark:text-white">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with My Profile and Settings button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white">{t("myProfile")}</h1>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-3 h-3 mr-1" />
            {t("settings")}
          </Badge>
        </div>

        {/* Settings Section (Collapsible) */}
        {showSettings && (
          <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <Form {...settingsForm}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">{t("language")}</FormLabel>
                          <Select onValueChange={handleLanguageChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="lt">Lietuvių</SelectItem>
                              <SelectItem value="ru">Русский</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">{t("theme")}</FormLabel>
                          <Select onValueChange={handleThemeChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                              <SelectItem value="light">{t("light")}</SelectItem>
                              <SelectItem value="dark">{t("dark")}</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="privacyLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">{t("privacy")}</FormLabel>
                          <Select onValueChange={handlePrivacyChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                              <SelectItem value="public">{t("public")}</SelectItem>
                              <SelectItem value="friends">{t("friends")}</SelectItem>
                              <SelectItem value="private">{t("private")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleLogout}
                      className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("logout")}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("deleteAccount")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-black dark:text-white">{t("deleteAccount")}</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                            This action cannot be undone. Your account and all data will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Profile Section */}
        <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-black dark:text-white">Update Profile Picture</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* File input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-black dark:text-white">
                          Choose Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="block w-full text-sm text-black dark:text-white
                                   file:mr-4 file:py-2 file:px-4
                                   file:rounded-md file:border-0
                                   file:text-sm file:font-medium
                                   file:bg-orange-500 file:text-white
                                   hover:file:bg-orange-600
                                   file:cursor-pointer cursor-pointer"
                        />
                      </div>

                      {/* Preview */}
                      {previewUrl && (
                        <div className="flex justify-center">
                          <div className="relative">
                            <img
                              src={previewUrl}
                              alt="Avatar preview"
                              className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                            />
                          </div>
                        </div>
                      )}

                      {/* URL input as alternative */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-black dark:text-white">
                          Or enter image URL
                        </label>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={selectedFile ? uploadAvatar : () => avatarMutation.mutate(avatarUrl)}
                          disabled={(!selectedFile && !avatarUrl) || avatarMutation.isPending}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          {avatarMutation.isPending ? t("loading") : "Upload"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setAvatarDialogOpen(false);
                            setSelectedFile(null);
                            setPreviewUrl("");
                            setAvatarUrl("");
                          }}
                          className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedCities.length > 0 
                    ? selectedCities.length === 1 
                      ? selectedCities[0]
                      : `${selectedCities[0]} +${selectedCities.length - 1} more cities`
                    : "No cities selected"
                  }
                </p>
              </div>
            </div>

            {/* Profile Fields - Collapsible */}
            {isProfileComplete && !isEditingProfile ? (
              <div className="space-y-4">
                {user.bio && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t("bio")}</span>
                    <p className="text-black dark:text-white font-medium">{user.bio}</p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t("edit")}
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">{t("firstName")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("firstName")} 
                              {...field} 
                              value={field.value || ''}
                              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">{t("lastName")}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t("lastName")} 
                              {...field}
                              value={field.value || ''}
                              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Multi-City Selection */}
                  <div className="space-y-4">
                    <div>
                      <FormLabel className="text-black dark:text-white">{t("city")}</FormLabel>
                      <div className="mt-2">
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                          onClick={() => setCityDialogOpen(true)}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          {selectedCities.length > 0 
                            ? selectedCities.length === 1 
                              ? selectedCities[0]
                              : `${selectedCities[0]} +${selectedCities.length - 1}`
                            : "Add Cities"
                          }
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Select cities you're interested in to see relevant content
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="numKids"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">{t("kids")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder={t("kids")} 
                              {...field}
                              value={field.value || ''}
                              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white">{t("maritalStatus")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                            <SelectItem value="single">{t("single")}</SelectItem>
                            <SelectItem value="married">{t("married")}</SelectItem>
                            <SelectItem value="divorced">{t("divorced")}</SelectItem>
                            <SelectItem value="widowed">{t("widowed")}</SelectItem>
                            <SelectItem value="partnered">{t("partnered")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white">{t("bio")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("bio")} 
                            {...field}
                            value={field.value || ''}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={profileMutation.isPending}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {profileMutation.isPending ? t("loading") : "Save"}
                    </Button>
                    {isProfileComplete && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsEditingProfile(false)}
                        className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <Bell className="w-5 h-5" />
              {t("notifications")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">{t("noNewNotifications")}</p>
          </CardContent>
        </Card>

        {/* Friends Section */}
        <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <Users className="w-5 h-5" />
              {t("friendsList")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t("friendsComingSoon")}</p>
            <div className="flex justify-end">
              <Button 
                onClick={() => setLocation("/")}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {t("find")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Communities Section */}
        <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <Users className="w-5 h-5" />
              {t("myCommunities")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCommunities.map((community) => (
                  <div key={community.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-black dark:text-white">{community.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{community.city}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{community.memberCount} members</p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t("notCreatedCommunities")}</p>
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setCommunityDialogOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {t("create")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events Section */}
        <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <Calendar className="w-5 h-5" />
              {t("myEvents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userEvents.map((event) => (
                  <div key={event.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold text-black dark:text-white">{event.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{event.city}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t("notCreatedEvents")}</p>
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setEventDialogOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {t("create")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Multi-City Selection Dialog */}
      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">
              Select Cities
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* City Search Input */}
            <div>
              <label className="text-sm font-medium text-black dark:text-white mb-2 block">
                Add Cities
              </label>
              <div className="relative">
                <Input
                  placeholder="Search or type city name..."
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
                  Selected Cities ({selectedCities.length})
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedCities.map((city) => (
                    <Badge
                      key={city}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                      onClick={() => removeCity(city)}
                    >
                      {city}
                      <span className="ml-1 text-red-500">×</span>
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Click on a city to remove it
                </p>
              </div>
            )}

            {/* Dialog Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCityDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={() => setCityDialogOpen(false)} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Community Creation Dialog */}
      <Dialog open={communityDialogOpen} onOpenChange={setCommunityDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">{t("createNewCommunity")}</DialogTitle>
          </DialogHeader>
          <Form {...communityForm}>
            <form onSubmit={communityForm.handleSubmit(onCommunitySubmit)} className="space-y-4">
              <FormField
                control={communityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">{t("communityName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("communityName")}
                        {...field}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
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
                    <FormLabel className="text-black dark:text-white">{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("description")}
                        {...field}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
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
                    <FormLabel className="text-black dark:text-white">{t("city")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={selectedCities[0] || t("city")}
                        {...field}
                        value={selectedCities[0] || field.value}
                        disabled
                        className="bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCommunityDialogOpen(false)}
                  className="flex-1 border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createCommunityMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {createCommunityMutation.isPending ? t("loading") : t("create")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Event Creation Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">{t("createNewEvent")}</DialogTitle>
          </DialogHeader>
          <Form {...eventForm}>
            <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-4">
              <FormField
                control={eventForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">{t("eventTitle")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("eventTitle")}
                        {...field}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
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
                    <FormLabel className="text-black dark:text-white">{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("description")}
                        {...field}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={eventForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black dark:text-white">{t("date")}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={eventForm.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black dark:text-white">{t("time")}</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={eventForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">{t("location")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("location")}
                        {...field}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
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
                    <FormLabel className="text-black dark:text-white">{t("city")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={selectedCities[0] || t("city")}
                        {...field}
                        value={selectedCities[0] || field.value}
                        disabled
                        className="bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEventDialogOpen(false)}
                  className="flex-1 border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {createEventMutation.isPending ? t("loading") : t("create")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
