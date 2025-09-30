/**
 * @jest-environment node
 */
import { GET as GET_PROPERTY } from '@/app/api/properties/[id]/route'
import { GET as GET_PROPERTIES_LIST } from '@/app/api/properties/route'
import * as nextAuth from 'next-auth'
import { prisma } from '@/lib/database'

jest.mock('next-auth', () => ({
  ...jest.requireActual('next-auth'),
  getServerSession: jest.fn(),
}))

describe('Walk-Through Notes Overall Rating Aggregation', () => {
  const user = { id: 'user-walk-rating', email: 'user@example.com', role: 'USER' }

  beforeAll(async () => {
    // Manually create table if missing (avoids spawning prisma CLI in test-only runs)
    const tables: Array<{ name: string }> = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='walk_through_notes'"
    )
    if (tables.length === 0) {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS walk_through_notes (
        id TEXT PRIMARY KEY,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        rating INTEGER DEFAULT 0,
        propertyId TEXT NOT NULL,
        userId TEXT NOT NULL
      );`)
    }
    // Clean up any leftover test data with same user id
    await prisma.walkThroughNote.deleteMany({ where: { userId: user.id } })
    await prisma.property.deleteMany({ where: { userId: user.id } })
    await prisma.user.deleteMany({ where: { id: user.id } })
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        role: 'USER',
        hashedPassword: 'hashed',
        active: true,
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.walkThroughNote.deleteMany({ where: { userId: user.id } })
    await prisma.property.deleteMany({ where: { userId: user.id } })
    await prisma.user.deleteMany({ where: { id: user.id } })
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(nextAuth.getServerSession as jest.Mock).mockResolvedValue({ user })
  })

  it('returns null average and 0 count when there are no walk-through notes', async () => {
    const property = await prisma.property.create({
      data: {
        address: '123 Empty Ln',
        propertyType: 'Single Family',
        purchasePrice: 100000,
        downPayment: 20000,
        interestRate: 0.05,
        loanTerm: 30,
        grossRent: 1500,
        vacancyRate: 0.05,
        userId: user.id,
      },
    })
    // Create minimal analysis to satisfy existing route contract (returns 404 without an analysis)
    await prisma.analysis.create({
      data: {
        propertyId: property.id,
        monthlyPayment: 0,
        cashFlow: 0,
        annualCashFlow: 0,
        roi: 0,
        capRate: 0,
        npv: 0,
        totalCashInvested: 0,
        netOperatingIncome: 0,
        effectiveGrossIncome: 0,
        recommendation: 'PASS',
        recommendationScore: 0,
        monthlyProjections: JSON.stringify([]),
        annualProjections: JSON.stringify([]),
        recommendationReasons: JSON.stringify([]),
      },
    })
    const request = new Request(`http://localhost/api/properties/${property.id}`)
    const res: any = await GET_PROPERTY(request as any, { params: { id: property.id } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.analysis.walkThroughAverageRating).toBeNull()
    expect(json.analysis.walkThroughRatingCount).toBe(0)
  })

  it('computes average rating and count correctly from walk-through notes', async () => {
    const ratedProperty = await prisma.property.create({
      data: {
        address: '456 Rated St',
        propertyType: 'Condo',
        purchasePrice: 200000,
        downPayment: 40000,
        interestRate: 0.045,
        loanTerm: 30,
        grossRent: 1800,
        vacancyRate: 0.05,
        userId: user.id,
      },
    })

    // Create analysis (required for property detail response to succeed)
    await prisma.analysis.create({
      data: {
        propertyId: ratedProperty.id,
        monthlyPayment: 1000,
        cashFlow: 500,
        annualCashFlow: 6000,
        roi: 12,
        capRate: 7,
        npv: 10000,
        totalCashInvested: 50000,
        netOperatingIncome: 12000,
        effectiveGrossIncome: 20000,
        recommendation: 'BUY',
        recommendationScore: 85,
        monthlyProjections: JSON.stringify([]),
        annualProjections: JSON.stringify([]),
        recommendationReasons: JSON.stringify([]),
      },
    })

    // Walk-through notes with ratings (one unrated should be ignored)
    await prisma.walkThroughNote.createMany({
      data: [
        { title: 'Great condition', content: 'Solid overall', rating: 5, propertyId: ratedProperty.id, userId: user.id },
        { title: 'Nice area', content: 'Quiet street', rating: 4, propertyId: ratedProperty.id, userId: user.id },
        { title: 'Placeholder', content: 'Needs rating', rating: 0, propertyId: ratedProperty.id, userId: user.id },
      ],
    })

    const request = new Request(`http://localhost/api/properties/${ratedProperty.id}`)
    const res: any = await GET_PROPERTY(request as any, { params: { id: ratedProperty.id } })
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.success).toBe(true)
    // (5 + 4) / 2 = 4.5 ignoring the zero rating
    expect(json.analysis.walkThroughAverageRating).toBeCloseTo(4.5, 5)
    expect(json.analysis.walkThroughRatingCount).toBe(2)
  })

  it('includes aggregated rating in property list response', async () => {
    const request = new Request('http://localhost/api/properties')
    const res: any = await GET_PROPERTIES_LIST(request as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    const ratedItem = json.analyses.find((a: any) => a.address === '456 Rated St')
    expect(ratedItem).toBeTruthy()
    // list response adds analysis inside `analysis` but we extend root item with aggregated fields
    expect(ratedItem.walkThroughAverageRating).toBeDefined()
    expect(ratedItem.walkThroughRatingCount).toBeGreaterThanOrEqual(0)
  })
})
