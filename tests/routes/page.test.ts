import '../setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { mockIsLocaleLoaded, mockI18nLoading } from '../mocks/i18n';
import Page from '../../src/routes/+page.svelte';

// Mock svelte-i18n module
vi.mock('svelte-i18n', () => ({
    _: vi.fn((key) => key),
    isLoading: mockI18nLoading,
    locale: vi.fn(),
    dictionary: vi.fn(),
    init: vi.fn(),
    getLocaleFromNavigator: vi.fn(() => 'en'),
    addMessages: vi.fn()
}));

// Mock i18n module
vi.mock('$lib/i18n', () => ({
    setupI18n: vi.fn().mockResolvedValue(undefined),
    isLocaleLoaded: mockIsLocaleLoaded
}));

// Mock browser environment
vi.mock('$app/environment', () => ({
    browser: true
}));

// Mock visualViewport
const mockVisualViewport = {
    height: 768,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};

describe('Modal Dialog', () => {
    beforeEach((): void => {
        // Reset the DOM
        document.body.innerHTML = '';
        document.body.style.overflow = '';

        // Mock window.visualViewport
        vi.stubGlobal('visualViewport', mockVisualViewport);

        // Reset i18n state
        mockIsLocaleLoaded.set(true);
        mockI18nLoading.set(false);

        vi.clearAllMocks();
    });

    async function renderAndWaitForLoad(): Promise<{
        container: HTMLElement;
        component: Page;
        [key: string]: unknown;
    }> {
        const result = render(Page);
        await tick(); // Wait for initial render
        await tick(); // Wait for i18n initialization
        await tick(); // Wait for i18n to propagate
        await tick(); // Wait for final i18n updates
        await tick(); // Wait for components to render
        return result;
    }

    it('should prevent scrolling of underlying page when modal is open', async (): Promise<void> => {
        const { container } = await renderAndWaitForLoad();
        const multipleButton = container.querySelector('[data-testid="multiple-input-button"]');
        expect(multipleButton).toBeTruthy();

        // Open modal
        await fireEvent.click(multipleButton!);
        await tick();
        expect(document.body.style.overflow).toBe('hidden');

        // Close modal
        const closeButton = container.querySelector('[data-testid="close-button"]');
        expect(closeButton).toBeTruthy();
        await fireEvent.click(closeButton!);
        await tick();
        expect(document.body.style.overflow).toBe('');
    });

    it('should have a close button in the top right corner', async (): Promise<void> => {
        const { container } = await renderAndWaitForLoad();
        const multipleButton = container.querySelector('[data-testid="multiple-input-button"]');
        await fireEvent.click(multipleButton!);
        await tick();

        const closeButton = container.querySelector('[data-testid="close-button"]');
        expect(closeButton).toBeTruthy();
        expect(closeButton?.classList.toString()).toContain('justify-center');
        const closeIcon = closeButton?.querySelector('svg');
        expect(closeIcon).toBeTruthy();
    });

    it('should have an OK button aligned to the right', async (): Promise<void> => {
        const { container } = await renderAndWaitForLoad();
        const multipleButton = container.querySelector('[data-testid="multiple-input-button"]');
        await fireEvent.click(multipleButton!);
        await tick();

        const form = container.querySelector('form');
        const buttonContainer = form?.querySelector('div.flex.justify-end');
        expect(buttonContainer).toBeTruthy();

        const okButton = buttonContainer?.querySelector('button[type="submit"]');
        expect(okButton).toBeTruthy();
        expect(okButton?.textContent?.trim()).toBe('OK');
    });
});
