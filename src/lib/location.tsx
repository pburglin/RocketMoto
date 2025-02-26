import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

type Coordinates = {
  lat: number;
  lng: number;
};

type LocationContextType = {
  currentLocation: Coordinates | null;
  getCurrentLocation: () => Promise<void>;
  setManualLocation: (lat: number, lng: number) => Promise<void>;
  loading: boolean;
  error: string | null;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!currentLocation && !loading) {
      getCurrentLocation();
    }
  }, [currentLocation, loading]);

  async function getCurrentLocation(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setCurrentLocation(coordinates);

      // Update user's location in the database if logged in
      if (user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            location: `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user location:', updateError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  }

  async function setManualLocation(lat: number, lng: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const coordinates = { lat, lng };
      setCurrentLocation(coordinates);

      // Update user's location in the database if logged in
      if (user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            location: `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user location:', updateError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set manual location');
    } finally {
      setLoading(false);
    }
  }

  const value = {
    currentLocation,
    getCurrentLocation,
    setManualLocation,
    loading,
    error
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}