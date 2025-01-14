import { test, waitForPageReady } from './fixtures';
import { expect } from '@playwright/test';

test('should display valid 8-character plate correctly', async ({ loadedPage }) => {
    await waitForPageReady(loadedPage);

    const testPlate = 'ABCD1234';
    const initialInput = loadedPage.getByTestId('single-line-input');
    await initialInput.fill(testPlate);
    await expect(initialInput).toHaveValue(testPlate);

    // Verify each character of the plate is displayed
    const candidateInputs = loadedPage.getByTestId('candidate-input').all();
    const inputs = await candidateInputs;
    expect(inputs).toHaveLength(testPlate.length);

    for (let i = 0; i < inputs.length; i++) {
        await expect(inputs[i]).toBeVisible();
        await expect(inputs[i]).toHaveValue(testPlate[i]);
    }
});

test('should transform lowercase to uppercase plate number', async ({ loadedPage }) => {
    await loadedPage.waitForSelector('[data-testid="single-line-input"]');
    const initialInput = loadedPage.getByTestId('single-line-input');
    await expect(initialInput).toBeVisible();

    const lowercasePlate = 'abcd1234';
    let uppercasePlate = lowercasePlate.toUpperCase();
    await initialInput.fill(lowercasePlate);

    const candidateInputs = loadedPage.getByTestId('candidate-input').all();
    const inputs = await candidateInputs;
    expect(inputs).toHaveLength(uppercasePlate.length);

    for (let i = 0; i < inputs.length; i++) {
        await expect(inputs[i]).toBeVisible();
        await expect(inputs[i]).toHaveValue(uppercasePlate[i]);
    }
});

test('should handle incomplete plate number input', async ({ loadedPage }) => {
    await loadedPage.waitForSelector('[data-testid="single-line-input"]');
    const initialInput = loadedPage.getByTestId('single-line-input');
    await expect(initialInput).toBeVisible();

    // Enter incomplete plate number
    const incompletePlateInput = 'p';
    let incompletePlateOutput = incompletePlateInput.toUpperCase();
    await initialInput.fill(incompletePlateInput);

    // Get all candidate inputs
    const candidateInputs = loadedPage.getByTestId('candidate-input').all();
    const inputs = await candidateInputs;

    // Verify entered characters
    for (let i = 0; i < incompletePlateInput.length; i++) {
        await expect(inputs[i]).toBeVisible();
        await expect(inputs[i]).toHaveValue(incompletePlateOutput[i]);
    }
});
