/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/upload/walkthrough-photos/route'
import { POST as CreateNote, GET as GetNotes } from '@/app/api/walkthrough-notes/route'
import { GET as GetNote, PUT as UpdateNote, DELETE as DeleteNote } from '@/app/api/walkthrough-notes/[id]/route'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// Mock dependencies
jest.mock('next-auth/next')
jest.mock('@/lib/prisma', () => ({
  user: { findUnique: jest.fn() },
  property: { findFirst: jest.fn() },
  walkThroughNote: { 
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  walkThroughPhoto: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
}))
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(void 0),
  mkdir: jest.fn().mockResolvedValue(void 0),
  unlink: jest.fn().mockResolvedValue(void 0),
}))
// Mock the upload persistence to prevent real file creation
jest.mock('@/lib/uploadPersistence', () => ({
  saveUploadedFilesDual: jest.fn(),
  PUBLIC_UPLOAD_DIR: 'mocked/path',
  DATA_ROOT: '/mocked/data',
  DATA_UPLOAD_DIR: '/mocked/data/uploads',
}))

import { saveUploadedFilesDual } from '@/lib/uploadPersistence'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrisma = prisma as any
const mockFs = fs as jest.Mocked<typeof fs>
const mockSaveUploadedFilesDual = saveUploadedFilesDual as jest.MockedFunction<typeof saveUploadedFilesDual>

