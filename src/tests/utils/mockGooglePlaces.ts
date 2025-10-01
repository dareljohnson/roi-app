// Reusable mock for Google Places AutocompleteService
// Use in tests that need deterministic autocomplete behavior
export function mockGooglePlaces(predictions: Array<{ description: string; place_id: string }> = []) {
  const serviceImpl = {
    getPlacePredictions: jest.fn((request: any, callback: any) => {
      // simulate async
      setTimeout(() => callback(predictions, 'OK'), 5);
    })
  };
  const mock = {
    maps: {
      places: {
        AutocompleteService: jest.fn(() => serviceImpl),
        PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' }
      }
    }
  };
  Object.defineProperty(window, 'google', { value: mock, writable: true });
  return serviceImpl;
}
