// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ResultsSection from '../../../src/lib/components/ResultsSection.svelte';
import type { PlateData } from '../../../src/lib/types';
import { processInput } from '../../../src/lib/plateProcessor';

describe('ResultsSection', () => {
  const createTestPlate = (input: string): PlateData => processInput(input);

  describe('Empty State Handling', () => {
    it('should handle whitespace-only input correctly', async (): Promise<void> => {
      const { component } = render(ResultsSection);
      const plates = [createTestPlate('   ')];

      component.$set({ plateData: plates });

      // Verify "Add another plate" button is not present
      const addButton = document.querySelector('[data-testid="add-plate-button"]');
      expect(addButton).toBeFalsy();

      // Verify "Add another plate" is not shown as disabled span either
      const disabledText = document.querySelector('[data-testid="add-plate-disabled"]');
      expect(disabledText).toBeFalsy();
    });
  });

  describe('Add Plate Button Styling', () => {
    it('should have consistent styling with MultiLineInput button when enabled', () => {
      const plateData = [createTestPlate('ABC123')];
      const { container } = render(ResultsSection, { props: { plateData } });

      const addPlateButton = container.querySelector('[data-testid="add-plate-button"]');
      const multiLineButton = container.querySelector('[data-testid="multiple-input-button"]');

      expect(addPlateButton).toBeTruthy();
      expect(multiLineButton).toBeTruthy();

      // Both buttons should have the same text color classes
      expect(addPlateButton?.classList.contains('text-blue-500')).toBe(true);
      expect(addPlateButton?.classList.contains('hover:text-blue-700')).toBe(true);
      expect(addPlateButton?.classList.contains('dark:text-blue-400')).toBe(true);
      expect(addPlateButton?.classList.contains('dark:hover:text-blue-300')).toBe(true);
      expect(addPlateButton?.classList.contains('underline')).toBe(true);
    });

    it('should show loading placeholder when locale is not loaded', () => {
      const plateData = [createTestPlate('ABC123'), createTestPlate('')];
      const { container } = render(ResultsSection, { props: { plateData } });

      const addButton = container.querySelector('[data-testid="add-plate-button"]');
      expect(addButton).toBeFalsy();

      const disabledText = container.querySelector('[data-testid="add-plate-disabled"]');
      expect(disabledText).toBeTruthy();

      // When locale is not loaded, it should show a loading placeholder
      const loadingPlaceholder = disabledText?.querySelector('.animate-pulse');
      expect(loadingPlaceholder).toBeTruthy();
      expect(loadingPlaceholder?.classList.contains('bg-gray-200')).toBe(true);
      expect(loadingPlaceholder?.classList.contains('dark:bg-gray-700')).toBe(true);
    });
  });
});
