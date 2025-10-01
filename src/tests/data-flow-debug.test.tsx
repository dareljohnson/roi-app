// Simple test to replace complex data flow debug test
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm';
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm';

describe('Data Flow - Simplified Tests', () => {
  test('PropertyDetailsForm renders rental strategy dropdown', () => {
    const mockData = {};
    const mockUpdate = jest.fn(); 
    render(
      <PropertyDetailsForm 
        data={mockData} 
        onUpdate={mockUpdate} 
        onNext={jest.fn()} 
      />
    );
    expect(screen.getByLabelText(/Rental Strategy/i)).toBeInTheDocument();
  });

  test('RentalIncomeForm shows correct content for entire-house strategy', () => {
    const mockData = { rentalStrategy: 'entire-house' };  
    render(
      <RentalIncomeForm
        data={mockData}
        onUpdate={jest.fn()}
        onAnalyze={jest.fn()}
        onPrev={jest.fn()}
        isAnalyzing={false}
        canAnalyze={true}
      />
    );
    expect(screen.queryByLabelText(/Monthly Gross Rent/i)).toBeInTheDocument();
  });

  test('RentalIncomeForm shows correct content for individual-rooms strategy', () => {
    const mockData = { rentalStrategy: 'individual-rooms' }; 
    render(  
      <RentalIncomeForm
        data={mockData}
        onUpdate={jest.fn()}
        onAnalyze={jest.fn()}
        onPrev={jest.fn()}
        isAnalyzing={false}
        canAnalyze={true}
      />
    );
    expect(screen.queryByText(/You\'re renting out individual rooms to multiple tenants/i)).toBeInTheDocument();
  });
});
