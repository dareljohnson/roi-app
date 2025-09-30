
import { NextRequest } from 'next/server';

// Mock all dependencies before importing the route
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/database', () => ({
  prisma: {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    property: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    analysis: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    walkThroughNote: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    documentationEntry: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    apiCallLog: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    account: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    session: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    verificationToken: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock('@/lib/adminInsights', () => ({
  recordApiCall: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('model User {\n  id String @id\n}'),
}));

// Now import after mocking
import { GET } from '@/app/api/admin/export/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/database';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Admin DB Export API', () => {
  let req: NextRequest;

  beforeEach(() => {
    req = new NextRequest('http://localhost:3000/api/admin/export');
    jest.clearAllMocks();
    
    // Mock prisma methods
    (mockPrisma.user.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockPrisma.property.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockPrisma.analysis.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockPrisma.walkThroughNote.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockPrisma.documentationEntry.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockPrisma.apiCallLog.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockPrisma.account.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockPrisma.session.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
    (mockPrisma.verificationToken.findMany as jest.Mock) = jest.fn().mockResolvedValue([]);
  });

  it('should reject non-admins', async () => {
    // Mock no session (unauthorized)
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject regular users', async () => {
    // Mock regular user session
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'user@test.com', role: 'USER' },
    } as any);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should allow admin to export schema, JSON, and CSV', async () => {
    // Mock admin session
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN' },
    } as any);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.schema).toContain('model');
    expect(data.jsonExport).toBeDefined();
    expect(data.csvExport).toBeDefined();
    expect(typeof data.csvExport.users).toBe('string');
  });

  it('should include all database tables in export', async () => {
    // Mock admin session
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN' },
    } as any);
    
    // Mock some sample data for each table
    (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([{ id: '1', email: 'test@test.com' }]);
    (mockPrisma.property.findMany as jest.Mock).mockResolvedValue([{ id: '1', address: 'Test Address' }]);
    (mockPrisma.analysis.findMany as jest.Mock).mockResolvedValue([{ id: '1', propertyId: '1' }]);
    (mockPrisma.walkThroughNote.findMany as jest.Mock).mockResolvedValue([{ id: '1', note: 'Test note' }]);
    (mockPrisma.documentationEntry.findMany as jest.Mock).mockResolvedValue([{ id: '1', title: 'Test doc' }]);
    (mockPrisma.apiCallLog.findMany as jest.Mock).mockResolvedValue([{ id: '1', endpoint: '/test' }]);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify all expected tables are present in JSON export
    expect(data.jsonExport.users).toBeDefined();
    expect(data.jsonExport.properties).toBeDefined();
    expect(data.jsonExport.analyses).toBeDefined();
    expect(data.jsonExport.walkThroughNotes).toBeDefined();
    expect(data.jsonExport.documentationEntries).toBeDefined();
    expect(data.jsonExport.apiCallLogs).toBeDefined();
    expect(data.jsonExport.accounts).toBeDefined();
    expect(data.jsonExport.sessions).toBeDefined();
    expect(data.jsonExport.verification_tokens).toBeDefined();
    
    // Verify all expected tables are present in CSV export
    expect(data.csvExport.users).toBeDefined();
    expect(data.csvExport.properties).toBeDefined();
    expect(data.csvExport.analyses).toBeDefined();
    expect(data.csvExport.walkThroughNotes).toBeDefined();
    expect(data.csvExport.documentationEntries).toBeDefined();
    expect(data.csvExport.apiCallLogs).toBeDefined();
    expect(data.csvExport.accounts).toBeDefined();
    expect(data.csvExport.sessions).toBeDefined();
    expect(data.csvExport.verification_tokens).toBeDefined();
    
    // Verify that prisma findMany was called for each table
    expect(mockPrisma.user.findMany).toHaveBeenCalled();
    expect(mockPrisma.property.findMany).toHaveBeenCalled();
    expect(mockPrisma.analysis.findMany).toHaveBeenCalled();
    expect(mockPrisma.walkThroughNote.findMany).toHaveBeenCalled();
    expect(mockPrisma.documentationEntry.findMany).toHaveBeenCalled();
    expect(mockPrisma.apiCallLog.findMany).toHaveBeenCalled();
    expect(mockPrisma.account.findMany).toHaveBeenCalled();
    expect(mockPrisma.session.findMany).toHaveBeenCalled();
    expect(mockPrisma.verificationToken.findMany).toHaveBeenCalled();
  });
});
