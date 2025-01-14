<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { onDestroy } from 'svelte';
	import type { PlateData, PlateCandidate } from '../types';
	import { _ } from 'svelte-i18n';
	import PlateShiftControls from './PlateShiftControls.svelte';
	import PlateCharacterDropdown from './PlateCharacterDropdown.svelte';
	import PlateCandidateCharacter from './PlateCandidateCharacter.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCircle } from '@fortawesome/free-regular-svg-icons';

	function generateUUID(): string {
		if (typeof crypto !== 'undefined' && crypto.randomUUID) {
			try {
				return crypto.randomUUID();
			} catch (e) {
				// Fall through to backup implementation
			}
		}
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	export let plateData: PlateData;
	export let plateId: string = generateUUID();
	export let section: number;
	export let debug: boolean = false;

	// Helper function that only logs when debug is true
	function debugLog(...args: any[]): void {
		if (debug) {
			console.log(...args);
		}
	}

	let tooltipVisible: number | null = null;
	let isPreventingScroll = false;
	let dropdownOpen: number | null = null;
	let invalidInputs: Set<number> = new Set();
	let previousValues: Map<number, string> = new Map();
	let isMobile = false;
	let activeElementPosition: { element: Element; rect: DOMRect } | null = null;
	let isOpeningDropdown = false;
	let nextFocusedInput: HTMLInputElement | null = null;

	// Get non-skipped candidates for display
	$: displayCandidates = plateData.candidates.filter((c) => !c.isSkippedVowel);

	// Function to check if a character has multiple alternatives
	$: hasMultipleAlternatives = (index: number) => {
		return plateData.candidates[index]?.alternatives?.length > 1;
	};

	const dispatch = createEventDispatcher<{
		select: { index: number; value: string };
		plateAdded: { plateNumber: string };
		plateDataChange: PlateData;
	}>();

	// Function to check if a character is editable (has multiple alternatives)
	$: isEditable = (index: number) => {
		return hasMultipleAlternatives(index);
	};

	// Function to check if device is mobile
	function isMobileDevice() {
		if (typeof window === 'undefined') return false;

		// Check for touch capability
		const hasTouch =
			'ontouchstart' in window ||
			navigator.maxTouchPoints > 0 ||
			// @ts-ignore
			(window.DocumentTouch && document instanceof DocumentTouch);

		// Check for screen size
		const isSmallScreen = window.innerWidth <= 640;

		// Check for mobile user agent (as a fallback)
		const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);

		// Consider a device mobile if it has touch capability AND either has a small screen or mobile UA
		return hasTouch && (isSmallScreen || isMobileUA);
	}

	// Update isMobile state
	function updateIsMobile() {
		isMobile = isMobileDevice();
	}

	// Initialize and set up event listeners
	$: if (typeof window !== 'undefined') {
		updateIsMobile();
		window.addEventListener('resize', updateIsMobile);
		window.addEventListener('orientationchange', updateIsMobile);
		// Use capture phase to catch events before they reach disabled inputs
		document.addEventListener('mousedown', handleMouseDown, true);
	}

	// Function to get tooltip text
	function getTooltipText(): string {
		const error = $_('plateDisplay.changeInInputError');
		const tip = $_('plateDisplay.changeInInputTip');
		return `${error}\n${tip}`;
	}

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateIsMobile);
			window.removeEventListener('orientationchange', updateIsMobile);
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('wheel', preventScroll);
			document.removeEventListener('touchmove', preventScroll);
		}
	});

	// Function to show tooltip on mobile touch
	function handleTooltipTouch(index: number) {
		tooltipVisible = index;

		// Wait for the next tick to ensure the tooltip element exists
		setTimeout(() => {
			const button = document.querySelector(`[data-index="${plateId}-${index}"]`);
			const tooltip = document.querySelector('.tooltip') as HTMLElement;

			if (button && tooltip) {
				const rect = button.getBoundingClientRect();
				const tooltipRect = tooltip.getBoundingClientRect();

				// Calculate position
				let left = rect.left + rect.width / 2;
				let top = rect.top - 8; // Add small gap

				// Ensure tooltip stays within viewport
				left = Math.min(
					Math.max(tooltipRect.width / 2, left),
					window.innerWidth - tooltipRect.width / 2
				);
				top = Math.max(tooltipRect.height, top);

				tooltip.style.left = `${left}px`;
				tooltip.style.top = `${top}px`;
			}
		}, 0);

		setTimeout(() => {
			tooltipVisible = null;
		}, 3000);
	}

	// Helper function to check if a value is a number
	function isNumber(value: string): boolean {
		return /\d/.test(value);
	}

	function preventScroll(e: Event) {
		// Only prevent scroll if it's not within the dropdown
		const target = e.target as HTMLElement;
		const isWithinDropdown = target.closest('[data-testid="character-dropdown"]');
		if (isPreventingScroll && !isWithinDropdown) {
			e.preventDefault();
		}
	}

	function handleFocus(index: number, input: HTMLInputElement) {
		debugLog(
			'Focus event: ' +
				JSON.stringify(
					{
						index,
						currentDropdown: dropdownOpen,
						isOpeningDropdown
					},
					null,
					2
				)
		);

		// Store input position for dropdown
		const rect = input.getBoundingClientRect();
		activeElementPosition = {
			element: input,
			rect: rect
		};

		// Always set the dropdown state
		dropdownOpen = index;

		const candidate = plateData.candidates[index];
		if (candidate) {
			previousValues.set(index, candidate.selected);
		}
	}

	function handleMouseDown(event: MouseEvent) {
		const target = event.target as HTMLElement;

		// First check if we clicked within a container or plate section
		const container = target.closest('[data-testid="input-container"]');
		const plateSectionClicked = target.closest('#plate-section-' + section);
		const isDropdownButton = target.closest('[data-testid="character-dropdown"]');
		const isDropdownTrigger = target.closest('[data-testid="candidate-button"]');

		// Find input whether it's directly clicked or through container
		let targetInput: HTMLInputElement | null = null;
		const isDirectInputClick =
			target.tagName === 'INPUT' && target.getAttribute('data-testid') === 'candidate-input';

		if (isDirectInputClick) {
			targetInput = target as HTMLInputElement;
		} else if (container) {
			targetInput = container.querySelector('[data-testid="candidate-input"]');
		} else if (plateSectionClicked) {
			targetInput = plateSectionClicked.querySelector('[data-testid="candidate-input"]');
		}

		const isDisabledInput = targetInput?.disabled || false;

		debugLog(
			'MouseDown event details: ' +
				JSON.stringify(
					{
						targetTag: target.tagName,
						targetTestId: target.getAttribute('data-testid'),
						isDirectInputClick,
						hasContainer: !!container,
						foundTargetInput: !!targetInput,
						isDisabledInput,
						isDropdownButton: !!isDropdownButton,
						isDropdownTrigger: !!isDropdownTrigger,
						plateSectionClicked: !!plateSectionClicked,
						currentDropdownOpen: dropdownOpen,
						currentNextFocusedInput: nextFocusedInput?.getAttribute('data-index'),
						targetInputIndex: targetInput?.getAttribute('data-index')
					},
					null,
					2
				)
		);

		// Track the input click whether it's disabled or not
		if (targetInput) {
			nextFocusedInput = targetInput;
			debugLog(
				'Setting nextFocusedInput: ' +
					JSON.stringify(
						{
							inputIndex: nextFocusedInput.getAttribute('data-index'),
							isDisabled: isDisabledInput
						},
						null,
						2
					)
			);
			return;
		}

		// If we're not clicking on an input or its container, clear the next focus target
		nextFocusedInput = null;
		debugLog('Clearing nextFocusedInput');
	}

	function handleBlur(index: number) {
		const input = document.querySelector(`[data-index="${plateId}-${index}"]`) as HTMLInputElement;
		const dropdown = document.querySelector('[data-testid="character-dropdown"]');
		const activeElement = document.activeElement;

		// Get position and section from the active element
		const activePosition = dropdown?.getAttribute('data-position');
		const activeSection = dropdown?.getAttribute('data-section');

		// Get position and section from the next focused input's data-index
		const nextInputIndex = nextFocusedInput?.getAttribute('data-index')?.split('-').slice(-1)[0];
		const nextInputSection = nextFocusedInput?.closest('#plate-section-' + section)
			? section
			: null;

		debugLog(
			'Blur event details: ' +
				JSON.stringify(
					{
						index,
						activeElementTag: activeElement?.tagName,
						activeElementTestId: (activeElement as HTMLElement)?.getAttribute('data-testid'),
						hasDropdown: !!dropdown,
						dropdownOpen,
						nextFocusedInput: nextFocusedInput?.getAttribute('data-index'),
						activePosition,
						activeSection,
						nextInputIndex,
						nextInputSection,
						isWithinDropdown:
							dropdown && (dropdown.contains(activeElement) || dropdown === activeElement),
						isOnInput:
							activeElement?.tagName === 'INPUT' &&
							activeElement?.getAttribute('data-testid') === 'candidate-input'
					},
					null,
					2
				)
		);

		// If we're switching to another input, check if it's in the same position and section
		if (nextFocusedInput) {
			if (activePosition === nextInputIndex && activeSection === nextInputSection?.toString()) {
				debugLog('Keeping dropdown open - switching to input with same position and section');
				return;
			} else {
				debugLog('Closing dropdown - switching to input with different position or section', {
					activePosition,
					nextInputIndex,
					activeSection,
					nextInputSection
				});
				closeDropdown();
				return;
			}
		}

		// Keep dropdown open if focus is still within the dropdown
		if (dropdown && (dropdown.contains(activeElement) || dropdown === activeElement)) {
			debugLog('Keeping dropdown open - focus within dropdown');
			return;
		}

		// Restore the value based on whether it was invalid or not
		if (invalidInputs.has(index)) {
			// For invalid inputs, keep the invalid value visible
		} else {
			// For valid inputs or empty inputs, restore the selected value
			const candidate = plateData.candidates[index];
			if (candidate) {
				input.value = candidate.selected;
			}
		}

		// Clear invalid state only if the input is empty or matches selected value
		if (!input.value || input.value === plateData.candidates[index]?.selected) {
			invalidInputs.delete(index);
			invalidInputs = invalidInputs;
		}
		previousValues.delete(index);
	}

	// Initialize click outside handler
	$: if (typeof window !== 'undefined') {
		if (dropdownOpen !== null) {
			// Use bubbling phase to handle clicks after focus events
			document.addEventListener('click', handleClickOutside);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;

		// Check if we clicked within a plate section
		const plateSectionClicked = target.closest('#plate-section-' + section);

		// Check if the click is within the input or its container
		const isInput =
			target.tagName === 'INPUT' && target.getAttribute('data-testid') === 'candidate-input';
		const isInputContainer = target.closest('[data-testid="input-container"]');
		const isDropdownButton = target.closest('[data-testid="character-dropdown"]');
		const isDropdownTrigger = target.closest('[data-testid="candidate-button"]');

		// Get dropdown and clicked input details for logging
		const dropdown = document.querySelector('[data-testid="character-dropdown"]');
		const dropdownPosition = dropdown?.getAttribute('data-position');

		// Find the actual input if we clicked on a container or within the plate section
		let targetInput = isInput ? target : null;
		if (!targetInput && plateSectionClicked) {
			// Find the closest input or the input we clicked near
			targetInput = plateSectionClicked.querySelector('[data-testid="candidate-input"]');
		}
		if (!targetInput && isInputContainer) {
			targetInput = isInputContainer.querySelector('[data-testid="candidate-input"]');
		}
		const clickedIndex = targetInput?.getAttribute('data-index')?.split('-').slice(-1)[0] || null;

		debugLog(
			'Click outside event details: ' +
				JSON.stringify(
					{
						targetTag: target.tagName,
						targetTestId: target.getAttribute('data-testid'),
						isInput,
						isInputContainer,
						isDropdownButton,
						isDropdownTrigger,
						dropdownOpen,
						isOpeningDropdown,
						dropdownPosition,
						clickedIndex,
						clickedFullIndex: targetInput?.getAttribute('data-index'),
						isEventPrevented: event.defaultPrevented,
						foundTargetInput: !!targetInput,
						plateSectionClicked: !!plateSectionClicked
					},
					null,
					2
				)
		);

		// If clicking on any input, its container, or within the plate section, handle the input
		if (targetInput) {
			debugLog(
				'Input click detected: ' +
					JSON.stringify(
						{
							currentDropdownOpen: dropdownOpen,
							clickedIndex,
							dropdownPosition,
							willPreventDefault: true
						},
						null,
						2
					)
			);
			event.stopPropagation();
			event.preventDefault();

			// If we're switching inputs, handle it explicitly
			if (
				dropdownOpen !== null &&
				clickedIndex !== null &&
				dropdownOpen.toString() !== clickedIndex
			) {
				debugLog('Switching inputs:', {
					from: dropdownOpen,
					to: clickedIndex
				});
				// Remove the old dropdown but don't blur
				const existingDropdown = document.querySelector('[data-testid="character-dropdown"]');
				if (existingDropdown && existingDropdown.parentElement) {
					existingDropdown.parentElement.removeChild(existingDropdown);
				}
				dropdownOpen = null;
				activeElementPosition = null;
			}

			// Focus the input and let the focus handler manage the dropdown
			targetInput.focus();
			return;
		}

		// Handle clicks outside of any interactive elements
		if (!targetInput && !isDropdownButton && !isDropdownTrigger && !plateSectionClicked) {
			debugLog('Closing dropdown due to click outside of interactive elements');
			closeDropdown();
			// Clear any invalid inputs and restore their values
			invalidInputs.forEach((index) => {
				const input = document.querySelector(
					`[data-index="${plateId}-${index}"]`
				) as HTMLInputElement;
				const candidate = plateData.candidates[index];
				if (input && candidate) {
					input.value = candidate.selected;
				}
			});
			invalidInputs.clear();
			invalidInputs = invalidInputs;
		}
	}

	function handleInput(index: number, event: Event) {
		const value = (event.target as HTMLInputElement).value;
		handleCharacterChange(index, value);

		// Close dropdown if input is valid
		if (!invalidInputs.has(index)) {
			closeDropdown();
		} else {
			// Keep dropdown open only for invalid inputs
			if (dropdownOpen === index) {
				const input = event.target as HTMLInputElement;
				const rect = input.getBoundingClientRect();
				activeElementPosition = {
					element: input,
					rect: rect
				};
			}
		}
	}

	function handleDropdownSelect(index: number, normalizedValue: string) {
		const candidate = plateData.candidates[index];
		if (!candidate || !candidate.alternatives.includes(normalizedValue)) {
			return;
		}

		handleCharacterChange(index, normalizedValue);

		// Close dropdown only if the selection was valid
		if (!invalidInputs.has(index)) {
			closeDropdown();
			invalidInputs.delete(index);
			previousValues.delete(index);
		}
	}

	function closeDropdown() {
		debugLog(
			'Closing dropdown: ' +
				JSON.stringify(
					{
						activeElement: document.activeElement?.tagName,
						activeElementTestId: (document.activeElement as HTMLElement)?.getAttribute(
							'data-testid'
						),
						dropdownOpen
					},
					null,
					2
				)
		);
		// Remove any existing dropdown from the DOM
		const existingDropdown = document.querySelector('[data-testid="character-dropdown"]');
		if (existingDropdown && existingDropdown.parentElement) {
			existingDropdown.parentElement.removeChild(existingDropdown);
		}
		dropdownOpen = null;
		activeElementPosition = null;
		// Remove scroll prevention
		isPreventingScroll = false;
		document.removeEventListener('wheel', preventScroll);
		document.removeEventListener('touchmove', preventScroll);
		// Blur any focused input
		const activeElement = document.activeElement;
		if (activeElement instanceof HTMLElement) {
			activeElement.blur();
		}
	}

	function handleCharacterChange(index: number, newValue: string) {
		const normalizedValue = normalizeInput(newValue);
		const candidate = plateData.candidates[index];
		if (!candidate) {
			return;
		}

		// Validate the input first
		if (!candidate.alternatives.includes(normalizedValue)) {
			invalidInputs.add(index);
			invalidInputs = invalidInputs;
			return;
		}

		// Special case for 'EL' prefix
		if (index === 0 && normalizedValue === 'E' && plateData.candidates[1]?.selected === 'L') {
			invalidInputs.add(index);
			invalidInputs = invalidInputs;
			return;
		}
		if (index === 1 && normalizedValue === 'L' && plateData.candidates[0]?.selected === 'E') {
			invalidInputs.add(index);
			invalidInputs = invalidInputs;
			return;
		}

		// Check if plate will have a number after this change
		const willHaveNumberAfterChange = willHaveNumber(plateData.candidates, index, normalizedValue);

		if (!willHaveNumberAfterChange) {
			// Try to add a number to another position
			const rightmostPos = findRightmostNumberPosition(plateData.candidates, index);

			if (rightmostPos === -1 || !addNumberToPosition(plateData.candidates[rightmostPos])) {
				// Could not add a number, mark input as invalid
				invalidInputs.add(index);
				invalidInputs = invalidInputs;
				return;
			}
			// Force reactivity after adding number
			plateData = { ...plateData, candidates: [...plateData.candidates] };
			dispatch('plateDataChange', plateData);
		}

		// If all validation passes and value is different, update the value and track the change
		if (candidate.selected !== normalizedValue) {
			plateData.metadata.lastChangeCounter = (plateData.metadata.lastChangeCounter || 0) + 1;
			candidate.lastChanged = plateData.metadata.lastChangeCounter;
			candidate.selected = normalizedValue;

			// Force reactivity after the main change
			plateData = { ...plateData, candidates: [...plateData.candidates] };

			dispatch('select', { index, value: normalizedValue });
			dispatch('plateDataChange', plateData);
		}

		invalidInputs.delete(index);
		invalidInputs = invalidInputs;
	}

	// Helper function to check if plate will have a number after a change
	function willHaveNumber(
		candidates: PlateCandidate[],
		changeIndex: number,
		newValue: string
	): boolean {
		// Check if the new value is a number
		if (isNumber(newValue)) {
			return true;
		}

		// Check if any other non-skipped position has a number
		return candidates.some(
			(c, i) => !c.isSkippedVowel && i !== changeIndex && isNumber(c.selected)
		);
	}

	// Helper function to find rightmost position that can be a number
	function findRightmostNumberPosition(candidates: PlateCandidate[], skipIndex: number): number {
		// First find all valid positions that can be numbers
		const validPositions = candidates
			.map((c, i) => ({ candidate: c, index: i }))
			.filter(
				({ candidate, index }) =>
					index !== skipIndex &&
					!candidate.isSkippedVowel &&
					candidate.alternatives.some((alt) => isNumber(alt))
			);

		if (validPositions.length === 0) {
			return -1;
		}

		// Find smallest lastChanged value among valid positions
		const smallestLastChanged = Math.min(...validPositions.map((p) => p.candidate.lastChanged));

		// Filter positions with smallest lastChanged and get the rightmost one
		const positionsWithSmallestLastChanged = validPositions.filter(
			(p) => p.candidate.lastChanged === smallestLastChanged
		);

		// Return the rightmost position (highest index)
		return positionsWithSmallestLastChanged[positionsWithSmallestLastChanged.length - 1].index;
	}

	// Helper function to add a number to a position
	function addNumberToPosition(candidate: PlateCandidate): boolean {
		const numberAlternative = candidate.alternatives.find((alt) => isNumber(alt));
		if (numberAlternative) {
			candidate.selected = numberAlternative;
			// Force reactivity by reassigning plateData
			plateData = plateData;
			return true;
		}
		return false;
	}

	function normalizeInput(input: string): string {
		return input
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toUpperCase();
	}
</script>

<!-- placeholder on the right column -->
<div class="col-span-3 col-start-1 row-start-[shift-controls]"></div>

{#each displayCandidates as candidate, index}
	<PlateShiftControls
		{candidate}
		{index}
		{plateId}
		{plateData}
		on:plateDataChange={({ detail }) => {
			plateData = detail;
			dispatch('plateDataChange', detail);
		}}
	/>
{/each}

<!-- placeholder on the right column -->
<div class="col-span-3 col-start-1 row-start-[arrow-down]"></div>

{#each displayCandidates as candidate, index}
	<PlateCandidateCharacter
		{candidate}
		{dropdownOpen}
		{index}
		{plateId}
		{isMobile}
		{isEditable}
		{invalidInputs}
		{getTooltipText}
		{handleTooltipTouch}
		{handleFocus}
		{handleInput}
		{handleBlur}
		{tooltipVisible}
		{previousValues}
		{section}
		on:dropdownOpenChange={({ detail }) => (dropdownOpen = detail.index)}
		on:activeElementPositionChange={({ detail }) => (activeElementPosition = detail.position)}
	/>
	{#if dropdownOpen === index && isEditable(index)}
		{#if activeElementPosition}
			<PlateCharacterDropdown
				alternatives={candidate.alternatives}
				{isMobile}
				{activeElementPosition}
				onSelect={(value) => dropdownOpen !== null && handleDropdownSelect(dropdownOpen, value)}
				position={index}
				{section}
			/>
		{/if}
	{/if}
	{#if index === 2}
		<div
			class="flex items-center justify-center row-start-[plate-display] text-gray-200 dark:text-gray-700"
			data-testid="plate-separator"
		>
			<div class="flex flex-col items-center justify-center gap-1.5">
				<FontAwesomeIcon icon={faCircle} class="w-2.5 h-2.5" />
				<FontAwesomeIcon icon={faCircle} class="w-2.5 h-2.5" />
			</div>
		</div>
	{/if}
{/each}

<style>
	/* Ensure pointer events work on containers of disabled inputs */
	:global([data-testid='input-container']) {
		pointer-events: auto;
	}
	:global(input[disabled]) {
		pointer-events: none;
	}
</style>
