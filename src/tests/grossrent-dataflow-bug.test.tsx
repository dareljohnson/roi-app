import { render, screen, fireEvent } from '@testing-library/react'
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm'

describe('GrossRent Data Flow Bug - Focused TDD', () => {
  test('should properly update grossRent in parent when user enters monthly rent', () => {
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

    render(<RentalIncomeForm {...mockProps} />)
    
    // Find the monthly gross rent input
    const monthlyRentInput = screen.getByLabelText(/monthly gross rent/i)
    expect(monthlyRentInput).toBeInTheDocument()
    
    // Clear any previous calls
    mockOnUpdate.mockClear()
    
    // User enters a rental amount
    fireEvent.change(monthlyRentInput, {
      target: { value: '2500' }
    })
    
    // Check if onUpdate was called with proper data
    console.log('onUpdate calls after change:', mockOnUpdate.mock.calls)
    
    // Trigger blur to complete the input (this might format the value)
    fireEvent.blur(monthlyRentInput)
    
    // Check calls after blur
    console.log('onUpdate calls after blur:', mockOnUpdate.mock.calls)
    
    // Verify that grossRent was properly updated
    const lastUpdateCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1]
    if (lastUpdateCall) {
      const updatedData = lastUpdateCall[0]
      console.log('Final updated data:', updatedData)
      expect(updatedData).toHaveProperty('grossRent')
      expect(updatedData.grossRent).toBe(2500)
    } else {
      console.log('🐛 BUG: onUpdate was never called!')
      expect(mockOnUpdate).toHaveBeenCalled()
    }
  })
  
  test('should identify why grossRent update might fail', () => {
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

    render(<RentalIncomeForm {...mockProps} />)
    
    const monthlyRentInput = screen.getByLabelText(/monthly gross rent/i)
    
    // Test different input scenarios
    const testCases = [
      { input: '2500', description: 'Plain number' },
      { input: '2,500', description: 'Number with comma' },
      { input: '2500.00', description: 'Number with decimals' },
      { input: '2,500.00', description: 'Formatted currency' },
    ]
    
    testCases.forEach((testCase, index) => {
      mockOnUpdate.mockClear()
      
      // Change input value
      fireEvent.change(monthlyRentInput, {
        target: { value: testCase.input }
      })
      
      // Trigger blur
      fireEvent.blur(monthlyRentInput)
      
      console.log(`Test case ${index + 1} (${testCase.description}):`)
      console.log(`  Input: "${testCase.input}"`)
      console.log(`  onUpdate called:`, mockOnUpdate.mock.calls.length > 0)
      
      if (mockOnUpdate.mock.calls.length > 0) {
        const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0]
        console.log(`  Updated grossRent:`, lastCall.grossRent)
      }
    })
  })
  
  test('should test handleChange function logic with formatted values', () => {
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

    render(<RentalIncomeForm {...mockProps} />)
    
    const monthlyRentInput = screen.getByLabelText(/monthly gross rent/i)
    
    // Test the exact sequence: user types, field formats, then validates
    mockOnUpdate.mockClear()
    
    // 1. User types "2500"
    fireEvent.change(monthlyRentInput, {
      target: { value: '2500' }
    })
    
    console.log('After user types "2500":')
    console.log('  Input value:', (monthlyRentInput as HTMLInputElement).value)
    console.log('  onUpdate calls:', mockOnUpdate.mock.calls.length)
    
    // 2. User focuses away (blur) - this should trigger formatting
    fireEvent.blur(monthlyRentInput)
    
    console.log('After blur (formatting):')
    console.log('  Input value:', (monthlyRentInput as HTMLInputElement).value)
    console.log('  onUpdate calls:', mockOnUpdate.mock.calls.length)
    
    // 3. Check if the final value in parent state is correct
    if (mockOnUpdate.mock.calls.length > 0) {
      const finalCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0]
      console.log('  Final grossRent in parent state:', finalCall.grossRent)
      console.log('  Type of grossRent:', typeof finalCall.grossRent)
    }
  })
})