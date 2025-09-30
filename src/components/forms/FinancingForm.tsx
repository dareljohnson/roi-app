'use client'

import { useState } from 'react'
import { PropertyAnalysisInput, CALCULATION_DEFAULTS } from '@/types/property'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface FinancingFormProps {
  data: Partial<PropertyAnalysisInput>
  onUpdate: (data: Partial<PropertyAnalysisInput>) => void
  onNext: () => void
  onPrev: () => void
}

// Helper: format number as currency string with commas and 2 decimals
function formatCurrency(value: string | number) {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.\-]/g, '')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Helper: remove formatting to get raw number string
function unformatCurrency(value: string) {
  return value.replace(/[^\d.\-]/g, '');
}

export function FinancingForm({ data, onUpdate, onNext, onPrev }: FinancingFormProps) {
  const [formData, setFormData] = useState({
    downPayment: data.downPayment?.toString() || '',
    interestRate: data.interestRate?.toString() || CALCULATION_DEFAULTS.INTEREST_RATE.toString(),
    loanTerm: data.loanTerm?.toString() || CALCULATION_DEFAULTS.LOAN_TERM.toString(),
    closingCosts: data.closingCosts?.toString() || '',
    pmiRate: data.pmiRate?.toString() || '',
  })

  // Track which input is focused for formatting
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    // Always unformat currency for numeric fields
    const numericFields = ['downPayment', 'interestRate', 'loanTerm', 'closingCosts', 'pmiRate'];
    let newValue = value;
    if (numericFields.includes(field)) {
      newValue = unformatCurrency(value);
    }
    const newData = { ...formData, [field]: newValue };
    setFormData(newData);

    // Convert to numbers and update parent
    const processedData: Partial<PropertyAnalysisInput> = {};
    numericFields.forEach(fieldName => {
      const val = (newData as any)[fieldName];
      if (val && val !== '') {
        (processedData as any)[fieldName] = Number(val);
      }
    });
    onUpdate(processedData);
  }

  const isValid = () => {
    const downPaymentNum = Number(unformatCurrency(formData.downPayment));
    const interestRateNum = Number(unformatCurrency(formData.interestRate));
    const loanTermNum = Number(unformatCurrency(formData.loanTerm));
    const purchasePrice = Number(unformatCurrency(data.purchasePrice?.toString() || ''));

    // Only check purchasePrice if it exists
    const purchasePriceValid = !isNaN(purchasePrice) && purchasePrice > 0 ? downPaymentNum <= purchasePrice : true;

    return (
      !isNaN(downPaymentNum) && downPaymentNum >= 0 &&
      purchasePriceValid &&
      !isNaN(interestRateNum) && interestRateNum >= 0 && interestRateNum <= 30 &&
      !isNaN(loanTermNum) && loanTermNum >= 1 && loanTermNum <= 50
    );
  }

  const calculateLoanAmount = () => {
    const purchasePrice = data.purchasePrice || 0
    const downPayment = Number(formData.downPayment) || 0
    return Math.max(0, purchasePrice - downPayment)
  }

  const calculateMonthlyPayment = () => {
    const loanAmount = calculateLoanAmount()
    const annualRate = Number(formData.interestRate) || 0
    const loanTerm = Number(formData.loanTerm) || 30
    
    if (loanAmount <= 0 || annualRate <= 0) return 0
    
    const monthlyRate = annualRate / 100 / 12
    const numberOfPayments = loanTerm * 12
    
    const payment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    
    return Math.round(payment * 100) / 100
  }

  const downPaymentPercent = () => {
    const purchasePrice = data.purchasePrice || 1
    const downPayment = Number(formData.downPayment) || 0
    return Math.round((downPayment / purchasePrice) * 100 * 100) / 100
  }

  const needsPMI = () => {
    return downPaymentPercent() < 20
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financing Details</CardTitle>
          <CardDescription>
            Enter loan and financing information for the property
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.purchasePrice && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Purchase Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Purchase Price:</span>
                  <span className="font-semibold ml-2">${data.purchasePrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-blue-700">Loan Amount:</span>
                  <span className="font-semibold ml-2">${calculateLoanAmount().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Down Payment */}
            <div>
              <Label htmlFor="downPayment">Down Payment *</Label>
              <Input
                id="downPayment"
                type="text"
                placeholder="30,000.00"
                value={
                  focusedField === 'downPayment'
                    ? unformatCurrency(formData.downPayment.toString())
                    : formatCurrency(formData.downPayment)
                }
                onFocus={() => setFocusedField('downPayment')}
                onBlur={e => {
                  setFocusedField(null);
                  const formatted = formatCurrency(e.target.value);
                  handleChange('downPayment', formatted);
                }}
                onChange={e => handleChange('downPayment', e.target.value)}
                className="mt-1"
                min="0"
                max={data.purchasePrice || undefined}
                inputMode="decimal"
                step="0.01"
              />
              {formData.downPayment && (
                <p className="text-xs text-gray-500 mt-1">
                  {downPaymentPercent()}% of purchase price
                  {needsPMI() && (
                    <span className="text-orange-600 ml-2">⚠️ PMI required</span>
                  )}
                </p>
              )}
            </div>

            {/* Interest Rate */}
            <div>
              <Label htmlFor="interestRate">Interest Rate (%) *</Label>
              <Input
                id="interestRate"
                type="number"
                placeholder="7.5"
                value={formData.interestRate}
                onChange={(e) => handleChange('interestRate', e.target.value)}
                className="mt-1"
                min="0"
                max="30"
                step="0.125"
              />
              <p className="text-xs text-gray-500 mt-1">Current average: ~7.5%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loan Term */}
            <div>
              <Label htmlFor="loanTerm">Loan Term (years) *</Label>
              <select
                id="loanTerm"
                value={formData.loanTerm}
                onChange={(e) => handleChange('loanTerm', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="15">15 years</option>
                <option value="20">20 years</option>
                <option value="25">25 years</option>
                <option value="30">30 years</option>
              </select>
            </div>

            {/* Closing Costs */}
            <div>
              <Label htmlFor="closingCosts">Closing Costs</Label>
              <Input
                id="closingCosts"
                type="text"
                placeholder="3,000.00"
                value={
                  focusedField === 'closingCosts'
                    ? unformatCurrency(formData.closingCosts.toString())
                    : formatCurrency(formData.closingCosts)
                }
                onFocus={() => setFocusedField('closingCosts')}
                onBlur={e => {
                  setFocusedField(null);
                  const formatted = formatCurrency(e.target.value);
                  handleChange('closingCosts', formatted);
                }}
                onChange={e => handleChange('closingCosts', e.target.value)}
                className="mt-1"
                min="0"
                inputMode="decimal"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">Typical: 2-3% of purchase price</p>
            </div>
          </div>

          {/* PMI Rate - only show if needed */}
          {needsPMI() && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pmiRate">PMI Rate (%)</Label>
                <Input
                  id="pmiRate"
                  type="number"
                  placeholder="0.5"
                  value={formData.pmiRate}
                  onChange={(e) => handleChange('pmiRate', e.target.value)}
                  className="mt-1"
                  min="0"
                  max="2"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for down payments less than 20%
                </p>
              </div>
            </div>
          )}

          {/* Payment Preview */}
          {(function showPaymentPanel() {
            // Only require downPayment, interestRate, and loanTerm to be valid for preview
            const downPaymentNum = Number(unformatCurrency(formData.downPayment));
            const interestRateNum = Number(unformatCurrency(formData.interestRate));
            const loanTermNum = Number(unformatCurrency(formData.loanTerm));
            const requiredValid =
              !isNaN(downPaymentNum) && downPaymentNum >= 0 &&
              !isNaN(interestRateNum) && interestRateNum >= 0 && interestRateNum <= 30 &&
              !isNaN(loanTermNum) && loanTermNum >= 1 && loanTermNum <= 50;
            if (!requiredValid) return null;
            return (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Monthly Payment Estimate</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Principal & Interest:</span>
                    <span className="font-semibold ml-2">
                      ${calculateMonthlyPayment().toLocaleString()}
                    </span>
                  </div>
                  {needsPMI() && Number(formData.pmiRate) > 0 && (
                    <div>
                      <span className="text-green-700">PMI:</span>
                      <span className="font-semibold ml-2">
                        ${Math.round((calculateLoanAmount() * (Number(formData.pmiRate) / 100) / 12) * 100) / 100}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-green-700">Total P&I{needsPMI() && Number(formData.pmiRate) > 0 ? '+PMI' : ''}:</span>
                    <span className="font-semibold ml-2">
                      {(calculateMonthlyPayment() +
                        (needsPMI() && Number(formData.pmiRate) > 0 ?
                          Math.round((calculateLoanAmount() * (Number(formData.pmiRate) / 100) / 12) * 100) / 100 : 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Previous: Property
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid()}
        >
          Next: Expenses
        </Button>
      </div>
    </div>
  )
}