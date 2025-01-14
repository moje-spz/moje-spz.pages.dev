// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { test } from './fixtures';
import { expect, devices } from '@playwright/test';

test.describe('PlateDisplay Mobile', () => {
    test('should show dropdown on editable character touch', async ({ loadedMobilePage: page }) => {
        // Enter a plate number to get candidates
        const input = page.getByTestId('single-line-input');
        await input.fill('ABC1234');

        // Wait for candidates to appear and touch the last one which is the padding char
        const candidateButtons = page.getByTestId('candidate-button');
        const lastButton = candidateButtons.last();
        await expect(lastButton).toBeVisible();
        await lastButton.tap();

        // Verify dropdown appears
        const dropdown = page.getByTestId('character-dropdown');
        await expect(dropdown).toBeVisible();
    });

    test('should show tooltip on non-editable character touch', async ({ loadedMobilePage: page }) => {
        // Enter a plate number to get candidates
        const input = page.getByTestId('single-line-input');
        await input.fill('RBC12345');

        // Wait for plate display and touch a non-editable character
        const candidateButtons = page.getByTestId('candidate-button');
        const firstButton = candidateButtons.first();
        await expect(firstButton).toBeVisible();
        await firstButton.tap();

        // Verify tooltip appears
        const tooltip = page.getByTestId('plate-tooltip');
        await expect(tooltip).toBeVisible();
    });

    test('should change button border and arrow color on touch', async ({ loadedMobilePage: page }) => {
        // Enter a plate number to get candidates
        const input = page.getByTestId('single-line-input');
        await input.fill('ABC12345');

        // Wait for candidates and touch the first one
        const candidateButtons = page.getByTestId('candidate-button');
        const firstButton = candidateButtons.first();
        await expect(firstButton).toBeVisible();
        await firstButton.tap();

        // Verify dropdown appears
        const dropdown = page.getByTestId('character-dropdown');
        await expect(dropdown).toBeVisible();

        // Verify button has green border
        const button = page.getByTestId('candidate-button').first();
        await expect(button).toHaveClass(/border-green-500/);

        // Verify arrow has green color
        const arrow = page.locator('button.text-green-500').first();
        await expect(arrow).toBeVisible();
    });

    test('should handle layout with limited viewport space', async ({ loadedMobilePage: page }) => {
        // Enter a plate number to get candidates
        const input = page.getByTestId('single-line-input');
        await input.fill('4BC1234');

        // Get the last candidate input
        const candidateButtons = page.getByTestId('candidate-button');
        const lastButton = candidateButtons.last();
        await expect(lastButton).toBeVisible();

        // Click on the last candidate, which is the padding char
        await lastButton.tap();
        const dropdown = page.getByTestId('character-dropdown');
        await expect(dropdown).toBeVisible();

        // Verify dropdown is visible and within viewport
        const dropdownBox = await dropdown.boundingBox();
        const viewportHeight = devices['Pixel 5'].viewport.height;
        expect(dropdownBox?.y).toBeLessThan(viewportHeight);
        expect(dropdownBox?.y! + dropdownBox?.height!).toBeLessThan(viewportHeight);
    });
});
