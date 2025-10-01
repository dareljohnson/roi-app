import '@testing-library/jest-dom';

describe('Environment Variable Test', () => {
  it('should check if Google Places API key is available', () => {
    console.log('NEXT_PUBLIC_GOOGLE_PLACES_API_KEY:', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // This test will help us verify if the environment variable is being loaded
    expect(process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY).toBeDefined();
  });
});