
'use client'

import { CalculationResults, PropertyAnalysisInput } from '@/types/property'
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, DollarSign, Home, Calculator, BarChart3, ThumbsUp, ThumbsDown, AlertCircle, History, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { PropertyPhotoUpload } from '@/components/property/PropertyPhotoUpload'

interface ResultsDashboardProps {
  results: CalculationResults
  // Accept analysis input shape but allow an optional database id when present
  propertyData: PropertyAnalysisInput & { id?: string }
  showHeader?: boolean
  defaultTab?: string // e.g., 'financial', 'monthly', 'projections'
  onPropertyImageUpdate?: (imageUrl: string | null) => void
}

export function ResultsDashboard({ results, propertyData, showHeader = false, defaultTab = 'financial', onPropertyImageUpdate }: ResultsDashboardProps) {
  // ...existing code...
  // State for toggling between 5-year and 30-year projections
  const [projectionYears, setProjectionYears] = useState(5);
  const { status } = useSession()
  
  // Handle property image changes and persist to DB
  const [localImageUrl, setLocalImageUrl] = useState(propertyData.imageUrl);
  // Keep local state in sync when parent updates prop (e.g., after navigation or server refresh)
  useEffect(() => {
    setLocalImageUrl(propertyData.imageUrl);
  }, [propertyData.imageUrl]);
  const handleImageChange = async (imageUrl: string | null) => {
    setLocalImageUrl(imageUrl || undefined);
    if (onPropertyImageUpdate) {
      onPropertyImageUpdate(imageUrl);
    }
    // Persist to database if propertyData.id exists
    if (propertyData.id && imageUrl) {
      try {
        await fetch(`/api/properties/${propertyData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        });
      } catch (err) {
        console.error('Failed to update property image in DB:', err);
      }
    }
  };
  
  // Derived gross rent fallback: If grossRent is undefined (e.g., individual-rooms strategy
  // with legacy data or during transitional states) compute from rentableRooms weekly rates.
  // This both resolves the TypeScript optional number error and adds runtime resilience.
  const resolvedGrossRent: number = (() => {
    if (typeof propertyData.grossRent === 'number' && !isNaN(propertyData.grossRent)) {
      return propertyData.grossRent
    }
    if (propertyData.rentableRooms && propertyData.rentableRooms.length > 0) {
      const monthlyFromRooms = propertyData.rentableRooms.reduce((sum, room) => sum + room.weeklyRate, 0) * 4
      return monthlyFromRooms
    }
    return 0
  })()
  const getRecommendationIcon = () => {
    switch (results.recommendation) {
      case 'BUY':
        return <ThumbsUp className="h-8 w-8 text-green-600" />
      case 'CONSIDER':
        return <AlertCircle className="h-8 w-8 text-yellow-600" />
      case 'FAIL':
        return <ThumbsDown className="h-8 w-8 text-red-600" />
    }
  }

  const getRecommendationColor = () => {
    switch (results.recommendation) {
      case 'BUY':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'CONSIDER':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'FAIL':
        return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`
  }

  return (
  <div className="space-y-8">
      {/* Results Header with Navigation - only show when showHeader is true */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investment Analysis Results</h1>
            <p className="text-gray-600 mt-1">
              Analysis completed for {propertyData.address}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/properties">
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Analyze Another
              </Button>
            </Link>
            {status !== 'authenticated' && (
              <Link href="/login" className="ml-2">
                <Button className="bg-indigo-600 text-white">Login to Save</Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Property Summary */}
      {/* Break Even Analysis and chart removed as requested */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold">{propertyData.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Property Type</p>
                  <p className="font-semibold">{propertyData.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Purchase Price</p>
                  <p className="font-semibold">{formatCurrency(propertyData.purchasePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Down Payment</p>
                  <p className="font-semibold">
                    {formatCurrency(propertyData.downPayment)}
                    <span className="text-sm text-gray-500 ml-1">
                      ({((propertyData.downPayment / propertyData.purchasePrice) * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
                
                {/* Enhanced Property Information */}
                {propertyData.yearBuilt && (
                  <div>
                    <p className="text-sm text-gray-600">Year Built</p>
                    <p className="font-semibold">{propertyData.yearBuilt}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600">Loan Term</p>
                  <p className="font-semibold">{propertyData.loanTerm} years</p>
                </div>
                
                {propertyData.interestRate && (
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-semibold">{propertyData.interestRate.toFixed(1)}%</p>
                  </div>
                )}
                
                {typeof propertyData.pmiRate === 'number' && (
                  <div>
                    <p className="text-sm text-gray-600">PMI Rate</p>
                    <p className="font-semibold">
                      {propertyData.pmiRate.toFixed(1)}%
                      {propertyData.pmiRate === 0 && (
                        <span className="text-xs text-gray-500 ml-1">(None required)</span>
                      )}
                    </p>
                  </div>
                )}
                
                {propertyData.squareFootage && (
                  <div>
                    <p className="text-sm text-gray-600">Square Footage</p>
                    <p className="font-semibold">{propertyData.squareFootage.toLocaleString()} sq ft</p>
                  </div>
                )}
                
                {propertyData.bedrooms && (
                  <div>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                    <p className="font-semibold">{propertyData.bedrooms}</p>
                  </div>
                )}
                
                {propertyData.bathrooms && (
                  <div>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                    <p className="font-semibold">{propertyData.bathrooms}</p>
                  </div>
                )}
                
                {/* Rooms to Rent Information */}
                {propertyData.rentableRooms && propertyData.rentableRooms.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Rooms to Rent</p>
                    <div className="font-semibold">
                      <p>{propertyData.rentableRooms.length} rooms</p>
                      <p className="text-sm text-gray-600 font-normal">
                        ${(propertyData.rentableRooms.reduce((sum, room) => sum + room.weeklyRate, 0) * 4).toLocaleString()}/month
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Operating Expenses Breakdown */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Monthly Operating Expenses</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {propertyData.propertyTaxes > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Property Taxes</span>
                      <span className="font-semibold">{formatCurrency(propertyData.propertyTaxes / 12)}<span className="text-xs text-gray-500 ml-1">/mo</span></span>
                    </div>
                  )}
                  {propertyData.insurance > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Insurance</span>
                      <span className="font-semibold">{formatCurrency(propertyData.insurance / 12)}<span className="text-xs text-gray-500 ml-1">/mo</span></span>
                    </div>
                  )}
                  {propertyData.propertyMgmt > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Property Management</span>
                      <span className="font-semibold">{formatCurrency(propertyData.propertyMgmt)}<span className="text-xs text-gray-500 ml-1">/mo</span></span>
                    </div>
                  )}
                  {propertyData.maintenance > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Maintenance</span>
                      <span className="font-semibold">{formatCurrency(propertyData.maintenance)}<span className="text-xs text-gray-500 ml-1">/mo</span></span>
                    </div>
                  )}
                  {propertyData.utilities > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Utilities</span>
                      <span className="font-semibold">{formatCurrency(propertyData.utilities)}<span className="text-xs text-gray-500 ml-1">/mo</span></span>
                    </div>
                  )}
                  {propertyData.hoaFees > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">HOA Fees</span>
                      <span className="font-semibold">{formatCurrency(propertyData.hoaFees)}<span className="text-xs text-gray-500 ml-1">/mo</span></span>
                    </div>
                  )}
                  {propertyData.equipment > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Equipment</span>
                      <span className="font-semibold">{formatCurrency(propertyData.equipment)}<span className="text-xs text-gray-500 ml-1">/mo</span></span>
                    </div>
                  )}
                </div>
                
                {/* One-time Investment Costs */}
                {propertyData.rehabCosts > 0 && (
                  <div className="mt-4">
                    <h5 className="font-semibold text-gray-800 mb-2">One-time Investment</h5>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm">Rehab/Renovation</span>
                      <span className="font-semibold">{formatCurrency(propertyData.rehabCosts)}</span>
                    </div>
                  </div>
                )}
                
                {/* Total Monthly Operating Expenses */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">Total Monthly Operating</span>
                    <span className="text-xl font-bold text-blue-800">
                      {formatCurrency(
                        ((propertyData.propertyTaxes || 0) / 12) +
                        ((propertyData.insurance || 0) / 12) +
                        (propertyData.propertyMgmt || 0) +
                        (propertyData.maintenance || 0) +
                        (propertyData.utilities || 0) +
                        (propertyData.hoaFees || 0) +
                        (propertyData.equipment || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-blue-600">Annual Equivalent</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(
                        (propertyData.propertyTaxes || 0) +
                        (propertyData.insurance || 0) +
                        ((propertyData.propertyMgmt || 0) * 12) +
                        ((propertyData.maintenance || 0) * 12) +
                        ((propertyData.utilities || 0) * 12) +
                        ((propertyData.hoaFees || 0) * 12) +
                        ((propertyData.equipment || 0) * 12)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 lg:ml-auto w-full lg:w-56 flex justify-end items-start">
              {(localImageUrl || propertyData.imageUrl) ? (
                <div className="relative">
                  <img
                    src={localImageUrl || propertyData.imageUrl}
                    alt="Property"
                    className="rounded-lg shadow max-h-56 object-cover border border-gray-200"
                    style={{ maxWidth: '100%', width: 'auto' }}
                  />
                  <div className="mt-2">
                    <PropertyPhotoUpload 
                      onImageChange={handleImageChange}
                      currentImageUrl={localImageUrl || propertyData.imageUrl}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm">
                  <PropertyPhotoUpload 
                    onImageChange={handleImageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Recommendation */}
      <Card className={`border-2 ${getRecommendationColor()}`}>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="flex items-center gap-2">
              {getRecommendationIcon()}
              Investment Recommendation: {results.recommendation}
            </span>
            <span className="text-2xl font-bold">
              {results.recommendationScore}/100
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {results.recommendationReasons.map((reason, index) => (
              <p key={index} className="text-sm">
                • {reason}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatPercent(results.roi)}
            </div>
            <p className="text-sm text-gray-600">Annual return on investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Monthly Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${results.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(results.monthlyCashFlow)}
            </div>
            <p className="text-sm text-gray-600">After all expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              Cap Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatPercent(results.capRate)}
            </div>
            <p className="text-sm text-gray-600">Net operating income yield</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              NPV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${results.npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(results.npv)}
            </div>
            <p className="text-sm text-gray-600">5-year net present value</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
  <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">Financial Metrics</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Income & Expenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Monthly Gross Rent:</span>
                  <span className="font-semibold">{formatCurrency(resolvedGrossRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vacancy Loss ({formatPercent(propertyData.vacancyRate * 100)}):</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(resolvedGrossRent * propertyData.vacancyRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Effective Gross Income:</span>
                  <span className="font-semibold">
                    {formatCurrency(resolvedGrossRent * (1 - propertyData.vacancyRate))}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span>Operating Expenses:</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(results.monthlyOperatingExpenses)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mortgage Payment:</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(results.monthlyPayment)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between text-lg">
                  <span>Net Cash Flow:</span>
                  <span className={`font-bold ${results.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results.monthlyCashFlow)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Ratios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Return on Investment:</span>
                  <span className="font-semibold">{formatPercent(results.roi)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash-on-Cash Return:</span>
                  <span className="font-semibold">{formatPercent(results.cashOnCashReturn)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capitalization Rate:</span>
                  <span className="font-semibold">{formatPercent(results.capRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Debt Service Coverage:</span>
                  <span className="font-semibold">{results.debtServiceCoverageRatio.toFixed(2)}x</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span>Total Cash Invested:</span>
                  <span className="font-semibold">{formatCurrency(results.totalCashInvested)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Loan Amount:</span>
                  <span className="font-semibold">{formatCurrency(results.loanAmount)}</span>
                </div>
                {results.irr && (
                  <div className="flex justify-between">
                    <span>Internal Rate of Return:</span>
                    <span className="font-semibold">{formatPercent(results.irr)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>12-Month Cash Flow Projection</CardTitle>
              <CardDescription>
                Detailed monthly breakdown for the first year
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile Card Layout - Shows on small screens */}
              <div className="block md:hidden space-y-3">
                {results.monthlyProjections.map((projection, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-lg">Month {projection.month}</h4>
                      <div className={`text-lg font-bold ${projection.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(projection.cashFlow)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Rent:</span>
                        <span className="font-medium">{formatCurrency(projection.grossRent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vacancy:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(projection.vacancyLoss)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operating:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(projection.operatingExpenses)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Debt Service:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(projection.debtService)}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Cumulative Cash Flow:</span>
                        <span className={`font-bold ${projection.cumulativeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(projection.cumulativeCashFlow)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout - Shows on medium+ screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Month</th>
                      <th className="text-right py-2">Gross Rent</th>
                      <th className="text-right py-2">Vacancy</th>
                      <th className="text-right py-2">Operating</th>
                      <th className="text-right py-2">Debt Service</th>
                      <th className="text-right py-2">Cash Flow</th>
                      <th className="text-right py-2">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.monthlyProjections.map((projection, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">Month {projection.month}</td>
                        <td className="text-right py-2">{formatCurrency(projection.grossRent)}</td>
                        <td className="text-right py-2 text-red-600">-{formatCurrency(projection.vacancyLoss)}</td>
                        <td className="text-right py-2 text-red-600">-{formatCurrency(projection.operatingExpenses)}</td>
                        <td className="text-right py-2 text-red-600">-{formatCurrency(projection.debtService)}</td>
                        <td className={`text-right py-2 font-semibold ${projection.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(projection.cashFlow)}
                        </td>
                        <td className={`text-right py-2 font-semibold ${projection.cumulativeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(projection.cumulativeCashFlow)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-4">
          {/* Toggle for 5-year vs 30-year projections */}
          <div className="flex items-center gap-4 mb-2">
            <span className="font-semibold">Show:</span>
            <button
              className={`px-3 py-1 rounded ${projectionYears === 5 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setProjectionYears(5)}
              data-testid="toggle-5yr"
            >
              5-Year
            </button>
            <button
              className={`px-3 py-1 rounded ${projectionYears === 30 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setProjectionYears(30)}
              data-testid="toggle-30yr"
            >
              30-Year
            </button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{projectionYears}-Year Investment Projections</CardTitle>
              <CardDescription>
                Annual performance with assumed 3% property appreciation and 2.5% rent growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile Card Layout - Shows on small screens */}
              <div className="block md:hidden space-y-3">
                {results.annualProjections.slice(0, projectionYears).map((projection, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-lg">Year {projection.year}</h4>
                      <div className={`text-lg font-bold ${projection.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(projection.roi)}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Rent:</span>
                        <span className="font-medium">{formatCurrency(projection.grossRent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual Cash Flow:</span>
                        <span className={`font-medium ${projection.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(projection.cashFlow)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property Value:</span>
                        <span className="font-medium">{formatCurrency(projection.propertyValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Equity:</span>
                        <span className="font-medium">{formatCurrency(projection.equity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Return:</span>
                        <span className={`font-medium ${projection.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(projection.totalReturn)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout - Shows on medium+ screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Year</th>
                      <th className="text-right py-2">Gross Rent</th>
                      <th className="text-right py-2">Cash Flow</th>
                      <th className="text-right py-2">Property Value</th>
                      <th className="text-right py-2">Equity</th>
                      <th className="text-right py-2">Total Return</th>
                      <th className="text-right py-2">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.annualProjections.slice(0, projectionYears).map((projection, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">Year {projection.year}</td>
                        <td className="text-right py-2">{formatCurrency(projection.grossRent)}</td>
                        <td className={`text-right py-2 font-semibold ${projection.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(projection.cashFlow)}
                        </td>
                        <td className="text-right py-2">{formatCurrency(projection.propertyValue)}</td>
                        <td className="text-right py-2">{formatCurrency(projection.equity)}</td>
                        <td className={`text-right py-2 font-semibold ${projection.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(projection.totalReturn)}
                        </td>
                        <td className={`text-right py-2 font-semibold ${projection.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(projection.roi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Investment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.annualProjections.length < projectionYears && (
                  <div className="col-span-3 text-center text-yellow-700 bg-yellow-100 rounded p-2 mb-2">
                    Warning: Only {results.annualProjections.length} years of projections available.
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(results.annualProjections[Math.min(projectionYears, results.annualProjections.length)-1]?.cumulativeCashFlow || 0)}
                  </div>
                  <p className="text-sm text-gray-600">{projectionYears}-Year Cash Flow</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(results.annualProjections[Math.min(projectionYears, results.annualProjections.length)-1]?.equity || 0)}
                  </div>
                  <p className="text-sm text-gray-600">Projected Equity (Year {projectionYears})</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercent(results.annualProjections[Math.min(projectionYears, results.annualProjections.length)-1]?.roi || 0)}
                  </div>
                  <p className="text-sm text-gray-600">{projectionYears}-Year Total ROI</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}