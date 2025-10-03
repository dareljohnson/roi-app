/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/walkthrough-notes/[id]/route'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'

// Mock next-auth
jest.mock('next-auth/next')
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  user: {
    findUnique: jest.fn()
  },
  walkThroughNote: {
    findFirst: jest.fn(),
    update: jest.fn()
  }
}))

describe('/api/walkthrough-notes/[id] PUT', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User'
  }

  const mockNote = {
    id: 'note-123',
    title: 'Original Title',
    content: 'Original content',
    rating: 3,
    propertyId: 'prop-123',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock session
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any)

    // Mock user lookup
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    
    // Mock note lookup
    ;(prisma.walkThroughNote.findFirst as jest.Mock).mockResolvedValue(mockNote)
  })

  it('should update a note successfully without requiring propertyId', async () => {
    const updatedNote = {
      ...mockNote,
      title: 'Updated Title',
      content: 'Updated content',
      rating: 5,
      user: { name: 'Test User', email: 'test@example.com' },
      property: { address: '123 Main St' }
    }

    ;(prisma.walkThroughNote.update as jest.Mock).mockResolvedValue(updatedNote)

    const request = new NextRequest('http://localhost:3000/api/walkthrough-notes/note-123', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Title',
        content: 'Updated content',
        rating: 5
        // Note: No propertyId included - this should work fine
      })
    })

    const response = await PUT(request, { params: { id: 'note-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.note.title).toBe('Updated Title')
    expect(data.note.content).toBe('Updated content')
    expect(data.note.rating).toBe(5)

    // Verify the update was called with correct data
    expect(prisma.walkThroughNote.update).toHaveBeenCalledWith({
      where: { id: 'note-123' },
      data: {
        title: 'Updated Title',
        content: 'Updated content',
        rating: 5
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        property: {
          select: {
            address: true
          }
        },
        photos: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })
  })

  it('should reject update with missing title', async () => {
    const request = new NextRequest('http://localhost:3000/api/walkthrough-notes/note-123', {
      method: 'PUT',
      body: JSON.stringify({
        content: 'Updated content',
        rating: 5
        // Missing title
      })
    })

    const response = await PUT(request, { params: { id: 'note-123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid input data')
  })

  it('should reject update with empty title', async () => {
    const request = new NextRequest('http://localhost:3000/api/walkthrough-notes/note-123', {
      method: 'PUT',
      body: JSON.stringify({
        title: '',
        content: 'Updated content',
        rating: 5
      })
    })

    const response = await PUT(request, { params: { id: 'note-123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid input data')
  })

  it('should handle optional rating field', async () => {
    const updatedNote = {
      ...mockNote,
      title: 'Updated Title',
      content: 'Updated content',
      rating: undefined,
      user: { name: 'Test User', email: 'test@example.com' },
      property: { address: '123 Main St' }
    }

    ;(prisma.walkThroughNote.update as jest.Mock).mockResolvedValue(updatedNote)

    const request = new NextRequest('http://localhost:3000/api/walkthrough-notes/note-123', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Title',
        content: 'Updated content'
        // No rating provided - should be optional
      })
    })

    const response = await PUT(request, { params: { id: 'note-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.note.title).toBe('Updated Title')
    expect(data.note.content).toBe('Updated content')
  })

  it('should return 404 if note not found', async () => {
    // Mock note not found
    ;(prisma.walkThroughNote.findFirst as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/walkthrough-notes/note-123', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Title',
        content: 'Updated content',
        rating: 5
      })
    })

    const response = await PUT(request, { params: { id: 'note-123' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Walk-through note not found')
  })

  it('should return 401 if user not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/walkthrough-notes/note-123', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Title',
        content: 'Updated content',
        rating: 5
      })
    })

    const response = await PUT(request, { params: { id: 'note-123' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })
})