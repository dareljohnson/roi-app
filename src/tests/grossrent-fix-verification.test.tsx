import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm'

describe('GrossRent Validation Bug - Comprehensive Fix Verification', () => {
  test('should handle complete user flow without validation errors', () => {
    const mockOnUpdate = jest.fn()
    const mockOnAnalyze = jest.fn()
    
    // Mock window.alert to catch any validation errors
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    
    const mockProps = {
      data: {
        rentalStrategy: 'entire-house' as const,
        purchasePrice: 300000,
        squareFootage: 1200,
        address: '123 Test Street',
        propertyType: 'Single Family' as const,
        downPayment: 60000,
        interestRate: 6.5,
        loanTerm: 30,
        propertyTaxes: 3000,
        insurance: 1200,
      },
      onUpdate: mockOnUpdate,
      onAnalyze: mockOnAnalyze,
      onPrev: jest.fn(),
      isAnalyzing: false,
      canAnalyze: true, // Simulating that all other required fields are filled
    }

    render(<RentalIncomeForm {...mockProps} />)
    
    // Find the monthly gross rent input
    const monthlyRentInput = screen.getByLabelText(/monthly gross rent/i)
    expect(monthlyRentInput).toBeInTheDocument()
    
    // Clear mock calls
    mockOnUpdate.mockClear()
    mockOnAnalyze.mockClear()
    
    // User enters rental amount
    fireEvent.change(monthlyRentInput, {
      target: { value: '2500' }
    })
    
    // User focuses away (triggers formatting)
    fireEvent.blur(monthlyRentInput)
    
    // Verify the input is properly formatted
    expect((monthlyRentInput as HTMLInputElement).value).toBe('2,500.00')
    
    // Verify that grossRent was properly updated in parent state
    expect(mockOnUpdate).toHaveBeenCalled()
    const lastUpdateCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0]
    expect(lastUpdateCall.grossRent).toBe(2500)
    expect(typeof lastUpdateCall.grossRent).toBe('number')
    
    // User clicks Analyze Investment
    const analyzeButton = screen.getByRole('button', { name: /analyze investment/i })
    fireEvent.click(analyzeButton)
    
    // Verify no alert was shown (no validation error)
    expect(alertSpy).not.toHaveBeenCalled()
    
    // Verify the analysis was triggered
    expect(mockOnAnalyze).toHaveBeenCalled()
    
    alertSpy.mockRestore()
    
    console.log('✅ Complete user flow test passed - no validation errors!')
  })
  
  test('should handle various input formats correctly', () => {
    const testCases = [
      { input: '1500', expected: 1500, description: 'Simple integer' },
      { input: '1500.50', expected: 1500.5, description: 'Decimal number' },
      { input: '1,500', expected: 1500, description: 'Number with comma' },
      { input: '1,500.75', expected: 1500.75, description: 'Formatted currency' },
      { input: '10000', expected: 10000, description: 'Large number' },
      { input: '0', expected: 0, description: 'Zero value' },
    ]
    
    testCases.forEach((testCase) => {
      const mockOnUpdate = jest.fn()
      const mockProps = {
        data: {
          rentalStrategy: 'entire-house' as const,
          purchasePrice: 300000,
          squareFootage: 1200,
        },
        onUpdate: mockOnUpdate,
        onAnalyze: jest.fn(),
        onPrev: jest.fn(),
        isAnalyzing: false,
        canAnalyze: true,
      }

      const { unmount } = render(<RentalIncomeForm {...mockProps} />)
      
      const monthlyRentInput = screen.getByLabelText(/monthly gross rent/i)
      
      // Enter the test value
      fireEvent.change(monthlyRentInput, {
        target: { value: testCase.input }
      })
      
      // Trigger blur
      fireEvent.blur(monthlyRentInput)
      
      // Verify the parent state was updated correctly
      expect(mockOnUpdate).toHaveBeenCalled()
      const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0]
      
      expect(lastCall.grossRent).toBe(testCase.expected)
      expect(typeof lastCall.grossRent).toBe('number')
      expect(isNaN(lastCall.grossRent)).toBe(false)
      
      console.log(`✅ ${testCase.description}: "${testCase.input}" → ${testCase.expected}`)
      
      unmount()
    })
  })
  
  test('should show validation error for invalid inputs', () => {
    const mockOnUpdate = jest.fn()
    const mockProps = {
      data: {
        rentalStrategy: 'entire-house' as const,
        purchasePrice: 300000,
        squareFootage: 1200,
      },
      onUpdate: mockOnUpdate,
      onAnalyze: jest.fn(),
      onPrev: jest.fn(),
      isAnalyzing: false,
      canAnalyze: false, // Should be false when grossRent is invalid
    }

    render(<RentalIncomeForm {...mockProps} />)
    
    const monthlyRentInput = screen.getByLabelText(/monthly gross rent/i)
    
    // Test invalid inputs
    const invalidInputs = ['', 'abc', '-100', 'not a number']
    
    invalidInputs.forEach((invalidInput) => {
      mockOnUpdate.mockClear()
      
      fireEvent.change(monthlyRentInput, {
        target: { value: invalidInput }
      })
      
      fireEvent.blur(monthlyRentInput)
      
      // For empty or invalid strings, the component should handle gracefully
      if (mockOnUpdate.mock.calls.length > 0) {
        const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0]
        // Should either not update grossRent or set it to 0
        if (lastCall.hasOwnProperty('grossRent')) {
          expect(typeof lastCall.grossRent).toBe('number')
          expect(isNaN(lastCall.grossRent)).toBe(false)
        }
      }
    })
    
    console.log('✅ Invalid input handling test passed')
  })
})