import { test, waitForPageReady } from './fixtures';
import { expect, type Page } from '@playwright/test';
import type { PlateData } from '../../src/lib/types';

interface PlateCharValue {
    value: string;
    isDisabled: boolean;
}

declare global {
    interface Window {
        plateData: PlateData;
    }
}

async function getPlateCharValues(page: Page, sectionIndex: number): Promise<PlateCharValue[]> {
    const inputs = await page.locator(`#plate-section-${sectionIndex} [data-testid="candidate-input"]`).all();
    const values = [];
    for (const input of inputs) {
        const value = await input.inputValue();
        const isDisabled = await input.isDisabled();
        values.push({ value, isDisabled });
    }
    return values;
}

test.describe('Multiple plate sections', () => {
    test.beforeEach(async ({ loadedPage }) => {
        await waitForPageReady(loadedPage);

        // Input "ax" in the first section
        const firstInput = loadedPage.getByTestId('single-line-input');
        await firstInput.waitFor({ state: 'visible' });
        await firstInput.click();
        await firstInput.focus();
        await firstInput.fill('ax');

        // Wait for the first plate section to be processed
        await loadedPage.waitForSelector('#plate-section-0', { state: 'visible' });
        const firstCandidateInput = loadedPage.getByTestId('candidate-input').first();
        await firstCandidateInput.waitFor({ state: 'visible' });

        // Wait for and click the add plate button
        const addButton = loadedPage.getByTestId('add-plate-button');
        await expect(addButton).toBeVisible();
        await addButton.click();

        // Input "aa" in the second section
        const secondInput = loadedPage.locator('#plate-section-1 [data-testid="single-line-input"]');
        await expect(secondInput).toBeVisible();
        await secondInput.click();
        await secondInput.fill('aa');
    });

    test('direct input changes in first section should not affect second section', async ({ page }) => {
        // Store initial values for both sections
        // First section: AXAAAAA0
        const firstSectionInitialValues = await getPlateCharValues(page, 0);
        // Second section: AAAAAA0
        const secondSectionInitialValues = await getPlateCharValues(page, 1);

        // Test 1: Change first position in first section via direct input
        const firstPlateInput = page.locator('#plate-section-0 [data-testid="candidate-input"]').first();
        await firstPlateInput.waitFor({ state: 'visible' });
        await firstPlateInput.click();
        // First section: 4XAAAAA0
        await firstPlateInput.fill('4');

        // Verify first section changed and second section hasn't
        const firstSectionAfterFirstChange = await getPlateCharValues(page, 0);
        expect(firstSectionAfterFirstChange).not.toEqual(firstSectionInitialValues);
        expect(firstSectionAfterFirstChange[0].value).toBe('4');
        expect(await getPlateCharValues(page, 1)).toEqual(secondSectionInitialValues);

        // Test 2: Change third position (padding char) in first section via direct input
        const thirdPositionInput = page.locator('#plate-section-0 [data-testid="candidate-input"]').nth(2);
        await thirdPositionInput.waitFor({ state: 'visible' });
        await thirdPositionInput.click();
        // First section: 4XBAAAA0
        await thirdPositionInput.fill('B');

        // Verify first section changed and second section hasn't
        const firstSectionAfterSecondChange = await getPlateCharValues(page, 0);
        expect(firstSectionAfterSecondChange).not.toEqual(firstSectionAfterFirstChange);
        expect(firstSectionAfterSecondChange[2].value).toBe('B');
        expect(await getPlateCharValues(page, 1)).toEqual(secondSectionInitialValues);
    });

    test('character dropdown changes in first section should not affect second section', async ({ page }) => {
        // Store initial values for both sections
        // First section: AXAAAAA0
        const firstSectionInitialValues = await getPlateCharValues(page, 0);
        // Second section: AAAAAA0
        const secondSectionInitialValues = await getPlateCharValues(page, 1);

        // Test 1: Change first position in first section via flyout menu
        const firstPlateInput = page.locator('#plate-section-0 [data-testid="candidate-input"]').first();
        await firstPlateInput.waitFor({ state: 'visible' });
        await firstPlateInput.click();
        await page.waitForSelector('[data-testid="character-dropdown"]', { state: 'visible' });

        // Verify number of alternatives for first position (should be 'A' and '4')
        const dropdownButtons = page.locator('[data-testid="character-dropdown"] button');
        const alternativesCount = await dropdownButtons.count();
        expect(alternativesCount).toBe(2);

        // Click the second alternative (4)
        const dropdownButton = dropdownButtons.nth(1);
        const dropdownValue = await dropdownButton.textContent();
        // First section: 4XAAAAA0
        await dropdownButton.click();

        // Verify first section changed and second section hasn't
        const firstSectionAfterFirstChange = await getPlateCharValues(page, 0);
        expect(firstSectionAfterFirstChange).not.toEqual(firstSectionInitialValues);
        expect(firstSectionAfterFirstChange[0].value).toBe(dropdownValue?.trim());
        expect(await getPlateCharValues(page, 1)).toEqual(secondSectionInitialValues);

        // Test 2: Change third position (padding char) in first section via dropdown
        const sixthPositionInput = page.locator('#plate-section-0 [data-testid="candidate-input"]').nth(5);

        // Try focusing directly first
        await sixthPositionInput.focus();
        await expect(sixthPositionInput).toBeFocused();

        // Then try clicking
        await sixthPositionInput.click();
        await expect(sixthPositionInput).toBeFocused();

        await page.waitForSelector('[data-testid="character-dropdown"]', { state: 'visible' });
        const sixthPosDropdownButtons = page.locator('[data-testid="character-dropdown"] button');
        const sixthPosDropdownButton = sixthPosDropdownButtons.nth(2);
        const sixthPosDropdownValue = await sixthPosDropdownButton.textContent();
        // First section: 4XBAAAA0
        await sixthPosDropdownButton.click();

        // Verify first section changed and second section hasn't
        const firstSectionAfterSecondChange = await getPlateCharValues(page, 0);
        expect(firstSectionAfterSecondChange).not.toEqual(firstSectionAfterFirstChange);
        expect(firstSectionAfterSecondChange[5].value).toBe(sixthPosDropdownValue?.trim());
        expect(await getPlateCharValues(page, 1)).toEqual(secondSectionInitialValues);
    });

    test('changes in second section should not affect first section', async ({ page }) => {
        // Store initial values for both sections
        const firstSectionInitialValues = await getPlateCharValues(page, 0);
        const secondSectionInitialValues = await getPlateCharValues(page, 1);

        // Test 1: Change first position in second section via direct input
        const firstPlateInput = page.locator('#plate-section-1 [data-testid="candidate-input"]').first();
        await firstPlateInput.waitFor({ state: 'visible' });
        await firstPlateInput.click();
        await firstPlateInput.fill('4');

        // Verify second section changed and first section hasn't
        const secondSectionAfterFirstChange = await getPlateCharValues(page, 1);
        expect(secondSectionAfterFirstChange).not.toEqual(secondSectionInitialValues);
        expect(secondSectionAfterFirstChange[0].value).toBe('4');
        expect(await getPlateCharValues(page, 0)).toEqual(firstSectionInitialValues);

        // Test 2: Change third position (padding char) in second section via direct input
        const thirdPositionInput = page.locator('#plate-section-1 [data-testid="candidate-input"]').nth(5);
        await thirdPositionInput.waitFor({ state: 'visible' });
        await thirdPositionInput.focus();
        await thirdPositionInput.fill('b');

        // Verify second section changed and first section hasn't
        const secondSectionAfterSecondChange = await getPlateCharValues(page, 1);
        expect(secondSectionAfterSecondChange).not.toEqual(secondSectionAfterFirstChange);
        expect(secondSectionAfterSecondChange[5].value).toBe('B');
        expect(await getPlateCharValues(page, 0)).toEqual(firstSectionInitialValues);

        // Test 3: Change sixth position in second section via flyout menu
        await firstPlateInput.focus();
        await page.waitForSelector('[data-testid="character-dropdown"]', { state: 'visible' });
        const dropdownButton = page.locator('[data-testid="character-dropdown"] button').first();
        const dropdownValue = await dropdownButton.textContent();
        await dropdownButton.click();

        // Verify second section changed and first section hasn't
        const secondSectionAfterThirdChange = await getPlateCharValues(page, 1);
        expect(secondSectionAfterThirdChange).not.toEqual(secondSectionAfterSecondChange);
        expect(secondSectionAfterThirdChange[0].value).toBe(dropdownValue?.trim());
        expect(await getPlateCharValues(page, 0)).toEqual(firstSectionInitialValues);

        // Test 4: Change third position (padding char) in second section via direct input again
        await thirdPositionInput.focus();
        await thirdPositionInput.fill('c');

        // Verify second section changed and first section hasn't
        const secondSectionAfterFourthChange = await getPlateCharValues(page, 1);
        expect(secondSectionAfterFourthChange).not.toEqual(secondSectionAfterThirdChange);
        expect(secondSectionAfterFourthChange[5].value).toBe('C');
        expect(await getPlateCharValues(page, 0)).toEqual(firstSectionInitialValues);
    });
});

