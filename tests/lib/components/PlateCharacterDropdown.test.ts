import { describe, it, expect } from 'vitest';
import { separatePlateCharacters } from '../../../src/lib/components/plateCharacterUtils';

describe('PlateCharacterDropdown', () => {
    describe('separatePlateCharacters', () => {
        it('should correctly separate numbers and letters', () => {
            const input = ['A', 'B', 'C', 'D', 'E', 'F', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            const result = separatePlateCharacters(input);
            expect(result.numbers).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
            expect(result.letters).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z']);
        });

        it('should handle only numbers', () => {
            const input = ['1', '2', '3', '4'];
            const result = separatePlateCharacters(input);
            expect(result.numbers).toEqual(['1', '2', '3', '4']);
            expect(result.letters).toEqual([]);
        });

        it('should handle small amount of alternatives', () => {
            const input = ['A', '4'];
            const result = separatePlateCharacters(input);
            expect(result.numbers).toEqual(['4']);
            expect(result.letters).toEqual(['A']);
        });
    });
});
