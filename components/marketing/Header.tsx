'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { Menu, X, Sparkles, LogIn, MessageCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Coupe du Monde 2026', href: '/coupe-du-monde-2026', wc: true },
  { label: 'Matchs du jour', href: '/matchs' },
  { label: 'Pronostics', href: '/pronostics' },
  { label: 'Performance', href: '/performance' },
  { label: 'Compte optimisé IA', href: '/compte-optimise-ia' },
  { label: 'Flux Live', href: '/matchs#live-flux', live: true },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-surface-light/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item: any) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-text-secondary hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                {(item as any).wc && <Trophy className="h-3.5 w-3.5 text-yellow-400" />}
                {item.label === 'Compte optimisé IA' && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                <span className={(item as any).wc ? 'text-yellow-400 font-semibold' : ''}>{item.label}</span>
                {(item as any).wc && (
                  <span style={{ background: '#f59e0b', color: '#000', fontSize: '0.6rem', fontWeight: 800, padding: '2px 5px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                    J-31
                  </span>
                )}
                {item.live && (
                  <span style={{ background: '#e53e3e', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '2px 5px', borderRadius: '4px', letterSpacing: '0.5px', animation: 'livePulse 1.5s ease-in-out infinite' }}>
                    LIVE
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://wa.me/22956991777"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#25D366] hover:bg-[#25D366]/10 rounded-full transition-all"
              title="Chat WhatsApp"
            >
              <MessageCircle className="h-6 w-6" />
            </a>
            <div className="w-[1px] h-6 bg-surface-light mx-1" />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Connexion
              </Link>
            </Button>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/onboarding">
                <Sparkles className="mr-2 h-4 w-4" />
                Activer Gratuitement
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-text-secondary hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden absolute top-full left-0 right-0 bg-surface border-b border-surface-light transition-all duration-300 overflow-y-auto',
          mobileMenuOpen ? 'max-h-[calc(100vh-80px)] opacity-100 shadow-2xl' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        <div className="px-4 py-6 space-y-4">
          {navItems.map((item: any) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between text-text-secondary hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center gap-1.5">
                {(item as any).wc && <Trophy className="h-3.5 w-3.5 text-yellow-400" />}
                {item.label === 'Compte optimisé IA' && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                <span className={(item as any).wc ? 'text-yellow-400 font-semibold' : ''}>{item.label}</span>
              </div>
              {(item as any).wc && (
                <span className="bg-yellow-400 text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded">J-31</span>
              )}
              {item.live && (
                <span className="bg-[#e53e3e] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded animate-pulse">
                  LIVE
                </span>
              )}
            </Link>
          ))}
          <div className="pt-4 space-y-3 border-t border-surface-light">
            <a
              href="https://wa.me/22956991777"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366]/10 text-[#25D366] font-bold transition-all"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp Support
            </a>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Connexion
              </Link>
            </Button>
            <Button variant="gradient" className="w-full" asChild>
              <Link href="/onboarding">
                <Sparkles className="mr-2 h-4 w-4" />
                Activer Gratuitement
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
