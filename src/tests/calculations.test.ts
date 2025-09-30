import {
  calculateMonthlyPayment,
  calculatePMI,
  calculateMonthlyOperatingExpenses,
  calculateNOI,
  calculateCapRate,
  calculateROI,
  calculateDSCR,
  calculateNPV,
  calculateIRR,
  generateRecommendation,
  calculatePropertyAnalysis
} from '@/lib/calculations'
import { PropertyAnalysisInput, CALCULATION_DEFAULTS } from '@/types/property'

describe('Real Estate Investment Calculations', () => {
  describe('vacancyRate edge cases', () => {
    test('defaults to 0.05 if vacancyRate is missing', () => {
      const input = { ...sampleInput };
      delete (input as any).vacancyRate;
      const results = calculatePropertyAnalysis(input as any);
      // Should use 0.05 (5%)
      expect(results.effectiveGrossIncome).toBeCloseTo(sampleInput.grossRent * (1 - 0.05) * 12, 1);
    });

    test('defaults to 0.05 if vacancyRate is empty string', () => {
      const input = { ...sampleInput, vacancyRate: '' as any };
      const results = calculatePropertyAnalysis(input as any);
      expect(results.effectiveGrossIncome).toBeCloseTo(sampleInput.grossRent * (1 - 0.05) * 12, 1);
    });

    test('defaults to 0.05 if vacancyRate is NaN', () => {
      const input = { ...sampleInput, vacancyRate: NaN as any };
      const results = calculatePropertyAnalysis(input as any);
      expect(results.effectiveGrossIncome).toBeCloseTo(sampleInput.grossRent * (1 - 0.05) * 12, 1);
    });

    test('defaults to 0.05 if vacancyRate is out of range (<0)', () => {
      const input = { ...sampleInput, vacancyRate: -1 };
      const results = calculatePropertyAnalysis(input as any);
      expect(results.effectiveGrossIncome).toBeCloseTo(sampleInput.grossRent * (1 - 0.05) * 12, 1);
    });

    test('defaults to 0.05 if vacancyRate is out of range (>1)', () => {
      const input = { ...sampleInput, vacancyRate: 2 };
      const results = calculatePropertyAnalysis(input as any);
      expect(results.effectiveGrossIncome).toBeCloseTo(sampleInput.grossRent * (1 - 0.05) * 12, 1);
    });
  });
  // Test data
  const sampleInput: PropertyAnalysisInput = {
    // Property details
    address: '123 Test Street',
    propertyType: 'Single Family',
    purchasePrice: 150000,
    currentValue: 155000,
    squareFootage: 1200,
    lotSize: 0.25,
    yearBuilt: 2005,
    bedrooms: 3,
    bathrooms: 2,
    condition: 'Good',
    
    // Financing
    downPayment: 30000, // 20%
    interestRate: 7.5,
    loanTerm: 30,
    closingCosts: 3000,
    pmiRate: 0,
    
    // Rental income
    grossRent: 1500,
    vacancyRate: 0.05,
    
    // Operating expenses
    propertyTaxes: 1800,
    insurance: 800,
    propertyMgmt: 150,
    maintenance: 100,
    utilities: 0,
    hoaFees: 0,
    equipment: 50,
    rehabCosts: 0,
  }

  describe('calculateMonthlyPayment', () => {
    test('calculates correct monthly payment for standard 30-year mortgage', () => {
      const payment = calculateMonthlyPayment(120000, 7.5, 30)
      expect(payment).toBeCloseTo(839.06, 2)
    })

    test('calculates correct monthly payment for 15-year mortgage', () => {
      const payment = calculateMonthlyPayment(120000, 7.5, 15)
      expect(payment).toBeCloseTo(1112.41, 2)
    })

    test('handles zero interest rate', () => {
      const payment = calculateMonthlyPayment(120000, 0, 30)
      expect(payment).toBeCloseTo(333.33, 2)
    })

    test('returns 0 for invalid inputs', () => {
      expect(calculateMonthlyPayment(0, 7.5, 30)).toBe(0)
      expect(calculateMonthlyPayment(120000, -1, 30)).toBe(0)
      expect(calculateMonthlyPayment(120000, 7.5, 0)).toBe(0)
    })
  })

  describe('calculatePMI', () => {
    test('calculates correct PMI payment', () => {
      const pmi = calculatePMI(120000, 0.5)
      expect(pmi).toBeCloseTo(50, 2)
    })

    test('returns 0 for zero PMI rate', () => {
      const pmi = calculatePMI(120000, 0)
      expect(pmi).toBe(0)
    })

    test('returns 0 for negative PMI rate', () => {
      const pmi = calculatePMI(120000, -0.5)
      expect(pmi).toBe(0)
    })
  })

  describe('calculateMonthlyOperatingExpenses', () => {
    test('calculates total monthly operating expenses', () => {
      const expenses = calculateMonthlyOperatingExpenses(sampleInput)
      // (1800 + 800) / 12 + 150 + 100 + 0 + 0 + 50 = 216.67 + 300 = 516.67
      expect(expenses).toBeCloseTo(516.67, 2)
    })

    test('handles missing optional expenses', () => {
      const minimalInput: PropertyAnalysisInput = {
        ...sampleInput,
        propertyTaxes: 0,
        insurance: 0,
        propertyMgmt: 0,
        maintenance: 0,
        utilities: 0,
        hoaFees: 0,
        equipment: 0,
      }
      const expenses = calculateMonthlyOperatingExpenses(minimalInput)
      expect(expenses).toBe(0)
    })
  })

  describe('calculateNOI', () => {
    test('calculates correct Net Operating Income', () => {
      const noi = calculateNOI(1500, 0.05, 500)
      // (1500 * 0.95 - 500) * 12 = (1425 - 500) * 12 = 925 * 12 = 11100
      expect(noi).toBe(11100)
    })

    test('handles 100% vacancy rate', () => {
      const noi = calculateNOI(1500, 1.0, 500)
      expect(noi).toBe(-6000) // (0 - 500) * 12
    })
  })

  describe('calculateCapRate', () => {
    test('calculates correct capitalization rate', () => {
      const capRate = calculateCapRate(12000, 150000)
      expect(capRate).toBe(8.0) // (12000 / 150000) * 100
    })

    test('returns 0 for zero property value', () => {
      const capRate = calculateCapRate(12000, 0)
      expect(capRate).toBe(0)
    })

    test('handles negative NOI', () => {
      const capRate = calculateCapRate(-6000, 150000)
      expect(capRate).toBe(-4.0)
    })
  })

  describe('calculateROI', () => {
    test('calculates correct return on investment', () => {
      const roi = calculateROI(6000, 30000)
      expect(roi).toBe(20.0) // (6000 / 30000) * 100
    })

    test('returns 0 for zero cash invested', () => {
      const roi = calculateROI(6000, 0)
      expect(roi).toBe(0)
    })

    test('handles negative cash flow', () => {
      const roi = calculateROI(-3000, 30000)
      expect(roi).toBe(-10.0)
    })
  })

  describe('calculateDSCR', () => {
    test('calculates correct debt service coverage ratio', () => {
      const dscr = calculateDSCR(12000, 10000)
      expect(dscr).toBe(1.2) // 12000 / 10000
    })

    test('returns 0 for zero debt service', () => {
      const dscr = calculateDSCR(12000, 0)
      expect(dscr).toBe(0)
    })
  })

  describe('calculateNPV', () => {
    test('calculates correct net present value', () => {
      const npv = calculateNPV(30000, [5000, 5000, 5000, 5000, 5000], 0.08)
      expect(npv).toBeGreaterThan(-11000)
      expect(npv).toBeLessThan(5000)
    })

    test('handles negative cash flows', () => {
      const npv = calculateNPV(30000, [-1000, -1000, -1000, -1000, -1000], 0.08)
      expect(npv).toBeLessThan(-30000)
    })
  })

  describe('calculateIRR', () => {
    test('calculates IRR for positive cash flows', () => {
      const irr = calculateIRR(30000, [8000, 8000, 8000, 8000, 8000])
      expect(irr).toBeGreaterThan(0)
      expect(irr).toBeLessThan(50)
    })

    test('returns null for impossible scenarios', () => {
      const irr = calculateIRR(30000, [-1000, -1000, -1000, -1000, -1000])
      expect(irr).toBeNull()
    })
  })

  describe('generateRecommendation', () => {
    test('recommends BUY for excellent metrics', () => {
      const result = generateRecommendation(15, 8, 300, 1.5, 10000)
      expect(result.recommendation).toBe('BUY')
      expect(result.score).toBeGreaterThan(80)
      expect(result.reasons.length).toBeGreaterThan(0)
    })

    test('recommends FAIL for poor metrics', () => {
      const result = generateRecommendation(2, 3, -100, 0.8, -5000)
      expect(result.recommendation).toBe('FAIL')
      expect(result.score).toBeLessThan(60)
    })

    test('recommends CONSIDER for moderate metrics', () => {
      const result = generateRecommendation(8, 6, 100, 1.2, 0)
      expect(result.recommendation).toBe('CONSIDER')
      expect(result.score).toBeGreaterThanOrEqual(60)
      expect(result.score).toBeLessThan(80)
    })
  })

  describe('calculatePropertyAnalysis', () => {
    test('performs complete property analysis with valid results', () => {
      const results = calculatePropertyAnalysis(sampleInput)

      // Validate structure
      expect(results).toHaveProperty('monthlyPayment')
      expect(results).toHaveProperty('monthlyCashFlow')
      expect(results).toHaveProperty('roi')
      expect(results).toHaveProperty('capRate')
      expect(results).toHaveProperty('npv')
      expect(results).toHaveProperty('recommendation')
      expect(results).toHaveProperty('monthlyProjections')
      expect(results).toHaveProperty('annualProjections')

      // Validate data types
      expect(typeof results.monthlyPayment).toBe('number')
      expect(typeof results.roi).toBe('number')
      expect(Array.isArray(results.monthlyProjections)).toBe(true)
      expect(Array.isArray(results.annualProjections)).toBe(true)
      expect(Array.isArray(results.recommendationReasons)).toBe(true)

      // Validate monthly projections
      expect(results.monthlyProjections).toHaveLength(12)
      results.monthlyProjections.forEach((projection, index) => {
        expect(projection.month).toBe(index + 1)
        expect(projection.year).toBe(1)
        expect(typeof projection.grossRent).toBe('number')
        expect(typeof projection.cashFlow).toBe('number')
      })

      // Validate annual projections
      expect(results.annualProjections).toHaveLength(30)
      results.annualProjections.forEach((projection, index) => {
        expect(projection.year).toBe(index + 1)
        expect(typeof projection.roi).toBe('number')
        expect(typeof projection.propertyValue).toBe('number')
      })

      // Validate recommendation
  expect(['BUY', 'FAIL', 'CONSIDER']).toContain(results.recommendation)
      expect(results.recommendationScore).toBeGreaterThanOrEqual(0)
      expect(results.recommendationScore).toBeLessThanOrEqual(100)
    })

    test('handles edge case with minimal down payment requiring PMI', () => {
      const inputWithPMI = {
        ...sampleInput,
        downPayment: 7500, // 5% down
        pmiRate: 0.5
      }

      const results = calculatePropertyAnalysis(inputWithPMI)
      expect(results.monthlyPayment).toBeGreaterThan(0)
      expect(results.totalCashInvested).toBe(10500) // 7500 + 3000 closing
    })

    test('handles cash purchase (no financing)', () => {
      const cashInput = {
        ...sampleInput,
        downPayment: 150000, // Full cash purchase
        interestRate: 0,
        loanTerm: 30
      }

      const results = calculatePropertyAnalysis(cashInput)
      expect(results.loanAmount).toBe(0)
      expect(results.monthlyPayment).toBe(0)
      expect(results.monthlyCashFlow).toBeGreaterThan(0)
    })

    test('calculates correct cash-on-cash return', () => {
      const results = calculatePropertyAnalysis(sampleInput)
      expect(results.cashOnCashReturn).toBe(results.roi) // Should be the same calculation
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('handles extremely high vacancy rates', () => {
      const highVacancyInput = { ...sampleInput, vacancyRate: 0.5 } // 50% vacancy
      const results = calculatePropertyAnalysis(highVacancyInput)
      
      expect(results.monthlyCashFlow).toBeLessThan(0)
  expect(results.recommendation).toBe('FAIL')
    })

    test('handles zero rent scenario', () => {
      const zeroRentInput = { ...sampleInput, grossRent: 0 }
      const results = calculatePropertyAnalysis(zeroRentInput)
      
      expect(results.monthlyCashFlow).toBeLessThan(0)
      expect(results.roi).toBeLessThan(0)
  expect(results.recommendation).toBe('FAIL')
    })

    test('handles high interest rates', () => {
      const highRateInput = { ...sampleInput, interestRate: 15 }
      const results = calculatePropertyAnalysis(highRateInput)
      
      expect(results.monthlyPayment).toBeGreaterThan(1000)
      expect(results.monthlyCashFlow).toBeLessThan(0)
    })
  })

  describe('Calculation Accuracy', () => {
    test('monthly and annual metrics are consistent', () => {
      const results = calculatePropertyAnalysis(sampleInput)
      
      // Annual cash flow should be 12x monthly (approximately, accounting for rounding)
      const annualFromMonthly = results.monthlyCashFlow * 12
      expect(Math.abs(results.annualCashFlow - annualFromMonthly)).toBeLessThan(1)
      
      // NOI should be positive for a good deal
      expect(results.netOperatingIncome).toBeGreaterThan(0)
      
      // Total cash invested should include down payment and closing costs
      expect(results.totalCashInvested).toBe(
        sampleInput.downPayment + (sampleInput.closingCosts || 0) + (sampleInput.rehabCosts || 0)
      )
    })

    test('projections show realistic growth patterns', () => {
      const results = calculatePropertyAnalysis(sampleInput)
      
  // Property values should generally increase over time
  const firstYear = results.annualProjections[0]
  const year5 = results.annualProjections[4]
  const year30 = results.annualProjections[29]
  expect(year5.propertyValue).toBeGreaterThan(firstYear.propertyValue)
  expect(year30.propertyValue).toBeGreaterThan(year5.propertyValue)

  // Rent should increase over time
  expect(year5.grossRent).toBeGreaterThan(firstYear.grossRent)
  expect(year30.grossRent).toBeGreaterThan(year5.grossRent)

  // Equity should build over time
  expect(year5.equity).toBeGreaterThan(firstYear.equity)
  expect(year30.equity).toBeGreaterThan(year5.equity)
    })
  })
})