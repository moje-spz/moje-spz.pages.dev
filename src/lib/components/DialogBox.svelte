<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';

	export let show = false;
	export let title: string | undefined = undefined;
	export let class_name = '';
	export let padding_class = 'p-2';

	let modalElement: HTMLDivElement;
	let contentElement: HTMLDivElement;
	let showBottomShadow = false;
	let showTopShadow = false;

	onMount(() => {
		if (contentElement) {
			updateScrollShadows();
		}
	});

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	function handleClose() {
		show = false;
		dispatch('close');
	}

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function updateScrollShadows() {
		if (!contentElement) return;

		const { scrollTop, scrollHeight, clientHeight } = contentElement;
		showBottomShadow = scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight - 1;
		showTopShadow = scrollTop > 0;
	}

	$: if (show) {
		setTimeout(updateScrollShadows, 0);
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
		<button
			type="button"
			class="fixed inset-0 w-full h-full bg-black bg-opacity-50 cursor-default"
			on:click={handleOverlayClick}
			on:keydown={handleEscape}
			data-testid="modal-overlay"
			aria-label={$_('hamburgerMenu.closeOverlay')}
		/>
		<div
			bind:this={modalElement}
			class="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[240px] max-h-[90vh] overflow-hidden w-[95%] sm:w-[40rem] {padding_class} {class_name}"
			data-testid="modal-content"
		>
			<div class="mb-2">
				{#if title}
					<h2 class="pr-8 text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{title}</h2>
				{:else}
					<slot name="title" />
				{/if}
				<button
					class="absolute p-2 text-gray-500 rounded-md top-2 right-2 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					on:click={handleClose}
					data-testid="close-button"
				>
					<FontAwesomeIcon icon={faXmark} class="w-5 h-5" />
				</button>
			</div>
			<div class="relative">
				{#if showTopShadow}
					<div
						class="absolute top-0 left-0 right-0 z-10 h-12 pointer-events-none bg-gradient-to-b from-white dark:from-gray-800 to-transparent"
					/>
				{/if}
				<div
					bind:this={contentElement}
					class="overflow-y-auto max-h-[calc(90vh-6rem)]"
					on:scroll={updateScrollShadows}
				>
					<slot />
				</div>
				{#if showBottomShadow}
					<div
						class="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-t from-white dark:from-gray-800 to-transparent"
					/>
				{/if}
			</div>
		</div>
	</div>
{/if}
