// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createThemeStore, getCurrentTheme } from '../../../src/lib/stores/preferences';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn()
};

// Mock document.documentElement
const documentElementMock = {
    classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false)
    }
};

// Helper function to wait for store updates
async function waitForStoreReady<T>(store: { subscribe: (callback: (value: T) => void) => () => void }): Promise<T> {
    return new Promise((resolve) => {
        let unsubscribe: () => void;
        unsubscribe = store.subscribe((value: T) => {
            if (unsubscribe) {
                unsubscribe();
            }
            resolve(value);
        });
    });
}

describe('preferences', () => {
    beforeEach(() => {
        // Reset all mocks
        vi.resetAllMocks();

        // Mock window object with matchMedia function
        vi.stubGlobal('window', {
            matchMedia: (query: string) => ({
                matches: query === '(prefers-color-scheme: dark)' ? false : true,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })
        });

        // Setup localStorage mock
        vi.stubGlobal('localStorage', localStorageMock);

        // Setup document mock
        vi.stubGlobal('document', { documentElement: documentElementMock });
    });

    afterEach((): void => {
        vi.clearAllMocks();
    });

    describe('createThemeStore', () => {
        it('should initialize with default theme', async () => {
            localStorageMock.getItem.mockReturnValue(null);
            const store = createThemeStore();
            const theme = await waitForStoreReady(store);
            expect(theme).toBe('auto');
            expect(store.subscribe).toBeDefined();
        });

        it('should persist theme preference', async () => {
            const store = createThemeStore();
            store.set('dark');
            const theme = await waitForStoreReady(store);
            expect(theme).toBe('dark');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
        });
    });

    describe('getCurrentTheme', () => {
        it('should return light theme when preference is light', (): void => {
            expect(getCurrentTheme('light')).toBe('light');
        });

        it('should return dark theme when preference is dark', (): void => {
            expect(getCurrentTheme('dark')).toBe('dark');
        });

        it('should return system preference when preference is auto', async () => {
            // Mock matchMedia to return dark preference
            vi.stubGlobal('window', {
                matchMedia: (query: string) => ({
                    matches: query === '(prefers-color-scheme: dark)' ? true : false,
                    media: query,
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                })
            });
            expect(getCurrentTheme('auto')).toBe('dark');

            // Mock matchMedia to return light preference
            vi.stubGlobal('window', {
                matchMedia: (query: string) => ({
                    matches: query === '(prefers-color-scheme: dark)' ? false : true,
                    media: query,
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                })
            });
            expect(getCurrentTheme('auto')).toBe('light');
        });
    });
});
