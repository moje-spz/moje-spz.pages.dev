import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import PlateCandidates from '../../../src/lib/components/PlateCandidates.svelte';
import type { PlateData } from '../../../src/lib/types';
import { processInput } from '../../../src/lib/plateProcessor';

describe('PlateCandidates', () => {
    const createTestPlate = (plateStr: string): PlateData => {
        const result = processInput(plateStr);
        return {
            ...result
        };
    };

    describe('Input Validation and Appearance', () => {
        it('should show red border for invalid input', async (): Promise<void> => {
            const plate = createTestPlate('ABC12345');
            const { getAllByTestId } = render(PlateCandidates, { props: { plateData: plate, section: 0 } });

            const inputs = getAllByTestId('candidate-input');
            const input = inputs[0] as HTMLInputElement;

            // Focus and enter invalid input
            await fireEvent.focus(input);
            await tick();
            await fireEvent.input(input, { target: { value: 'X' } });
            await tick();
            // Wait for any animations or state changes to complete
            await new Promise(resolve => setTimeout(resolve, 250));

            // Verify input has invalid value and styling
            expect(input.value).toBe('X');
            expect(input.classList.contains('bg-red-50')).toBe(true);
            expect(input.classList.contains('border-red-500')).toBe(true);
            expect(input.classList.contains('text-red-900')).toBe(true);
            expect(input.classList.contains('dark:bg-gray-700')).toBe(true);
            expect(input.classList.contains('dark:text-red-500')).toBe(true);
            expect(input.classList.contains('dark:border-red-500')).toBe(true);
        });

        it('should show green validation styling for valid input', async (): Promise<void> => {
            const plate = createTestPlate('ABC12345');
            const { getAllByTestId } = render(PlateCandidates, { props: { plateData: plate, section: 0 } });

            const inputs = getAllByTestId('candidate-input');
            const input = inputs[0] as HTMLInputElement;

            // Focus and enter valid input
            await fireEvent.focus(input);
            await tick();
            await fireEvent.input(input, { target: { value: 'A' } });
            await tick();

            expect(input.classList.contains('focus:border-green-500')).toBe(true);
            expect(input.classList.contains('focus:text-green-900')).toBe(true);
        });

        it('should not apply green color to placeholder text when focused', async (): Promise<void> => {
            const plate = createTestPlate('ABC12345');
            const { getAllByTestId } = render(PlateCandidates, { props: { plateData: plate, section: 0 } });

            const inputs = getAllByTestId('candidate-input');
            const input = inputs[0] as HTMLInputElement;

            // Focus the input
            await fireEvent.focus(input);
            await tick();

            // Verify placeholder doesn't have green color classes
            expect(input.classList.contains('focus:placeholder-green-600')).toBe(false);
            expect(input.classList.contains('dark:focus:placeholder-green-400')).toBe(false);
            expect(input.classList.contains('placeholder-green-600')).toBe(false);
            expect(input.classList.contains('dark:placeholder-green-400')).toBe(false);
        });

        it('should show red validation styling for invalid input when focused', async (): Promise<void> => {
            const plate = createTestPlate('ABC12345');
            const { getAllByTestId } = render(PlateCandidates, { props: { plateData: plate, section: 0 } });

            const inputs = getAllByTestId('candidate-input');
            const input = inputs[0] as HTMLInputElement;

            // Focus and enter invalid input
            await fireEvent.focus(input);
            await tick();
            await fireEvent.input(input, { target: { value: 'X' } });
            await tick();

            expect(input.classList.contains('border-red-500')).toBe(true);
            expect(input.classList.contains('text-red-900')).toBe(true);
        });
    });

    describe('Input Validation', () => {
        it('should normalize input value', async (): Promise<void> => {
            const plate = createTestPlate('ABC12345');
            const { getAllByTestId } = render(PlateCandidates, { props: { plateData: plate, section: 0 } });

            const inputs = getAllByTestId('candidate-input');
            const input = inputs[0] as HTMLInputElement;
            await fireEvent.input(input, { target: { value: 'á' } });

            // Wait for the next tick to allow the component to update
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(plate.candidates[0].selected).toBe('A');
        });

        it('should restore previous value on invalid input blur', async (): Promise<void> => {
            const plate = createTestPlate('ABC12345');
            const { getAllByTestId } = render(PlateCandidates, { props: { plateData: plate, section: 0 } });

            const inputs = getAllByTestId('candidate-input');
            const input = inputs[0] as HTMLInputElement;

            // Verify 'X' is not in alternatives
            expect(plate.candidates[0].alternatives).not.toContain('X');

            await fireEvent.input(input, { target: { value: 'X' } });
            await fireEvent.blur(input);

            expect(plate.candidates[0].selected).toBe('A');
        });
    });
});
