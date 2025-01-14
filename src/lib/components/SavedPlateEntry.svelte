<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCircle } from '@fortawesome/free-regular-svg-icons';
	import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
	import { savedPlates } from '../stores/savedPlates';
	import type { PlateData } from '../types';
	import { createPlateNumber } from '../plateProcessor';
	import Clipboard from './Clipboard.svelte';
	import PlateAvailabilityText from './PlateAvailabilityText.svelte';
	import { _ } from 'svelte-i18n';

	export let plate: PlateData;
	export let hasAvailabilityData = false;
	export let isHighlighted = false;

	$: plateNumber = createPlateNumber(plate.candidates);
	$: ({ firstPart, secondPart } = splitPlateNumber(plateNumber));

	function splitPlateNumber(plateNumber: string): { firstPart: string; secondPart: string } {
		return {
			firstPart: plateNumber.slice(0, 3),
			secondPart: plateNumber.slice(3)
		};
	}

	function removePlate() {
		savedPlates.update((plates) => plates.filter((p) => p !== plate));
	}
</script>

<div class="py-3 first:pt-0 last:pb-0">
	<div class="grid gap-y-1">
		<div
			class="grid grid-cols-[3rem_1fr_3rem] gap-x-2 items-center"
			data-testid="saved-plate-entry"
		>
			<div class="flex justify-center">
				<Clipboard text={plateNumber} />
			</div>

			<div class="flex items-center justify-center w-full">
				<div
					class="inline-flex items-center w-full px-2 py-1 font-mono text-lg text-gray-900 bg-transparent border border-gray-300 rounded-lg dark:bg-transparent dark:text-gray-100 whitespace-nowrap dark:border-gray-600 {isHighlighted
						? 'animate-highlight'
						: ''}"
					data-testid="plate-number-display"
				>
					<span data-testid="plate-first-part">{firstPart}</span>
					<span
						class="select-none text-gray-300 dark:text-gray-600 flex items-center justify-center w-4 mx-0.5"
						data-testid="plate-separator"
					>
						<div class="flex flex-col items-center justify-center gap-0.5 py-0.5 w-4 h-4">
							<FontAwesomeIcon icon={faCircle} class="w-1 h-1" />
							<FontAwesomeIcon icon={faCircle} class="w-1 h-1" />
						</div>
					</span>
					<span data-testid="plate-second-part">{secondPart}</span>
				</div>
			</div>

			<div class="flex justify-center">
				<button
					class="p-2 text-gray-500 rounded-md hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					on:click={removePlate}
					title={$_('savedPlates.remove')}
					data-testid="remove-button"
				>
					<FontAwesomeIcon icon={faTrashCan} class="w-5 h-5" />
				</button>
			</div>
		</div>

		{#if hasAvailabilityData}
			<div class="-mx-4 col-span-full">
				<PlateAvailabilityText {plateNumber} />
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes highlight {
		0% {
			background-color: var(--highlight-start-bg, rgb(59 130 246 / 0.1));
			border-color: var(--highlight-start-border, rgb(59 130 246));
			border-width: 2px;
		}
		50% {
			background-color: var(--highlight-peak-bg, rgb(59 130 246 / 0.2));
			border-color: var(--highlight-peak-border, rgb(96 165 250));
			border-width: 2px;
		}
		100% {
			background-color: var(--highlight-end-bg, rgb(59 130 246 / 0));
			border-color: transparent;
			border-width: 1px;
		}
	}

	.animate-highlight {
		animation: highlight 1.5s ease-out forwards;
		border-style: solid;
	}

	:global(.dark) .animate-highlight {
		--highlight-start-bg: rgb(59 130 246 / 0.2);
		--highlight-peak-bg: rgb(59 130 246 / 0.3);
		--highlight-end-bg: rgb(59 130 246 / 0);
		--highlight-start-border: rgb(96 165 250);
		--highlight-peak-border: rgb(147 197 253);
	}
</style>
