
// Mock dependencies before imports
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  prisma: {
    property: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    user: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    analysis: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    account: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    verificationToken: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/adminInsights', () => ({
  recordApiCall: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/restore/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/database';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Admin DB Restore API (CSV)', () => {
  let req: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock prisma methods for clearing tables
    mockPrisma.verificationToken.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    mockPrisma.session.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    mockPrisma.account.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    mockPrisma.analysis.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    mockPrisma.property.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    mockPrisma.user.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
    
    // Mock prisma createMany methods
    mockPrisma.user.createMany = jest.fn().mockResolvedValue({ count: 1 });
    mockPrisma.property.createMany = jest.fn().mockResolvedValue({ count: 0 });
    mockPrisma.analysis.createMany = jest.fn().mockResolvedValue({ count: 0 });
    mockPrisma.account.createMany = jest.fn().mockResolvedValue({ count: 0 });
    mockPrisma.session.createMany = jest.fn().mockResolvedValue({ count: 0 });
    mockPrisma.verificationToken.createMany = jest.fn().mockResolvedValue({ count: 0 });
  });

  it('should reject non-admins', async () => {
    // Mock no session (unauthorized)
    mockGetServerSession.mockResolvedValue(null);

    const csvData = { csvExport: { users: 'id,email,name,role\ntest-user,test@example.com,Test User,ADMIN' } };
    req = new NextRequest('http://localhost:3000/api/admin/restore', {
      method: 'POST',
      body: JSON.stringify(csvData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should allow admin to restore from CSV', async () => {
    // Mock admin session
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN' },
    } as any);

    const csvData = { csvExport: { users: 'id,email,name,role\ntest-user,test@example.com,Test User,ADMIN' } };
    req = new NextRequest('http://localhost:3000/api/admin/restore', {
      method: 'POST',
      body: JSON.stringify(csvData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.mode).toBe('csv');
    
    // Verify that the clear operations were called
    expect(mockPrisma.user.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.user.createMany).toHaveBeenCalledWith({
      data: [{ id: 'test-user', email: 'test@example.com', name: 'Test User', role: 'ADMIN' }]
    });
  });
});
