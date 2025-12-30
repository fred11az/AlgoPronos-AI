import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = await checkIsAdmin(user.id);

  return <DashboardShell user={user} isAdmin={isAdmin}>{children}</DashboardShell>;
}
