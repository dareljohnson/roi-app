'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { PropertyAnalysisInput, FormStep, CalculationResults } from '@/types/property'
import { calculatePropertyAnalysis } from '@/lib/calculations'
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm'
import { FinancingForm } from '@/components/forms/FinancingForm'
import { OperatingExpensesForm } from '@/components/forms/OperatingExpensesForm'
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm'
import { ResultsDashboard } from '@/components/dashboard/ResultsDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingUp, DollarSign, BarChart3, History } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const { status } = useSession();
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Real Estate Investment Analysis</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Get comprehensive ROI analysis, cash flow projections, and investment recommendations for your real estate investment properties.
        </p>
        {/* Launch Calculator button for authenticated users only */}
        {status === 'authenticated' && (
          <Link href="/calculator">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg text-lg shadow transition-colors mt-4">
              <Calculator className="inline-block mr-2 -mt-1" />
              Launch Calculator
            </Button>
          </Link>
        )}
      </section>

      {/* Feature Cards */}
      <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <TrendingUp className="h-10 w-10 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-lg">ROI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Calculate return on investment, cap rates, and cash-on-cash returns
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-center">
            <DollarSign className="h-10 w-10 text-blue-600 mx-auto mb-2" />
            <CardTitle className="text-lg">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Monthly and annual cash flow projections with vacancy calculations
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-center">
            <BarChart3 className="h-10 w-10 text-purple-600 mx-auto mb-2" />
            <CardTitle className="text-lg">Projections</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              5-year investment projections with NPV and IRR calculations
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      {/* Screenshots/History/Summary Section - only show if not logged in */}
      {status !== 'authenticated' && (
        <section className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mt-12">
          <div>
            <h3 className="text-2xl font-bold mb-4">Property Analysis History</h3>
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex items-center justify-center">
              <img
                src="/Property_Analysis_History.png"
                alt="Property Analysis History Screenshot"
                className="max-h-48 w-auto rounded shadow"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Property Summary</h3>
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex items-center justify-center">
              <img
                src="/Property_Summary.png"
                alt="Property Summary Screenshot"
                className="max-h-48 w-auto rounded shadow"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Screenshots Section - only show if not logged in */}
      {status !== 'authenticated' && (
        <section className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mt-12">
          <div>
            <h3 className="text-2xl font-bold mb-4">Property Analysis Form</h3>
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex items-center justify-center">
              <img
                src="/Property_Analysis_Form.png"
                alt="Property Analysis Form Screenshot"
                className="max-h-48 w-auto rounded shadow"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Compare Properties</h3>
            <div className="bg-white rounded-lg shadow p-6 min-h-[180px] flex items-center justify-center">
              <img
                src="/Compare_Properties.png"
                alt="Compare Properties Screenshot"
                className="max-h-48 w-auto rounded shadow"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}