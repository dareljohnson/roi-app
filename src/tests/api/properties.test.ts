/**
 * @jest-environment node
 */
import { POST, GET } from '@/app/api/properties/route'
import * as nextAuth from 'next-auth'
import { prisma } from '@/lib/database'

jest.mock('next-auth', () => ({
  ...jest.requireActual('next-auth'),
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/database', () => ({
  prisma: {
    property: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    analysis: {
      create: jest.fn(),
    },
  },
}))

describe('properties API', () => {
  const sessionUser = { id: 'user1', email: 'user@example.com', role: 'USER' }
  const adminUser = { id: 'admin1', email: 'admin@example.com', role: 'ADMIN' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST returns 401 when not authenticated', async () => {
    ;(nextAuth.getServerSession as jest.Mock).mockResolvedValue(null)
    const req = { json: async () => ({}) }
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('GET returns 401 when not authenticated', async () => {
    ;(nextAuth.getServerSession as jest.Mock).mockResolvedValue(null)
    const req = { url: 'http://localhost/api/properties' }
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })


  it('POST saves property and analysis for authenticated user', async () => {
    ;(nextAuth.getServerSession as jest.Mock).mockResolvedValue({ user: sessionUser })
    ;(prisma.property.create as jest.Mock).mockResolvedValue({ id: 'prop1' })
    ;(prisma.analysis.create as jest.Mock).mockResolvedValue({ id: 'an1' })

    const body = {
      propertyData: {
        address: '123 Main',
        propertyType: 'Single Family',
        purchasePrice: 100000,
        downPayment: 20000,
        interestRate: 0.05,
        loanTerm: 30,
        grossRent: 1500,
        vacancyRate: 0.05,
        imageUrl: 'https://example.com/property.jpg',
      },
      results: {
        monthlyPayment: 500,
        monthlyCashFlow: 200,
        annualCashFlow: 2400,
        roi: 10,
        capRate: 6,
        npv: 1000,
        irr: null,
        totalCashInvested: 25000,
        netOperatingIncome: 7200,
        effectiveGrossIncome: 18000,
        recommendation: 'BUY',
        recommendationScore: 85,
        monthlyProjections: [],
        annualProjections: [],
      },
    }

    const req = { json: async () => body }
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(prisma.property.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ imageUrl: 'https://example.com/property.jpg' })
    }))
    expect(prisma.analysis.create).toHaveBeenCalled()
  })

  it('GET scopes to user for non-admin and returns formatted data', async () => {
    ;(nextAuth.getServerSession as jest.Mock).mockResolvedValue({ user: sessionUser })
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([
      { 
        id: 'prop1', 
        address: '123', 
        propertyType: 'House', 
        purchasePrice: 1, 
        createdAt: new Date(), 
        // Fields accessed by formatter
        bedrooms: null,
        bathrooms: null,
        grossRent: null,
        squareFootage: null,
        imageUrl: null,
        archived: false,
        // New aggregation dependency
        walkThroughNotes: [],
        analyses: [{ 
          id: 'a1', 
          roi: 1, 
          cashFlow: 2, 
          recommendation: 'BUY', 
          recommendationScore: 90, 
          createdAt: new Date(), 
          totalCashInvested: 0,
          npv: 0,
        }] 
      },
    ])
    ;(prisma.property.count as jest.Mock).mockResolvedValue(1)
  const req = { url: 'http://localhost/api/properties' }
  const res = await GET(req as any)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.analyses[0].analysis).toBeTruthy()
  })
})
