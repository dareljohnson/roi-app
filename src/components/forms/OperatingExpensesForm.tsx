'use client'

import { useState, useEffect } from 'react'
import { PropertyAnalysisInput } from '@/types/property'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface OperatingExpensesFormProps {
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

export function OperatingExpensesForm({ data, onUpdate, onNext, onPrev }: OperatingExpensesFormProps) {
  const [formData, setFormData] = useState({
    propertyTaxes: data.propertyTaxes?.toString() || '',
    insurance: data.insurance?.toString() || '',
    propertyMgmt: data.propertyMgmt?.toString() || '',
    maintenance: data.maintenance?.toString() || '',
    utilities: data.utilities?.toString() || '',
    hoaFees: data.hoaFees?.toString() || '',
    equipment: data.equipment?.toString() || '',
    rehabCosts: data.rehabCosts?.toString() || '',
  })

  // Track which input is focused for formatting
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
  }

  // Call onUpdate with all relevant fields whenever formData changes
  useEffect(() => {
    const processedData: Partial<PropertyAnalysisInput> = {
      propertyTaxes: formData.propertyTaxes !== '' ? Number(formData.propertyTaxes) : undefined,
      insurance: formData.insurance !== '' ? Number(formData.insurance) : undefined,
      propertyMgmt: formData.propertyMgmt !== '' ? Number(formData.propertyMgmt) : undefined,
      maintenance: formData.maintenance !== '' ? Number(formData.maintenance) : undefined,
      utilities: formData.utilities !== '' ? Number(formData.utilities) : undefined,
      hoaFees: formData.hoaFees !== '' ? Number(formData.hoaFees) : undefined,
      equipment: formData.equipment !== '' ? Number(formData.equipment) : undefined,
      rehabCosts: formData.rehabCosts !== '' ? Number(formData.rehabCosts) : undefined,
    };
    onUpdate(processedData);
  }, [formData]);

  const calculateTotalMonthlyExpenses = () => {
    const propertyTaxes = Number(formData.propertyTaxes) || 0
    const insurance = Number(formData.insurance) || 0
    const propertyMgmt = Number(formData.propertyMgmt) || 0
    const maintenance = Number(formData.maintenance) || 0
    const utilities = Number(formData.utilities) || 0
    const hoaFees = Number(formData.hoaFees) || 0
    const equipment = Number(formData.equipment) || 0

    return Math.round(((propertyTaxes + insurance) / 12 + propertyMgmt + maintenance + utilities + hoaFees + equipment) * 100) / 100
  }

  const calculateTotalAnnualExpenses = () => {
    return calculateTotalMonthlyExpenses() * 12
  }

  const suggestPropertyManagement = () => {
    const grossRent = data.grossRent || 0
    return Math.round(grossRent * 0.10 * 100) / 100 // 10% of gross rent
  }

  const suggestMaintenance = () => {
    const purchasePrice = data.purchasePrice || 0
    return Math.round((purchasePrice * 0.01 / 12) * 100) / 100 // 1% of property value annually, divided by 12
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operating Expenses</CardTitle>
          <CardDescription>
            Enter monthly and annual operating expenses. All fields are optional but recommended for accurate analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Annual Expenses */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Annual Expenses</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyTaxes">Property Taxes (Annual)</Label>
                <Input
                  id="propertyTaxes"
                  type="text"
                  placeholder="1,800.00"
                  value={
                    focusedField === 'propertyTaxes'
                      ? formData.propertyTaxes
                      : formatCurrency(formData.propertyTaxes)
                  }
                  onFocus={() => setFocusedField('propertyTaxes')}
                  onBlur={e => {
                    setFocusedField(null);
                    // On blur, store the raw, unformatted number string
                    const raw = unformatCurrency(e.target.value);
                    handleChange('propertyTaxes', raw);
                  }}
                  onChange={e => handleChange('propertyTaxes', unformatCurrency(e.target.value))}
                  className="mt-1"
                  min="0"
                  inputMode="decimal"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Check tax records or estimate 1-2% of property value</p>
              </div>

              <div>
                <Label htmlFor="insurance">Property Insurance (Annual)</Label>
                <Input
                  id="insurance"
                  type="text"
                  placeholder="800.00"
                  value={
                    focusedField === 'insurance'
                      ? unformatCurrency(formData.insurance.toString())
                      : formatCurrency(formData.insurance)
                  }
                  onFocus={() => setFocusedField('insurance')}
                  onBlur={e => {
                    setFocusedField(null);
                    const formatted = formatCurrency(e.target.value);
                    handleChange('insurance', formatted);
                  }}
                  onChange={e => handleChange('insurance', e.target.value)}
                  className="mt-1"
                  min="0"
                  inputMode="decimal"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Get quotes from insurance providers</p>
              </div>
            </div>
          </div>

          {/* Monthly Expenses */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Monthly Expenses</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyMgmt">Property Management</Label>
                <Input
                  id="propertyMgmt"
                  type="number"
                  placeholder={suggestPropertyManagement().toString()}
                  value={formData.propertyMgmt}
                  onChange={(e) => handleChange('propertyMgmt', e.target.value)}
                  className="mt-1"
                  min="0"
                  step="25"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suggested: ${suggestPropertyManagement()}/month (10% of rent)
                </p>
              </div>

              <div>
                <Label htmlFor="maintenance">Maintenance & Repairs</Label>
                <Input
                  id="maintenance"
                  type="number"
                  placeholder={suggestMaintenance().toString()}
                  value={formData.maintenance}
                  onChange={(e) => handleChange('maintenance', e.target.value)}
                  className="mt-1"
                  min="0"
                  step="25"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suggested: ${suggestMaintenance()}/month (1% of value annually)
                </p>
              </div>

              <div>
                <Label htmlFor="utilities">Utilities (if owner-paid)</Label>
                <Input
                  id="utilities"
                  type="number"
                  placeholder="0"
                  value={formData.utilities}
                  onChange={(e) => handleChange('utilities', e.target.value)}
                  className="mt-1"
                  min="0"
                  step="25"
                />
                <p className="text-xs text-gray-500 mt-1">Only if landlord pays utilities</p>
              </div>

              <div>
                <Label htmlFor="hoaFees">HOA Fees</Label>
                <Input
                  id="hoaFees"
                  type="number"
                  placeholder="0"
                  value={formData.hoaFees}
                  onChange={(e) => handleChange('hoaFees', e.target.value)}
                  className="mt-1"
                  min="0"
                  step="25"
                />
                <p className="text-xs text-gray-500 mt-1">Homeowners Association fees</p>
              </div>

              <div>
                <Label htmlFor="equipment">Equipment & Supplies</Label>
                <Input
                  id="equipment"
                  type="number"
                  placeholder="50"
                  value={formData.equipment}
                  onChange={(e) => handleChange('equipment', e.target.value)}
                  className="mt-1"
                  min="0"
                  step="10"
                />
                <p className="text-xs text-gray-500 mt-1">Tools, supplies, miscellaneous</p>
              </div>
            </div>
          </div>

          {/* One-time Expenses */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Initial Investment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rehabCosts">Rehab/Renovation Costs</Label>
                <Input
                  id="rehabCosts"
                  type="number"
                  placeholder="0"
                  value={formData.rehabCosts}
                  onChange={(e) => handleChange('rehabCosts', e.target.value)}
                  className="mt-1"
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">One-time renovation/repair costs</p>
              </div>
            </div>
          </div>

          {/* Expense Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Operating Expense Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-700">Total Monthly Expenses:</span>
                <span className="font-semibold ml-2">
                  ${calculateTotalMonthlyExpenses().toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-700">Total Annual Expenses:</span>
                <span className="font-semibold ml-2">
                  ${calculateTotalAnnualExpenses().toLocaleString()}
                </span>
              </div>
            </div>
            {Number(formData.rehabCosts) > 0 && (
              <div className="mt-2 text-sm">
                <span className="text-gray-700">Initial Rehab Investment:</span>
                <span className="font-semibold ml-2">
                  ${Number(formData.rehabCosts).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Previous: Financing
        </Button>
        <Button onClick={onNext}>
          Next: Rental Income
        </Button>
      </div>
    </div>
  )
}