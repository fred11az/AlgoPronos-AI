'use client';

// Permanent banner shown to standard (registered, non-verified) users.
// Offers to check verification status, then drives upgrade to Full Access.

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NonOptimizedBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20">
      <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              Votre compte bookmaker est actuellement{' '}
              <span className="text-amber-400">Non-Optimisé IA</span>
            </p>
            <p className="text-xs text-text-muted hidden sm:block">
              Débloquez les 6 signaux et l&apos;analyse complète — vérifiez d&apos;abord si
              votre compte est optimisé, puis activez gratuitement.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-400 hover:border-amber-400 hover:bg-amber-500/10" asChild>
            <Link href="/verificateur-compte">
              Vérifier mon compte
            </Link>
          </Button>
          <Button size="sm" variant="gradient" asChild>
            <Link href="/unlock-vip" className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Activer Full Access
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
