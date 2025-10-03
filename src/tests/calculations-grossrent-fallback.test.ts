import { calculatePropertyAnalysis } from '@/lib/calculations'
import type { PropertyAnalysisInput } from '@/types/property'

describe('calculatePropertyAnalysis grossRent fallback', () => {
  test('derives grossRent from rentableRooms when grossRent undefined', () => {
    const input: any = {
      address: 'Room Rental House',
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
        { roomNumber: 3, weeklyRate: 125 }
      ],
      // operating expenses minimal
      propertyTaxes: 0,
      insurance: 0,
      propertyMgmt: 0,
      maintenance: 0,
      utilities: 0,
      hoaFees: 0,
      equipment: 0,
      rehabCosts: 0,
      closingCosts: 0,
      pmiRate: 0
    } as Partial<PropertyAnalysisInput>

    // Weekly total = 150 + 175 + 125 = 450 * 4 = 1800 implied gross rent
    const results = calculatePropertyAnalysis(input as PropertyAnalysisInput)
    // Effective gross income should reflect derived rent * (1 - vacancy)
    expect(results.effectiveGrossIncome).toBeCloseTo(1800 * 12 * (1 - 0.05), 1)
    expect(results.monthlyOperatingExpenses).toBe(0)
    expect(results.monthlyCashFlow).not.toBeNaN()
  })

  test('uses provided grossRent over rentableRooms when both exist', () => {
    const input: any = {
      address: 'Provided Rent Wins',
      propertyType: 'Single Family',
      purchasePrice: 150000,
      downPayment: 30000,
      interestRate: 6,
      loanTerm: 30,
      vacancyRate: 0.1,
      rentalStrategy: 'individual-rooms',
      grossRent: 2500, // explicit
      rentableRooms: [ { roomNumber: 1, weeklyRate: 50 } ], // would be 200
      propertyTaxes: 0,
      insurance: 0,
      propertyMgmt: 0,
      maintenance: 0,
      utilities: 0,
      hoaFees: 0,
      equipment: 0,
      rehabCosts: 0,
      closingCosts: 0,
      pmiRate: 0
    } as Partial<PropertyAnalysisInput>

    const results = calculatePropertyAnalysis(input as PropertyAnalysisInput)
    // effectiveGrossIncome monthly basis -> 2500 * (1 - 0.1) * 12
    expect(results.effectiveGrossIncome).toBeCloseTo(2500 * 12 * 0.9, 1)
  })
})
