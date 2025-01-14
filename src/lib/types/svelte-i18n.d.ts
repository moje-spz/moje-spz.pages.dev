declare module 'svelte-i18n' {
    import type { Readable, Writable } from 'svelte/store';

    export function init(options: { fallbackLocale: string; initialLocale: string }): void;
    export function addMessages(locale: string, messages: Record<string, unknown>): void;
    export function getLocaleFromNavigator(): string | undefined;

    export const _: Readable<(key: string, options?: { values?: Record<string, unknown> }) => string>;
    export const locale: Writable<string>;
    export const isLoading: Readable<boolean>;
    export const dictionary: Writable<Record<string, Record<string, unknown>>>;
}
