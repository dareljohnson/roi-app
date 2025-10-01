import { render, screen } from '@testing-library/react'
import { RentalIncomeForm } from '@/components/forms/RentalIncomeForm'

// Mock props for RentalIncomeForm
const mockProps = {
  data: {
    rentalStrategy: 'entire-house' as const, // This is key - entire-house strategy
    purchasePrice: 300000,
    squareFootage: 1200,
  },
  onUpdate: jest.fn(),
  onAnalyze: jest.fn(),
  onPrev: jest.fn(),
  isAnalyzing: false,
  canAnalyze: true,
}

describe('Monthly Rent Input Field - Direct Test', () => {
  test('should show monthly gross rent input field for entire-house strategy', () => {
    render(<RentalIncomeForm {...mockProps} />)
    
    // The monthly rent input field should be present
    const monthlyRentInput = screen.getByLabelText(/monthly gross rent/i)
    expect(monthlyRentInput).toBeInTheDocument()
    expect(monthlyRentInput).toHaveAttribute('type', 'text')
    expect(monthlyRentInput).toHaveAttribute('placeholder', '2,000.00')
    
    // Should show the rental strategy information
    expect(screen.getByText(/selected rental strategy/i)).toBeInTheDocument()
    expect(screen.getByText(/entire house\/unit/i)).toBeInTheDocument()
    expect(screen.getByText(/renting the entire property to one tenant/i)).toBeInTheDocument()
    
    console.log('✅ Monthly Gross Rent input field is present and working')
  })
  
  test('should NOT show monthly gross rent input field for individual-rooms strategy', () => {
    const individualRoomsProps = {
      ...mockProps,
      data: {
        ...mockProps.data,
        rentalStrategy: 'individual-rooms' as const,
        rentableRooms: [
          { roomNumber: 1, weeklyRate: 150 },
          { roomNumber: 2, weeklyRate: 160 },
        ],
        grossRent: 1240, // Calculated from rooms
      }
    }
    
    render(<RentalIncomeForm {...individualRoomsProps} />)
    
    // Should NOT show the monthly rent input for individual rooms
    expect(screen.queryByLabelText(/monthly gross rent/i)).not.toBeInTheDocument()
    
    // Should show individual rooms information instead
    expect(screen.getAllByText(/individual rooms/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/room configuration/i)).toBeInTheDocument()
    
    console.log('✅ Individual rooms strategy correctly hides monthly rent input')
  })
})