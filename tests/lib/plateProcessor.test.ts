import { describe, it, expect } from 'vitest';
import {
    processInput,
    createPaddingCandidate,
    createInputCandidate,
    VALID_CHARS,
    ensureAtLeastOneNumber,
    createPlateNumber,
    createAlternatives,
    createInitialPlateCandidates,
    addPaddingChars,
    handleELPrefix,
    PLATE_LENGTH,
    setWordGroupBoundaries,
    handleFiveCharInput,
    createVowelAndCandidatesData
} from '../../src/lib/plateProcessor';
import type { PlateCandidate, InputCharacter } from '../../src/lib/types';

function getVowelValues(vowels: (PlateCandidate | null)[]): (string | null)[] {
    return vowels.map(v => v ? v.selected : null);
}

function getCandidateValues(candidates: PlateCandidate[]): string[] {
    return candidates.map(c => c.selected);
}

function getCodePointDetails(str: string): string {
    const codePoints = Array.from(str).map(char => `U+${char.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()}`);
    const modifiers = str.slice(1).split('').map(char => {
        const cp = char.charCodeAt(0);
        if (cp >= 0x0300 && cp <= 0x036F) {
            return `U+${cp.toString(16).padStart(4, '0').toUpperCase()}`;
        }
        return null;
    }).filter(Boolean);
    return `\n  code points: ${codePoints.join(' ')}\n  modifiers: ${modifiers.join(' ') || 'none'}`;
}

function createTestCharacter(char: string): InputCharacter {
    return {
        original: char,
        uppercase: char.toUpperCase(),
        uppercaseWithoutDiacritics: char.toUpperCase(),
        transformed: char.toUpperCase(),
        isVowel: false,
        isWhitespace: /\s/.test(char),
        isSymbol: /[,]/.test(char),
        isDiacritic: false,
        isLatin: true
    };
}

