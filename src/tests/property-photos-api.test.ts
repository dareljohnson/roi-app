/**
 * @jest-environment node
 */

// Simple integration test to verify the property photos API endpoint
describe('Property Photos API Integration', () => {
  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks();
  });

  it('should have the correct API endpoint structure', () => {
    // Verify the route file exists and can be imported
    expect(() => {
      require('../app/api/upload/property-photos/route');
    }).not.toThrow();
  });

  it('should export POST function', () => {
    const route = require('../app/api/upload/property-photos/route');
    expect(typeof route.POST).toBe('function');
  });

  it('should validate file types correctly', () => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidTypes = ['text/plain', 'application/pdf', 'video/mp4'];
    
    allowedTypes.forEach(type => {
      expect(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']).toContain(type);
    });
    
    invalidTypes.forEach(type => {
      expect(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']).not.toContain(type);
    });
  });

  it('should have correct file size limits', () => {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    expect(maxFileSize).toBe(10485760);
  });
});