/**
 * TDD Test: Multi-Room Rental Strategy Feature
 * Focus: Complete testing of the "Rent Individual Rooms" functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';

const mockProps = {
  data: {
    address: '123 Multi-Room House',
    propertyType: 'Single Family' as const,
    purchasePrice: 300000,
    bedrooms: 4,
    rentalStrategy: 'entire-house' as const,
  },
  onUpdate: jest.fn(),
  onNext: jest.fn(),
};

describe('Multi-Room Rental Strategy Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should enable multi-room configuration when individual-rooms is selected', async () => {
    render(<PropertyDetailsForm {...mockProps} />);
    
    // Switch to individual-rooms strategy
    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
    fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
    
    // Should show room configuration controls
    await waitFor(() => {
      expect(screen.getByLabelText(/Rooms to Rent/i)).toBeInTheDocument();
    });
    
    // Should hide entire-house controls
    expect(screen.queryByLabelText(/Monthly Gross Rent/i)).not.toBeInTheDocument();
  });

  test('should configure multiple rooms with individual rates', async () => {
    render(<PropertyDetailsForm {...mockProps} />);
    
    // Switch to individual-rooms strategy  
    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
    fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
    
    // Set number of rooms to rent
    const numRoomsInput = await screen.findByLabelText(/Rooms to Rent/i);
    fireEvent.change(numRoomsInput, { target: { value: '3' } });
    
    // Should show individual room rate inputs
    await waitFor(() => {
      expect(screen.getByLabelText(/Room 1 Weekly Rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Room 2 Weekly Rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Room 3 Weekly Rate/i)).toBeInTheDocument();
    });
    
    // Set rates for each room
    const room1Input = screen.getByLabelText(/Room 1 Weekly Rate/i);
    const room2Input = screen.getByLabelText(/Room 2 Weekly Rate/i);
    const room3Input = screen.getByLabelText(/Room 3 Weekly Rate/i);
    
    fireEvent.change(room1Input, { target: { value: '200' } });
    fireEvent.blur(room1Input);
    
    fireEvent.change(room2Input, { target: { value: '175' } });
    fireEvent.blur(room2Input);
    
    fireEvent.change(room3Input, { target: { value: '150' } });
    fireEvent.blur(room3Input);
    
    // Should calculate and display total monthly rent
    await waitFor(() => {
      // 200 + 175 + 150 = 525 per week * 4 weeks = $2,100 per month
      expect(screen.getByText(/Total Monthly Rent Estimate: \$2,100/i)).toBeInTheDocument();
    });
  });

  test('should validate room count against bedroom count', async () => {
    render(<PropertyDetailsForm {...mockProps} />);
    
    // Switch to individual-rooms strategy
    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
    fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
    
    // Try to set more rooms than bedrooms (property has 4 bedrooms)
    const numRoomsInput = await screen.findByLabelText(/Rooms to Rent/i);
    fireEvent.change(numRoomsInput, { target: { value: '5' } });
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Cannot rent more rooms \(5\) than total bedrooms \(4\)/i)).toBeInTheDocument();
    });
    
    // Should not create room inputs when validation fails
    expect(screen.queryByLabelText(/Room 1 Weekly Rate/i)).not.toBeInTheDocument();
  });

  test('should call onUpdate with correct room rental data', async () => {
    render(<PropertyDetailsForm {...mockProps} />);
    
    // Switch to individual-rooms strategy
    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
    fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
    
    // Configure 2 rooms
    const numRoomsInput = await screen.findByLabelText(/Rooms to Rent/i);
    fireEvent.change(numRoomsInput, { target: { value: '2' } });
    
    // Set rates
    const room1Input = await screen.findByLabelText(/Room 1 Weekly Rate/i);
    const room2Input = screen.getByLabelText(/Room 2 Weekly Rate/i);
    
    fireEvent.change(room1Input, { target: { value: '180' } });
    fireEvent.blur(room1Input);
    
    fireEvent.change(room2Input, { target: { value: '160' } });
    fireEvent.blur(room2Input);
    
    // Verify onUpdate was called with room rental data
    await waitFor(() => {
      const lastCall = mockProps.onUpdate.mock.calls[mockProps.onUpdate.mock.calls.length - 1][0];
      expect(lastCall.rentalStrategy).toBe('individual-rooms');
      expect(lastCall.rentableRooms).toEqual([
        { roomNumber: 1, weeklyRate: 180 },
        { roomNumber: 2, weeklyRate: 160 }
      ]);
      // Should calculate grossRent from room rates: (180 + 160) * 4 = 1360
      expect(lastCall.grossRent).toBe(1360);
    });
  });

  test('should switch back to entire-house strategy and clear room data', async () => {
    render(<PropertyDetailsForm {...mockProps} />);
    
    // Start with individual-rooms strategy
    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
    fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
    
    // Configure some rooms
    const numRoomsInput = await screen.findByLabelText(/Rooms to Rent/i);
    fireEvent.change(numRoomsInput, { target: { value: '2' } });
    
    const room1Input = await screen.findByLabelText(/Room 1 Weekly Rate/i);
    fireEvent.change(room1Input, { target: { value: '150' } });
    fireEvent.blur(room1Input);
    
    // Switch back to entire-house
    fireEvent.change(rentalStrategySelect, { target: { value: 'entire-house' } });
    
    // Should hide room controls
    await waitFor(() => {
      expect(screen.queryByLabelText(/Rooms to Rent/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Room 1 Weekly Rate/i)).not.toBeInTheDocument();
    });
    
    // Should show entire-house controls again
    expect(screen.getByLabelText(/Monthly Gross Rent/i)).toBeInTheDocument();
    
    // Should clear room data in state
    await waitFor(() => {
      const lastCall = mockProps.onUpdate.mock.calls[mockProps.onUpdate.mock.calls.length - 1][0];
      expect(lastCall.rentalStrategy).toBe('entire-house');
      expect(lastCall.rentableRooms).toEqual([]);
    });
  });

  test('should format currency values properly in room inputs', async () => {
    render(<PropertyDetailsForm {...mockProps} />);
    
    // Switch to individual-rooms strategy
    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
    fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
    
    // Configure 1 room
    const numRoomsInput = await screen.findByLabelText(/Rooms to Rent/i);
    fireEvent.change(numRoomsInput, { target: { value: '1' } });
    
    // Set room rate with focus/blur to test formatting
    const room1Input = await screen.findByLabelText(/Room 1 Weekly Rate/i);
    
    // Focus should show unformatted value for editing
    fireEvent.focus(room1Input);
    fireEvent.change(room1Input, { target: { value: '150.50' } });
    
    // Blur should format as currency
    fireEvent.blur(room1Input);
    
    await waitFor(() => {
      expect(room1Input).toHaveValue('150.50');
    });
  });

  test('should handle room count changes dynamically', async () => {
    render(<PropertyDetailsForm {...mockProps} />);
    
    // Switch to individual-rooms strategy
    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
    fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
    
    // Start with 2 rooms
    const numRoomsInput = await screen.findByLabelText(/Rooms to Rent/i);
    fireEvent.change(numRoomsInput, { target: { value: '2' } });
    
    // Should show 2 room inputs
    await waitFor(() => {
      expect(screen.getByLabelText(/Room 1 Weekly Rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Room 2 Weekly Rate/i)).toBeInTheDocument();
    });
    
    // Increase to 3 rooms
    fireEvent.change(numRoomsInput, { target: { value: '3' } });
    
    // Should show 3 room inputs
    await waitFor(() => {
      expect(screen.getByLabelText(/Room 1 Weekly Rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Room 2 Weekly Rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Room 3 Weekly Rate/i)).toBeInTheDocument();
    });
    
    // Decrease to 1 room
    fireEvent.change(numRoomsInput, { target: { value: '1' } });
    
    // Should show only 1 room input
    await waitFor(() => {
      expect(screen.getByLabelText(/Room 1 Weekly Rate/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Room 2 Weekly Rate/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Room 3 Weekly Rate/i)).not.toBeInTheDocument();
    });
  });
});