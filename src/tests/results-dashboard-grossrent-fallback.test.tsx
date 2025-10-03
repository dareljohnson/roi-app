import { render, screen } from '@testing-library/react'
import { ResultsDashboard } from '@/components/dashboard/ResultsDashboard'
import type { CalculationResults, PropertyAnalysisInput } from '@/types/property'

// Minimal helper to fabricate CalculationResults for the component
function makeResults(overrides: Partial<CalculationResults> = {}): CalculationResults {
  return {
    monthlyPayment: 0,
    monthlyCashFlow: 0,
    monthlyOperatingExpenses: 0,
    annualCashFlow: 0,
    netOperatingIncome: 0,
    effectiveGrossIncome: 0,
    totalAnnualExpenses: 0,
    roi: 0,
    capRate: 0,
    cashOnCashReturn: 0,
    debtServiceCoverageRatio: 0,
    totalCashInvested: 0,
    loanAmount: 0,
    npv: 0,
    recommendation: 'CONSIDER',
    recommendationScore: 50,
    recommendationReasons: ['Test'],
    monthlyProjections: [],
    annualProjections: [],
    ...overrides
  }
}

describe('ResultsDashboard grossRent fallback', () => {
  test('uses rentableRooms weekly rates when grossRent is undefined', () => {
    const propertyData: any = {
      address: '123 Test St',
      propertyType: 'Single Family',
      purchasePrice: 200000,
      downPayment: 40000,
      interestRate: 7,
      loanTerm: 30,
      vacancyRate: 0.05,
      rentalStrategy: 'individual-rooms',
      rentableRooms: [
        { roomNumber: 1, weeklyRate: 150 },
        { roomNumber: 2, weeklyRate: 175 },
      ],
      // grossRent intentionally omitted
      propertyTaxes: 0,
      insurance: 0,
      propertyMgmt: 0,
      maintenance: 0,
      utilities: 0,
      hoaFees: 0,
      equipment: 0,
      rehabCosts: 0,
    } as Partial<PropertyAnalysisInput>

    render(<ResultsDashboard results={makeResults()} propertyData={propertyData as PropertyAnalysisInput} />)

    // Weekly total = 150 + 175 = 325 * 4 = 1300 monthly
    expect(screen.getByText(/Monthly Gross Rent:/i).nextSibling?.textContent).toMatch(/1,300/)
  })

  test('prefers explicit grossRent when provided', () => {
    const propertyData: any = {
      address: '456 Rent Ln',
      propertyType: 'Single Family',
      purchasePrice: 300000,
      downPayment: 60000,
      interestRate: 7,
      loanTerm: 30,
      vacancyRate: 0.1,
      rentalStrategy: 'entire-house',
      grossRent: 2500,
      rentableRooms: [ { roomNumber: 1, weeklyRate: 999 } ], // should be ignored because grossRent exists
      propertyTaxes: 0,
      insurance: 0,
      propertyMgmt: 0,
      maintenance: 0,
      utilities: 0,
      hoaFees: 0,
      equipment: 0,
      rehabCosts: 0,
    } as Partial<PropertyAnalysisInput>

    render(<ResultsDashboard results={makeResults()} propertyData={propertyData as PropertyAnalysisInput} />)

    expect(screen.getByText(/Monthly Gross Rent:/i).nextSibling?.textContent).toMatch(/2,500/)
  })
})
