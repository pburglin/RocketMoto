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

// Format date in a relative, human-friendly way
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}