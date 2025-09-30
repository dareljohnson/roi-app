/**
 * @jest-environment node
 */
// Force use of dev.db for all Prisma calls in this test
process.env.DATABASE_URL = "file:./dev.db";
import request from 'supertest';
import { createServer } from 'http';
import { fetchApiCallLog } from '@/lib/apilog-db';
import { prisma } from '@/lib/database';

describe('/api/admin/apilog API (persistent log)', () => {
  beforeAll(() => {
    // Print the active database URL for debugging
    // eslint-disable-next-line no-console
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
  });
  beforeAll(async () => {
    // Insert a fake API call log for testing
    await prisma.apiCallLog.create({
      data: {
  ts: new Date(),
        endpoint: '/api/test',
        method: 'GET',
        status: 200,
        responseTime: 123,
        error: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.apiCallLog.deleteMany({ where: { endpoint: '/api/test' } });
    await prisma.$disconnect();
  });

  it('returns persisted API call logs from the database', async () => {
    const log = await fetchApiCallLog({ endpoint: '/api/test' });
    expect(Array.isArray(log)).toBe(true);
    expect(log.some((l: any) => l.endpoint === '/api/test')).toBe(true);
  });
});
