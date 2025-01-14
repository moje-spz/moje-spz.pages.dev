<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { plateAvailabilityVersion } from '$lib/stores/plateAvailability';
	import UploadIssuedReservedPlatesModal from './UploadIssuedReservedPlatesModal.svelte';

	let showUploadModal = false;
	let hasAvailabilityData = false;
	let availabilityDate: string | null = null;

	// Update plate availability data status when data is loaded or changed
	$: {
		$plateAvailabilityVersion; // Subscribe to changes
		if (browser) {
			const storedData = localStorage.getItem('issuedReservedPlates');
			hasAvailabilityData = !!storedData;

			if (storedData) {
				try {
					const data = JSON.parse(storedData);
					if (data.version === '1' && data.newest_entry_date_time) {
						availabilityDate = new Date(data.newest_entry_date_time).toISOString().split('T')[0];
					}
				} catch (e) {
					console.error('Error parsing plate availability data:', e);
				}
			}
		}
	}
</script>

<div class="text-sm text-gray-700 dark:text-gray-300">
	{#if hasAvailabilityData && availabilityDate}
		{$_('settings.plateAvailability.dataAvailable', {
			values: { date: availabilityDate }
		})}
		<button
			class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
			on:click={() => (showUploadModal = true)}>{$_('settings.plateAvailability.update')}</button
		>.
	{:else}
		{$_('settings.plateAvailability.noData')}
		<button
			class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
			on:click={() => (showUploadModal = true)}>{$_('settings.plateAvailability.setup')}</button
		>.
	{/if}
</div>

<UploadIssuedReservedPlatesModal bind:show={showUploadModal} />
