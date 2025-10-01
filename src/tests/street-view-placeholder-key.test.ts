import { getStreetViewImageUrl } from '@/lib/getStreetViewImageUrl';

describe('getStreetViewImageUrl placeholder key handling', () => {
  test('returns placeholder image when placeholder key provided', () => {
    const url = getStreetViewImageUrl('4040 Savannah Ridge Trce', 'YOUR_GOOGLE_MAPS_API_KEY');
    expect(url).toBe('https://via.placeholder.com/400x300?text=No+Image+Found');
  });
  test('returns street view URL when real key provided', () => {
    const url = getStreetViewImageUrl('4040 Savannah Ridge Trce', 'real-key-123');
    expect(url).toContain('https://maps.googleapis.com/maps/api/streetview?');
    expect(url).toContain('location=4040+Savannah+Ridge+Trce');
    expect(url).toContain('key=real-key-123');
  });
  test('returns null when address empty even if key present', () => {
    const url = getStreetViewImageUrl('', 'real-key-123');
    expect(url).toBeNull();
  });
});
