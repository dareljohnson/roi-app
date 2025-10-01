import { NextResponse } from 'next/server';

// Generates a Google Street View image URL. Gracefully degrades to a placeholder image
// when the API key is missing or a known placeholder value is supplied.
// Returns null if address is empty (caller can decide to skip image logic entirely).
export function getStreetViewImageUrl(address: string, apiKey: string | undefined) {
  if (!address) return null;
  const placeholderPatterns = [
    'YOUR_GOOGLE_MAPS_API_KEY',
    'YOUR_GOOGLE_API_KEY',
    'REPLACE_WITH_GOOGLE_MAPS_KEY'
  ];
  if (!apiKey || placeholderPatterns.includes(apiKey.trim())) {
    return 'https://via.placeholder.com/400x300?text=No+Image+Found';
  }
  const params = new URLSearchParams({
    size: '400x300',
    location: address,
    key: apiKey,
    fov: '80',
    pitch: '0',
    source: 'outdoor',
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}
