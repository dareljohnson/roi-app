import { z } from 'zod'

// Property input validation schema
export const RoomRentalSchema = z.object({
  roomNumber: z.number().min(1),
  weeklyRate: z.number().min(0, 'Weekly rate must be non-negative'),
});

export const PropertySchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  propertyType: z.enum(['Single Family', 'Multi-family', 'Duplex', 'Triplex', 'Fourplex', 'Townhouse', 'Condo', 'Commercial']),
  purchasePrice: z.number().min(1000, 'Purchase price must be at least $1,000'),
  currentValue: z.number().optional(),
  squareFootage: z.number().min(100).optional(),
  lotSize: z.number().min(0.01).optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional(),
  bedrooms: z.number().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Needs Major Repairs']).optional(),
  imageUrl: z.string().optional(),
  rentableRooms: z.array(RoomRentalSchema).optional(), // New: array of rooms with weekly rates
})

// Financing input validation schema
export const FinancingSchema = z.object({
  downPayment: z.number().min(0, 'Down payment cannot be negative'),
  interestRate: z.number().min(0).max(30, 'Interest rate must be between 0-30%'),
  loanTerm: z.number().min(1).max(50, 'Loan term must be between 1-50 years'),
  closingCosts: z.number().min(0).optional().default(0),
  pmiRate: z.number().min(0).max(5).optional().default(0),
})

// Operating expenses validation schema
export const OperatingExpensesSchema = z.object({
  propertyTaxes: z.number().min(0).optional().default(0),
  insurance: z.number().min(0).optional().default(0),
  propertyMgmt: z.number().min(0).optional().default(0),
  maintenance: z.number().min(0).optional().default(0),
  utilities: z.number().min(0).optional().default(0),
  hoaFees: z.number().min(0).optional().default(0),
  equipment: z.number().min(0).optional().default(0),
  rehabCosts: z.number().min(0).optional().default(0),
})

// Rental income validation schema
export const RentalIncomeSchema = z.object({
  grossRent: z.number().min(0, 'Gross rent cannot be negative'),
  vacancyRate: z.number().min(0).max(1, 'Vacancy rate must be between 0-100%').default(0.05),
})

// Complete property analysis input schema
export const PropertyAnalysisInputSchema = PropertySchema
  .merge(FinancingSchema)
  .merge(OperatingExpensesSchema)
  .merge(RentalIncomeSchema)

// TypeScript types derived from schemas
export type RoomRental = z.infer<typeof RoomRentalSchema>;
export type PropertyInput = z.infer<typeof PropertySchema>
export type FinancingInput = z.infer<typeof FinancingSchema>
export type OperatingExpensesInput = z.infer<typeof OperatingExpensesSchema>
export type RentalIncomeInput = z.infer<typeof RentalIncomeSchema>
export type PropertyAnalysisInput = z.infer<typeof PropertyAnalysisInputSchema>

// Analysis results interfaces
export interface MonthlyProjection {
  month: number
  year: number
  grossRent: number
  vacancyLoss: number
  effectiveGrossIncome: number
  operatingExpenses: number
  netOperatingIncome: number
  debtService: number
  cashFlow: number
  cumulativeCashFlow: number
}

export interface AnnualProjection {
  year: number
  grossRent: number
  vacancyLoss: number
  effectiveGrossIncome: number
  operatingExpenses: number
  netOperatingIncome: number
  debtService: number
  cashFlow: number
  cumulativeCashFlow: number
  propertyValue: number
  equity: number
  totalReturn: number
  roi: number
}

export interface CalculationResults {
  // Monthly metrics
  monthlyPayment: number
  monthlyCashFlow: number
  monthlyOperatingExpenses: number
  
  // Annual metrics
  annualCashFlow: number
  netOperatingIncome: number
  effectiveGrossIncome: number
  totalAnnualExpenses: number
  
  // Financial ratios
  roi: number
  capRate: number
  cashOnCashReturn: number
  debtServiceCoverageRatio: number
  
  // Investment metrics
  totalCashInvested: number
  loanAmount: number
  npv: number
  irr?: number
  
  // Recommendation
  recommendation: 'BUY' | 'FAIL' | 'CONSIDER'
  recommendationScore: number
  recommendationReasons: string[]
  
  // Projections
  monthlyProjections: MonthlyProjection[]
  annualProjections: AnnualProjection[]
}

// Form step enum
export enum FormStep {
  PROPERTY_DETAILS = 'property-details',
  FINANCING = 'financing',
  OPERATING_EXPENSES = 'operating-expenses',
  RENTAL_INCOME = 'rental-income',
  RESULTS = 'results'
}

// Property type options
export const PROPERTY_TYPES = [
  'Single Family',
  'Multi-family',
  'Duplex',
  'Triplex',
  'Fourplex',
  'Townhouse',
  'Condo',
  'Commercial'
] as const

// Property condition options
export const PROPERTY_CONDITIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Needs Major Repairs'
] as const

// Default calculation constants
export const CALCULATION_DEFAULTS = {
  INTEREST_RATE: 7.5,
  LOAN_TERM: 30,
  VACANCY_RATE: 0.05, // 5%
  PROPERTY_MGMT_RATE: 0.10, // 10% of rent
  MAINTENANCE_RATE: 0.01, // 1% of property value annually
  CAP_RATE_THRESHOLD: 6.0,
  ROI_THRESHOLD: 8.0,
  CASH_FLOW_THRESHOLD: 0, // positive cash flow required
  PMI_THRESHOLD: 0.20, // PMI required if down payment < 20%
  APPRECIATION_RATE: 0.03, // 3% annual property appreciation
  DISCOUNT_RATE: 0.08, // 8% discount rate for NPV calculation
}