import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';
import userEvent from '@testing-library/user-event';

// Comprehensive real-world test to identify the actual issues
describe('Real-World Address Search and Photo Feature Test', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Set up environment variable
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'AIzaSyAeOwr0I19PqmRw5d5BDLfkwcgIofZ10hc';
    
    // Mock Google Maps API with more realistic timing
    const mockGoogleMaps = {
      maps: {
        places: {
          AutocompleteService: jest.fn().mockImplementation(() => ({
            getPlacePredictions: jest.fn((request, callback) => {
              // Simulate API delay
              setTimeout(() => {
                const mockPredictions = [
                  {
                    description: '123 Main Street, Springfield, IL, USA',
                    place_id: 'ChIJd_Y0eVIvK4gRXjPG_JvZ3bw'
                  },
                  {
                    description: '123 Main Street, Springfield, MA, USA', 
                    place_id: 'ChIJaXk7X9k7K5kRvnWOeDvF8Qw'
                  }
                ];
                callback(mockPredictions, 'OK');
              }, 50); // Small delay to simulate real API
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
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete (window as any).google;
    delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  });

  it('should perform a complete address search and photo fetch workflow', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = jest.fn();
    
    // Mock successful image fetch with delay
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ 
            imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+Street&key=test-key'
          })
        }), 100) // Add delay to ensure loading state is shown
      )
    );
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    console.log('Step 1: Starting address input...');
    
    // Type address slowly to simulate real user input
    await user.type(addressInput, '123 Main Street');
    
    console.log('Step 2: Waiting for autocomplete suggestions...');
    
    // Wait for autocomplete suggestions to appear
    await waitFor(
      () => {
        const suggestion = screen.queryByText('123 Main Street, Springfield, IL, USA');
        console.log('Looking for suggestion, found:', !!suggestion);
        expect(suggestion).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
    
    console.log('Step 3: Clicking on autocomplete suggestion...');
    
    // Click on autocomplete suggestion
    const suggestion = screen.getByText('123 Main Street, Springfield, IL, USA');
    await user.click(suggestion);
    
    console.log('Step 4: Verifying address was selected...');
    
    // Verify address was selected
    expect(addressInput).toHaveValue('123 Main Street, Springfield, IL, USA');
    
    console.log('Step 5: Triggering blur to fetch image...');
    
    // Blur the input to trigger image fetch
    await user.click(document.body); // Click outside to blur
    
    console.log('Step 6: Waiting for image loading state...');
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading property image...')).toBeInTheDocument();
    });
    
    console.log('Step 7: Verifying API was called...');
    
    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/property-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '123 Main Street, Springfield, IL, USA' })
    });
    
    console.log('Step 8: Waiting for image to appear...');
    
    // Wait for image to appear
    await waitFor(() => {
      const img = screen.getByAltText('Property front');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+Street&key=test-key');
    }, { timeout: 3000 });
    
    console.log('Step 9: Verifying onUpdate was called with image...');
    
    // Verify onUpdate was called with imageUrl
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+Street&key=test-key'
        })
      );
    });
    
    console.log('✅ Complete workflow test passed!');
  });

  it('should handle the case when Google Maps API fails to load', async () => {
    // Remove Google Maps API completely before rendering
    delete (window as any).google;
    
    // Also temporarily remove the API key to simulate unavailable state
    const originalApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    
    const user = userEvent.setup();
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Should show the API unavailable message
    expect(screen.getByText('🚫 Address autocomplete unavailable. Enter address manually.')).toBeInTheDocument();
    
    // Type address
    await user.type(addressInput, '123 Main Street');
    
    // Wait a bit to see if any autocomplete appears (it shouldn't)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    // Should NOT show autocomplete suggestions
    expect(screen.queryByText('123 Main Street, Springfield, IL, USA')).not.toBeInTheDocument();
    
    // Should NOT show loading state
    expect(screen.queryByText('Searching addresses...')).not.toBeInTheDocument();
    
    // Restore API key
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = originalApiKey;
    
    console.log('✅ Google Maps failure test passed!');
  });

  it('should test manual address entry and image fetch without autocomplete', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = jest.fn();
    
    // Mock successful image fetch with delay
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ 
            imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=456+Oak+Street&key=test-key'
          })
        }), 100) // Add delay to ensure loading state is shown
      )
    );
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Manually type a complete address
    await user.type(addressInput, '456 Oak Street, Denver, CO 80202');
    
    // Blur the input to trigger image fetch
    await user.tab(); // Tab away to blur
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading property image...')).toBeInTheDocument();
    });
    
    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/property-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '456 Oak Street, Denver, CO 80202' })
    });
    
    // Wait for image to appear
    await waitFor(() => {
      const img = screen.getByAltText('Property front');
      expect(img).toBeInTheDocument();
    });
    
    console.log('✅ Manual address entry test passed!');
  });
});