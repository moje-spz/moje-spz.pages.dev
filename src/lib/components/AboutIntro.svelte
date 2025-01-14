<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { dictionary, locale } from 'svelte-i18n';
	import { derived } from 'svelte/store';

	const introText = derived(
		[dictionary, locale],
		([$dictionary, $locale]) => ($dictionary[$locale]?.AboutIntro || []) as string[]
	);
</script>

<div class="space-y-4">
	{#each $introText as paragraph}
		<p>{paragraph}</p>
	{/each}
</div>
