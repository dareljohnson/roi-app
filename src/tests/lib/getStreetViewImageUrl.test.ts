import { getStreetViewImageUrl } from '@/lib/getStreetViewImageUrl';

describe('getStreetViewImageUrl', () => {
  it('returns a valid Google Street View URL when address and apiKey are provided', () => {
    const url = getStreetViewImageUrl('123 Main St, City, State', 'FAKE_KEY');
    expect(url).toMatch(/^https:\/\/maps\.googleapis\.com\/maps\/api\/streetview/);
    expect(url).toContain('location=123+Main+St%2C+City%2C+State');
    expect(url).toContain('key=FAKE_KEY');
  });

  it('returns placeholder if apiKey is missing', () => {
    const url = getStreetViewImageUrl('123 Main St, City, State', undefined);
    expect(url).toBe('https://via.placeholder.com/400x300?text=No+Image+Found');
  });

  it('returns null if address is missing', () => {
    const url = getStreetViewImageUrl('', 'FAKE_KEY');
    expect(url).toBeNull();
  });
});
