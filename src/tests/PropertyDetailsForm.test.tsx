import '@testing-library/jest-dom';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';

describe('PropertyDetailsForm', () => {
  it('fetches and displays property image on address blur', async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ imageUrl: 'https://example.com/property.jpg' })
    }) as any;

    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={jest.fn()}
        onNext={jest.fn()}
      />
    );

    const addressInput = screen.getByLabelText(/Property Address/i);
    fireEvent.change(addressInput, { target: { value: '123 Main St, City, State' } });
    fireEvent.blur(addressInput);

    expect(screen.getByText(/Loading property image/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByAltText('Property front')).toHaveAttribute('src', 'https://example.com/property.jpg');
    });
  });

  it('calls onUpdate with imageUrl after image fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ imageUrl: 'https://example.com/property.jpg' })
    }) as any;
    const onUpdate = jest.fn();
    render(
      <PropertyDetailsForm
        data={{}}
        onUpdate={onUpdate}
        onNext={jest.fn()}
      />
    );
    const addressInput = screen.getByLabelText(/Property Address/i);
    fireEvent.change(addressInput, { target: { value: '123 Main St, City, State' } });
    fireEvent.blur(addressInput);
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: 'https://example.com/property.jpg' }));
    });
  });
  it('allows user to set number of rooms to rent and weekly rates, and calculates total monthly rent', async () => {
    const onUpdate = jest.fn();
    render(
      <PropertyDetailsForm
        data={{ bedrooms: 4 }}
        onUpdate={onUpdate}
        onNext={jest.fn()}
      />
    );
    // Set number of rooms to rent
    const numRoomsInput = screen.getByLabelText(/Rooms to Rent/i);
    fireEvent.change(numRoomsInput, { target: { value: '3' } });
    // Set weekly rates for each room
    const room1 = screen.getByLabelText(/Room 1 Weekly Rate/i);
    const room2 = screen.getByLabelText(/Room 2 Weekly Rate/i);
    const room3 = screen.getByLabelText(/Room 3 Weekly Rate/i);
    fireEvent.change(room1, { target: { value: '100' } });
    fireEvent.change(room2, { target: { value: '150' } });
    fireEvent.change(room3, { target: { value: '200' } });
    // Check total monthly rent estimate
    expect(screen.getByText(/Total Monthly Rent Estimate: \$1,800/)).toBeInTheDocument();
    // onUpdate should be called with rentableRooms array
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          rentableRooms: [
            { roomNumber: 1, weeklyRate: 100 },
            { roomNumber: 2, weeklyRate: 150 },
            { roomNumber: 3, weeklyRate: 200 },
          ],
        })
      );
    });
  });
});
