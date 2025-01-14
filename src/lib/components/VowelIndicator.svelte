<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import type { VowelIndicatorData } from '$lib/types';
	import { _ } from 'svelte-i18n';

	export let data: VowelIndicatorData;

	// Check if there are any skipped vowels
	$: hasSkippedVowels = data.vowels.some((v) => v !== null);
</script>

{#if data.metadata.errors.length > 0}
	<div class="row-start-[vowel-indicator] col-span-23 row-start-[vowel-indicator] text-center">
		<span class="text-red-600 dark:text-red-400">
			{#each data.metadata.errors as error, i}
				{$_(error)}{#if i < data.metadata.errors.length - 1}<br />{/if}
			{/each}
		</span>
	</div>
{:else if hasSkippedVowels}
	<div class="col-span-2 row-start-[vowel-indicator]">&nbsp;</div>
	<!-- vowel-indicator -->
	{#each data.vowels.slice(0, 9) as vowel, i}
		<div
			class="w-full {i === 3 ? 'col-span-3' : 'col-span-2'} row-start-[vowel-indicator] text-center"
			data-testid="vowel-indicator-char"
		>
			{#if vowel !== null}
				<span class="text-yellow-600 dark:text-yellow-400">
					{vowel.selected}
				</span>
			{:else}
				&nbsp;
			{/if}
		</div>
	{/each}
{/if}
