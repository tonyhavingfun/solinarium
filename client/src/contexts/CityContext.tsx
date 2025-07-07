import React, { createContext, useContext, useState, useEffect } from 'react';

interface CityContextType {
  selectedCities: string[];
  setSelectedCities: (cities: string[]) => void;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCities, setSelectedCitiesState] = useState<string[]>([]);
  const [radiusKm, setRadiusKmState] = useState<number>(100);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCities = localStorage.getItem('solinarium-selected-cities');
    const savedRadius = localStorage.getItem('solinarium-radius-km');
    
    if (savedCities) {
      try {
        const cities = JSON.parse(savedCities);
        if (Array.isArray(cities)) {
          setSelectedCitiesState(cities);
        }
      } catch (e) {
        console.error('Error parsing saved cities:', e);
      }
    }
    
    if (savedRadius) {
      const radius = parseInt(savedRadius, 10);
      if (!isNaN(radius)) {
        setRadiusKmState(radius);
      }
    }
  }, []);

  // Save to localStorage when cities change
  const setSelectedCities = (cities: string[]) => {
    setSelectedCitiesState(cities);
    localStorage.setItem('solinarium-selected-cities', JSON.stringify(cities));
  };

  // Save to localStorage when radius changes
  const setRadiusKm = (radius: number) => {
    setRadiusKmState(radius);
    localStorage.setItem('solinarium-radius-km', radius.toString());
  };

  return (
    <CityContext.Provider value={{
      selectedCities,
      setSelectedCities,
      radiusKm,
      setRadiusKm
    }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCityContext() {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCityContext must be used within a CityProvider');
  }
  return context;
}