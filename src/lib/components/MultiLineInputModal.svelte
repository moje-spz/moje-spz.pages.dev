<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import type { PlateData } from '../types';
	import { processInput } from '../plateProcessor';
	import { browser } from '$app/environment';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';

	export let show: boolean = false;
	export let plateData: PlateData[] = [];
	export let maxLines = 10;

	const dispatch = createEventDispatcher<{
		submit: PlateData[];
		close: void;
	}>();

	// Action to focus element on mount
	function focusOnMount(node: HTMLElement) {
		node.focus();
	}

	let textareaHeight = '12rem'; // Default height (equivalent to h-48)
	let multipleInputValue = '';
	let textarea: HTMLTextAreaElement;
	let modalElement: HTMLDivElement;
	let wasShown = false;
	let useCompactLayout = false;
	const MIN_TEXTAREA_HEIGHT = '4.5rem'; // Minimum height for 3 rows
	const MIN_ROWS = 3;

	export function adjustTextareaHeight() {
		if (!modalElement || !textarea || !browser) return;

		const currentViewportHeight = window.visualViewport?.height ?? window.innerHeight;
		const availableHeight = currentViewportHeight - 32; // 32px for top/bottom margin
		const modalWithoutTextarea = modalElement.clientHeight - textarea.clientHeight;
		const maxTextareaHeight = availableHeight - modalWithoutTextarea;

		// Calculate how many lines we can fit
		const maxLines = Math.floor(maxTextareaHeight / 24); // 24px per line (1.5rem)
		const targetLines = Math.max(MIN_ROWS, Math.min(maxLines, 10)); // Cap at 10 lines

		useCompactLayout = targetLines <= MIN_ROWS;
		textareaHeight = useCompactLayout ? MIN_TEXTAREA_HEIGHT : '12rem';
	}

	$: if (show) {
		if (!wasShown) {
			wasShown = true;
			multipleInputValue = plateData
				.filter((plate) => plate.input.trim().length > 0)
				.map((plate) => plate.input)
				.join('\n');
			if (typeof document !== 'undefined') {
				document.body.style.overflow = 'hidden';
			}
		}
		// Adjust height whenever show changes to true
		setTimeout(adjustTextareaHeight, 0);
	}

	$: if (useCompactLayout) {
		textareaHeight = MIN_TEXTAREA_HEIGHT;
	}

	$: if (!show) {
		wasShown = false;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	}

	function handleClose() {
		show = false;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
		dispatch('close');
	}

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', handleEscape);
			window.visualViewport?.addEventListener('resize', adjustTextareaHeight);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleEscape);
			window.visualViewport?.removeEventListener('resize', adjustTextareaHeight);
		}
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		const lines = multipleInputValue.split('\n');

		const processedLines = lines
			.map((line) => {
				return processInput(line);
			})
			.filter((data) => data.candidates.length > 0)
			.slice(0, maxLines);

		dispatch('submit', processedLines);
		handleClose();
	}
</script>

{#if show}
	<div
		class="fixed inset-0 flex items-start justify-center p-4 z-50 h-[100dvh] max-h-[100dvh]"
		role="dialog"
		aria-modal="true"
		data-testid="modal-overlay"
		style:touch-action="none"
	>
		<button
			type="button"
			class="fixed inset-0 w-full h-full bg-black bg-opacity-50 cursor-default"
			on:click={handleClose}
			on:keydown={handleEscape}
			aria-label={$_('hamburgerMenu.closeOverlay')}
			data-testid="modal-overlay-button"
		/>
		<div
			class="relative z-10 w-full max-w-md p-4 my-4 bg-white rounded-lg shadow-xl dark:bg-gray-800"
			style="max-height: calc(100dvh - 2rem);"
			bind:this={modalElement}
			data-testid="modal-content"
		>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
					{$_('multiLineInputModal.title')}
				</h2>
				{#if !useCompactLayout}
					<button
						type="button"
						class="flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
						on:click={handleClose}
						aria-label={$_('hamburgerMenu.closeOverlay')}
						data-testid="close-button"
					>
						<FontAwesomeIcon icon={faXmark} class="w-5 h-5" />
					</button>
				{:else}
					<div class="flex gap-2">
						<button
							type="button"
							class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
							on:click={handleClose}
						>
							{$_('multiLineInputModal.cancel')}
						</button>
						<button
							type="submit"
							form="multiline-input-form"
							class="px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
							data-testid="modal-submit"
						>
							{$_('multiLineInputModal.ok')}
						</button>
					</div>
				{/if}
			</div>
			<form on:submit={handleSubmit} class="mb-0" id="multiline-input-form">
				<textarea
					class="w-full p-2 text-gray-900 uppercase bg-white border rounded-md resize-none dark:bg-gray-700 dark:text-gray-100 placeholder:normal-case"
					style="height: {textareaHeight}"
					placeholder={$_('multiLineInputModal.placeholder')}
					bind:value={multipleInputValue}
					bind:this={textarea}
					data-testid="multiple-input-textarea"
					use:focusOnMount
				/>
				<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
					{$_('multiLineInputModal.help')}
				</p>
				{#if !useCompactLayout}
					<div class="flex justify-end gap-4 mt-4">
						<button
							type="button"
							class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
							on:click={handleClose}
						>
							{$_('multiLineInputModal.cancel')}
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
							data-testid="modal-submit"
						>
							{$_('multiLineInputModal.ok')}
						</button>
					</div>
				{/if}
			</form>
		</div>
	</div>
{/if}
