'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { Menu, X, Sparkles, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Pronostics', href: '/pronostics' },
  { label: 'Compte optimisé IA', href: '/compte-optimise-ia' },
  { label: 'Bookmakers', href: '#bookmakers' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-surface-light/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-text-secondary hover:text-white transition-colors text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Connexion
              </Link>
            </Button>
            <Button variant="gradient" asChild>
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
          'lg:hidden absolute top-full left-0 right-0 bg-surface border-b border-surface-light transition-all duration-300 overflow-hidden',
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-6 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-text-secondary hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-4 space-y-3">
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
