import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, checkIsAdmin } from '@/lib/supabase/server';
import { Logo } from '@/components/shared/Logo';
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  Settings,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Utilisateurs', href: '/admin/users', icon: Users },
  { label: 'Vérifications VIP', href: '/admin/verifications', icon: CheckCircle },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = await checkIsAdmin(user.id);

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-surface border-r border-surface-light flex flex-col">
        <div className="p-4 border-b border-surface-light">
          <Logo size="sm" />
          <p className="text-xs text-text-muted mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-white hover:bg-surface-light transition-all"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-light">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
