<!--
  SPDX-License-Identifier: MIT
  SPDX-FileCopyrightText: 2025 Pavol Babinčák
-->

<script lang="ts">
	import ResultsSection from '$lib/components/ResultsSection.svelte';
	import MultiLineInputModal from '$lib/components/MultiLineInputModal.svelte';
	import type { PlateData } from '$lib/types';
	import { processInput } from '$lib/plateProcessor';
	import SavedPlates from '$lib/components/SavedPlates.svelte';
	import { savedPlates } from '$lib/stores/savedPlates';

	let plateData: PlateData[] = [processInput('')];
	let showMultipleInput = false;
	let savedPlatesComponent: SavedPlates;

	function handlePlateData(event: CustomEvent<PlateData[]>) {
		plateData = event.detail;
	}

	function handleMultipleSubmit(event: CustomEvent<PlateData[]>) {
		plateData = event.detail;
		showMultipleInput = false;
	}

	function handleMultipleClose() {
		showMultipleInput = false;
	}

	function handlePlateAdded(event: CustomEvent<{ plateNumber: string }>) {
		if (savedPlatesComponent) {
			savedPlatesComponent.highlightPlate(event.detail.plateNumber);
		}
	}

	$: hasSavedPlates = $savedPlates.length > 0;
</script>

<!-- left column -->
<div class="hidden md:block h-full"></div>

<!-- middle column -->
<ResultsSection
	{plateData}
	on:platedata={handlePlateData}
	on:togglemultiple={() => (showMultipleInput = true)}
	on:plateAdded={handlePlateAdded}
/>

<!-- right column -->
{#if hasSavedPlates}
	<div class="hidden md:flex justify-end h-full" id="saved-plates-container">
		<SavedPlates bind:this={savedPlatesComponent} />
	</div>
{:else}
	<div class="hidden md:block h-full"></div>
{/if}

<MultiLineInputModal
	bind:show={showMultipleInput}
	{plateData}
	maxLines={10}
	on:submit={handleMultipleSubmit}
	on:close={handleMultipleClose}
/>

<style>
	:global(:root) {
		/* Base text size - 16px on desktop, 14px on mobile */
		--base-text-size: 1rem;
		--text-xs: calc(var(--base-text-size) * 0.75); /* 12px desktop */
		--text-sm: calc(var(--base-text-size) * 0.875); /* 14px desktop */
		--text-base: var(--base-text-size); /* 16px desktop */
		--text-lg: calc(var(--base-text-size) * 1.125); /* 18px desktop */
		--text-xl: calc(var(--base-text-size) * 1.25); /* 20px desktop */
		--text-2xl: calc(var(--base-text-size) * 1.5); /* 24px desktop */
	}

	:global(body) {
		background-color: rgb(249 250 251);
		font-size: var(--text-base);
	}

	:global(body.dark) {
		background-color: rgb(17 24 39);
	}

	:global(.text-xs) {
		font-size: var(--text-xs);
	}
	:global(.text-sm) {
		font-size: var(--text-sm);
	}
	:global(.text-base) {
		font-size: var(--text-base);
	}
	:global(.text-lg) {
		font-size: var(--text-lg);
	}
	:global(.text-xl) {
		font-size: var(--text-xl);
	}
	:global(.text-2xl) {
		font-size: var(--text-2xl);
	}
</style>
