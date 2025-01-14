<!-- Test Preview for InputSection -->
<script lang="ts">
	import InputSection from '$lib/components/InputSection.svelte';
	import { addMessages, dictionary, init, locale } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	// Initialize i18n with test messages
	const messages = {
		inputSection: {
			placeholder: 'Enter text for a plate'
		}
	};

	// Initialize i18n immediately for SSR
	init({
		fallbackLocale: 'en',
		initialLocale: 'en'
	});
	addMessages('en', messages);

	// Ensure dictionary is set for both SSR and client
	if (browser) {
		onMount(() => {
			dictionary.set({ en: messages });
			locale.set('en');
		});
	} else {
		dictionary.set({ en: messages });
		locale.set('en');
	}

	// Event logging functions
	function logEvent(name: string, detail: any) {
		const log = document.getElementById('event-log');
		if (log) {
			const time = new Date().toLocaleTimeString();
			log.textContent = `${time} - ${name}: ${JSON.stringify(detail)}\n${log.textContent}`;
		}
	}

	function handlePlateData(event: CustomEvent) {
		logEvent('platedata', event.detail);
	}

	function handleFocus() {
		logEvent('focus', {});
	}

	function handleBlur() {
		logEvent('blur', {});
	}
</script>

<div class="p-4">
	<h1 class="mb-4 text-2xl">InputSection Test Preview</h1>

	<div class="space-y-4">
		<div class="p-4 border rounded">
			<h2 class="mb-2 text-lg">Default State</h2>
			<InputSection on:platedata={handlePlateData} on:focus={handleFocus} on:blur={handleBlur} />
		</div>

		<div class="p-4 border rounded">
			<h2 class="mb-2 text-lg">With Initial Value</h2>
			<InputSection
				initialValue="ABC123"
				on:platedata={handlePlateData}
				on:focus={handleFocus}
				on:blur={handleBlur}
			/>
		</div>

		<div class="p-4 border rounded">
			<h2 class="mb-2 text-lg">With Focus</h2>
			<InputSection
				shouldFocus={true}
				on:platedata={handlePlateData}
				on:focus={handleFocus}
				on:blur={handleBlur}
			/>
		</div>

		<div class="p-4 border rounded">
			<h2 class="mb-2 text-lg">With Index</h2>
			<InputSection
				index={2}
				on:platedata={handlePlateData}
				on:focus={handleFocus}
				on:blur={handleBlur}
			/>
		</div>
	</div>

	<div class="p-4 mt-4 bg-gray-100 rounded">
		<h2 class="mb-2 text-lg">Event Log</h2>
		<pre id="event-log" class="whitespace-pre-wrap"></pre>
	</div>
</div>
