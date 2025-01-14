<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { separatePlateCharacters } from './plateCharacterUtils';

	export let alternatives: string[] = [];
	export let onSelect: (value: string) => void;
	export let isMobile: boolean = false;
	export let activeElementPosition: { element: Element; rect: DOMRect };
	export let position: number;
	export let section: number;

	function ensureDropdownVisible(node: HTMLElement) {
		if (isMobile) {
			const visualViewport = window.visualViewport;
			const updatePosition = () => {
				// Get current viewport dimensions accounting for keyboard
				const viewportWidth = visualViewport ? visualViewport.width : window.innerWidth;
				const viewportHeight = visualViewport ? visualViewport.height : window.innerHeight;

				// Update activeElementPosition to get latest position
				activeElementPosition = {
					element: activeElementPosition.element,
					rect: activeElementPosition.element.getBoundingClientRect()
				};

				// Calculate the center position of the triggering element
				const elementCenterX =
					activeElementPosition.rect.left + activeElementPosition.rect.width / 2;

				// Set initial position
				node.style.position = 'fixed';
				node.style.left = `${elementCenterX}px`;
				node.style.transform = 'translateX(-50%)';

				// Position below the input with a small gap
				const inputBottom = activeElementPosition.rect.bottom;
				node.style.top = `${inputBottom + 16}px`;

				// After setting initial position, check bounds and adjust if needed
				const dropdownRect = node.getBoundingClientRect();
				const dropdownWidth = dropdownRect.width;
				const dropdownHeight = dropdownRect.height;

				// Adjust horizontal position to keep within viewport
				const leftEdge = elementCenterX - dropdownWidth / 2;
				const rightEdge = elementCenterX + dropdownWidth / 2;

				if (leftEdge < 16) {
					// Keep 16px from left edge
					node.style.transform = 'translateX(0)';
					node.style.left = '16px';
				} else if (rightEdge > viewportWidth - 16) {
					// Keep 16px from right edge
					node.style.transform = 'translateX(-100%)';
					node.style.left = `${viewportWidth - 16}px`;
				}

				// Handle vertical positioning
				const spaceBelow = viewportHeight - inputBottom;
				if (dropdownHeight > spaceBelow) {
					// If not enough space below, try to position above
					const spaceAbove = activeElementPosition.rect.top;
					if (spaceAbove > dropdownHeight) {
						// If there's enough space above, show it above
						node.style.top = `${activeElementPosition.rect.top - dropdownHeight - 16}px`;
					} else {
						// If there's not enough space above or below, ensure it's visible by scrolling
						const scrollAmount = dropdownRect.bottom - viewportHeight + 16;
						window.scrollBy({
							top: scrollAmount,
							behavior: 'smooth'
						});
					}
				}
			};

			// Initial position check using requestAnimationFrame for smoother rendering
			requestAnimationFrame(updatePosition);

			// Add listeners for viewport changes
			if (visualViewport) {
				visualViewport.addEventListener('resize', updatePosition);
				visualViewport.addEventListener('scroll', updatePosition);
			}
			window.addEventListener('resize', updatePosition);

			return {
				destroy() {
					if (visualViewport) {
						visualViewport.removeEventListener('resize', updatePosition);
						visualViewport.removeEventListener('scroll', updatePosition);
					}
					window.removeEventListener('resize', updatePosition);
				}
			};
		}

		// Desktop handling
		const updatePosition = () => {
			// Get the viewport-relative position of the element and scroll position
			const rect = activeElementPosition.element.getBoundingClientRect();
			const scrollX = window.scrollX || window.pageXOffset;
			const scrollY = window.scrollY || window.pageYOffset;
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Convert viewport-relative position to document-relative position
			const elementLeft = rect.left + scrollX;
			const elementBottom = rect.bottom + scrollY;

			// Ensure the dropdown is a direct child of body for proper absolute positioning
			if (node.parentElement !== document.body) {
				document.body.appendChild(node);
			}

			// Set position using absolute positioning relative to document body
			node.style.position = 'absolute';
			node.style.left = `${elementLeft + rect.width / 2}px`;
			node.style.transform = 'translateX(-50%)';
			node.style.top = `${elementBottom + 8}px`; // Position closer to the element

			// After setting initial position, check bounds and adjust if needed
			const dropdownRect = node.getBoundingClientRect();
			const dropdownWidth = dropdownRect.width;

			// Adjust horizontal position to keep within viewport
			const leftEdge = rect.left; // Use viewport-relative for edge detection
			const rightEdge = rect.right;

			if (leftEdge - dropdownWidth / 2 < 16) {
				// Keep 16px from left edge
				node.style.transform = 'translateX(0)';
				node.style.left = `${scrollX + 16}px`;
			} else if (rightEdge + dropdownWidth / 2 > viewportWidth - 16) {
				// Keep 16px from right edge
				node.style.transform = 'translateX(-100%)';
				node.style.left = `${scrollX + viewportWidth - 16}px`;
			}

			// Handle vertical positioning
			const spaceBelow = viewportHeight - rect.bottom;
			const dropdownBottom = rect.bottom + dropdownRect.height + 8;

			console.log('Position measurements:', {
				dropdownBottom,
				viewportHeight,
				spaceBelow,
				dropdownHeight: dropdownRect.height,
				bottomMargin: viewportHeight - dropdownBottom,
				scrollY
			});

			// Only do initial scroll if needed
			if (dropdownBottom > viewportHeight - 96) {
				// Want at least 96px margin at bottom
				const scrollAmount = dropdownBottom - viewportHeight + 96;
				window.scrollBy({
					top: scrollAmount,
					behavior: 'smooth'
				});
			}
		};

		// Only do initial position check, don't update on scroll
		requestAnimationFrame(updatePosition);

		// Only listen for resize events
		window.addEventListener('resize', updatePosition);

		return {
			destroy() {
				window.removeEventListener('resize', updatePosition);
				// Clean up: remove the node from body if it was moved there
				if (node.parentElement === document.body) {
					document.body.removeChild(node);
				}
			}
		};
	}
