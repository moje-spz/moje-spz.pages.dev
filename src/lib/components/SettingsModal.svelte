<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import DefaultPaddingCharSelector from './DefaultPaddingCharSelector.svelte';
	import LanguageSelector from './LanguageSelector.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import PlateAvailabilitySelector from './PlateAvailabilitySelector.svelte';

	const dispatch = createEventDispatcher();

	export let show = false;

	function handleClose() {
		show = false;
		dispatch('close');
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
	>
		<button
			type="button"
			class="fixed inset-0 bg-black opacity-50"
			on:click={handleClose}
			aria-label={$_('common.close')}
		/>
		<div
			class="relative w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-lg dark:bg-gray-800"
		>
			<div class="flex items-start justify-between">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
					{$_('settings.title')}
				</h3>
				<button
					class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
					on:click={handleClose}
				>
					<span class="sr-only">{$_('common.close')}</span>
					<i class="fa-solid fa-times" />
				</button>
			</div>
			<div class="mt-4 space-y-4">
				<div class="flex flex-col">
					<label
						for="theme-toggle"
						class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						{$_('themeToggle.label')}
					</label>
					<ThemeToggle />
				</div>
				<div class="flex flex-col">
					<label
						for="language-selector"
						class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						{$_('languageSelector.label')}
					</label>
					<LanguageSelector />
				</div>
				<div class="flex flex-col">
					<label
						for="default-padding-char"
						class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						{$_('plateDisplay.defaultPaddingChar')}
					</label>
					<DefaultPaddingCharSelector />
				</div>
				<div class="flex flex-col">
					<div class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
						{$_('settings.plateAvailability.label')}
					</div>
					<PlateAvailabilitySelector />
				</div>
			</div>
		</div>
	</div>
{/if}
