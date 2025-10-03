import { createMocks } from 'node-mocks-http';
import { PATCH } from '../../app/api/properties/[id]/route';
import { getServerSession } from 'next-auth';

// Mock next-auth to avoid ESM dependency loading
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
// Mock authOptions so importing route doesn't pull real NextAuth providers
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
// Mock prisma from shared database module
jest.mock('@/lib/database', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
import { prisma } from '@/lib/database';
const mockSession = {
  user: { id: 'user123', role: 'USER' },
};

describe('PATCH /api/properties/[id] - Update imageUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update imageUrl for owned property', async () => {
  (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  (prisma.property.findUnique as jest.Mock).mockResolvedValue({ id: 'test-prop', userId: 'user123' });
  (prisma.property.update as jest.Mock).mockResolvedValue({ id: 'test-prop', imageUrl: '/uploads/new-image.jpg' });
    const reqBody = { imageUrl: '/uploads/new-image.jpg' };
    const { req, res } = createMocks({
      method: 'PATCH',
      url: '/api/properties/test-prop',
      body: reqBody,
    });
    // Patch expects NextRequest and params
    req.json = async () => reqBody;
  const result = await PATCH(req as any, { params: { id: 'test-prop' } }, mockSession);
    expect(result.status).toBe(200);
    const json = await result.json();
    expect(json.success).toBe(true);
    expect(json.property.imageUrl).toBe('/uploads/new-image.jpg');
  });

  it('should fail if not authenticated', async () => {
  (getServerSession as jest.Mock).mockResolvedValue(null);
    const reqBody = { imageUrl: '/uploads/new-image.jpg' };
    const { req, res } = createMocks({
      method: 'PATCH',
      url: '/api/properties/test-prop',
      body: reqBody,
    });
    req.json = async () => reqBody;
  const result = await PATCH(req as any, { params: { id: 'test-prop' } }, null);
    expect(result.status).toBe(401);
    const json = await result.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/Unauthorized/);
  });

  it('should fail if imageUrl is missing', async () => {
  (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  (prisma.property.findUnique as jest.Mock).mockResolvedValue({ id: 'test-prop', userId: 'user123' });
    const reqBody = {};
    const { req, res } = createMocks({
      method: 'PATCH',
      url: '/api/properties/test-prop',
      body: reqBody,
    });
    req.json = async () => reqBody;
  const result = await PATCH(req as any, { params: { id: 'test-prop' } }, mockSession);
    expect(result.status).toBe(400);
    const json = await result.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/Missing imageUrl/);
  });
});
