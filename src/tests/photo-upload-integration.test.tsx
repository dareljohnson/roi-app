/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PhotoUpload } from '@/components/walkthrough/PhotoUpload'

// Mock the mobile detection hook
const mockIsMobile = jest.fn()
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
}))

// Mock window.matchMedia for mobile detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: mockIsMobile(),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('PhotoUpload Integration Tests', () => {
  const mockOnPhotosChange = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsMobile.mockReturnValue(false) // Default to desktop
  })

  test('renders desktop file upload interface', () => {
    render(
      <PhotoUpload 
        photos={[]} 
        onPhotosChange={mockOnPhotosChange}
        maxPhotos={10}
      />
    )

    expect(screen.getByText('Upload Photos')).toBeInTheDocument()
    expect(screen.getByText('Photo Attachments')).toBeInTheDocument()
    expect(screen.getByText('Add up to 10 photos to document your walk-through observations')).toBeInTheDocument()
  })

  test('renders mobile camera interface', () => {
    // Mock mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    })
    
    render(
      <PhotoUpload 
        photos={[]} 
        onPhotosChange={mockOnPhotosChange}
        maxPhotos={10}
      />
    )

    expect(screen.getByText('Choose Photos')).toBeInTheDocument() // Mobile shows "Choose Photos" instead of "Upload Photos"
    expect(screen.getByText('Take Photo')).toBeInTheDocument()
    expect(screen.getByText('Photo Attachments')).toBeInTheDocument()
  })

  test('handles file selection on desktop', async () => {
    // Mock the fetch API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        files: [{
          filename: 'test-image.jpg',
          filepath: '/uploads/walkthrough-photos/test-image.jpg',
          filesize: 1000,
          mimetype: 'image/jpeg'
        }]
      })
    })

    render(
      <PhotoUpload 
        photos={[]} 
        onPhotosChange={mockOnPhotosChange}
        maxPhotos={10}
      />
    )

    // Find the hidden file input
    const fileInput = screen.getByRole('button', { name: /choose photos/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    // Create a mock file
    const file = new File(['mock image content'], 'test-image.jpg', {
      type: 'image/jpeg',
    })

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnPhotosChange).toHaveBeenCalledWith([
        expect.objectContaining({
          filename: 'test-image.jpg',
          filepath: '/uploads/walkthrough-photos/test-image.jpg',
          filesize: 1000,
          mimetype: 'image/jpeg',
          description: null,
          order: 0,
        }),
      ])
    })
  })

  test('validates file size limits', async () => {
    // Mock fetch to return error for large files
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'File too large' })
    })

    render(
      <PhotoUpload 
        photos={[]} 
        onPhotosChange={mockOnPhotosChange}
        maxPhotos={10}
      />
    )

    const fileInput = screen.getByRole('button', { name: /choose photos/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    // Create a mock file that's too large (over 10MB)
    const largeFile = new File(['x'.repeat(10 * 1024 * 1024 + 1)], 'large-image.jpg', {
      type: 'image/jpeg',
    })

    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(screen.getByText('File too large')).toBeInTheDocument()
    })

    expect(mockOnPhotosChange).not.toHaveBeenCalled()
  })

  test('validates file type restrictions', async () => {
    // Mock fetch to return error for invalid file types
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid file type' })
    })

    render(
      <PhotoUpload 
        photos={[]} 
        onPhotosChange={mockOnPhotosChange}
        maxPhotos={10}
      />
    )

    const fileInput = screen.getByRole('button', { name: /choose photos/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    // Create a non-image file
    const textFile = new File(['some text content'], 'document.txt', {
      type: 'text/plain',
    })

    fireEvent.change(fileInput, { target: { files: [textFile] } })

    await waitFor(() => {
      expect(screen.getByText('Invalid file type')).toBeInTheDocument()
    })

    expect(mockOnPhotosChange).not.toHaveBeenCalled()
  })

  test('enforces maximum photo limit', async () => {
    const existingPhotos = Array.from({ length: 9 }, (_, i) => ({
      id: `photo-${i}`,
      createdAt: new Date().toISOString(),
      filename: `photo${i}.jpg`,
      filepath: `/uploads/walkthrough-photos/photo${i}.jpg`,
      filesize: 1000,
      mimetype: 'image/jpeg',
      description: null,
      order: i,
      noteId: 'note-1',
    }))

    render(
      <PhotoUpload 
        photos={existingPhotos} 
        onPhotosChange={mockOnPhotosChange}
        maxPhotos={10}
      />
    )

    const fileInput = screen.getByRole('button', { name: /choose photos/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    // Try to add 2 more files (should trigger max limit error)
    const file1 = new File(['content1'], 'photo10.jpg', { type: 'image/jpeg' })
    const file2 = new File(['content2'], 'photo11.jpg', { type: 'image/jpeg' })

    fireEvent.change(fileInput, { target: { files: [file1, file2] } })

    await waitFor(() => {
      expect(screen.getByText('Maximum 10 photos allowed')).toBeInTheDocument()
    })
    
    expect(mockOnPhotosChange).not.toHaveBeenCalled()
  })

  test('handles photo description updates', () => {
    const existingPhotos = [{
      id: 'photo-1',
      createdAt: new Date().toISOString(),
      filename: 'photo.jpg',
      filepath: '/uploads/walkthrough-photos/photo.jpg',
      filesize: 1000,
      mimetype: 'image/jpeg',
      description: null,
      order: 0,
      noteId: 'note-1',
    }]

    render(
      <PhotoUpload 
        photos={existingPhotos} 
        onPhotosChange={mockOnPhotosChange}
        maxPhotos={10}
      />
    )

    const descriptionInput = screen.getByPlaceholderText('Photo description (optional)')
    
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } })

    expect(mockOnPhotosChange).toHaveBeenCalledWith([
      expect.objectContaining({
        ...existingPhotos[0],
        description: 'Test description',
      }),
    ])
  })

  test('handles photo removal', () => {
    const existingPhotos = [
      {
        id: 'photo-1',
        createdAt: new Date().toISOString(),
        filename: 'photo1.jpg',
        filepath: '/uploads/walkthrough-photos/photo1.jpg',
        filesize: 1000,
        mimetype: 'image/jpeg',
        description: 'Photo 1',
        order: 0,
        noteId: 'note-1',
      },
      {
        id: 'photo-2',
        createdAt: new Date().toISOString(),
        filename: 'photo2.jpg',
        filepath: '/uploads/walkthrough-photos/photo2.jpg',
        filesize: 1000,
        mimetype: 'image/jpeg',
        description: 'Photo 2',
        order: 1,
        noteId: 'note-1',
      },
    ]

    render(
      <PhotoUpload 
        photos={existingPhotos} 
        onPhotosChange={mockOnPhotosChange}
        maxPhotos={10}
      />
    )

    const removeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && 
      button.className.includes('destructive')
    )
    
    fireEvent.click(removeButtons[0]) // Remove first photo

    expect(mockOnPhotosChange).toHaveBeenCalledWith([
      existingPhotos[1] // Just the second photo should remain
    ])
  })
})