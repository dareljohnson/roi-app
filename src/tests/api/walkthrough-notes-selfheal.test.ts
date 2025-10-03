/**
 * @jest-environment node
 */
import { POST } from '@/app/api/walkthrough-notes/route'
import { NextRequest } from 'next/server'
import * as nextAuth from 'next-auth/next'
// Route uses default prisma from '@/lib/prisma'
import prisma from '@/lib/prisma'

jest.mock('next-auth/next', () => ({
  ...jest.requireActual('next-auth/next'),
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  user: { findUnique: jest.fn().mockResolvedValue({ id: 'user1', email: 'user@example.com' }) },
  property: { findFirst: jest.fn().mockResolvedValue({ id: 'prop1', address: '123 Main' }) },
  walkThroughNote: { create: jest.fn() },
  $executeRawUnsafe: jest.fn(),
}))

// Silence prisma query logging for this targeted test
jest.mock('@/lib/adminInsights', () => ({ recordApiCall: jest.fn() }))

describe('walkthrough-notes POST self-heal (missing walk_through_photos table)', () => {
  const sessionUser = { id: 'user1', email: 'user@example.com', role: 'USER' }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(nextAuth.getServerSession as jest.Mock).mockResolvedValue({ user: sessionUser })
  })

  it('creates table and retries on P2021 missing walk_through_photos table', async () => {
    const firstError: any = new Error('Table missing')
    firstError.code = 'P2021'
    firstError.meta = { table: 'main.walk_through_photos' }

    ;(prisma as any).walkThroughNote.create
      .mockRejectedValueOnce(firstError)
      .mockResolvedValueOnce({ id: 'note1', title: 'T', content: 'C', propertyId: 'prop1', userId: 'user1', photos: [] })

    const payload = {
      title: 'T',
      content: 'C',
      propertyId: 'prop1',
      rating: 4,
      photos: [
        {
          filename: 'p1.jpg',
          filepath: '/uploads/walkthrough-photos/p1.jpg',
          filesize: 100,
          mimetype: 'image/jpeg',
          description: 'd',
          order: 0,
        },
      ],
    }

    const req = new NextRequest('http://localhost:3000/api/walkthrough-notes', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req as any)
    expect(res.status).toBe(201)
  expect((prisma as any).walkThroughNote.create).toHaveBeenCalledTimes(2)
  expect((prisma as any).$executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS "walk_through_photos"'))
  })
})
