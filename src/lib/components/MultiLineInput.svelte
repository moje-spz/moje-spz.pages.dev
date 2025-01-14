<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { isLocaleLoaded } from '$lib/i18n';

	const dispatch = createEventDispatcher<{
		togglemultiple: void;
	}>();

	function handleMultipleInput() {
		dispatch('togglemultiple');
	}
</script>

<button
	on:click={handleMultipleInput}
	class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
	data-testid="multiple-input-button"
>
	{#if $isLocaleLoaded}
		{$_('multiLineInput.multipleLink')}
	{:else}
		<div
			class="flex items-center w-48 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
		></div>
	{/if}
</button>
