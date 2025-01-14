<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCheck } from '@fortawesome/free-solid-svg-icons';
	import { faClone } from '@fortawesome/free-regular-svg-icons';

	export let text: string;
	export let class_name = '';

	let copySuccess = false;
	let copyTimeout: NodeJS.Timeout;

	async function copyToClipboard() {
		try {
			// First try the modern Clipboard API
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
				copySuccess = true;
			} else {
				// Fallback for older browsers or mobile devices
				const textArea = document.createElement('textarea');
				textArea.value = text;
				textArea.style.position = 'fixed';
				textArea.style.left = '-9999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();

				try {
					document.execCommand('copy');
					copySuccess = true;
				} catch (err) {
					console.error('execCommand error:', err);
					copySuccess = false;
				} finally {
					document.body.removeChild(textArea);
				}
			}

			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
			copySuccess = false;
		}
	}
</script>

<button
	class="flex items-center justify-center w-full h-full text-gray-600 rounded-md hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 {class_name}"
	on:click={copyToClipboard}
	title={$_('plateDisplay.copyToClipboard')}
	data-testid="copy-plate-button"
>
	<div class="flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6">
		{#if copySuccess}
			<FontAwesomeIcon icon={faCheck} class="w-full h-full" />
		{:else}
			<FontAwesomeIcon icon={faClone} class="w-full h-full" />
		{/if}
	</div>
</button>
