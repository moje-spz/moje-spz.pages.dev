<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { setupI18n, isLocaleLoaded } from '$lib/i18n';
	import { _ } from 'svelte-i18n';
	import '../app.css';
	import { theme, type Theme } from '$lib/stores/preferences';
	import SavedPlatesModal from '$lib/components/SavedPlatesModal.svelte';
	import AboutModal from '$lib/components/AboutModal.svelte';
	import PlateAvailabilityFreshness from '$lib/components/PlateAvailabilityFreshness.svelte';
	import { writable } from 'svelte/store';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faGear, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import HeaderSavedPlatesIcon from '$lib/components/HeaderSavedPlatesIcon.svelte';
	import { browser } from '$app/environment';
	import { plateAvailabilityVersion } from '$lib/stores/plateAvailability';

	let showSavedPlates = false;
	let showAboutModal = false;
	let showSettingsModal = false;
	let isLoading = true;
	let loadError: string | null = null;
	let hasAvailabilityData = false;

	const repoUrl = writable<string>(pkg?.repository?.url || '');

	// Initialize theme immediately
	if (typeof window !== 'undefined') {
		const storedTheme = (localStorage.getItem('theme') || 'auto') as Theme;
		const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		if (storedTheme === 'dark' || (storedTheme === 'auto' && isDark)) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		theme.set(storedTheme);
	}

	onMount(async () => {
		try {
			await setupI18n();
			isLoading = false;
		} catch (error) {
			console.error('Failed to load translations:', error);
			loadError = error instanceof Error ? error.message : 'Unknown error loading translations';
			isLoading = false;
		}
	});

	// Update document title when translations are loaded
	$: if ($isLocaleLoaded) {
		document.title = $_('appTitle');
	}

	// Check for plate availability data
	$: {
		$plateAvailabilityVersion; // Subscribe to changes
		if (browser) {
			const storedData = localStorage.getItem('issuedReservedPlates');
			hasAvailabilityData = !!storedData && storedData !== '{}';
		}
	}
</script>

{#if loadError}
	<div class="flex items-center justify-center min-h-screen">
		<p class="text-red-600 dark:text-red-400">{loadError}</p>
	</div>
{:else}
	<div class="flex flex-col min-h-screen transition-colors duration-200 bg-white dark:bg-gray-800">
		<header class="flex-none transition-colors duration-200 bg-white shadow-sm dark:bg-gray-800">
			<div class="max-w-6xl mx-auto">
				<div class="flex items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
					<h1
						class="font-bold text-gray-900 transition-colors duration-200 dark:text-gray-100"
						style="font-size: var(--text-xl);"
					>
						{#if !isLoading && $isLocaleLoaded}
							{$_('appTitle')}
						{:else}
							<div class="w-32 h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
						{/if}
					</h1>
					<div class="flex items-center gap-1">
						<div class="relative">
							<button
								class="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
								on:click={() => (showSettingsModal = true)}
								data-testid="settings-button"
								aria-label={$isLocaleLoaded ? $_('settings.title') : 'Settings'}
							>
								<FontAwesomeIcon icon={faGear} class="text-xl" />
							</button>
							{#if !hasAvailabilityData && $isLocaleLoaded}
								<div
									class="absolute -top-1 -right-1 text-amber-500"
									title={$_('settings.plateAvailability.noDataTitle')}
								>
									<FontAwesomeIcon icon={faQuestionCircle} class="text-sm" />
								</div>
							{/if}
						</div>
						<HeaderSavedPlatesIcon bind:showSavedPlatesModal={showSavedPlates} />
					</div>
				</div>
			</div>
		</header>

		<main
			class="flex-auto w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(520px,600px)_minmax(0,1fr)]"
		>
			<slot />
		</main>

		<footer class="flex-none w-full mt-auto border-t border-gray-200 dark:border-gray-700">
			<div
				class="flex flex-col items-start justify-between max-w-6xl gap-4 px-4 py-4 mx-auto text-gray-600 sm:px-6 lg:px-8 sm:flex-row sm:items-center sm:gap-0 dark:text-gray-400"
				style="font-size: var(--text-sm);"
			>
				<div class="flex-1">
					{#if !isLoading && $isLocaleLoaded}
						<span>{$_('aboutModal.portalLink.prefix')} </span>
						<a
							href={$_('aboutModal.portalLink.url')}
							class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
						>
							{$_('aboutModal.portalLink.linkText')}
						</a>
						<span>{$_('aboutModal.portalLink.postfix')}</span>
						<PlateAvailabilityFreshness />
					{:else}
						<div class="w-[48rem] h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
					{/if}
				</div>
				<div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
					{#if !isLoading && $isLocaleLoaded}
						<button
							class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
							on:click={() => (showAboutModal = true)}
						>
							{$_('aboutModal.footer.aboutLink')}
						</button>
					{:else}
						<div class="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700 animate-pulse"></div>
					{/if}
				</div>
			</div>
		</footer>
	</div>
{/if}

{#if showSavedPlates}
	<SavedPlatesModal bind:show={showSavedPlates} />
{/if}

{#if showAboutModal}
	<AboutModal bind:show={showAboutModal} />
{/if}

{#if showSettingsModal}
	<SettingsModal bind:show={showSettingsModal} />
{/if}

<style>
	:global(body) {
		background-color: rgb(255 255 255);
	}

	:global(.dark body) {
		background-color: rgb(31 41 55);
	}
</style>
