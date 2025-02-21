// Convert kilometers to miles
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

// Convert miles to kilometers
export function milesToKm(miles: number): number {
  return miles / 0.621371;
}

// Format distance based on user preference
export function formatDistance(kilometers: number, unit: 'km' | 'mi'): string {
  if (unit === 'mi') {
    const miles = kmToMiles(kilometers);
    return `${miles.toFixed(1)} mi`;
  }
  return `${kilometers.toFixed(1)} km`;
}