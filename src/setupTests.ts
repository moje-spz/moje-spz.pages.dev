/// <reference types="vitest" />

import { vi } from 'vitest';

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

const store = new Map<string, string>();

window.localStorage = {
    clear(): void {
        store.clear();
    },
    getItem(key: string): string | null {
        return store.get(key) || null;
    },
    setItem(key: string, value: string): void {
        store.set(key, String(value));
    },
    removeItem(key: string): void {
        store.delete(key);
    },
    key(index: number): string | null {
        return Array.from(store.keys())[index] || null;
    },
    get length(): number {
        return store.size;
    }
};

// Clear localStorage before each test
beforeEach((): void => {
    store.clear();
    vi.clearAllMocks();
});
