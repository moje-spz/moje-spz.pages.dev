<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { plateStore } from '$lib/stores/plate';
	import type { PlateData } from '$lib/types';
	import { processInput } from '$lib/plateProcessor';
	import { createEventDispatcher } from 'svelte';

	export let value = '';
	export let placeholder = '';
	export let label = '';

	const dispatch = createEventDispatcher<{
		submit: void;
	}>();

	function handleInput() {
		const result = processInput(value);
		const plate: PlateData = {
			input: value,
			metadata: result.metadata,
			candidates: result.candidates
		};
		plateStore.update((plates) => [plate, ...plates]);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			dispatch('submit');
		}
	}
</script>

<div class="space-y-4">
	<div class="flex flex-col gap-2 plate-input">
		{#if label}
			<label for="plate-input" class="text-sm text-gray-700 dark:text-gray-300">{label}</label>
		{/if}
		<input
			id="plate-input"
			type="text"
			class="w-full p-2 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800"
			{placeholder}
			maxlength="24"
			bind:value
			on:input={handleInput}
			on:keydown={handleKeydown}
		/>
	</div>
</div>
