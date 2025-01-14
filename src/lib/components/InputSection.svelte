<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
	import type { PlateData } from '../types';
	import { processInput } from '../plateProcessor';
	import { _ } from 'svelte-i18n';
	import { isLocaleLoaded } from '$lib/i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';

	export let initialValue = '';
	export let index: number | undefined = undefined;
	export let shouldFocus = false;

	const dispatch = createEventDispatcher<{
		platedata: PlateData[];
		focus: void;
		blur: void;
	}>();
	const MAX_INPUT_LENGTH = 24;

	let inputValue = initialValue;
	let inputElement: HTMLInputElement;
	let previousShouldFocus = false;
	let plateData: PlateData[] = [];

	function handleInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		const newValue = input.value.slice(0, MAX_INPUT_LENGTH).trim();
		if (input.value !== newValue) {
			input.value = newValue;
		}
		inputValue = newValue;
		if (!newValue) {
			plateData = [];
		} else {
			const processedData = processInput(newValue);
			plateData = [processedData];
		}
		// Always dispatch plateData to maintain input state, even if invalid
		dispatch('platedata', plateData);
	}

	function handleFocus() {
		dispatch('focus');
	}

	function handleBlur() {
		dispatch('blur');
	}

	onMount(() => {
		if (initialValue) {
			inputValue = initialValue;
		}
		if (shouldFocus && inputElement) {
			inputElement.focus();
		}
	});

	$: if (shouldFocus && !previousShouldFocus && inputElement) {
		inputElement.focus();
		previousShouldFocus = shouldFocus;
	} else if (!shouldFocus && previousShouldFocus) {
		previousShouldFocus = shouldFocus;
	}

	$: if (initialValue !== undefined) {
		inputValue = initialValue;
	}

	$: inputId = index !== undefined ? `plate-input-${index}` : 'plate-input-main';
	$: inputSectionId =
		index !== undefined ? `plate-input-section-${index}` : 'plate-input-section-main';
</script>

<div id={inputSectionId} data-testid="plate-input-section" class="flex flex-col items-center">
	<div class="relative w-full">
		<input
			type="text"
			bind:this={inputElement}
			bind:value={inputValue}
			on:input={handleInput}
			on:focus={handleFocus}
			on:blur={handleBlur}
			maxlength={MAX_INPUT_LENGTH}
			inputmode="text"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false"
			placeholder={$isLocaleLoaded ? $_('inputSection.placeholder') : ''}
			class="w-full p-2 {inputValue
				? 'px-10'
				: ''} font-mono text-center text-gray-900 uppercase bg-white border border-gray-300 rounded-md placeholder:normal-case dark:text-gray-100 placeholder-gray-900/75 dark:placeholder-gray-100/75 placeholder:text-base dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			data-testid="single-line-input"
			id={inputId}
		/>
		{#if inputValue}
			<button
				type="button"
				class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
				on:click={() => {
					inputValue = '';
					dispatch('platedata', []);
					inputElement.focus();
				}}
				data-testid="clear-input-button"
				aria-label={$_('inputSection.clearInput')}
			>
				<FontAwesomeIcon icon={faXmark} class="w-5 h-5" />
			</button>
		{/if}
	</div>
	{#if inputValue && (plateData[0]?.candidates.length > 0 || plateData[0]?.metadata.hasDiacritics || plateData[0]?.metadata.errorMessage)}
		<div data-testid="input-warning-section" class="flex items-center justify-center h-4 my-3">
			{#if plateData[0]?.metadata.hasDiacritics}
				<div
					class="leading-none text-amber-600 dark:text-amber-400"
					data-testid="diacritics-warning"
				>
					{$_('plateDisplay.diacriticsWarning')}
				</div>
			{/if}
		</div>
	{/if}
</div>
