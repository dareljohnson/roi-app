'use client'

import { useState } from 'react'
import { PropertyAnalysisInput, CALCULATION_DEFAULTS } from '@/types/property'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Loader2, Calculator } from 'lucide-react'

interface RentalIncomeFormProps {
  data: Partial<PropertyAnalysisInput>
  onUpdate: (data: Partial<PropertyAnalysisInput>) => void
  onAnalyze: () => void
  onPrev: () => void
  isAnalyzing: boolean
  canAnalyze: boolean
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

export function RentalIncomeForm({ data, onUpdate, onAnalyze, onPrev, isAnalyzing, canAnalyze }: RentalIncomeFormProps) {

  // State for form data
  // Always use a valid default for vacancyRate (5%) if missing or invalid
  const initialVacancyRate = (() => {
    const v = data.vacancyRate;
    if (typeof v === 'number' && !isNaN(v)) {
      // If already decimal (0-1), convert to percent
      if (v <= 1) return (v * 100).toString();
      // If already percent (1-100), use as is
      if (v > 1 && v <= 100) return v.toString();
    }
    return (CALCULATION_DEFAULTS.VACANCY_RATE * 100).toString();
  })();
  const [formData, setFormData] = useState({
    grossRent: data.grossRent?.toString() || '',
    vacancyRate: initialVacancyRate,
  });

  // Helper: calculate effective rent
  const calculateEffectiveRent = () => {
    const grossRent = Number(formData.grossRent) || 0;
    const vacancyRate = Number(formData.vacancyRate) || 0;
    return Math.round(grossRent * (1 - vacancyRate / 100) * 100) / 100;
  };

  // Helper: calculate annual gross income
  const calculateAnnualGrossIncome = () => {
    return (Number(formData.grossRent) || 0) * 12;
  };

  // Helper: calculate annual effective income
  const calculateAnnualEffectiveIncome = () => {
    return calculateEffectiveRent() * 12;
  };

  // Helper: rent estimates
  const rentEstimates = (() => {
    const purchasePrice = data.purchasePrice || 0;
    const squareFootage = data.squareFootage || 1200;
    const grossRent = Number(formData.grossRent) || 0;
    const lowEstimate = Math.round(purchasePrice * 0.005);
    const highEstimate = Math.round(purchasePrice * 0.015);
    const sqftEstimate = squareFootage > 0 ? Math.round((grossRent / squareFootage) * 100) / 100 : 0;
    return { low: lowEstimate, high: highEstimate, sqft: sqftEstimate };
  })();

  // Helper: is form valid
  const isValid = () => {
    const vacancyRate = Number(formData.vacancyRate);
    const vacancyValid = vacancyRate >= 0 && vacancyRate <= 100;
    
    // For individual rooms strategy, grossRent is calculated from room rates
    if (data.rentalStrategy === 'individual-rooms') {
      const hasValidRooms = data.rentableRooms && data.rentableRooms.length > 0 && 
                           data.rentableRooms.every(room => room.weeklyRate > 0);
      return hasValidRooms && vacancyValid;
    }
    
    // For entire house strategy, need explicit grossRent
    const grossRent = Number(formData.grossRent);
    return grossRent > 0 && vacancyValid;
  };

  // User-friendly error for vacancy rate
  let vacancyRateError = '';
  const vacancyRateNum = Number(formData.vacancyRate);
  if (formData.vacancyRate === '' || isNaN(vacancyRateNum)) {
    vacancyRateError = 'Please enter a vacancy rate (e.g. 5 for 5%).';
  } else if (vacancyRateNum < 0 || vacancyRateNum > 100) {
    vacancyRateError = 'Vacancy rate must be between 0 and 100.';
  }

  // Track which input is focused for formatting
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    // Convert to numbers and update parent
    const processedData: Partial<PropertyAnalysisInput> = {};
    
    // Only update grossRent for entire-house strategy
    // For individual-rooms, grossRent is calculated from room rates in PropertyDetailsForm
    if ((!data.rentalStrategy || data.rentalStrategy === 'entire-house') && newData.grossRent && newData.grossRent !== '') {
      // Remove formatting before converting to number to handle values like "2,500.00"
      const cleanValue = unformatCurrency(newData.grossRent.toString());
      processedData.grossRent = Number(cleanValue);
    }
    
    if (newData.vacancyRate && newData.vacancyRate !== '') {
      // Convert percentage back to decimal
      processedData.vacancyRate = Number(newData.vacancyRate) / 100;
    }
    onUpdate(processedData);
  };

  // ...helpers (calculateEffectiveRent, calculateAnnualGrossIncome, etc.) should be here...

