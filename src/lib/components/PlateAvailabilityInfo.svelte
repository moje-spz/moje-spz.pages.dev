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

	$: plateDataInfo = (() => {
		// Subscribe to the store to trigger reactivity when data is updated
		$plateAvailabilityVersion;

		if (!browser) return null;
		const storedData = localStorage.getItem('issuedReservedPlates');
		if (!storedData) return null;
		try {
			const data = JSON.parse(storedData);
			if (!data.version || data.version !== '1') return null;
			return {
				date: new Date(data.newest_entry_date_time).toLocaleDateString()
			};
		} catch (e) {
			return null;
		}
	})();
</script>

<p class="text-gray-900 dark:text-gray-100">
	{#if plateDataInfo}
		{$_('plateAvailability.hasData.text', { values: { date: plateDataInfo.date } })}
		<a
			role="button"
			href="/"
			class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
			on:click|preventDefault={() => (showUploadModal = true)}
			>{$_('plateAvailability.hasData.button')}</a
		>{$_('plateAvailability.hasData.suffix')}
	{:else}
		{$_('plateAvailability.noData.text')}
		<a
			role="button"
			href="/"
			class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
			on:click|preventDefault={() => (showUploadModal = true)}
			>{$_('plateAvailability.noData.button')}</a
		>{$_('plateAvailability.noData.suffix')}
	{/if}
</p>

<UploadIssuedReservedPlatesModal bind:show={showUploadModal} />
