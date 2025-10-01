import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm';
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

describe('Rental Textbox Debug Tests', () => {
  let mockData: Partial<PropertyAnalysisInput>;
  let mockOnUpdate: jest.Mock;
  let mockOnNext: jest.Mock;
  let mockOnAnalyze: jest.Mock;
  let mockOnPrev: jest.Mock;

  beforeEach(() => {
    mockData = {
      address: '123 Test St',
      propertyType: 'Single Family',
      purchasePrice: 250000,
      bedrooms: 3,
      bathrooms: 2,
    };
    mockOnUpdate = jest.fn();
    mockOnNext = jest.fn();
    mockOnAnalyze = jest.fn();
    mockOnPrev = jest.fn();
  });

  test('PropertyDetailsForm should update data with rental strategy selection', async () => {
    render(
      <PropertyDetailsForm
        data={mockData}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    // Find and click rental strategy dropdown
    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
    expect(rentalStrategySelect).toBeInTheDocument();

    // Check default value
    expect(rentalStrategySelect).toHaveValue('entire-house');

    // Check that onUpdate was called with rental strategy
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    // Get the last call to onUpdate and check if rentalStrategy is included
    const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1];
    const updatedData = lastCall[0];
    console.log('PropertyDetailsForm onUpdate called with:', updatedData);
    expect(updatedData).toHaveProperty('rentalStrategy');
    expect(updatedData.rentalStrategy).toBe('entire-house');
  });

  test('RentalIncomeForm should show gross rent input for entire-house strategy', () => {
    const dataWithStrategy = {
      ...mockData,
      rentalStrategy: 'entire-house' as const
    };

    render(
      <RentalIncomeForm
        data={dataWithStrategy}
        onUpdate={mockOnUpdate}
        onAnalyze={mockOnAnalyze}
        onPrev={mockOnPrev}
        isAnalyzing={false}
        canAnalyze={true}
      />
    );

    console.log('RentalIncomeForm rendered with data:', dataWithStrategy);

    // Check if gross rent input is present
    const grossRentInput = screen.queryByLabelText(/Monthly Gross Rent/i);
    console.log('Gross rent input found:', grossRentInput !== null);
    
    if (grossRentInput) {
      console.log('Gross rent input value:', grossRentInput.getAttribute('value'));
    } else {
      // Log all inputs to see what's actually rendered
      const allInputs = screen.getAllByRole('textbox');
      console.log('All textbox inputs found:', allInputs.map(input => ({
        label: input.getAttribute('aria-label') || input.getAttribute('id'),
        placeholder: input.getAttribute('placeholder'),
        value: input.getAttribute('value')
      })));
    }

    expect(grossRentInput).toBeInTheDocument();
  });

  test('RentalIncomeForm should show room configuration for individual-rooms strategy', () => {
    const dataWithStrategy = {
      ...mockData,
      rentalStrategy: 'individual-rooms' as const,
      rentableRooms: [
        { roomNumber: 1, weeklyRate: 150 },
        { roomNumber: 2, weeklyRate: 160 }
      ]
    };

    render(
      <RentalIncomeForm
        data={dataWithStrategy}
        onUpdate={mockOnUpdate}
        onAnalyze={mockOnAnalyze}
        onPrev={mockOnPrev}
        isAnalyzing={false}
        canAnalyze={true}
      />
    );

    console.log('RentalIncomeForm rendered with individual-rooms data:', dataWithStrategy);

    // Should not show gross rent input
    const grossRentInput = screen.queryByLabelText(/Monthly Gross Rent/i);
    console.log('Gross rent input found (should be null):', grossRentInput !== null);
    expect(grossRentInput).not.toBeInTheDocument();

    // Should show room configuration display
    const roomConfigText = screen.queryByText(/Room Configuration/i);
    console.log('Room configuration text found:', roomConfigText !== null);
    expect(roomConfigText).toBeInTheDocument();
  });

  test('RentalIncomeForm should show gross rent input when rentalStrategy is undefined', () => {
    const dataWithoutStrategy = {
      ...mockData,
      // rentalStrategy is undefined - should default to showing gross rent
    };

    render(
      <RentalIncomeForm
        data={dataWithoutStrategy}
        onUpdate={mockOnUpdate}
        onAnalyze={mockOnAnalyze}
        onPrev={mockOnPrev}
        isAnalyzing={false}
        canAnalyze={true}
      />
    );

    console.log('RentalIncomeForm rendered without strategy:', dataWithoutStrategy);

    // Should show gross rent input (default behavior)
    const grossRentInput = screen.queryByLabelText(/Monthly Gross Rent/i);
    console.log('Gross rent input found (should be present):', grossRentInput !== null);
    expect(grossRentInput).toBeInTheDocument();
  });

  test('End-to-end: PropertyDetailsForm selection should affect RentalIncomeForm display', async () => {
    let currentData = { ...mockData };
    
    const handleUpdate = (newData: Partial<PropertyAnalysisInput>) => {
      currentData = { ...currentData, ...newData };
      console.log('Data updated to:', currentData);
    };

    // Render PropertyDetailsForm
    const { rerender } = render(
      <PropertyDetailsForm
        data={currentData}
        onUpdate={handleUpdate}
        onNext={mockOnNext}
      />
    );

    // Wait for initial update
    await waitFor(() => {
      expect(currentData).toHaveProperty('rentalStrategy');
    });

    console.log('After PropertyDetailsForm initial render, data is:', currentData);

    // Now render RentalIncomeForm with the updated data
    rerender(
      <RentalIncomeForm
        data={currentData}
        onUpdate={mockOnUpdate}
        onAnalyze={mockOnAnalyze}
        onPrev={mockOnPrev}
        isAnalyzing={false}
        canAnalyze={true}
      />
    );

    console.log('RentalIncomeForm rendered with final data:', currentData);

    // Should show gross rent input for entire-house strategy
    const grossRentInput = screen.queryByLabelText(/Monthly Gross Rent/i);
    console.log('Final gross rent input found:', grossRentInput !== null);
    
    if (!grossRentInput) {
      // Debug: show all rendered content
      console.log('Full rendered content:', screen.debug());
    }

    expect(grossRentInput).toBeInTheDocument();
  });
});