import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';
import { PropertyAnalysisInput } from '@/types/property';

// Mock Google Maps API
Object.defineProperty(window, 'google', {
  value: {
    maps: {
      places: {
        AutocompleteService: jest.fn(() => ({
          getPlacePredictions: jest.fn()
        })),
        PlacesServiceStatus: {
          OK: 'OK'
        }
      }
    }
  },
  writable: true
});

describe('PropertyDetailsForm Debug - Rental Strategy Initial Value', () => {
  let mockOnUpdate: jest.Mock;
  let mockOnNext: jest.Mock;

  beforeEach(() => {
    mockOnUpdate = jest.fn();
    mockOnNext = jest.fn();
  });

  test('should initialize with correct rental strategy value', () => {
    // Test with empty data (like when the app first loads)
    const emptyData: Partial<PropertyAnalysisInput> = {};
    
    render(
      <PropertyDetailsForm
        data={emptyData}
        onUpdate={mockOnUpdate} 
        onNext={mockOnNext}
      />
    );

    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i) as HTMLSelectElement;
    console.log('Initial rental strategy value with empty data:', rentalStrategySelect.value);
    console.log('All available options:', Array.from(rentalStrategySelect.options).map(opt => ({ value: opt.value, text: opt.text })));
    
    // Should default to 'entire-house'
    expect(rentalStrategySelect.value).toBe('entire-house');
  });

  test('should respect existing rental strategy value', () => {
    // Test with existing data
    const existingData: Partial<PropertyAnalysisInput> = {
      rentalStrategy: 'individual-rooms'
    };
    
    render(
      <PropertyDetailsForm
        data={existingData}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i) as HTMLSelectElement;
    console.log('Initial rental strategy value with existing data:', rentalStrategySelect.value);
    
    // Should use the existing value
    expect(rentalStrategySelect.value).toBe('individual-rooms');
  });

  test('should handle undefined rental strategy data', () => {
    // Test with data object that has undefined rentalStrategy
    const dataWithUndefined: Partial<PropertyAnalysisInput> = {
      address: '123 Test St',
      rentalStrategy: undefined
    };
    
    render(
      <PropertyDetailsForm
        data={dataWithUndefined}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i) as HTMLSelectElement;
    console.log('Initial rental strategy value with undefined:', rentalStrategySelect.value);
    
    // Should default to 'entire-house' when undefined
    expect(rentalStrategySelect.value).toBe('entire-house');
  });

  test('should call onUpdate with correct rental strategy', () => {
    const emptyData: Partial<PropertyAnalysisInput> = {};
    
    render(
      <PropertyDetailsForm
        data={emptyData}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    // Check what gets called in onUpdate
    expect(mockOnUpdate).toHaveBeenCalled();
    
    const calls = mockOnUpdate.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    console.log('onUpdate called with rental strategy:', lastCall.rentalStrategy);
    
    expect(lastCall).toHaveProperty('rentalStrategy');
    expect(lastCall.rentalStrategy).toBe('entire-house');
  });

  test('should update currentRentalStrategy when changing selection', () => {
    const emptyData: Partial<PropertyAnalysisInput> = {};
    
    render(
      <PropertyDetailsForm
        data={emptyData}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i) as HTMLSelectElement;
    
    // Verify initial state
    expect(rentalStrategySelect.value).toBe('entire-house');
    
    // Change to individual-rooms
    fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
    
    // Check updated value
    expect(rentalStrategySelect.value).toBe('individual-rooms');
    
    // Check that room rental controls appear
    const roomsInput = screen.queryByLabelText(/Rooms to Rent/i);
    expect(roomsInput).toBeInTheDocument();
    
    // Change back to entire-house
    fireEvent.change(rentalStrategySelect, { target: { value: 'entire-house' } });
    
    // Check updated value
    expect(rentalStrategySelect.value).toBe('entire-house');
    
    // Check that room rental controls disappear
    const roomsInputAfter = screen.queryByLabelText(/Rooms to Rent/i);
    expect(roomsInputAfter).not.toBeInTheDocument();
  });
});