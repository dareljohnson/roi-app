import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database'

import dynamic from 'next/dynamic'
import AdminNav from './AdminNav';
const AdminRestoreForm = dynamic(() => import('@/components/admin/AdminRestoreForm'), { ssr: false });
const AdminExportButtons = dynamic(() => import('@/components/admin/AdminExportButtons'), { ssr: false });
const AdminUserTable = dynamic(() => import('@/components/admin/AdminUserTable'), { ssr: false });
const AdminInsightsDashboard = dynamic(() => import('@/components/admin/AdminInsightsDashboard'), { ssr: false });

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/login')
  }


  // Pagination: get page from searchParams (default 1)
  // Next.js App Router: use searchParams in server component
  // (for now, default to page 1)
  const pageSize = 20;
  const page = 1;
  type Property = { id: string; createdAt: Date };
  type User = {
    id: string;
    email: string;
    name: string | null;
    role: string;
    lastLogin?: Date | null;
    lastIp?: string | null;
    active: boolean;
    properties: Property[];
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      include: {
        properties: {
          select: { id: true, createdAt: true },
        },
      },
      orderBy: { email: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }) as Promise<User[]>,
    prisma.user.count(),
  ]);

  // Serialize lastLogin to string for client
  const usersWithLogin = users.map((u: User) => ({
    ...u,
    lastLogin: u.lastLogin ? u.lastLogin.toISOString() : null,
    lastIp: u.lastIp || null,
    active: u.active,
    properties: u.properties.map((p: Property) => ({ ...p, createdAt: p.createdAt.toISOString() })),
  }));


  return (
    <div className="space-y-6">
      <AdminNav />
      <AdminRestoreForm />
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <AdminExportButtons />
      {/* Pass users, total, and pageSize to client table */}
      <AdminUserTable users={usersWithLogin} total={total} pageSize={pageSize} />
      <AdminInsightsDashboard />
    </div>
  )
}
