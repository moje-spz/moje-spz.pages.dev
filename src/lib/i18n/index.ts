import { addMessages, init, getLocaleFromNavigator, _, locale, dictionary } from 'svelte-i18n';
import { derived, writable, get, type Readable } from 'svelte/store';
import { language } from '$lib/stores/language';
import { locales, defaultLocale, type LocaleCode } from '$lib/config/l10n';

// Type for locale display names
export type LocaleName = typeof locales[LocaleCode];

// Internal store for tracking network loading state
const isDownloading = writable(false);

// Track active locale
let _activeLocale: LocaleCode;

// Type for setupI18n options
export interface SetupI18nOptions {
    withLocale?: LocaleCode;
}

function hasLoadedLocale(locale: LocaleCode): boolean {
    return get(dictionary)[locale] !== undefined;
}

function getInitialLocale(): LocaleCode {
    const browserLocale = getLocaleFromNavigator()?.split('-')[0];
    return browserLocale && browserLocale in locales
        ? browserLocale as LocaleCode
        : defaultLocale;
}

async function loadJson(locale: LocaleCode): Promise<Record<string, unknown>> {
    const response = await fetch(`/lang/${locale}.json`);
    if (!response.ok) {
        throw new Error(`Failed to load translations for ${locale}: ${response.statusText}`);
    }
    return response.json();
}

// Initialize i18n with proper typing
export async function setupI18n(): Promise<void> {
    // Initialize the language store
    language.init();

    // Subscribe to language changes
    language.subscribe(async (langPref) => {
        const locale_ = langPref === 'auto' ? getInitialLocale() : langPref;

        try {
            // Initialize svelte-i18n
            init({
                fallbackLocale: defaultLocale,
                initialLocale: locale_
            });

            // Don't re-download translation files
            if (!hasLoadedLocale(locale_)) {
                isDownloading.set(true);
                const messages = await loadJson(locale_);
                _activeLocale = locale_;
                addMessages(locale_, messages);
                locale.set(locale_);
            }
        } catch (error) {
            console.error('Failed to load translations:', error);
            // If loading the selected locale fails, try loading the default locale
            if (locale_ !== defaultLocale) {
                try {
                    const defaultMessages = await loadJson(defaultLocale);
                    _activeLocale = defaultLocale;
                    addMessages(defaultLocale, defaultMessages);
                    locale.set(defaultLocale);
                } catch {
                    throw new Error(`Failed to load both requested locale (${locale_}) and fallback locale (${defaultLocale})`);
                }
            } else {
                throw error; // Re-throw if even the default locale fails
            }
        } finally {
            isDownloading.set(false);
        }
    });
}

// Derived store to track if locale is loaded
export const isLocaleLoaded = derived(
    [isDownloading, dictionary],
    ([$isDownloading, $dictionary]) =>
        !$isDownloading &&
        _activeLocale &&
        $dictionary[_activeLocale] &&
        Object.keys($dictionary[_activeLocale]).length > 0
);

// Type for translation message items
interface LinkItem {
    type: 'a';
    text: string;
    href: string;
}

interface PlainItem {
    type: 'plain';
    text: string;
}

type PAndAContent = (PlainItem | LinkItem)[];

interface AboutDetailsUlItem {
    type: 'ul';
    content: string[];
}

interface AboutDetailsPItem {
    type: 'p';
    content: string;
}

interface AboutDetailsPAndAItem {
    type: 'p_and_a';
    content: PAndAContent;
}

export type AboutDetailsItem = AboutDetailsUlItem | AboutDetailsPItem | AboutDetailsPAndAItem;

// Define the complete messages structure
export interface Messages {
    appTitle: string;
    AboutInline: {
        title: string;
    };
    AboutIntro: string[];
    AboutDetails: AboutDetailsItem[];
    expandableDetails: {
        showMore: string;
        showLess: string;
    };
    aboutModal: {
        title: string;
        button: string;
        footer: {
            sourceCode: string;
            aboutLink: string;
        };
        portalLink: {
            prefix: string;
            linkText: string;
            url: string;
        };
    };
    hamburgerMenu: {
        open: string;
        close: string;
        label: string;
        closeOverlay: string;
        closeButton: string;
    };
    languageSelector: {
        label: string;
        auto: string;
        en: string;
        cs: string;
    };
    themeToggle: {
        label: string;
        auto: string;
        light: string;
        dark: string;
        toggle: string;
    };
    inputSection: {
        label: string;
        placeholder: string;
        hideLarge: string;
        showLarge: string;
        addPlate: string;
        removePlate: string;
        warnings: {
            diacritics: string;
            symbols: string;
            whitespace: string;
            maxLines: string;
            nonLatin: string;
        };
        errors: {
            nonLatin: string;
            invalidChars: string;
            noNumber: string;
            vowelPlacement: string;
            tooLong: string;
            adjacentSkippedVowels: string;
            tooManyConsonants: string;
            noPositionForNumber: string;
        };
    };
    multiLineInput: {
        multipleLink: string;
    };
    multiLineInputModal: {
        title: string;
        placeholder: string;
        help: string;
        ok: string;
        cancel: string;
    };
    resultsSection: {
        title: string;
        removedVowels: string;
        invalidInput: string;
    };
    savedPlates: {
        title: string;
        empty: string;
        clear: string;
        copy: string;
        copyAll: string;
        remove: string;
        input: string;
        plate: string;
        date: string;
        vowels: string;
        status: string;
    };
    plateDisplay: {
        copyToClipboard: string;
        savePlate: string;
        changeInInputError: string;
        changeInInputTip: string;
    };
}

// Type-safe translation function
export type TranslationFunction = (key: keyof Messages) => string;
export type TranslationStore = Readable<TranslationFunction>;

// Re-export necessary items from svelte-i18n
export { _, locale };

// Re-export types from l10n
export type { LocaleCode };
