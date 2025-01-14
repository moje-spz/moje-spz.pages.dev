<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import UploadIssuedReservedPlatesModal from '$lib/components/UploadIssuedReservedPlatesModal.svelte';
	import { plateAvailabilityVersion } from '$lib/stores/plateAvailability';

	export let plateNumber: string | null;
	let showUploadModal = false;

	interface StoredData {
		version: string;
		hash_value: string;
		hash_function: 'SHA-256' | 'djb2';
		newest_entry_date_time: string;
		states: {
			terminated: string[];
			issued: string[];
			reserved: string[];
			assigned: string[];
			stored: string[];
		};
		plates: { [key: string]: string };
	}

	interface PlateStatus {
		type: 'available' | 'unavailable' | 'no_data' | 'error';
		state?: string;
		error?: string;
	}

	function getPlateStatus(plateNumber: string | null): PlateStatus {
		if (!browser) return { type: 'no_data' };

		const storedData = localStorage.getItem('issuedReservedPlates');
		if (!storedData) return { type: 'no_data' };

		try {
			const data = JSON.parse(storedData) as StoredData;

			// Validate data structure and version
			if (!data.version || data.version !== '1') {
				return {
					type: 'error',
					error: $_('plateDisplay.errors.invalidVersion')
				};
			}

			if (!data.plates || typeof data.plates !== 'object') {
				return {
					type: 'error',
					error: $_('plateDisplay.errors.invalidDataStructure')
				};
			}

			if (!plateNumber) return { type: 'available' };

			const state = data.plates[plateNumber];
			if (!state) return { type: 'available' };

			return {
				type: 'unavailable',
				state
			};
		} catch (e) {
			return {
				type: 'error',
				error: $_('plateDisplay.errors.invalidData')
			};
		}
	}

	$: plateStatus = (() => {
		// Subscribe to the store to trigger reactivity when data is updated
		$plateAvailabilityVersion;
		return getPlateStatus(plateNumber);
	})();

	$: statusText = (() => {
		switch (plateStatus.type) {
			case 'no_data':
				return $_('plateDisplay.noData');
			case 'available':
				return $_('plateDisplay.available');
			case 'unavailable':
				return $_('plateDisplay.unavailable', {
					values: { state: $_(`csvUpload.states.${plateStatus.state}`) }
				});
			case 'error':
				return plateStatus.error || $_('plateDisplay.errors.unknown');
		}
	})();

	$: buttonClasses = (() => {
		const baseClasses =
			'w-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md py-1 px-2';
		switch (plateStatus.type) {
			case 'no_data':
				return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20`;
			case 'available':
				return `${baseClasses} bg-green-50 dark:bg-green-900/20`;
			case 'unavailable':
				return `${baseClasses} bg-red-50 dark:bg-red-900/20`;
			case 'error':
				return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20`;
		}
	})();

	$: textClasses = (() => {
		const baseClasses = 'underline';
		switch (plateStatus.type) {
			case 'no_data':
				return `${baseClasses} text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200`;
			case 'available':
				return `${baseClasses} text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200`;
			case 'unavailable':
				return `${baseClasses} text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200`;
			case 'error':
				return `${baseClasses} text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200`;
		}
	})();
</script>

<button
	class={buttonClasses}
	on:click={() => (showUploadModal = true)}
	data-testid="plate-availability-no-data"
>
	<span class={textClasses}>{statusText}</span>
</button>

<UploadIssuedReservedPlatesModal
	bind:show={showUploadModal}
	on:error={(e) => {
		plateStatus = {
			type: 'error',
			error: e.detail
		};
	}}
/>
