<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import type { PlateCandidate } from '../types';
	import { createEventDispatcher } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
	import PlateCharacterDropdown from './PlateCharacterDropdown.svelte';

	export let candidate: PlateCandidate;
	export let dropdownOpen: number | null;
	export let index: number;
	export let plateId: string;
	export let isMobile: boolean;
	export let isEditable: (index: number) => boolean;
	export let invalidInputs: Set<number>;
	export let getTooltipText: () => string;
	export let handleTooltipTouch: (index: number) => void;
	export let handleFocus: (index: number, input: HTMLInputElement) => void;
	export let handleInput: (index: number, event: Event) => void;
	export let handleBlur: (index: number) => void;
	export let tooltipVisible: number | null;
	export let previousValues: Map<number, string>;
	export let section: number;

	let isFocused = false;

	const dispatch = createEventDispatcher<{
		dropdownOpenChange: { index: number | null };
		activeElementPositionChange: { position: { element: Element; rect: DOMRect } | null };
	}>();

	// Helper function to check if a value is a number
	function isNumber(value: string): boolean {
		return /\d/.test(value);
	}

	// Helper function to get valid alternatives based on number validation
	function getValidAlternatives(index: number, candidate: PlateCandidate): string[] {
		// Return all alternatives since the plate processor already handles number requirements
		return candidate.alternatives;
	}

	// Helper function to get section number from plateId (e.g. "plate-section-0" -> 0)
	function getSection(): number {
		const input = document.querySelector(`[data-index="${plateId}-${index}"]`);
		if (!input) return 0;
		const sectionElement = input.closest('[id^="plate-section-"]');
		if (!sectionElement) return 0;
		const sectionId = sectionElement.id;
		return parseInt(sectionId.split('-')[2], 10);
	}

	let dropdownOverlay: HTMLDivElement | null = null;

	function createOverlay() {
		if (!dropdownOverlay) {
			dropdownOverlay = document.createElement('div');
			dropdownOverlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: transparent;
				z-index: 40;
				pointer-events: none;
			`;
			dropdownOverlay.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				closeDropdown();
			});
			document.body.appendChild(dropdownOverlay);
		}
	}

	function removeOverlay() {
		if (dropdownOverlay) {
			document.body.removeChild(dropdownOverlay);
			dropdownOverlay = null;
		}
	}

	function closeDropdown() {
		dispatch('dropdownOpenChange', { index: null });
		dispatch('activeElementPositionChange', { position: null });
		removeOverlay();
		// Blur any focused input
		const activeElement = document.activeElement;
		if (activeElement instanceof HTMLElement) {
			activeElement.blur();
		}
	}

	function handleMobileButtonClick(index: number) {
		if (isEditable(index)) {
			// Get valid alternatives before showing the menu
			const validAlts = getValidAlternatives(index, candidate);
			if (validAlts.length > 0) {
				// Store the previous valid value before showing dropdown
				previousValues.set(index, candidate.selected);

				dispatch('dropdownOpenChange', { index });

				// Get the clicked button element
				const selector = `[data-index="${plateId}-${index}"][data-word-group="${candidate?.wordGroup}"]`;
				const button = document.querySelector(selector);
				if (button) {
					const rect = button.getBoundingClientRect();
					dispatch('activeElementPositionChange', {
						position: {
							element: button,
							rect: rect
						}
					});
					createOverlay();
					// Blur any focused input
					const activeElement = document.activeElement;
					if (activeElement instanceof HTMLElement) {
						activeElement.blur();
					}
				}
			}
		}
	}

	let activeElementPosition: { element: Element; rect: DOMRect } | null = null;

	function handleDropdownSelect(selectedIndex: number, value: string) {
		if (selectedIndex !== null && isEditable(selectedIndex)) {
			dispatch('dropdownOpenChange', { index: null });
			dispatch('activeElementPositionChange', { position: null });
			removeOverlay();
			// Update the selected value
			candidate.selected = value;
			// Handle input
			const input = document.querySelector(`[data-index="${plateId}-${selectedIndex}"]`);
			if (input instanceof HTMLInputElement) {
				input.value = value;
				const event = new InputEvent('input', { bubbles: true });
				handleInput(selectedIndex, event);
			}
		}
	}
</script>

{#if isMobile}
	{#if isEditable(index)}
		<button
			type="button"
			class="row-start-[plate-display] col-span-2 text-center text-2xl font-bold rounded-lg focus:outline-none focus:ring-2 border {isEditable(
				index
			)
				? invalidInputs.has(index)
					? 'bg-red-50 border-red-500 text-red-900 dark:bg-gray-700 dark:text-red-500 dark:border-red-500'
					: `border ${dropdownOpen === index ? 'border-green-500 bg-green-50 dark:border-green-500' : 'border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-gray-100 dark:bg-gray-700`
				: 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 relative'}"
			data-index="{plateId}-{index}"
			data-word-group={candidate.wordGroup}
			data-testid="candidate-button"
			disabled={!isEditable(index)}
			on:click|preventDefault={() => handleMobileButtonClick(index)}
		>
			{candidate.selected}
			{#if tooltipVisible === index}
				<div
					class="tooltip fixed p-2 bg-gray-900 text-white rounded text-xs whitespace-pre-line max-w-[calc(100vw-2rem)] w-max text-center z-50 pointer-events-none break-words -translate-x-1/2 -translate-y-full leading-tight"
					data-testid="plate-tooltip"
				>
					{getTooltipText()}
				</div>
			{/if}
		</button>
		<button
			type="button"
			class="row-start-[arrow-down] col-span-2 flex justify-center h-3 focus:outline-none {invalidInputs.has(
				index
			)
				? 'text-red-500 dark:text-red-500'
				: `text-gray-500 dark:text-gray-500 group-active:text-green-500 dark:group-active:text-green-500 ${dropdownOpen === index ? 'text-green-500 dark:text-green-500' : ''}`}"
			on:click={() => {
				const input = document.querySelector(`[data-index="${plateId}-${index}"]`);
				if (input instanceof HTMLInputElement) {
					input.focus();
				}
			}}
			data-testid="arrow-down"
		>
			<FontAwesomeIcon icon={faCaretDown} class="w-4 h-3" />
		</button>
	{:else}
		<button
			type="button"
			class="relative flex items-center justify-center row-start-[plate-display] col-span-2 text-2xl font-bold text-center text-gray-900 bg-transparent border border-gray-300 rounded-lg cursor-not-allowed dark:border-gray-600 dark:text-gray-100"
			data-index="{plateId}-{index}"
			data-word-group={candidate.wordGroup}
			data-testid="candidate-button"
			on:click|preventDefault={() => handleTooltipTouch(index)}
			title={getTooltipText()}
		>
			{candidate.selected}
			{#if tooltipVisible === index}
				<div
					class="tooltip fixed p-2 bg-gray-900 text-white rounded text-xs whitespace-pre-line max-w-[calc(100vw-2rem)] w-max text-center z-50 pointer-events-none break-words -translate-x-1/2 -translate-y-full leading-tight"
					data-testid="plate-tooltip"
				>
					{getTooltipText()}
				</div>
			{/if}
		</button>
		<div class="row-start-[arrow-down] col-span-2"></div>
	{/if}
{:else}
	<input
		type="text"
		class="row-start-[plate-display] col-span-2 text-center text-2xl font-bold font-mono rounded-lg focus:outline-none focus:ring-2 border flex-shrink-0 flex-grow-0 {isEditable(
			index
		)
			? invalidInputs.has(index)
				? 'bg-red-50 border-red-500 text-red-900 placeholder-red-700 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-red-500 dark:placeholder-red-500 dark:border-red-500'
				: 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:bg-green-50 focus:border-green-500 focus:text-green-900 dark:focus:text-green-400 dark:focus:border-green-500 dark:bg-gray-700 focus:ring-green-500 dark:placeholder-gray-100'
			: 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 group'} relative"
		value={isFocused ? '' : candidate.selected}
		placeholder={candidate.selected}
		data-index="{plateId}-{index}"
		data-word-group={candidate.wordGroup}
		data-testid="candidate-input"
		data-section={section}
		disabled={!isEditable(index)}
		on:focus={(e) => {
			isFocused = true;
			isEditable(index) && handleFocus(index, e.currentTarget);
		}}
		on:input={(e) => isEditable(index) && handleInput(index, e)}
		on:blur={() => {
			isFocused = false;
			isEditable(index) && handleBlur(index);
		}}
		title={!isEditable(index) ? getTooltipText() : undefined}
	/>
	{#if isEditable(index)}
		<button
			type="button"
			class="row-start-[arrow-down] flex justify-center text-center col-span-2 h-3 focus:outline-none {invalidInputs.has(
				index
			)
				? 'text-red-500 dark:text-red-500'
				: `text-gray-500 dark:text-gray-500 group-active:text-green-500 dark:group-active:text-green-500 ${dropdownOpen === index ? 'text-green-500 dark:text-green-500' : ''}`}"
			on:click={() => {
				const input = document.querySelector(`[data-index="${plateId}-${index}"]`);
				if (input instanceof HTMLInputElement) {
					input.focus();
				}
			}}
			data-testid="arrow-down"
		>
			<FontAwesomeIcon icon={faCaretDown} class="w-4 h-3" />
		</button>
	{:else}
		<div class="row-start-[arrow-down] col-span-2"></div>
	{/if}
{/if}
{#if index === 2}
	<div class="row-start-[arrow-down]" data-testid="arrow-down-separator"></div>
{/if}

{#if dropdownOpen === index && isEditable(index)}
	{#if activeElementPosition}
		<PlateCharacterDropdown
			alternatives={candidate.alternatives}
			{isMobile}
			{activeElementPosition}
			onSelect={(value) => dropdownOpen !== null && handleDropdownSelect(dropdownOpen, value)}
			position={index}
			section={getSection()}
		/>
	{/if}
{/if}
