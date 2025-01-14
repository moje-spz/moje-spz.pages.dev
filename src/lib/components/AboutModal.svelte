<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import DialogBox from './DialogBox.svelte';
	import AboutIntro from './AboutIntro.svelte';
	import AboutDetails from './AboutDetails.svelte';
	import { isLocaleLoaded } from '$lib/i18n';
	import UploadIssuedReservedPlatesModal from './UploadIssuedReservedPlatesModal.svelte';
	import { writable } from 'svelte/store';

	export let show = false;
	let showUploadModal = false;
	const repoUrl = writable<string>(pkg?.repository?.url || '');
</script>

{#if $isLocaleLoaded}
	<DialogBox bind:show title={$_('aboutModal.title')}>
		<div class="space-y-6 text-gray-900 dark:text-gray-100">
			<h3 class="text-lg font-bold">{$_('AboutInline.title')}</h3>
			<AboutIntro />
			<AboutDetails />
			<p>
				{$_('aboutModal.portalLink.prefix')}
				<a
					href={$_('aboutModal.portalLink.url')}
					class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
					>{$_('aboutModal.portalLink.linkText')}</a
				>{$_('aboutModal.portalLink.postfix')}
			</p>
		</div>
	</DialogBox>
{:else if show}
	<DialogBox bind:show title="">
		<div class="space-y-6">
			<div class="space-y-2">
				<div class="w-full h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
				<div class="w-3/4 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
				<div class="w-5/6 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
			</div>
			<div class="space-y-2">
				<div class="w-2/3 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
				<div class="w-1/2 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
			</div>
		</div>
	</DialogBox>
{/if}

<UploadIssuedReservedPlatesModal bind:show={showUploadModal} />
