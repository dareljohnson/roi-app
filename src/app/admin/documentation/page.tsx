import AdminNav from '../AdminNav';
import dynamic from 'next/dynamic';
import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const AdminWiki = dynamic(() => import('../AdminWiki'), { ssr: false });

export default async function Page() {
  const session = await getServerSession(authOptions);
  const isAdmin = !!session?.user && (session.user as any).role === 'ADMIN';
  return (
    <div className="space-y-6">
      <AdminNav />
      <AdminWiki isAdmin={isAdmin} />
    </div>
  );
}
