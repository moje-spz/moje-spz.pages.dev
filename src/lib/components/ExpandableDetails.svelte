<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';

	let isExpanded = false;

	function handleToggle(event: Event) {
		const details = event.target as HTMLDetailsElement;
		isExpanded = details.open;
	}
</script>

<details on:toggle={handleToggle}>
	<summary class="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
		{isExpanded ? $_('expandableDetails.showLess') : $_('expandableDetails.showMore')}
	</summary>
	<slot />
</details>
