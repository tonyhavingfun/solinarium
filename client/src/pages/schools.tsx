import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Users, Star, Heart, Phone, MessageCircle, Globe, Settings, Navigation, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useCityContext } from "@/contexts/CityContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { School, SchoolingMethod } from "@shared/schema";

export default function Schools() {
  const { t } = useTranslation();
  const { selectedCities, setSelectedCities, radiusKm, setRadiusKm } = useCityContext();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<number[]>([]);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [displayedSchools, setDisplayedSchools] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // City dialog state
  const [citySearch, setCitySearch] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Predefined cities for suggestions
  const predefinedCities = [
    "London", "New York", "Paris", "Tokyo", "Berlin", "Madrid", "Amsterdam", "Toronto", "Sydney", "São Paulo",
    "Barcelona", "Rome", "Vienna", "Prague", "Stockholm", "Copenhagen", "Oslo", "Helsinki", "Dublin", "Edinburgh",
    "Lisbon", "Athens", "Warsaw", "Budapest", "Zurich", "Geneva", "Brussels", "Luxembourg", "Monaco", "Andorra",
    "San Francisco", "Los Angeles", "Chicago", "Boston", "Seattle", "Miami", "Austin", "Denver", "Portland", "Vancouver"
  ];

  // Filter cities based on search
  const filteredCities = predefinedCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase()) &&
    !selectedCities.includes(city)
  ).slice(0, 5);

  // City helper functions
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
      
      if (response.ok) {
        const data = await response.json();
        const cityName = data.city || data.locality || data.principalSubdivision;
        
        if (cityName) {
          addCity(cityName);
        } else {
          toast({
            title: "Location found",
            description: "Could not determine city name from your location.",
            variant: "destructive",
            duration: 2000,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Location error",
        description: "Could not get your current location. Please enter manually.",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Fetch schooling methods
  const { data: methods = [], isLoading: methodsLoading } = useQuery({
    queryKey: ["/api/schooling-methods"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  }) as { data: SchoolingMethod[]; isLoading: boolean };

  // Fetch schools with filters
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ["/api/schools", selectedCities, selectedMethods],
    queryFn: () => {
      const params = new URLSearchParams();
      
      // Apply method filter if methods are selected
      if (selectedMethods.length > 0) {
        params.append("methods", selectedMethods.join(","));
      }
      
      // Apply city filter if cities are selected
      if (selectedCities.length > 0) {
        params.append("cities", selectedCities.join(","));
      }
      
      const url = `/api/schools?${params.toString()}`;
      return fetch(url).then(res => res.json());
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  }) as { data: School[]; isLoading: boolean };

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: (schoolId: number) => 
      apiRequest("POST", `/api/schools/${schoolId}/favorite`),
    onSuccess: () => {
      toast({ description: t("addToFavorites") });
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
    },
    onError: () => {
      toast({ 
        description: "Failed to add to favorites",
        variant: "destructive" 
      });
    },
  });

  // Filter schools based on search term
  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get schools to display with pagination
  const schoolsToDisplay = filteredSchools.slice(0, displayedSchools);
  const hasMoreSchools = filteredSchools.length > displayedSchools;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      setDisplayedSchools(prev => prev + 10);
      setIsLoadingMore(false);
    }, 500);
  };

  const toggleMethod = (methodId: number) => {
    setSelectedMethods(prev =>
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const clearFilters = () => {
    setSelectedMethods([]);
    setSearchTerm("");
    setDisplayedSchools(10);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedSchools(10);
  }, [searchTerm, selectedMethods, selectedCities]);

  return (
    <div className="max-w-4xl md:max-w-full mx-auto p-4 md:px-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black dark:text-white">{t("schools")}</h1>
          {/* City Badge */}
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
              : "All Cities"
            }
          </Badge>
        </div>
      </div>
      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t("searchSchools")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {isAuthenticated && filteredSchools.length > 0 && (
            <Button className="bg-orange-500 hover:bg-orange-600 px-4">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          )}
        </div>

        {/* Schooling Methods Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4" />
            <span className="font-medium">{t("schoolingMethods")}</span>
          </div>
          {methodsLoading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {methods.map((method) => (
                  <Badge
                    key={method.id}
                    variant={selectedMethods.includes(method.id) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    style={{
                      backgroundColor: selectedMethods.includes(method.id) ? method.color : undefined,
                      borderColor: method.color,
                      color: selectedMethods.includes(method.id) ? "white" : method.color,
                    }}
                    onClick={() => toggleMethod(method.id)}
                  >
                    {method.name}
                  </Badge>
                ))}
              </div>
              {selectedMethods.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {/* School Results */}
      {schoolsLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSchools.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <Users className="w-16 h-16 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-medium mb-2">{t("noSchoolsYet")}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("beFirstToAdd")}
                </p>
              </div>
              {isAuthenticated && (
                <Button>
                  {t("createSchool")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {schoolsToDisplay.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                methods={methods}
                onAddToFavorites={() => addToFavoritesMutation.mutate(school.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
            
            {/* Loading skeletons for "Load More" */}
            {isLoadingMore && (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          
          {/* Load More Button */}
          {hasMoreSchools && (
            <div className="flex justify-center mt-8">
              <Button 
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="px-8"
              >
                {isLoadingMore ? "Loading..." : `Load More (${filteredSchools.length - displayedSchools} remaining)`}
              </Button>
            </div>
          )}
          
          {/* Show in other cities link */}
          {selectedCities.length > 0 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setCityDialogOpen(true)}
                className="text-orange-500 hover:text-orange-600 text-sm font-medium"
              >
                {t("showInOtherCities")}
              </button>
            </div>
          )}
        </>
      )}
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
    </div>
  );
}

interface SchoolCardProps {
  school: School;
  methods: SchoolingMethod[];
  onAddToFavorites: () => void;
  isAuthenticated: boolean;
}

function SchoolCard({ school, methods, onAddToFavorites, isAuthenticated }: SchoolCardProps) {
  const { t } = useTranslation();

  // Get methods for this school (simplified for now)
  const schoolMethods = methods.slice(0, 2); // Mock data for now

  return (
    <Card className="h-80 flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1">
              <Link href={`/schools/${school.id}`}>
                <span className="hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer">
                  {school.name}
                </span>
              </Link>
            </CardTitle>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="w-3 h-3 mr-1" />
              {school.city}
            </div>
          </div>
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddToFavorites}
              className="p-1 h-8 w-8"
            >
              <Heart className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* School Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {school.shortDescription || school.description}
        </p>

        {/* Methods */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {schoolMethods.map((method) => (
              <Badge
                key={method.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: method.color, color: method.color }}
              >
                {method.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* School Info */}
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
          {school.ageRange && (
            <div>{t("ageRange")}: {school.ageRange}</div>
          )}
          {school.priceRange && (
            <div>{t("priceRange")}: {t(school.priceRange)}</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto">
          <Link href={`/schools/${school.id}`}>
            <Button className="w-full mb-2" size="sm">
              {t("schoolDetails")}
            </Button>
          </Link>
          
          <div className="grid grid-cols-2 gap-2">
            {school.phone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${school.phone}`)}
              >
                <Phone className="w-3 h-3 mr-1" />
                {t("callSchool")}
              </Button>
            )}
            {school.website && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(school.website, "_blank")}
              >
                <Globe className="w-3 h-3 mr-1" />
                {t("visitWebsite")}
              </Button>
            )}
            {school.whatsapp && (
              <Button
                variant="outline"
                size="sm"
                className={school.phone && school.website ? "col-span-2" : ""}
                onClick={() => window.open(`https://wa.me/${school.whatsapp.replace(/\D/g, '')}`)}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                {t("whatsapp")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}