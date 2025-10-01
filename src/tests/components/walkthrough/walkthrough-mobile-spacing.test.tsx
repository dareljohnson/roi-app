/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { WalkThroughNotes } from '@/components/walkthrough/WalkThroughNotes'

// Mock the form component to isolate the spacing issue
jest.mock('@/components/walkthrough/WalkThroughNoteForm', () => ({
  WalkThroughNoteForm: ({ onSubmit, onCancel, isEditing, initialData }: any) => (
    <div data-testid="note-form">
      <h3>Mock Form</h3>
      <button onClick={() => onSubmit({ title: 'Test', content: 'Test', rating: 3 })}>
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('WalkThrough Notes Mobile Spacing', () => {
  const mockProps = {
    propertyId: 'mobile-prop-123',
    propertyAddress: '1234 Long Property Address Street With Very Long Name That Could Overflow'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should have proper spacing between description and Add Note button on mobile', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    const { container } = render(<WalkThroughNotes {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Walk-Through Notes')).toBeInTheDocument()
      expect(screen.getByText('Add Note')).toBeInTheDocument()
    })

    // Verify description text is present
    expect(screen.getByText(/Your personal observations and notes from visiting/)).toBeInTheDocument()
    
    // Check for the flex container that might cause spacing issues
    const flexContainer = container.querySelector('[class*="flex"][class*="justify-between"]')
    expect(flexContainer).toBeInTheDocument()

    // Verify Add Note button is present and accessible
    const addButton = screen.getByText('Add Note')
    expect(addButton).toBeInTheDocument()
    expect(addButton).toBeEnabled()
  })

  it('should have responsive layout with proper spacing on mobile', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    const { container } = render(<WalkThroughNotes {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Walk-Through Notes')).toBeInTheDocument()
      expect(screen.getByText('Add Note')).toBeInTheDocument()
    })

    // Find the header flex container with responsive classes
    const headerContainer = container.querySelector('[class*="flex"][class*="flex-col"][class*="sm:flex-row"]')
    expect(headerContainer).toBeInTheDocument()

    // Verify it has the responsive layout classes
    const hasResponsiveLayout = headerContainer?.className.includes('flex-col') && 
                               headerContainer?.className.includes('sm:flex-row') &&
                               headerContainer?.className.includes('gap-')

    expect(hasResponsiveLayout).toBe(true)
  })

  it('should display long address descriptions without causing button overflow', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    render(<WalkThroughNotes {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Walk-Through Notes')).toBeInTheDocument()
      expect(screen.getByText('Add Note')).toBeInTheDocument()
    })

    // Verify the long address is displayed in the description
    const longAddress = screen.getByText(/1234 Long Property Address Street/)
    expect(longAddress).toBeInTheDocument()

    // The button should still be visible and clickable
    const addButton = screen.getByText('Add Note')
    expect(addButton).toBeInTheDocument()
    expect(addButton).toBeEnabled()

    // Test button click functionality
    fireEvent.click(addButton)
    await waitFor(() => {
      expect(screen.getByTestId('note-form')).toBeInTheDocument()
    })
  })

  it('should maintain proper spacing when form is shown', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    const { container } = render(<WalkThroughNotes {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText('Walk-Through Notes')).toBeInTheDocument()
      expect(screen.getByText('Add Note')).toBeInTheDocument()
    })

    // Click Add Note to show form
    const addButton = screen.getByText('Add Note')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByTestId('note-form')).toBeInTheDocument()
    })

    // Check that form appears with proper spacing from header
    const form = screen.getByTestId('note-form')
    expect(form).toBeInTheDocument()

    // Form should be in a container with margin/padding classes
    const formContainer = form.closest('.mb-6')
    expect(formContainer).toBeInTheDocument()
  })
})