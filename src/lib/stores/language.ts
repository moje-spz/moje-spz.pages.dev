// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { writable, type Writable } from 'svelte/store';
import { STORAGE_KEY, SUPPORTED_LANGUAGES, defaultLocale, type LanguagePreference } from '$lib/config/l10n';

// Interface for our language store
interface LanguageStore extends Writable<LanguagePreference> {
    init: () => void;
}

function createLanguageStore(): LanguageStore {
    const { subscribe, set, update } = writable<LanguagePreference>('auto');

    return {
        subscribe,
        set,
        update,
        init(): void {
            const storedLanguage = typeof localStorage !== 'undefined'
                ? localStorage.getItem(STORAGE_KEY)
                : null;

            if (storedLanguage) {
                const lang = storedLanguage as LanguagePreference;
                if (lang === 'auto' || SUPPORTED_LANGUAGES.includes(lang)) {
                    set(lang);
                } else {
                    set(defaultLocale);
                }
            }

            // Subscribe to changes and save to localStorage
            subscribe((value) => {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(STORAGE_KEY, value);
                }
            });
        }
    };
}

export const language = createLanguageStore();
