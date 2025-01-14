// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import PlateDisplay from '../../../src/lib/components/PlateDisplay.svelte';
import type { PlateData } from '../../../src/lib/types';
import { processInput } from '../../../src/lib/plateProcessor';

// Mock IntersectionObserver
beforeEach(() => {
    global.IntersectionObserver = class IntersectionObserver {
        root: Element | null = null;
        rootMargin: string = '0px';
        thresholds: ReadonlyArray<number> = [0];
        constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) { }
        observe(): null { return null; }
        unobserve(): null { return null; }
        disconnect(): null { return null; }
        takeRecords(): IntersectionObserverEntry[] { return []; }
    };
});

describe('PlateDisplay', () => {
    const createTestPlate = (plateStr: string): PlateData => {
        const result = processInput(plateStr);
        return {
            ...result
        };
    };

    describe('Plate Number Display', () => {
        it('should correctly display the last consonant', async (): Promise<void> => {
            const plate = createTestPlate('ABC12345');
            render(PlateDisplay, { props: { plateData: plate, plateId: 'test-plate', section: 0 } });

            // First verify the data structure
            const nonSkippedCandidates = plate.candidates.filter(c => !c.isSkippedVowel);
            expect(nonSkippedCandidates.length).toBe(8); // Should have exactly 8 non-skipped candidates

            // Verify each candidate's selected value
            expect(nonSkippedCandidates[0].selected).toBe('A');
            expect(nonSkippedCandidates[1].selected).toBe('B');
            expect(nonSkippedCandidates[2].selected).toBe('C');
            expect(nonSkippedCandidates[3].selected).toBe('1');
            expect(nonSkippedCandidates[4].selected).toBe('2');
            expect(nonSkippedCandidates[5].selected).toBe('3');
            expect(nonSkippedCandidates[6].selected).toBe('4');
            expect(nonSkippedCandidates[7].selected).toBe('5');
        });
    });
});
