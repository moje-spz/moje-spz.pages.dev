import { writable } from 'svelte/store';
import { vi } from 'vitest';
import type { Readable } from 'svelte/store';

// Mock isLocaleLoaded store
export const mockIsLocaleLoaded = writable(true);

// Mock i18n loading state
export const mockI18nLoading = writable(false);

// Mock locale store
export const mockLocale = writable('en');

// Mock dictionary with some basic translations
const mockDictionary = {
    en: {
        appTitle: 'My Czech Registration Plate',
        themeToggle: {
            label: 'Theme',
            auto: 'Auto',
            light: 'Light',
            dark: 'Dark'
        },
        aboutModal: {
            portalLink: {
                text: 'Portal Link'
            },
            footer: {
                aboutLink: 'About'
            }
        },
        multiLineInputModal: {
            ok: 'OK'
        }
    }
};

interface TranslationFunction extends Readable<(key: string) => string> {
    (key: string): string;
}

// Mock translation function
const createMockTranslate = (): TranslationFunction => {
    const translate = ((key: string): string => {
        const parts = key.split('.');
        let value: unknown = mockDictionary.en;
        for (const part of parts) {
            if (value && typeof value === 'object') {
                value = (value as Record<string, unknown>)[part];
            } else {
                return key;
            }
        }
        return typeof value === 'string' ? value : key;
    }) as TranslationFunction;

    translate.subscribe = (fn: (val: (key: string) => string) => void): (() => void) => {
        fn(translate);
        return (): void => { };
    };

    return translate;
};

export const mockTranslate = createMockTranslate();

// Mock setupI18n function
const mockSetupI18n = vi.fn().mockImplementation((): Promise<void> => {
    mockIsLocaleLoaded.set(true);
    mockI18nLoading.set(false);
    mockLocale.set('en');
    return Promise.resolve();
});

// Mock init function
const mockInit = vi.fn().mockImplementation(({ initialLocale }: { initialLocale?: string }): void => {
    mockLocale.set(initialLocale || 'en');
});

// Mock getOptions function
const mockGetOptions = vi.fn().mockReturnValue({
    fallbackLocale: 'en',
    initialLocale: 'en',
    handleMissingMessage: ({ key }: { key: string }): string => key
});

// Initialize the locale immediately
mockLocale.set('en');

// Mock svelte-i18n module
vi.mock('svelte-i18n', () => ({
    _: mockTranslate,
    isLoading: mockI18nLoading,
    locale: mockLocale,
    dictionary: writable(mockDictionary),
    init: mockInit,
    getLocaleFromNavigator: (): string => 'en',
    addMessages: vi.fn(),
    getOptions: mockGetOptions,
    format: mockTranslate,
    formatMessage: mockTranslate
}));

// Mock i18n module
vi.mock('$lib/i18n', () => ({
    setupI18n: mockSetupI18n,
    isLocaleLoaded: mockIsLocaleLoaded
}));
