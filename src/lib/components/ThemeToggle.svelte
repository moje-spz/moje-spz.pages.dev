<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { theme } from '$lib/stores/preferences';
	import { _ } from 'svelte-i18n';
	import { isLocaleLoaded } from '$lib/i18n';
</script>

{#if !$isLocaleLoaded}
	<div class="w-full md:w-36 h-8 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
{:else}
	<select
		id="theme-toggle"
		data-testid="theme-toggle"
		bind:value={$theme}
		class="w-full px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200 cursor-pointer appearance-none bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em] bg-no-repeat pr-10"
	>
		<option value="auto">{$_('themeToggle.auto')}</option>
		<option value="light">{$_('themeToggle.light')}</option>
		<option value="dark">{$_('themeToggle.dark')}</option>
	</select>
{/if}

<style>
	select {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
	}

	:global(.dark) select {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
	}
</style>
