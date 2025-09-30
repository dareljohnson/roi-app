import { 
  PropertyAnalysisInput, 
  CalculationResults, 
  MonthlyProjection, 
  AnnualProjection,
  CALCULATION_DEFAULTS 
} from '@/types/property'

/**
 * Calculate monthly mortgage payment using standard amortization formula
 * P&I = L[c(1 + c)^n]/[(1 + c)^n - 1]
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number
): number {
  if (loanAmount <= 0 || loanTermYears <= 0 || annualInterestRate < 0) {
    return 0
  }

  // Handle zero interest rate case
  if (annualInterestRate === 0) {
    return Math.round((loanAmount / (loanTermYears * 12)) * 100) / 100
  }

  const monthlyRate = annualInterestRate / 100 / 12
  const numberOfPayments = loanTermYears * 12
  
  const monthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)

  return Math.round(monthlyPayment * 100) / 100
}

/**
 * Calculate PMI payment if down payment is less than 20%
 */
export function calculatePMI(
  loanAmount: number,
  pmiRate: number
): number {
  if (pmiRate <= 0) return 0
  return Math.round((loanAmount * (pmiRate / 100) / 12) * 100) / 100
}

/**
 * Calculate total monthly operating expenses
 */
export function calculateMonthlyOperatingExpenses(input: PropertyAnalysisInput): number {
  const {
    propertyTaxes = 0,
    insurance = 0,
    propertyMgmt = 0,
    maintenance = 0,
    utilities = 0,
    hoaFees = 0,
    equipment = 0
  } = input

  return Math.round((
    (propertyTaxes / 12) +
    (insurance / 12) +
    propertyMgmt +
    maintenance +
    utilities +
    hoaFees +
    equipment
  ) * 100) / 100
}

/**
 * Calculate Net Operating Income (NOI)
 */
export function calculateNOI(
  grossRent: number,
  vacancyRate: number,
  monthlyOperatingExpenses: number
): number {
  const effectiveGrossIncome = grossRent * (1 - vacancyRate)
  const annualNOI = (effectiveGrossIncome - monthlyOperatingExpenses) * 12
  return Math.round(annualNOI * 100) / 100
}

/**
 * Calculate Capitalization Rate (Cap Rate)
 */
export function calculateCapRate(
  netOperatingIncome: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) return 0
  return Math.round((netOperatingIncome / propertyValue * 100) * 100) / 100
}

/**
 * Calculate Return on Investment (ROI)
 */
export function calculateROI(
  annualCashFlow: number,
  totalCashInvested: number
): number {
  if (totalCashInvested <= 0) return 0
  return Math.round((annualCashFlow / totalCashInvested * 100) * 100) / 100
}

/**
 * Calculate Cash-on-Cash Return
 */
export function calculateCashOnCashReturn(
  annualCashFlow: number,
  totalCashInvested: number
): number {
  return calculateROI(annualCashFlow, totalCashInvested) // Same calculation
}

/**
 * Calculate Debt Service Coverage Ratio (DSCR)
 */
export function calculateDSCR(
  netOperatingIncome: number,
  annualDebtService: number
): number {
  if (annualDebtService <= 0) return 0
  return Math.round((netOperatingIncome / annualDebtService) * 100) / 100
}

/**
 * Calculate Net Present Value (NPV) for 5-year period
 */
export function calculateNPV(
  initialInvestment: number,
  annualCashFlows: number[],
  discountRate: number = CALCULATION_DEFAULTS.DISCOUNT_RATE
): number {
  let npv = -initialInvestment
  
  annualCashFlows.forEach((cashFlow, year) => {
    npv += cashFlow / Math.pow(1 + discountRate, year + 1)
  })
  
  return Math.round(npv * 100) / 100
}

/**
 * Calculate Internal Rate of Return (IRR) using Newton-Raphson method
 */
