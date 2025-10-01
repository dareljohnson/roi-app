/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResultsDashboard } from '@/components/dashboard/ResultsDashboard'
import { useSession } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock the PieChartWithNeedle component
jest.mock('@/components/PieChartWithNeedle', () => ({
  default: ({ score }: { score: number }) => <div data-testid="pie-chart" data-score={score}>Score:{score}</div>
}))

describe('Financial Section Mobile Layout', () => {
  const mockPropertyData = {
    address: '123 Long Property Address Street That Could Overflow On Mobile',
    propertyType: 'Single Family' as const,
    purchasePrice: 300000,
    currentValue: 320000,
    squareFootage: 2000,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2010,
    condition: 'Good' as const,
    downPayment: 60000,
    interestRate: 0.045,
    loanTerm: 30,
    closingCosts: 9000,
    pmiRate: 0.005,
    grossRent: 2500,
    vacancyRate: 0.05,
    propertyTaxes: 4800,
    insurance: 1200,
    propertyMgmt: 200,
    maintenance: 150,
    utilities: 100,
    hoaFees: 0,
    equipment: 50,
    rehabCosts: 5000,
    imageUrl: 'test.jpg',
    rentableRooms: []
  }

  const mockResults = {
    monthlyPayment: 1347,
    monthlyCashFlow: 658,
    annualCashFlow: 7896,
    monthlyOperatingExpenses: 495,
    totalAnnualExpenses: 5940,
    roi: 13.16,
    capRate: 8.2,
    cashOnCashReturn: 13.16,
    debtServiceCoverageRatio: 1.85,
    totalCashInvested: 74000,
    loanAmount: 240000,
    npv: 15000,
    irr: 0.14,
    netOperatingIncome: 24000,
    effectiveGrossIncome: 28500,
    recommendation: 'BUY' as const,
    investmentScore: 85,
    investmentRecommendation: 'Strong Buy',
    investmentReasons: ['High cash flow potential', 'Strong appreciation outlook'],
    recommendationScore: 85,
    recommendationReasons: ['Excellent cash flow', 'Good cap rate', 'Strong market'],
    monthlyProjections: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      year: 2024,
      grossRent: 2500,
      vacancyLoss: 125,
      effectiveGrossIncome: 2375,
      operatingExpenses: 495,
      netOperatingIncome: 1880,
      debtService: 1347,
      cashFlow: 533,
      cumulativeCashFlow: (i + 1) * 533
    })),
    annualProjections: Array.from({ length: 30 }, (_, i) => ({
      year: i + 1,
      grossRent: 2500 * 12 * Math.pow(1.025, i),
      vacancyLoss: 2500 * 12 * 0.05 * Math.pow(1.025, i),
      effectiveGrossIncome: 2500 * 12 * 0.95 * Math.pow(1.025, i),
      operatingExpenses: 495 * 12 * Math.pow(1.025, i),
      netOperatingIncome: (2500 * 12 * 0.95 - 495 * 12) * Math.pow(1.025, i),
      debtService: 1347 * 12,
      cashFlow: 533 * 12 * Math.pow(1.025, i),
      cumulativeCashFlow: ((i + 1) * 533 * 12 * Math.pow(1.025, i / 2)),
      propertyValue: 320000 * Math.pow(1.03, i),
      equity: 80000 + (i * 2000),
      totalReturn: 15000 + (i * 3000),
      roi: 13.16 + (i * 0.1)
    }))
  }

  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com', role: 'USER' } },
      status: 'authenticated'
    })
  })

  it('should have responsive grid layout for Key Metrics on mobile', () => {
    const { container } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="financial"
      />
    )

    // Find the Key Metrics grid container
    const keyMetricsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
    expect(keyMetricsGrid).toBeInTheDocument()

    // Check that all 4 key metric cards are present
    expect(screen.getByText('ROI')).toBeInTheDocument()
    expect(screen.getByText('Monthly Cash Flow')).toBeInTheDocument()
    expect(screen.getByText('Cap Rate')).toBeInTheDocument()
    expect(screen.getByText('NPV')).toBeInTheDocument()

    // The grid should stack on mobile (single column), 2 cols on medium, 4 on large
    expect(keyMetricsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
  })

  it('should have responsive layout for Financial Metrics tab content', () => {
    const { container } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="financial"
      />
    )

    // Ensure we're on the financial tab
    const financialTab = screen.getByRole('tab', { name: /Financial Metrics/i })
    fireEvent.click(financialTab)

    // Find the Financial Metrics grid (Income & Expenses + Investment Ratios)
    const financialMetricsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.gap-6')
    expect(financialMetricsGrid).toBeInTheDocument()

    // Check that both cards are present
    expect(screen.getByText('Income & Expenses')).toBeInTheDocument()
    expect(screen.getByText('Investment Ratios')).toBeInTheDocument()

    // Should stack on mobile, side-by-side on medium+
    expect(financialMetricsGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6')
  })

  it('should have proper spacing in financial data tables on mobile', () => {
    const { container } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="monthly"
      />
    )

    // Switch to monthly tab to test table layout
    const monthlyTab = screen.getByRole('tab', { name: /Monthly Analysis/i })
    fireEvent.click(monthlyTab)

    // Find the monthly projections table
    const monthlyTable = container.querySelector('table')
    expect(monthlyTable).toBeInTheDocument()

    // Check that table has overflow handling for mobile
    const tableContainer = monthlyTable?.closest('.overflow-x-auto')
    expect(tableContainer).toBeInTheDocument()

    // Verify table headers are present
    expect(screen.getByText('Month')).toBeInTheDocument()
    expect(screen.getByText('Gross Rent')).toBeInTheDocument()
    expect(screen.getByText('Cash Flow')).toBeInTheDocument()
  })

  it('should have proper spacing in projections table on mobile', () => {
    const { container } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="projections"
      />
    )

    // Switch to projections tab to test table layout
    const projectionsTab = screen.getByRole('tab', { name: /Projections/i })
    fireEvent.click(projectionsTab)

    // Find the projections table
    const projectionsTable = container.querySelector('table')
    expect(projectionsTable).toBeInTheDocument()

    // Check that table has overflow handling for mobile
    const tableContainer = projectionsTable?.closest('.overflow-x-auto')
    expect(tableContainer).toBeInTheDocument()

    // Verify table headers are present and properly spaced
    expect(screen.getByText('Year')).toBeInTheDocument()
    expect(screen.getByText('Gross Rent')).toBeInTheDocument()
    expect(screen.getByText('Property Value')).toBeInTheDocument()
    expect(screen.getByText('Total Return')).toBeInTheDocument()

    // Check that table cells have proper padding classes
    const tableHeaders = container.querySelectorAll('th')
    tableHeaders.forEach(header => {
      expect(header).toHaveClass('py-2')
    })
  })

  it('should improve mobile table readability with better spacing', () => {
    const { container } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="projections"
      />
    )

    // Switch to projections tab
    const projectionsTab = screen.getByRole('tab', { name: /Projections/i })
    fireEvent.click(projectionsTab)

    // Check if table has responsive text sizing
    const table = container.querySelector('table')
    expect(table).toHaveClass('text-sm')

    // Table cells should have adequate padding for mobile
    const tableCells = container.querySelectorAll('td')
    if (tableCells.length > 0) {
      tableCells.forEach(cell => {
        expect(cell).toHaveClass('py-2')
      })
    }
  })

  it('should handle long property addresses without breaking layout', () => {
    render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="financial"
      />
    )

    // The long address should be displayed
    expect(screen.getByText(/123 Long Property Address Street/)).toBeInTheDocument()

    // Property Summary section should handle long text properly
    expect(screen.getByText('Property Summary')).toBeInTheDocument()
  })

  it('should have mobile-optimized spacing for Operating Expenses breakdown', () => {
    const { container } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="financial"
      />
    )

    // Check for Operating Expenses section
    expect(screen.getByText('Monthly Operating Expenses')).toBeInTheDocument()

    // Find the operating expenses grid
    const expensesGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3')
    expect(expensesGrid).toBeInTheDocument()

    // Should stack on mobile, 2 cols on medium, 3 on large
    expect(expensesGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')

    // Individual expense items should have proper spacing
    const expenseItems = container.querySelectorAll('.flex.justify-between.items-center.p-3.bg-gray-50.rounded-lg')
    expect(expenseItems.length).toBeGreaterThan(0)
  })
})