/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { ResultsDashboard } from '@/components/dashboard/ResultsDashboard'
import { CalculationResults, PropertyAnalysisInput } from '@/types/property'

const mockResults: CalculationResults = {
  monthlyPayment: 1000,
  monthlyCashFlow: 200,
  monthlyOperatingExpenses: 300,
  annualCashFlow: 2400,
  netOperatingIncome: 5000,
  effectiveGrossIncome: 10000,
  totalAnnualExpenses: 3600,
  roi: 10,
  capRate: 5,
  cashOnCashReturn: 8,
  debtServiceCoverageRatio: 1.2,
  totalCashInvested: 50000,
  loanAmount: 200000,
  npv: 10000,
  irr: 12,
  recommendation: 'BUY',
  recommendationScore: 90,
  recommendationReasons: ['Strong monthly cash flow', 'Good ROI'],
  monthlyProjections: [],
  annualProjections: []
}

const mockPropertyData: PropertyAnalysisInput = {
  address: '123 Long Property Address Name That Could Cause Overflow',
  propertyType: 'Single Family',
  purchasePrice: 250000,
  downPayment: 50000,
  interestRate: 0.045,
  loanTerm: 30,
  closingCosts: 5000,
  pmiRate: 0.005,
  grossRent: 2000,
  vacancyRate: 0.05,
  propertyTaxes: 3000,
  insurance: 1200,
  propertyMgmt: 100,
  maintenance: 150,
  utilities: 0,
  hoaFees: 0,
  equipment: 0,
  rehabCosts: 0,
  imageUrl: '/uploads/test-property.jpg', // <-- Ensure photo exists for test
  rentalStrategy: 'entire-house' // <-- Add required field for type
}

// Helper function to render with SessionProvider
const renderWithSession = (component: React.ReactElement) => {
  return render(
    <SessionProvider session={null}>
      {component}
    </SessionProvider>
  )
}

describe('Investment Recommendation Mobile Layout', () => {
  it('should display investment recommendation without overflow on mobile', () => {
    const { container } = renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    )

    // Check that Investment Recommendation text is present
    expect(screen.getByText(/Investment Recommendation:/)).toBeInTheDocument()
    
    // Look for the recommendation text that should be split across elements
    const recommendationText = container.querySelector('[class*="border-2"]') // Investment recommendation card
    expect(recommendationText).toBeInTheDocument()
    expect(recommendationText?.textContent).toContain('Investment Recommendation: BUY')
    expect(recommendationText?.textContent).toContain('90/100')

    // Find the CardTitle that should have responsive layout - this is where the overflow was happening
    const cardTitle = recommendationText?.querySelector('[class*="flex flex-col sm:flex-row"]')
    expect(cardTitle).toBeInTheDocument()
  })

  it('should use responsive flex layout to prevent mobile overflow', () => {
    const { container } = renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    )

    // Look for the Investment Recommendation card
    const investmentCard = container.querySelector('[class*="border-2"]')
    expect(investmentCard).toBeInTheDocument()

    // Look for the CardTitle with responsive layout classes
    const cardTitle = investmentCard?.querySelector('[class*="flex flex-col sm:flex-row"]')
    expect(cardTitle).toBeInTheDocument()

    // Verify it has the correct responsive classes to prevent overflow
    expect(cardTitle).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'sm:justify-between', 'gap-2')

    // The title should contain both the recommendation text and score
    expect(cardTitle?.textContent).toContain('Investment Recommendation: BUY')
    expect(cardTitle?.textContent).toContain('90/100')
  })

  it('should maintain readability of recommendation reasons', () => {
    renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    )

    // Check that recommendation reasons are displayed properly
    expect(screen.getByText('• Strong monthly cash flow')).toBeInTheDocument()
    expect(screen.getByText('• Good ROI')).toBeInTheDocument()
  })

  it('should handle different recommendation types without overflow', () => {
    const considerResults = {
      ...mockResults,
      recommendation: 'CONSIDER' as const,
      recommendationScore: 65
    }

    const { container } = renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={considerResults}
      />
    )

    const investmentCard = container.querySelector('[class*="border-2"]')
    expect(investmentCard).toBeInTheDocument()
    expect(investmentCard?.textContent).toContain('Investment Recommendation: CONSIDER')
    expect(investmentCard?.textContent).toContain('65/100')

    const failResults = {
      ...mockResults,
      recommendation: 'FAIL' as const,
      recommendationScore: 35
    }

    const { container: container2 } = renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={failResults}
      />
    )

    const investmentCard2 = container2.querySelector('[class*="border-2"]')
    expect(investmentCard2?.textContent).toContain('Investment Recommendation: FAIL')
    expect(investmentCard2?.textContent).toContain('35/100')
  })
})