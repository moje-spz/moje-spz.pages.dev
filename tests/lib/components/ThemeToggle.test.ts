// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { vi } from 'vitest';

// Mock isLocaleLoaded store
const mockIsLocaleLoaded = vi.hoisted(() => vi.fn());
vi.mock('$lib/i18n', () => ({
    isLocaleLoaded: {
        subscribe: (fn: (value: boolean) => void): (() => void) => {
            fn(mockIsLocaleLoaded());
            return () => { };
        }
    },
    _: {
        subscribe: (fn: (value: (key: string) => string) => void): (() => void) => {
            fn((key: string): string => key);
            return () => { };
        }
    }
}));

import { render, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';
import { theme } from '$lib/stores/preferences';

describe('ThemeToggle', () => {
    beforeEach(async (): Promise<void> => {
        vi.resetAllMocks();
        localStorage.clear();
        document.documentElement.classList.remove('dark');
        theme.set('auto');
        mockIsLocaleLoaded.mockReturnValue(true);
    });

    it('should render theme select with correct options', (): void => {
        const { getByTestId } = render(ThemeToggle);
        const select = getByTestId('theme-toggle');
        const options = select.getElementsByTagName('option');

        expect(options).toHaveLength(3);
        expect(options[0].value).toBe('auto');
        expect(options[1].value).toBe('light');
        expect(options[2].value).toBe('dark');
    });

    it('should update theme store when selection changes', async (): Promise<void> => {
        const { getByTestId } = render(ThemeToggle);
        const select = getByTestId('theme-toggle');

        await fireEvent.change(select, { target: { value: 'dark' } });
        expect(get(theme)).toBe('dark');

        await fireEvent.change(select, { target: { value: 'light' } });
        expect(get(theme)).toBe('light');

        await fireEvent.change(select, { target: { value: 'auto' } });
        expect(get(theme)).toBe('auto');
    });

    it('should reflect current theme store value', () => {
        theme.set('dark');
        const { getByTestId } = render(ThemeToggle);
        const select = getByTestId('theme-toggle') as HTMLSelectElement;
        expect(select.value).toBe('dark');
    });

    it('should handle theme change', async (): Promise<void> => {
        // Implementation of the test
    });
});
