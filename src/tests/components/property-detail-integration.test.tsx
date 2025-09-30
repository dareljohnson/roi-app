/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

// Mock next/navigation
const mockUseParams = jest.fn()
const mockUseRouter = jest.fn()
jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => mockUseRouter()
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => 
    <a href={href}>{children}</a>
})

// Mock the dashboard component to avoid complex rendering
jest.mock('@/components/dashboard/ResultsDashboard', () => ({
  ResultsDashboard: () => <div data-testid="results-dashboard">Results Dashboard</div>
}))

// Mock the pie chart component
jest.mock('@/components/PieChartWithNeedle', () => {
  return function MockPieChart({ score }: { score: number }) {
    return <div data-testid="pie-chart">Score: {score}</div>
  }
})

// Mock the walk-through notes component
jest.mock('@/components/walkthrough/WalkThroughNotes', () => ({
  WalkThroughNotes: ({ propertyId, propertyAddress }: { propertyId: string; propertyAddress: string }) => (
    <div data-testid="walkthrough-notes">
      <h3>Walk-Through Notes</h3>
      <p>Property ID: {propertyId}</p>
      <p>Address: {propertyAddress}</p>
    </div>
  )
}))

// Import the component after mocking
import PropertyDetailPage from '@/app/properties/[id]/page'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Property Detail Page with Walk-Through Notes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ id: 'property-123' })
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    })
  })

  it('renders walk-through notes section on property detail page', async () => {
    const mockPropertyData = {
      id: 'property-123',
      address: '123 Main Street',
      propertyType: 'Single Family',
      purchasePrice: 250000,
      bedrooms: 3,
      bathrooms: 2,
      downPayment: 50000,
      interestRate: 0.045,
      loanTerm: 30,
      grossRent: 2000,
      vacancyRate: 0.05,
      roi: 12.5,
      monthlyPayment: 1013,
      monthlyCashFlow: 687,
      capRate: 8.2,
      debtServiceCoverageRatio: 1.85,
      npv: 15000,
      irr: 0.14,
      totalReturn: 25000,
      recommendation: 'BUY',
      recommendationScore: 85,
      createdAt: '2025-09-27T12:00:00Z'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        analysis: mockPropertyData
      })
    })

    render(<PropertyDetailPage />)

    // Wait for the component to load the property data
    await waitFor(() => {
      expect(screen.getByText('123 Main Street')).toBeInTheDocument()
    })

    // Verify that the walk-through notes component is rendered
    expect(screen.getByTestId('walkthrough-notes')).toBeInTheDocument()
    expect(screen.getByText('Walk-Through Notes')).toBeInTheDocument()
    expect(screen.getByText('Property ID: property-123')).toBeInTheDocument()
    expect(screen.getByText('Address: 123 Main Street')).toBeInTheDocument()

    // Verify that the API was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/properties/property-123')
  })

  it('renders property details and walk-through notes together', async () => {
    const mockPropertyData = {
      id: 'property-456',
      address: '456 Oak Avenue',
      propertyType: 'Condo',
      purchasePrice: 180000,
      bedrooms: 2,
      bathrooms: 1,
      downPayment: 36000,
      interestRate: 0.05,
      loanTerm: 30,
      grossRent: 1500,
      vacancyRate: 0.08,
      roi: 10.2,
      monthlyPayment: 773,
      monthlyCashFlow: 427,
      capRate: 7.1,
      debtServiceCoverageRatio: 1.55,
      npv: 8000,
      irr: 0.11,
      totalReturn: 18000,
      recommendation: 'HOLD',
      recommendationScore: 65,
      createdAt: '2025-09-26T15:30:00Z'
    }

    mockUseParams.mockReturnValue({ id: 'property-456' })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        analysis: mockPropertyData
      })
    })

    render(<PropertyDetailPage />)

    await waitFor(() => {
      // Verify property details are shown
      expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument()
      expect(screen.getByText(/Condo/)).toBeInTheDocument()
      expect(screen.getByText(/2 bed/)).toBeInTheDocument()
      expect(screen.getByText(/1 bath/)).toBeInTheDocument()
    })

    // Verify all major sections are present
    expect(screen.getByTestId('results-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByTestId('walkthrough-notes')).toBeInTheDocument()

    // Verify walk-through notes has correct props
    expect(screen.getByText('Property ID: property-456')).toBeInTheDocument()
    expect(screen.getByText('Address: 456 Oak Avenue')).toBeInTheDocument()
  })

  it('handles missing property ID gracefully', async () => {
    mockUseParams.mockReturnValue({ id: undefined })

    render(<PropertyDetailPage />)

    await waitFor(() => {
      expect(screen.getByText(/No property ID found in the URL/)).toBeInTheDocument()
    })

    // Walk-through notes should not be rendered when there's no property
    expect(screen.queryByTestId('walkthrough-notes')).not.toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    render(<PropertyDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Error fetching property details')).toBeInTheDocument()
    })

    // Walk-through notes should not be rendered when there's an API error
    expect(screen.queryByTestId('walkthrough-notes')).not.toBeInTheDocument()
  })

  it('renders all navigation elements correctly', async () => {
    const mockPropertyData = {
      id: 'property-789',
      address: '789 Pine Street',
      propertyType: 'Townhouse',
      purchasePrice: 220000,
      bedrooms: 3,
      bathrooms: 2,
      downPayment: 44000,
      interestRate: 0.047,
      loanTerm: 30,
      grossRent: 1800,
      vacancyRate: 0.06,
      roi: 11.8,
      monthlyPayment: 920,
      monthlyCashFlow: 572,
      capRate: 7.8,
      debtServiceCoverageRatio: 1.62,
      npv: 12000,
      irr: 0.125,
      totalReturn: 22000,
      recommendation: 'BUY',
      recommendationScore: 78,
      createdAt: '2025-09-25T10:15:00Z'
    }

    mockUseParams.mockReturnValue({ id: 'property-789' })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        analysis: mockPropertyData
      })
    })

    render(<PropertyDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('789 Pine Street')).toBeInTheDocument()
    })

    // Check navigation elements
    expect(screen.getByText('Back to History')).toBeInTheDocument()
    expect(screen.getByText('Print to PDF')).toBeInTheDocument()
    expect(screen.getByText('View All Properties')).toBeInTheDocument()

    // Verify walk-through notes section is present
    expect(screen.getByTestId('walkthrough-notes')).toBeInTheDocument()
  })
})