// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { test, waitForPageReady } from './fixtures';
import { expect } from '@playwright/test';

test.describe('Plate Too Long Input', () => {
    test('should show error for too many consonants', async ({ loadedPage }) => {
        await waitForPageReady(loadedPage);

        // Enter a string which has some vowels but too many consonants
        const input = loadedPage.getByTestId('single-line-input');
        await input.fill('ďŕĺmňĺňáj');

        // Verify error message is displayed
        const errorMessage = loadedPage.getByTestId('error-message');
        await expect(errorMessage).toBeVisible();

        // Verify vowel indicator is not displayed
        const vowelIndicator = loadedPage.getByTestId('vowel-indicator');
        await expect(vowelIndicator).not.toBeVisible();
    });
});
