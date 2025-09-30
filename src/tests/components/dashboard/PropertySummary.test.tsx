import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { ResultsDashboard } from '@/components/dashboard/ResultsDashboard';
import { PropertyAnalysisInput, CalculationResults } from '@/types/property';

// Mock data for testing enhanced Property Summary
const mockPropertyData: PropertyAnalysisInput = {
  address: '123 Test Street, Test City',
  propertyType: 'Single Family',
  purchasePrice: 250000,
  downPayment: 50000,
  interestRate: 4.5, // Percentage format (not decimal)
  loanTerm: 30,
  yearBuilt: 2010,
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1500,
  grossRent: 2000,
  vacancyRate: 0.05,
  rentableRooms: [
    { roomNumber: 1, weeklyRate: 200 },
    { roomNumber: 2, weeklyRate: 180 },
  ],
  propertyTaxes: 3000,
  insurance: 1200,
  propertyMgmt: 1800,
  maintenance: 1500,
  utilities: 800,
  hoaFees: 600,
  equipment: 300,
  rehabCosts: 2000,
  pmiRate: 0.5, // Percentage format (not decimal)
  closingCosts: 5000,
  imageUrl: 'https://example.com/image.jpg',
};

const mockResults: CalculationResults = {
  monthlyPayment: 1200,
  monthlyCashFlow: 1038,
  monthlyOperatingExpenses: 962,
  annualCashFlow: 12456,
  netOperatingIncome: 15000,
  effectiveGrossIncome: 23000,
  totalAnnualExpenses: 11200,
  roi: 0.18,
  capRate: 0.089,
  cashOnCashReturn: 0.226,
  debtServiceCoverageRatio: 1.5,
  totalCashInvested: 55000,
  loanAmount: 200000,
  npv: 50000,
  recommendation: 'BUY' as const,
  recommendationScore: 85,
  recommendationReasons: ['Positive cash flow', 'Good ROI'],
  monthlyProjections: [],
  annualProjections: []
};

// Helper function to render with SessionProvider
const renderWithSession = (component: React.ReactElement) => {
  return render(
    <SessionProvider session={null}>
      {component}
    </SessionProvider>
  );
};

describe('Enhanced Property Summary', () => {
  it('displays basic property information', () => {
    renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    );

    // Verify basic property information is displayed
    expect(screen.getByText('123 Test Street, Test City')).toBeInTheDocument();
    expect(screen.getByText('Single Family')).toBeInTheDocument();
    expect(screen.getByText('$250,000')).toBeInTheDocument();
    
    // Check down payment section exists
    expect(screen.getByText('Down Payment')).toBeInTheDocument();
    expect(screen.getByText('(20.0%)')).toBeInTheDocument();
  });

  it('displays year built information when available', () => {
    renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    );

    expect(screen.getByText('Year Built')).toBeInTheDocument();
    expect(screen.getByText('2010')).toBeInTheDocument();
  });

  it('displays loan term information', () => {
    renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    );

    expect(screen.getByText('Loan Term')).toBeInTheDocument();
    expect(screen.getByText('30 years')).toBeInTheDocument();
  });

  it('displays rooms to rent information when available', () => {
    renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    );

    expect(screen.getByText('Rooms to Rent')).toBeInTheDocument();
    expect(screen.getByText('2 rooms')).toBeInTheDocument();
    
    // Should display total monthly rent from rooms
    const totalMonthlyRent = (200 + 180) * 4; // weekly rates × 4
    expect(screen.getByText(`$${totalMonthlyRent.toLocaleString()}/month`)).toBeInTheDocument();
  });

  it('displays operating expenses breakdown', () => {
    renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    );

    // Check for operating expenses section
    expect(screen.getByText('Monthly Operating Expenses')).toBeInTheDocument();
    
    // Check individual expense items (now displayed as monthly)
    expect(screen.getByText('Property Taxes')).toBeInTheDocument();
    expect(screen.getByText('$250')).toBeInTheDocument(); // 3000/12 = 250
    
    expect(screen.getByText('Insurance')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument(); // 1200/12 = 100
    
    expect(screen.getByText('Property Management')).toBeInTheDocument();
    expect(screen.getByText('$1,800')).toBeInTheDocument();
    
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.getByText('$1,500')).toBeInTheDocument();
  });

  it('displays total monthly operating expenses', () => {
    renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    );

    // Check for total monthly operating expenses display
    // propertyTaxes (3000/12 = 250), insurance (1200/12 = 100), 
    // propertyMgmt (1800), maintenance (1500), utilities (800), hoaFees (600), equipment (300)
    const totalMonthlyExpenses = (3000 / 12) + (1200 / 12) + 1800 + 1500 + 800 + 600 + 300; // 5350
    expect(screen.getByText('Total Monthly Operating')).toBeInTheDocument();
    expect(screen.getByText(`$${totalMonthlyExpenses.toLocaleString()}`)).toBeInTheDocument();
  });

  it('handles missing optional data gracefully', () => {
    const incompleteData = {
      ...mockPropertyData,
      yearBuilt: undefined,
      rentableRooms: [],
      propertyTaxes: 0,
      insurance: 0,
    };

    renderWithSession(
      <ResultsDashboard 
        propertyData={incompleteData}
        results={mockResults}
      />
    );

    // Should still display basic information
    expect(screen.getByText('123 Test Street, Test City')).toBeInTheDocument();
    
    // Year built should not be displayed when not available
    expect(screen.queryByText('Year Built')).not.toBeInTheDocument();
    
    // Rooms to rent should show "0 rooms" or not display section
    expect(screen.queryByText('2 rooms')).not.toBeInTheDocument();
  });

  it('displays financing details including PMI when applicable', () => {
    renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    );

    expect(screen.getByText('Interest Rate')).toBeInTheDocument();
    // Interest rate should display as percentage
    // mockPropertyData.interestRate is 4.5 (percentage) so display should be 4.5%
    expect(screen.getByText('4.5%')).toBeInTheDocument();
    
    expect(screen.getByText('PMI Rate')).toBeInTheDocument();
    // pmiRate is 0.5 (percentage) so display should be 0.5%  
    expect(screen.getByText('0.5%')).toBeInTheDocument();
  });

  it('displays PMI rate label even when PMI is 0', () => {
    const propertyWithNoPMI = {
      ...mockPropertyData,
      pmiRate: 0, // No PMI required
    };
    
    renderWithSession(
      <ResultsDashboard 
        propertyData={propertyWithNoPMI}
        results={mockResults}
      />
    );
    
    expect(screen.getByText('PMI Rate')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('(None required)')).toBeInTheDocument();
  });

  it('handles different interest rate formats correctly', () => {
    const testPropertyWithPercentageRate = {
      ...mockPropertyData,
      interestRate: 6.2, // Already in percentage format
    };
    
    renderWithSession(
      <ResultsDashboard 
        propertyData={testPropertyWithPercentageRate}
        results={mockResults}
      />
    );

    expect(screen.getByText('Interest Rate')).toBeInTheDocument();
    // Should NOT display 620.0%
    expect(screen.queryByText('620.0%')).not.toBeInTheDocument();
  });

  it('displays property details when available', () => {
    renderWithSession(
      <ResultsDashboard 
        propertyData={mockPropertyData}
        results={mockResults}
      />
    );

    expect(screen.getByText('Square Footage')).toBeInTheDocument();
    expect(screen.getByText('1,500 sq ft')).toBeInTheDocument();
    
    expect(screen.getByText('Bedrooms')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    expect(screen.getByText('Bathrooms')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});