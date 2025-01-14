<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { savedPlates } from '../stores/savedPlates';
	import { createPlateNumber } from '../plateProcessor';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBookmark as faBookmarkSolid } from '@fortawesome/free-solid-svg-icons';
	import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';
	import type { PlateData } from '../types';

	export let plateData: PlateData;
	export let showSavedPlatesModal = false;
	export let class_name = '';

	const dispatch = createEventDispatcher<{
		plateAdded: { plateNumber: string };
	}>();

	$: plateNumber = createPlateNumber(plateData.candidates);

	// Update isInSavedPlates whenever plateNumber or savedPlates changes
	$: isInSavedPlates =
		plateNumber &&
		$savedPlates.some((plate) => createPlateNumber(plate.candidates) === plateNumber);

	function handleBookmark() {
		const plateNumber = createPlateNumber(plateData.candidates);
		const isInSavedPlates = $savedPlates.some(
			(plate) => createPlateNumber(plate.candidates) === plateNumber
		);

		if (!isInSavedPlates) {
			// Create a deep copy of plateData
			const plateDataCopy = {
				...plateData,
				candidates: plateData.candidates.map((candidate) => ({
					...candidate,
					input: { ...candidate.input },
					alternatives: [...candidate.alternatives]
				})),
				metadata: { ...plateData.metadata }
			};
			savedPlates.update((plates) => [...plates, plateDataCopy]);
		}
		// Always dispatch event to trigger animation, regardless if plate was just saved or already existed
		dispatch('plateAdded', { plateNumber });
		if (window.innerWidth < 768) {
			showSavedPlatesModal = true;
		}
	}
</script>

<button
	class="flex items-center justify-center w-full h-full text-gray-600 rounded-md hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 {class_name}"
	on:click={handleBookmark}
	title={isInSavedPlates ? $_('plateDisplay.alreadySaved') : $_('plateDisplay.savePlate')}
	data-testid="save-plate-button"
>
	<div class="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6">
		{#if isInSavedPlates}
			<FontAwesomeIcon icon={faBookmarkSolid} class="w-full h-full" />
		{:else}
			<FontAwesomeIcon icon={faBookmarkRegular} class="w-full h-full" />
		{/if}
	</div>
</button>
