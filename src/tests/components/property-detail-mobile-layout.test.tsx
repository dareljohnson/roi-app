/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

// Minimal mocks reused from integration test to isolate layout
const mockUseParams = jest.fn()
const mockUseRouter = jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }))

jest.mock('next/navigation', () => {
  return {
    useParams: () => mockUseParams(),
    useRouter: () => mockUseRouter()
  }
})
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>
})
jest.mock('@/components/dashboard/ResultsDashboard', () => ({
  ResultsDashboard: () => <div data-testid="results-dashboard" />
}))
jest.mock('@/components/PieChartWithNeedle', () => ({
  __esModule: true,
  default: ({ score }: { score: number }) => <div data-testid="pie-chart" data-score={score}>Score:{score}</div>
}))
jest.mock('@/components/walkthrough/WalkThroughNotes', () => ({
  WalkThroughNotes: () => <div data-testid="walkthrough-notes" />
}))

import PropertyDetailPage from '@/app/properties/[id]/page'

const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('Property Detail Mobile Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ id: 'mobile-prop' })
  })

  function setupProperty() {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        analysis: {
          id: 'mobile-prop',
          address: '1 Mobile Way',
          propertyType: 'Condo',
          purchasePrice: 100000,
          bedrooms: 1,
          bathrooms: 1,
          downPayment: 20000,
          interestRate: 0.05,
          loanTerm: 30,
          grossRent: 1200,
          vacancyRate: 0.05,
          roi: 9.5,
          monthlyPayment: 600,
            monthlyCashFlow: 300,
          capRate: 6.2,
          debtServiceCoverageRatio: 1.4,
          npv: 5000,
          irr: 0.1,
          totalReturn: 10000,
          recommendation: 'HOLD',
          recommendationScore: 55,
          createdAt: '2025-09-30T12:00:00Z'
        }
      })
    })
  }

  it('renders mobile friendly buttons and chart', async () => {
    setupProperty()
    render(<PropertyDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('1 Mobile Way')).toBeInTheDocument()
    })

    // Buttons present
    expect(screen.getByText('Print to PDF')).toBeInTheDocument()
    expect(screen.getByText('View All Properties')).toBeInTheDocument()
    // Chart present
    expect(screen.getByTestId('pie-chart')).toHaveAttribute('data-score', '55')
  })

  it('renders unified header layout without separate divisions', async () => {
    setupProperty()
    const { container } = render(<PropertyDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('1 Mobile Way')).toBeInTheDocument()
    })

    // Find the main container
    const spaceYDiv = container.querySelector('.space-y-8')
    expect(spaceYDiv).toBeInTheDocument()

    // Should have a unified header with border and rounded corners (unified layout)
    const unifiedHeader = container.querySelector('.bg-white.border.rounded-lg.p-4')
    expect(unifiedHeader).toBeInTheDocument()

    // Within the unified header, ensure all elements are present
    expect(unifiedHeader?.querySelector('h1')).toHaveTextContent('1 Mobile Way')
    expect(unifiedHeader?.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument()
    
    // Buttons should be within the same unified container
    const printButton = screen.getByText('Print to PDF')
    const viewAllButton = screen.getByText('View All Properties')
    expect(unifiedHeader?.contains(printButton)).toBe(true)
    expect(unifiedHeader?.contains(viewAllButton)).toBe(true)
  })

  it('has proper mobile responsive classes for unified layout', async () => {
    setupProperty()
    const { container } = render(<PropertyDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('1 Mobile Way')).toBeInTheDocument()
    })

    // Check for responsive flex classes in the unified header
    const flexColDiv = container.querySelector('.flex.flex-col.space-y-4')
    expect(flexColDiv).toBeInTheDocument()

    // Check for responsive button layout within unified container
    const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row.gap-2')
    expect(buttonContainer).toBeInTheDocument()

    // Ensure buttons have full width on mobile, auto on larger screens
    const printButton = screen.getByText('Print to PDF').closest('button')
    expect(printButton).toHaveClass('w-full', 'sm:w-auto')
  })
})