  return (
    <div className="space-y-6">
      {/* Rental Strategy Display */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Selected Rental Strategy</h4>

        <div className="text-sm text-blue-800">
          {data.rentalStrategy === 'individual-rooms' ? (
            <>
              <p><strong>Individual Rooms:</strong> You're renting out individual rooms to multiple tenants</p>
              {data.rentableRooms && data.rentableRooms.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Room Configuration:</p>
                  <ul className="ml-4 list-disc">
                    {data.rentableRooms.map((room, idx) => (
                      <li key={idx}>
                        Room {room.roomNumber}: ${room.weeklyRate}/week (${(room.weeklyRate * 4).toLocaleString()}/month)
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-semibold">
                    Total Monthly Income from Rooms: ${data.grossRent?.toLocaleString() || '0'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p><strong>Entire House/Unit:</strong> You're renting the entire property to one tenant or family</p>
          )}
        </div>
      </div>

      {/* Gross Rent and Market Estimates - Only show for entire-house strategy */}
      {(!data.rentalStrategy || data.rentalStrategy === 'entire-house') && (
        <>
          <div>
            <Label htmlFor="grossRent">Monthly Gross Rent *</Label>
        <Input
          id="grossRent"
          type="text"
          placeholder="2,000.00"
          value={
            focusedField === 'grossRent'
              ? unformatCurrency(formData.grossRent.toString())
              : formatCurrency(formData.grossRent)
          }
          onFocus={() => setFocusedField('grossRent')}
          onBlur={e => {
            setFocusedField(null);
            const formatted = formatCurrency(e.target.value);
            handleChange('grossRent', formatted);
          }}
          onChange={e => handleChange('grossRent', e.target.value)}
          className="mt-1"
          min="0"
          inputMode="decimal"
          step="0.01"
        />
        <p className="text-xs text-gray-500 mt-1">Total rent collected from all units</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <span className="block text-blue-700">Conservative</span>
          <span className="font-semibold">{rentEstimates.low.toLocaleString()}</span>
        </div>
        <div className="text-center">
          <span className="block text-blue-700">Actual Rent Per Sq Ft</span>
          <span className="font-semibold">{rentEstimates.sqft.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="block text-xs text-gray-500">(Gross Rent / Sq Ft)</span>
        </div>
        <div className="text-center">
          <span className="block text-blue-700">Optimistic</span>
          <span className="font-semibold">{rentEstimates.high.toLocaleString()}</span>
        </div>
      </div>
        </>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vacancy Rate */}
        <div>
          <Label htmlFor="vacancyRate">Vacancy Rate (%)</Label>
          <Input
            id="vacancyRate"
            type="number"
            placeholder="5"
            value={formData.vacancyRate}
            onChange={(e) => handleChange('vacancyRate', e.target.value)}
            onBlur={e => {
              if (e.target.value === '' || isNaN(Number(e.target.value))) {
                handleChange('vacancyRate', '5');
              }
            }}
            className={`mt-1 ${vacancyRateError ? 'border-red-500 focus:ring-red-500' : ''}`}
            min="0"
            max="100"
            step="0.5"
            aria-invalid={!!vacancyRateError}
            aria-describedby="vacancyRate-error"
          />
          {vacancyRateError ? (
            <p id="vacancyRate-error" className="text-xs text-red-600 mt-1">{vacancyRateError}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Typical: 5-10% (0% for triple-net leases)
            </p>
          )}
        </div>
      </div>
      {/* Income Summary */}
      {isValid() && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Rental Income Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700">Monthly Gross Rent:</span>
              <span className="font-semibold ml-2">
                {Number(formData.grossRent).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-green-700">Monthly Effective Rent:</span>
              <span className="font-semibold ml-2">
                {calculateEffectiveRent().toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-green-700">Annual Gross Income:</span>
              <span className="font-semibold ml-2">
                {calculateAnnualGrossIncome().toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-green-700">Annual Effective Income:</span>
              <span className="font-semibold ml-2">
                {calculateAnnualEffectiveIncome().toLocaleString()}
              </span>
            </div>
          </div>
          {Number(formData.vacancyRate) > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-green-700">Annual Vacancy Loss:</span>
              <span className="font-semibold ml-2">
                {(calculateAnnualGrossIncome() - calculateAnnualEffectiveIncome()).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
      {/* Tips */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-semibold text-yellow-900 mb-2">💡 Rental Income Tips</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Research comparable rentals in the same area and property type</li>
          <li>• Consider seasonal variations in rental demand</li>
          <li>• Factor in rent increases over time (typically 2-3% annually)</li>
          <li>• Be conservative with estimates for better investment decisions</li>
          <li>• Consider additional income sources (parking, storage, laundry)</li>
        </ul>
      </div>
      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Previous: Expenses
        </Button>
        <Button 
          onClick={onAnalyze} 
          disabled={!canAnalyze || isAnalyzing}
          className="px-8"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Analyze Investment
            </>
          )}
        </Button>
      </div>
      {/* Error Message */}
      {!canAnalyze && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-900 mb-2">⚠️ Missing Required Information</h4>
          <p className="text-sm text-red-800">
            Please complete all required fields to analyze this investment:
          </p>
          <ul className="text-sm text-red-800 mt-2 ml-4 list-disc">
            {!data.address && <li>Property address</li>}
            {!data.propertyType && <li>Property type</li>}
            {!data.purchasePrice && <li>Purchase price</li>}
            {!data.downPayment && <li>Down payment amount</li>}
            {!data.interestRate && <li>Interest rate</li>}
            {!data.loanTerm && <li>Loan term</li>}
            {!data.grossRent && <li>Monthly gross rent</li>}
          </ul>
        </div>
      )}
    </div>
  );
}