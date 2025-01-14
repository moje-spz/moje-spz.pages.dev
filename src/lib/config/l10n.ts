// Locales our app supports with their display names
export const locales = {
    cs: 'Čeština',
    en: 'English'
} as const;

// Type for locale codes
export type LocaleCode = keyof typeof locales;

// Default locale to use as fallback
export const defaultLocale: LocaleCode = 'cs';

// Type for language preference that includes 'auto' option
export type LanguagePreference = LocaleCode | 'auto';

// Storage key for language preference
export const STORAGE_KEY = 'language_preference';

// List of supported languages
export const SUPPORTED_LANGUAGES = Object.keys(locales) as LocaleCode[];
