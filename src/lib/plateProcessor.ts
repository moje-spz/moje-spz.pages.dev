// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import type { PlateData, InputCharacter, PlateMetadata, PlateCandidate, VowelIndicatorData, PlateCandidatesData } from './types';
import { get } from 'svelte/store';
import { defaultPaddingChar } from './stores/preferences';
import { VALID_CHARS } from './constants';

export { VALID_CHARS };

const REQUIRED_MAPPINGS: Record<string, string> = {
  'G': '6',
  'Q': '6',
  'W': '3',
  'O': '0'
};

const OPTIONAL_MAPPINGS: Record<string, string> = {
  'I': '1',
  'S': '5',
  'A': '4',
  'B': '8',
  'E': '3'
};

// Characters that must be transformed and cannot appear in output
const MANDATORY_TRANSFORMS = new Set(Object.keys(REQUIRED_MAPPINGS));

export const PADDING_CHAR = VALID_CHARS[0];
export const PLATE_LENGTH = 8;

/**
 * Creates an array of alternatives for a plate candidate.
 * The alternatives array will contain:
 * 1. The transformed character (e.g., 'O' -> '0', 'G' -> '6')
 * 2. Optional number mapping if available (e.g., 'A' -> '4', 'B' -> '8')
 * The array will maintain order and have no duplicates.
 * @param char The input character data
 * @returns Array of alternatives for the character, with transformed character first
 */
export function createAlternatives(char: InputCharacter): string[] {
  const alternatives = [char.transformed];

  // Add optional mapping if available and different from transformed
  const optionalMapping = OPTIONAL_MAPPINGS[char.uppercaseWithoutDiacritics];
  if (optionalMapping && optionalMapping !== char.transformed) {
    alternatives.push(optionalMapping);
  }

  return alternatives;
}

export function createInputCandidate(char: InputCharacter): PlateCandidate {
  const isMandatoryTransform = MANDATORY_TRANSFORMS.has(char.uppercaseWithoutDiacritics);
  const requiredMapping = REQUIRED_MAPPINGS[char.uppercaseWithoutDiacritics];
  const optionalMapping = OPTIONAL_MAPPINGS[char.uppercaseWithoutDiacritics];

  const selected = isMandatoryTransform ? requiredMapping : char.transformed;
  const alternatives = isMandatoryTransform ?
    [requiredMapping] :
    optionalMapping ?
      [char.transformed, optionalMapping] :
      [char.transformed];

  return {
    input: char,
    isPadding: false,
    alternatives,
    selected,
    isSkippedVowel: false,
    wordGroup: 0,
    wordGroupBoundaryLeft: false,
    wordGroupBoundaryRight: false,
    leftShiftState: { canBeEnabled: false },
    rightShiftState: { canBeEnabled: false },
    lastChanged: 0
  };
}

function findNumberInAlternatives(candidate: PlateCandidate): string | null {
  // First check if selected is already a number
  if (/\d/.test(candidate.selected)) {
    return candidate.selected;
  }
  // Then check alternatives for numbers
  const numberAlternative = candidate.alternatives.find(alt => /\d/.test(alt));
  if (numberAlternative) {
    return numberAlternative;
  }
  // Finally check if input can be mapped to a number
  if (!candidate.isPadding) {
    const mapping = REQUIRED_MAPPINGS[candidate.input.uppercaseWithoutDiacritics] || OPTIONAL_MAPPINGS[candidate.input.uppercaseWithoutDiacritics];
    if (mapping && /\d/.test(mapping)) {
      return mapping;
    }
  }
  return null;
}

class TooManyConsonantsError extends Error {
  constructor() {
    super('inputSection.errors.tooManyConsonants');
    this.name = 'TooManyConsonantsError';
    // Hide the message from being displayed directly
    Object.defineProperty(this, 'message', { enumerable: false });
  }
}

class NoPositionForNumberError extends Error {
  constructor() {
    super('inputSection.errors.noPositionForNumber');
    this.name = 'NoPositionForNumberError';
    // Hide the message from being displayed directly
    Object.defineProperty(this, 'message', { enumerable: false });
  }
}

export function ensureAtLeastOneNumber(candidates: PlateCandidate[]): void {
  // First try padding characters from right to left
  for (let i = candidates.length - 1; i >= 0; i--) {
    if (candidates[i].isPadding) {
      const number = findNumberInAlternatives(candidates[i]);
      if (number) {
        candidates[i].selected = number;
        return;
      }
    }
  }

  // If no padding character was available, try mapping non-padding characters from left to right
  for (let i = 0; i < candidates.length; i++) {
    const number = findNumberInAlternatives(candidates[i]);
    if (number) {
      candidates[i].selected = number;
      return;
    }
  }

  // If we get here, we couldn't add a number
  throw new NoPositionForNumberError();
}

