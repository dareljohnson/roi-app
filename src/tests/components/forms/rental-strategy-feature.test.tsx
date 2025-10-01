import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm';

describe('Rental Strategy Feature', () => {
  describe('PropertyDetailsForm - Rental Strategy Selection', () => {
    it('should default to entire-house rental strategy', () => {
      const onUpdate = jest.fn();
      render(
        <PropertyDetailsForm
          data={{}}
          onUpdate={onUpdate}
          onNext={jest.fn()}
        />
      );

      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      expect(rentalStrategySelect).toHaveValue('entire-house');
    });

    it('should show room rental controls only when individual-rooms strategy is selected', () => {
      const onUpdate = jest.fn();
      render(
        <PropertyDetailsForm
          data={{ bedrooms: 4 }}
          onUpdate={onUpdate}
          onNext={jest.fn()}
        />
      );

      // Initially, room controls should not be visible (default is entire-house)
      expect(screen.queryByLabelText(/Rooms to Rent/i)).not.toBeInTheDocument();

      // Change to individual-rooms strategy
      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });

      // Now room controls should be visible
      expect(screen.getByLabelText(/Rooms to Rent/i)).toBeInTheDocument();
    });

    it('should hide room rental controls when switching back to entire-house', () => {
      const onUpdate = jest.fn();
      render(
        <PropertyDetailsForm
          data={{ bedrooms: 4 }}
          onUpdate={onUpdate}
          onNext={jest.fn()}
        />
      );

      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      
      // Switch to individual-rooms
      fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
      expect(screen.getByLabelText(/Rooms to Rent/i)).toBeInTheDocument();

      // Switch back to entire-house
      fireEvent.change(rentalStrategySelect, { target: { value: 'entire-house' } });
      expect(screen.queryByLabelText(/Rooms to Rent/i)).not.toBeInTheDocument();
    });

    it('should calculate gross rent from room rates when using individual-rooms strategy', async () => {
      const onUpdate = jest.fn();
      render(
        <PropertyDetailsForm
          data={{ bedrooms: 4 }}
          onUpdate={onUpdate}
          onNext={jest.fn()}
        />
      );

      // Set rental strategy to individual-rooms
      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });

      // Set number of rooms to rent
      const numRoomsInput = screen.getByLabelText(/Rooms to Rent/i);
      fireEvent.change(numRoomsInput, { target: { value: '2' } });

      // Set weekly rates for each room
      const room1 = screen.getByLabelText(/Room 1 Weekly Rate/i);
      const room2 = screen.getByLabelText(/Room 2 Weekly Rate/i);
      fireEvent.change(room1, { target: { value: '100' } });
      fireEvent.change(room2, { target: { value: '150' } });

      // Check total monthly rent estimate (100 + 150) * 4 = 1000
      expect(screen.getByText(/Total Monthly Rent Estimate: \$1,000/)).toBeInTheDocument();

      // Verify onUpdate is called with calculated grossRent
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            rentalStrategy: 'individual-rooms',
            rentableRooms: [
              { roomNumber: 1, weeklyRate: 100 },
              { roomNumber: 2, weeklyRate: 150 },
            ],
            grossRent: 1000, // (100 + 150) * 4 = 1000
          })
        );
      });
    });

    it('should pass rental strategy to parent component', async () => {
      const onUpdate = jest.fn();
      render(
        <PropertyDetailsForm
          data={{}}
          onUpdate={onUpdate}
          onNext={jest.fn()}
        />
      );

      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            rentalStrategy: 'individual-rooms',
          })
        );
      });
    });
  });

  describe('RentalIncomeForm - Rental Strategy Display', () => {
    it('should show gross rent input for entire-house strategy', () => {
      const onUpdate = jest.fn();
      render(
        <RentalIncomeForm
          data={{ rentalStrategy: 'entire-house' }}
          onUpdate={onUpdate}
          onAnalyze={jest.fn()}
          onPrev={jest.fn()}
          isAnalyzing={false}
          canAnalyze={false}
        />
      );

      expect(screen.getByText(/Entire House\/Unit/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monthly Gross Rent/i)).toBeInTheDocument();
    });

    it('should show gross rent input for undefined strategy (defaults to entire-house)', () => {
      const onUpdate = jest.fn();
      render(
        <RentalIncomeForm
          data={{}} // No rental strategy set
          onUpdate={onUpdate}
          onAnalyze={jest.fn()}
          onPrev={jest.fn()}
          isAnalyzing={false}
          canAnalyze={false}
        />
      );

      expect(screen.getByText(/Entire House\/Unit/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monthly Gross Rent/i)).toBeInTheDocument();
    });

    it('should show room configuration for individual-rooms strategy', () => {
      const onUpdate = jest.fn();
      const mockRentableRooms = [
        { roomNumber: 1, weeklyRate: 100 },
        { roomNumber: 2, weeklyRate: 150 },
      ];
      
      render(
        <RentalIncomeForm
          data={{ 
            rentalStrategy: 'individual-rooms',
            rentableRooms: mockRentableRooms,
            grossRent: 1000
          }}
          onUpdate={onUpdate}
          onAnalyze={jest.fn()}
          onPrev={jest.fn()}
          isAnalyzing={false}
          canAnalyze={false}
        />
      );

      expect(screen.getByText(/Individual Rooms/)).toBeInTheDocument();
      expect(screen.getByText(/Room 1: \$100\/week/)).toBeInTheDocument();
      expect(screen.getByText(/Room 2: \$150\/week/)).toBeInTheDocument();
      expect(screen.getByText(/Total Monthly Income from Rooms: \$1,000/)).toBeInTheDocument();
      
      // Should NOT show the gross rent input for individual rooms
      expect(screen.queryByLabelText(/Monthly Gross Rent/i)).not.toBeInTheDocument();
    });

    it('should validate form correctly for individual-rooms strategy', () => {
      const onUpdate = jest.fn();
      const mockRentableRooms = [
        { roomNumber: 1, weeklyRate: 100 },
        { roomNumber: 2, weeklyRate: 150 },
      ];
      
      render(
        <RentalIncomeForm
          data={{ 
            rentalStrategy: 'individual-rooms',
            rentableRooms: mockRentableRooms,
            grossRent: 1000
          }}
          onUpdate={onUpdate}
          onAnalyze={jest.fn()}
          onPrev={jest.fn()}
          isAnalyzing={false}
          canAnalyze={true} // This should be true when room rates are valid
        />
      );

      // The analyze button should be enabled for valid room configuration
      const analyzeButton = screen.getByRole('button', { name: /Analyze Investment/i });
      expect(analyzeButton).not.toBeDisabled();
    });

    it('should show validation error when no rooms are configured for individual-rooms strategy', () => {
      const onUpdate = jest.fn();
      
      render(
        <RentalIncomeForm
          data={{ 
            rentalStrategy: 'individual-rooms',
            rentableRooms: [], // No rooms configured
          }}
          onUpdate={onUpdate}
          onAnalyze={jest.fn()}
          onPrev={jest.fn()}
          isAnalyzing={false}
          canAnalyze={false} // Should be false when no rooms configured
        />
      );

      // Should show error message
      expect(screen.getByText(/Missing Required Information/)).toBeInTheDocument();
    });
  });

  describe('Integration - End-to-End Rental Strategy Flow', () => {
    it('should maintain rental strategy selection across form steps', async () => {
      const mockData = {
        address: '123 Test St',
        propertyType: 'Single Family' as const,
        purchasePrice: 200000,
        bedrooms: 3,
      };

      // Test PropertyDetailsForm with individual-rooms strategy
      const onUpdate = jest.fn();
      const { rerender } = render(
        <PropertyDetailsForm
          data={mockData}
          onUpdate={onUpdate}
          onNext={jest.fn()}
        />
      );

      // Set rental strategy to individual-rooms
      const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
      fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });

      // Set up rooms
      const numRoomsInput = screen.getByLabelText(/Rooms to Rent/i);
      fireEvent.change(numRoomsInput, { target: { value: '2' } });

      const room1 = screen.getByLabelText(/Room 1 Weekly Rate/i);
      const room2 = screen.getByLabelText(/Room 2 Weekly Rate/i);
      fireEvent.change(room1, { target: { value: '200' } });
      fireEvent.change(room2, { target: { value: '250' } });

      // Wait for onUpdate to be called with rental strategy and room data
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            rentalStrategy: 'individual-rooms',
            rentableRooms: [
              { roomNumber: 1, weeklyRate: 200 },
              { roomNumber: 2, weeklyRate: 250 },
            ],
            grossRent: 1800, // (200 + 250) * 4 = 1800
          })
        );
      });
    });
  });
});