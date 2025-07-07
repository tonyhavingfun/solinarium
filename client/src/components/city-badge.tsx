import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Navigation, Plus } from "lucide-react";
import { useCityContext } from "@/contexts/CityContext";
import { useToast } from "@/hooks/use-toast";

interface CityBadgeProps {
  className?: string;
}

export default function CityBadge({ className = "" }: CityBadgeProps) {
  const { selectedCities, setSelectedCities } = useCityContext();
  const { toast } = useToast();
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
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
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const city = data.results[0].components.city || 
                    data.results[0].components.town || 
                    data.results[0].components.village;
        if (city) {
          addCity(city);
        }
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

  return (
    <>
      <Badge 
        variant="outline" 
        className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm ${className}`}
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
    </>
  );
}