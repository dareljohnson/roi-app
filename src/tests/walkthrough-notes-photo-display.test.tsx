/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WalkThroughNotes } from '@/components/walkthrough/WalkThroughNotes'

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockProps = {
  propertyId: 'test-property-1',
  propertyAddress: '123 Test Street'
}

describe('WalkThroughNotes Photo Display', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('displays photo thumbnails when note has photos', async () => {
    const mockNotesWithPhotos = [
      {
        id: 'note-1',
        title: 'Great Property with Photos',
        content: 'This property has amazing features as shown in photos.',
        rating: 4,
        createdAt: '2025-10-01T12:00:00Z',
        updatedAt: '2025-10-01T12:00:00Z',
        photos: [
          {
            id: 'photo-1',
            createdAt: '2025-10-01T12:00:00Z',
            filename: 'living-room.jpg',
            filepath: '/uploads/walkthrough-photos/living-room.jpg',
            filesize: 1024000,
            mimetype: 'image/jpeg',
            description: 'Spacious living room',
            order: 0,
            noteId: 'note-1'
          },
          {
            id: 'photo-2',
            createdAt: '2025-10-01T12:01:00Z',
            filename: 'kitchen.jpg',
            filepath: '/uploads/walkthrough-photos/kitchen.jpg',
            filesize: 856000,
            mimetype: 'image/jpeg',
            description: 'Modern kitchen',
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
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Great Property with Photos')).toBeInTheDocument()
    })

    // Check if photo thumbnails are displayed
    expect(screen.getByText('Spacious living room')).toBeInTheDocument()
    expect(screen.getByText('Modern kitchen')).toBeInTheDocument()
    
    // Check if photo images are rendered
    const photoImages = screen.getAllByRole('img')
    expect(photoImages).toHaveLength(2)
    expect(photoImages[0]).toHaveAttribute('src', '/uploads/walkthrough-photos/living-room.jpg')
    expect(photoImages[1]).toHaveAttribute('src', '/uploads/walkthrough-photos/kitchen.jpg')
  })

  test('shows photo count when note has photos', async () => {
    const mockNotesWithPhotos = [
      {
        id: 'note-1',
        title: 'Property Note',
        content: 'Test content',
        rating: 3,
        createdAt: '2025-10-01T12:00:00Z',
        updatedAt: '2025-10-01T12:00:00Z',
        photos: [
          {
            id: 'photo-1',
            createdAt: '2025-10-01T12:00:00Z',
            filename: 'test.jpg',
            filepath: '/uploads/walkthrough-photos/test.jpg',
            filesize: 1024000,
            mimetype: 'image/jpeg',
            description: 'Test photo',
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
      expect(screen.getByText('Property Note')).toBeInTheDocument()
    })

    // Should show photo count
    expect(screen.getByText('1 photo')).toBeInTheDocument()
  })

  test('does not show photo section when note has no photos', async () => {
    const mockNotesWithoutPhotos = [
      {
        id: 'note-1',
        title: 'Property Note',
        content: 'Test content',
        rating: 3,
        createdAt: '2025-10-01T12:00:00Z',
        updatedAt: '2025-10-01T12:00:00Z',
        photos: []
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, notes: mockNotesWithoutPhotos })
    })

    render(<WalkThroughNotes {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Property Note')).toBeInTheDocument()
    })

    // Should not show photo section or count
    expect(screen.queryByText('photo')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})