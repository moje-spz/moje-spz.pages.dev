// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { test, waitForPageReady } from './fixtures';
import { expect } from '@playwright/test';

test.describe('Save Plate', () => {
    test('should handle saving plate', async ({ loadedPage }) => {
        // Set a desktop viewport size
        await loadedPage.setViewportSize({ width: 1280, height: 720 });
        await waitForPageReady(loadedPage);

        // Enter a plate number
        const input = loadedPage.getByTestId('single-line-input');
        await input.fill('a');

        // Wait for all candidate inputs to be populated
        const candidateInputs = loadedPage.getByTestId('candidate-input');
        await expect(async () => {
            const inputs = await candidateInputs.all();
            const values = await Promise.all(inputs.map(input => input.inputValue()));
            expect(values.every(value => value.trim() !== '')).toBeTruthy();
        }).toPass();

        // Wait for save button to be visible and enabled
        const saveButton = loadedPage.getByTestId('save-plate-button').last();
        await expect(saveButton).toBeVisible();
        await expect(saveButton).toBeEnabled();
        const initialTitle = await saveButton.getAttribute('title');
        await saveButton.click();

        // Wait for saved plate entry to appear
        await loadedPage.waitForSelector('[data-testid="saved-plate-entry"]');
        const savedPlateEntry = loadedPage.getByTestId('saved-plate-entry').first();
        await expect(savedPlateEntry).toBeVisible();

        // Click save button again
        await saveButton.click();

        // Verify no new entry is added (still only one entry)
        await expect(loadedPage.getByTestId('saved-plate-entry')).toHaveCount(1);

        // Verify the button title has changed
        const newTitle = await saveButton.getAttribute('title');
        expect(newTitle).not.toBe(initialTitle);
    });

    test('should handle plate removal', async ({ loadedPage }) => {
        await waitForPageReady(loadedPage);

        // Enter a plate number
        const input = loadedPage.getByTestId('single-line-input');
        await input.fill('a');

        // Wait for all candidate inputs to be populated
        const candidateInputs = loadedPage.getByTestId('candidate-input');
        await expect(async () => {
            const inputs = await candidateInputs.all();
            const values = await Promise.all(inputs.map(input => input.inputValue()));
            expect(values.every(value => value.trim() !== '')).toBeTruthy();
        }).toPass();

        // Save the plate
        const saveButton = loadedPage.getByTestId('save-plate-button').last();
        await expect(saveButton).toBeVisible();
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        // Wait for saved plate entry to appear
        await loadedPage.waitForSelector('[data-testid="saved-plate-entry"]');
        const savedPlateEntry = loadedPage.getByTestId('saved-plate-entry').first();
        await expect(savedPlateEntry).toBeVisible();

        // Find and click the remove button
        const removeButton = loadedPage.getByTestId('remove-button').first();
        await expect(removeButton).toBeVisible();
        await removeButton.click();

        // Verify the plate entry is removed
        await expect(loadedPage.getByTestId('saved-plate-entry')).toHaveCount(0);

        // Verify save button is back to initial state
        await expect(saveButton).toBeEnabled();
    });
});
