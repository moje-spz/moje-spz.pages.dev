import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Helper function to wait for page to be ready
export async function waitForPageReady(page: Page): Promise<void> {
    const title = page.locator('header h1');
    await expect(title).not.toHaveClass(/animate-pulse/, { timeout: 10000 });
    await expect(title).toBeVisible({ timeout: 10000 });
    await expect(title).not.toBeEmpty({ timeout: 10000 });
}

// Helper function to wait for mobile input to be ready
export async function waitForMobileInputReady(page: Page): Promise<void> {
    await waitForPageReady(page);
    const input = page.getByTestId('single-line-input');
    await expect(input).toBeVisible({ timeout: 10000 });
    await expect(input).toBeEnabled({ timeout: 10000 });
}

// Define test fixtures
type TestFixtures = {
    loadedPage: Page;
    loadedMobilePage: Page;
};

const test = base.extend<TestFixtures>({
    loadedPage: async ({ page }, use) => {
        await page.goto('/', { timeout: 10000 });
        await waitForPageReady(page);
        await use(page);
    },
    loadedMobilePage: async ({ page }, use) => {
        await page.goto('/', { timeout: 5000 });
        await waitForMobileInputReady(page);
        await use(page);
    },
});

export { test };
