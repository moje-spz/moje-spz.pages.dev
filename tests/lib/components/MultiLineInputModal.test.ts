// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import MultiLineInputModal from '../../../src/lib/components/MultiLineInputModal.svelte';
import type { PlateData } from '../../../src/lib/types';
import { processInput } from '../../../src/lib/plateProcessor';

vi.mock('$app/environment', () => ({
    browser: true
}));

describe('MultiLineInputModal', () => {
    const createTestPlate = (input: string): PlateData => processInput(input);

    beforeEach(() => {
        // Mock document body overflow style
        document.body.style.overflow = '';
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when show is false', () => {
        const { container } = render(MultiLineInputModal, { props: { show: false } });
        const modal = container.querySelector('[data-testid="modal-overlay"]');
        expect(modal).toBeFalsy();
    });

    it('should render when show is true', () => {
        const { container } = render(MultiLineInputModal, { props: { show: true } });
        const modal = container.querySelector('[data-testid="modal-overlay"]');
        expect(modal).toBeTruthy();
    });

    it('should populate textarea with plate data', () => {
        const plates = [createTestPlate('ABC123'), createTestPlate('DEF456')];
        const { container } = render(MultiLineInputModal, { props: { show: true, plateData: plates } });
        const textarea = container.querySelector('[data-testid="multiple-input-textarea"]') as HTMLTextAreaElement;
        expect(textarea).toBeTruthy();
        expect(textarea.value).toBe('ABC123\nDEF456');
    });

    it('should dispatch submit event with processed input', async () => {
        const { container, component } = render(MultiLineInputModal, { props: { show: true } });
        let submittedData: PlateData[] | null = null;

        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        const textarea = container.querySelector('[data-testid="multiple-input-textarea"]') as HTMLTextAreaElement;
        expect(textarea).toBeTruthy();

        // Simulate user typing
        await fireEvent.input(textarea, { target: { value: 'ABC123\nDEF456' } });
        await tick();

        const form = container.querySelector('form');
        expect(form).toBeTruthy();
        await fireEvent.submit(form!);
        await tick();

        expect(submittedData).toBeTruthy();
        expect(submittedData!.length).toBe(2);
        expect(submittedData![0].input).toBe('ABC123');
        expect(submittedData![1].input).toBe('DEF456');
    });

    it('should dispatch close event when clicking outside', async () => {
        const { container, component } = render(MultiLineInputModal, { props: { show: true } });
        let closed = false;

        component.$on('close', () => {
            closed = true;
        });

        const overlayButton = container.querySelector('[data-testid="modal-overlay-button"]');
        expect(overlayButton).toBeTruthy();
        await fireEvent.click(overlayButton!);

        expect(closed).toBe(true);
    });

    it('should respect maxLines limit', async () => {
        const { container, component } = render(MultiLineInputModal, { props: { show: true, maxLines: 2 } });
        let submittedData: PlateData[] | null = null;

        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        const textarea = container.querySelector('[data-testid="multiple-input-textarea"]') as HTMLTextAreaElement;
        expect(textarea).toBeTruthy();

        // Simulate user typing
        await fireEvent.input(textarea, { target: { value: 'ABC123\nDEF456\nGHI789' } });
        await tick();

        const form = container.querySelector('form');
        expect(form).toBeTruthy();
        await fireEvent.submit(form!);
        await tick();

        expect(submittedData).toBeTruthy();
        expect(submittedData!.length).toBe(2);
        expect(submittedData![0].input).toBe('ABC123');
        expect(submittedData![1].input).toBe('DEF456');
    });

    it('should maintain user input after initial population', async () => {
        const plates = [createTestPlate('ABC123')];
        const { container, component } = render(MultiLineInputModal, { props: { show: true, plateData: plates } });

        const textarea = container.querySelector('[data-testid="multiple-input-textarea"]') as HTMLTextAreaElement;
        expect(textarea.value).toBe('ABC123');

        // Simulate user modifying the text
        await fireEvent.input(textarea, { target: { value: 'XYZ789' } });
        await tick();

        // Verify the textarea maintains the user's input
        expect(textarea.value).toBe('XYZ789');

        // Update show prop
        await component.$set({ show: true });
        await tick();

        // Verify the textarea still maintains the user's input
        expect(textarea.value).toBe('XYZ789');
    });

    it('should reset input only when modal is closed and reopened', async () => {
        const plates = [createTestPlate('ABC123')];
        const { container, component } = render(MultiLineInputModal, { props: { show: true, plateData: plates } });

        const textarea = container.querySelector('[data-testid="multiple-input-textarea"]') as HTMLTextAreaElement;
        expect(textarea.value).toBe('ABC123');

        // Simulate user modifying the text
        await fireEvent.input(textarea, { target: { value: 'XYZ789' } });
        await tick();

        // Close the modal
        await component.$set({ show: false });
        await tick();

        // Reopen the modal
        await component.$set({ show: true });
        await tick();

        // Verify the textarea is reset to the original plate data
        const updatedTextarea = container.querySelector('[data-testid="multiple-input-textarea"]') as HTMLTextAreaElement;
        expect(updatedTextarea.value).toBe('ABC123');
    });
});
