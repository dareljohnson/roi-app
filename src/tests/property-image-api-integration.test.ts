import '@testing-library/jest-dom';

describe('Property Image API Integration Test', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should test property-image API endpoint with real implementation', async () => {
    const mockAddress = '123 Main Street, Springfield, IL';
    
    // We need to test the actual API implementation
    // Let's import the API route handler directly
    const { POST } = await import('@/app/api/property-image/route');
    
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ address: mockAddress })
    } as any;
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    console.log('API Response:', data);
    
    // The response should contain an imageUrl
    expect(data).toHaveProperty('imageUrl');
    
    // If API key is available, should return a Street View URL
    // If not, should return placeholder
    if (process.env.GOOGLE_MAPS_API_KEY) {
      expect(data.imageUrl).toContain('maps.googleapis.com/maps/api/streetview');
    } else {
      expect(data.imageUrl).toContain('placeholder');
    }
  });

  it('should handle missing address in API request', async () => {
    const { POST } = await import('@/app/api/property-image/route');
    
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}) // No address provided
    } as any;
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    console.log('API Error Response:', data);
    
    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Address required');
  });

  it('should test getStreetViewImageUrl function directly', async () => {
    const { getStreetViewImageUrl } = await import('@/lib/getStreetViewImageUrl');
    
    const testAddress = '123 Main Street, Springfield, IL';
    const testApiKey = 'AIzaSyAeOwr0I19PqmRw5d5BDLfkwcgIofZ10hc'; // From env file
    
    const imageUrl = getStreetViewImageUrl(testAddress, testApiKey);
    
    console.log('Generated Street View URL:', imageUrl);
    
    if (testApiKey) {
      expect(imageUrl).toContain('https://maps.googleapis.com/maps/api/streetview');
      expect(imageUrl).toContain('location=123+Main+Street%2C+Springfield%2C+IL');
      expect(imageUrl).toContain('key=' + testApiKey);
      expect(imageUrl).toContain('size=400x300');
    } else {
      expect(imageUrl).toContain('placeholder');
    }
  });

  it('should test function with no API key', async () => {
    const { getStreetViewImageUrl } = await import('@/lib/getStreetViewImageUrl');
    
    const testAddress = '123 Main Street, Springfield, IL';
    const imageUrl = getStreetViewImageUrl(testAddress, undefined);
    
    console.log('URL with no API key:', imageUrl);
    
    expect(imageUrl).toBe('https://via.placeholder.com/400x300?text=No+Image+Found');
  });

  it('should test function with empty address', async () => {
    const { getStreetViewImageUrl } = await import('@/lib/getStreetViewImageUrl');
    
    const imageUrl = getStreetViewImageUrl('', 'some-api-key');
    
    console.log('URL with empty address:', imageUrl);
    
    expect(imageUrl).toBeNull();
  });
});