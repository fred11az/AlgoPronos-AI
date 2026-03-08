import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { ANONYMOUS_COOKIE_CONFIG } from '@/lib/anonymous/types';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    // Allow anonymous sessions (cookie set by /api/try-free)
    const cookieStore = await cookies();
    const hasAnonymousSession = !!cookieStore.get(ANONYMOUS_COOKIE_CONFIG.name)?.value;
    if (!hasAnonymousSession) {
      redirect('/try-free');
    }
  }

  const isAdmin = user ? await checkIsAdmin(user.id) : false;

  return <DashboardShell user={user ?? null} isAdmin={isAdmin}>{children}</DashboardShell>;
}
