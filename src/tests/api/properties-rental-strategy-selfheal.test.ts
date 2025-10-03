/**
 * @jest-environment node
 */
import { POST } from '@/app/api/properties/route'
import * as nextAuth from 'next-auth'
import { prisma } from '@/lib/database'

jest.mock('next-auth', () => ({
  ...jest.requireActual('next-auth'),
  getServerSession: jest.fn(),
}))

// Partially mock prisma to simulate first failure then success
jest.mock('@/lib/database', () => {
  const actual = jest.requireActual('@/lib/database')
  return {
    prisma: {
      ...actual.prisma,
      property: {
        create: jest.fn(),
      },
      analysis: { create: jest.fn().mockResolvedValue({ id: 'an1' }) },
      $executeRawUnsafe: jest.fn(),
    },
  }
})

// Prevent API call logging (which triggers prisma.query logs) during this targeted test
jest.mock('@/lib/adminInsights', () => ({ recordApiCall: jest.fn() }))

describe('properties API rentalStrategy self-heal', () => {
  const sessionUser = { id: 'user1', email: 'user@example.com', role: 'USER' }

  beforeEach(() => {
    jest.clearAllMocks()
    // Silence prisma query logs for this test to avoid post-test logging warnings
    if ((prisma as any)._engineConfig) {
      try { (prisma as any)._engineConfig.log = [] } catch { /* ignore */ }
    }
    ;(prisma as any)._logEmitter = { on: () => {} }
  })

  it('adds column and retries on P2022 missing rentalStrategy column', async () => {
    ;(nextAuth.getServerSession as jest.Mock).mockResolvedValue({ user: sessionUser })

    const firstError: any = new Error('Column missing')
    firstError.code = 'P2022'
    firstError.meta = { column: 'rentalStrategy' }

    ;(prisma.property.create as jest.Mock)
      .mockRejectedValueOnce(firstError) // first attempt fails
      .mockResolvedValueOnce({ id: 'prop1' }) // retry succeeds

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
      },
      results: { monthlyPayment: 0, monthlyCashFlow: 0, annualCashFlow: 0, roi: 0, capRate: 0, npv: 0, irr: null, totalCashInvested: 0, netOperatingIncome: 0, effectiveGrossIncome: 0, recommendation: 'BUY', recommendationScore: 80, monthlyProjections: [], annualProjections: [], recommendationReasons: [] }
    }

    const req = { json: async () => body }
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    expect(prisma.property.create).toHaveBeenCalledTimes(2)
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith("ALTER TABLE properties ADD COLUMN rentalStrategy TEXT DEFAULT 'entire-house'")
  })
})
