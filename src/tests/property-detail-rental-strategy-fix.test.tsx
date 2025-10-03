import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PropertyDetailPage from '../app/properties/[id]/page'
import { useParams, useRouter } from 'next/navigation'

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({
    data: { user: { id: 'user-1', email: 'test@example.com' } },
    status: 'authenticated'
  })
}))

// Mock fetch globally
global.fetch = jest.fn()

describe('PropertyDetailPage RentalStrategy Fix', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useParams as jest.Mock).mockReturnValue({ id: 'test-property-1' })
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('handles property without rentalStrategy field', async () => {
    // Mock property data without rentalStrategy field (legacy data)
    const mockPropertyData = {
      success: true,
      analysis: {
        id: 'test-property-1',
        address: '123 Test Street',
        propertyType: 'Single Family',
        purchasePrice: 200000,
        currentValue: 220000,
        squareFootage: 1500,
        bedrooms: 3,
        bathrooms: 2,
        condition: 'Good',
        downPayment: 40000,
        interestRate: 0.05,
        loanTerm: 30,
        closingCosts: 5000,
        pmiRate: 0.005,
        grossRent: 2000,
        vacancyRate: 0.05,
        propertyTaxes: 3000,
        insurance: 1200,
        propertyMgmt: 200,
        maintenance: 150,
        utilities: 100,
        hoaFees: 50,
        equipment: 25,
        rehabCosts: 0,
        // rentalStrategy is missing (legacy property)
        roi: 8.5,
        monthlyPayment: 1073,
        monthlyCashFlow: 727,
        capRate: 6.8,
        debtServiceCoverageRatio: 1.68,
        npv: 15000,
        irr: 0.12,
        totalReturn: 25000,
        recommendation: 'BUY',
        recommendationScore: 85,
        createdAt: '2025-10-01T10:00:00Z',
        imageUrl: 'https://example.com/property.jpg'
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPropertyData
    })

    render(<PropertyDetailPage />)

    // Wait for the property to load and check that it doesn't crash
    await waitFor(() => {
      expect(screen.getAllByText('123 Test Street')[0]).toBeInTheDocument()
    })

    // Verify the component renders successfully with default rentalStrategy (no crashes)
    expect(screen.getByText('Back to History')).toBeInTheDocument()
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/properties/test-property-1')
  })

  it('handles property with rentalStrategy field', async () => {
    // Mock property data with rentalStrategy field
    const mockPropertyData = {
      success: true,
      analysis: {
        id: 'test-property-2',
        address: '456 Test Avenue',
        propertyType: 'Multi-family',
        purchasePrice: 300000,
        downPayment: 60000,
        interestRate: 0.045,
        loanTerm: 30,
        grossRent: 3000,
        vacancyRate: 0.05,
        propertyTaxes: 4000,
        insurance: 1500,
        rentalStrategy: 'individual-rooms', // Present
        roi: 9.2,
        monthlyPayment: 1520,
        monthlyCashFlow: 1235,
        capRate: 7.2,
        debtServiceCoverageRatio: 1.81,
        npv: 25000,
        irr: 0.14,
        totalReturn: 35000,
        recommendation: 'BUY',
        recommendationScore: 92,
        createdAt: '2025-10-01T10:00:00Z',
        imageUrl: 'https://example.com/property2.jpg'
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPropertyData
    })

    render(<PropertyDetailPage />)

    // Wait for the property to load
    await waitFor(() => {
      expect(screen.getAllByText('456 Test Avenue')[0]).toBeInTheDocument()
    })

    // Verify the component renders successfully with provided rentalStrategy (no crashes)
    expect(screen.getByText('Back to History')).toBeInTheDocument()
  })
})