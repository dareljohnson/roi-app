import { NextRequest, NextResponse } from 'next/server';
import { getStreetViewImageUrl } from '@/lib/getStreetViewImageUrl';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }
  const imageUrl = getStreetViewImageUrl(address, GOOGLE_MAPS_API_KEY);
  return NextResponse.json({ imageUrl });
}
