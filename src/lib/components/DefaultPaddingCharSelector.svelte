<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { defaultPaddingChar } from '../stores/preferences';
	import { VALID_CHARS } from '../constants';

	function handlePaddingCharSelect(event: Event) {
		const select = event.target as HTMLSelectElement;
		defaultPaddingChar.set(select.value);
	}
</script>

<select
	id="default-padding-char"
	class="w-full px-3 py-1 text-gray-900 transition-colors duration-200 bg-white border border-gray-300 rounded cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
	value={$defaultPaddingChar}
	on:change={handlePaddingCharSelect}
>
	{#each VALID_CHARS as char}
		<option value={char}>{char}</option>
	{/each}
</select>
