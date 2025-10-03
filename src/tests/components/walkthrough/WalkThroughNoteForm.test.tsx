/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WalkThroughNoteForm } from '@/components/walkthrough/WalkThroughNoteForm'

describe('WalkThroughNoteForm Component', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders add form correctly', () => {
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    expect(screen.getByText('Add Walk-Through Note')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Your Observations')).toBeInTheDocument()
    expect(screen.getByText('Overall Rating')).toBeInTheDocument()
    expect(screen.getByText('Save Note')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('renders edit form correctly with initial data', () => {
    const initialData = {
      title: 'Test Title',
      content: 'Test Content',
      rating: 4
    }

    render(
      <WalkThroughNoteForm 
        initialData={initialData}
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
        isEditing={true}
      />
    )
    
    expect(screen.getByText('Edit Walk-Through Note')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument()
    expect(screen.getByText('(4/5)')).toBeInTheDocument()
    expect(screen.getByText('Update')).toBeInTheDocument()
  })

  it('updates form fields correctly', () => {
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const titleInput = screen.getByLabelText('Title')
    const contentInput = screen.getByLabelText('Your Observations')

    fireEvent.change(titleInput, { target: { value: 'New Title' } })
    fireEvent.change(contentInput, { target: { value: 'New Content' } })

    expect(titleInput).toHaveValue('New Title')
    expect(contentInput).toHaveValue('New Content')
  })

  it('handles star rating clicks', () => {
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    // Initial rating should be 3
    expect(screen.getByText('(3/5)')).toBeInTheDocument()

    // Find star buttons and click the 5th star
    const starButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-star')
    )
    
    if (starButtons.length >= 5) {
      fireEvent.click(starButtons[4]) // 5th star (0-indexed)
      expect(screen.getByText('(5/5)')).toBeInTheDocument()
    }
  })

  it('shows hover effects on star rating', () => {
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const starButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-star')
    )
    
    if (starButtons.length >= 4) {
      // Hover over 4th star
      fireEvent.mouseEnter(starButtons[3])
      expect(screen.getByText('(4/5)')).toBeInTheDocument()
      
      // Mouse leave should return to original rating
      fireEvent.mouseLeave(starButtons[3])
      expect(screen.getByText('(3/5)')).toBeInTheDocument()
    }
  })

  it('validates required fields', async () => {
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const submitButton = screen.getByText('Save Note')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('validates title length', async () => {
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const titleInput = screen.getByLabelText('Title')
    const longTitle = 'A'.repeat(201) // Exceeds 200 character limit
    
    fireEvent.change(titleInput, { target: { value: longTitle } })
    fireEvent.click(screen.getByText('Save Note'))

    await waitFor(() => {
      expect(screen.getByText('Title must be 200 characters or less')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('validates content length', async () => {
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const titleInput = screen.getByLabelText('Title')
    const contentInput = screen.getByLabelText('Your Observations')
    const longContent = 'A'.repeat(5001) // Exceeds 5000 character limit
    
    fireEvent.change(titleInput, { target: { value: 'Valid Title' } })
    fireEvent.change(contentInput, { target: { value: longContent } })
    fireEvent.click(screen.getByText('Save Note'))

    await waitFor(() => {
      expect(screen.getByText('Content must be 5000 characters or less')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('shows character counts', () => {
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    expect(screen.getByText('0/200 characters')).toBeInTheDocument()
    expect(screen.getByText('0/5000 characters')).toBeInTheDocument()

    const titleInput = screen.getByLabelText('Title')
    fireEvent.change(titleInput, { target: { value: 'Test' } })
    
    expect(screen.getByText('4/200 characters')).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined)
    
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const titleInput = screen.getByLabelText('Title')
    const contentInput = screen.getByLabelText('Your Observations')
    
    fireEvent.change(titleInput, { target: { value: 'Great Property' } })
    fireEvent.change(contentInput, { target: { value: 'Really impressed with the condition.' } })
    
    // Click 4th star for rating
    const starButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-star')
    )
    if (starButtons.length >= 4) {
      fireEvent.click(starButtons[3])
    }

    fireEvent.click(screen.getByText('Save Note'))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Great Property',
        content: 'Really impressed with the condition.',
        rating: 4,
        photos: []
      })
    })
  })

  it('handles form submission errors', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Submit failed'))
    
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const titleInput = screen.getByLabelText('Title')
    const contentInput = screen.getByLabelText('Your Observations')
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.change(contentInput, { target: { value: 'Test Content' } })
    fireEvent.click(screen.getByText('Save Note'))

    await waitFor(() => {
      expect(screen.getByText('Failed to save note. Please try again.')).toBeInTheDocument()
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('disables form during submission', async () => {
    // Make onSubmit return a promise that doesn't resolve immediately
    let resolveSubmit: () => void
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve
    })
    mockOnSubmit.mockReturnValueOnce(submitPromise)
    
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const titleInput = screen.getByLabelText('Title')
    const contentInput = screen.getByLabelText('Your Observations')
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } })
    fireEvent.change(contentInput, { target: { value: 'Test Content' } })
    fireEvent.click(screen.getByText('Save Note'))

    // Form should show submitting state
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeDisabled()

    // Resolve the promise
    resolveSubmit!()
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument()
    })
  })

  it('trims whitespace from input values', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined)
    
    render(<WalkThroughNoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
    
    const titleInput = screen.getByLabelText('Title')
    const contentInput = screen.getByLabelText('Your Observations')
    
    fireEvent.change(titleInput, { target: { value: '  Padded Title  ' } })
    fireEvent.change(contentInput, { target: { value: '  Padded Content  ' } })
    fireEvent.click(screen.getByText('Save Note'))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Padded Title',
        content: 'Padded Content',
        rating: 3,
        photos: []
      })
    })
  })
})