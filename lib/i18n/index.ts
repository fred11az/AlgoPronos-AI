import fr from './translations/fr.json';
import en from './translations/en.json';

export type Locale = 'fr' | 'en';

export const translations = {
  fr,
  en,
} as const;

export const defaultLocale: Locale = 'fr';

export const locales: Locale[] = ['fr', 'en'];

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
};

// Type for nested object paths
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string = '.'> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? `${F}${D}${Join<Extract<R, string[]>, D>}`
    : never
  : string;

export type TranslationKey = Join<PathsToStringProps<typeof fr>>;

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path; // Return path if not found
    }
  }

  return typeof value === 'string' ? value : path;
}

// Interpolate variables in translation string
function interpolate(
  str: string,
  params?: Record<string, string | number>
): string {
  if (!params) return str;

  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key]?.toString() ?? `{{${key}}}`;
  });
}

// Main translation function
export function t(
  key: string,
  locale: Locale = defaultLocale,
  params?: Record<string, string | number>
): string {
  const translation = getNestedValue(
    translations[locale] as unknown as Record<string, unknown>,
    key
  );
  return interpolate(translation, params);
}

// Create translation function for specific locale
export function createT(locale: Locale) {
  return (key: string, params?: Record<string, string | number>) =>
    t(key, locale, params);
}

// Get all translations for a locale
export function getTranslations(locale: Locale) {
  return translations[locale];
}

// Check if locale is valid
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get locale from Accept-Language header
export function getLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map((lang) => lang.split(';')[0].trim().substring(0, 2).toLowerCase());

  for (const lang of languages) {
    if (isValidLocale(lang)) {
      return lang;
    }
  }

  return defaultLocale;
}
