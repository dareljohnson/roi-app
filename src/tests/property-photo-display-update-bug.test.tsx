/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
const mockFormData = {
  append: jest.fn(),
  getAll: jest.fn()
};
global.FormData = jest.fn(() => mockFormData) as any;

describe('Property Photo Display Update Bug - RESOLVED', () => {
  const mockOnPropertyImageUpdate = jest.fn();
  
  const mockPropertyData = {
    address: '123 Test Street, Test City, TS 12345',
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
    imageUrl: '/uploads/original-property.jpg' // This doesn't change after upload
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
    mockFormData.append.mockClear();
    mockFormData.getAll.mockClear();
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, expires: '2024-01-01' },
      status: 'authenticated',
      update: jest.fn()
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('FIXED - should now update display immediately after upload (was: old photo still shown)', async () => {
    // Mock successful upload
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        files: [{
          filepath: '/uploads/new-replaced-photo.jpg',
          filename: 'new-photo.jpg',
          size: 145231
        }]
      })
    });

    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Verify original image is displayed
    const originalImage = screen.getByTestId('property-image');
    expect(originalImage).toHaveAttribute('src', '/uploads/original-property.jpg');

    // Click Replace Photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Simulate file selection and upload
    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const newPhotoFile = new File(['new photo data'], 'new-photo.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [newPhotoFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockOnPropertyImageUpdate).toHaveBeenCalledWith('/uploads/new-replaced-photo.jpg');
    });

    // BUG: The image src should update to show the new photo, but it doesn't!
    // The PropertyPhotoUpload component is still showing the old image because
    // propertyData.imageUrl hasn't changed, so currentImageUrl prop is still the old value
    const imageAfterUpload = screen.getByTestId('property-image');
    
    // BUG IS NOW FIXED! - the image src should now show the new photo
    expect(imageAfterUpload).toHaveAttribute('src', '/uploads/new-replaced-photo.jpg');
    
    // Even though the callback was called with the new URL
    expect(mockOnPropertyImageUpdate).toHaveBeenCalledWith('/uploads/new-replaced-photo.jpg');
  });

  it('FIXED - should show the correct behavior - image updates after successful upload', async () => {
    // This test shows what SHOULD happen and now DOES work correctly!
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        files: [{
          filepath: '/uploads/new-replaced-photo.jpg',
          filename: 'new-photo.jpg',
          size: 145231
        }]
      })
    });

    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Verify original image
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/original-property.jpg');

    // Upload new photo
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const newPhotoFile = new File(['new photo data'], 'new-photo.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [newPhotoFile],
      writable: false
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnPropertyImageUpdate).toHaveBeenCalledWith('/uploads/new-replaced-photo.jpg');
    });

    // FIX WORKS! The image should now show the new photo and it does!
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/new-replaced-photo.jpg');
  });

  it('should demonstrate the root cause - PropertyPhotoUpload depends on parent prop update', () => {
    // This test shows that PropertyPhotoUpload needs the parent to update its imageUrl prop
    // for the display to change
    
    const { rerender } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Original image displayed
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/original-property.jpg');

    // Simulate parent updating the propertyData with new imageUrl (this is what should happen)
    const updatedPropertyData = {
      ...mockPropertyData,
      imageUrl: '/uploads/new-replaced-photo.jpg'
    };

    rerender(
      <ResultsDashboard 
        results={mockResults}
        propertyData={updatedPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Now the image should update because the prop changed
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/new-replaced-photo.jpg');
  });
});