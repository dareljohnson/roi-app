/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsDashboard } from '../components/dashboard/ResultsDashboard';
import { useSession } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}));
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock fetch
global.fetch = jest.fn();

// Mock FormData
global.FormData = jest.fn(() => ({
  append: jest.fn(),
  getAll: jest.fn()
})) as any;

describe('ResultsDashboard - Property Photo Integration', () => {
  const mockOnPropertyImageUpdate = jest.fn();
  
  const mockPropertyData = {
    address: '123 Test St',
    propertyType: 'Single Family' as const,
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 6.5,
    loanTerm: 30,
    closingCosts: 5000,
    pmiRate: 0.5,
    rentalStrategy: 'entire-house' as const,
    grossRent: 2500,
    vacancyRate: 0.05,
    propertyTaxes: 4000,
    insurance: 1200,
    propertyMgmt: 150,
    maintenance: 100,
    utilities: 0,
    hoaFees: 0,
    equipment: 0,
    rehabCosts: 0,
    imageUrl: '/test-property.jpg'
  };

  const mockResults = {
    monthlyPayment: 1500,
    monthlyCashFlow: 850,
    monthlyOperatingExpenses: 650,
    annualCashFlow: 10200,
    netOperatingIncome: 25500,
    effectiveGrossIncome: 28500,
    totalAnnualExpenses: 7800,
    roi: 17.0,
    capRate: 8.5,
    cashOnCashReturn: 17.0,
    debtServiceCoverageRatio: 1.4,
    totalCashInvested: 60000,
    loanAmount: 240000,
    npv: 45000,
    irr: 0.18,
    recommendation: 'BUY' as const,
    recommendationScore: 85,
    monthlyProjections: [],
    annualProjections: [],
    recommendationReasons: ['Strong cash flow', 'Good ROI']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, expires: '2024-01-01' },
      status: 'authenticated',
      update: jest.fn()
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows property photo upload component when logged in', () => {
    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Should show the current image
    expect(screen.getByTestId('property-image')).toBeInTheDocument();
    
    // Should show replace photo button
    expect(screen.getByTestId('upload-photo-btn')).toBeInTheDocument();
    expect(screen.getByText('Replace Photo')).toBeInTheDocument();
  });

  it('shows upload component when no image exists', () => {
    const propertyDataNoImage = { ...mockPropertyData, imageUrl: undefined };
    
    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={propertyDataNoImage}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Should show upload photo button
    expect(screen.getByTestId('upload-photo-btn')).toBeInTheDocument();
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    
    // Should show placeholder
    expect(screen.getByTestId('no-image-placeholder')).toBeInTheDocument();
  });

  it('shows login prompt when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    } as any);

    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Should show login prompt
    expect(screen.getByTestId('login-prompt')).toBeInTheDocument();
    expect(screen.getByText('Please log in to upload or replace property photos.')).toBeInTheDocument();
  });

  it('handles remove photo correctly', () => {
    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Click remove button
    const removeButton = screen.getByTestId('remove-photo-btn');
    fireEvent.click(removeButton);
    
    // Should call callback with null
    expect(mockOnPropertyImageUpdate).toHaveBeenCalledWith(null);
  });

  it('handles photo upload button click', () => {
    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Click replace photo button
    const uploadButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(uploadButton);
    
    // Button should be clickable and not disabled
    expect(uploadButton).not.toBeDisabled();
  });
});