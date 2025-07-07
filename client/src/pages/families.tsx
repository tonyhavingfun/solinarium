import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import FamilyCard from "@/components/family-card";

export default function Families() {
  const [selectedCity, setSelectedCity] = useState<string>("all");

  const { data: families = [], isLoading } = useQuery<any[]>({
    queryKey: selectedCity === "all" ? ["/api/families"] : ["/api/families", { city: selectedCity }],
    retry: false,
  });

  // Extract unique cities for filter
  const cities = Array.from(new Set(families.map(family => family.city).filter(Boolean)));

  const filteredFamilies = selectedCity === "all" 
    ? families 
    : families.filter(family => family.city === selectedCity);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Connect with Families
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Discover families in your area and around the world
          </p>
          
          {/* City Filter */}
          <div className="max-w-xs mx-auto">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Loading families...</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredFamilies.length === 0 
                  ? "No families found" 
                  : `${filteredFamilies.length} ${filteredFamilies.length === 1 ? 'family' : 'families'} found`}
                {selectedCity !== "all" && ` in ${selectedCity}`}
              </p>
            </div>

            {/* Families Grid */}
            {filteredFamilies.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold text-black mb-2">No families found</h3>
                  <p className="text-gray-600">
                    {selectedCity === "all" 
                      ? "Be the first family to join Solinarium!" 
                      : `No families found in ${selectedCity}. Try selecting a different city.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFamilies.map((family) => (
                  <FamilyCard key={family.id} family={family} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}