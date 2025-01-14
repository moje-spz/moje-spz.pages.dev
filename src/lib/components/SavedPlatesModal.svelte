<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { onDestroy, createEventDispatcher } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { savedPlates } from '../stores/savedPlates';
	import { isLocaleLoaded } from '$lib/i18n';
	import { browser } from '$app/environment';
	import { plateAvailabilityVersion } from '$lib/stores/plateAvailability';
	import DialogBox from './DialogBox.svelte';
	import SavedPlateEntry from './SavedPlateEntry.svelte';
	import PlateAvailabilityText from './PlateAvailabilityText.svelte';
	import type { Writable } from 'svelte/store';

	export let show: boolean | Writable<boolean> = false;
	let showValue = false;
	let hasAvailabilityData = false;

	// Update hasAvailabilityData when data is loaded or changed
	$: {
		$plateAvailabilityVersion; // Subscribe to changes
		hasAvailabilityData = browser && !!localStorage.getItem('issuedReservedPlates');
	}

	$: {
		if (typeof show === 'boolean') {
			showValue = show;
		} else {
			show.subscribe((value: boolean) => {
				showValue = value;
			});
		}
	}

	const dispatch = createEventDispatcher();

	function handleClose() {
		if (typeof show === 'boolean') {
			show = false;
		} else {
			show.set(false);
		}
		showValue = false;
		dispatch('close');
	}

	$: if (showValue && typeof document !== 'undefined') {
		document.body.style.overflow = 'hidden';
	}

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	});
</script>

{#if showValue}
	<DialogBox
		bind:show={showValue}
		title={$_('savedPlates.title')}
		on:close={handleClose}
		class_name="!w-fit"
		padding_class="p-2"
	>
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
						<SavedPlateEntry {plate} {hasAvailabilityData} />
					{/each}
				</div>
			</div>
		{/if}
	</DialogBox>
{/if}
