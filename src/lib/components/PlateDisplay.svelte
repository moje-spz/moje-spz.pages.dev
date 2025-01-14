<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { createPlateNumber, createVowelAndCandidatesData } from '../plateProcessor';
	import Clipboard from './Clipboard.svelte';
	import SavedPlatesIcon from './SavedPlatesIcon.svelte';
	import SavedPlatesModal from './SavedPlatesModal.svelte';
	import PlateStatusIndicator from './PlateStatusIndicator.svelte';
	import PlateAvailabilityText from './PlateAvailabilityText.svelte';
	import VowelIndicator from './VowelIndicator.svelte';
	import type { PlateData, VowelIndicatorData, PlateCandidatesData } from '../types';
	import PlateCandidates from './PlateCandidates.svelte';

	export let plateData: PlateData;
	export let plateId: string;
	export let section: number;
	$: plateNumber = createPlateNumber(plateData.candidates);

	// Create data structures for vowel indicator and plate candidates
	$: ({ vowelIndicatorData, plateCandidatesData } = createVowelAndCandidatesData(
		plateData.candidates
	));

	let showSavedPlatesModal = false;

	// Translate error message if it exists and is a translation key
	$: translatedErrorMessage = plateData.metadata.errorMessage
		? $_(plateData.metadata.errorMessage)
		: '';

	const dispatch = createEventDispatcher<{
		select: { index: number; value: string };
	}>();
</script>

{#if translatedErrorMessage}
	<div
		class="row-start-[plate-display] col-start-3 col-span-19 grid place-items-center w-full px-4"
	>
		<span
			class="px-4 py-2 text-base text-center text-red-700 rounded-md bg-red-50 dark:bg-red-900/50 dark:text-red-200 sm:text-lg"
			data-testid="error-message"
		>
			{translatedErrorMessage}
		</span>
	</div>
{:else}
	<div class="col-start-1 row-start-[plate-display]"></div>

	<div class="flex h-full row-start-[plate-display] col-start-2">
		<Clipboard text={plateNumber} class_name="w-full" />
	</div>

	<div class="col-start-3 row-start-[plate-display]"></div>

	<PlateCandidates
		{plateData}
		{plateId}
		{section}
		on:plateDataChange={({ detail }) => {
			plateData = detail;
			dispatch('select', { index: -1, value: '' }); // Dispatch a change event to trigger reactivity
		}}
	/>

	<div class="flex h-full row-start-[plate-display] col-start-22">
		<SavedPlatesIcon {plateData} bind:showSavedPlatesModal class_name="w-full" />
	</div>
{/if}

{#if plateData.candidates && plateNumber && !plateData.metadata.errorMessage}
	<VowelIndicator data={vowelIndicatorData} />
	<div class="row-start-[plate-availability] col-start-4 col-span-17 mt-4">
		<PlateAvailabilityText {plateNumber} />
	</div>
{/if}

<SavedPlatesModal bind:show={showSavedPlatesModal} />
