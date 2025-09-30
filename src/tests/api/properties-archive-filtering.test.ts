/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET as getProperties } from '@/app/api/properties/route'
import { prisma } from '@/lib/database'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth', () => ({
  ...jest.requireActual('next-auth'),
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/adminInsights', () => ({
  recordApiCall: jest.fn(),
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Mock user session
const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER',
  },
}

describe('Property Archive Filtering', () => {

  let activePropertyId: string
  let archivedPropertyId: string
  let testUserId: string

  beforeEach(async () => {
    // Generate unique user id for each test
    testUserId = `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const testEmail = `${testUserId}@example.com`;

    // Clean up database in correct order
    await prisma.analysis.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.user.deleteMany({ where: { id: testUserId } });

    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: {
        id: testUserId,
        email: testEmail,
        role: 'USER',
      },
    });

    // Create user for foreign key constraint
    await prisma.user.create({
      data: {
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        hashedPassword: 'test',
        role: 'USER',
      },
    });

    // Create test properties - one active, one archived
    const activeProperty = await prisma.property.create({
      data: {
        address: '123 Active Property St',
        propertyType: 'Single Family',
        purchasePrice: 250000,
        downPayment: 50000,
        interestRate: 4.5,
        loanTerm: 30,
        grossRent: 2000,
        vacancyRate: 0.05,
        archived: false,
        userId: testUserId,
      },
    });
    // Re-fetch to ensure commit
    const confirmedActiveProperty = await prisma.property.findUnique({ where: { id: activeProperty.id } });
    activePropertyId = confirmedActiveProperty?.id || activeProperty.id;

    const archivedProperty = await prisma.property.create({
      data: {
        address: '456 Archived Property Ave',
        propertyType: 'Condo',
        purchasePrice: 180000,
        downPayment: 36000,
        interestRate: 4.8,
        loanTerm: 30,
        grossRent: 1500,
        vacancyRate: 0.08,
        archived: true,
        userId: testUserId,
      },
    });
    // Re-fetch to ensure commit
    const confirmedArchivedProperty = await prisma.property.findUnique({ where: { id: archivedProperty.id } });
    archivedPropertyId = confirmedArchivedProperty?.id || archivedProperty.id;

    // Log property IDs for debugging
    console.log('Active Property ID:', activePropertyId);
    console.log('Archived Property ID:', archivedPropertyId);

    // Now create analyses - verify properties exist first
    const activePropertyExists = await prisma.property.findUnique({ where: { id: activePropertyId } });
    const archivedPropertyExists = await prisma.property.findUnique({ where: { id: archivedPropertyId } });
    
    if (!activePropertyExists) {
      throw new Error(`Active property with ID ${activePropertyId} does not exist`);
    }
    if (!archivedPropertyExists) {
      throw new Error(`Archived property with ID ${archivedPropertyId} does not exist`);
    }

    await prisma.analysis.create({
      data: {
        propertyId: activePropertyId,
        monthlyPayment: 1200,
        cashFlow: 800,
        annualCashFlow: 9600,
        roi: 0.192,
        capRate: 0.077,
        npv: 50000,
        totalCashInvested: 50000,
        netOperatingIncome: 19200,
        effectiveGrossIncome: 22800,
        recommendation: 'BUY',
        recommendationScore: 85,
      },
    });
    await prisma.analysis.create({
      data: {
        propertyId: archivedPropertyId,
        monthlyPayment: 900,
        cashFlow: 600,
        annualCashFlow: 7200,
        roi: 0.2,
        capRate: 0.08,
        npv: 40000,
        totalCashInvested: 36000,
        netOperatingIncome: 14400,
        effectiveGrossIncome: 16560,
        recommendation: 'BUY',
        recommendationScore: 82,
      },
    });
  });


  afterEach(async () => {
    await prisma.analysis.deleteMany();
    await prisma.property.deleteMany();
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/properties', () => {
    it('should return only active properties by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/properties', {
        method: 'GET',
      })

      const response = await getProperties(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.analyses).toHaveLength(1)
      expect(data.analyses[0].address).toBe('123 Active Property St')
      expect(data.analyses[0].id).toBe(activePropertyId)
    })

    it('should return archived properties when includeArchived=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/properties?includeArchived=true', {
        method: 'GET',
      })

      const response = await getProperties(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.analyses).toHaveLength(2)
      
      const addresses = data.analyses.map((p: any) => p.address).sort()
      expect(addresses).toEqual(['123 Active Property St', '456 Archived Property Ave'])
    })

    it('should return only archived properties when archived=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/properties?archived=true', {
        method: 'GET',
      })

      const response = await getProperties(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.analyses).toHaveLength(1)
      expect(data.analyses[0].address).toBe('456 Archived Property Ave')
      expect(data.analyses[0].id).toBe(archivedPropertyId)
    })

    it('should include archived status in property data', async () => {
      const request = new NextRequest('http://localhost:3000/api/properties?includeArchived=true', {
        method: 'GET',
      })

      const response = await getProperties(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      const activeProperty = data.analyses.find((p: any) => p.id === activePropertyId)
      const archivedProperty = data.analyses.find((p: any) => p.id === archivedPropertyId)
      
      expect(activeProperty?.archived).toBe(false)
      expect(archivedProperty?.archived).toBe(true)
    })
  })
})