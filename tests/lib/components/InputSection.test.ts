// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import InputSection from '$lib/components/InputSection.svelte';
import type { PlateData } from '$lib/types';

describe('InputSection', () => {
    it('should render input field correctly', () => {
        const { getByTestId } = render(InputSection);
        const input = getByTestId('single-line-input') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.value).toBe('');
    });

    it('should auto-uppercase input', async () => {
        const { container } = render(InputSection);
        const input = container.querySelector('[data-testid="single-line-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();

        await fireEvent.input(input, { target: { value: 'abc123' } });
        await tick();

        expect(input.classList.contains('uppercase')).toBe(true);
        expect(input.classList.contains('placeholder:normal-case')).toBe(true);
    });

    it('should enforce maximum line length', async () => {
        const { container } = render(InputSection);
        const input = container.querySelector('[data-testid="single-line-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();
        const longLine = 'A'.repeat(25);
        input.value = longLine;
        await fireEvent.input(input);
        await tick();
        expect(input.value.length).toBeLessThanOrEqual(24);
    });

    it('should dispatch platedata event on input', async () => {
        const { getByTestId, component } = render(InputSection);
        const input = getByTestId('single-line-input') as HTMLInputElement;
        expect(input).toBeTruthy();

        let plateDataReceived: PlateData[] | null = null;
        component.$on('platedata', (e: CustomEvent<PlateData[]>) => {
            plateDataReceived = e.detail;
        });

        // Trigger input
        await fireEvent.input(input, { target: { value: 'ABC123' } });
        await tick();

        // Verify the event was dispatched with correct data
        expect(plateDataReceived).toBeTruthy();
        expect(Array.isArray(plateDataReceived)).toBe(true);
        expect(plateDataReceived![0].input).toBe('ABC123');
    });

    it('should handle focus and blur events', async () => {
        let focusEvent = false;
        let blurEvent = false;
        const { container, component } = render(InputSection);
        const input = container.querySelector('[data-testid="single-line-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();

        component.$on('focus', () => { focusEvent = true; });
        component.$on('blur', () => { blurEvent = true; });

        // Trigger focus and blur
        await fireEvent.focus(input);
        await tick();
        expect(focusEvent).toBe(true);

        await fireEvent.blur(input);
        await tick();
        expect(blurEvent).toBe(true);
    });

    it('should focus input when shouldFocus is true', async () => {
        const { container } = render(InputSection, {
            props: {
                shouldFocus: true,
                index: 0
            }
        });
        const input = container.querySelector('[data-testid="single-line-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.ownerDocument.activeElement).toBe(input);
    });

    it('should update input value when initialValue changes', async () => {
        const { container, component } = render(InputSection, {
            props: {
                initialValue: 'ABC',
                index: 0
            }
        });
        const input = container.querySelector('[data-testid="single-line-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.value).toBe('ABC');

        await component.$set({ initialValue: 'DEF' });
        await tick();
        expect(input.value).toBe('DEF');
    });

    it('should dispatch empty platedata array for empty input', async () => {
        const { container, component } = render(InputSection, {
            props: {
                index: 0
            }
        });
        const input = container.querySelector('[data-testid="single-line-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();

        let plateDataReceived: PlateData[] | null = null;
        component.$on('platedata', (e: CustomEvent<PlateData[]>) => {
            plateDataReceived = e.detail;
        });

        // Trigger input with empty value
        input.value = '';
        await fireEvent.input(input);
        await tick();

        // Verify empty array is dispatched
        expect(plateDataReceived).toBeTruthy();
        expect(Array.isArray(plateDataReceived)).toBe(true);
        expect(plateDataReceived!.length).toBe(0);
    });

    it('should trim input value before processing', async () => {
        const { container, component } = render(InputSection, {
            props: {
                index: 0
            }
        });
        const input = container.querySelector('[data-testid="single-line-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();

        let plateDataReceived: PlateData[] | null = null;
        component.$on('platedata', (e: CustomEvent<PlateData[]>) => {
            plateDataReceived = e.detail;
        });

        // Trigger input with whitespace
        input.value = '  ABC123  ';
        await fireEvent.input(input);
        await tick();

        // Verify trimmed value is used
        expect(plateDataReceived).toBeTruthy();
        expect(plateDataReceived![0].input).toBe('ABC123');
    });

    it('should generate correct input ID based on index', () => {
        const { container } = render(InputSection, {
            props: {
                index: 2
            }
        });
        const input = container.querySelector('[data-testid="single-line-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.id).toBe('plate-input-2');
    });

    it('should use default input ID when no index provided', () => {
        const { container } = render(InputSection);
        const input = container.querySelector('[data-testid="single-line-input"]') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.id).toBe('plate-input-main');
    });
});
