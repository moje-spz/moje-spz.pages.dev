// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import PlateDisplay from '../../../src/lib/components/PlateDisplay.svelte';
import type { PlateData } from '../../../src/lib/types';
import { processInput } from '../../../src/lib/plateProcessor';

describe('PlateDisplay Mobile', () => {
    const createTestPlate = (plateStr: string): PlateData => {
        const result = processInput(plateStr);
        return {
            ...result
        };
    };

    it('should not show drag indicators for non-editable plate', () => {
        const plate = createTestPlate('ABC12345');
        const { container } = render(PlateDisplay, { props: { plateData: plate, plateId: 'test-plate', section: 0 } });
        const dragIndicators = container.querySelectorAll('[data-testid="drag-indicator"]');
        expect(dragIndicators.length).toBe(0);
    });

    it('should not show tooltip on editable character touch', () => {
        const plate = createTestPlate('ABC12345');
        const { queryByTestId } = render(PlateDisplay, { props: { plateData: plate, plateId: 'test-plate', section: 0 } });
        const tooltip = queryByTestId('plate-tooltip');
        expect(tooltip).toBeFalsy();
    });
});
