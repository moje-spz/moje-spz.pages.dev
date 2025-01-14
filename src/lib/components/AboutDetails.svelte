<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { dictionary, locale } from 'svelte-i18n';
	import { derived } from 'svelte/store';
	import type { AboutDetailsItem } from '$lib/i18n';
	import PlateAvailabilityInfo from './PlateAvailabilityInfo.svelte';

	const details = derived(
		[dictionary, locale],
		([$dictionary, $locale]) => ($dictionary[$locale]?.AboutDetails || []) as AboutDetailsItem[]
	);
</script>

<div class="space-y-4">
	{#each $details as section}
		{#if section.type === 'ul'}
			<ul class="space-y-2 list-disc list-inside">
				{#each section.content as item}
					<li>{item}</li>
				{/each}
			</ul>
		{:else if section.type === 'p'}
			<p>{section.content}</p>
		{:else if section.type === 'p_and_a'}
			<p>
				{#each section.content as item}
					{#if 'type' in item && item.type === 'plain'}
						{item.text}
					{:else if 'type' in item && item.type === 'a'}
						<a
							href={item.href}
							class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
							target="_blank"
							rel="noopener noreferrer"
						>
							{item.text}
						</a>
					{/if}
				{/each}
			</p>
		{/if}
	{/each}
	<PlateAvailabilityInfo />
</div>
