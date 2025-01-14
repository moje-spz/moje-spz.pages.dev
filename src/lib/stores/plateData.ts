import { writable } from 'svelte/store';
import type { PlateData } from '../types';

export const plateData = writable<PlateData>();
