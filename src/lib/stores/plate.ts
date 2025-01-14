import { writable, type Writable } from 'svelte/store';
import type { PlateData } from '../types';

interface PlateStore extends Writable<PlateData[]> {
  clearSavedPlates: () => void;
  removeFromSavedPlates: (index: number) => void;
}

function createPlateStore(): PlateStore {
  const { subscribe, set, update } = writable<PlateData[]>([]);

  return {
    subscribe,
    set,
    update,
    clearSavedPlates: (): void => set([]),
    removeFromSavedPlates: (index: number): void => update(plates => plates.filter((_, i) => i !== index))
  };
}

export const plateStore = createPlateStore();
export const warnings = writable<string[]>([]);
export const errors = writable<string[]>([]);
