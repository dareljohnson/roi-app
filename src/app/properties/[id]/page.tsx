'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, History } from 'lucide-react'
import { ResultsDashboard } from '@/components/dashboard/ResultsDashboard'
import { PropertyAnalysisInput, CalculationResults } from '@/types/property'
import PieChartWithNeedle from '@/components/PieChartWithNeedle'
import { WalkThroughNotes } from '@/components/walkthrough/WalkThroughNotes'

interface PropertyAnalysisData {
  id: string
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
  downPayment: number
  interestRate: number
  loanTerm: number
  closingCosts?: number
  pmiRate?: number
  grossRent: number
  vacancyRate: number
  propertyTaxes?: number
  insurance?: number
  propertyMgmt?: number
  maintenance?: number
  utilities?: number
  hoaFees?: number
  equipment?: number
  rehabCosts?: number
  roi: number
  monthlyPayment: number
  monthlyCashFlow: number
  capRate: number
  debtServiceCoverageRatio: number
  npv: number
  irr: number
  totalReturn: number
  recommendation: string
  recommendationScore: number
  createdAt: string
  // Added fields for projections and reasons
  monthlyProjections?: any[]
  annualProjections?: any[]
  recommendationReasons?: string[]
  imageUrl?: string
}

export default function PropertyDetailPage() {
  console.log('PropertyDetailPage: component mounted');
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingId, setMissingId] = useState(false);
  // New state for aggregated walk-through rating (additive, optional)
  const [walkRating, setWalkRating] = useState<{ avg: number | null; count: number } | null>(null);

  const propertyId = params.id as string | undefined;

  useEffect(() => {
    console.log('PropertyDetailPage: propertyId =', propertyId);
    if (propertyId) {
      fetchProperty();
      setMissingId(false);
    } else {
      setMissingId(true);
      setLoading(false);
      setError('No property ID found in the URL. Please return to the property list and try again.');
      console.warn('PropertyDetailPage: propertyId is undefined or empty');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setLoading(true)
      console.log('Fetching property details for id:', propertyId)
      const response = await fetch(`/api/properties/${propertyId}`)
      console.log('API response status:', response.status)
      if (!response.ok) {
        throw new Error('Property not found')
      }
      const data = await response.json()
      console.log('API response data:', data)
      if (data.success) {
        setProperty(data.analysis)
        if (typeof data.analysis.walkThroughAverageRating !== 'undefined') {
          setWalkRating({
            avg: data.analysis.walkThroughAverageRating,
            count: data.analysis.walkThroughRatingCount
          })
        }
      } else {
        setError(data.error || 'Failed to load property')
      }
    } catch (err) {
      setError('Error fetching property details')
      console.error('Error fetching property:', err)
    } finally {
      setLoading(false)
    }
  }

  if (missingId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/properties">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-red-600">Invalid Property URL</h1>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-xl mx-auto">
          <strong className="font-bold">Error:</strong> <span className="block sm:inline">No property ID found in the URL. Please return to the property list and try again.</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/properties">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Loading Property Details...</h1>
        </div>
        <div className="animate-pulse">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/properties">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-red-600">Error Loading Property</h1>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-xl mx-auto">
          <strong className="font-bold">Error:</strong> <span className="block sm:inline">{error}</span>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/properties">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Property Not Found</h1>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Property not found'}</p>
              <Link href="/properties">
                <Button>Back to Properties</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Transform property data to match the expected interfaces
  const propertyData: PropertyAnalysisInput = {
  address: property.address,
  propertyType: property.propertyType as PropertyAnalysisInput['propertyType'],
  purchasePrice: property.purchasePrice,
  currentValue: property.currentValue,
  squareFootage: property.squareFootage,
  lotSize: property.lotSize,
  yearBuilt: property.yearBuilt,
  bedrooms: property.bedrooms,
  bathrooms: property.bathrooms,
  condition: property.condition as PropertyAnalysisInput['condition'],
  downPayment: property.downPayment,
  interestRate: property.interestRate,
  loanTerm: property.loanTerm,
  closingCosts: property.closingCosts || 0,
  pmiRate: property.pmiRate || 0,
  grossRent: property.grossRent,
  vacancyRate: property.vacancyRate,
  propertyTaxes: property.propertyTaxes || 0,
  insurance: property.insurance || 0,
  propertyMgmt: property.propertyMgmt || 0,
  maintenance: property.maintenance || 0,
  utilities: property.utilities || 0,
  hoaFees: property.hoaFees || 0,
  equipment: property.equipment || 0,
  rehabCosts: property.rehabCosts || 0,
  imageUrl: property.imageUrl || '',
  }

  const results: CalculationResults = {
    monthlyPayment: property.monthlyPayment,
    monthlyCashFlow: property.monthlyCashFlow,
    monthlyOperatingExpenses: (property.propertyTaxes || 0) / 12 + (property.insurance || 0) / 12 + 
      (property.propertyMgmt || 0) + (property.maintenance || 0) + 
      (property.utilities || 0) + (property.hoaFees || 0) + (property.equipment || 0),
    annualCashFlow: property.monthlyCashFlow * 12,
    effectiveGrossIncome: property.grossRent * (1 - property.vacancyRate) * 12,
    netOperatingIncome: (property.grossRent * (1 - property.vacancyRate) * 12) - 
      ((property.propertyTaxes || 0) + (property.insurance || 0) + 
       (property.propertyMgmt || 0) * 12 + (property.maintenance || 0) * 12 + 
       (property.utilities || 0) * 12 + (property.hoaFees || 0) * 12 + (property.equipment || 0) * 12),
    totalAnnualExpenses: (property.propertyTaxes || 0) + (property.insurance || 0) + 
      (property.propertyMgmt || 0) * 12 + (property.maintenance || 0) * 12 + 
      (property.utilities || 0) * 12 + (property.hoaFees || 0) * 12 + (property.equipment || 0) * 12,
    roi: property.roi,
    capRate: property.capRate,
    cashOnCashReturn: property.roi, // Same as ROI in most cases
    debtServiceCoverageRatio: property.debtServiceCoverageRatio,
    totalCashInvested: property.downPayment + (property.closingCosts || 0) + (property.rehabCosts || 0),
    loanAmount: property.purchasePrice - property.downPayment,
    npv: property.npv,
    irr: property.irr,
    recommendation: property.recommendation as CalculationResults['recommendation'],
    recommendationScore: property.recommendationScore,
    recommendationReasons: property.recommendationReasons || [],
    monthlyProjections: property.monthlyProjections || [],
    annualProjections: property.annualProjections || [],
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between print:flex-col print:items-start print:gap-2">
        <div className="flex items-center gap-4 print:gap-2">
          <Link href="/properties" className="print:hidden">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{property.address}</h1>
            <p className="text-gray-600">
              {property.propertyType} • {property.bedrooms ? `${property.bedrooms} bed` : ''}{property.bedrooms && property.bathrooms ? ' / ' : ''}{property.bathrooms ? `${property.bathrooms} bath` : ''} • Analyzed {new Date(property.createdAt).toLocaleDateString()}
              {property.grossRent && property.squareFootage ? (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-xs text-blue-700">Rent/Sq Ft: </span>
                  <span className="text-xs font-semibold">${(property.grossRent / property.squareFootage).toFixed(2)}</span>
                </>
              ) : null}
              {walkRating && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-xs text-amber-700">Walk-Through Rating: </span>
                  {walkRating.avg === null ? (
                    <span className="text-xs font-semibold text-gray-500">No ratings</span>
                  ) : (
                    <span className="text-xs font-semibold">
                      {walkRating.avg.toFixed(1)}⭐ ({walkRating.count})
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <PieChartWithNeedle score={property.recommendationScore ?? 0} width={160} height={160} />
          <span className="mt-1 text-xs text-gray-600">Score</span>
        </div>
        <div className="flex flex-col gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            Print to PDF
          </Button>
          <Link href="/properties">
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              View All Properties
            </Button>
          </Link>
        </div>
      </div>

      <ResultsDashboard 
        results={results} 
        propertyData={propertyData}
        showHeader={false}
      />

      <WalkThroughNotes 
        propertyId={property.id} 
        propertyAddress={property.address}
      />
    </div>
  )
}