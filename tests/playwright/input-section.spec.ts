// SPDX-License-Identifier: MIT
//
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { test, waitForPageReady } from './fixtures';
import { expect } from '@playwright/test';

test.describe('Theme', () => {
    test('should initialize with auto theme and follow system preference', async ({ loadedPage }) => {
        // Start with light theme preference and set auto theme
        await loadedPage.emulateMedia({ colorScheme: 'light' });
        await loadedPage.evaluate(() => {
            localStorage.setItem('theme', 'auto');
        });

        // Reload and wait for page to be ready
        await loadedPage.goto('/');
        await waitForPageReady(loadedPage);

        // Check light theme is applied
        await expect(loadedPage.locator('html')).not.toHaveClass(/dark/);
        await expect(loadedPage.locator('html')).toHaveClass(/light/);

        // Switch to dark theme preference and wait for the change
        await loadedPage.emulateMedia({ colorScheme: 'dark' });

        // Wait for theme change and check dark theme is applied
        await expect(loadedPage.locator('html')).toHaveClass(/dark/);
        await expect(loadedPage.locator('html')).not.toHaveClass(/light/);
    });
});

test.describe('InputSection', () => {
    test('displays diacritics warning when input contains diacritical marks', async ({ loadedPage }) => {
        // Enter text without diacritics first
        const input = loadedPage.getByTestId('single-line-input');
        await expect(input).toBeVisible();
        await input.fill('a');

        // Verify no warning is displayed
        const warning = loadedPage.getByTestId('diacritics-warning');
        await expect(warning).not.toBeVisible();

        // Append text with diacritics
        await input.press('End'); // Move cursor to end
        await input.pressSequentially('á');

        // Wait for and verify the warning is displayed
        await expect(warning).toBeVisible();
    });

    test('should show correct placeholder text', async ({ loadedPage }) => {
        const input = loadedPage.getByTestId('single-line-input');
        await expect(input).toBeVisible();
        await expect(input).toHaveAttribute('placeholder', 'Text for a registration plate');
    });

    test('should update input value when typed', async ({ loadedPage }) => {
        const input = loadedPage.getByTestId('single-line-input');
        await expect(input).toBeVisible();
        await input.fill('ABC');
        await expect(input).toHaveValue('ABC');
    });

    test('should render the multi-line input button with correct text', async ({ loadedPage }) => {
        const button = loadedPage.getByTestId('multiple-input-button');
        await expect(button).toBeVisible();
        await expect(button).toHaveText('Enter multiple plates at once');
    });
});
