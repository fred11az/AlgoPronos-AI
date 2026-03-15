import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'XOF'): string {
  if (currency === 'XOF' || currency === 'FCFA') {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHour < 24) return `Il y a ${diffHour}h`;
  if (diffDay < 7) return `Il y a ${diffDay}j`;
  return formatDate(d);
}

export function formatOdds(odds: number | null | undefined): string {
  if (odds === null || odds === undefined || isNaN(odds)) return '1.00';
  return odds.toFixed(2);
}

export function calculateTotalOdds(odds: number[]): number {
  return odds.reduce((acc, odd) => acc * odd, 1);
}

export function generateCacheKey(params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, unknown>);

  return btoa(JSON.stringify(sortedParams)).slice(0, 32);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    BJ: 'Bénin',
    TG: 'Togo',
    CI: 'Côte d\'Ivoire',
    SN: 'Sénégal',
    ML: 'Mali',
    BF: 'Burkina Faso',
    NE: 'Niger',
    GN: 'Guinée',
    CM: 'Cameroun',
    GA: 'Gabon',
    CG: 'Congo',
    CD: 'RD Congo',
  };
  return countries[code] || code;
}

export function getLeagueName(code: string): string {
  const leagues: Record<string, string> = {
    PL: 'Premier League',
    LA: 'La Liga',
    SA: 'Serie A',
    BL: 'Bundesliga',
    FL: 'Ligue 1',
    CL: 'Champions League',
    EL: 'Europa League',
    WC: 'Coupe du Monde',
    CAN: 'CAN',
  };
  return leagues[code] || code;
}
