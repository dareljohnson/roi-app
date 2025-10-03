/**
 * @jest-environment jsdom  
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WalkThroughNoteForm } from '@/components/walkthrough/WalkThroughNoteForm'

// Mock the PhotoUpload component to isolate form testing
jest.mock('@/components/walkthrough/PhotoUpload', () => ({
  PhotoUpload: ({ photos, onPhotosChange }: any) => (
    <div data-testid="photo-upload">
      <button
        onClick={() => onPhotosChange([
          ...photos,
          {
            id: 'test-photo',
            createdAt: new Date().toISOString(),
            filename: 'test.jpg',
            filepath: '/uploads/walkthrough-photos/test.jpg',
            filesize: 1000,
            mimetype: 'image/jpeg',
            description: 'Test photo',
            order: photos.length,
            noteId: '',
          }
        ])}
      >
        Add Test Photo
      </button>
      <div data-testid="photo-count">{photos.length} photos</div>
    </div>
  )
}))

describe('WalkThroughNoteForm with Photo Integration', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders form with photo upload component', () => {
    render(
      <WalkThroughNoteForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Add Walk-Through Note')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Your Observations')).toBeInTheDocument()
    expect(screen.getByTestId('photo-upload')).toBeInTheDocument()
    expect(screen.getByTestId('photo-count')).toHaveTextContent('0 photos')
  })

  test('allows adding photos to the form', async () => {
    render(
      <WalkThroughNoteForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Add a photo using the mocked component
    await act(async () => {
      fireEvent.click(screen.getByText('Add Test Photo'))
    })

    expect(screen.getByTestId('photo-count')).toHaveTextContent('1 photos')
  })

  test('submits form with photos included', async () => {
    render(
      <WalkThroughNoteForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Fill in form fields
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Title'), {
        target: { value: 'Test Walk-Through' }
      })
      fireEvent.change(screen.getByLabelText('Your Observations'), {
        target: { value: 'Test walk-through content with detailed observations.' }
      })
      
      // Add a photo
      fireEvent.click(screen.getByText('Add Test Photo'))
    })

    // Submit form by clicking the submit button before it changes to "Saving..."
    const submitButton = screen.getByRole('button', { name: /save note/i })
    await act(async () => {
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Walk-Through',
        content: 'Test walk-through content with detailed observations.',
        rating: 3, // Default rating
        photos: [
          expect.objectContaining({
            filename: 'test.jpg',
            filepath: '/uploads/walkthrough-photos/test.jpg',
            filesize: 1000,
            mimetype: 'image/jpeg',
            description: 'Test photo',
          })
        ]
      })
    })
  })

  test('validates form with photos before submission', async () => {
    render(
      <WalkThroughNoteForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Add photo but leave required fields empty
    await act(async () => {
      fireEvent.click(screen.getByText('Add Test Photo'))
    })

    // Try to submit without required fields
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save note/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  test('populates form with existing note data including photos', () => {
    const initialData = {
      title: 'Existing Note',
      content: 'Existing content',
      rating: 3,
      photos: [
        {
          id: 'photo-1',
          createdAt: new Date().toISOString(),
          filename: 'existing.jpg',
          filepath: '/uploads/walkthrough-photos/existing.jpg',
          filesize: 2000,
          mimetype: 'image/jpeg',
          description: 'Existing photo',
          order: 0,
          noteId: 'note-1',
        }
      ]
    }

    render(
      <WalkThroughNoteForm
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isEditing={true}
      />
    )

    expect(screen.getByDisplayValue('Existing Note')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing content')).toBeInTheDocument()
    expect(screen.getByTestId('photo-count')).toHaveTextContent('1 photos')
  })

  test('handles form submission errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockOnSubmit.mockRejectedValue(new Error('Server error'))

    render(
      <WalkThroughNoteForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    // Fill in valid form data
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Title'), {
        target: { value: 'Test Note' }
      })
      fireEvent.change(screen.getByLabelText('Your Observations'), {
        target: { value: 'Test content' }
      })
    })

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save note/i }))
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to save note. Please try again.')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <WalkThroughNoteForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalled()
  })
})