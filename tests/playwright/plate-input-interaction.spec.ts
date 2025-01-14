import { test, waitForPageReady } from './fixtures';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test('should handle input position clicks in first part', async ({ loadedPage }) => {
    await waitForPageReady(loadedPage);

    // Enter initial input "A"
    const initialInput = loadedPage.getByTestId('single-line-input');
    await initialInput.fill('A');

    // Store all displayed input positions
    const candidateInputs = loadedPage.getByTestId('candidate-input');

    // Wait for all inputs to be visible and have values
    await expect(async () => {
        const inputs = await candidateInputs.all();
        const values = await Promise.all(inputs.map(input => input.inputValue()));
        expect(values.every(value => value.trim() !== '')).toBeTruthy();
    }).toPass();

    // Get all input values
    const inputs = await candidateInputs.all();
    const initialInputValues = await Promise.all(
        inputs.map(input => input.inputValue())
    );

    // Click second position and enter "X"
    await inputs[1].click();
    await inputs[1].fill('X');

    // Check if focus is lost
    await expect(inputs[1]).not.toBeFocused();

    // Verify the value is "X"
    await expect(inputs[1]).toHaveValue('X');

    // Verify other inputs maintain their values
    const currentInputs = await candidateInputs.all();
    for (let i = 0; i < currentInputs.length; i++) {
        if (i !== 1) { // Skip the second position we just modified
            await expect(currentInputs[i]).toHaveValue(initialInputValues[i]);
        }
    }
});

test('should handle input position clicks in second part', async ({ loadedPage }) => {
    await waitForPageReady(loadedPage);

    // Enter initial input "A"
    const initialInput = loadedPage.getByTestId('single-line-input');
    await initialInput.fill('A');

    // Store all displayed input positions
    const candidateInputs = loadedPage.getByTestId('candidate-input');

    // Wait for all inputs to be visible and have values
    await expect(async () => {
        const inputs = await candidateInputs.all();
        const values = await Promise.all(inputs.map(input => input.inputValue()));
        expect(values.every(value => value.trim() !== '')).toBeTruthy();
    }).toPass();

    // Get all input values
    const inputs = await candidateInputs.all();
    const initialInputValues = await Promise.all(
        inputs.map(input => input.inputValue())
    );

    // Click fourth position and enter "Y"
    await inputs[3].click();
    await inputs[3].fill('Y');

    // Check if focus is lost
    await expect(inputs[3]).not.toBeFocused();

    // Verify the value is "Y"
    await expect(inputs[3]).toHaveValue('Y');

    // Verify other inputs maintain their values
    const finalInputs = await candidateInputs.all();
    for (let i = 0; i < finalInputs.length; i++) {
        if (i === 3) {
            await expect(finalInputs[i]).toHaveValue('Y');
        } else {
            await expect(finalInputs[i]).toHaveValue(initialInputValues[i]);
        }
    }
});

async function testInvalidCharacterValidation(
    loadedPage: Page,
    inputIndex: number,
    errorMessage: string
): Promise<void> {
    await waitForPageReady(loadedPage);

    // Enter initial input "aaaa"
    const initialInput = loadedPage.getByTestId('single-line-input');
    await initialInput.fill('aaaa');

    // Store all displayed input positions
    const candidateInputs = loadedPage.getByTestId('candidate-input');

    // Wait for all inputs to be visible and have values
    await expect(async () => {
        const inputs = await candidateInputs.all();
        const values = await Promise.all(inputs.map(input => input.inputValue()));
        expect(values.every(value => value.trim() !== '')).toBeTruthy();
    }).toPass();

    // Get target input and enter invalid value
    const inputs = await candidateInputs.all();
    await inputs[inputIndex].click();
    await inputs[inputIndex].fill('X');

    // Verify the invalid value is shown
    await expect(inputs[inputIndex], 'Input should show entered value: "X"').toHaveValue('X');

    const tailwindRedColors = [
        'rgb(239, 68, 68)',  // bg-red-500
        'rgb(220, 38, 38)',  // bg-red-600
        'rgb(127, 29, 29)',  // bg-red-900
    ];

    // Verify the input has red border
    const borderColor = await inputs[inputIndex].evaluate((el) => getComputedStyle(el).borderColor);
    expect(tailwindRedColors, 'Input border is not red').toContain(borderColor);

    // Verify the text color is red
    const textColor = await inputs[inputIndex].evaluate((el) => getComputedStyle(el).color);
    expect(tailwindRedColors, 'Input text is not red').toContain(textColor);

    // Verify the arrow below is red
    const arrowButtons = loadedPage.getByTestId('arrow-down');
    const buttonsCount = await arrowButtons.count();
    expect(buttonsCount, 'No arrow-down buttons found').toBeGreaterThan(0);
    expect(buttonsCount, `${errorMessage} arrow button does not exist`).toBeGreaterThan(inputIndex);

    const nthButton = arrowButtons.nth(inputIndex);
    await expect(nthButton).toBeVisible();

    const svgPath = nthButton.locator('svg path');
    const svgPathCount = await svgPath.count();
    expect(svgPathCount, `SVG path not found in the ${errorMessage} arrow button`).toBe(1);

    // Check both fill and color of the SVG path
    const arrowSvgFillColor = await svgPath.evaluate((el) => getComputedStyle(el).fill);
    expect(tailwindRedColors, 'SVG path fill color is not red').toContain(arrowSvgFillColor);
    const arrowSvgColor = await svgPath.evaluate((el) => getComputedStyle(el).color);
    expect(tailwindRedColors, 'SVG path color is not red').toContain(arrowSvgColor);

    // Click away from the input (on a specific element)
    await loadedPage.locator('body').click();

    // Verify focus is lost
    await expect(inputs[inputIndex], 'Input should lose focus after clicking away').not.toBeFocused();

    // Verify the value is restored to 'A'
    await expect(inputs[inputIndex], 'Input value should be restored to "A"').toHaveValue('A');

    // Verify colors are no longer red
    const finalBorderColor = await inputs[inputIndex].evaluate((el) => getComputedStyle(el).borderColor);
    expect(tailwindRedColors, 'Input border should not be red after clicking away').not.toContain(finalBorderColor);

    const finalTextColor = await inputs[inputIndex].evaluate((el) => getComputedStyle(el).color);
    expect(tailwindRedColors, 'Input text should not be red after clicking away').not.toContain(finalTextColor);

    const finalArrowSvgColor = await arrowButtons.nth(inputIndex).locator('svg path').evaluate((el) => getComputedStyle(el).fill);
    expect(tailwindRedColors, 'Arrow SVG should not be red after clicking away').not.toContain(finalArrowSvgColor);
}

test('should show validation error and restore value when entering invalid character in first part', async ({ loadedPage }) => {
    await testInvalidCharacterValidation(loadedPage, 0, 'first');
});

test('should show validation error and restore value when entering invalid character in second part', async ({ loadedPage }) => {
    await testInvalidCharacterValidation(loadedPage, 3, 'fourth');
});
