import { render, screen } from '@testing-library/react'
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm'
import type { PropertyAnalysisInput } from '@/types/property'

describe('RentalIncomeForm - Display Consolidated Input', () => {
  let mockOnUpdate: jest.Mock
  let mockOnAnalyze: jest.Mock
  let mockOnPrev: jest.Mock

  beforeEach(() => {
    mockOnUpdate = jest.fn()
    mockOnAnalyze = jest.fn()
    mockOnPrev = jest.fn()
    jest.clearAllMocks()
  })

  test('should display passed grossRent value correctly for entire-house strategy', () => {
    const formData: Partial<PropertyAnalysisInput> = {
      rentalStrategy: 'entire-house',
      grossRent: 2500
    }

    render(
      <RentalIncomeForm
        data={formData}
        onUpdate={mockOnUpdate}
        onAnalyze={mockOnAnalyze}  
        onPrev={mockOnPrev}
        isAnalyzing={false}
        canAnalyze={true}
      />
    )

    // Should show the passed grossRent value in the input field (pre-filled)
    const grossRentInput = screen.getByLabelText(/monthly gross rent/i) as HTMLInputElement
    expect(grossRentInput.value).toBe('2,500.00')
    
    // Should show the value in the rental income summary
    expect(screen.getByText('2,500')).toBeInTheDocument()

    console.log('✅ RentalIncomeForm displays passed grossRent value correctly')
  })

  test('should display room rental summary for individual-rooms strategy', () => {
    const formData: Partial<PropertyAnalysisInput> = {
      rentalStrategy: 'individual-rooms',
      grossRent: 2400, // Calculated from room rates
      rentableRooms: [
        { roomNumber: 1, weeklyRate: 150 },
        { roomNumber: 2, weeklyRate: 175 },
        { roomNumber: 3, weeklyRate: 125 }
      ]
    }

    render(
      <RentalIncomeForm
        data={formData}
        onUpdate={mockOnUpdate}
        onAnalyze={mockOnAnalyze}  
        onPrev={mockOnPrev}
        isAnalyzing={false}
        canAnalyze={true}
      />
    )

    // Should show room configuration details
    expect(screen.getByText(/room configuration:/i)).toBeInTheDocument()
    expect(screen.getByText(/Room 1.*\$150.*week/)).toBeInTheDocument()
    expect(screen.getByText(/Room 2.*\$175.*week/)).toBeInTheDocument()
    expect(screen.getByText(/Room 3.*\$125.*week/)).toBeInTheDocument()
    
    // Should show total monthly income from rooms (using the passed grossRent value)
    expect(screen.getByText(/Total Monthly Income from Rooms.*\$2,400/)).toBeInTheDocument()
    
    // Should show the calculated grossRent in the summary  
    expect(screen.getByText('2,400')).toBeInTheDocument()

    console.log('✅ RentalIncomeForm displays room rental summary correctly')
  })

  test('should show input field when no grossRent is provided (backward compatibility)', () => {
    const formData: Partial<PropertyAnalysisInput> = {
      rentalStrategy: 'entire-house'
      // No grossRent provided
    }

    render(
      <RentalIncomeForm
        data={formData}
        onUpdate={mockOnUpdate}
        onAnalyze={mockOnAnalyze}  
        onPrev={mockOnPrev}
        isAnalyzing={false}
        canAnalyze={true}
      />
    )

    // Should fall back to showing editable input field for backward compatibility
    expect(screen.getByLabelText(/monthly gross rent/i)).toBeInTheDocument()

    console.log('✅ RentalIncomeForm shows input field for backward compatibility')
  })
})