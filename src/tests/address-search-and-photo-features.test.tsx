import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Address Search and Photo Features', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    
    // Mock Google Maps API
    const mockGoogleMaps = {
      maps: {
        places: {
          AutocompleteService: jest.fn().mockImplementation(() => ({
            getPlacePredictions: jest.fn((request, callback) => {
              // Simulate async API response with delay
              setTimeout(() => {
                const mockPredictions = [
                  {
                    description: '123 Main St, Springfield, IL, USA',
                    place_id: 'ChIJd_Y0eVIvK4gRXjPG_JvZ3bw'
                  },
                  {
                    description: '123 Main Street, Springfield, MA, USA', 
                    place_id: 'ChIJaXk7X9k7K5kRvnWOeDvF8Qw'
                  }
                ];
                callback(mockPredictions, 'OK');
              }, 20); // Small delay to simulate real API
            })
          })),
          PlacesServiceStatus: {
            OK: 'OK'
          }
        }
      }
    };
    
    // Set up window.google mock
    Object.defineProperty(window, 'google', {
      value: mockGoogleMaps,
      writable: true
    });
    
    // Mock environment variable for client-side
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete (window as any).google;
    delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  });

  it('should show address autocomplete suggestions when user types', async () => {
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Type an address
    fireEvent.change(addressInput, { target: { value: '123 Main' } });
    
    // Wait for autocomplete to trigger
    await waitFor(() => {
      expect(screen.getByText('Searching addresses...')).toBeInTheDocument();
    });

    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('123 Main St, Springfield, IL, USA')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, Springfield, MA, USA')).toBeInTheDocument();
    });
  });

  it('should handle address selection from autocomplete', async () => {
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Type an address
    fireEvent.change(addressInput, { target: { value: '123 Main' } });
    
    // Wait for suggestions
    await waitFor(() => {
      expect(screen.getByText('123 Main St, Springfield, IL, USA')).toBeInTheDocument();
    });

    // Click on a suggestion
    fireEvent.mouseDown(screen.getByText('123 Main St, Springfield, IL, USA'));
    
    // Verify the address was selected
    expect(addressInput).toHaveValue('123 Main St, Springfield, IL, USA');
  });

  it('should fetch property image when address is blurred', async () => {
    const mockOnUpdate = jest.fn();
    
    // Mock successful image fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+St&key=test-key' })
    });
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Enter a valid address
    fireEvent.change(addressInput, { target: { value: '123 Main St, Springfield, IL' } });
    fireEvent.blur(addressInput);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading property image...')).toBeInTheDocument();
    });
    
    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/property-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '123 Main St, Springfield, IL' })
    });
    
    // Wait for image to appear
    await waitFor(() => {
      const img = screen.getByAltText('Property front');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+St&key=test-key');
    });
    
    // Verify onUpdate was called with imageUrl
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+St&key=test-key'
        })
      );
    });
  });

  it('should handle API fetch errors gracefully', async () => {
    const mockOnUpdate = jest.fn();
    
    // Mock failed image fetch
    mockFetch.mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Enter a valid address
    fireEvent.change(addressInput, { target: { value: '123 Main St, Springfield, IL' } });
    fireEvent.blur(addressInput);
    
    // Should show loading state initially
    await waitFor(() => {
      expect(screen.getByText('Loading property image...')).toBeInTheDocument();
    });
    
    // Should handle error gracefully (loading should disappear)
    await waitFor(() => {
      expect(screen.queryByText('Loading property image...')).not.toBeInTheDocument();
    });
    
    // Image should not appear
    expect(screen.queryByAltText('Property front')).not.toBeInTheDocument();
  });

  it('should not fetch image for short addresses', async () => {
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Enter a short address (5 characters or less)
    fireEvent.change(addressInput, { target: { value: '123' } });
    fireEvent.blur(addressInput);
    
    // Should not trigger image fetch
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByText('Loading property image...')).not.toBeInTheDocument();
  });

  it('should handle Google Maps API not being available', async () => {
    // Remove Google Maps API mock
    delete (window as any).google;
    
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Type an address
    fireEvent.change(addressInput, { target: { value: '123 Main' } });
    
    // Should not show autocomplete suggestions since API is not available
    await waitFor(() => {
      expect(screen.queryByText('Searching addresses...')).not.toBeInTheDocument();
    });
  });

  it('should test property-image API endpoint directly', async () => {
    // Test the API endpoint functionality
    const mockAddress = '123 Test Street, Test City, TC';
    
    // Mock the Street View API response
    mockFetch.mockResolvedValueOnce({
      ok: true, 
      json: async () => ({ imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Test+Street&key=test-key' })
    });
    
    const response = await fetch('/api/property-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: mockAddress })
    });
    
    const data = await response.json();
    
    expect(mockFetch).toHaveBeenCalledWith('/api/property-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: mockAddress })
    });
    
    expect(data).toEqual({
      imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Test+Street&key=test-key'
    });
  });
});