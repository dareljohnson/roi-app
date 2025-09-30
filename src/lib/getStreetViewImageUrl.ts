import { NextResponse } from 'next/server';

export function getStreetViewImageUrl(address: string, apiKey: string | undefined) {
  if (!address) return null;
  if (!apiKey) return 'https://via.placeholder.com/400x300?text=No+Image+Found';
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
