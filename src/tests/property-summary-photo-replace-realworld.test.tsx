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

describe('Property Summary - Photo Replace Real-World Bug Test', () => {
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
    imageUrl: '/uploads/current-property.jpg' // Existing image
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

  it('should show existing photo with replace functionality in Property Summary', () => {
    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Verify we can see the Property Summary section
    expect(screen.getByText('Property Summary')).toBeInTheDocument();
    
    // Verify current image is displayed
    expect(screen.getByTestId('property-image')).toBeInTheDocument();
    expect(screen.getByTestId('property-image')).toHaveAttribute('src', '/uploads/current-property.jpg');
    
    // Verify Replace Photo button is available and not disabled
    const replaceButton = screen.getByTestId('upload-photo-btn');
    expect(replaceButton).toBeInTheDocument();
    expect(replaceButton).not.toBeDisabled();
    expect(replaceButton).toHaveTextContent('Replace Photo');
  });

  it('should handle complete photo replacement workflow in Property Summary', async () => {
    // Mock successful upload
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        files: [{
          filepath: '/uploads/new-property-photo.jpg',
          filename: 'new-property.jpg',
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

    // Click Replace Photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Simulate file selection
    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const newPhotoFile = new File(['new photo data'], 'new-property.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [newPhotoFile],
      writable: false
    });

    // Trigger file change
    fireEvent.change(fileInput);

    // Verify uploading state
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    // Wait for upload to complete and callback to be called
    await waitFor(() => {
      expect(mockOnPropertyImageUpdate).toHaveBeenCalledWith('/uploads/new-property-photo.jpg');
    });

    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledWith('/api/upload/property-photos', {
      method: 'POST',
      body: mockFormData
    });

    // Verify FormData was populated correctly
    expect(mockFormData.append).toHaveBeenCalledWith('photos', newPhotoFile);
  });

  it('should handle authentication errors during replace', async () => {
    // Mock authentication error from server
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        error: 'Unauthorized'
      })
    });

    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Click Replace Photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Simulate file selection
    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const photoFile = new File(['photo data'], 'property.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [photoFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('upload-error')).toBeInTheDocument();
      expect(screen.getByTestId('upload-error')).toHaveTextContent('Unauthorized');
    });

    // Verify callback was NOT called
    expect(mockOnPropertyImageUpdate).not.toHaveBeenCalled();
  });

  it('should handle file size validation errors', async () => {
    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Click Replace Photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Simulate large file selection (over 10MB limit)
    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large-photo.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Should show size validation error
    await waitFor(() => {
      expect(screen.getByTestId('upload-error')).toBeInTheDocument();
      expect(screen.getByTestId('upload-error')).toHaveTextContent('File size must be less than 10MB');
    });

    // Should not call API
    expect(fetch).not.toHaveBeenCalled();
    expect(mockOnPropertyImageUpdate).not.toHaveBeenCalled();
  });

  it('should handle server errors gracefully', async () => {
    // Mock server error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        error: 'Internal server error'
      })
    });

    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        onPropertyImageUpdate={mockOnPropertyImageUpdate}
      />
    );

    // Click Replace Photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Simulate file selection
    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    const photoFile = new File(['photo data'], 'property.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [photoFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('upload-error')).toBeInTheDocument();
      expect(screen.getByTestId('upload-error')).toHaveTextContent('Internal server error');
    });

    // Button should return to normal state
    expect(screen.getByText('Replace Photo')).toBeInTheDocument();
    expect(replaceButton).not.toBeDisabled();
  });

  it('should reset to allow same file selection again after upload', async () => {
    // Mock successful upload
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        files: [{
          filepath: '/uploads/property-photo.jpg',
          filename: 'property.jpg',
          size: 54321
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

    // Click Replace Photo button
    const replaceButton = screen.getByTestId('upload-photo-btn');
    fireEvent.click(replaceButton);

    // Get file input
    const fileInput = screen.getByTestId('upload-file-input') as HTMLInputElement;
    
    // Simulate first file selection
    const photoFile = new File(['photo data'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [photoFile],
      writable: false
    });

    fireEvent.change(fileInput);

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockOnPropertyImageUpdate).toHaveBeenCalled();
    });

    // Input should be reset (value cleared)
    expect(fileInput.value).toBe('');
    
    // Should be able to select the same file again
    fireEvent.click(replaceButton);
    
    // File input should be clickable and ready for new selection
    expect(fileInput).not.toBeDisabled();
  });
});