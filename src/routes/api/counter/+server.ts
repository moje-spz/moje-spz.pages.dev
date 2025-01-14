// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Pavol Babinčák

import { json, type RequestEvent } from '@sveltejs/kit';

export const POST = async ({ platform }: RequestEvent): Promise<Response> => {
    if (!platform?.env.COUNTER) {
        return json({ error: 'Counter binding not configured' }, { status: 500 });
    }

    try {
        // Example of using a Durable Object
        const id = platform.env.COUNTER.idFromName('visits');
        const obj = platform.env.COUNTER.get(id);
        const resp = await obj.fetch('https://counter/increment');
        const count = await resp.json();

        // Example of using waitUntil for background tasks
        platform.context.waitUntil(
            Promise.resolve().then(() => {
                console.log('Background task completed');
            })
        );

        return json({ count });
    } catch (error: unknown) {
        console.error('Failed to increment counter:', error);
        return json({ error: 'Failed to increment counter' }, { status: 500 });
    }
};

export const GET = async ({ platform }: RequestEvent): Promise<Response> => {
    if (!platform?.env.COUNTER) {
        return json({ error: 'Counter binding not configured' }, { status: 500 });
    }

    try {
        const id = platform.env.COUNTER.idFromName('visits');
        const obj = platform.env.COUNTER.get(id);
        const resp = await obj.fetch('https://counter/get');
        const count = await resp.json();

        return json({ count });
    } catch (error: unknown) {
        console.error('Failed to get counter:', error);
        return json({ error: 'Failed to get counter' }, { status: 500 });
    }
};
