// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { writable } from 'svelte/store';

type Theme = 'light' | 'dark' | 'auto';
const STORAGE_KEY = 'theme_preference';

interface ThemeStore {
  subscribe: (run: (value: Theme) => void) => () => void;
  set: (theme: Theme) => void;
  toggle: () => void;
}

function createThemeStore(): ThemeStore {
  // Load initial state from localStorage
  const storedTheme = typeof localStorage !== 'undefined'
    ? (localStorage.getItem(STORAGE_KEY) as Theme || 'auto')
    : 'auto';

  const { subscribe, set } = writable<Theme>(storedTheme);

  // Set up system theme detection
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      applyTheme(storedTheme);
    });
  }

  function applyTheme(theme: Theme): void {
    const isDark = theme === 'dark' || (
      theme === 'auto' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  return {
    subscribe,
    set: (theme: Theme): void => {
      set(theme);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, theme);
      }
      applyTheme(theme);
    },
    toggle: (): void => {
      let currentTheme: Theme = 'light';
      subscribe(theme => currentTheme = theme)();

      const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newTheme);
      }
      set(newTheme);
      applyTheme(newTheme);
    }
  };
}

export const theme = createThemeStore();
