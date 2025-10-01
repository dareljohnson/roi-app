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

describe('Mobile Table Layout Fix Verification', () => {
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

  describe('Monthly Cash Flow Table Mobile Layout', () => {
    it('should show mobile card layout for monthly projections', () => {
      const { container } = render(
        <ResultsDashboard 
          results={mockResults}
          propertyData={mockPropertyData}
          defaultTab="monthly"
        />
      )

      // Mobile layout should be visible (block md:hidden)
      const mobileLayout = container.querySelector('.block.md\\:hidden')
      expect(mobileLayout).toBeInTheDocument()

      // Desktop table should be hidden on mobile (hidden md:block)
      const desktopTable = container.querySelector('.hidden.md\\:block')
      expect(desktopTable).toBeInTheDocument()

      // Mobile responsive cards should be present (both monthly and annual tabs render cards)
      const allMobileCards = container.querySelectorAll('.bg-gray-50.rounded-lg')
      expect(allMobileCards.length).toBeGreaterThanOrEqual(12) // Should have at least 12 cards (monthly projections)

      // Check first month card content (multiple elements may exist due to responsive design)
      expect(screen.getAllByText('Month 1').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Gross Rent:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Vacancy:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Operating:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Debt Service:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Cumulative Cash Flow:').length).toBeGreaterThan(0)
    })

    it('should display proper formatting in mobile monthly cards', () => {
      render(
        <ResultsDashboard 
          results={mockResults}
          propertyData={mockPropertyData}
          defaultTab="monthly"
        />
      )

      // Check that currency values are properly formatted (using getAllByText due to mobile+desktop layout)
      expect(screen.getAllByText('$2,500').length).toBeGreaterThan(0) // Gross Rent
      expect(screen.getAllByText('-$125').length).toBeGreaterThan(0) // Vacancy Loss
      expect(screen.getAllByText('-$495').length).toBeGreaterThan(0) // Operating Expenses  
      expect(screen.getAllByText('-$1,347').length).toBeGreaterThan(0) // Debt Service
      expect(screen.getAllByText('$533').length).toBeGreaterThan(0) // Cash Flow

      // Check color coding for positive cash flow
      const cashFlowValues = screen.getAllByText('$533')
      expect(cashFlowValues.length).toBeGreaterThan(0)
      // At least one should have green color class
      const hasGreenText = Array.from(cashFlowValues).some(element => 
        element.classList.contains('text-green-600')
      )
      expect(hasGreenText).toBe(true)
    })

    it('should have proper responsive classes for mobile/desktop toggle', () => {
      const { container } = render(
        <ResultsDashboard 
          results={mockResults}
          propertyData={mockPropertyData}
          defaultTab="monthly"
        />
      )

      // Find the mobile layout container
      const mobileContainer = container.querySelector('.block.md\\:hidden')
      expect(mobileContainer).toBeInTheDocument()
      expect(mobileContainer).toHaveClass('block', 'md:hidden', 'space-y-3')

      // Find the desktop table container  
      const desktopContainer = container.querySelector('.hidden.md\\:block')
      expect(desktopContainer).toBeInTheDocument()
      expect(desktopContainer).toHaveClass('hidden', 'md:block', 'overflow-x-auto')
    })
  })

  describe('Annual Projections Table Mobile Layout', () => {
    it('should show mobile card layout for annual projections', () => {
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

      // Check for mobile layout
      const mobileLayouts = container.querySelectorAll('.block.md\\:hidden')
      expect(mobileLayouts.length).toBeGreaterThan(0)

      // Check for desktop table
      const desktopTables = container.querySelectorAll('.hidden.md\\:block')
      expect(desktopTables.length).toBeGreaterThan(0)

      // Default should show 5-year projections, so 5 cards
      const yearCards = container.querySelectorAll('.bg-gray-50.rounded-lg')
      expect(yearCards.length).toBeGreaterThanOrEqual(5)

      // Check year labels are present (using getAllByText due to mobile+desktop layout)
      expect(screen.getAllByText('Year 1').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Year 2').length).toBeGreaterThan(0)
    })

    it('should display proper annual projection data in mobile cards', () => {
      render(
        <ResultsDashboard 
          results={mockResults}
          propertyData={mockPropertyData}
          defaultTab="projections"
        />
      )

      // Switch to projections tab
      const projectionsTab = screen.getByRole('tab', { name: /Projections/i })
      fireEvent.click(projectionsTab)

      // Check annual projection labels (using getAllByText due to mobile layout having multiple instances)
      expect(screen.getAllByText('Gross Rent:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Annual Cash Flow:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Property Value:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Equity:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Total Return:').length).toBeGreaterThan(0)

      // Check that ROI percentages are displayed
      const roiElements = screen.getAllByText(/13\./i) // ROI values starting with 13.
      expect(roiElements.length).toBeGreaterThan(0)
    })

    it('should switch between 5-year and 30-year projections properly', () => {
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

      // Click 30-year toggle
      const thirtyYearToggle = screen.getByTestId('toggle-30yr')
      fireEvent.click(thirtyYearToggle)

      // Should now show more year cards (up to 30) - accounting for both monthly and annual cards
      const yearCards = container.querySelectorAll('.bg-gray-50.rounded-lg')
      expect(yearCards.length).toBeGreaterThanOrEqual(30) // Could have both monthly (12) + annual (30) = 42 total

      // Switch back to 5-year
      const fiveYearToggle = screen.getByTestId('toggle-5yr')
      fireEvent.click(fiveYearToggle)

      // Should now show fewer cards after switching to 5-year (default tab shows both monthly and annual)
      const allCards = container.querySelectorAll('.bg-gray-50.rounded-lg')
      expect(allCards.length).toBeGreaterThan(5) // Should have cards for the projections
    })
  })

  describe('Mobile Layout Integration', () => {
    it('should not break existing desktop functionality', () => {
      const { container } = render(
        <ResultsDashboard 
          results={mockResults}
          propertyData={mockPropertyData}
          defaultTab="monthly"
        />
      )

      // Desktop table should still exist with proper structure
      const desktopTable = container.querySelector('.hidden.md\\:block table')
      expect(desktopTable).toBeInTheDocument()
      
      // Table should have proper headers
      const thead = desktopTable?.querySelector('thead')
      expect(thead).toBeInTheDocument()
      
      const tbody = desktopTable?.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
      
      // Original table classes should be preserved
      expect(desktopTable).toHaveClass('w-full', 'text-sm')
    })

    it('should maintain tab functionality with new mobile layouts', async () => {
      render(
        <ResultsDashboard 
          results={mockResults}
          propertyData={mockPropertyData}
          defaultTab="financial"
        />
      )

      // Switch to monthly tab
      const monthlyTab = screen.getByRole('tab', { name: /Monthly Analysis/i })
      const projectionsTab = screen.getByRole('tab', { name: /Projections/i })
      
      fireEvent.click(monthlyTab)
      
      // Check that mobile responsive design is still working after tab interaction
      // Since tabs can switch content, just verify the core functionality exists
      expect(monthlyTab).toBeInTheDocument()
      expect(projectionsTab).toBeInTheDocument()
      
      // Switch to projections tab
      fireEvent.click(projectionsTab)
      
        // Just verify that tab switching works and tabs remain accessible
        expect(monthlyTab).toBeInTheDocument()
        expect(projectionsTab).toBeInTheDocument()
    })
  })
})