export function calculateIRR(
  initialInvestment: number,
  annualCashFlows: number[],
  guess: number = 0.1
): number | null {
  const maxIterations = 100
  const tolerance = 0.0001
  
  let rate = guess
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = -initialInvestment
    let derivative = 0
    
    annualCashFlows.forEach((cashFlow, year) => {
      const period = year + 1
      npv += cashFlow / Math.pow(1 + rate, period)
      derivative -= (period * cashFlow) / Math.pow(1 + rate, period + 1)
    })
    
    if (Math.abs(npv) < tolerance) {
      return Math.round(rate * 10000) / 100 // Return as percentage
    }
    
    if (derivative === 0) break
    
    rate = rate - npv / derivative
  }
  
  return null // Could not converge
}

/**
 * Generate monthly projections for the first year
 */
export function generateMonthlyProjections(
  input: PropertyAnalysisInput,
  monthlyPayment: number,
  monthlyOperatingExpenses: number
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = []
  const { grossRent, vacancyRate } = input
  let cumulativeCashFlow = 0
  
  for (let month = 1; month <= 12; month++) {
    const vacancyLoss = grossRent * vacancyRate
    const effectiveGrossIncome = grossRent - vacancyLoss
    const netOperatingIncome = effectiveGrossIncome - monthlyOperatingExpenses
    const cashFlow = netOperatingIncome - monthlyPayment
    cumulativeCashFlow += cashFlow
    
    projections.push({
      month,
      year: 1,
      grossRent,
      vacancyLoss: Math.round(vacancyLoss * 100) / 100,
      effectiveGrossIncome: Math.round(effectiveGrossIncome * 100) / 100,
      operatingExpenses: monthlyOperatingExpenses,
      netOperatingIncome: Math.round(netOperatingIncome * 100) / 100,
      debtService: monthlyPayment,
      cashFlow: Math.round(cashFlow * 100) / 100,
      cumulativeCashFlow: Math.round(cumulativeCashFlow * 100) / 100
    })
  }
  
  return projections
}

/**
/**
 * Generate annual projections for 30 years
 */