test.describe('Dropdown menu with alternatives', () => {
    test.beforeEach(async ({ loadedPage }) => {
        await waitForPageReady(loadedPage);

        // Input "AX" in the first section
        const firstInput = loadedPage.getByTestId('single-line-input');
        await firstInput.waitFor({ state: 'visible' });
        await firstInput.click();
        await firstInput.fill('ax');

        // Wait for the first plate section to be processed
        await loadedPage.waitForSelector('#plate-section-0', { state: 'visible' });
        const firstCandidateInput = loadedPage.getByTestId('candidate-input').first();
        await firstCandidateInput.waitFor({ state: 'visible' });
    });

    test('clicking third position shows correct alternatives', async ({ loadedPage }) => {
        // Click on the third position (padding char)
        const thirdPositionInput = loadedPage.locator('#plate-section-0 [data-testid="candidate-input"]').nth(2);
        await thirdPositionInput.waitFor({ state: 'visible' });
        await thirdPositionInput.focus();

        // Verify dropdown appears
        const dropdown = loadedPage.locator('[data-testid="character-dropdown"]');
        await expect(dropdown).toBeVisible();

        // Get alternatives from the dropdown
        const dropdownButtons = loadedPage.locator('[data-testid="character-dropdown"] button');
        const alternatives = await dropdownButtons.allTextContents();

        const expectedAlternatives = [
            'A', 'B', 'C', 'D', 'E', 'F', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        ];
        expect(alternatives.map(a => a.trim())).toEqual(expectedAlternatives);

        // Verify the dropdown has the correct data attributes
        await expect(dropdown).toHaveAttribute('data-position', '2');
        await expect(dropdown).toHaveAttribute('data-section', '0');
    });

    test('clicking first A shows correct alternatives', async ({ loadedPage }) => {
        // Click on the first A (second position)
        const firstPositionInput = loadedPage.locator('#plate-section-0 [data-testid="candidate-input"]').nth(0);
        await firstPositionInput.waitFor({ state: 'visible' });
        await firstPositionInput.click();

        // Verify dropdown appears
        const dropdown = loadedPage.locator('[data-testid="character-dropdown"]');
        await expect(dropdown).toBeVisible();

        // Get alternatives from the dropdown
        const dropdownButtons = loadedPage.locator('[data-testid="character-dropdown"] button');
        const alternatives = await dropdownButtons.allTextContents();

        const expectedAlternatives = ['A', '4'];
        expect(alternatives.map(a => a.trim())).toEqual(expectedAlternatives);
    });

    test('dropdown menu disappears when clicking different position', async ({ page }) => {
        // First click on the first position
        const firstPositionInput = page.locator('#plate-section-0 [data-testid="candidate-input"]').first();
        await firstPositionInput.waitFor({ state: 'visible' });
        await firstPositionInput.click();

        // Verify first position dropdown appears
        const firstDropdown = page.locator('[data-testid="character-dropdown"]');
        await expect(firstDropdown).toBeVisible();
        await expect(firstDropdown).toHaveAttribute('data-position', '0');
        await expect(firstDropdown).toHaveAttribute('data-section', '0');

        // Click on the sixth position
        const sixthPositionInput = page.locator('#plate-section-0 [data-testid="candidate-input"]').nth(5);
        await sixthPositionInput.focus();

        // Find all dropdowns and verify only the one with correct attributes is visible
        const allDropdowns = page.locator('[data-testid="character-dropdown"]');
        const count = await allDropdowns.count();
        let visibleDropdowns = 0;

        for (let i = 0; i < count; i++) {
            const dropdown = allDropdowns.nth(i);
            if (!dropdown.isVisible()) {
                continue;
            }
            visibleDropdowns++;

            // Verify the visible dropdown has correct attributes
            await expect(dropdown).toHaveAttribute('data-position', '5');
            await expect(dropdown).toHaveAttribute('data-section', '0');
        }

        // Ensure we found exactly one visible dropdown
        expect(visibleDropdowns, `Wrong number of visible dropdowns: ${visibleDropdowns}`).toBe(1);
    });
});
