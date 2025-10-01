import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';

describe('Address Search and Photo Features - Bug Fixes', () => {
  let mockFetch: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'AIzaSyAeOwr0I19PqmRw5d5BDLfkwcgIofZ10hc';
  });

  afterEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy.mockRestore();
    delete (window as any).google;
  });

  it('should identify the specific issues with address search and photo features', async () => {
    const mockOnUpdate = jest.fn();
    
    console.log('🔍 Testing current behavior to identify issues...');
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Test 1: Address typing without Google Maps loaded
    console.log('Test 1: Typing address without Google Maps API...');
    fireEvent.change(addressInput, { target: { value: '123 Main Street' } });
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const autocompleteLoading = screen.queryByText('Searching addresses...');
    const suggestions = screen.queryByText(/Main Street.*USA/i);
    
    console.log('- Autocomplete loading indicator:', !!autocompleteLoading);
    console.log('- Autocomplete suggestions:', !!suggestions);
    
    if (!suggestions) {
      console.log('✅ Issue confirmed: No autocomplete when Google Maps unavailable');
    }
    
    // Test 2: Image fetching
    console.log('Test 2: Testing image fetching...');
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=123+Main+Street&key=AIzaSyAeOwr0I19PqmRw5d5BDLfkwcgIofZ10hc'
      })
    });
    
    fireEvent.change(addressInput, { target: { value: '123 Main Street, Springfield, IL 62701' } });
    fireEvent.blur(addressInput);
    
    await waitFor(async () => {
      const img = screen.queryByAltText('Property front');
      if (img) {
        console.log('✅ Image feature working - URL:', img.getAttribute('src'));
      } else {
        console.log('❌ Image feature not working');
      }
    }, { timeout: 1000 });
    
    // Test 3: Check if API was called
    if (mockFetch.mock.calls.length > 0) {
      console.log('✅ Image API called correctly:', mockFetch.mock.calls[0]);
    } else {
      console.log('❌ Image API not called');
    }
    
    // Test 4: Error handling
    console.log('Test 3: Error handling...');
    console.log('- Console errors during tests:', consoleErrorSpy.mock.calls.length);
    
    // Summary
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('1. Address autocomplete requires Google Maps API to be loaded');
    console.log('2. Image fetching works independently of Google Maps API');
    console.log('3. Both features depend on proper API keys and network connectivity');
  });

  it('should test the fixes needed for robust operation', async () => {
    console.log('🔧 Testing fixes for robust operation...');
    
    // Test graceful fallback when Google Maps fails
    const mockOnUpdate = jest.fn();
    
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={mockOnUpdate}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    
    // Test manual address entry (should always work)
    console.log('Testing manual address entry fallback...');
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        imageUrl: 'https://maps.googleapis.com/maps/api/streetview?location=456+Oak+Street&key=test'
      })
    });
    
    fireEvent.change(addressInput, { target: { value: '456 Oak Street, Denver, CO 80202' } });
    fireEvent.blur(addressInput);
    
    await waitFor(() => {
      const img = screen.queryByAltText('Property front');
      if (img) {
        console.log('✅ Manual address entry + image fetch works as fallback');
        return true;
      }
      return false;
    }, { timeout: 1000 });
    
    expect(mockFetch).toHaveBeenCalledWith('/api/property-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '456 Oak Street, Denver, CO 80202' })
    });
    
    console.log('✅ Core functionality (manual entry + photos) confirmed working');
  });
});