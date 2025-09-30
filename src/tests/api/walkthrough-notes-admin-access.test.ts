/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'

// Mock next-auth
jest.mock('next-auth/next')
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  walkThroughNote: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  property: {
    findFirst: jest.fn(),
  },
}))

// Import the API handlers after mocking
import { GET as getNotesHandler, POST as createNoteHandler } from '@/app/api/walkthrough-notes/route'
import { GET as getNoteHandler, PUT as updateNoteHandler, DELETE as deleteNoteHandler } from '@/app/api/walkthrough-notes/[id]/route'

describe('Walk-Through Notes Admin Access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/walkthrough-notes (List Notes)', () => {
    it('should allow admin to see all notes without user filter', async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'admin@test.com', role: 'ADMIN' }
      })

      const mockNotes = [
        { id: '1', title: 'Admin Note', userId: 'admin-id' },
        { id: '2', title: 'User Note', userId: 'user-id' }
      ]

      ;(prisma.walkThroughNote.findMany as jest.Mock).mockResolvedValue(mockNotes)

      const request = new NextRequest('http://localhost/api/walkthrough-notes')
      const response = await getNotesHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notes).toEqual(mockNotes)

      // Verify the query doesn't filter by user for admins
      expect(prisma.walkThroughNote.findMany).toHaveBeenCalledWith({
        where: {}, // Empty where clause for admins
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should restrict regular users to only their own notes', async () => {
      // Mock regular user session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'user@test.com', role: 'USER' }
      })

      const mockNotes = [
        { id: '2', title: 'User Note', userId: 'user-id' }
      ]

      ;(prisma.walkThroughNote.findMany as jest.Mock).mockResolvedValue(mockNotes)

      const request = new NextRequest('http://localhost/api/walkthrough-notes')
      const response = await getNotesHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.notes).toEqual(mockNotes)

      // Verify the query filters by user email for regular users
      expect(prisma.walkThroughNote.findMany).toHaveBeenCalledWith({
        where: {
          user: { email: 'user@test.com' }
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter by propertyId for both admin and regular users', async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'admin@test.com', role: 'ADMIN' }
      })

      ;(prisma.walkThroughNote.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/walkthrough-notes?propertyId=test-property')
      const response = await getNotesHandler(request)

      expect(response.status).toBe(200)

      // Verify the query includes propertyId filter
      expect(prisma.walkThroughNote.findMany).toHaveBeenCalledWith({
        where: {
          propertyId: 'test-property'
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('POST /api/walkthrough-notes (Create Note)', () => {
    it('should allow admin to create notes for any property', async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'admin@test.com', role: 'ADMIN' }
      })

      const mockUser = { id: 'admin-id', email: 'admin@test.com' }
      const mockProperty = { id: 'test-property', userId: 'other-user-id' }
      const mockNote = {
        id: '1',
        title: 'Admin Note',
        content: 'Admin created note',
        rating: 5,
        propertyId: 'test-property',
        userId: 'admin-id'
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty)
      ;(prisma.walkThroughNote.create as jest.Mock).mockResolvedValue(mockNote)

      const request = new NextRequest('http://localhost/api/walkthrough-notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Admin Note',
          content: 'Admin created note',
          rating: 5,
          propertyId: 'test-property'
        })
      })

      const response = await createNoteHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.note).toEqual(mockNote)

      // Verify property lookup doesn't filter by userId for admins
      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: { id: 'test-property' }
      })
    })

    it('should restrict regular users to only their own properties', async () => {
      // Mock regular user session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'user@test.com', role: 'USER' }
      })

      const mockUser = { id: 'user-id', email: 'user@test.com' }
      const mockProperty = { id: 'test-property', userId: 'user-id' }
      const mockNote = {
        id: '1',
        title: 'User Note',
        content: 'User created note',
        rating: 4,
        propertyId: 'test-property',
        userId: 'user-id'
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty)
      ;(prisma.walkThroughNote.create as jest.Mock).mockResolvedValue(mockNote)

      const request = new NextRequest('http://localhost/api/walkthrough-notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'User Note',
          content: 'User created note',
          rating: 4,
          propertyId: 'test-property'
        })
      })

      const response = await createNoteHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)

      // Verify property lookup filters by userId for regular users
      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: { id: 'test-property', userId: 'user-id' }
      })
    })
  })

  describe('GET /api/walkthrough-notes/[id] (Get Single Note)', () => {
    it('should allow admin to access any note', async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'admin@test.com', role: 'ADMIN' }
      })

      const mockNote = {
        id: 'note-id',
        title: 'Any User Note',
        userId: 'other-user-id'
      }

      ;(prisma.walkThroughNote.findFirst as jest.Mock).mockResolvedValue(mockNote)

      const request = new NextRequest('http://localhost/api/walkthrough-notes/note-id')
      const response = await getNoteHandler(request, { params: { id: 'note-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.note).toEqual(mockNote)

      // Verify query doesn't filter by user for admins
      expect(prisma.walkThroughNote.findFirst).toHaveBeenCalledWith({
        where: { id: 'note-id' },
        include: expect.any(Object)
      })
    })

    it('should restrict regular users to only their own notes', async () => {
      // Mock regular user session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'user@test.com', role: 'USER' }
      })

      const mockNote = {
        id: 'note-id',
        title: 'User Note',
        userId: 'user-id'
      }

      ;(prisma.walkThroughNote.findFirst as jest.Mock).mockResolvedValue(mockNote)

      const request = new NextRequest('http://localhost/api/walkthrough-notes/note-id')
      const response = await getNoteHandler(request, { params: { id: 'note-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify query filters by user email for regular users
      expect(prisma.walkThroughNote.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'note-id',
          user: { email: 'user@test.com' }
        },
        include: expect.any(Object)
      })
    })
  })

  describe('PUT /api/walkthrough-notes/[id] (Update Note)', () => {
    it('should allow admin to update any note', async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'admin@test.com', role: 'ADMIN' }
      })

      const mockUser = { id: 'admin-id', email: 'admin@test.com' }
      const mockExistingNote = { id: 'note-id', userId: 'other-user-id' }
      const mockUpdatedNote = {
        id: 'note-id',
        title: 'Updated by Admin',
        content: 'Admin updated content',
        rating: 3
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.walkThroughNote.findFirst as jest.Mock).mockResolvedValue(mockExistingNote)
      ;(prisma.walkThroughNote.update as jest.Mock).mockResolvedValue(mockUpdatedNote)

      const request = new NextRequest('http://localhost/api/walkthrough-notes/note-id', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated by Admin',
          content: 'Admin updated content',
          rating: 3
        })
      })

      const response = await updateNoteHandler(request, { params: { id: 'note-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify note lookup doesn't filter by userId for admins
      expect(prisma.walkThroughNote.findFirst).toHaveBeenCalledWith({
        where: { id: 'note-id' }
      })
    })

    it('should restrict regular users to only update their own notes', async () => {
      // Mock regular user session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'user@test.com', role: 'USER' }
      })

      const mockUser = { id: 'user-id', email: 'user@test.com' }
      const mockExistingNote = { id: 'note-id', userId: 'user-id' }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.walkThroughNote.findFirst as jest.Mock).mockResolvedValue(mockExistingNote)
      ;(prisma.walkThroughNote.update as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/walkthrough-notes/note-id', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated by User',
          content: 'User updated content',
          rating: 4
        })
      })

      const response = await updateNoteHandler(request, { params: { id: 'note-id' } })

      expect(response.status).toBe(200)

      // Verify note lookup filters by userId for regular users
      expect(prisma.walkThroughNote.findFirst).toHaveBeenCalledWith({
        where: { id: 'note-id', userId: 'user-id' }
      })
    })
  })

  describe('DELETE /api/walkthrough-notes/[id] (Delete Note)', () => {
    it('should allow admin to delete any note', async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'admin@test.com', role: 'ADMIN' }
      })

      const mockUser = { id: 'admin-id', email: 'admin@test.com' }
      const mockExistingNote = { id: 'note-id', userId: 'other-user-id' }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.walkThroughNote.findFirst as jest.Mock).mockResolvedValue(mockExistingNote)
      ;(prisma.walkThroughNote.delete as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/walkthrough-notes/note-id', {
        method: 'DELETE'
      })

      const response = await deleteNoteHandler(request, { params: { id: 'note-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Walk-through note deleted successfully')

      // Verify note lookup doesn't filter by userId for admins
      expect(prisma.walkThroughNote.findFirst).toHaveBeenCalledWith({
        where: { id: 'note-id' }
      })
    })

    it('should restrict regular users to only delete their own notes', async () => {
      // Mock regular user session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'user@test.com', role: 'USER' }
      })

      const mockUser = { id: 'user-id', email: 'user@test.com' }
      const mockExistingNote = { id: 'note-id', userId: 'user-id' }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.walkThroughNote.findFirst as jest.Mock).mockResolvedValue(mockExistingNote)
      ;(prisma.walkThroughNote.delete as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/walkthrough-notes/note-id', {
        method: 'DELETE'
      })

      const response = await deleteNoteHandler(request, { params: { id: 'note-id' } })

      expect(response.status).toBe(200)

      // Verify note lookup filters by userId for regular users
      expect(prisma.walkThroughNote.findFirst).toHaveBeenCalledWith({
        where: { id: 'note-id', userId: 'user-id' }
      })
    })
  })

  describe('Unauthorized Access', () => {
    it('should reject requests without session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/walkthrough-notes')
      const response = await getNotesHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })
  })
})