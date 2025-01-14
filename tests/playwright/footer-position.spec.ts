import { test, waitForPageReady } from './fixtures';
import { expect } from '@playwright/test';

test.describe('Footer Position Tests', () => {
    test('footer should be at bottom with sufficient screen height', async ({ loadedPage }) => {
        // Set a large enough viewport height
        await loadedPage.setViewportSize({ width: 1024, height: 800 });
        await waitForPageReady(loadedPage);

        // Get footer and viewport dimensions
        const footer = loadedPage.locator('footer').first();
        const footerBox = await footer.boundingBox();
        const viewportHeight = loadedPage.viewportSize()?.height;

        // Verify footer is at the bottom of the viewport
        expect(footerBox).toBeTruthy();
        expect(viewportHeight).toBeTruthy();
        if (footerBox && viewportHeight) {
            // Footer should be close to the bottom of the viewport
            // Allow for small margin of error (10px)
            expect(Math.abs(footerBox.y + footerBox.height - viewportHeight)).toBeLessThan(10);
        }
    });

    test('entire footer should be visible within viewport when screen height is sufficient', async ({ loadedPage }) => {
        // Set a large enough viewport height
        await loadedPage.setViewportSize({ width: 1024, height: 800 });
        await waitForPageReady(loadedPage);

        // Get footer and viewport dimensions
        const footer = loadedPage.locator('footer').first();
        const footerBox = await footer.boundingBox();
        const viewportHeight = loadedPage.viewportSize()?.height;

        // Verify footer is fully within the viewport
        expect(footerBox).toBeTruthy();
        expect(viewportHeight).toBeTruthy();
        if (footerBox && viewportHeight) {
            // Footer's top should be within viewport
            expect(footerBox.y).toBeLessThan(viewportHeight);
            // Footer's bottom should be within viewport
            expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(viewportHeight);
            // Footer's top should be visible (not above viewport)
            expect(footerBox.y).toBeGreaterThanOrEqual(0);
        }
    });

    test('footer should not be visible with small screen height', async ({ loadedPage }) => {
        // Set a very small viewport height that will force scrolling
        await loadedPage.setViewportSize({ width: 1024, height: 300 });
        await waitForPageReady(loadedPage);

        // Get footer position
        const footer = loadedPage.locator('footer').first();
        const footerBox = await footer.boundingBox();
        const viewportHeight = loadedPage.viewportSize()?.height;

        // Verify footer is below the viewport
        expect(footerBox).toBeTruthy();
        expect(viewportHeight).toBeTruthy();
        if (footerBox && viewportHeight) {
            // Footer should start below the viewport
            expect(footerBox.y).toBeGreaterThan(viewportHeight);
        }
    });
});
