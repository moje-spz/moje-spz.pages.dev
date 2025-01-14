/**
 * Separates an array of plate characters into numbers and letters.
 * @param alternatives Array of plate characters to separate
 * @returns Object containing arrays of numbers and letters
 */
export function separatePlateCharacters(alternatives: string[]): { numbers: string[]; letters: string[] } {
    return {
        numbers: alternatives.filter((alt) => !isNaN(Number(alt))),
        letters: alternatives.filter((alt) => isNaN(Number(alt)))
    };
}
