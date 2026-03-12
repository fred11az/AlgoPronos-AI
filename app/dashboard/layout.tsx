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

  // Visitors (no account) are no longer allowed in the dashboard.
  // They must register to access their personalised space.
  if (!user) {
    redirect('/?trial=1');
  }

  const isAdmin = await checkIsAdmin(user.id);

  return <DashboardShell user={user} isAdmin={isAdmin}>{children}</DashboardShell>;
}
