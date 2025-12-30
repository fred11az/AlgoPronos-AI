'use client';

import { useI18n } from '@/lib/i18n/context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, locales, localeNames, localeFlags } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', className)}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeFlags[locale]}</span>
          <span className="hidden md:inline">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l: Locale) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className="gap-2"
          >
            <span>{localeFlags[l]}</span>
            <span>{localeNames[l]}</span>
            {locale === l && <Check className="h-4 w-4 ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
