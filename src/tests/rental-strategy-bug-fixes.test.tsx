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

describe('Rental Strategy Bug Fixes', () => {
  let mockOnUpdate: jest.Mock;
  let mockOnNext: jest.Mock;
  let mockOnAnalyze: jest.Mock;
  let mockOnPrev: jest.Mock;

  beforeEach(() => {
    mockOnUpdate = jest.fn();
    mockOnNext = jest.fn();
    mockOnAnalyze = jest.fn();
    mockOnPrev = jest.fn();
  });

  describe('Bug 1: No rent input field for "Rent Entire House/Unit"', () => {
    test('should show gross rent input when entire-house strategy is selected', async () => {
      let currentFormData: Partial<PropertyAnalysisInput> = {};
      
      const handleUpdate = (newData: Partial<PropertyAnalysisInput>) => {
        currentFormData = { ...currentFormData, ...newData };
      };

      // Start with PropertyDetailsForm
      render(
        <PropertyDetailsForm
          data={currentFormData}
          onUpdate={handleUpdate}
          onNext={mockOnNext}
        />
      );

      // Wait for initial data setup
      await waitFor(() => {
        expect(currentFormData).toHaveProperty('rentalStrategy');
      });

      console.log('PropertyDetailsForm data after mount:', currentFormData);

      // Should default to entire-house
      expect(currentFormData.rentalStrategy).toBe('entire-house');

      // Now render RentalIncomeForm with this data
      render(
        <RentalIncomeForm
          data={currentFormData} 
          onUpdate={handleUpdate}
          onAnalyze={mockOnAnalyze}
          onPrev={mockOnPrev}
          isAnalyzing={false}
          canAnalyze={true}
        />
      );

      // BUG REPRODUCTION: Check if gross rent input appears
      const grossRentInput = screen.queryByLabelText(/Monthly Gross Rent/i);
      console.log('Gross rent input found:', grossRentInput !== null);
      
      if (!grossRentInput) {
        // Debug: Show what inputs are actually rendered
        const allInputs = screen.getAllByRole('textbox');
        console.log('All rendered inputs:', allInputs.map(input => ({
          id: input.getAttribute('id'),
          placeholder: input.getAttribute('placeholder'),
          'aria-label': input.getAttribute('aria-label')
        })));
        
        // Show rental strategy debug info if available
        const debugText = document.querySelector('*[class*="text-gray-600"]');
        if (debugText) {
          console.log('Debug info found:', debugText.textContent);
        }
      }

      // This should pass - if it fails, we've reproduced the bug
      expect(grossRentInput).toBeInTheDocument();
    });

    test('should show gross rent input when explicitly setting entire-house strategy', () => {
      const explicitData: Partial<PropertyAnalysisInput> = {
        rentalStrategy: 'entire-house',
        address: '123 Test St',
        propertyType: 'Single Family'
      };

      render(
        <RentalIncomeForm
          data={explicitData}
          onUpdate={mockOnUpdate}
          onAnalyze={mockOnAnalyze}
          onPrev={mockOnPrev}
          isAnalyzing={false}
          canAnalyze={true}
        />
      );

      const grossRentInput = screen.queryByLabelText(/Monthly Gross Rent/i);
      console.log('Explicit entire-house - gross rent input found:', grossRentInput !== null);
      
      expect(grossRentInput).toBeInTheDocument();
    });
  });

  describe('Bug 2: Can rent more rooms than bedrooms', () => {
    test('should limit room count to number of bedrooms', async () => {
      const dataWith3Bedrooms: Partial<PropertyAnalysisInput> = {
        bedrooms: 3,
        rentalStrategy: 'individual-rooms'
      };

      render(
        <PropertyDetailsForm
          data={dataWith3Bedrooms}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
        />
      );

      // Change to individual-rooms strategy
      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });

      // Wait for room controls to appear
      await waitFor(() => {
        const roomsInput = screen.queryByLabelText(/Rooms to Rent/i);
        expect(roomsInput).toBeInTheDocument();
      });

      const roomsInput = screen.getByLabelText(/Rooms to Rent/i) as HTMLInputElement;
      
      // BUG REPRODUCTION: Try to set rooms to rent higher than bedrooms
      fireEvent.change(roomsInput, { target: { value: '5' } }); // More than 3 bedrooms

      // Check if the input was accepted (this should be prevented)
      console.log('Rooms input value after setting to 5:', roomsInput.value);
      console.log('Max attribute:', roomsInput.getAttribute('max'));
      
      // The input should be limited to the number of bedrooms (3)
      // If this fails, we've reproduced the bug
      expect(parseInt(roomsInput.value)).toBeLessThanOrEqual(3);
    });

    test('should show validation error when trying to rent more rooms than bedrooms', async () => {
      const dataWith2Bedrooms: Partial<PropertyAnalysisInput> = {
        bedrooms: 2,
        rentalStrategy: 'individual-rooms'
      };

      render(
        <PropertyDetailsForm
          data={dataWith2Bedrooms}
          onUpdate={mockOnUpdate}
          onNext={mockOnNext}
        />
      );

      // Change to individual-rooms strategy
      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });

      await waitFor(() => {
        const roomsInput = screen.queryByLabelText(/Rooms to Rent/i);
        expect(roomsInput).toBeInTheDocument();
      });

      const roomsInput = screen.getByLabelText(/Rooms to Rent/i);
      
      // Try to set more rooms than bedrooms
      fireEvent.change(roomsInput, { target: { value: '4' } }); // More than 2 bedrooms

      // Look for validation error message
      const errorMessage = screen.queryByText(/cannot rent more rooms/i);
      
      // Should show validation error
      expect(errorMessage).toBeInTheDocument();
    });

    test('should update max rooms when bedrooms count changes', async () => {
      let currentFormData: Partial<PropertyAnalysisInput> = {
        bedrooms: 2,
        rentalStrategy: 'individual-rooms'
      };

      const handleUpdate = (newData: Partial<PropertyAnalysisInput>) => {
        currentFormData = { ...currentFormData, ...newData };
      };

      const { rerender } = render(
        <PropertyDetailsForm
          data={currentFormData}
          onUpdate={handleUpdate}
          onNext={mockOnNext}
        />
      );

      // Change to individual-rooms strategy
      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });

      await waitFor(() => {
        const roomsInput = screen.queryByLabelText(/Rooms to Rent/i);
        expect(roomsInput).toBeInTheDocument();
      });

      let roomsInput = screen.getByLabelText(/Rooms to Rent/i) as HTMLInputElement;
      console.log('Initial max rooms (2 bedrooms):', roomsInput.getAttribute('max'));
      expect(roomsInput.getAttribute('max')).toBe('2');

      // Change bedrooms to 4
      const bedroomsInput = screen.getByLabelText(/Bedrooms/i);
      fireEvent.change(bedroomsInput, { target: { value: '4' } });

      // Wait for update
      await waitFor(() => {
        expect(currentFormData.bedrooms).toBe(4);
      });

      // Re-render with updated data
      rerender(
        <PropertyDetailsForm
          data={currentFormData}
          onUpdate={handleUpdate}
          onNext={mockOnNext}
        />
      );

      // Check if max rooms updated
      roomsInput = screen.getByLabelText(/Rooms to Rent/i) as HTMLInputElement;
      console.log('Updated max rooms (4 bedrooms):', roomsInput.getAttribute('max'));
      expect(roomsInput.getAttribute('max')).toBe('4');
    });
  });

  describe('Integration: Full workflow test', () => {
    test('should handle complete rental strategy workflow correctly', async () => {
      let currentFormData: Partial<PropertyAnalysisInput> = {
        address: '123 Test Street',
        bedrooms: 3,
        bathrooms: 2
      };

      const handleUpdate = (newData: Partial<PropertyAnalysisInput>) => {
        currentFormData = { ...currentFormData, ...newData };
        console.log('Data updated:', { 
          rentalStrategy: currentFormData.rentalStrategy,
          bedrooms: currentFormData.bedrooms,
          rentableRooms: currentFormData.rentableRooms?.length
        });
      };

      // Step 1: PropertyDetailsForm - should default to entire-house
      const { rerender } = render(
        <PropertyDetailsForm
          data={currentFormData}
          onUpdate={handleUpdate}
          onNext={mockOnNext}
        />
      );

      await waitFor(() => {
        expect(currentFormData).toHaveProperty('rentalStrategy');
      });

      expect(currentFormData.rentalStrategy).toBe('entire-house');

      // Step 2: Test RentalIncomeForm with entire-house - should show gross rent input
      rerender(
        <RentalIncomeForm
          data={currentFormData}
          onUpdate={handleUpdate}
          onAnalyze={mockOnAnalyze}
          onPrev={mockOnPrev}
          isAnalyzing={false}
          canAnalyze={true}
        />
      );

      let grossRentInput = screen.queryByLabelText(/Monthly Gross Rent/i);
      expect(grossRentInput).toBeInTheDocument();

      // Step 3: Switch to individual-rooms strategy
      rerender(
        <PropertyDetailsForm
          data={currentFormData}
          onUpdate={handleUpdate}
          onNext={mockOnNext}
        />
      );

      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });

      await waitFor(() => {
        expect(currentFormData.rentalStrategy).toBe('individual-rooms');
      });

      // Step 4: Configure rooms (should be limited to 3 bedrooms)
      const roomsInput = screen.getByLabelText(/Rooms to Rent/i) as HTMLInputElement;
      expect(roomsInput.getAttribute('max')).toBe('3');

      fireEvent.change(roomsInput, { target: { value: '2' } });

      // Step 5: Test RentalIncomeForm with individual-rooms - should NOT show gross rent input
      rerender(
        <RentalIncomeForm
          data={currentFormData}
          onUpdate={handleUpdate}
          onAnalyze={mockOnAnalyze}
          onPrev={mockOnPrev}
          isAnalyzing={false}
          canAnalyze={true}
        />
      );

      grossRentInput = screen.queryByLabelText(/Monthly Gross Rent/i);
      expect(grossRentInput).not.toBeInTheDocument();

      // Should show individual rooms text instead
      const individualRoomsText = screen.queryByText(/individual rooms to multiple tenants/i);
      expect(individualRoomsText).toBeInTheDocument();
    });
  });
});