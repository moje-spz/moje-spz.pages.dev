// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

export const browser: boolean = typeof window !== 'undefined';
export const dev: boolean = import.meta.env.DEV;
export const building: boolean = import.meta.env.SSR;
