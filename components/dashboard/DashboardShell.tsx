'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NonOptimizedBanner } from './NonOptimizedBanner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Profile } from '@/types';

interface DashboardShellProps {
  user: Profile | null;
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function DashboardShell({ user, children, isAdmin = false }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const mobileSidebarRef = useRef<HTMLDivElement>(null);

  // Ferme le menu mobile quand la route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when touching/clicking outside the sidebar
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (mobileSidebarRef.current && !mobileSidebarRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [mobileMenuOpen]);

  // Gestion de la déconnexion
  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return; // Prevent double-click

    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any local storage data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }

      toast.success('Déconnexion réussie');

      // Force navigation to login page
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('SignOut error:', error);
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          user={user}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSignOut={handleSignOut}
          isAdmin={isAdmin}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        ref={mobileSidebarRef}
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar
          user={user}
          collapsed={false}
          onToggle={() => setMobileMenuOpen(false)}
          onLinkClick={() => setMobileMenuOpen(false)}
          onSignOut={handleSignOut}
          isAdmin={isAdmin}
          isMobile={true}
        />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        <TopBar user={user} onMenuClick={() => setMobileMenuOpen(true)} isAdmin={isAdmin} />
        {/* Non-Optimized banner for standard (non-verified) registered users */}
        {user && user.tier !== 'verified' && <NonOptimizedBanner />}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
