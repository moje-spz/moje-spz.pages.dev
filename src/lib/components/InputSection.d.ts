declare module './InputSection.svelte' {
    import type { SvelteComponentTyped } from 'svelte';
    import type { PlateData } from '$lib/types';

    interface InputSectionProps {
        initialValue?: string;
        shouldFocus?: boolean;
        index?: number;
    }

    interface InputSectionEvents {
        platedata: CustomEvent<PlateData[]>;
        focus: CustomEvent<void>;
        blur: CustomEvent<void>;
    }

    interface InputSectionSlots {
        default: Record<string, never>;
    }

    export default class InputSection extends SvelteComponentTyped<InputSectionProps, InputSectionEvents, InputSectionSlots> { }
}
