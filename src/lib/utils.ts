// Generate a data URL for a random solid color image
export function generateRandomColorImage(): string {
  // Generate a random color in HSL to ensure good visibility
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 20); // 60-80%
  const lightness = 45 + Math.floor(Math.random() * 20); // 45-65%
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  
  // Get the context and draw the background
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/png');
}

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

// Format duration from "hh:mm:ss" to "Est. Xh Ym"
export function formatDuration(duration: string | null): string {
  if (!duration) return '';
  
  const [hours, minutes] = duration.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return '';
  
  if (hours === 0) {
    return `Est. ${minutes}m`;
  }
  
  return `Est. ${hours}h ${minutes}m`;
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