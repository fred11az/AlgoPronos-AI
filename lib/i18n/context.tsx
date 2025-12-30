'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  type Locale,
  defaultLocale,
  locales,
  t as translate,
  getTranslations,
  localeNames,
  localeFlags,
} from './index';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: ReturnType<typeof getTranslations>;
  locales: Locale[];
  localeNames: Record<Locale, string>;
  localeFlags: Record<Locale, string>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'algopronos-locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && locales.includes(savedLocale as Locale)) {
      setLocaleState(savedLocale as Locale);
    } else {
      // Try to detect from browser
      const browserLang = navigator.language.substring(0, 2).toLowerCase();
      if (locales.includes(browserLang as Locale)) {
        setLocaleState(browserLang as Locale);
      }
    }
    setMounted(true);
  }, []);

  // Save locale to localStorage when it changes
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // Update HTML lang attribute
    document.documentElement.lang = newLocale;
  }, []);

  // Translation function
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(key, locale, params);
    },
    [locale]
  );

  // Get current translations
  const translations = getTranslations(locale);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <I18nContext.Provider
        value={{
          locale: defaultLocale,
          setLocale,
          t: (key: string, params?: Record<string, string | number>) =>
            translate(key, defaultLocale, params),
          translations: getTranslations(defaultLocale),
          locales,
          localeNames,
          localeFlags,
        }}
      >
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        translations,
        locales,
        localeNames,
        localeFlags,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Hook for getting a specific translation namespace
export function useTranslations(namespace?: string) {
  const { t, locale, translations } = useI18n();

  const scopedT = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return t(fullKey, params);
    },
    [t, namespace]
  );

  return { t: scopedT, locale, translations };
}
