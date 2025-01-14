<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { isLocaleLoaded } from '$lib/i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBookmark as faBookmarkSolid } from '@fortawesome/free-solid-svg-icons';
	import { savedPlates } from '../stores/savedPlates';

	export let showSavedPlatesModal = false;
</script>

<button
	class="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
	on:click={() => (showSavedPlatesModal = true)}
	title={$isLocaleLoaded ? $_('plateDisplay.savedPlates') : ''}
	data-testid="header-saved-plates-button"
>
	<FontAwesomeIcon icon={faBookmarkSolid} class="text-xl" />
</button>