export function generateAnnualProjections(
  input: PropertyAnalysisInput,
  annualDebtService: number,
  annualOperatingExpenses: number
): AnnualProjection[] {
  const projections: AnnualProjection[] = []
  const { 
    grossRent: initialRent, 
    vacancyRate, 
    purchasePrice,
    downPayment 
  } = input

  const appreciationRate = CALCULATION_DEFAULTS.APPRECIATION_RATE
  const rentGrowthRate = 0.025 // 2.5% annual rent growth
  const loanAmount = purchasePrice - downPayment

  let cumulativeCashFlow = 0
  let currentRent = initialRent * 12 // Annual rent
  let currentPropertyValue = purchasePrice
  let remainingLoanBalance = loanAmount

  // Simple loan amortization approximation
  const annualPrincipalPayment = loanAmount / input.loanTerm

  for (let year = 1; year <= 30; year++) {
    const vacancyLoss = currentRent * vacancyRate
    const effectiveGrossIncome = currentRent - vacancyLoss
    const netOperatingIncome = effectiveGrossIncome - annualOperatingExpenses
    const cashFlow = netOperatingIncome - annualDebtService
    cumulativeCashFlow += cashFlow

    // Update loan balance
    remainingLoanBalance = Math.max(0, remainingLoanBalance - annualPrincipalPayment)
    const equity = currentPropertyValue - remainingLoanBalance
    const totalReturn = cumulativeCashFlow + equity - (purchasePrice - downPayment)
    const roi = (totalReturn / (purchasePrice - downPayment)) * 100

    projections.push({
      year,
      grossRent: Math.round(currentRent * 100) / 100,
      vacancyLoss: Math.round(vacancyLoss * 100) / 100,
      effectiveGrossIncome: Math.round(effectiveGrossIncome * 100) / 100,
      operatingExpenses: annualOperatingExpenses,
      netOperatingIncome: Math.round(netOperatingIncome * 100) / 100,
      debtService: annualDebtService,
      cashFlow: Math.round(cashFlow * 100) / 100,
      cumulativeCashFlow: Math.round(cumulativeCashFlow * 100) / 100,
      propertyValue: Math.round(currentPropertyValue * 100) / 100,
      equity: Math.round(equity * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      roi: Math.round(roi * 100) / 100
    })

    // Apply growth rates for next year
    currentRent *= (1 + rentGrowthRate)
    currentPropertyValue *= (1 + appreciationRate)
  }

  return projections
}

/**
 * Generate investment recommendation based on key metrics
 */
export function generateRecommendation(
  roi: number,
  capRate: number,
  cashFlow: number,
  dscr: number,
  npv: number
): { recommendation: 'BUY' | 'FAIL' | 'CONSIDER', score: number, reasons: string[] } {
  let score = 0
  const reasons: string[] = []
  
  // ROI scoring (40% weight)
  if (roi >= 12) {
    score += 40
    reasons.push(`Excellent ROI of ${roi.toFixed(1)}%`)
  } else if (roi >= 8) {
    score += 30
    reasons.push(`Good ROI of ${roi.toFixed(1)}%`)
  } else if (roi >= 6) {
    score += 20
    reasons.push(`Moderate ROI of ${roi.toFixed(1)}%`)
  } else if (roi > 0) {
    score += 10
    reasons.push(`Low ROI of ${roi.toFixed(1)}%`)
  } else {
    reasons.push(`Negative ROI of ${roi.toFixed(1)}%`)
  }
  
  // Cash Flow scoring (25% weight)
  if (cashFlow >= 200) {
    score += 25
    reasons.push(`Strong monthly cash flow of $${cashFlow.toFixed(2)}`)
  } else if (cashFlow >= 100) {
    score += 20
    reasons.push(`Good monthly cash flow of $${cashFlow.toFixed(2)}`)
  } else if (cashFlow > 0) {
    score += 15
    reasons.push(`Positive cash flow of $${cashFlow.toFixed(2)}`)
  } else if (cashFlow >= -50) {
    score += 5
    reasons.push(`Near break-even cash flow of $${cashFlow.toFixed(2)}`)
  } else {
    reasons.push(`Negative cash flow of $${cashFlow.toFixed(2)}`)
  }
  
  // Cap Rate scoring (20% weight)
  if (capRate >= 8) {
    score += 20
    reasons.push(`Excellent cap rate of ${capRate.toFixed(1)}%`)
  } else if (capRate >= 6) {
    score += 15
    reasons.push(`Good cap rate of ${capRate.toFixed(1)}%`)
  } else if (capRate >= 4) {
    score += 10
    reasons.push(`Moderate cap rate of ${capRate.toFixed(1)}%`)
  } else if (capRate > 0) {
    score += 5
    reasons.push(`Low cap rate of ${capRate.toFixed(1)}%`)
  } else {
    reasons.push(`Poor cap rate of ${capRate.toFixed(1)}%`)
  }
  
  // DSCR scoring (10% weight)
  if (dscr >= 1.5) {
    score += 10
    reasons.push(`Strong debt coverage ratio of ${dscr.toFixed(2)}`)
  } else if (dscr >= 1.25) {
    score += 8
    reasons.push(`Good debt coverage ratio of ${dscr.toFixed(2)}`)
  } else if (dscr >= 1.0) {
    score += 5
    reasons.push(`Adequate debt coverage ratio of ${dscr.toFixed(2)}`)
  } else {
    reasons.push(`Poor debt coverage ratio of ${dscr.toFixed(2)}`)
  }
  
  // NPV scoring (5% weight)
  if (npv > 0) {
    score += 5
    reasons.push(`Positive NPV of $${npv.toLocaleString()}`)
  } else {
    reasons.push(`Negative NPV of $${npv.toLocaleString()}`)
  }
  
  // Determine recommendation
  let recommendation: 'BUY' | 'FAIL' | 'CONSIDER'
  if (score >= 80) {
    recommendation = 'BUY'
  } else if (score >= 60) {
    recommendation = 'CONSIDER'
  } else {
    recommendation = 'FAIL'
  }
  
  return { recommendation, score, reasons }
}

/**
 * Main calculation function that performs complete property analysis
 */
export function calculatePropertyAnalysis(input: PropertyAnalysisInput): CalculationResults {
  // Sanitize vacancyRate: default to 0.05 if missing, invalid, or out of range
  let vacancyRate: number = (() => {
    const v: any = input.vacancyRate;
    if (v === null || v === undefined || v === '' || isNaN(Number(v)) || Number(v) < 0 || Number(v) > 1) {
      return 0.05;
    }
    return Number(v);
  })();

  // Basic calculations
  const loanAmount = input.purchasePrice - input.downPayment
  const monthlyPayment = calculateMonthlyPayment(loanAmount, input.interestRate, input.loanTerm)
  const pmiPayment = calculatePMI(loanAmount, input.pmiRate || 0)
  const totalMonthlyPayment = monthlyPayment + pmiPayment
  
  const monthlyOperatingExpenses = calculateMonthlyOperatingExpenses(input)
  const totalAnnualExpenses = monthlyOperatingExpenses * 12
  const annualDebtService = totalMonthlyPayment * 12
  
  // Income calculations
  const effectiveGrossIncome = input.grossRent * (1 - vacancyRate) * 12
  const netOperatingIncome = calculateNOI(input.grossRent, vacancyRate, monthlyOperatingExpenses)
  const monthlyCashFlow = input.grossRent * (1 - vacancyRate) - monthlyOperatingExpenses - totalMonthlyPayment
  const annualCashFlow = monthlyCashFlow * 12
  
  // Investment metrics
  const totalCashInvested = input.downPayment + (input.closingCosts || 0) + (input.rehabCosts || 0)
  const roi = calculateROI(annualCashFlow, totalCashInvested)
  const capRate = calculateCapRate(netOperatingIncome, input.purchasePrice)
  const cashOnCashReturn = calculateCashOnCashReturn(annualCashFlow, totalCashInvested)
  const dscr = calculateDSCR(netOperatingIncome, annualDebtService)
  
  // Generate projections
  const monthlyProjections = generateMonthlyProjections(input, totalMonthlyPayment, monthlyOperatingExpenses)
  const annualProjections = generateAnnualProjections(input, annualDebtService, totalAnnualExpenses)
  
  // NPV calculation using 5-year projections
  const fiveYearCashFlows = annualProjections.map(p => p.cashFlow)
  const npv = calculateNPV(totalCashInvested, fiveYearCashFlows)
  const irr = calculateIRR(totalCashInvested, fiveYearCashFlows)
  
  // Generate recommendation
  const { recommendation, score, reasons } = generateRecommendation(
    roi, capRate, monthlyCashFlow, dscr, npv
  )
  
  return {
    // Monthly metrics
    monthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
    monthlyCashFlow: Math.round(monthlyCashFlow * 100) / 100,
    monthlyOperatingExpenses: Math.round(monthlyOperatingExpenses * 100) / 100,
    
    // Annual metrics
    annualCashFlow: Math.round(annualCashFlow * 100) / 100,
    netOperatingIncome: Math.round(netOperatingIncome * 100) / 100,
    effectiveGrossIncome: Math.round(effectiveGrossIncome * 100) / 100,
    totalAnnualExpenses: Math.round(totalAnnualExpenses * 100) / 100,
    
    // Financial ratios
    roi: Math.round(roi * 100) / 100,
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    debtServiceCoverageRatio: Math.round(dscr * 100) / 100,
    
    // Investment metrics
    totalCashInvested: Math.round(totalCashInvested * 100) / 100,
    loanAmount: Math.round(loanAmount * 100) / 100,
    npv: Math.round(npv * 100) / 100,
    irr: irr ? Math.round(irr * 100) / 100 : undefined,
    
    // Recommendation
    recommendation,
    recommendationScore: score,
    recommendationReasons: reasons,
    
    // Projections
    monthlyProjections,
    annualProjections
  }
}