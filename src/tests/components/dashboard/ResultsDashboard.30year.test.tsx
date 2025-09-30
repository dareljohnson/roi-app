
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { ResultsDashboard } from '@/components/dashboard/ResultsDashboard';
import { CalculationResults, PropertyAnalysisInput } from '@/types/property';

describe('ResultsDashboard 30-Year Projections', () => {
  const mockResults: CalculationResults = {
    monthlyPayment: 1000,
    monthlyCashFlow: 200,
    monthlyOperatingExpenses: 300,
    annualCashFlow: 2400,
    netOperatingIncome: 5000,
    effectiveGrossIncome: 10000,
    totalAnnualExpenses: 3600,
    roi: 10,
    capRate: 5,
    cashOnCashReturn: 8,
    debtServiceCoverageRatio: 1.2,
    totalCashInvested: 50000,
    loanAmount: 200000,
    npv: 10000,
    irr: 12,
    recommendation: 'BUY',
    recommendationScore: 90,
    recommendationReasons: ['Good cash flow'],
    monthlyProjections: [],
    annualProjections: Array.from({ length: 30 }, (_, i) => ({
      year: i + 1,
      grossRent: 12000 * Math.pow(1.025, i),
      vacancyLoss: 600,
      effectiveGrossIncome: 11400,
      operatingExpenses: 3600,
      netOperatingIncome: 7800,
      debtService: 12000,
      cashFlow: 200 + i * 10,
      cumulativeCashFlow: 200 * (i + 1),
      propertyValue: 250000 * Math.pow(1.03, i),
      equity: 50000 + i * 5000,
      totalReturn: 10000 + i * 1000,
      roi: 10 + i * 0.5,
    })),
  };

  const mockInput: PropertyAnalysisInput = {
    address: '123 Main St',
    propertyType: 'Single Family',
    purchasePrice: 250000,
    downPayment: 50000,
    interestRate: 7.5,
    loanTerm: 30,
    closingCosts: 5000,
    pmiRate: 0.5,
    propertyTaxes: 3000,
    insurance: 1200,
    propertyMgmt: 1800,
    maintenance: 1500,
    utilities: 800,
    hoaFees: 600,
    equipment: 300,
    rehabCosts: 0,
    grossRent: 12000,
    vacancyRate: 0.05,
  };

  it('shows 5-year projections by default and toggles to 30-year', () => {
    render(
      <SessionProvider session={null}>
        <ResultsDashboard results={mockResults} propertyData={mockInput} defaultTab="projections" />
      </SessionProvider>
    );
  // Default: 5-year
  expect(screen.getByTestId('toggle-5yr')).toBeInTheDocument();
  expect(screen.getByTestId('toggle-30yr')).toBeInTheDocument();
  // Should show 5 year rows by default
  let yearRows = screen.getAllByText(/^Year \d+$/);
  expect(yearRows.length).toBe(5);
  // Should not show Year 30 row
  expect(yearRows.some(el => el.textContent === 'Year 30')).toBe(false);

  // Toggle to 30-year
  fireEvent.click(screen.getByTestId('toggle-30yr'));
  yearRows = screen.getAllByText(/^Year \d+$/);
  expect(yearRows.length).toBe(30);
  expect(yearRows.some(el => el.textContent === 'Year 30')).toBe(true);
  });
});
