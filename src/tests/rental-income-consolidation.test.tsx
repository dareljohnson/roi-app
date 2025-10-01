import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PropertyDetailsForm } from '@/components/forms/PropertyDetailsForm'
import type { PropertyAnalysisInput } from '@/types/property'

describe('Rental Income Consolidation - TDD Implementation', () => {
  let mockOnUpdate: jest.Mock
  let mockOnNext: jest.Mock

  beforeEach(() => {
    mockOnUpdate = jest.fn()
    mockOnNext = jest.fn()
    jest.clearAllMocks()
  })

  test('should show monthly gross rent input on Property Details tab for entire-house strategy', async () => {
    let currentFormData: Partial<PropertyAnalysisInput> = {}
    
    const handleUpdate = (newData: Partial<PropertyAnalysisInput>) => {
      currentFormData = { ...currentFormData, ...newData }
      mockOnUpdate(newData)
    }

    render(
      <PropertyDetailsForm
        data={currentFormData}
        onUpdate={handleUpdate}
        onNext={mockOnNext}
      />
    )

    // Verify rental strategy defaults to entire-house
    const rentalStrategySelect = screen.getByLabelText(/rental strategy/i)
    expect(rentalStrategySelect).toHaveValue('entire-house')

    // Should show monthly gross rent input for entire-house strategy
    const monthlyGrossRentInput = screen.getByLabelText(/monthly gross rent/i)
    expect(monthlyGrossRentInput).toBeInTheDocument()
    expect(monthlyGrossRentInput).toHaveAttribute('type', 'text')
    expect(monthlyGrossRentInput).toHaveAttribute('placeholder', '2,000.00')

    // User enters rental amount on Property Details tab
    fireEvent.change(monthlyGrossRentInput, {
      target: { value: '2500' }
    })

    // Trigger blur to format the value
    fireEvent.blur(monthlyGrossRentInput)

    // Verify the value is formatted and passed to parent
    await waitFor(() => {
      expect((monthlyGrossRentInput as HTMLInputElement).value).toBe('2,500.00')
    })

    // Verify grossRent is updated in form data
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        grossRent: 2500
      })
    )

    console.log('✅ Monthly gross rent input successfully added to Property Details tab')
  })

  test('should NOT show monthly gross rent input for individual-rooms strategy', () => {
    render(
      <PropertyDetailsForm
        data={{ 
          rentalStrategy: 'individual-rooms',
          bedrooms: 3
        }}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    )

    // Select individual-rooms strategy
    const rentalStrategySelect = screen.getByLabelText(/rental strategy/i)
    expect(rentalStrategySelect).toHaveValue('individual-rooms')

    // Should NOT show monthly gross rent input
    const monthlyGrossRentInput = screen.queryByLabelText(/monthly gross rent/i)
    expect(monthlyGrossRentInput).not.toBeInTheDocument()

    // Should show room configuration instead
    expect(screen.getByLabelText(/rooms to rent/i)).toBeInTheDocument()

    console.log('✅ Monthly gross rent input correctly hidden for individual-rooms strategy')
  })

  test('should display appropriate inputs based on rental strategy', () => {
    // Test individual-rooms strategy shows room controls and not gross rent
    const { unmount } = render(
      <PropertyDetailsForm
        data={{ 
          bedrooms: 3,
          rentalStrategy: 'individual-rooms'
        }}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    )

    // Should show room configuration, not gross rent input
    expect(screen.queryByLabelText(/monthly gross rent/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/rooms to rent/i)).toBeInTheDocument()
    
    unmount()
    
    // Test entire-house strategy shows gross rent and not room controls
    render(
      <PropertyDetailsForm
        data={{ 
          bedrooms: 3,
          rentalStrategy: 'entire-house'
        }}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    )

    // Should show gross rent input, not room configuration
    expect(screen.getByLabelText(/monthly gross rent/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/rooms to rent/i)).not.toBeInTheDocument()

    console.log('✅ Rental input display correctly determined by strategy')
  })

  test('should validate and handle various rental amount formats', () => {
    let currentFormData: Partial<PropertyAnalysisInput> = {}
    
    const handleUpdate = (newData: Partial<PropertyAnalysisInput>) => {
      currentFormData = { ...currentFormData, ...newData }
      mockOnUpdate(newData)
    }

    render(
      <PropertyDetailsForm
        data={currentFormData}
        onUpdate={handleUpdate}
        onNext={mockOnNext}
      />
    )

    const monthlyGrossRentInput = screen.getByLabelText(/monthly gross rent/i)
    
    const testCases = [
      { input: '1500', expected: 1500, formatted: '1,500.00' },
      { input: '2500.50', expected: 2500.5, formatted: '2,500.50' },
      { input: '1,800', expected: 1800, formatted: '1,800.00' },
      { input: '3,250.75', expected: 3250.75, formatted: '3,250.75' },
    ]

    testCases.forEach(({ input, expected, formatted }) => {
      mockOnUpdate.mockClear()
      
      // Enter value
      fireEvent.change(monthlyGrossRentInput, {
        target: { value: input }
      })
      
      // Trigger blur
      fireEvent.blur(monthlyGrossRentInput)
      
      // Check formatted display
      expect((monthlyGrossRentInput as HTMLInputElement).value).toBe(formatted)
      
      // Check numeric value passed to parent
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          grossRent: expected
        })
      )
    })

    console.log('✅ All rental amount formats handled correctly')
  })

  test('should preserve gross rent when already set in data', () => {
    const existingData = {
      rentalStrategy: 'entire-house' as const,
      grossRent: 2200,
      address: '123 Test St'
    }

    render(
      <PropertyDetailsForm
        data={existingData}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    )

    const monthlyGrossRentInput = screen.getByLabelText(/monthly gross rent/i)
    
    // Should display the existing value formatted
    expect((monthlyGrossRentInput as HTMLInputElement).value).toBe('2,200.00')

    console.log('✅ Existing gross rent value preserved and displayed')
  })
})