/**
 * Gets the effective padding character to use.
 * Returns the stored padding character if set, otherwise returns the first valid character.
 */
export function getPreferredPaddingChar(): string {
  const storedPaddingChar = get(defaultPaddingChar);
  return storedPaddingChar || VALID_CHARS[0];
}

export function createPaddingCandidate(): PlateCandidate {
  const paddingChar = getPreferredPaddingChar();
  return {
    input: {
      original: paddingChar,
      uppercase: paddingChar,
      uppercaseWithoutDiacritics: paddingChar,
      transformed: paddingChar,
      isVowel: false,
      isWhitespace: false,
      isSymbol: false,
      isDiacritic: false,
      isLatin: true
    },
    isPadding: true,
    alternatives: VALID_CHARS,
    selected: paddingChar,
    isSkippedVowel: false,
    wordGroup: 0,
    wordGroupBoundaryLeft: false,
    wordGroupBoundaryRight: false,
    leftShiftState: { canBeEnabled: false },
    rightShiftState: { canBeEnabled: false },
    lastChanged: 0
  };
}

function getNonSkippedCandidates(candidates: PlateCandidate[]): PlateCandidate[] {
  return candidates.filter(c => !c.isSkippedVowel);
}

function hasNumberInSelected(candidates: PlateCandidate[]): boolean {
  return candidates.some(c => /\d/.test(c.selected));
}

export function createPlateNumber(candidates: PlateCandidate[]): string {
  return getNonSkippedCandidates(candidates).map(c => c.selected).join('');
}

/**
 * Creates initial plate candidates from input characters.
 * @param characters Array of input characters
 * @returns Array of plate candidates
 */
export function createInitialPlateCandidates(characters: InputCharacter[]): PlateCandidate[] {
  const candidates: PlateCandidate[] = [];
  let currentWordGroup = 0;
  let previousWasNonSeparator = false;

  for (const char of characters) {
    if (char.isWhitespace || char.isSymbol) {
      if (currentWordGroup === 0 && !previousWasNonSeparator) {
        // Skip initial separators
        continue;
      }
      if (previousWasNonSeparator) {
        currentWordGroup++;
      }
      previousWasNonSeparator = false;
      continue;
    }
    previousWasNonSeparator = true;

    candidates.push({
      input: char,
      isPadding: false,
      alternatives: createAlternatives(char),
      selected: char.transformed,
      isSkippedVowel: false,
      wordGroup: currentWordGroup,
      wordGroupBoundaryLeft: false,
      wordGroupBoundaryRight: false,
      leftShiftState: { canBeEnabled: false },
      rightShiftState: { canBeEnabled: false },
      lastChanged: 0
    });
  }

  return candidates;
}

function removeVowels(candidates: PlateCandidate[]): void {
  if (candidates.length > PLATE_LENGTH) {
    const vowelsToRemove = candidates.length - PLATE_LENGTH;
    let remainingVowelsToRemove = vowelsToRemove;

    // First pass: Loop from end to start, marking vowels as skipped if right neighbor is not skipped
    for (let i = candidates.length - 1; i >= 0 && remainingVowelsToRemove > 0; i--) {
      if (candidates[i].input.isVowel) {
        // Check if right neighbor is not skipped
        const rightNeighborIsSkipped = i < candidates.length - 1 && candidates[i + 1].isSkippedVowel;
        if (!rightNeighborIsSkipped) {
          candidates[i].isSkippedVowel = true;
          remainingVowelsToRemove--;
        }
      }
    }

    // Second pass: If we still need to remove vowels, ignore neighboring skipped vowels
    if (remainingVowelsToRemove > 0) {
      for (let i = candidates.length - 1; i >= 0 && remainingVowelsToRemove > 0; i--) {
        if (candidates[i].input.isVowel && !candidates[i].isSkippedVowel) {
          candidates[i].isSkippedVowel = true;
          remainingVowelsToRemove--;
        }
      }
    }

    // If we couldn't remove enough vowels, throw error
    if (remainingVowelsToRemove > 0) {
      throw new TooManyConsonantsError();
    }
  }
}

/**
 * Handles special case for 'EL' prefix in plate numbers.
 * If the first two characters are 'EL', applies specific transformations
 * based on the length of candidates.
 */
