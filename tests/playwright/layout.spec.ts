import { expect } from '@playwright/test';
import { test, waitForPageReady } from './fixtures';

test.describe('Layout', () => {
    test('should load with correct initial theme', async ({ loadedPage }) => {
        // Check if the html element has the correct theme class
        const html = loadedPage.locator('html');
        const themeClass = await html.getAttribute('class');
        const validThemes = ['light', 'dark', ''];
        expect(validThemes, `Expected one of ${validThemes.join(', ')} but got "${themeClass}"`).toContain(themeClass);
    });

    test('should change theme when toggle is clicked', async ({ loadedPage }) => {
        // Open settings menu
        const settingsButton = loadedPage.getByTestId('settings-button');
        await settingsButton.click();

        // Get initial theme
        const html = loadedPage.locator('html');
        const initialThemeClass = await html.getAttribute('class') || '';

        // Find theme toggle in settings and change theme
        const themeToggle = loadedPage.getByTestId('theme-toggle');
        await expect(themeToggle).toBeVisible();
        const newTheme = initialThemeClass === 'dark' ? 'light' : 'dark';
        await themeToggle.selectOption(newTheme);

        // Wait for theme change and verify it's different
        await expect(async () => {
            const newThemeClass = await html.getAttribute('class');
            expect(newThemeClass, `Expected theme to be "${newTheme}" but got "${newThemeClass}"`).toBe(newTheme);
        }).toPass();
    });

    test('should persist theme preference across page loads and new pages', async ({ loadedPage, context }) => {
        // Start with system dark theme and wait for it to take effect
        await loadedPage.emulateMedia({ colorScheme: 'dark' });
        await loadedPage.waitForTimeout(100); // Give time for media query to take effect
        await loadedPage.goto('/');
        await waitForPageReady(loadedPage);

        // Open settings menu
        const settingsButton = loadedPage.getByTestId('settings-button');
        await settingsButton.click();

        // Find theme toggle and change theme to light
        const themeToggle = loadedPage.getByTestId('theme-toggle');
        await expect(themeToggle).toBeVisible();
        await themeToggle.selectOption('light');

        // Verify light theme is applied
        const html = loadedPage.locator('html');
        await expect(html).toHaveClass(/light/);
        await expect(html).not.toHaveClass(/dark/);

        // Reload page and verify theme persists
        await loadedPage.reload();
        await waitForPageReady(loadedPage);
        await expect(html).toHaveClass(/light/);
        await expect(html).not.toHaveClass(/dark/);

        // Create a new page and verify theme persists
        const newPage = await context.newPage();
        await newPage.emulateMedia({ colorScheme: 'dark' }); // Ensure dark theme is set in new page
        await newPage.waitForTimeout(100); // Give time for media query to take effect
        await newPage.goto('/');
        await waitForPageReady(newPage);

        const newHtml = newPage.locator('html');
        await expect(newHtml).toHaveClass(/light/);
        await expect(newHtml).not.toHaveClass(/dark/);

        // Open settings menu in new page
        await newPage.getByTestId('settings-button').click();

        // Switch back to auto theme and verify it follows system preference (dark)
        await newPage.getByTestId('theme-toggle').selectOption('auto');
        await expect(newHtml).toHaveClass(/dark/);
        await expect(newHtml).not.toHaveClass(/light/);

        // Change system preference to light and verify theme updates
        await newPage.emulateMedia({ colorScheme: 'light' });
        await newPage.waitForTimeout(100); // Give time for media query to take effect
        await expect(newHtml).toHaveClass(/light/);
        await expect(newHtml).not.toHaveClass(/dark/);
    });
});
