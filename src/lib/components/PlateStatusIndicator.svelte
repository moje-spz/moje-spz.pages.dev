<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faCheck,
		faXmark,
		faCircleExclamation,
		faCircleQuestion
	} from '@fortawesome/free-solid-svg-icons';
	import UploadIssuedReservedPlatesModal from '$lib/components/UploadIssuedReservedPlatesModal.svelte';
	import { plateAvailabilityVersion } from '$lib/stores/plateAvailability';

	export let plateNumber: string | null;
	let showUploadModal = false;

	interface StoredData {
		version: string;
		hash_value: string;
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

	$: statusTitle = (() => {
		switch (plateStatus.type) {
			case 'no_data':
				return $_('plateDisplay.uploadCsvToCheck');
			case 'available':
				return $_('plateDisplay.plateAvailable');
			case 'unavailable':
				return $_('plateDisplay.plateUnavailable', {
					values: { state: $_(`csvUpload.states.${plateStatus.state}`) }
				});
			case 'error':
				return plateStatus.error || $_('plateDisplay.errors.unknown');
		}
	})();

	$: statusColor = (() => {
		switch (plateStatus.type) {
			case 'no_data':
				return 'text-gray-500';
			case 'available':
				return 'text-green-500';
			case 'unavailable':
				return 'text-red-500';
			case 'error':
				return 'text-yellow-500';
		}
	})();
</script>

<button
	class="flex items-center justify-center hidden w-full h-full rounded-md sm:flex focus:outline-none focus:ring-2 focus:ring-blue-500"
	title={statusTitle}
	on:click={() => (showUploadModal = true)}
>
	<div class={statusColor}>
		{#if plateStatus.type === 'no_data'}
			<FontAwesomeIcon icon={faCircleQuestion} class="w-5 h-5" />
		{:else if plateStatus.type === 'unavailable'}
			<FontAwesomeIcon icon={faXmark} class="w-5 h-5" />
		{:else if plateStatus.type === 'available'}
			<FontAwesomeIcon icon={faCheck} class="w-5 h-5" />
		{:else}
			<FontAwesomeIcon icon={faCircleExclamation} class="w-5 h-5" />
		{/if}
	</div>
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