export function handleELPrefix(candidates: PlateCandidate[]): void {
  if (candidates.length >= 2) {
    const firstTwo = candidates.slice(0, 2).map(c => c.selected).join('');
    if (firstTwo === 'EL') {
      if (candidates.length === PLATE_LENGTH) {
        // Case 3: If we have full length, transform E to 3
        candidates[0].selected = '3';
        candidates[0].alternatives = ['3'];
      } else if (candidates.length === PLATE_LENGTH - 1) {
        // Case 2: If we need one padding char, add 0 at start
        const padding = createPaddingCandidate();
        padding.selected = '0';
        candidates.unshift(padding);
      } else {
        // Case 1: If we need more padding, shift right and add A at start
        candidates.unshift(createPaddingCandidate());
      }
    }
  }
}

/**
 * Handles special case for 5-character inputs by either:
 * a) Adding three padding characters at the start if it's a standalone 5-character group
 * b) Adding two padding characters between a single character and the 5-character group
 * This should be called before regular padding is added.
 */
export function handleFiveCharInput(candidates: PlateCandidate[]): void {
  // Find groups of 5 non-skipped characters
  const groups = new Map<number, PlateCandidate[]>();
  candidates.forEach(c => {
    if (!c.isPadding && !c.isSkippedVowel) {
      if (!groups.has(c.wordGroup)) {
        groups.set(c.wordGroup, []);
      }
      groups.get(c.wordGroup)?.push(c);
    }
  });

  // Find a group of exactly 5 characters
  for (const [groupNum, groupCandidates] of groups) {
    if (groupCandidates.length === 5) {
      // Case a: If this is the only non-padding group
      const otherGroups = Array.from(groups.entries()).filter(([num]) => num !== groupNum);
      if (otherGroups.length === 0) {
        // Add padding characters at the start until we reach 8 total characters
        while (candidates.length < 8) {
          candidates.unshift(createPaddingCandidate());
        }
      }
      // Case b: If there is exactly one other group with a single character
      else if (otherGroups.length === 1 && otherGroups[0][1].length === 1) {
        // Remove the 5-character group
        const indices = groupCandidates.map(c => candidates.indexOf(c));
        const removed = indices.sort((a, b) => b - a).map(i => candidates.splice(i, 1)[0]);

        // Add two padding characters after the single character
        const singleCharGroupNum = otherGroups[0][0];
        const singleCharIndex = candidates.findIndex(c => c.wordGroup === singleCharGroupNum);
        candidates.splice(singleCharIndex + 1, 0, createPaddingCandidate(), createPaddingCandidate());

        // Add the 5-character group back at the end
        candidates.push(...removed.reverse());
      }
      break;
    }
  }
}

/**
 * Adds padding characters to the array until it reaches PLATE_LENGTH.
 * Inserts padding characters after word group changes and at the end if needed.
 * Modifies the candidates array in place.
 */
export function addPaddingChars(candidates: PlateCandidate[]): void {
  if (candidates.length >= PLATE_LENGTH) {
    return;
  }

  // First pass: Insert padding after word group changes
  let lastWordGroup = 0;
  for (let i = 0; i < candidates.length && candidates.length < PLATE_LENGTH; i++) {
    const currentCandidate = candidates[i];
    if (currentCandidate.isPadding) {
      // Skip padding - most likely at the beginning of the plate number because of "EL" prefix
      continue;
    }

    const currentWordGroup = currentCandidate.wordGroup;
    if (i > 0 && currentWordGroup !== lastWordGroup) {
      const padding = createPaddingCandidate();
      candidates.splice(i, 0, padding);
      i++; // Skip the padding we just inserted
    }

    lastWordGroup = currentWordGroup;
  }

  // Second pass: Fill remaining space with padding at the end
  while (candidates.length < PLATE_LENGTH) {
    const padding = createPaddingCandidate();
    candidates.push(padding);
  }
}

/**
 * Sets word group boundaries for candidates.
 * This should be called after skipping vowels but before adding padding chars.
 */
