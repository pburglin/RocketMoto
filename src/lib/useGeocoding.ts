import { useState } from 'react';

type GeocodeResult = {
  lat: number;
  lon: number;
  display_name: string;
} | null;

export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getCoordinates(address: string): Promise<GeocodeResult> {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      const data = await response.json();
      if (data.length === 0) {
        throw new Error('No results found for this address');
      }

      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to geocode address');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { getCoordinates, loading, error };
}

export function useReverseGeocoding(coordinates: string | null) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getAddress() {
    if (!coordinates) {
      setAddress(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const [lat, lon] = coordinates.split(',').map(coord => coord.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      setAddress(data.display_name);
      return {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        display_name: data.display_name
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get address');
      setAddress(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { address, getAddress, loading, error };
}