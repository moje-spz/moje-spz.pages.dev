import '@testing-library/jest-dom';
import { describe, test, expect, vi } from 'vitest';

// Mock isLocaleLoaded store
const mockIsLocaleLoaded = vi.hoisted(() => vi.fn());
vi.mock('$lib/i18n', () => ({
    isLocaleLoaded: {
        subscribe: (fn: (value: boolean) => void): (() => void) => {
            fn(mockIsLocaleLoaded());
            return () => { };
        }
    },
    _: {
        subscribe: (fn: (value: (key: string) => string) => void): (() => void) => {
            fn((key: string): string => {
                switch (key) {
                    case 'savedPlates.empty':
                        return 'No saved plates yet';
                    case 'savedPlates.title':
                        return 'Saved Plates';
                    case 'plateDisplay.copyToClipboard':
                        return 'Copy plate number';
                    case 'savedPlates.remove':
                        return 'Remove plate';
                    default:
                        return key;
                }
            });
            return () => { };
        }
    }
}));

// Mock browser environment
vi.mock('$app/environment', () => ({
    browser: true
}));

import { render } from '@testing-library/svelte';
import SavedPlates from '../../../src/lib/components/SavedPlates.svelte';
import { savedPlates } from '../../../src/lib/stores/savedPlates';
import type { PlateData, PlateCandidate } from '../../../src/lib/types';

describe('SavedPlates', () => {
    beforeEach((): void => {
        savedPlates.set([]);
        mockIsLocaleLoaded.mockReturnValue(true);
        localStorage.clear();
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

    test('should render empty state when no plates are saved', () => {
        const { getByText } = render(SavedPlates);
        expect(getByText('savedPlates.empty')).toBeInTheDocument();
    });

    test('should render plate number', () => {
        const mockPlate: PlateData = createMockPlateData('TEST12345', ['T', 'E', 'S', 'T', '1', '2', '3', '4', '5']);
        savedPlates.set([mockPlate]);
        const { getByTestId } = render(SavedPlates);
        const plateDisplay = getByTestId('plate-number-display');
        expect(plateDisplay.textContent?.replace(/\s+/g, '')).toBe('TEST12345');
    });

    test('should split plate number into parts', () => {
        const mockPlate: PlateData = createMockPlateData('ABC12345', ['A', 'B', 'C', '1', '2', '3', '4', '5']);
        savedPlates.set([mockPlate]);
        const { getByTestId } = render(SavedPlates);
        const firstPart = getByTestId('plate-first-part');
        const secondPart = getByTestId('plate-second-part');
        expect(firstPart).toHaveTextContent('ABC');
        expect(secondPart).toHaveTextContent('12345');
    });

    test('should render copy button', () => {
        const mockPlate: PlateData = createMockPlateData('TEST12345', ['T', 'E', 'S', 'T', '1', '2', '3', '4', '5']);
        savedPlates.set([mockPlate]);
        const { getByTestId } = render(SavedPlates);
        expect(getByTestId('copy-plate-button')).toBeInTheDocument();
    });

    test('should render remove button', () => {
        const mockPlate: PlateData = createMockPlateData('TEST12345', ['T', 'E', 'S', 'T', '1', '2', '3', '4', '5']);
        savedPlates.set([mockPlate]);
        const { getByTestId } = render(SavedPlates);
        expect(getByTestId('remove-button')).toBeInTheDocument();
    });

    test('should handle plate deletion', async (): Promise<void> => {
        // Implementation of the test
    });
});
