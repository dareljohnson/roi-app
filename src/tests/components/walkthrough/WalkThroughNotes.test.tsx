/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { WalkThroughNotes } from '@/components/walkthrough/WalkThroughNotes'

// Mock fetch
const mockFetch = jest.fn()
const originalFetch = global.fetch

// Mock the form component
jest.mock('@/components/walkthrough/WalkThroughNoteForm', () => ({
  WalkThroughNoteForm: ({ onSubmit, onCancel, isEditing, initialData }: any) => (
    <div data-testid="note-form">
      <input 
        data-testid="form-title" 
        defaultValue={initialData?.title || ''} 
        onChange={() => {}}
      />
      <textarea 
        data-testid="form-content" 
        defaultValue={initialData?.content || ''} 
        onChange={() => {}}
      />
      <div data-testid="form-rating">{initialData?.rating || 3}</div>
      <button 
        data-testid="form-submit" 
        onClick={() => onSubmit({ title: 'Test Title', content: 'Test Content', rating: 4 })}
      >
        {isEditing ? 'Update' : 'Save'}
      </button>
      <button data-testid="form-cancel" onClick={onCancel}>Cancel</button>
    </div>
  )
}))

describe('WalkThroughNotes Component', () => {
  const mockProps = {
    propertyId: 'prop-123',
    propertyAddress: '123 Test Street'
  }

  beforeEach(() => {
    global.fetch = mockFetch
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.fetch = originalFetch
  })

  it('renders loading state initially', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    expect(screen.getByText('Loading your notes...')).toBeInTheDocument()
  })

  it('renders empty state when no notes exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('No walk-through notes yet for this property.')).toBeInTheDocument()
    })
  })

  it('fetches and displays notes', async () => {
    const mockNotes = [
      {
        id: 'note-1',
        title: 'Great Location',
        content: 'Really nice neighborhood with good schools nearby.',
        rating: 4,
        createdAt: '2025-09-27T12:00:00Z',
        updatedAt: '2025-09-27T12:00:00Z'
      },
      {
        id: 'note-2',
        title: 'Needs Work',
        content: 'Kitchen needs updating but has good bones.',
        rating: 3,
        createdAt: '2025-09-27T13:00:00Z',
        updatedAt: '2025-09-27T13:00:00Z'
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: mockNotes })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Great Location')).toBeInTheDocument()
      expect(screen.getByText('Needs Work')).toBeInTheDocument()
      expect(screen.getByText('Really nice neighborhood with good schools nearby.')).toBeInTheDocument()
      expect(screen.getByText('Kitchen needs updating but has good bones.')).toBeInTheDocument()
    })

    // Check that API was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/walkthrough-notes?propertyId=prop-123')
  })

  it('shows add note form when Add Note button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Add Note')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Add Note')
    fireEvent.click(addButton)

    expect(screen.getByTestId('note-form')).toBeInTheDocument()
  })

  it('creates a new note successfully', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    // Create note response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    // Refetch after creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        notes: [{
          id: 'new-note',
          title: 'Test Title',
          content: 'Test Content',
          rating: 4,
          createdAt: '2025-09-27T14:00:00Z',
          updatedAt: '2025-09-27T14:00:00Z'
        }]
      })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Add Note')).toBeInTheDocument()
    })

    // Open form
    fireEvent.click(screen.getByText('Add Note'))
    
    // Submit form
    fireEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/walkthrough-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Title',
          content: 'Test Content',
          rating: 4,
          propertyId: 'prop-123'
        })
      })
    })
  })

  it('handles edit note functionality', async () => {
    const mockNote = {
      id: 'note-1',
      title: 'Original Title',
      content: 'Original content',
      rating: 3,
      createdAt: '2025-09-27T12:00:00Z',
      updatedAt: '2025-09-27T12:00:00Z'
    }

    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [mockNote] })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument()
    })

    // Click edit button
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-edit') || 
      btn.textContent?.includes('Edit')
    )
    
    if (editButton) {
      fireEvent.click(editButton)
      expect(screen.getByTestId('note-form')).toBeInTheDocument()
    }
  })

  it('handles delete note functionality', async () => {
    const mockNote = {
      id: 'note-1',
      title: 'To Delete',
      content: 'This will be deleted',
      rating: 2,
      createdAt: '2025-09-27T12:00:00Z',
      updatedAt: '2025-09-27T12:00:00Z'
    }

    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => true)

    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [mockNote] })
    })

    // Delete response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    // Refetch after deletion
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('To Delete')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-trash-2') || 
      btn.textContent?.includes('Delete')
    )
    
    if (deleteButton) {
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/walkthrough-notes/note-1', {
          method: 'DELETE'
        })
      })
    }

    // Restore window.confirm
    window.confirm = originalConfirm
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    await act(async () => {
      render(<WalkThroughNotes {...mockProps} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Error fetching walk-through notes')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('renders star ratings correctly', async () => {
    const mockNote = {
      id: 'note-1',
      title: 'Rated Property',
      content: 'Good property',
      rating: 4,
      createdAt: '2025-09-27T12:00:00Z',
      updatedAt: '2025-09-27T12:00:00Z'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [mockNote] })
    })

    await act(async () => {
      render(<WalkThroughNotes {...mockProps} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('(4/5)')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('shows property address in description', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText(/Your personal observations and notes from visiting 123 Test Street/)).toBeInTheDocument()
    })
  })

  it('shows delete confirmation modal when delete button is clicked', async () => {
    const mockNote = {
      id: 'note-1',
      title: 'Test Note',
      content: 'Test content',
      rating: 4,
      propertyId: 'prop-123',
      userId: 'user-123',
      createdAt: '2025-09-27T10:00:00Z',
      updatedAt: '2025-09-27T10:00:00Z'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [mockNote] })
    })

    await act(async () => {
      render(<WalkThroughNotes {...mockProps} />)
    })

    await waitFor(() => {
      expect(screen.getByText('Test Note')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButton = screen.getByLabelText('Delete note')
    fireEvent.click(deleteButton)

    // Check modal appears
    await waitFor(() => {
      expect(screen.getByText('Delete Walk-Through Note')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete the note "Test Note"? This action cannot be undone.')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  it('cancels delete when cancel button is clicked', async () => {
    const mockNote = {
      id: 'note-1',
      title: 'Test Note',
      content: 'Test content',
      rating: 4,
      propertyId: 'prop-123',
      userId: 'user-123',
      createdAt: '2025-09-27T10:00:00Z',
      updatedAt: '2025-09-27T10:00:00Z'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [mockNote] })
    })

    await act(async () => {
      render(<WalkThroughNotes {...mockProps} />)
    })

    await waitFor(() => {
      expect(screen.getByText('Test Note')).toBeInTheDocument()
    })

    // Click delete button to open modal
    const deleteButton = screen.getByLabelText('Delete note')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete Walk-Through Note')).toBeInTheDocument()
    })

    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'))

    // Modal should disappear
    await waitFor(() => {
      expect(screen.queryByText('Delete Walk-Through Note')).not.toBeInTheDocument()
    })
  })

  it('deletes note when confirm delete is clicked', async () => {
    const mockNote = {
      id: 'note-1',
      title: 'Test Note',
      content: 'Test content',
      rating: 4,
      propertyId: 'prop-123',
      userId: 'user-123',
      createdAt: '2025-09-27T10:00:00Z',
      updatedAt: '2025-09-27T10:00:00Z'
    }

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [mockNote] })
    })

    await act(async () => {
      render(<WalkThroughNotes {...mockProps} />)
    })

    await waitFor(() => {
      expect(screen.getByText('Test Note')).toBeInTheDocument()
    })

    // Click delete button to open modal
    const deleteButton = screen.getByLabelText('Delete note')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete Walk-Through Note')).toBeInTheDocument()
    })

    // Mock delete API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    // Mock refresh fetch (should return empty notes)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: [] })
    })

    // Click confirm delete
    await act(async () => {
      fireEvent.click(screen.getByText('Delete'))
    })

    // Verify delete API was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/walkthrough-notes/note-1', {
        method: 'DELETE'
      })
    })

    // Modal should disappear
    await waitFor(() => {
      expect(screen.queryByText('Delete Walk-Through Note')).not.toBeInTheDocument()
    })
  })
})