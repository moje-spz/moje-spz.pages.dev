<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { PlateData } from '../types';
	import InputSection from './InputSection.svelte';
	import PlateDisplay from './PlateDisplay.svelte';
	import MultiLineInput from './MultiLineInput.svelte';
	import { processInput } from '../plateProcessor';
	import { _ } from 'svelte-i18n';
	import AboutInline from './AboutInline.svelte';
	import AboutModal from './AboutModal.svelte';
	import UploadIssuedReservedPlatesModal from './UploadIssuedReservedPlatesModal.svelte';
	import { isLocaleLoaded } from '$lib/i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';

	function generateUUID(): string {
		if (typeof crypto !== 'undefined' && crypto.randomUUID) {
			try {
				return crypto.randomUUID();
			} catch (e) {
				// Fall through to backup implementation
			}
		}
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	export let plateData: PlateData[] = [];
	let focusedIndex: number | null = null;
	let shouldFocusLastPlate = false;
	let showAboutModal = false;
	let showUploadIssuedReservedPlatesModal = false;
	let plateSectionIds: string[] = [];
	let isMobile = false;

	$: if (typeof window !== 'undefined') {
		isMobile = window.innerWidth <= 640;
		window.addEventListener('resize', () => {
			isMobile = window.innerWidth <= 640;
		});
	}

	const dispatch = createEventDispatcher<{
		togglemultiple: void;
		platedata: PlateData[];
		plateAdded: { plateNumber: string };
	}>();

	function handlePlateData(event: CustomEvent<PlateData[]>, index: number) {
		const newPlateData = [...plateData];
		if (event.detail.length > 0) {
			newPlateData[index] = event.detail[0];
		} else {
			// Update the current section with empty input
			newPlateData[index] = processInput('');
			// Remove the section only if it's not focused and not the last empty section
			if (index !== focusedIndex && index !== plateData.length - 1) {
				newPlateData.splice(index, 1);
			}
		}
		plateData = newPlateData;
		dispatch('platedata', newPlateData);
	}

	function removePlateSection(index: number) {
		if (index > 0) {
			// Clear focus state before removing the section
			focusedIndex = null;
			shouldFocusLastPlate = false;
			const newPlateData = [...plateData];
			newPlateData.splice(index, 1);
			plateData = newPlateData;
			dispatch('platedata', newPlateData);
		}
	}

	function handleFocus(index: number) {
		focusedIndex = index;
	}

	function handleBlur() {
		focusedIndex = null;
	}

	function handleMultipleInput() {
		shouldFocusLastPlate = false;
		dispatch('togglemultiple');
	}

	function addNewPlate() {
		shouldFocusLastPlate = true;
		plateData = [...plateData, processInput('')];
		focusedIndex = plateData.length - 1;
		dispatch('platedata', plateData);
	}

	$: allInputsFilled = plateData.every((data) => data.input.trim().length > 0);
	$: hadNonEmptyInput = plateData.some((data) => data.input.trim().length > 0);

	// Initialize plateSectionIds when plateData changes
	$: {
		// Ensure we have an ID for each plate section
		while (plateSectionIds.length < plateData.length) {
			plateSectionIds.push(generateUUID());
		}
		// Remove extra IDs if we have too many
		if (plateSectionIds.length > plateData.length) {
			plateSectionIds = plateSectionIds.slice(0, plateData.length);
		}
	}
</script>

<div
	id="content-container"
	class="flex flex-col items-center w-full h-full gap-4 px-1 py-4 sm:px-2 lg:px-3"
	data-testid="results-section-wrapper"
>
	{#each plateData as plate, i}
		<div
			class="relative grid w-full py-4 mt-0 border border-gray-200 rounded-lg shadow-sm grid-cols-23 sm:py-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
			id="plate-section-{i}"
			data-testid="plate-section"
			data-section={i}
		>
			{#if i > 0}
				<button
					type="button"
					class="absolute flex items-center justify-center w-8 h-8 text-gray-500 -top-1 -right-1 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					on:click={() => removePlateSection(i)}
					aria-label={$isLocaleLoaded ? $_('inputSection.removePlate') : ''}
				>
					<FontAwesomeIcon icon={faXmark} class="w-5 h-5" />
				</button>
			{/if}
			<div
				class="col-start-4 col-span-17 row-start-[input-section]"
				data-testid="plate-input-section"
			>
				<InputSection
					initialValue={plate.input}
					index={i}
					shouldFocus={shouldFocusLastPlate && i === plateData.length - 1}
					on:platedata={(event) => handlePlateData(event, i)}
					on:focus={() => handleFocus(i)}
					on:blur={handleBlur}
				/>
			</div>
			{#if plate.input}
				<!-- plate-display-section -->
				<PlateDisplay
					plateData={plate}
					plateId={plateSectionIds[i]}
					section={i}
					on:plateAdded={(event) => dispatch('plateAdded', event.detail)}
				/>
			{/if}
		</div>
	{/each}

	<div class="flex flex-col items-end w-full gap-2">
		<div class="flex justify-between w-full">
			{#if hadNonEmptyInput}
				{#if allInputsFilled}
					<button
						on:click={addNewPlate}
						class="text-blue-500 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
						data-testid="add-plate-button"
					>
						{#if $isLocaleLoaded}
							{$_('inputSection.addPlate')}
						{:else}
							<div class="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
						{/if}
					</button>
				{:else}
					<span
						class="text-gray-400 dark:text-gray-600 cursor-help"
						title={$isLocaleLoaded ? $_('inputSection.addPlateDisabledTitle') : ''}
						data-testid="add-plate-disabled"
					>
						{#if $isLocaleLoaded}
							{$_('inputSection.addPlate')}
						{:else}
							<div class="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
						{/if}
					</span>
				{/if}
			{:else}
				<div></div>
			{/if}
			{#if hadNonEmptyInput}
				<button
					class="text-blue-500 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
					on:click={() => (showAboutModal = true)}
				>
					{#if $isLocaleLoaded}
						{$_('aboutModal.button')}
					{:else}
						<div class="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
					{/if}
				</button>
			{/if}
			<MultiLineInput on:togglemultiple={handleMultipleInput} />
		</div>
	</div>

	{#if !hadNonEmptyInput}
		<AboutInline />
	{/if}
</div>

<AboutModal bind:show={showAboutModal} />
<UploadIssuedReservedPlatesModal bind:show={showUploadIssuedReservedPlatesModal} />

<style>
	:root {
		--plate-border-width: 1px;
		--plate-gap-width: 0.25rem;
	}

	@media screen and (max-width: 375px) {
		:root {
			--plate-gap-width: 0.125rem;
			--plate-char-width: 1.75rem;
		}
	}

	/* Grid rows for mobile and desktop */
	[data-testid='plate-section'] {
		grid-template-rows: [input-section] auto [input-warnings] auto [shift-controls] auto [plate-display] auto [arrow-down] auto [vowel-indicator] auto [plate-availability] auto;
	}

	@media (min-width: 640px) {
		[data-testid='plate-section'] {
			grid-template-rows: [input-section] auto [input-warnings] auto [shift-controls] auto [plate-display] auto [arrow-down] auto [vowel-indicator] auto;
		}
	}
</style>
