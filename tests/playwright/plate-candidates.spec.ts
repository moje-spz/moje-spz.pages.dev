// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { test, waitForPageReady } from './fixtures';
import { expect } from '@playwright/test';

test.describe('PlateCandidates', () => {
    test('should hide dropdown when clicking outside', async ({ loadedPage }) => {
        // Enter a plate number to get candidates
        const input = loadedPage.getByTestId('single-line-input');
        await input.fill('ABC12345');

        // Wait for candidates to appear
        const candidateInput = loadedPage.getByTestId('candidate-input').first();
        await expect(candidateInput).toBeVisible();

        // Click the input to show dropdown
        await candidateInput.click();
        const dropdown = loadedPage.getByTestId('character-dropdown');
        await expect(dropdown).toBeVisible();

        // Click outside to close dropdown
        await loadedPage.mouse.click(10, 10);
        const dropdown2 = loadedPage.getByTestId('character-dropdown');
        await expect(dropdown2).not.toBeVisible();
    });

    test('should handle arrow color states', async ({ loadedPage }) => {
        // Enter a plate number to get candidates
        const input = loadedPage.getByTestId('single-line-input');
        await input.fill('ABC12345');

        // Get the first candidate input and its arrow
        const candidateInput = loadedPage.getByTestId('candidate-input').first();
        await expect(candidateInput).toBeVisible();

        // Initial state should be gray
        const arrow = loadedPage.locator('button.text-gray-500').first();
        await expect(arrow).toBeVisible();

        // Focus should turn arrow green
        await candidateInput.click();
        const greenArrow = loadedPage.locator('button.text-green-500').first();
        await expect(greenArrow).toBeVisible();

        // Invalid input should turn arrow red
        await candidateInput.fill('X');
        const redArrow = loadedPage.locator('button.text-red-500').first();
        await expect(redArrow).toBeVisible();

        // Click outside to restore gray state
        await loadedPage.mouse.click(0, 0);
        const grayArrow = loadedPage.locator('button.text-gray-500').first();
        await expect(grayArrow).toBeVisible();
    });

    test('should handle dropdown layout', async ({ loadedPage }) => {
        // Enter a plate number to get candidates
        const input = loadedPage.getByTestId('single-line-input');
        await input.fill('ABC12345');

        // Get the first candidate input
        const candidateInput = loadedPage.getByTestId('candidate-input').first();
        await expect(candidateInput).toBeVisible();

        // Click to show dropdown
        await candidateInput.click();
        const dropdown = loadedPage.getByTestId('character-dropdown');
        await expect(dropdown).toBeVisible();

        // Check dropdown layout
        const buttons = dropdown.locator('button.plate-char');
        await expect(buttons).toHaveCount(await buttons.count());

        // Check for flex container with gap
        const container = dropdown.locator('.flex.gap-2');
        await expect(container).toBeVisible();
    });

    test('should keep dropdown open when input has focus', async ({ loadedPage }) => {
        // Enter a plate number to get candidates
        const input = loadedPage.getByTestId('single-line-input');
        await input.fill('ABC12345');

        // Get the first candidate input
        const candidateInput = loadedPage.getByTestId('candidate-input').first();
        await expect(candidateInput).toBeVisible();

        // Click to show dropdown
        await candidateInput.click();
        const dropdown = loadedPage.getByTestId('character-dropdown');
        await expect(dropdown).toBeVisible();

        // Verify dropdown stays open while input has focus
        await expect(dropdown).toBeVisible();
        await expect(candidateInput).toBeFocused();
    });

    test('should close dropdown after valid input', async ({ loadedPage }) => {
        // Enter a plate number to get candidates
        const input = loadedPage.getByTestId('single-line-input');
        await input.fill('ABC12345');

        // Get the first candidate input
        const candidateInput = loadedPage.getByTestId('candidate-input').first();
        await expect(candidateInput).toBeVisible();

        // Click to show dropdown
        await candidateInput.click();
        const dropdown = loadedPage.getByTestId('character-dropdown');
        await expect(dropdown).toBeVisible();

        // Enter valid input
        await candidateInput.fill('A');

        // Verify dropdown is closed and input is not focused
        await expect(dropdown).not.toBeVisible();
        await expect(candidateInput).not.toBeFocused();
    });

    test('should handle layout with limited viewport space', async ({ loadedPage }) => {
        // Set a small viewport height
        await loadedPage.setViewportSize({ width: 485, height: 500 });
        await loadedPage.goto('/', { timeout: 10000 });
        await waitForPageReady(loadedPage);

        // Enter a plate number to get candidates
        const input = loadedPage.getByTestId('single-line-input');
        await input.fill('4BC1234');

        // Get the last candidate input
        const candidateInputs = loadedPage.getByTestId('candidate-input');
        const lastInput = candidateInputs.last();
        await expect(lastInput).toBeVisible();

        // Click on the last candidate, which is the padding char
        await lastInput.click();
        const dropdown = loadedPage.getByTestId('character-dropdown');
        await expect(dropdown).toBeVisible();

        // Verify dropdown is visible and within viewport
        const dropdownBox = await dropdown.boundingBox();
        const viewportHeight = 500;
        expect(dropdownBox?.y).toBeLessThan(viewportHeight);
        expect(dropdownBox?.y! + dropdownBox?.height!).toBeLessThan(viewportHeight);
    });
});
