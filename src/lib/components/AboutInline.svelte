<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import AboutIntro from './AboutIntro.svelte';
	import AboutDetails from './AboutDetails.svelte';
	import ExpandableDetails from './ExpandableDetails.svelte';
	import { isLocaleLoaded } from '$lib/i18n';
</script>

<div class="mt-8 text-gray-700 dark:text-gray-300 max-w-2xl">
	{#if $isLocaleLoaded}
		<h2 class="text-2xl font-bold mb-4">{$_('AboutInline.title')}</h2>
		<AboutIntro />
		<ExpandableDetails>
			<AboutDetails />
		</ExpandableDetails>
	{:else}
		<div class="space-y-6">
			<div class="h-9 w-[32rem] bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
			<div class="space-y-4">
				<div class="space-y-2">
					<div class="h-5 w-[35rem] bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
					<div class="h-5 w-[33rem] bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
				</div>
				<div class="space-y-2">
					<div class="h-5 w-[34rem] bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
					<div class="h-5 w-[32rem] bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
				</div>
			</div>
		</div>
	{/if}
</div>