describe('Walk-through Photo API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated user session
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com', role: 'USER' }
    })
    
    // Mock user lookup
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    })
  })

  describe('Photo Upload API', () => {
    test('successfully uploads walkthrough photos', async () => {
      // Mock the upload function to return expected file metadata
      mockSaveUploadedFilesDual.mockResolvedValueOnce([
        {
          filename: 'photo1.jpg',
          filepath: '/api/uploads/walkthrough-photos/1234567890-photo1.jpg',
          filesize: 15,
          mimetype: 'image/jpeg',
        },
        {
          filename: 'photo2.png',
          filepath: '/api/uploads/walkthrough-photos/1234567890-photo2.png',
          filesize: 15,
          mimetype: 'image/png',
        }
      ]);

      // Create mock files
      const mockFile1 = new File(['image content 1'], 'photo1.jpg', { type: 'image/jpeg' })
      const mockFile2 = new File(['image content 2'], 'photo2.png', { type: 'image/png' })
      
      // Mock FormData
      const formData = new FormData()
      formData.append('photos', mockFile1)
      formData.append('photos', mockFile2)
      
      const request = new NextRequest('http://localhost:3000/api/upload/walkthrough-photos', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.files).toHaveLength(2)
      expect(result.files[0]).toMatchObject({
        filename: expect.stringMatching(/^[\w-]+\.jpg$/),
        filepath: expect.stringContaining('/uploads/walkthrough-photos/'),
        filesize: expect.any(Number),
        mimetype: 'image/jpeg',
      })
    })

    test('rejects non-image files', async () => {
      const mockFile = new File(['text content'], 'document.txt', { type: 'text/plain' })
      
      const formData = new FormData()
      formData.append('photos', mockFile)
      
      const request = new NextRequest('http://localhost:3000/api/upload/walkthrough-photos', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Invalid file type')
    })

    test('rejects files over size limit', async () => {
      // Create a mock file over 10MB
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' })
      
      const formData = new FormData()
      formData.append('photos', largeFile)
      
      const request = new NextRequest('http://localhost:3000/api/upload/walkthrough-photos', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('File too large')
    })

    test('requires authentication', async () => {
      mockGetServerSession.mockResolvedValue(null)
      
      const formData = new FormData()
      const request = new NextRequest('http://localhost:3000/api/upload/walkthrough-photos', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('Walk-through Notes with Photos API', () => {
    beforeEach(() => {
      // Mock property lookup
      mockPrisma.property.findFirst.mockResolvedValue({
        id: 'property-1',
        address: '123 Test St'
      })
    })

    test('creates walkthrough note with photos', async () => {
      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        content: 'Test content',
        rating: 4,
        propertyId: 'property-1',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        photos: [
          {
            id: 'photo-1',
            filename: 'test1.jpg',
            filepath: '/uploads/walkthrough-photos/test1.jpg',
            filesize: 1000,
            mimetype: 'image/jpeg',
            description: 'Test photo 1',
            order: 0,
          }
        ]
      }

      mockPrisma.walkThroughNote.create.mockResolvedValue(mockNote)

      const request = new NextRequest('http://localhost:3000/api/walkthrough-notes', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Note',
          content: 'Test content',
          rating: 4,
          propertyId: 'property-1',
          photos: [
            {
              filename: 'test1.jpg',
              filepath: '/uploads/walkthrough-photos/test1.jpg',
              filesize: 1000,
              mimetype: 'image/jpeg',
              description: 'Test photo 1',
              order: 0,
            }
          ]
        }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await CreateNote(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.note.photos).toHaveLength(1)
      expect(mockPrisma.walkThroughNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Note',
          content: 'Test content',
          rating: 4,
          propertyId: 'property-1',
          userId: 'user-1',
          photos: {
            create: expect.arrayContaining([
              expect.objectContaining({
                filename: 'test1.jpg',
                filepath: '/uploads/walkthrough-photos/test1.jpg',
                filesize: 1000,
                mimetype: 'image/jpeg',
                description: 'Test photo 1',
                order: 0,
              })
            ])
          }
        }),
        include: expect.any(Object)
      })
    })

    test('retrieves walkthrough notes with photos', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          title: 'Test Note',
          content: 'Test content',
          rating: 4,
          createdAt: new Date(),
          photos: [
            {
              id: 'photo-1',
              filename: 'test1.jpg',
              filepath: '/uploads/walkthrough-photos/test1.jpg',
              filesize: 1000,
              mimetype: 'image/jpeg',
              description: 'Test photo',
              order: 0,
            }
          ]
        }
      ]

      mockPrisma.walkThroughNote.findMany.mockResolvedValue(mockNotes)

      const request = new NextRequest('http://localhost:3000/api/walkthrough-notes')
      const response = await GetNotes(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.notes).toHaveLength(1)
      expect(result.notes[0].photos).toHaveLength(1)
      expect(mockPrisma.walkThroughNote.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: expect.objectContaining({
          photos: {
            orderBy: { order: 'asc' }
          }
        }),
        orderBy: { createdAt: 'desc' }
      })
    })

    test('updates walkthrough note with photos', async () => {
      const existingNote = {
        id: 'note-1',
        userId: 'user-1',
        title: 'Old Title',
        content: 'Old content',
      }

      const updatedNote = {
        ...existingNote,
        title: 'Updated Note',
        content: 'Updated content',
        photos: [
          {
            id: 'photo-1',
            filename: 'updated.jpg',
            filepath: '/uploads/walkthrough-photos/updated.jpg',
            description: 'Updated photo',
          }
        ]
      }

      mockPrisma.walkThroughNote.findFirst.mockResolvedValue(existingNote)
      mockPrisma.walkThroughNote.update.mockResolvedValue(updatedNote)

      const request = new NextRequest('http://localhost:3000/api/walkthrough-notes/note-1', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Note',
          content: 'Updated content',
          photos: [
            {
              filename: 'updated.jpg',
              filepath: '/uploads/walkthrough-photos/updated.jpg',
              filesize: 2000,
              mimetype: 'image/jpeg',
              description: 'Updated photo',
              order: 0,
            }
          ]
        }),
        headers: { 'content-type': 'application/json' },
      })

      const response = await UpdateNote(request, { params: { id: 'note-1' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.note.photos).toHaveLength(1)
      
      // Should intelligently handle photos without deleting all existing ones
      // Only creates new photos, doesn't delete all existing photos first
      expect(mockPrisma.walkThroughPhoto.deleteMany).not.toHaveBeenCalledWith({
        where: { noteId: 'note-1' }
      })
    })

    test('deletes walkthrough note and cleans up photo files', async () => {
      const existingNote = {
        id: 'note-1',
        userId: 'user-1',
      }

      const photosToDelete = [
        { filepath: '/uploads/walkthrough-photos/photo1.jpg' },
        { filepath: '/uploads/walkthrough-photos/photo2.jpg' },
      ]

      mockPrisma.walkThroughNote.findFirst.mockResolvedValue(existingNote)
      mockPrisma.walkThroughPhoto.findMany.mockResolvedValue(photosToDelete)
      mockPrisma.walkThroughNote.delete.mockResolvedValue(existingNote)

      // Mock console.warn to capture file deletion warnings
      const originalWarn = console.warn
      const mockWarn = jest.fn()
      console.warn = mockWarn

      const request = new NextRequest('http://localhost:3000/api/walkthrough-notes/note-1', {
        method: 'DELETE',
      })

      const response = await DeleteNote(request, { params: { id: 'note-1' } })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      
      // Should find photos to delete
      expect(mockPrisma.walkThroughPhoto.findMany).toHaveBeenCalledWith({
        where: { noteId: 'note-1' },
        select: { filepath: true }
      })
      
      // Should attempt to delete photo files (expect warnings since files don't exist in test)
      expect(mockWarn).toHaveBeenCalledTimes(2)
      
      // Check that the warn calls include the expected message and filepaths
      const warnCalls = mockWarn.mock.calls
      expect(warnCalls[0][0]).toBe('Failed to delete photo file:')
      expect(warnCalls[0][1]).toBe('/uploads/walkthrough-photos/photo1.jpg')
      expect(warnCalls[0][2]).toBeTruthy() // Should be an error object
      
      expect(warnCalls[1][0]).toBe('Failed to delete photo file:')
      expect(warnCalls[1][1]).toBe('/uploads/walkthrough-photos/photo2.jpg')
      expect(warnCalls[1][2]).toBeTruthy() // Should be an error object
      
      // Should delete the note
      expect(mockPrisma.walkThroughNote.delete).toHaveBeenCalledWith({
        where: { id: 'note-1' }
      })

      // Restore console.warn
      console.warn = originalWarn
    })
  })
})