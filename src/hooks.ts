// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    return await resolve(event);
};

export function handleError(error: Error): { message: string } {
    return {
        message: error.message
    };
}

export function init(): void {
    // Initialization logic if needed
}

export function reroute(): void {
    // Rerouting logic if needed
}

export const transport = {
    // Transport configuration if needed
};
