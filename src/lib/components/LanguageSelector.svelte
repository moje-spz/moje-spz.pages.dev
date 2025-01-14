<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { locales } from '$lib/config/l10n';
	import { language } from '$lib/stores/language';
	import type { LanguagePreference } from '$lib/config/l10n';
	import { isLocaleLoaded } from '$lib/i18n';

	function handleLocaleChange(event: Event): void {
		const select = event.target as HTMLSelectElement;
		if (select) {
			language.set(select.value as LanguagePreference);
		}
	}
</script>

{#if !$isLocaleLoaded}
	<div class="w-full md:w-36 h-8 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
{:else}
	<select
		id="language-selector"
		value={$language}
		on:change={handleLocaleChange}
		class="w-full px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200 cursor-pointer appearance-none bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em] bg-no-repeat pr-10"
	>
		<option value="auto">{$_('languageSelector.auto')}</option>
		{#each Object.entries(locales) as [code, name]}
			<option value={code}>{name}</option>
		{/each}
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
