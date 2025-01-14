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

{#if plateDataInfo}
	<button
		class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
		on:click={() => (showUploadModal = true)}
	>
		{$_('aboutModal.footer.plateDataDate', { values: { date: plateDataInfo.date } })}
	</button>
{/if}

<UploadIssuedReservedPlatesModal bind:show={showUploadModal} />
