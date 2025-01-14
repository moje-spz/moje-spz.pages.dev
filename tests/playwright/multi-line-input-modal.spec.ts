// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { test, waitForPageReady } from './fixtures';
import { expect } from '@playwright/test';

test.describe('MultiLineInputModal', () => {
    test('should handle modal visibility and focus', async ({ loadedPage }) => {
        // Click the button to open modal
        const button = loadedPage.getByTestId('multiple-input-button');
        await button.click();

        // Modal should be visible
        const modal = loadedPage.getByTestId('modal-overlay');
        await expect(modal).toBeVisible();

        // Textarea should be focused
        const textarea = loadedPage.getByTestId('multiple-input-textarea');
        await expect(textarea).toBeFocused();

        // Click outside to close
        await loadedPage.mouse.click(0, 0);
        await expect(modal).not.toBeVisible();
    });

    test('should handle form submission', async ({ loadedPage }) => {
        await loadedPage.goto('/');
        await waitForPageReady(loadedPage);

        // Open modal
        const button = loadedPage.getByTestId('multiple-input-button');
        await button.click();

        // Enter plate numbers
        const textarea = loadedPage.getByTestId('multiple-input-textarea');
        await textarea.fill('ABC123AA\nDEF456AA');

        // Submit form
        const submitButton = loadedPage.getByRole('button', { name: 'OK' });
        await submitButton.click();

        // Modal should close
        const modal = loadedPage.getByTestId('modal-overlay');
        await expect(modal).not.toBeVisible();

        // Get the plate section container
        const plateSection = loadedPage.locator('#content-container [data-testid="plate-section"]');
        await expect(plateSection).toHaveCount(2);

        // Verify single-line inputs match the entered values
        const singleLineInputs = plateSection.getByTestId('single-line-input');
        await expect(singleLineInputs).toHaveCount(2);
        await expect(singleLineInputs.nth(0)).toHaveValue('ABC123AA');
        await expect(singleLineInputs.nth(1)).toHaveValue('DEF456AA');

        // Verify candidate inputs for first plate (ABC123)
        const firstPlateCandidates = plateSection.nth(0).locator(`[data-testid="candidate-input"]`);
        await expect(firstPlateCandidates).toHaveCount(8);
        await expect(firstPlateCandidates.nth(0)).toHaveValue('A');
        await expect(firstPlateCandidates.nth(1)).toHaveValue('B');
        await expect(firstPlateCandidates.nth(2)).toHaveValue('C');
        await expect(firstPlateCandidates.nth(3)).toHaveValue('1');
        await expect(firstPlateCandidates.nth(4)).toHaveValue('2');
        await expect(firstPlateCandidates.nth(5)).toHaveValue('3');
        await expect(firstPlateCandidates.nth(6)).toHaveValue('A');
        await expect(firstPlateCandidates.nth(7)).toHaveValue('A');

        // Verify candidate inputs for second plate (DEF456)
        const secondPlateCandidates = plateSection.nth(1).locator(`[data-testid="candidate-input"]`);
        await expect(secondPlateCandidates).toHaveCount(8);
        await expect(secondPlateCandidates.nth(0)).toHaveValue('D');
        await expect(secondPlateCandidates.nth(1)).toHaveValue('E');
        await expect(secondPlateCandidates.nth(2)).toHaveValue('F');
        await expect(secondPlateCandidates.nth(3)).toHaveValue('4');
        await expect(secondPlateCandidates.nth(4)).toHaveValue('5');
        await expect(secondPlateCandidates.nth(5)).toHaveValue('6');
        await expect(secondPlateCandidates.nth(6)).toHaveValue('A');
        await expect(secondPlateCandidates.nth(7)).toHaveValue('A');
    });

    test('should respect maxLines limit', async ({ loadedPage }) => {
        await loadedPage.goto('/');
        await waitForPageReady(loadedPage);

        // Open modal
        const button = loadedPage.getByTestId('multiple-input-button');
        await button.click();

        // Enter more than max lines
        const textarea = loadedPage.getByTestId('multiple-input-textarea');
        await textarea.fill('AAAAAAA1\nAAAAAAA2\nAAAAAAA3\nAAAAAAA4\nAAAAAAA5\nAAAAAAA6\nAAAAAAA7\nAAAAAAA8\nAAAAAAA9\nAAAAAA10\nAAAAAA11');

        // Submit form
        const submitButton = loadedPage.getByRole('button', { name: 'OK' });
        await submitButton.click();

        // Get the plate section container
        const plateSection = loadedPage.locator('#content-container [data-testid="plate-section"]');
        await expect(plateSection).toHaveCount(10);
    });

    test('should maintain scroll lock', async ({ loadedPage }) => {
        await loadedPage.goto('/');
        await waitForPageReady(loadedPage);

        // Add enough content to make page scrollable
        await loadedPage.evaluate(() => {
            const div = document.createElement('div');
            div.style.height = '200vh';
            document.body.appendChild(div);
        });

        // Open modal
        const button = loadedPage.getByTestId('multiple-input-button');
        await button.click();

        // Try to scroll
        await loadedPage.mouse.wheel(0, 100);

        // Get scroll position
        const scrollY = await loadedPage.evaluate(() => window.scrollY);
        expect(scrollY).toBe(0);
    });
});
