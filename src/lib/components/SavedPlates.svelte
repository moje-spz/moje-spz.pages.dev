<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { savedPlates } from '../stores/savedPlates';
	import { _ } from 'svelte-i18n';
	import { isLocaleLoaded } from '$lib/i18n';
	import SavedPlateEntry from './SavedPlateEntry.svelte';
	import PlateAvailabilityText from './PlateAvailabilityText.svelte';
	import { browser } from '$app/environment';
	import { createPlateNumber } from '../plateProcessor';
	import { plateAvailabilityVersion } from '$lib/stores/plateAvailability';

	let highlightedPlate: string | null = null;
	let hasAvailabilityData = false;

	// Update hasAvailabilityData when data is loaded or changed
	$: {
		$plateAvailabilityVersion; // Subscribe to changes
		hasAvailabilityData = browser && !!localStorage.getItem('issuedReservedPlates');
	}

	export function highlightPlate(plateNumber: string) {
		highlightedPlate = plateNumber;
		setTimeout(() => {
			highlightedPlate = null;
		}, 1500); // Animation duration
	}
</script>

<div class="w-60">
	{#if $isLocaleLoaded}
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
				{$_('savedPlates.title')}
			</h2>
		</div>

		{#if $savedPlates.length === 0}
			<p class="py-4 text-center text-gray-500 dark:text-gray-400">{$_('savedPlates.empty')}</p>
		{:else}
			{#if !hasAvailabilityData}
				<div class="mb-3 -mx-4">
					<PlateAvailabilityText plateNumber={null} />
				</div>
				<div class="h-px mb-3 -mx-4 bg-gray-200 dark:bg-gray-700" />
			{/if}
			<div class="flex flex-col -mx-4">
				<div class="px-4 divide-y divide-gray-200 dark:divide-gray-700">
					{#each $savedPlates as plate}
						{@const plateNumber = createPlateNumber(plate.candidates)}
						<SavedPlateEntry
							{plate}
							{hasAvailabilityData}
							isHighlighted={highlightedPlate === plateNumber}
						/>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<div class="animate-pulse">
			<div class="w-40 h-8 mb-4 bg-gray-200 rounded dark:bg-gray-700"></div>
			<div class="space-y-2">
				<div class="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
				<div class="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
			</div>
		</div>
	{/if}
</div>
