import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm';

describe('Debug: Rental Income Textbox Issue', () => {
  const mockProps = {
    onUpdate: jest.fn(),
    onAnalyze: jest.fn(),
    onPrev: jest.fn(),
    isAnalyzing: false,
    canAnalyze: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should show gross rent textbox for entire-house strategy', () => {
    const data = {
      rentalStrategy: 'entire-house' as const,
      purchasePrice: 250000,
      squareFootage: 1200,
    };

    render(<RentalIncomeForm {...mockProps} data={data} />);

    // Debug: log what's rendered
    screen.debug();

    // Should show the gross rent input
    const grossRentInput = screen.queryByLabelText(/monthly gross rent/i);
    expect(grossRentInput).toBeInTheDocument();
  });

  test('should show gross rent textbox when rentalStrategy is undefined (default)', () => {
    const data = {
      purchasePrice: 250000,
      squareFootage: 1200,
      // rentalStrategy is undefined - should default to entire-house
    };

    render(<RentalIncomeForm {...mockProps} data={data} />);

    // Debug: log what's rendered
    screen.debug();

    // Should show the gross rent input (defaults to entire-house)
    const grossRentInput = screen.queryByLabelText(/monthly gross rent/i);
    expect(grossRentInput).toBeInTheDocument();
  });

  test('should NOT show gross rent textbox for individual-rooms strategy', () => {
    const data = {
      rentalStrategy: 'individual-rooms' as const,
      purchasePrice: 250000,
      squareFootage: 1200,
      rentableRooms: [
        { roomNumber: 1, weeklyRate: 200 }
      ],
      grossRent: 800, // Calculated from room rates
    };

    render(<RentalIncomeForm {...mockProps} data={data} />);

    // Should NOT show the gross rent input for individual rooms
    const grossRentInput = screen.queryByLabelText(/monthly gross rent/i);
    expect(grossRentInput).not.toBeInTheDocument();
  });

  test('should show rental strategy display section', () => {
    const data = {
      rentalStrategy: 'entire-house' as const,
      purchasePrice: 250000,
    };

    render(<RentalIncomeForm {...mockProps} data={data} />);

    // Should show the rental strategy display section
    expect(screen.getByText('Selected Rental Strategy')).toBeInTheDocument();
    expect(screen.getByText(/entire house\/unit/i)).toBeInTheDocument();
  });
});