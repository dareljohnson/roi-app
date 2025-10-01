import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm';

describe('E2E: Rental Strategy Flow - Textbox Issue Debug', () => {
  let formData: any = {};
  
  const mockPropertyDetailsProps = {
    data: {},
    onUpdate: (data: any) => {
      console.log('PropertyDetailsForm onUpdate called with:', data);
      formData = { ...formData, ...data };
    },
    onNext: jest.fn(),
  };

  const mockRentalIncomeProps = {
    onUpdate: jest.fn(),
    onAnalyze: jest.fn(),
    onPrev: jest.fn(),
    isAnalyzing: false,
    canAnalyze: true,
  };

  beforeEach(() => {
    formData = {};
    jest.clearAllMocks();
  });

  test('should show gross rent textbox after selecting "Rent Entire House/Unit" strategy', async () => {
    // Step 1: Render PropertyDetailsForm and set basic data
    const { rerender } = render(<PropertyDetailsForm {...mockPropertyDetailsProps} />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: '123 Test Street, Test City' }
    });
    fireEvent.change(screen.getByLabelText(/purchase price/i), {
      target: { value: '250000' }
    });

    // Step 2: Select "Rent Entire House/Unit" strategy
    const strategySelect = screen.getByLabelText(/rental strategy/i);
    fireEvent.change(strategySelect, { target: { value: 'entire-house' } });

    // Wait for state updates
    await waitFor(() => {
      expect(strategySelect).toHaveValue('entire-house');
    });

    console.log('Form data after strategy selection:', formData);

    // Step 3: Now render RentalIncomeForm with the collected data
    render(<RentalIncomeForm {...mockRentalIncomeProps} data={formData} />);

    // Debug: log what's rendered
    screen.debug();

    // Step 4: Check if gross rent textbox appears
    const grossRentInput = screen.queryByLabelText(/monthly gross rent/i);
    console.log('Gross rent input found:', !!grossRentInput);
    console.log('Current form data:', formData);

    expect(grossRentInput).toBeInTheDocument();
  });

  test('should NOT show gross rent textbox after selecting "Rent Individual Rooms" strategy', async () => {
    // Step 1: Render PropertyDetailsForm and set basic data
    render(<PropertyDetailsForm {...mockPropertyDetailsProps} />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: '123 Test Street, Test City' }
    });
    fireEvent.change(screen.getByLabelText(/purchase price/i), {
      target: { value: '250000' }
    });

    // Step 2: Select "Rent Individual Rooms" strategy
    const strategySelect = screen.getByLabelText(/rental strategy/i);
    fireEvent.change(strategySelect, { target: { value: 'individual-rooms' } });

    // Wait for state updates
    await waitFor(() => {
      expect(strategySelect).toHaveValue('individual-rooms');
    });

    console.log('Form data after individual rooms selection:', formData);

    // Step 3: Now render RentalIncomeForm with the collected data
    render(<RentalIncomeForm {...mockRentalIncomeProps} data={formData} />);

    // Step 4: Check if gross rent textbox is hidden
    const grossRentInput = screen.queryByLabelText(/monthly gross rent/i);
    expect(grossRentInput).not.toBeInTheDocument();

    // Should show individual rooms display instead - be more specific
    expect(screen.getByText(/You're renting out individual rooms to multiple tenants/i)).toBeInTheDocument();
  });

  test('should show default entire-house strategy when no strategy is selected', () => {
    // Render RentalIncomeForm with empty data (no rentalStrategy specified)
    const emptyData = {
      purchasePrice: 250000,
      squareFootage: 1200,
    };

    render(<RentalIncomeForm {...mockRentalIncomeProps} data={emptyData} />);

    // Should default to entire-house and show gross rent input
    const grossRentInput = screen.queryByLabelText(/monthly gross rent/i);
    expect(grossRentInput).toBeInTheDocument();

    // Should show entire house strategy in display
    expect(screen.getByText(/entire house\/unit/i)).toBeInTheDocument();
  });
});