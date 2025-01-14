// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { writable } from 'svelte/store';
import type { Language, LanguageStore } from '../types';
import { VALID_CHARS } from '../constants';

export type Theme = 'light' | 'dark' | 'auto';

const isBrowser = typeof window !== 'undefined';

export interface ThemeStore {
    subscribe: (callback: (value: Theme) => void) => () => void;
    set: (value: Theme) => void;
}

export function createThemeStore(): ThemeStore {
    // Get initial value from localStorage if available
    const initialValue = isBrowser ?
        (localStorage.getItem('theme') as Theme || 'auto') :
        'auto';

    const { subscribe, set } = writable<Theme>(initialValue);

    function applyThemeToDOM(theme: 'light' | 'dark'): void {
        if (!isBrowser) return;

        // For Tailwind dark mode, we only need to toggle the 'dark' class
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    }

    function setTheme(newTheme: Theme): void {
        if (!isBrowser) {
            set(newTheme);
            return;
        }

        // Update localStorage with the theme preference
        localStorage.setItem('theme', newTheme);

        // Apply theme based on preference
        if (newTheme === 'light' || newTheme === 'dark') {
            applyThemeToDOM(newTheme);
            set(newTheme);  // Update store with manual theme
        } else {
            // For auto theme, check system preference
            const isDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
            const effectiveTheme = isDark ? 'dark' : 'light';
            applyThemeToDOM(effectiveTheme);
            set('auto');  // Keep 'auto' in the store
        }
    }

    if (isBrowser) {
        // Set up system theme change listener
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (_e: MediaQueryListEvent): void => {
            const currentTheme = localStorage.getItem('theme') as Theme || 'auto';
            if (currentTheme === 'auto') {
                const effectiveTheme = _e.matches ? 'dark' : 'light';
                applyThemeToDOM(effectiveTheme);
                set('auto');  // Keep 'auto' in the store
            }
        });

        // Apply initial theme
        setTheme(initialValue);
    }

    return {
        subscribe,
        set: setTheme
    };
}

export function createLanguageStore(): LanguageStore {
    // Get initial value from localStorage if available
    const initialValue = isBrowser ?
        (localStorage.getItem('language') as Language || 'cs') :
        'cs';

    const { subscribe, set } = writable<Language>(initialValue);

    return {
        subscribe,
        set: (value: Language): void => {
            if (isBrowser) {
                localStorage.setItem('language', value);
            }
            set(value);
        }
    };
}

// Create and export singleton instances
export const theme = createThemeStore();
export const language = createLanguageStore();

interface DefaultPaddingCharStore {
    subscribe: (callback: (value: string) => void) => () => void;
    set: (value: string | null) => void;
}

// Create a store for default padding character
export function createDefaultPaddingCharStore(): DefaultPaddingCharStore {
    const isBrowser = typeof window !== 'undefined';
    const initialValue = isBrowser ? localStorage.getItem('defaultPaddingChar') : null;

    const { subscribe, set } = writable<string>(initialValue || VALID_CHARS[0]);

    return {
        subscribe,
        set: (value: string | null): void => {
            const effectiveValue = value || VALID_CHARS[0];
            if (isBrowser) {
                if (value) {
                    localStorage.setItem('defaultPaddingChar', value);
                } else {
                    localStorage.removeItem('defaultPaddingChar');
                }
            }
            set(effectiveValue);
        }
    };
}

export const defaultPaddingChar = createDefaultPaddingCharStore();

// Derived values
export function getCurrentTheme(preference: Theme): 'light' | 'dark' {
    if (!isBrowser) return 'light';
    if (preference === 'light' || preference === 'dark') {
        return preference;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getCurrentLanguage(preference: Language): Language {
    return preference;
}
