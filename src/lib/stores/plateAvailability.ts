import { writable } from 'svelte/store';

// Store to track when the CSV data is updated
export const plateAvailabilityVersion = writable(0);

// Function to notify all components that the data has been updated
export function notifyPlateAvailabilityUpdate(): void {
    plateAvailabilityVersion.update(n => n + 1);
}
