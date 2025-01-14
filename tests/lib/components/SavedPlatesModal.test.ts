import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
import { savedPlates } from '../../../src/lib/stores/savedPlates';
import SavedPlatesModal from '../../../src/lib/components/SavedPlatesModal.svelte';
import type { PlateData, PlateCandidate } from '../../../src/lib/types';

describe('SavedPlatesModal', () => {
    beforeEach(() => {
        savedPlates.set([]);
    });

    function createMockPlateData(input: string, chars: string[]): PlateData {
        const candidates: PlateCandidate[] = chars.map(char => ({
            input: {
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: 'AEIOU'.includes(char.toUpperCase()),
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            },
            isPadding: false,
            alternatives: [char],
            selected: char,
            isSkippedVowel: false,
            wordGroup: 0,
            wordGroupBoundaryLeft: false,
            wordGroupBoundaryRight: false,
            leftShiftState: {
                canBeEnabled: false,
                disabledReason: 'boundaryReached'
            },
            rightShiftState: {
                canBeEnabled: false,
                disabledReason: 'boundaryReached'
            },
            lastChanged: 0
        }));

        return {
            input,
            candidates,
            metadata: {
                hasDiacritics: false,
                hasSymbols: false,
                hasWhitespace: false,
                hasNonLatin: false,
                isValid: true,
                errorMessage: '',
                lastChangeCounter: 0
            }
        };
    }

    it('should not render when show is false', () => {
        const { queryByRole } = render(SavedPlatesModal, { props: { show: false } });
        expect(queryByRole('dialog')).toBeNull();
    });

    it('should render when show is true', () => {
        const { getByRole } = render(SavedPlatesModal, { props: { show: true } });
        expect(getByRole('dialog')).toBeInTheDocument();
    });

    it('should render empty state when no plates are saved', () => {
        const { getByText } = render(SavedPlatesModal, { props: { show: true } });
        expect(getByText('savedPlates.empty')).toBeInTheDocument();
    });

    it('should render plates when they exist', () => {
        const mockPlate: PlateData = createMockPlateData('TEST12345', ['T', 'E', 'S', 'T', '1', '2', '3', '4', '5']);
        savedPlates.set([mockPlate]);
        const { getByTestId } = render(SavedPlatesModal, { props: { show: true } });
        const plateDisplay = getByTestId('plate-number-display');
        expect(plateDisplay).toBeInTheDocument();
        expect(plateDisplay.textContent?.replace(/\s+/g, '')).toBe('TEST12345');
    });

    it('should clear plates when clicking remove button', async () => {
        const mockPlate: PlateData = createMockPlateData('TEST12345', ['T', 'E', 'S', 'T', '1', '2', '3', '4', '5']);
        savedPlates.set([mockPlate]);
        const { getByTestId } = render(SavedPlatesModal, { props: { show: true } });
        await fireEvent.click(getByTestId('remove-button'));
        let currentPlates: PlateData[] = [];
        savedPlates.subscribe(value => {
            currentPlates = value;
        });
        expect(currentPlates).toHaveLength(0);
    });

    it('should not show remove button when no plates exist', () => {
        const { queryByTestId } = render(SavedPlatesModal, { props: { show: true } });
        expect(queryByTestId('remove-button')).not.toBeInTheDocument();
    });
});
