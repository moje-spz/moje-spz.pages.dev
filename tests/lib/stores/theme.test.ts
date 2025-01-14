// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createThemeStore, type Theme } from '../../../src/lib/stores/preferences';

// Mock document.documentElement
const documentElementMock = {
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn().mockReturnValue(false)
  }
};

describe('theme store', () => {
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach((): void => {
    mediaQueryListeners = [];

    // Mock window object with matchMedia
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : true,
        addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void): void => {
          mediaQueryListeners.push(listener);
        },
        removeEventListener: (_: string, listener: (e: MediaQueryListEvent) => void): void => {
          mediaQueryListeners = mediaQueryListeners.filter(l => l !== listener);
        }
      }))
    });

    // Setup document mock
    vi.stubGlobal('document', { documentElement: documentElementMock });

    localStorage.clear();
  });

  afterEach((): void => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('should initialize with auto theme and follow system preference', async (): Promise<void> => {
    const store = createThemeStore();
    let currentTheme: Theme;
    store.subscribe((value: Theme) => currentTheme = value);

    documentElementMock.classList.contains.mockReturnValue(false);
    await vi.waitFor(() => {
      expect(currentTheme).toBe('auto');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    // Update matchMedia mock to return dark preference
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? true : false,
        addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void): void => {
          mediaQueryListeners.push(listener);
        },
        removeEventListener: (_: string, listener: (e: MediaQueryListEvent) => void): void => {
          mediaQueryListeners = mediaQueryListeners.filter(l => l !== listener);
        }
      }))
    });

    // Trigger the change event
    mediaQueryListeners.forEach(listener => listener({ matches: true } as MediaQueryListEvent));

    documentElementMock.classList.contains.mockReturnValue(true);
    await vi.waitFor(() => {
      expect(currentTheme).toBe('auto');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('should persist theme preference', async (): Promise<void> => {
    const store = createThemeStore();
    let currentTheme: Theme;
    store.subscribe((value: Theme) => currentTheme = value);

    // Set theme to dark
    store.set('dark');
    await vi.waitFor(() => {
      expect(currentTheme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    // Create new store instance
    const newStore = createThemeStore();
    let newTheme: Theme;
    newStore.subscribe((value: Theme) => newTheme = value);

    await vi.waitFor(() => {
      expect(newTheme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('should handle invalid theme value', async (): Promise<void> => {
    localStorage.setItem('theme', 'invalid');
    documentElementMock.classList.contains.mockReturnValue(false);
    const store = createThemeStore();
    let currentTheme: Theme;
    store.subscribe((value: Theme) => currentTheme = value);

    await vi.waitFor(() => {
      expect(currentTheme).toBe('auto');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  it('should update theme when manually set', async (): Promise<void> => {
    const store = createThemeStore();
    let currentTheme: Theme;
    const unsubscribe = store.subscribe((value: Theme) => currentTheme = value);

    try {
      // Set initial state
      documentElementMock.classList.contains.mockReturnValue(false);
      await vi.waitFor(() => {
        expect(currentTheme).toBe('auto');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });

      // Set theme to dark
      documentElementMock.classList.contains.mockImplementation((className) => className === 'dark');
      store.set('dark');
      await vi.waitFor(() => {
        expect(currentTheme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Set theme to light
      documentElementMock.classList.contains.mockImplementation((className) => className === 'light');
      store.set('light');
      await vi.waitFor(() => {
        expect(currentTheme).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    } finally {
      unsubscribe();
    }
  });
});
