// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import type { LocaleCode } from './i18n';

export interface InputCharacter {
  // the original character without any transformations
  original: string;
  // the original character in uppercase
  uppercase: string;
  // the original character without diacritics and in uppercase
  uppercaseWithoutDiacritics: string;
  // either original mapped to mandatory number or the uppercase without diacritics
  transformed: string;

  // upper case input without diacritics is a vowel (A, E, I, O, U, Y)
  isVowel: boolean;
  isWhitespace: boolean;
  // within ASCII symbol range
  isSymbol: boolean;
  isDiacritic: boolean;
  // within latin blocks (Latin Block, Latin Extended-A, Latin Extended-B)
  isLatin: boolean;
}

export interface PlateMetadata {
  hasDiacritics: boolean;
  hasSymbols: boolean;
  hasWhitespace: boolean;
  hasNonLatin: boolean;
  isValid: boolean;
  errorMessage: string;
  lastChangeCounter: number;
}

export type ShiftButtonDisabledReason = 'boundaryReached' | 'nonPaddingCharFound';

export interface ShiftButtonState {
  canBeEnabled: boolean;
  disabledReason?: ShiftButtonDisabledReason;
}

export interface PlateCandidate {
  input: InputCharacter;
  // does not come from user input but is added to the plate number to make it correct length
  isPadding: boolean;
  // alternatives are characters that could be used instead of the input character to make the plate number correct
  alternatives: string[];
  // character selected from the alternatives
  selected: string;
  isSkippedVowel: boolean;
  // indicates which word group this character belongs to, starting from 0
  wordGroup: number;
  wordGroupBoundaryLeft: boolean;
  wordGroupBoundaryRight: boolean;
  // states of shift buttons
  leftShiftState: ShiftButtonState;
  rightShiftState: ShiftButtonState;
  // tracks when this character was last changed by user
  lastChanged: number;
}

export interface PlateData {
  input: string;
  candidates: PlateCandidate[];
  metadata: PlateMetadata;
}

export type WarningType = 'diacritics' | 'symbols' | 'whitespace';

export interface SavedPlateEntry {
  input: string;
  plateNumber: string;
  vowels: string;
}

export type Theme = 'light' | 'dark';

export interface ThemeStore {
  subscribe: (run: (value: Theme) => void) => () => void;
  setTheme: (theme: Theme) => void;
}

export type Language = LocaleCode;

export interface LanguageStore {
  subscribe: (run: (value: Language) => void) => () => void;
  set: (value: Language) => void;
}

export interface VowelIndicatorData {
  vowels: (PlateCandidate | null)[];
  metadata: {
    errors: string[];
  };
}

export interface PlateCandidatesData {
  candidates: PlateCandidate[];
  metadata: {
    errors: string[];
  };
}
