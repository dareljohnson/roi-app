/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('Mobile Table Issue Reproduction', () => {
  const mockPropertyData = {
    address: '123 Mobile Test Street',
    propertyType: 'Single Family' as const,
    purchasePrice: 300000,
    currentValue: 320000,
    squareFootage: 2000,
    bedrooms: 3,
    bathrooms: 2,
    grossRent: 2500,
    vacancyRate: 0.05,
    propertyTaxes: 3600,
    insurance: 1200,
    maintenance: 1800,
    utilities: 0,
    propertyMgmt: 0,
    hoaFees: 0,
    equipment: 0,
    downPayment: 60000,
    loanTerm: 30,
    interestRate: 0.075,
    closingCosts: 6000,
    rehabCosts: 8000,
    pmiRate: 0.005
  }

  const mockResults = {
    monthlyPayment: 1677,
    monthlyCashFlow: 533,
    monthlyOperatingExpenses: 495,
    annualCashFlow: 6396,
    netOperatingIncome: 24000,
    effectiveGrossIncome: 28500,
    totalAnnualExpenses: 5940,
    roi: 13.16,
    capRate: 8.0,
    cashOnCashReturn: 13.16,
    debtServiceCoverageRatio: 1.85,
    totalCashInvested: 74000,
    loanAmount: 240000,
    npv: 15000,
    irr: 0.14,
    recommendation: 'BUY' as const,
    recommendationScore: 85,
    recommendationReasons: ['Excellent cash flow', 'Good cap rate', 'Strong market'],
    monthlyProjections: [
      {
        month: 1,
        year: 2024,
        grossRent: 2500,
        vacancyLoss: 125,
        effectiveGrossIncome: 2375,
        operatingExpenses: 495,
        netOperatingIncome: 1880,
        debtService: 1347,
        cashFlow: 533,
        cumulativeCashFlow: 533
      },
      {
        month: 2,
        year: 2024,
        grossRent: 2500,
        vacancyLoss: 125,
        effectiveGrossIncome: 2375,
        operatingExpenses: 495,
        netOperatingIncome: 1880,
        debtService: 1347,
        cashFlow: 533,
        cumulativeCashFlow: 1066
      },
      {
        month: 3,
        year: 2024,
        grossRent: 2500,
        vacancyLoss: 125,
        effectiveGrossIncome: 2375,
        operatingExpenses: 495,
        netOperatingIncome: 1880,
        debtService: 1347,
        cashFlow: 533,
        cumulativeCashFlow: 1599
      }
    ],
    annualProjections: Array.from({ length: 5 }, (_, i) => ({
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

  it('should reproduce the jumbled mobile table issue', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone SE width
    })

    const { container } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="monthly"
      />
    )

    // Check if we're on the monthly tab (12-Month Cash Flow Projection)
    expect(screen.getByText('12-Month Cash Flow Projection')).toBeInTheDocument()

    // Find the table
    const table = container.querySelector('table')
    expect(table).toBeInTheDocument()

    // Check table headers for mobile readability
    const headers = container.querySelectorAll('th')
    console.log('Table headers found:', headers.length)
    headers.forEach((header, index) => {
      console.log(`Header ${index}: ${header.textContent}`)
    })

    // Check table content alignment
    const cells = container.querySelectorAll('td')
    console.log('Table cells found:', cells.length)
    
    // First few cells should be month data
    if (cells.length > 0) {
      console.log('First cell content:', cells[0].textContent)
    }

    // Check if table has proper responsive classes
    expect(table).toHaveClass('w-full', 'text-sm')
    
    // Check if container has overflow handling
    const tableContainer = table?.closest('.overflow-x-auto')
    expect(tableContainer).toBeInTheDocument()

    // Check if headers have proper text alignment
    const monthHeader = screen.getByText('Month')
    const grossRentHeader = screen.getByText('Gross Rent')
    const vacancyHeader = screen.getByText('Vacancy')
    const operatingHeader = screen.getByText('Operating')
    const debtServiceHeader = screen.getByText('Debt Service')
    const cashFlowHeader = screen.getByText('Cash Flow')
    const cumulativeHeader = screen.getByText('Cumulative')

    // Check alignment classes
    expect(monthHeader.closest('th')).toHaveClass('text-left')
    expect(grossRentHeader.closest('th')).toHaveClass('text-right')
    expect(vacancyHeader.closest('th')).toHaveClass('text-right')
    expect(operatingHeader.closest('th')).toHaveClass('text-right')
    expect(debtServiceHeader.closest('th')).toHaveClass('text-right')
    expect(cashFlowHeader.closest('th')).toHaveClass('text-right')
    expect(cumulativeHeader.closest('th')).toHaveClass('text-right')
  })

  it('should test table column widths and overflow behavior', () => {
    const { container } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="monthly"
      />
    )

    const table = container.querySelector('table')
    expect(table).toBeInTheDocument()

    // Check if table container handles horizontal scrolling
    const scrollContainer = table?.closest('.overflow-x-auto')
    expect(scrollContainer).toBeInTheDocument()

    // Check table styling
    expect(table).toHaveClass('w-full', 'text-sm')

    // Log table structure for debugging
    const thead = table?.querySelector('thead')
    const tbody = table?.querySelector('tbody')
    
    console.log('Table structure:')
    console.log('- Has thead:', !!thead)
    console.log('- Has tbody:', !!tbody)
    
    if (thead) {
      const headerRow = thead.querySelector('tr')
      const headerCells = headerRow?.querySelectorAll('th')
      console.log('- Header cells:', headerCells?.length)
    }
    
    if (tbody) {
      const bodyRows = tbody.querySelectorAll('tr')
      console.log('- Body rows:', bodyRows.length)
      if (bodyRows.length > 0) {
        const firstRowCells = bodyRows[0].querySelectorAll('td')
        console.log('- First row cells:', firstRowCells.length)
      }
    }
  })

  it('should verify mobile-specific table improvements are needed', () => {
    const { container } = render(
      <ResultsDashboard 
        results={mockResults}
        propertyData={mockPropertyData}
        defaultTab="monthly"
      />
    )

    // The table should exist but may need mobile improvements
    const table = container.querySelector('table')
    expect(table).toBeInTheDocument()

    // Current issues to address:
    // 1. Table may be too wide for mobile screens
    // 2. Column headers may be compressed
    // 3. Data may not align properly on small screens
    
    // Test current column count - 7 columns is quite a lot for mobile
    const headerRow = container.querySelector('thead tr')
    const headers = headerRow?.querySelectorAll('th')
    expect(headers?.length).toBe(7) // This is the problem - too many columns for mobile
    
    // Test if we have any mobile-specific styling
    // Currently, the table relies only on overflow-x-auto, which may not be enough
    const scrollContainer = table?.closest('.overflow-x-auto')
    expect(scrollContainer).toBeInTheDocument()
    
    // The table text is small (text-sm) but may still be hard to read on mobile
    expect(table).toHaveClass('text-sm')
  })
})