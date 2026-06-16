import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { AdminSidebar } from './AdminSidebar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) redirect('/dashboard');

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      {/* pt-16 sur mobile pour laisser place au bouton hamburger fixe */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
