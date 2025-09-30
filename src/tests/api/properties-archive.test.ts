/**
 * @jest-environment node
 */
// Mock dependencies first to avoid ES module issues
jest.mock('next-auth', () => ({
  ...jest.requireActual('next-auth'),
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/adminInsights', () => ({
  recordApiCall: jest.fn(),
}))

jest.mock('@/lib/database', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    analysis: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}))

import { NextRequest } from 'next/server'
import { POST as createProperty } from '@/app/api/properties/route'
import { PATCH as archiveProperty } from '@/app/api/properties/[id]/archive/route'
import { prisma } from '@/lib/database'
import { getServerSession } from 'next-auth'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Property Archive API', () => {
  let testPropertyId: string;
  let testUserId: string;
  let testEmail: string;

  beforeEach(() => {
    // Generate unique user id and email for each test
    testPropertyId = 'test-property-id';
    testUserId = `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    testEmail = `${testUserId}@example.com`;

    // Reset all mocks
    jest.clearAllMocks();

    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: {
        id: testUserId,
        email: testEmail,
        role: 'USER',
      },
    });

    // Mock property data
    const mockProperty = {
      id: testPropertyId,
      userId: testUserId,
      address: '123 Test Archive St',
      propertyType: 'Single Family',
      purchasePrice: 250000,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentValue: null,
      squareFootage: null,
      lotSize: null,
      yearBuilt: null,
      bedrooms: null,
      bathrooms: null,
      condition: null,
      downPayment: 50000,
      interestRate: 4.5,
      loanTerm: 30,
      closingCosts: null,
      pmiRate: null,
      grossRent: 2000,
      vacancyRate: 0.05,
      propertyTaxes: null,
      insurance: null,
      propertyMgmt: null,
      maintenance: null,
      utilities: null,
      hoaFees: null,
      equipment: null,
      rehabCosts: null,
      imageUrl: null,
    };

    // Mock database operations with proper typing
    (mockPrisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
    (mockPrisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty);
    (mockPrisma.property.update as jest.Mock).mockResolvedValue({
      ...mockProperty,
      archived: true,
    });
  });

  describe('PATCH /api/properties/[id]/archive', () => {
    it('should archive a property successfully', async () => {
      const request = new NextRequest(`http://localhost:3000/api/properties/${testPropertyId}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Use the correct session for the property owner
      const ownerSession = {
        user: {
          id: testUserId,
          email: testEmail,
          role: 'USER',
        },
      };
      const response = await archiveProperty(request, { params: { id: testPropertyId } }, ownerSession);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Property archived successfully',
        property: {
          id: testPropertyId,
          address: '123 Test Archive St',
          archived: true,
        },
      });

      // Verify database was called with correct parameters
      expect(mockPrisma.property.findFirst).toHaveBeenCalledWith({
        where: { id: testPropertyId }
      });
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: testPropertyId },
        data: { archived: true }
      });
    });

    it('should unarchive a property successfully', async () => {
      // Mock property update to return unarchived property
      (mockPrisma.property.update as jest.Mock).mockResolvedValueOnce({
        id: testPropertyId,
        userId: testUserId,
        address: '123 Test Archive St',
        archived: false,
        // ... other property fields would be included
      });

      const request = new NextRequest(`http://localhost:3000/api/properties/${testPropertyId}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: false }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Use the correct session for the property owner
      const ownerSession = {
        user: {
          id: testUserId,
          email: testEmail,
          role: 'USER',
        },
      };
      const response = await archiveProperty(request, { params: { id: testPropertyId } }, ownerSession);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Property unarchived successfully',
        property: {
          id: testPropertyId,
          address: '123 Test Archive St',
          archived: false,
        },
      });

      // Verify database was called with correct parameters
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: testPropertyId },
        data: { archived: false }
      });
    });

    it('should require authentication', async () => {
      const request = new NextRequest(`http://localhost:3000/api/properties/${testPropertyId}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await archiveProperty(request, { params: { id: testPropertyId } }, null)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      })
    })

    it('should validate property ownership', async () => {
      // Use different user session
      const otherSession = {
        user: {
          id: 'different-user-456',
          email: 'other@example.com',
          role: 'USER',
        },
      }
      const request = new NextRequest(`http://localhost:3000/api/properties/${testPropertyId}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await archiveProperty(request, { params: { id: testPropertyId } }, otherSession)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({
        success: false,
        error: 'Forbidden',
      })
    })

    it('should allow admin to archive any property', async () => {
      // Use admin session
      const adminSession = {
        user: {
          id: 'admin-789',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      }
      const request = new NextRequest(`http://localhost:3000/api/properties/${testPropertyId}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await archiveProperty(request, { params: { id: testPropertyId } }, adminSession)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

  it('should return 404 for non-existent property', async () => {
        // Mock findFirst to return null for non-existent property
        (mockPrisma.property.findFirst as jest.Mock).mockResolvedValueOnce(null);

        const ownerSession = {
          user: {
            id: testUserId,
            email: testEmail,
            role: 'USER',
          },
        };

      const request = new NextRequest('http://localhost:3000/api/properties/non-existent-id/archive', {
        method: 'PATCH',
        body: JSON.stringify({ archived: true }),
        headers: { 'Content-Type': 'application/json' },
      })

        const response = await archiveProperty(request, { params: { id: 'non-existent-id' } }, ownerSession)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'Property not found',
      })
    })

  it('should validate request body', async () => {
        const ownerSession = {
          user: {
            id: testUserId,
            email: testEmail,
            role: 'USER',
          },
        };

      const request = new NextRequest(`http://localhost:3000/api/properties/${testPropertyId}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ invalid: 'data' }),
        headers: { 'Content-Type': 'application/json' },
      })

        const response = await archiveProperty(request, { params: { id: testPropertyId } }, ownerSession)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('archived')
    })
  })
})

function mockAnalysisResults() {
  return {
    monthlyPayment: 1200,
    monthlyCashFlow: 800,
    monthlyOperatingExpenses: 400,
    annualCashFlow: 9600,
    netOperatingIncome: 19200,
    effectiveGrossIncome: 22800,
    totalAnnualExpenses: 4800,
    roi: 0.192,
    capRate: 0.077,
    cashOnCashReturn: 0.192,
    debtServiceCoverageRatio: 1.33,
    totalCashInvested: 50000,
    loanAmount: 200000,
    recommendation: 'BUY',
    recommendationScore: 85,
  }
}