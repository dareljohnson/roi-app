/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WalkThroughNotes } from '@/components/walkthrough/WalkThroughNotes'

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockProps = {
  propertyId: 'test-property-1',
  propertyAddress: '123 Test Street'
}

describe('WalkThroughNotes Photo Delete Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('displays delete button for each photo in saved notes', async () => {
    const mockNotesWithPhotos = [
      {
        id: 'note-1',
        title: 'Property with Photos',
        content: 'This note has photos attached.',
        rating: 4,
        createdAt: '2025-10-01T12:00:00Z',
        updatedAt: '2025-10-01T12:00:00Z',
        photos: [
          {
            id: 'photo-1',
            createdAt: '2025-10-01T12:00:00Z',
            filename: 'room1.jpg',
            filepath: '/uploads/walkthrough-photos/room1.jpg',
            filesize: 1024000,
            mimetype: 'image/jpeg',
            description: 'Main room',
            order: 0,
            noteId: 'note-1'
          },
          {
            id: 'photo-2',
            createdAt: '2025-10-01T12:01:00Z',
            filename: 'room2.jpg',
            filepath: '/uploads/walkthrough-photos/room2.jpg',
            filesize: 856000,
            mimetype: 'image/jpeg',
            description: 'Second room',
            order: 1,
            noteId: 'note-1'
          }
        ]
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: mockNotesWithPhotos })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Property with Photos')).toBeInTheDocument()
    })

    // Should have delete buttons for each photo
    const deleteButtons = screen.getAllByRole('button', { name: /delete photo/i })
    expect(deleteButtons).toHaveLength(2)
  })

  test('allows deleting individual photos from saved notes', async () => {
    const mockNotesWithPhotos = [
      {
        id: 'note-1',
        title: 'Property with Photos',
        content: 'This note has photos attached.',
        rating: 4,
        createdAt: '2025-10-01T12:00:00Z',
        updatedAt: '2025-10-01T12:00:00Z',
        photos: [
          {
            id: 'photo-1',
            createdAt: '2025-10-01T12:00:00Z',
            filename: 'room1.jpg',
            filepath: '/uploads/walkthrough-photos/room1.jpg',
            filesize: 1024000,
            mimetype: 'image/jpeg',
            description: 'Main room',
            order: 0,
            noteId: 'note-1'
          }
        ]
      }
    ]

    // Mock initial fetch
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, notes: mockNotesWithPhotos })
      })
      // Mock delete photo API call
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Photo deleted successfully' })
      })
      // Mock refetch after delete
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          notes: [{ ...mockNotesWithPhotos[0], photos: [] }] 
        })
      })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Property with Photos')).toBeInTheDocument()
    })

    // Click delete button for the photo
    const deleteButton = screen.getByRole('button', { name: /delete photo/i })
    fireEvent.click(deleteButton)

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })

    // Click confirm delete in the dialog
    const confirmButton = screen.getByRole('button', { name: 'Delete Photo' })
    fireEvent.click(confirmButton)

    // Should call the delete API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/walkthrough-photos/photo-1',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  test('shows confirmation dialog before deleting photo', async () => {
    const mockNotesWithPhotos = [
      {
        id: 'note-1',
        title: 'Property with Photos',
        content: 'This note has photos attached.',
        rating: 4,
        createdAt: '2025-10-01T12:00:00Z',
        updatedAt: '2025-10-01T12:00:00Z',
        photos: [
          {
            id: 'photo-1',
            createdAt: '2025-10-01T12:00:00Z',
            filename: 'room1.jpg',
            filepath: '/uploads/walkthrough-photos/room1.jpg',
            filesize: 1024000,
            mimetype: 'image/jpeg',
            description: 'Main room',
            order: 0,
            noteId: 'note-1'
          }
        ]
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: mockNotesWithPhotos })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Property with Photos')).toBeInTheDocument()
    })

    // Click delete button for the photo
    const deleteButton = screen.getByRole('button', { name: /delete photo/i })
    fireEvent.click(deleteButton)

    // Should show confirmation dialog
    expect(screen.getByRole('heading', { name: /delete photo/i })).toBeInTheDocument()
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Photo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})