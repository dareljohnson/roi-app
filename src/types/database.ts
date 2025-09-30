// Database model types from Prisma
export interface Property {
  id: string
  createdAt: Date
  updatedAt: Date
  
  // Property Details
  address: string
  propertyType: string
  purchasePrice: number
  currentValue?: number
  squareFootage?: number
  lotSize?: number
  yearBuilt?: number
  bedrooms?: number
  bathrooms?: number
  condition?: string
  
  // Financing Details
  downPayment: number
  interestRate: number
  loanTerm: number
  closingCosts?: number
  pmiRate?: number
  
  // Rental Income
  grossRent: number
  vacancyRate: number
  
  // Operating Expenses
  propertyTaxes?: number
  insurance?: number
  propertyMgmt?: number
  maintenance?: number
  utilities?: number
  hoaFees?: number
  equipment?: number
  rehabCosts?: number
  
  // Relations
  analyses?: Analysis[]
}

export interface Analysis {
  id: string
  createdAt: Date
  
  // Foreign key
  propertyId: string
  property?: Property
  
  // Financial Metrics
  monthlyPayment: number
  cashFlow: number
  annualCashFlow: number
  roi: number
  capRate: number
  npv: number
  irr?: number
  totalCashInvested: number
  
  // Operating Income
  netOperatingIncome: number
  effectiveGrossIncome: number
  
  // Recommendation
  recommendation: string
  recommendationScore: number
  
  // Projections (stored as JSON strings for SQLite)
  monthlyProjections?: string
  annualProjections?: string
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PropertyListResponse extends ApiResponse<Property[]> {}
export interface PropertyResponse extends ApiResponse<Property> {}
export interface AnalysisResponse extends ApiResponse<Analysis> {}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: keyof Property
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}