// Make this a module
export { };

import { init, addMessages, dictionary } from 'svelte-i18n';

// Define pkg globally as it's done in vite.config.ts
declare global {
    interface Window {
        pkg: {
            version: string;
            repository: {
                url: string;
            };
        };
    }
}

// Initialize i18n with default English messages
const messages = {
    inputSection: {
        label: 'Enter plate number',
        placeholder: 'Enter text for a plate',
    }
};

// Initialize i18n synchronously for tests
addMessages('en', messages);
init({
    fallbackLocale: 'en',
    initialLocale: 'en'
});

// Ensure the dictionary is populated
dictionary.set({ en: messages });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// @ts-expect-error - pkg is defined in vite.config.ts
globalThis.pkg = {
    version: '0.0.1',
    repository: {
        url: 'https://github.com/example/repo'
    }
};
