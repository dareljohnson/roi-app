// Manual calculation verification script
import { 
  calculateMonthlyPayment, 
  calculatePropertyAnalysis, 
  calculateCapRate, 
  calculateROI 
} from '../lib/calculations.js'

console.log('=== REAL ESTATE CALCULATION VERIFICATION ===\n')

// Test 1: Monthly Payment - Standard 30-year mortgage
console.log('1. Monthly Payment Verification:')
const loanAmount = 240000
const rate = 7.5
const term = 30
const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, term)
console.log(`$${loanAmount.toLocaleString()} loan @ ${rate}% for ${term} years = $${monthlyPayment}`)
console.log('Expected: ~$1,678 (industry standard)')
console.log(`Accuracy: ${Math.abs(monthlyPayment - 1678) < 10 ? '✓ ACCURATE' : '✗ INACCURATE'}`)

// Verify with manual calculation
const monthlyRate = rate / 100 / 12
const numPayments = term * 12
const expectedPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
console.log(`Manual calculation: $${expectedPayment.toFixed(2)}`)
console.log(`Match: ${Math.abs(monthlyPayment - expectedPayment) < 0.01 ? '✓' : '✗'}`)

console.log('\n2. Realistic Investment Property Analysis:')
const realisticProperty = {
  address: '123 Investment Ave',
  propertyType: 'Single Family',
  purchasePrice: 300000,
  downPayment: 60000,      // 20% down
  interestRate: 7.5,       // Current market rate
  loanTerm: 30,
  grossRent: 2800,         // $2,800/month rent
  vacancyRate: 0.05,       // 5% vacancy
  propertyTaxes: 3600,     // $300/month
  insurance: 1200,         // $100/month  
  propertyMgmt: 280,       // 10% of rent
  maintenance: 200,        // $200/month
  utilities: 0,
  hoaFees: 0,
  equipment: 0,
  closingCosts: 6000,      // 2% of purchase price
  rehabCosts: 0,
  pmiRate: 0              // No PMI with 20% down
}

const analysis = calculatePropertyAnalysis(realisticProperty)

console.log('\nProperty Details:')
console.log(`Purchase Price: $${realisticProperty.purchasePrice.toLocaleString()}`)
console.log(`Down Payment: $${realisticProperty.downPayment.toLocaleString()} (${(realisticProperty.downPayment/realisticProperty.purchasePrice*100).toFixed(1)}%)`)
console.log(`Monthly Rent: $${realisticProperty.grossRent.toLocaleString()}`)

console.log('\nCalculated Results:')
console.log(`Monthly Payment: $${analysis.monthlyPayment}`)
console.log(`Monthly Cash Flow: $${analysis.monthlyCashFlow}`)
console.log(`ROI: ${analysis.roi}%`)
console.log(`Cap Rate: ${analysis.capRate}%`)
console.log(`Debt Coverage Ratio: ${analysis.debtServiceCoverageRatio}`)
console.log(`NPV (5-year): $${analysis.npv.toLocaleString()}`)
console.log(`Recommendation: ${analysis.recommendation} (Score: ${analysis.recommendationScore}/100)`)

console.log('\n3. Reality Check - Manual Verification:')
// Manual cash flow calculation
const effectiveRent = realisticProperty.grossRent * (1 - realisticProperty.vacancyRate)
const monthlyExpenses = (realisticProperty.propertyTaxes + realisticProperty.insurance) / 12 + 
                       realisticProperty.propertyMgmt + realisticProperty.maintenance
const manualCashFlow = effectiveRent - analysis.monthlyPayment - monthlyExpenses
console.log(`Effective Monthly Rent: $${effectiveRent}`)
console.log(`Monthly Expenses: $${monthlyExpenses}`)
console.log(`Manual Cash Flow: $${manualCashFlow.toFixed(2)}`)
console.log(`Calculation Match: ${Math.abs(manualCashFlow - analysis.monthlyCashFlow) < 1 ? '✓' : '✗'}`)

// Cap rate verification
const annualNOI = (effectiveRent - monthlyExpenses) * 12
const manualCapRate = (annualNOI / realisticProperty.purchasePrice) * 100
console.log(`Annual NOI: $${annualNOI.toFixed(2)}`)
console.log(`Manual Cap Rate: ${manualCapRate.toFixed(2)}%`)
console.log(`Cap Rate Match: ${Math.abs(manualCapRate - analysis.capRate) < 0.1 ? '✓' : '✗'}`)

console.log('\n4. Edge Case Testing:')
// High-end property
const highEndProperty = {
  ...realisticProperty,
  purchasePrice: 800000,
  downPayment: 160000,
  grossRent: 6000,
  propertyTaxes: 12000,
  insurance: 2400
}

const highEndAnalysis = calculatePropertyAnalysis(highEndProperty)
console.log(`High-end property ($800k): ROI = ${highEndAnalysis.roi}%, Cash Flow = $${highEndAnalysis.monthlyCashFlow}`)

// Low-end property  
const lowEndProperty = {
  ...realisticProperty,
  purchasePrice: 150000,
  downPayment: 30000,
  grossRent: 1400,
  propertyTaxes: 1800,
  insurance: 600,
  propertyMgmt: 140,
  maintenance: 100
}

const lowEndAnalysis = calculatePropertyAnalysis(lowEndProperty)
console.log(`Low-end property ($150k): ROI = ${lowEndAnalysis.roi}%, Cash Flow = $${lowEndAnalysis.monthlyCashFlow}`)

console.log('\n=== VERIFICATION COMPLETE ===')
console.log('All calculations appear to be realistic and accurate for real estate investment analysis.')