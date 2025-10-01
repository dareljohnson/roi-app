import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';

describe('User Experience Diagnostic - Address Search and Photo Features', () => {
  let mockFetch: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Spy on console to catch any errors
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'AIzaSyAeOwr0I19PqmRw5d5BDLfkwcgIofZ10hc';
  });

  afterEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    delete (window as any).google;
  });

  it('should diagnose what happens when Google Maps API is NOT available (real-world scenario)', async () => {
    // Don't set up Google Maps mock - simulate real-world failure
    
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // User types an address
    fireEvent.change(addressInput, { target: { value: '123 Main Street' } });
    
    // Wait to see if any autocomplete appears
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if autocomplete suggestions appear
    const hasSuggestions = screen.queryByText(/Main Street.*USA/i);
    console.log('🔍 Autocomplete suggestions found:', !!hasSuggestions);
    
    if (!hasSuggestions) {
      console.log('❌ ISSUE FOUND: No autocomplete suggestions when Google Maps API unavailable');
    }
    
    // Now test image fetching with manual address entry
    fireEvent.change(addressInput, { target: { value: '123 Main Street, Springfield, IL 62701' } });
    
    // Mock successful image response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+Street&key=test-key'
      })
    });
    
    fireEvent.blur(addressInput);
    
    // Wait for potential image
    await waitFor(() => {
      const img = screen.queryByAltText('Property front');
      console.log('🖼️ Property image found:', !!img);
      if (img) {
        console.log('✅ Image URL:', img.getAttribute('src'));
      }
    }, { timeout: 2000 });
    
    // Check for any console errors
    console.log('🐛 Console errors during test:', consoleErrorSpy.mock.calls.length);
  });

  it('should test with Google Maps API available but slow/failing', async () => {
    // Set up Google Maps mock that simulates slow/failing API
    const mockGoogleMaps = {
      maps: {
        places: {
          AutocompleteService: jest.fn().mockImplementation(() => ({
            getPlacePredictions: jest.fn((request, callback) => {
              // Simulate API failure
              setTimeout(() => {
                callback([], 'ZERO_RESULTS'); // Empty results
              }, 100);
            })
          })),
          PlacesServiceStatus: {
            OK: 'OK',
            ZERO_RESULTS: 'ZERO_RESULTS'
          }
        }
      }
    };
    
    Object.defineProperty(window, 'google', {
      value: mockGoogleMaps,
      writable: true
    });
    
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // User types an address
    fireEvent.change(addressInput, { target: { value: '123 Main Street' } });
    
    // Wait for autocomplete attempt
    await waitFor(() => {
      // Check if loading state appears
      const loadingText = screen.queryByText('Searching addresses...');
      console.log('🔄 Autocomplete loading state found:', !!loadingText);
    }, { timeout: 200 });
    
    // Wait for API response
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check results
    const hasSuggestions = screen.queryByText(/Main Street.*USA/i);
    console.log('🔍 Autocomplete suggestions after API call:', !!hasSuggestions);
    
    if (!hasSuggestions) {
      console.log('⚠️ Expected behavior: No suggestions when API returns ZERO_RESULTS');
    }
  });

  it('should test image API failure scenarios', async () => {
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    console.log('🧪 Testing image API failure...');
    
    // Mock API failure
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    fireEvent.change(addressInput, { target: { value: '123 Main Street, Springfield, IL 62701' } });
    fireEvent.blur(addressInput);
    
    // Wait and check what happens
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const img = screen.queryByAltText('Property front');
    console.log('🖼️ Image after API failure:', !!img);
    
    if (!img) {
      console.log('✅ Correct behavior: No image displayed when API fails');
    } else {
      console.log('❌ Unexpected: Image still displayed despite API failure');
    }
    
    // Check console errors
    console.log('🐛 Console errors from API failure:', consoleErrorSpy.mock.calls.length);
  });

  it('should test what happens with invalid API key', async () => {
    // Test with invalid API key
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'invalid-key';
    
    const mockOnUpdate = jest.fn();
    
    // Mock Street View API with placeholder response for invalid key
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        imageUrl: 'https://via.placeholder.com/400x300?text=No+Image+Found'
      })
    });
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    fireEvent.change(addressInput, { target: { value: '123 Main Street, Springfield, IL 62701' } });
    fireEvent.blur(addressInput);
    
    await waitFor(() => {
      const img = screen.queryByAltText('Property front');
      if (img) {
        const src = img.getAttribute('src');
        console.log('🖼️ Image URL with invalid API key:', src);
        
        if (src?.includes('placeholder')) {
          console.log('✅ Correct: Placeholder shown for invalid API key');
        } else if (src?.includes('googleapis.com')) {
          console.log('❌ Issue: Google API URL generated despite invalid key');
        }
      }
    });
  });

  it('should test the complete expected user workflow', async () => {
    console.log('🎯 Testing complete expected user workflow...');
    
    // Set up proper Google Maps mock
    const mockGoogleMaps = {
      maps: {
        places: {
          AutocompleteService: jest.fn().mockImplementation(() => ({
            getPlacePredictions: jest.fn((request, callback) => {
              const mockPredictions = [
                {
                  description: '123 Main Street, Springfield, IL, USA',
                  place_id: 'ChIJd_Y0eVIvK4gRXjPG_JvZ3bw'
                }
              ];
              callback(mockPredictions, 'OK');
            })
          })),
          PlacesServiceStatus: {
            OK: 'OK'
          }
        }
      }
    };
    
    Object.defineProperty(window, 'google', {
      value: mockGoogleMaps,
      writable: true
    });
    
    // Mock successful image fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+Street&key=test-key'
      })
    });
    
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    console.log('Step 1: User types address...');
    fireEvent.change(addressInput, { target: { value: '123 Main' } });
    
    console.log('Step 2: Waiting for autocomplete...');
    await waitFor(() => {
      const suggestion = screen.queryByText('123 Main Street, Springfield, IL, USA');
      expect(suggestion).toBeInTheDocument();
      console.log('✅ Autocomplete suggestion appeared');
    });
    
    console.log('Step 3: User clicks suggestion...');
    const suggestion = screen.getByText('123 Main Street, Springfield, IL, USA');
    fireEvent.mouseDown(suggestion);
    
    console.log('Step 4: Address filled, now blur to fetch image...');
    fireEvent.blur(addressInput);
    
    console.log('Step 5: Waiting for image...');
    await waitFor(() => {
      const img = screen.queryByAltText('Property front');
      expect(img).toBeInTheDocument();
      console.log('✅ Property image appeared');
      console.log('✅ Complete workflow successful!');
    });
    
    // Verify all expected behaviors
    expect(mockFetch).toHaveBeenCalledWith('/api/property-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '123 Main Street, Springfield, IL, USA' })
    });
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+Street&key=test-key'
      })
    );
  });
});