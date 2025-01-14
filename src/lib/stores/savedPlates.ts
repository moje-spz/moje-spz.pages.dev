import { writable, type Writable } from 'svelte/store';
import type { PlateData } from '../types';

const STORAGE_KEY = 'savedPlates';

function createPersistentStore(): Writable<PlateData[]> {
    // Load initial data from localStorage if available
    const initialData = typeof localStorage !== 'undefined' ?
        JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') :
        [];

    const { subscribe, set, update } = writable<PlateData[]>(initialData);

    // Subscribe to changes and save to localStorage
    if (typeof localStorage !== 'undefined') {
        subscribe(value => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        });
    }

    return {
        subscribe,
        set,
        update
    };
}

export const savedPlates = createPersistentStore();