describe('plateProcessor', () => {
    describe('input validation', () => {
        it('should reject non-Latin script', (): void => {
            const result = processInput('こんにちは');
            expect(result.metadata.isValid).toBe(false);
            expect(result.metadata.errorMessage).toBe('Non-Latin script characters are not allowed');
        });

        it('should show correct alternatives for first position when entering invalid second character', (): void => {
            const result = processInput('AX');

            // First position should have A and 4 as alternatives
            const firstCandidate = result.candidates[0];
            expect(firstCandidate.input.uppercaseWithoutDiacritics).toBe('A');
            expect(firstCandidate.alternatives).toEqual(['A', '4']);
            expect(firstCandidate.selected).toBe('A');

            // Second position should have exactly X as alternative
            const secondCandidate = result.candidates[1];
            expect(secondCandidate.input.uppercaseWithoutDiacritics).toBe('X');
            expect(secondCandidate.alternatives).toEqual(['X']);
            expect(secondCandidate.selected).toBe('X');
        });

        it('should handle diacritics', (): void => {
            const result = processInput('ěščřžýáíé');
            expect(result.metadata.hasDiacritics).toBe(true);
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).not.toMatch(/[ěščřžýáíé]/);
        });

        it('should handle symbols', (): void => {
            const result = processInput('ABC@#$123');
            expect(result.metadata.hasSymbols).toBe(true);
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).not.toMatch(/[@#$]/);
        });

        it('should handle whitespace', (): void => {
            const result = processInput('ABC 123');
            expect(result.metadata.hasWhitespace).toBe(true);
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).not.toMatch(/\s/);
        });

        it('should handle single diacritic character correctly', (): void => {
            const result = processInput('á');
            expect(result.metadata.hasDiacritics).toBe(true);

            // Check the first candidate's properties
            const firstCandidate = result.candidates[0];
            expect(
                firstCandidate.input.original,
                `Original ${getCodePointDetails(firstCandidate.input.original)}`
            ).toBe('á');

            // Accept both precomposed (U+00C1) and decomposed (U+0041 U+0301) forms
            const uppercaseChar = firstCandidate.input.uppercase;
            const isPrecomposed = uppercaseChar === '\u00C1';  // Á
            const isDecomposed = uppercaseChar === '\u0041\u0301';  // A + ´
            expect(
                isPrecomposed || isDecomposed,
                `Uppercase ${getCodePointDetails(firstCandidate.input.uppercase)}\nExpected either U+00C1 or U+0041 U+0301`
            ).toBe(true);

            expect(firstCandidate.input.uppercaseWithoutDiacritics).toBe('A');
            expect(firstCandidate.input.transformed).toBe('A');
            expect(firstCandidate.input.isDiacritic).toBe(true);
            expect(firstCandidate.input.isLatin).toBe(true);
            expect(firstCandidate.alternatives).toEqual(['A', '4']);

            expect(result.metadata.isValid).toBe(true);
        });
    });

    describe('plate generation rules', () => {
        it('must contain at least one number', (): void => {
            const result = processInput('ABCDEFGH');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toMatch(/\d/);
        });

        it('should convert O to 0', (): void => {
            const result = processInput('OOOOOOO');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toMatch(/0/);
        });

        it('should convert G to 6', (): void => {
            const result = processInput('GGGGGGG');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toMatch(/6/);
        });

        it('should convert Q to 6', (): void => {
            const result = processInput('QQQQQQQ');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toMatch(/6/);
        });

        it('should convert W to 3', (): void => {
            const result = processInput('WWWWWWW');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toMatch(/3/);
        });

        it('should not start with EL', (): void => {
            const result = processInput('ELEPHANT');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber.startsWith('EL')).toBe(false);
        });

        it('should be exactly 8 characters', (): void => {
            const result = processInput('ABC');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber.replace('-', '')).toHaveLength(8);
        });

        it('should pad with first valid character when input is too short', (): void => {
            const result = processInput('ABC');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toMatch(new RegExp(`${VALID_CHARS[0]}+`));
        });

        it('should handle EL prefix with shorter than maximum length by adding padding at the beginning', (): void => {
            const result = processInput('ellll');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toBe('AA0ELLLL');
        });

        it('should handle EL prefix with one letter shorter than maximum length by shifting and adding padding at the beginning', (): void => {
            const result = processInput('elllll');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toBe('AELLLLL0');
        });

        it('should handle EL prefix with padding at start converted to a number when input is one character short of maximum length', (): void => {
            const result = processInput('ellllll');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toBe('0ELLLLLL');
        });

        it('should handle EL prefix when input is full length by transforming input E from EL to 3', (): void => {
            const result = processInput('elllllll');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBeDefined();
            expect(plateNumber).toBe('3LLLLLLL');
        });
    });

    describe('vowel handling', () => {
        it('should handle vowel skipping correctly for various inputs', () => {
            const testCases = [
                {
                    input: 'platenum',
                    expectedPlate: 'PL4TENUM',
                    description: 'no vowels skipped when input fits'
                },
                {
                    input: 'platenumb',
                    expectedPlate: 'PL4TENMB',
                    description: 'skip rightmost vowel when needed'
                },
                {
                    input: 'platenumbe',
                    expectedPlate: 'PL4TENMB',
                    description: 'skip two rightmost vowels when needed'
                },
                {
                    input: 'platenumber',
                    expectedPlate: 'PL4TNMBR',
                    description: 'skip three vowels when needed'
                },
                {
                    input: 'platenumbers',
                    expectedPlate: 'PLTNM8RS',
                    description: 'skip all vowels to make input fit'
                }
            ];

            testCases.forEach(({ input, expectedPlate, description }) => {
                const result = processInput(input);
                const plateNumber = createPlateNumber(result.candidates);
                expect(plateNumber, description).toBe(expectedPlate);
            });
        });

        it('should handle too many consonants gracefully', () => {
            const result = processInput('platenumberss');  // After skipping vowels, still too many consonants
            expect(result.metadata.isValid).toBe(false);
            expect(result.metadata.errorMessage).toBe('inputSection.errors.tooManyConsonants');
            expect(createPlateNumber(result.candidates)).toBe('');
        });

        it('should not skip non-vowels even if input is too long', () => {
            const result = processInput('BCDFHJKLMN');  // 9 consonants, none with mandatory transforms
            expect(result.metadata.isValid).toBe(false);
            expect(result.metadata.errorMessage).toBe('inputSection.errors.tooManyConsonants');
            expect(createPlateNumber(result.candidates)).toBe('');
        });

        it('should handle Y as a vowel', () => {
            const result = processInput('SYSTYMBYR');  // 9 chars with Y as vowels
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBe('5YSTYMBR');
        });

        it('should treat vowels even when transformed to numbers as vowels', () => {
            const result = processInput('o12345678');  // O transforms to 0
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBe('12345678');  // O->0 is mandatory transform but gets truncated
        });

        it('should handle diacritics in vowels correctly', () => {
            const result = processInput('plàténümbèr');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBe('PL4TNMBR');
        });

        it('should handle repeating vowels and keep last consonant', () => {
            const result = processInput('ababababc');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBe('4BABABBC');

            // Verify the last character is C
            const nonSkippedCandidates = result.candidates.filter(c => !c.isSkippedVowel);
            expect(nonSkippedCandidates[nonSkippedCandidates.length - 1].selected).toBe('C');
            expect(nonSkippedCandidates[nonSkippedCandidates.length - 1].input.uppercaseWithoutDiacritics).toBe('C');

            // Verify we have exactly 8 characters
            expect(plateNumber.length).toBe(8);

            // Verify the full sequence of characters
            expect(plateNumber.split('')).toEqual(['4', 'B', 'A', 'B', 'A', 'B', 'B', 'C']);
        });

        it('should reject input with adjacent skipped vowels', () => {
            const result = processInput('aeboddffhhh');
            const { vowelIndicatorData } = createVowelAndCandidatesData(result.candidates);
            expect(vowelIndicatorData.metadata.errors).toContain('vowelIndicator.errors.consecutiveVowels');
        });
    });

    describe('character mapping', () => {
        it('should map A to 4 when number needed', (): void => {
            const result = processInput('ABCDEFHJ');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBe('4BCDEFHJ');
            // Verify the actual candidate structure
            const aCandidate = result.candidates[0];
            expect(aCandidate.input.uppercaseWithoutDiacritics).toBe('A');
            expect(aCandidate.alternatives).toContain('4');
            expect(aCandidate.selected).toBe('4');
            // Verify E is not transformed since we already have a number
            const eCandidate = result.candidates[4];
            expect(eCandidate.selected).toBe('E');
        });

        it('should map B to 8 when number needed', (): void => {
            const result = processInput('BCDEFHIJ');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBe('8CDEFHIJ');
            // Verify the actual candidate structure
            const bCandidate = result.candidates[0];
            expect(bCandidate.input.uppercaseWithoutDiacritics).toBe('B');
            expect(bCandidate.alternatives).toContain('8');
            expect(bCandidate.selected).toBe('8');
            // Verify E is not transformed since we already have a number
            const eCandidate = result.candidates[3];
            expect(eCandidate.selected).toBe('E');
        });

        it('should map E to 3 when number needed', (): void => {
            const result = processInput('CDEFHIJK');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBe('CD3FHIJK');
            // Verify the actual candidate structure
            const eCandidate = result.candidates[2];
            expect(eCandidate.input.uppercaseWithoutDiacritics).toBe('E');
            expect(eCandidate.alternatives).toContain('3');
            expect(eCandidate.selected).toBe('3');
            // Verify I is not transformed since we already have a number
            const iCandidate = result.candidates[5];
            expect(iCandidate.selected).toBe('I');
        });

        it('should map I to 1 when number needed', (): void => {
            const result = processInput('DCFLHIJK');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toBe('DCFLH1JK');
            // Verify the actual candidate structure
            const iCandidate = result.candidates[5];
            expect(iCandidate.input.uppercaseWithoutDiacritics).toBe('I');
            expect(iCandidate.alternatives).toContain('1');
            expect(iCandidate.selected).toBe('1');
            // Verify J is not transformed since we already have a number
            const jCandidate = result.candidates[6];
            expect(jCandidate.selected).toBe('J');
        });

        it('should map S to 5 when number needed', (): void => {
            const result = processInput('DFLHMJKS');
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toMatch(/5/);
            // Verify the actual candidate structure
            const sCandidate = result.candidates[7];
            expect(sCandidate.input.uppercaseWithoutDiacritics).toBe('S');
            expect(sCandidate.alternatives).toContain('5');
            expect(sCandidate.selected).toBe('5');
            // Verify the rest of the input is preserved
            expect(plateNumber).toMatch(/DFLHMJK/i);
        });

        it('should map mandatory transformations first', (): void => {
            const result = processInput('ABCDEFGO');  // G->6 is mandatory, A->4 is optional
            const plateNumber = createPlateNumber(result.candidates);
            expect(plateNumber).toMatch(/6/);  // G should be transformed to 6
            expect(plateNumber).not.toMatch(/4/);  // A should not be transformed since we already have a number
            // Verify the actual candidate structure
            const gCandidate = result.candidates[6];
            expect(gCandidate.input.uppercaseWithoutDiacritics).toBe('G');
            expect(gCandidate.alternatives).toEqual(['6']);  // G can only be 6
            expect(gCandidate.selected).toBe('6');
            const aCandidate = result.candidates[0];
            expect(aCandidate.input.uppercaseWithoutDiacritics).toBe('A');
            expect(aCandidate.alternatives).toContain('4');  // A can be 4 but isn't selected as 4
            expect(aCandidate.selected).toBe('A');
            // Verify O is transformed to 0 (mandatory)
            expect(plateNumber).toMatch(/ABCDEF60/i);
        });

        it('should handle multiple mandatory transformations', (): void => {
            const result = processInput('ABCOGQW');  // O->0, G->6, Q->6, W->3 are all mandatory
            const plateNumber = createPlateNumber(result.candidates);
            // Verify all mandatory transformations are applied
            expect(plateNumber).toMatch(/0/);  // O->0
            expect(plateNumber).toMatch(/6/);  // G->6 and Q->6
            expect(plateNumber).toMatch(/3/);  // W->3
            // Verify the actual candidate structure
            const oCandidate = result.candidates[3];
            expect(oCandidate.input.uppercaseWithoutDiacritics).toBe('O');
            expect(oCandidate.alternatives).toEqual(['0']);
            expect(oCandidate.selected).toBe('0');
            // Verify the final plate number
            expect(plateNumber).toBe('ABC0663A');
        });

    });

    describe('candidates', () => {
        it('should generate candidates for each position', (): void => {
            const result = processInput('ABC');
            expect(result.candidates.length).toBe(8);
            expect(result.candidates.every(c => c.alternatives.length > 0)).toBe(true);
        });

        it('should mark padding candidates', (): void => {
            const result = processInput('A');
            expect(result.candidates.some(c => c.isPadding)).toBe(true);
        });

        it('should include mapped alternatives', (): void => {
            const result = processInput('O');
            const oCandidate = result.candidates.find(c => c.input.uppercaseWithoutDiacritics === 'O');
            expect(oCandidate?.alternatives).toContain('0');
        });
    });

    describe('createPaddingCandidate', () => {
        it('should create a candidate with correct padding properties', (): void => {
            const candidate = createPaddingCandidate();
            expect(candidate.isPadding).toBe(true);
            expect(candidate.input.uppercaseWithoutDiacritics).toBe(VALID_CHARS[0]);
            expect(candidate.input.transformed).toBe(VALID_CHARS[0]);
            expect(candidate.selected).toBe(VALID_CHARS[0]);
            expect(candidate.isSkippedVowel).toBe(false);
        });

        it('should include all valid characters as alternatives', (): void => {
            const candidate = createPaddingCandidate();
            expect(candidate.alternatives).toEqual(VALID_CHARS);
            expect(candidate.alternatives).not.toContain('G');
            expect(candidate.alternatives).not.toContain('O');
            expect(candidate.alternatives).not.toContain('Q');
            expect(candidate.alternatives).not.toContain('W');
            expect(candidate.isSkippedVowel).toBe(false);
        });

        it('should have the correct number of alternatives', (): void => {
            const candidate = createPaddingCandidate();
            // 26 letters - 4 excluded (G,O,Q,W) + 10 digits = 32 valid characters
            expect(candidate.alternatives).toHaveLength(32);
        });
    });

    describe('ensureAtLeastOneNumber', () => {
        it('should use existing number if available in alternatives', (): void => {
            const candidates: PlateCandidate[] = [
                { input: { original: 'c', uppercase: 'C', uppercaseWithoutDiacritics: 'C', transformed: 'C', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'C', isPadding: false, alternatives: ['C', '3'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'd', uppercase: 'D', uppercaseWithoutDiacritics: 'D', transformed: 'D', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'D', isPadding: false, alternatives: ['D'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 }
            ];

            ensureAtLeastOneNumber(candidates);
            expect(candidates[0].selected).toBe('3');
            expect(candidates[1].selected).toBe('D');
        });

        it('should use existing number if already selected', (): void => {
            const candidates: PlateCandidate[] = [
                { input: { original: 'c', uppercase: 'C', uppercaseWithoutDiacritics: 'C', transformed: 'C', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: '3', isPadding: false, alternatives: ['C'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'd', uppercase: 'D', uppercaseWithoutDiacritics: 'D', transformed: 'D', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'D', isPadding: false, alternatives: ['D'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 }
            ];

            const originalCandidates = JSON.parse(JSON.stringify(candidates));
            ensureAtLeastOneNumber(candidates);
            expect(candidates).toEqual(originalCandidates);
        });

        it('should add number to rightmost padding character', (): void => {
            const candidates: PlateCandidate[] = [
                { input: { original: 'c', uppercase: 'C', uppercaseWithoutDiacritics: 'C', transformed: 'C', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'C', isPadding: false, alternatives: ['C'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'A', isPadding: true, alternatives: VALID_CHARS, isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'A', isPadding: true, alternatives: VALID_CHARS, isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 }
            ];

            ensureAtLeastOneNumber(candidates);
            expect(candidates[2].selected).toBe('0');
            expect(candidates[1].selected).toBe('A');
            expect(candidates[0].selected).toBe('C');
        });

        it('should try mapping non-padding characters if no padding is available', (): void => {
            const candidates: PlateCandidate[] = [
                { input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'A', isPadding: false, alternatives: ['A', '4'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'b', uppercase: 'B', uppercaseWithoutDiacritics: 'B', transformed: 'B', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'B', isPadding: false, alternatives: ['B', '8'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'c', uppercase: 'C', uppercaseWithoutDiacritics: 'C', transformed: 'C', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'C', isPadding: false, alternatives: ['C'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 }
            ];

            ensureAtLeastOneNumber(candidates);
            expect(candidates[0].selected).toBe('4');
            expect(candidates[1].selected).toBe('B');
            expect(candidates[2].selected).toBe('C');
        });

        it('should throw error if no number can be added', (): void => {
            const candidates: PlateCandidate[] = [
                { input: { original: 'c', uppercase: 'C', uppercaseWithoutDiacritics: 'C', transformed: 'C', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'C', isPadding: false, alternatives: ['C'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'd', uppercase: 'D', uppercaseWithoutDiacritics: 'D', transformed: 'D', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'D', isPadding: false, alternatives: ['D'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 }
            ];

            expect(() => ensureAtLeastOneNumber(candidates)).toThrow('inputSection.errors.noPositionForNumber');
        });

        it('should work with empty candidates array', (): void => {
            const candidates: PlateCandidate[] = [];
            expect(() => ensureAtLeastOneNumber(candidates)).toThrow('inputSection.errors.noPositionForNumber');
        });

        it('should not modify candidates after first number is added', (): void => {
            const candidates: PlateCandidate[] = [
                { input: { original: 'c', uppercase: 'C', uppercaseWithoutDiacritics: 'C', transformed: 'C', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'C', isPadding: false, alternatives: ['C'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'A', isPadding: true, alternatives: VALID_CHARS, isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'A', isPadding: true, alternatives: VALID_CHARS, isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 }
            ];

            ensureAtLeastOneNumber(candidates);
            const originalCandidates = JSON.parse(JSON.stringify(candidates));
            ensureAtLeastOneNumber(candidates);
            expect(candidates).toEqual(originalCandidates);
        });

        it('should handle error in processInput', (): void => {
            const result = processInput('DDDDDDDD');  // No mappable characters to numbers
            expect(result.metadata.isValid).toBe(false);
            expect(result.metadata.errorMessage).toBe('inputSection.errors.noPositionForNumber');
        });

        it('should prefer using existing number over mapping character', () => {
            const candidates: PlateCandidate[] = [
                { input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'A', isPadding: false, alternatives: ['A', '1'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 },
                { input: { original: 'i', uppercase: 'I', uppercaseWithoutDiacritics: 'I', transformed: 'I', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true }, selected: 'I', isPadding: false, alternatives: ['I', '1'], isSkippedVowel: false, wordGroup: 0, wordGroupBoundaryLeft: false, wordGroupBoundaryRight: false, leftShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, rightShiftState: { canBeEnabled: false, disabledReason: 'boundaryReached' }, lastChanged: 0 }
            ];

            ensureAtLeastOneNumber(candidates);
            expect(candidates[0].selected).toBe('1');  // Uses alternative number
            expect(candidates[1].selected).toBe('I');  // Doesn't map to number since we already have one
        });
    });

    describe('createInputCandidate', () => {
        it('should create a candidate with correct properties for regular character', (): void => {
            const char: InputCharacter = {
                original: 'a',
                uppercase: 'A',
                uppercaseWithoutDiacritics: 'A',
                transformed: 'A',
                isVowel: false,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };

            const candidate = createInputCandidate(char);
            expect(candidate.input.uppercaseWithoutDiacritics).toBe('A');
            expect(candidate.input.transformed).toBe('A');
            expect(candidate.selected).toBe('A');
            expect(candidate.isPadding).toBe(false);
            expect(candidate.isSkippedVowel).toBe(false);
            expect(candidate.alternatives).toEqual(['A', '4']);
        });

        it('should handle transformations which are not allowed in the output (O,G,Q,W)', (): void => {
            const char: InputCharacter = {
                original: 'o',
                uppercase: 'O',
                uppercaseWithoutDiacritics: 'O',
                transformed: 'O',
                isVowel: true,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };

            const candidate = createInputCandidate(char);
            expect(candidate.alternatives).toEqual(['0']);
            expect(candidate.alternatives).toHaveLength(1);
            expect(candidate.selected).toBe('0');
            expect(candidate.isSkippedVowel).toBe(false);

            const gChar: InputCharacter = {
                original: 'g',
                uppercase: 'G',
                uppercaseWithoutDiacritics: 'G',
                transformed: '6',
                isVowel: false,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };
            const qChar: InputCharacter = {
                original: 'q',
                uppercase: 'Q',
                uppercaseWithoutDiacritics: 'Q',
                transformed: '6',
                isVowel: false,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };
            const wChar: InputCharacter = {
                original: 'w',
                uppercase: 'W',
                uppercaseWithoutDiacritics: 'W',
                transformed: '3',
                isVowel: false,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };

            expect(createInputCandidate(gChar).alternatives).toEqual(['6']);
            expect(createInputCandidate(qChar).alternatives).toEqual(['6']);
            expect(createInputCandidate(wChar).alternatives).toEqual(['3']);
        });

        it('should handle optional transformations with number alternatives', (): void => {
            const char: InputCharacter = {
                original: 'i',
                uppercase: 'I',
                uppercaseWithoutDiacritics: 'I',
                transformed: 'I',
                isVowel: false,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };

            const candidate = createInputCandidate(char);
            expect(candidate.alternatives).toEqual(['I', '1']);
            expect(candidate.alternatives).toHaveLength(2);
            expect(candidate.selected).toBe('I');
            expect(candidate.isSkippedVowel).toBe(false);
        });

        it('should handle non-vowel transformations with number alternatives', (): void => {
            const char: InputCharacter = {
                original: 'b',
                uppercase: 'B',
                uppercaseWithoutDiacritics: 'B',
                transformed: 'B',
                isVowel: false,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };

            const candidate = createInputCandidate(char);
            expect(candidate.alternatives).toEqual(['B', '8']);
            expect(candidate.alternatives).toHaveLength(2);
            expect(candidate.selected).toBe('B');
            expect(candidate.isSkippedVowel).toBe(false);
        });

        it('should not include mapped alternative when not available', (): void => {
            const char: InputCharacter = {
                original: 'c',
                uppercase: 'C',
                uppercaseWithoutDiacritics: 'C',
                transformed: 'C',
                isVowel: false,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };

            const candidate = createInputCandidate(char);
            expect(candidate.alternatives).toHaveLength(1);
            expect(candidate.alternatives).toEqual(['C']);
            expect(candidate.isSkippedVowel).toBe(false);
        });

        it('should handle diacritics correctly with optional transformation', (): void => {
            const char: InputCharacter = {
                original: 'é',
                uppercase: 'É',
                uppercaseWithoutDiacritics: 'E',
                transformed: 'E',
                isVowel: true,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: true,
                isLatin: true
            };

            const candidate = createInputCandidate(char);
            expect(candidate.input.uppercaseWithoutDiacritics).toBe('E');
            expect(candidate.alternatives).toEqual(['E', '3']);
            expect(candidate.isSkippedVowel).toBe(false);
        });
    });

    describe('createAlternatives', () => {
        it('should return only transformed character when no optional mapping exists', () => {
            const char: InputCharacter = {
                original: 'H',
                uppercase: 'H',
                uppercaseWithoutDiacritics: 'H',
                transformed: 'H',
                isVowel: false,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };
            expect(createAlternatives(char)).toEqual(['H']);
        });

        it('should return transformed and optional mapping in correct order', () => {
            const char: InputCharacter = {
                original: 'A',
                uppercase: 'A',
                uppercaseWithoutDiacritics: 'A',
                transformed: 'A',
                isVowel: true,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };
            expect(createAlternatives(char)).toEqual(['A', '4']);
        });

        it('should not duplicate alternatives when transformed matches optional mapping', () => {
            const char: InputCharacter = {
                original: 'A',
                uppercase: 'A',
                uppercaseWithoutDiacritics: 'A',
                transformed: '4', // Already transformed to the optional mapping
                isVowel: true,
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            };
            expect(createAlternatives(char)).toEqual(['4']);
        });
    });

    describe('createInitialPlateCandidates', () => {
        it('should create single group for single character', () => {
            const input = 'x'.split('').map(createTestCharacter);
            const result = createInitialPlateCandidates(input);
            expect(result.length, `Expected single candidate but got ${result.length} candidates: ${JSON.stringify(result, null, 2)}`).toBe(1);
            expect(result[0].wordGroup, `Expected wordGroup 0 but got ${result[0].wordGroup} for candidate: ${JSON.stringify(result[0], null, 2)}`).toBe(0);
        });

        it('should create single group for character with leading space', () => {
            const input = ' x'.split('').map(createTestCharacter);
            const result = createInitialPlateCandidates(input);
            expect(result.length, `Expected single candidate but got ${result.length} candidates: ${JSON.stringify(result, null, 2)}`).toBe(1);
            expect(result[0].wordGroup, `Expected wordGroup 0 but got ${result[0].wordGroup} for candidate: ${JSON.stringify(result[0], null, 2)}`).toBe(0);
        });

        it('should create single group for character with trailing space', () => {
            const input = 'x '.split('').map(createTestCharacter);
            const result = createInitialPlateCandidates(input);
            expect(result.length, `Expected single candidate but got ${result.length} candidates: ${JSON.stringify(result, null, 2)}`).toBe(1);
            expect(result[0].wordGroup, `Expected wordGroup 0 but got ${result[0].wordGroup} for candidate: ${JSON.stringify(result[0], null, 2)}`).toBe(0);
        });

        it('should create two groups for two characters separated by space', () => {
            const input = 'x y'.split('').map(createTestCharacter);
            const result = createInitialPlateCandidates(input);
            expect(result.length, `Expected 2 candidates but got ${result.length} candidates: ${JSON.stringify(result, null, 2)}`).toBe(2);
            expect(result[0].wordGroup, `Expected first candidate wordGroup 0 but got ${result[0].wordGroup}. Full result: ${JSON.stringify(result, null, 2)}`).toBe(0);
            expect(result[1].wordGroup, `Expected second candidate wordGroup 1 but got ${result[1].wordGroup}. Full result: ${JSON.stringify(result, null, 2)}`).toBe(1);
        });

        it('should create two groups for two characters separated by comma', () => {
            const input = 'x,z'.split('').map(createTestCharacter);
            const result = createInitialPlateCandidates(input);
            expect(result.length, `Expected 2 candidates but got ${result.length} candidates: ${JSON.stringify(result, null, 2)}`).toBe(2);
            expect(result[0].wordGroup, `Expected first candidate wordGroup 0 but got ${result[0].wordGroup}. Full result: ${JSON.stringify(result, null, 2)}`).toBe(0);
            expect(result[1].wordGroup, `Expected second candidate wordGroup 1 but got ${result[1].wordGroup}. Full result: ${JSON.stringify(result, null, 2)}`).toBe(1);
        });
    });

    describe('addPaddingChars', () => {
        it('should not add padding when input is already PLATE_LENGTH', () => {
            const input = 'abcdefhi';
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));
            const originalLength = candidates.length;
            addPaddingChars(candidates);
            expect(candidates.length).toBe(originalLength);
        });

        it('should handle input longer than PLATE_LENGTH', () => {
            const input = 'abcdefhij';
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));
            addPaddingChars(candidates);
            expect(candidates.length).toBe(input.length);
        });

        it('should handle EL prefix case', () => {
            const input = 'elplate';
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));
            handleELPrefix(candidates);
            addPaddingChars(candidates);
            expect(candidates.length).toBe(PLATE_LENGTH);
            expect(candidates[0].isPadding).toBe(true);
        });

        it('should handle two word groups', () => {
            const input = 'a b';
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: char === ' ',
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));
            addPaddingChars(candidates);
            expect(candidates.length).toBe(PLATE_LENGTH);
            // First group
            expect(candidates[0].selected).toBe('A');
            expect(candidates[0].isPadding).toBe(false);
            // Padding after first group
            expect(candidates[1].isPadding).toBe(true);
            // Second group
            expect(candidates[2].selected).toBe('B');
            expect(candidates[2].isPadding).toBe(false);
            // Remaining padding
            expect(candidates.slice(3).every(c => c.isPadding)).toBe(true);
        });

        it('should handle four word groups with specific output', () => {
            const input = 'a b c d0';
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: char === ' ',
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));
            addPaddingChars(candidates);
            expect(candidates.length).toBe(PLATE_LENGTH);
            // First group: A
            expect(candidates[0].selected).toBe('A');
            expect(candidates[0].isPadding).toBe(false);
            // Padding after first group
            expect(candidates[1].isPadding).toBe(true);
            // Second group: B
            expect(candidates[2].selected).toBe('B');
            expect(candidates[2].isPadding).toBe(false);
            // Padding after second group
            expect(candidates[3].isPadding).toBe(true);
            // Third group: C
            expect(candidates[4].selected).toBe('C');
            expect(candidates[4].isPadding).toBe(false);
            // Padding after third group
            expect(candidates[5].isPadding).toBe(true);
            // Fourth group: D0
            expect(candidates[6].selected).toBe('D');
            expect(candidates[6].isPadding).toBe(false);
            expect(candidates[7].selected).toBe('0');
            expect(candidates[7].isPadding).toBe(false);
        });

        it('should not add padding between groups when no space available', () => {
            const input = 'a b c d e f g h';  // 8 single-letter groups
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: char === ' ',
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));
            addPaddingChars(candidates);
            expect(candidates.length).toBe(PLATE_LENGTH);
            // Verify no padding was added between groups
            expect(candidates.every(c => !c.isPadding)).toBe(true);
            // Verify all characters are present in order
            expect(candidates.map(c => c.selected).join('')).toBe('ABCDEFGH');
        });
    });

    describe('setWordGroupBoundaries', () => {
        it('should set boundaries for a single word group', () => {
            const candidates: PlateCandidate[] = [
                {
                    input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true },
                    selected: 'A',
                    isPadding: false,
                    alternatives: ['A'],
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
                },
                {
                    input: { original: 'b', uppercase: 'B', uppercaseWithoutDiacritics: 'B', transformed: 'B', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true },
                    selected: 'B',
                    isPadding: false,
                    alternatives: ['B'],
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
                }
            ];

            setWordGroupBoundaries(candidates);

            expect(candidates[0].wordGroupBoundaryLeft).toBe(true);
            expect(candidates[0].wordGroupBoundaryRight).toBe(false);
            expect(candidates[1].wordGroupBoundaryLeft).toBe(false);
            expect(candidates[1].wordGroupBoundaryRight).toBe(true);
        });

        it('should set boundaries for multiple word groups', () => {
            const candidates: PlateCandidate[] = [
                {
                    input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true },
                    selected: 'A',
                    isPadding: false,
                    alternatives: ['A'],
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
                },
                {
                    input: { original: 'b', uppercase: 'B', uppercaseWithoutDiacritics: 'B', transformed: 'B', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true },
                    selected: 'B',
                    isPadding: false,
                    alternatives: ['B'],
                    isSkippedVowel: false,
                    wordGroup: 1,
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
                },
                {
                    input: { original: 'c', uppercase: 'C', uppercaseWithoutDiacritics: 'C', transformed: 'C', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true },
                    selected: 'C',
                    isPadding: false,
                    alternatives: ['C'],
                    isSkippedVowel: false,
                    wordGroup: 2,
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
                }
            ];

            setWordGroupBoundaries(candidates);

            expect(candidates[0].wordGroupBoundaryLeft).toBe(true);
            expect(candidates[0].wordGroupBoundaryRight).toBe(true);
            expect(candidates[1].wordGroupBoundaryLeft).toBe(true);
            expect(candidates[1].wordGroupBoundaryRight).toBe(true);
            expect(candidates[2].wordGroupBoundaryLeft).toBe(true);
            expect(candidates[2].wordGroupBoundaryRight).toBe(true);
        });

        it('should handle skipped vowels and padding correctly', () => {
            const candidates: PlateCandidate[] = [
                {
                    input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true },
                    selected: 'A',
                    isPadding: false,
                    alternatives: ['A'],
                    isSkippedVowel: true,  // Skipped vowel
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
                },
                {
                    input: { original: 'b', uppercase: 'B', uppercaseWithoutDiacritics: 'B', transformed: 'B', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true },
                    selected: 'B',
                    isPadding: false,
                    alternatives: ['B'],
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
                },
                {
                    input: { original: 'A', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: false, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true },
                    selected: 'A',
                    isPadding: true,  // Padding character
                    alternatives: VALID_CHARS,
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
                }
            ];

            setWordGroupBoundaries(candidates);

            // Skipped vowel should be ignored
            expect(candidates[0].wordGroupBoundaryLeft).toBe(false);
            expect(candidates[0].wordGroupBoundaryRight).toBe(false);
            // First non-skipped character should have left boundary
            expect(candidates[1].wordGroupBoundaryLeft).toBe(true);
            expect(candidates[1].wordGroupBoundaryRight).toBe(true);
            // Padding should be ignored
            expect(candidates[2].wordGroupBoundaryLeft).toBe(false);
            expect(candidates[2].wordGroupBoundaryRight).toBe(false);
        });

        it('should handle empty candidates array', () => {
            const candidates: PlateCandidate[] = [];
            setWordGroupBoundaries(candidates);
            expect(candidates).toEqual([]);
        });

        it('should handle single character', () => {
            const candidates: PlateCandidate[] = [
                {
                    input: { original: 'a', uppercase: 'A', uppercaseWithoutDiacritics: 'A', transformed: 'A', isVowel: true, isWhitespace: false, isSymbol: false, isDiacritic: false, isLatin: true },
                    selected: 'A',
                    isPadding: false,
                    alternatives: ['A'],
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
                }
            ];

            setWordGroupBoundaries(candidates);

            expect(candidates[0].wordGroupBoundaryLeft).toBe(true);
            expect(candidates[0].wordGroupBoundaryRight).toBe(true);
        });
    });

    describe('handleFiveCharInput', () => {
        it('should add three padding characters at the start for standalone 5-character input', () => {
            const input = 'PLATE';
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: false,
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));

            handleFiveCharInput(candidates);
            expect(candidates.length).toBe(8);
            // First three characters should be padding
            expect(candidates[0].isPadding).toBe(true);
            expect(candidates[1].isPadding).toBe(true);
            expect(candidates[2].isPadding).toBe(true);
            // Next five characters should be the original input
            expect(candidates.slice(3).map(c => c.selected).join('')).toBe('PLATE');
        });

        it('should place 5-character group at the end after a single character', () => {
            const input = 'x 12345';
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: char === ' ',
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));

            handleFiveCharInput(candidates);
            addPaddingChars(candidates);

            expect(candidates.length).toBe(8);
            // First character should be X
            expect(candidates[0].selected).toBe('X');
            // Next two should be padding
            expect(candidates[1].isPadding).toBe(true);
            expect(candidates[2].isPadding).toBe(true);
            // Last five should be 12345
            expect(candidates.slice(3).map(c => c.selected).join('')).toBe('12345');
        });

        it('should not affect input where 5-character group is not at the end', () => {
            const input = 'x 12345 y';
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: char === ' ',
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));

            const beforeGroup = candidates.filter(c => !c.isPadding && c.wordGroup === 1);
            handleFiveCharInput(candidates);
            const afterGroup = candidates.filter(c => !c.isPadding && c.wordGroup === 1);
            // The 5-character group (group 1) should remain in the same relative position
            expect(afterGroup).toEqual(beforeGroup);
        });

        it('should handle input with skipped vowels correctly', () => {
            const input = 'x aeiou';  // 5 vowels that will be skipped
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: char === ' ',
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));

            // Mark vowels as skipped
            candidates.forEach(c => {
                if (c.input.isVowel) {
                    c.isSkippedVowel = true;
                }
            });

            const originalCandidates = JSON.parse(JSON.stringify(candidates));
            handleFiveCharInput(candidates);
            // Should not move skipped vowels
            expect(candidates).toEqual(originalCandidates);
        });

        it('should handle multiple word groups with numbers correctly', () => {
            const input = 'abc 12345 def 67890';
            const candidates = createInitialPlateCandidates(input.split('').map(char => ({
                original: char,
                uppercase: char.toUpperCase(),
                uppercaseWithoutDiacritics: char.toUpperCase(),
                transformed: char.toUpperCase(),
                isVowel: /[AEIOUY]/i.test(char),
                isWhitespace: char === ' ',
                isSymbol: false,
                isDiacritic: false,
                isLatin: true
            })));

            handleFiveCharInput(candidates);
            // The last group of 5 (67890) should be at the end
            const lastFive = candidates.slice(-5).map(c => c.selected).join('');
            expect(lastFive).toBe('67890');
        });
    });

    describe('createVowelAndCandidatesData', () => {
        it('should process input with skipped vowels I and U correctly', () => {
            const result = processInput('abecodifuh');
            const { vowelIndicatorData, plateCandidatesData } = createVowelAndCandidatesData(result.candidates);

            // Check vowel indicator data
            expect(getVowelValues(vowelIndicatorData.vowels)).toEqual([
                null, null, null, null, null, null, 'I', 'U', null
            ]);
            expect(vowelIndicatorData.metadata.errors).toEqual([]);

            // Check plate candidates data
            expect(getCandidateValues(plateCandidatesData.candidates)).toEqual(['A', 'B', 'E', 'C', '0', 'D', 'F', 'H']);
            expect(plateCandidatesData.metadata.errors).toEqual([]);
        });

        it('should process input with two consecutive vowel positions', () => {
            const result = processInput('aeboddffhhh');
            const { vowelIndicatorData, plateCandidatesData } = createVowelAndCandidatesData(result.candidates);

            expect(vowelIndicatorData.metadata.errors).toEqual(['vowelIndicator.errors.consecutiveVowels']);

            // Check plate candidates data
            expect(getCandidateValues(plateCandidatesData.candidates)).toEqual(['8', 'D', 'D', 'F', 'F', 'H', 'H', 'H']);
            expect(plateCandidatesData.metadata.errors).toEqual([]);
        });
    });
});