export function setWordGroupBoundaries(candidates: PlateCandidate[]): void {
  // First reset all boundaries
  candidates.forEach(c => {
    c.wordGroupBoundaryLeft = false;
    c.wordGroupBoundaryRight = false;
  });

  let currentWordGroup = -1;
  let rightBoundaryCandidate: PlateCandidate | null = null;

  for (let i = 0; i < candidates.length; i++) {
    const currentCandidate = candidates[i];
    if (currentCandidate.isPadding || currentCandidate.isSkippedVowel) {
      continue;
    }

    // Handle first visible character
    if (currentWordGroup === -1) {
      currentCandidate.wordGroupBoundaryLeft = true;
    } else if (currentCandidate.wordGroup !== currentWordGroup) {
      // Word group boundary found
      if (rightBoundaryCandidate) {
        rightBoundaryCandidate.wordGroupBoundaryRight = true;
      }
      currentCandidate.wordGroupBoundaryLeft = true;
    }

    currentWordGroup = currentCandidate.wordGroup;
    rightBoundaryCandidate = currentCandidate;
  }

  // Set right boundary on the last visible character
  if (rightBoundaryCandidate) {
    rightBoundaryCandidate.wordGroupBoundaryRight = true;
  }
}

/**
 * Determines if shift buttons can be enabled for each candidate.
 * For each character:
 * - Left shift: checks characters to the left for padding/non-padding
 * - Right shift: checks characters to the right for padding/non-padding
 */
export function determineShiftButtonStates(candidates: PlateCandidate[]): void {
  // Process each candidate
  candidates.forEach((candidate, index) => {
    // Initialize states
    candidate.leftShiftState = { canBeEnabled: false };
    candidate.rightShiftState = { canBeEnabled: false };

    // Skip if current character is padding
    if (candidate.isPadding) {
      return;
    }

    // Check left shift possibility
    let foundPadding = false;
    let foundNonPadding = false;
    for (let i = index - 1; i >= 0; i--) {
      if (candidates[i].isPadding) {
        foundPadding = true;
        break;
      }
      if (!candidates[i].isPadding) {
        foundNonPadding = true;
        break;
      }
    }

    if (index === 0) {
      candidate.leftShiftState = {
        canBeEnabled: false,
        disabledReason: 'boundaryReached'
      };
    } else if (foundNonPadding) {
      candidate.leftShiftState = {
        canBeEnabled: false,
        disabledReason: 'nonPaddingCharFound'
      };
    } else if (foundPadding) {
      candidate.leftShiftState = {
        canBeEnabled: true
      };
    } else {
      candidate.leftShiftState = {
        canBeEnabled: false,
        disabledReason: 'boundaryReached'
      };
    }

    // Check right shift possibility
    foundPadding = false;
    foundNonPadding = false;
    for (let i = index + 1; i < candidates.length; i++) {
      if (candidates[i].isPadding) {
        foundPadding = true;
        break;
      }
      if (!candidates[i].isPadding) {
        foundNonPadding = true;
        break;
      }
    }

    if (index === candidates.length - 1) {
      candidate.rightShiftState = {
        canBeEnabled: false,
        disabledReason: 'boundaryReached'
      };
    } else if (foundNonPadding) {
      candidate.rightShiftState = {
        canBeEnabled: false,
        disabledReason: 'nonPaddingCharFound'
      };
    } else if (foundPadding) {
      candidate.rightShiftState = {
        canBeEnabled: true
      };
    } else {
      candidate.rightShiftState = {
        canBeEnabled: false,
        disabledReason: 'boundaryReached'
      };
    }
  });
}

function processChar(char: string): InputCharacter {
  const decomposedUnicode = char.normalize('NFKD');
  const withoutDiacritics = decomposedUnicode.replace(/[\u0300-\u036f]/g, '');
  const uppercase = char.toUpperCase();
  const uppercaseWithoutDiacritics = withoutDiacritics.toUpperCase();
  const composedUnicode = char.normalize('NFKC');

  return {
    original: char,
    uppercase,
    uppercaseWithoutDiacritics,
    transformed: REQUIRED_MAPPINGS[uppercaseWithoutDiacritics] || uppercaseWithoutDiacritics,

    isVowel: /[AEIOUY]/.test(uppercaseWithoutDiacritics),
    isWhitespace: /\s/.test(decomposedUnicode),
    isSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/i.test(decomposedUnicode),
    isDiacritic: uppercase != uppercaseWithoutDiacritics,
    isLatin: /^[\u0000-\u007F\u0080-\u00FF\u0100-\u017F]*$/.test(composedUnicode),
  };
}

