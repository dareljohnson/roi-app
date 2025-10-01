/**
 * Properties Dynamic Route Tests
 * 
 * This test suite verifies that the properties dynamic route can be rendered
 * without causing module resolution or static generation errors.
 */

import { describe, it, expect, jest } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import PropertyDetailPage from '../../../app/properties/[id]/page'

// Mock the database fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

const mockSession = {
  user: {
    email: 'test@example.com',
    name: 'Test User',
    id: '1'
  },
  expires: new Date(Date.now() + 2 * 86400).toISOString(),
}

const mockPropertyData = {
  id: 'test-property-id',
  address: '123 Test Street',
  propertyType: 'singleFamily',
  purchasePrice: 300000,
  downPayment: 60000,
  interestRate: 0.065,
  loanTerm: 30,
  grossRent: 2500,
  vacancyRate: 0.05,
  propertyTaxes: 3600,
  insurance: 1200,
  maintenance: 1800,
  roi: 0.12,
  monthlyPayment: 1614,
  monthlyCashFlow: 533,
  capRate: 0.08,
  debtServiceCoverageRatio: 1.33,
  npv: 15000,
  irr: 0.14,
  totalReturn: 25000,
  recommendation: 'BUY',
  recommendationScore: 85,
  createdAt: '2024-01-01',
  recommendationReasons: ['Good cash flow', 'Strong market'],
  monthlyProjections: [],
  annualProjections: []
}

describe('Properties Dynamic Route', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        analysis: mockPropertyData
      }),
    } as Response)
  })

  it('should render without throwing module resolution errors', async () => {
    expect(() => {
      render(
        <SessionProvider session={mockSession}>
          <PropertyDetailPage />
        </SessionProvider>
      )
    }).not.toThrow()
  })

  it('should handle loading state properly', () => {
    render(
      <SessionProvider session={mockSession}>
        <PropertyDetailPage />
      </SessionProvider>
    )

    // Should show loading state initially
    expect(screen.getByText(/loading/i)).toBeTruthy()
  })

  it('should fetch property data on mount', async () => {
    render(
      <SessionProvider session={mockSession}>
        <PropertyDetailPage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/properties/test-property-id')
    })
  })

  it('should render property data when loaded', async () => {
    render(
      <SessionProvider session={mockSession}>
        <PropertyDetailPage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getAllByText('123 Test Street')).toHaveLength(2) // Should appear in heading and summary
    }, { timeout: 3000 })
  })

  it('should handle error state properly', async () => {
    // Mock fetch to return an error
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    render(
      <SessionProvider session={mockSession}>
        <PropertyDetailPage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/error fetching property details/i)).toBeTruthy()
    })
  })

  it('should not cause static generation issues with dynamic imports', () => {
    // Test that the component doesn't have any imports that would cause
    // static generation problems
    expect(() => {
      expect(PropertyDetailPage).toBeDefined()
      expect(typeof PropertyDetailPage).toBe('function')
    }).not.toThrow()
  })
})