</script>

<div
	class="absolute z-50 flex {alternatives.length > 15
		? 'px-4 max-w-md'
		: alternatives.length <= 5
			? ''
			: 'max-w-sm'}"
	use:ensureDropdownVisible
	data-testid="character-dropdown"
	data-position={position}
	data-section={section}
	style="position: absolute !important; width: {alternatives.length <= 5
		? 'auto'
		: 'calc(100vw - 2rem)'} !important; pointer-events: auto !important;"
>
	<div
		class="flex-auto overflow-hidden rounded-lg bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-800/5 {alternatives.length >
		15
			? 'w-screen max-w-md'
			: alternatives.length <= 5
				? 'w-auto'
				: 'w-screen max-w-sm'}"
	>
		<div class="p-4">
			{#if alternatives.length > 15}
				{@const { numbers, letters } = separatePlateCharacters(alternatives)}
				<div class="flex gap-x-4">
					<div class="flex-auto">
						<div class="grid grid-cols-5 gap-x-4 gap-y-2">
							{#each letters as alt}
								<button
									type="button"
									class="flex items-center justify-center font-mono text-gray-900 transition-colors border border-gray-300 rounded-lg plate-char dark:text-gray-100 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
									on:mousedown|preventDefault|stopPropagation={() => onSelect(alt)}
								>
									{alt}
								</button>
							{/each}
						</div>
					</div>
					{#if numbers.length > 0}
						<div class="flex-none pl-4 ml-2 border-l border-gray-200 dark:border-gray-700">
							<div class="grid grid-cols-2 gap-2">
								{#each numbers as alt}
									<button
										type="button"
										class="flex items-center justify-center font-mono text-gray-900 transition-colors border border-gray-300 rounded-lg plate-char dark:text-gray-100 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
										on:mousedown|preventDefault|stopPropagation={() => onSelect(alt)}
									>
										{alt}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex gap-2">
					{#each alternatives as alt}
						<button
							type="button"
							class="flex items-center justify-center font-mono text-gray-900 transition-colors border border-gray-300 rounded-lg plate-char dark:text-gray-100 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600"
							on:mousedown|preventDefault|stopPropagation={() => onSelect(alt)}
						>
							{alt}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Interactive plate-char styles */
	.plate-char {
		flex-shrink: 0;
		flex-grow: 0;
		border: 1px solid rgb(229 231 235); /* Light gray border */
	}

	:global(.dark) .plate-char {
		border-color: rgb(55 65 81); /* Darker border for dark mode */
	}
</style>