export function processInput(input: string): PlateData {
  const metadata: PlateMetadata = {
    hasDiacritics: false,
    hasSymbols: false,
    hasWhitespace: false,
    hasNonLatin: false,
    isValid: true,
    errorMessage: '',
    lastChangeCounter: 0
  };

  // Convert input to array of characters with metadata
  const characters = input.trim().split('').map(processChar);

  // Update metadata based on character properties
  metadata.hasDiacritics = characters.some(char => char.isDiacritic);
  metadata.hasWhitespace = characters.some(char => char.isWhitespace);
  metadata.hasSymbols = characters.some(char => char.isSymbol);
  metadata.hasNonLatin = characters.some(char => !char.isLatin);
  if (metadata.hasNonLatin) {
    metadata.isValid = false;
    metadata.errorMessage = 'Non-Latin script characters are not allowed';
  }

  // If all characters are whitespace or symbols, return empty candidates
  const hasNonWhitespaceAndNonSymbol = characters.some(char => !char.isWhitespace && !char.isSymbol);
  if (!hasNonWhitespaceAndNonSymbol) {
    return {
      input,
      candidates: [],
      metadata
    };
  }

  // Create initial plate candidates
  const candidates = createInitialPlateCandidates(characters);

  // Handle EL prefix - this might add (nonremovable) padding characters
  handleELPrefix(candidates);

  try {
    removeVowels(candidates);
  } catch (error) {
    if (error instanceof TooManyConsonantsError) {
      metadata.isValid = false;
      metadata.errorMessage = 'inputSection.errors.tooManyConsonants';
      return {
        input,
        candidates: [],
        metadata
      };
    }
    throw error; // Re-throw unexpected errors
  }

  // Handle 5-character inputs
  handleFiveCharInput(candidates);

  // Add padding after both special cases are handled
  addPaddingChars(candidates);

  setWordGroupBoundaries(candidates);

  // Apply mandatory transformations
  candidates.forEach(candidate => {
    const requiredMapping = REQUIRED_MAPPINGS[candidate.input.uppercaseWithoutDiacritics];
    if (requiredMapping) {
      candidate.selected = requiredMapping;
      candidate.alternatives = [requiredMapping];
    }
  });

  // Determine shift button states
  determineShiftButtonStates(candidates);

  // Check if we have a number in non-skipped candidates
  const nonSkippedCandidates = getNonSkippedCandidates(candidates);
  try {
    if (!hasNumberInSelected(nonSkippedCandidates)) {
      ensureAtLeastOneNumber(nonSkippedCandidates);
    }
  } catch (error) {
    if (error instanceof NoPositionForNumberError) {
      metadata.isValid = false;
      metadata.errorMessage = 'inputSection.errors.noPositionForNumber';
    } else {
      throw error; // Re-throw unexpected errors
    }
  }

  return {
    input,
    candidates,
    metadata
  };
}

export function createVowelAndCandidatesData(candidates: PlateCandidate[]): { vowelIndicatorData: VowelIndicatorData; plateCandidatesData: PlateCandidatesData } {
  const vowelIndicatorData: VowelIndicatorData = {
    vowels: Array(9).fill(null),
    metadata: {
      errors: []
    }
  };

  const plateCandidatesData: PlateCandidatesData = {
    candidates: [],
    metadata: {
      errors: []
    }
  };

  let candidateIndex = 0;
  let vowelArrayIndex = 0;
  let plateArrayIndex = 0;
  let isVowelTurn = true;

  while (candidateIndex < candidates.length) {
    const candidate = candidates[candidateIndex];

    if (isVowelTurn) {
      // Vowel array turn
      if (candidate.isSkippedVowel) {
        vowelIndicatorData.vowels[vowelArrayIndex] = candidate;
        candidateIndex++;
      } else {
        vowelIndicatorData.vowels[vowelArrayIndex] = null;
      }
      vowelArrayIndex++;
    } else {
      // Plate candidates turn
      if (!candidate.isSkippedVowel) {
        plateCandidatesData.candidates[plateArrayIndex] = candidate;
        plateArrayIndex++;
        candidateIndex++;
      } else {
        // Found a vowel during plate turn - error case
        vowelIndicatorData.metadata.errors.push('vowelIndicator.errors.consecutiveVowels');
        candidateIndex++;
      }
    }

    isVowelTurn = !isVowelTurn;
  }

  // Check array sizes and add errors if needed
  if (plateCandidatesData.candidates.filter((c) => c.selected !== null && c.selected !== '').length > 8) {
    plateCandidatesData.metadata.errors.push('plateDisplay.errors.tooManyConsonants');
  }

  // Check if there are any non-null vowels after position 9
  if (vowelIndicatorData.vowels.slice(9).some((v) => v !== null)) {
    vowelIndicatorData.metadata.errors.push('vowelIndicator.errors.tooManyVowels');
  }

  return { vowelIndicatorData, plateCandidatesData };
}
