import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';

describe('Debug Rental Strategy', () => {
  it('should debug rental strategy state changes', async () => {
    const onUpdate = jest.fn();
    render(
      <PropertyDetailsForm
        data={{ bedrooms: 4 }}
        onUpdate={onUpdate}
        onNext={jest.fn()}
      />
    );

    const rentalStrategySelect = screen.getByLabelText(/Rental Strategy/i);
    
    // Initially should be entire-house, no rooms input
    expect(rentalStrategySelect).toHaveValue('entire-house');
    expect(screen.queryByLabelText(/Rooms to Rent/i)).not.toBeInTheDocument();

    // Switch to individual-rooms
    fireEvent.change(rentalStrategySelect, { target: { value: 'individual-rooms' } });
    
    // Should now have rooms input
    await waitFor(() => {
      expect(screen.getByLabelText(/Rooms to Rent/i)).toBeInTheDocument();
    });

    // Switch back to entire-house
    fireEvent.change(rentalStrategySelect, { target: { value: 'entire-house' } });
    
    // Should hide rooms input
    await waitFor(() => {
      expect(screen.queryByLabelText(/Rooms to Rent/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});