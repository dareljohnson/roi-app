// This page was moved from the old home page. It contains the Property Analysis Form and Progress Bar (Calculator).
'use client'

import React, { useState } from 'react'
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

export default function CalculatorPage() {
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.PROPERTY_DETAILS)
  const [formData, setFormData] = useState<Partial<PropertyAnalysisInput>>({});
  // On mount, load from localStorage if present (client only)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propertyAnalysisFormData');
      if (saved) {
        try {
          setFormData(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [saveUnauthorized, setSaveUnauthorized] = useState(false)

  // Save formData to localStorage on every change, always merging with latest
  const updateFormData = (stepData: Partial<PropertyAnalysisInput>) => {
    setFormData(prev => {
      // Always merge with the latest formData from localStorage (if present)
      let latest = prev;
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('propertyAnalysisFormData');
        if (saved) {
          try {
            latest = { ...latest, ...JSON.parse(saved) };
          } catch {}
        }
      }
      const updated = { ...latest, ...stepData };
      if (typeof window !== 'undefined') {
        localStorage.setItem('propertyAnalysisFormData', JSON.stringify(updated));
      }
      return updated;
    });
  }

  // On mount, ensure formData is loaded from localStorage if present (for SSR safety)
  // (Already handled in useState initializer, but can add useEffect for robustness)
  /*
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propertyAnalysisFormData');
      if (saved) {
        try {
          setFormData(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);
  */

  const handleAnalyze = async () => {
    if (!isFormComplete()) return;

    // Frontend validation for required fields (match Zod schema)
    const requiredFields = [
      'address', 'propertyType', 'purchasePrice', 'downPayment', 'interestRate', 'loanTerm', 'grossRent', 'vacancyRate'
    ];
    for (const field of requiredFields) {
      const value = (formData as any)[field];
      if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))) {
        alert(`Missing or invalid value for required field: ${field}`);
        return;
      }
      // For numbers, ensure positive where required
      if ([
        'purchasePrice', 'downPayment', 'interestRate', 'loanTerm', 'grossRent'
      ].includes(field) && Number(value) <= 0) {
        alert(`Field ${field} must be a positive number.`);
        return;
      }
      if (field === 'vacancyRate' && (Number(value) < 0 || Number(value) > 1)) {
        alert('Vacancy rate must be between 0 and 1.');
        return;
      }
    }

    // Sanitize all required numbers: convert null/undefined to 0 for API
    // Also ensure string fields like imageUrl are preserved
    const sanitizedFormData: any = { ...formData };
    const requiredNumbers = [
      'purchasePrice', 'downPayment', 'interestRate', 'loanTerm', 'grossRent', 'vacancyRate',
      'propertyTaxes', 'insurance', 'propertyMgmt', 'maintenance', 'utilities', 'hoaFees', 'equipment', 'rehabCosts'
    ];
    for (const field of requiredNumbers) {
      let val = sanitizedFormData[field];
      if (field === 'vacancyRate') {
        // Default to 0.05 (5%) if missing, invalid, or out of range
        let vacancy = Number(val);
        if (
          val === null || val === undefined || val === '' ||
          isNaN(vacancy) || vacancy < 0 || vacancy > 1
        ) {
          sanitizedFormData[field] = 0.05;
        } else {
          sanitizedFormData[field] = vacancy;
        }
      } else {
        if (val === null || val === undefined || val === '') {
          sanitizedFormData[field] = 0;
        } else {
          sanitizedFormData[field] = Number(val);
          if (isNaN(sanitizedFormData[field])) sanitizedFormData[field] = 0;
        }
      }
    }

    // Ensure string fields are preserved (address, propertyType, condition, imageUrl, etc.)
    const stringFields: (keyof PropertyAnalysisInput)[] = [
      'address', 'propertyType', 'condition', 'imageUrl'
    ];
    for (const field of stringFields) {
      if (formData[field] !== undefined) {
        sanitizedFormData[field] = formData[field];
      }
    }

    setIsAnalyzing(true);
    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const analysisResults = calculatePropertyAnalysis(sanitizedFormData as PropertyAnalysisInput);
      setResults(analysisResults);
      setCurrentStep(FormStep.RESULTS);

      // Save to database in the background
      try {
        const response = await fetch('/api/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyData: sanitizedFormData,
            results: analysisResults,
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            setSaveUnauthorized(true);
          } else {
            console.error('Failed to save property analysis');
          }
        } else {
          setSaveUnauthorized(false);
        }
      } catch (error) {
        console.error('Error saving analysis:', error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }

  const isFormComplete = (): boolean => {
    const required: (keyof PropertyAnalysisInput)[] = [
      'address', 'propertyType', 'purchasePrice', 'downPayment', 
      'interestRate', 'loanTerm', 'grossRent'
    ]
    
    return required.every(field => {
      const value = formData[field]
      return value !== undefined && value !== null && value !== ''
    })
  }

  const handleStartOver = () => {
    setFormData({})
    setResults(null)
    setCurrentStep(FormStep.PROPERTY_DETAILS)
  }

  const getCompletionStatus = () => {
    const steps = [
      FormStep.PROPERTY_DETAILS,
      FormStep.FINANCING,
      FormStep.OPERATING_EXPENSES,
      FormStep.RENTAL_INCOME
    ]
    
    const completedSteps = steps.filter(step => {
      switch (step) {
        case FormStep.PROPERTY_DETAILS:
          return formData.address && formData.propertyType && formData.purchasePrice
        case FormStep.FINANCING:
          return formData.downPayment && formData.interestRate && formData.loanTerm
        case FormStep.OPERATING_EXPENSES:
          return formData.propertyTaxes && formData.insurance && formData.maintenance
        case FormStep.RENTAL_INCOME:
          return formData.grossRent
        default:
          return false
      }
    })
    return completedSteps.length / steps.length
  }

  if (results && currentStep === FormStep.RESULTS) {
    return (
      <div className="space-y-6">
        {saveUnauthorized && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            Your analysis was not saved because you are not logged in. <a href="/login" className="underline">Login to save</a> or <a href="/register" className="underline">create an account</a>.
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Investment Analysis Results</h2>
            <p className="text-gray-600">Comprehensive property investment analysis</p>
          </div>
          <div className="flex gap-3">
            <Link href="/properties">
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </Link>
            <Button onClick={handleStartOver} variant="outline">
              Analyze Another Property
            </Button>
          </div>
        </div>
        <ResultsDashboard 
          results={results} 
          propertyData={formData as PropertyAnalysisInput} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress indicator: show above the form, both mobile and desktop */}
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white p-4 rounded-lg shadow-sm w-full mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm text-blue-600 font-semibold">{getCompletionStatus()} Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(getCompletionStatus()) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Property Analysis Form</CardTitle>
          <CardDescription>
            Enter your property details to get a comprehensive investment analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as FormStep)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value={FormStep.PROPERTY_DETAILS} className="text-xs sm:text-sm">
                Property
              </TabsTrigger>
              <TabsTrigger value={FormStep.FINANCING} className="text-xs sm:text-sm">
                Financing
              </TabsTrigger>
              <TabsTrigger value={FormStep.OPERATING_EXPENSES} className="text-xs sm:text-sm">
                Expenses
              </TabsTrigger>
              <TabsTrigger value={FormStep.RENTAL_INCOME} className="text-xs sm:text-sm">
                Income
              </TabsTrigger>
            </TabsList>
            <div className="mt-6">
              <TabsContent value={FormStep.PROPERTY_DETAILS}>
                <PropertyDetailsForm 
                  data={formData}
                  onUpdate={updateFormData}
                  onNext={() => setCurrentStep(FormStep.FINANCING)}
                />
              </TabsContent>
              <TabsContent value={FormStep.FINANCING}>
                <FinancingForm 
                  data={formData}
                  onUpdate={updateFormData}
                  onNext={() => setCurrentStep(FormStep.OPERATING_EXPENSES)}
                  onPrev={() => setCurrentStep(FormStep.PROPERTY_DETAILS)}
                />
              </TabsContent>
              <TabsContent value={FormStep.OPERATING_EXPENSES}>
                <OperatingExpensesForm 
                  data={formData}
                  onUpdate={updateFormData}
                  onNext={() => setCurrentStep(FormStep.RENTAL_INCOME)}
                  onPrev={() => setCurrentStep(FormStep.FINANCING)}
                />
              </TabsContent>
              <TabsContent value={FormStep.RENTAL_INCOME}>
                <RentalIncomeForm 
                  data={formData}
                  onUpdate={updateFormData}
                  onAnalyze={handleAnalyze}
                  onPrev={() => setCurrentStep(FormStep.OPERATING_EXPENSES)}
                  isAnalyzing={isAnalyzing}
                  canAnalyze={isFormComplete()}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
