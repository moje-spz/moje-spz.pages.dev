// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import MultiLineInput from '../../../src/lib/components/MultiLineInput.svelte';

describe('MultiLineInput', () => {
    it('should dispatch togglemultiple event when clicked', async (): Promise<void> => {
        const { getByTestId, component } = render(MultiLineInput);
        let eventDispatched = false;

        component.$on('togglemultiple', () => {
            eventDispatched = true;
        });

        const button = getByTestId('multiple-input-button');
        expect(button).toBeTruthy();
        await fireEvent.click(button);

        expect(eventDispatched).toBe(true);
    });
});
