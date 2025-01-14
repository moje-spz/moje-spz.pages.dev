<!--
SPDX-FileCopyrightText: 2025 Pavol Babinčák

SPDX-License-Identifier: MIT
-->
<script lang="ts" context="module">
	declare namespace svelteHTML {
		interface HTMLAttributes<T> {
			slot?: 'title' | 'content';
		}
	}
</script>

<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onDestroy } from 'svelte';
	import DialogBox from './DialogBox.svelte';
	import { isLocaleLoaded } from '$lib/i18n';
	import { browser } from '$app/environment';
	import { createEventDispatcher } from 'svelte';
	import { notifyPlateAvailabilityUpdate } from '$lib/stores/plateAvailability';

	export let show = false;
	let dragOver = false;
	let dragCounter = 0;
	let fileInput: HTMLInputElement;
	let errorMessage: string | null = null;

	interface Metadata {
		hash_value: string;
		hash_function: 'SHA-256' | 'djb2';
		newest_entry_date_time: string;
		total_entries: number;
		entries_by_state: {
			terminated: number;
			issued: number;
			reserved: number;
			assigned: number;
			stored: number;
		};
	}

	interface StoredData {
		version: string;
		hash_value: string;
		hash_function: 'SHA-256' | 'djb2';
		newest_entry_date_time: string;
		states: {
			terminated: string[];
			issued: string[];
			reserved: string[];
			assigned: string[];
			stored: string[];
		};
		plates: { [key: string]: string };
	}

	let metadata: Metadata | null = null;
	let uploadedMetadata: Metadata | null = null;
	let showOverwriteWarning = false;
	let showSameDataWarning = false;
	let showUpdateMessage = false;
	let showOverwrittenMessage = false;
	let showFirstUploadMessage = false;
	let hasDataBeenUpdated = false;

	const dispatch = createEventDispatcher<{
		close: void;
		error: string;
	}>();

	function clearMessages() {
		showSameDataWarning = false;
		showOverwriteWarning = false;
		showUpdateMessage = false;
		showOverwrittenMessage = false;
		showFirstUploadMessage = false;
		errorMessage = null;
	}

	function handleClose() {
		show = false;
		clearMessages();
		// If there's uploaded data that wasn't used to update/overwrite, clear it
		if (uploadedMetadata) {
			uploadedMetadata = null;
		}
		// Only notify about updates when the modal is explicitly closed
		if (hasDataBeenUpdated) {
			notifyPlateAvailabilityUpdate();
			hasDataBeenUpdated = false;
		}
		dispatch('close');
	}

	// Clear messages and uploaded data when modal is opened or closed
	$: {
		if (show) {
			clearMessages();
			uploadedMetadata = null;
			hasDataBeenUpdated = false;
			// Validate existing data when modal is opened
			if (browser) {
				try {
					const storedData = localStorage.getItem('issuedReservedPlates');
					if (storedData) {
						const data = JSON.parse(storedData) as StoredData;
						if (!data.version || data.version !== '1') {
							errorMessage = $_('plateDisplay.errors.invalidVersion');
							dispatch('error', errorMessage);
						} else if (!data.plates || typeof data.plates !== 'object') {
							errorMessage = $_('plateDisplay.errors.invalidDataStructure');
							dispatch('error', errorMessage);
						} else {
							// Populate metadata from stored data
							metadata = {
								hash_value: data.hash_value,
								hash_function: data.hash_function,
								newest_entry_date_time: data.newest_entry_date_time,
								total_entries: Object.keys(data.plates).length,
								entries_by_state: {
									terminated: data.states.terminated.length,
									issued: data.states.issued.length,
									reserved: data.states.reserved.length,
									assigned: data.states.assigned.length,
									stored: data.states.stored.length
								}
							};
						}
					} else {
						metadata = null;
					}
				} catch (e) {
					errorMessage = $_('plateDisplay.errors.invalidData');
					dispatch('error', errorMessage);
					metadata = null;
				}
			}
		} else {
			clearMessages();
			uploadedMetadata = null;
		}
	}

	function handleFileSelect(e: Event) {
		console.log('File selection triggered');
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			console.log('File selected:', { name: file.name, size: file.size, type: file.type });
			if (file.size === 0) {
				console.error('Empty file detected');
				errorMessage = $_('plateDisplay.errors.emptyFile');
				dispatch('error', errorMessage);
				return;
			}
			processFile(file);
			// Clear the input so the same file can be selected again
			input.value = '';
		} else {
			console.log('No file selected or files array is empty');
		}
	}

	interface PlateEntry {
		plate: string;
		dates: {
			reserved: string | null;
			assigned: string | null;
			issued: string | null;
			terminated: string | null;
			stored: string | null;
		};
	}

	function parseCzechDate(dateStr: string): Date | null {
		if (!dateStr) return null;
		const [date, time] = dateStr.split(' ');
		if (!date) return null;
		const [day, month, year] = date.split('.');
		return new Date(`${year}-${month}-${day} ${time}`);
	}

	async function readAndDecodeFile(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = function (e) {
				try {
					const decoder = new TextDecoder('windows-1250');
					const arrayBuffer = e.target?.result as ArrayBuffer;
					const text = decoder.decode(arrayBuffer);
					resolve(text);
				} catch (error) {
					reject(error);
				}
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsArrayBuffer(file);
		});
	}

	function parseCSVContent(content: string): PlateEntry[] {
		const lines = content.split('\n');
		if (lines.length < 2) {
			throw new Error('File has less than 2 lines');
		}

		const separator = lines[0].includes(';') ? ';' : '|';
		return lines
			.slice(1)
			.filter((line) => line.trim())
			.map((line) => {
				const values = line.split(separator);
				return {
					plate: values[0],
					dates: {
						reserved: values[1] || null,
						assigned: values[2] || null,
						issued: values[3] || null,
						terminated: values[4] || null,
						stored: values[5] || null
					}
				};
			});
	}

	async function calculateHash(
		content: string,
		preferredHashFunction: 'SHA-256' | 'djb2' | null = null
	): Promise<{ hashValue: string; hashFunction: 'SHA-256' | 'djb2' }> {
		const canUseCryptoSubtle =
			window.isSecureContext &&
			window.crypto?.subtle &&
			typeof window.crypto.subtle.digest === 'function';

		const hashFunction = preferredHashFunction || (canUseCryptoSubtle ? 'SHA-256' : 'djb2');

		if (hashFunction === 'SHA-256') {
			if (!canUseCryptoSubtle) {
				throw new Error('SHA-256 required but not available');
			}
			const encoder = new TextEncoder();
			const textToHash = encoder.encode(content);
			const hashBuffer = await crypto.subtle.digest('SHA-256', textToHash);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			return {
				hashValue: hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''),
				hashFunction: 'SHA-256'
			};
		} else {
			const textToHash = new TextEncoder().encode(content);
			let hash = 0;
			const chunkSize = 1024 * 1024; // Process 1MB at a time
			for (let i = 0; i < textToHash.length; i += chunkSize) {
				const end = Math.min(i + chunkSize, textToHash.length);
				for (let j = i; j < end; j++) {
					hash = (hash << 5) - hash + textToHash[j];
					hash = hash & hash; // Convert to 32-bit integer
				}
			}
			return {
				hashValue: Math.abs(hash).toString(16).padStart(8, '0'),
				hashFunction: 'djb2'
			};
		}
	}

	function processEntries(entries: PlateEntry[]): {
		states: { [key: string]: string[] };
		plates: { [key: string]: string };
		newestDate: Date;
	} {
		const plateStates = {
			terminated: [] as string[],
			issued: [] as string[],
			reserved: [] as string[],
			assigned: [] as string[],
			stored: [] as string[]
		};

		const platesMap: { [key: string]: string } = {};
		let newestDate = new Date(0);

		entries.forEach((entry) => {
			let state: keyof typeof plateStates = 'reserved';
			let latestDate = new Date(0);

			const dates = {
				stored: parseCzechDate(entry.dates.stored || ''),
				terminated: parseCzechDate(entry.dates.terminated || ''),
				issued: parseCzechDate(entry.dates.issued || ''),
				assigned: parseCzechDate(entry.dates.assigned || ''),
				reserved: parseCzechDate(entry.dates.reserved || '')
			};

			// Find the highest state with a valid date
			if (dates.stored) {
				state = 'stored';
				latestDate = dates.stored;
			} else if (dates.terminated) {
				state = 'terminated';
				latestDate = dates.terminated;
			} else if (dates.issued) {
				state = 'issued';
				latestDate = dates.issued;
			} else if (dates.assigned) {
				state = 'assigned';
				latestDate = dates.assigned;
			} else if (dates.reserved) {
				state = 'reserved';
				latestDate = dates.reserved;
			}

			if (latestDate > newestDate) {
				newestDate = latestDate;
			}

			plateStates[state].push(entry.plate);
			platesMap[entry.plate] = state;
		});

		return { states: plateStates, plates: platesMap, newestDate };
	}

	function createMetadata(
		hashValue: string,
		hashFunction: 'SHA-256' | 'djb2',
		newestDate: Date,
		states: { [key: string]: string[] }
	): Metadata {
		return {
			hash_value: hashValue,
			hash_function: hashFunction,
			newest_entry_date_time: newestDate.toISOString(),
			total_entries: Object.values(states).reduce((acc, curr) => acc + curr.length, 0),
			entries_by_state: {
				terminated: states.terminated.length,
				issued: states.issued.length,
				reserved: states.reserved.length,
				assigned: states.assigned.length,
				stored: states.stored.length
			}
		};
	}

	async function processFile(file: File) {
		console.log('Starting file processing');
		clearMessages();

		try {
			// Read and decode the file
			const content = await readAndDecodeFile(file);
			console.log('File decoded successfully');

			// Parse CSV content
			const entries = parseCSVContent(content);
			console.log('Processed data rows:', entries.length);

			// Get existing hash function if available
			const storedData = localStorage.getItem('issuedReservedPlates');
			let existingHashFunction: 'SHA-256' | 'djb2' | null = null;
			if (storedData) {
				const data = JSON.parse(storedData) as StoredData;
				existingHashFunction = data.hash_function;
			}

			// Calculate hash
			const { hashValue, hashFunction } = await calculateHash(content, existingHashFunction);
			console.log('Hash creation completed:', hashValue.substring(0, 8) + '...');

			// Process entries
			const { states, plates, newestDate } = processEntries(entries);
			console.log('Data processing completed', {
				totalPlates: Object.keys(plates).length,
				statesCounts: {
					stored: states.stored.length,
					terminated: states.terminated.length,
					issued: states.issued.length,
					assigned: states.assigned.length,
					reserved: states.reserved.length
				}
			});

			// Create metadata
			const newMetadata = createMetadata(hashValue, hashFunction, newestDate, states);

			// Check if we have the same data already
			if (storedData) {
				const existingData = JSON.parse(storedData) as StoredData;
				if (existingData.hash_value === hashValue && existingData.hash_function === hashFunction) {
					console.log('Same data detected - showing warning');
					showSameDataWarning = true;
					return;
				}
			}

			if (storedData) {
				const data = JSON.parse(storedData) as StoredData;
				const existingDate = new Date(data.newest_entry_date_time);
				const newDate = new Date(newestDate);

				// Compare dates and entry counts
				if (
					newDate > existingDate ||
					(newDate.getTime() === existingDate.getTime() &&
						newMetadata.total_entries >
							Object.values(data.states).reduce((acc, curr) => acc + curr.length, 0))
				) {
					// New data is newer or has more entries
					uploadedMetadata = newMetadata;
					const dataToSave = {
						version: '1',
						hash_value: hashValue,
						hash_function: hashFunction,
						newest_entry_date_time: newestDate.toISOString(),
						states,
						plates
					};
					localStorage.setItem('issuedReservedPlates', JSON.stringify(dataToSave));
					metadata = newMetadata;
					uploadedMetadata = null; // Clear uploaded data after successful update
					showUpdateMessage = true;
					hasDataBeenUpdated = true;
				} else {
					// New data is older or has fewer entries
					uploadedMetadata = newMetadata;
					showOverwriteWarning = true;
				}
			} else {
				// No existing data, just store the new data
				const dataToSave = {
					version: '1',
					hash_value: hashValue,
					hash_function: hashFunction,
					newest_entry_date_time: newestDate.toISOString(),
					states,
					plates
				};
				localStorage.setItem('issuedReservedPlates', JSON.stringify(dataToSave));
				metadata = newMetadata;
				showFirstUploadMessage = true;
				hasDataBeenUpdated = true;
			}
		} catch (e) {
			console.error('Error processing file:', e);
			errorMessage = $_('plateDisplay.errors.invalidData');
			dispatch('error', errorMessage);
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragCounter = 0;
		dragOver = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			processFile(files[0]);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragOver = true;
	}

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		dragCounter++;
		dragOver = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragCounter--;
		if (dragCounter === 0) {
			dragOver = false;
		}
	}

	function handleOverwrite() {
		if (uploadedMetadata) {
			const dataToSave = {
				version: '1',
				hash_value: uploadedMetadata.hash_value,
				hash_function: uploadedMetadata.hash_function,
				newest_entry_date_time: uploadedMetadata.newest_entry_date_time
			};
			localStorage.setItem('issuedReservedPlates', JSON.stringify(dataToSave));
			metadata = uploadedMetadata;
			uploadedMetadata = null;
			showOverwriteWarning = false;
			showOverwrittenMessage = true;
			hasDataBeenUpdated = true;
		}
	}

	onDestroy(() => {
		clearMessages();
	});
</script>

{#if show}
	<DialogBox bind:show title={$_('csvUpload.title')} on:close={handleClose} padding_class="p-1">
		{#if showUpdateMessage || showOverwrittenMessage || showFirstUploadMessage}
			<div
				class="p-4 mb-2 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800"
			>
				<p class="text-green-700 dark:text-green-300">
					{#if showUpdateMessage}
						{$_('csvUpload.dataUpdated')}
					{:else if showOverwrittenMessage}
						{$_('csvUpload.dataOverwritten')}
					{:else if showFirstUploadMessage}
						{$_('csvUpload.firstUploadSuccess')}
					{/if}
				</p>
			</div>
		{/if}

		{#if metadata}
			{#if showSameDataWarning}
				<div
					class="p-4 mb-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800"
				>
					<p class="text-yellow-700 dark:text-yellow-300">
						{$_('csvUpload.sameDataWarning')}
					</p>
				</div>
			{:else if showOverwriteWarning}
				<div>
					<div
						class="p-4 mb-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800"
					>
						<p class="text-yellow-700 dark:text-yellow-300">
							{$_('csvUpload.overwriteWarning')}
						</p>
					</div>
				</div>
			{/if}
			<div class="flex gap-6 p-4">
				<!-- Left column -->
				<div class="w-1/2 pr-6 border-r border-gray-200 dark:border-gray-700">
					<h3 class="mb-4 font-medium text-gray-900 dark:text-gray-100">
						{$_('csvUpload.existingData')}
					</h3>
					<div class="space-y-2">
						<div class="text-sm text-gray-600 dark:text-gray-400">
							<p>
								{$_('csvUpload.lastEntry')}: {new Date(
									metadata.newest_entry_date_time
								).toLocaleDateString()}
							</p>
							<p>{$_('csvUpload.totalEntries')}: {metadata.total_entries}</p>
							<div class="mt-2">
								<p class="mb-1">{$_('csvUpload.entriesByState')}:</p>
								<ul class="pl-4 list-disc list-inside">
									<li>{$_('csvUpload.states.reserved')}: {metadata.entries_by_state.reserved}</li>
									<li>{$_('csvUpload.states.assigned')}: {metadata.entries_by_state.assigned}</li>
									<li>{$_('csvUpload.states.issued')}: {metadata.entries_by_state.issued}</li>
									<li>
										{$_('csvUpload.states.terminated')}: {metadata.entries_by_state.terminated}
									</li>
									<li>{$_('csvUpload.states.stored')}: {metadata.entries_by_state.stored}</li>
								</ul>
							</div>
							<button
								class="inline-flex items-center px-4 py-2 mt-4 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500/50"
								on:click={() => {
									localStorage.removeItem('issuedReservedPlates');
									metadata = null;
									hasDataBeenUpdated = true;
								}}
								class:hidden={showOverwriteWarning}
							>
								{$_('csvUpload.clearData')}
							</button>
						</div>
					</div>
				</div>

				<!-- Right column: Upload area -->
				<div class="w-1/2">
					<h3 class="mb-4 font-medium text-gray-900 dark:text-gray-100">
						{$_('csvUpload.newData')}
					</h3>

					{#if uploadedMetadata && !showUpdateMessage && !showOverwrittenMessage && !showFirstUploadMessage}
						<div class="mb-6 space-y-2">
							<div class="text-sm text-gray-600 dark:text-gray-400">
								<p>
									{$_('csvUpload.lastEntry')}: {new Date(
										uploadedMetadata.newest_entry_date_time
									).toLocaleDateString()}
								</p>
								<p>{$_('csvUpload.totalEntries')}: {uploadedMetadata.total_entries}</p>
								<div class="mt-2">
									<p class="mb-1">{$_('csvUpload.entriesByState')}:</p>
									<ul class="pl-4 list-disc list-inside">
										<li>
											{$_('csvUpload.states.reserved')}: {uploadedMetadata.entries_by_state
												.reserved}
										</li>
										<li>
											{$_('csvUpload.states.assigned')}: {uploadedMetadata.entries_by_state
												.assigned}
										</li>
										<li>
											{$_('csvUpload.states.issued')}: {uploadedMetadata.entries_by_state.issued}
										</li>
										<li>
											{$_('csvUpload.states.terminated')}: {uploadedMetadata.entries_by_state
												.terminated}
										</li>
										<li>
											{$_('csvUpload.states.stored')}: {uploadedMetadata.entries_by_state.stored}
										</li>
									</ul>
								</div>
							</div>
						</div>

						{#if showOverwriteWarning}
							<div class="flex justify-end space-x-4">
								<button
									class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
									on:click={() => {
										showOverwriteWarning = false;
										uploadedMetadata = null;
									}}
								>
									{$_('csvUpload.cancel')}
								</button>
								<button
									class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 dark:text-gray-900 dark:bg-yellow-500 dark:hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400"
									on:click={handleOverwrite}
								>
									{$_('csvUpload.overwrite')}
								</button>
							</div>
						{/if}
					{/if}

					{#if errorMessage}
						<div class="mb-4 text-red-600 dark:text-red-400">{errorMessage}</div>
					{:else if !showOverwriteWarning}
						<p class="mb-4 text-sm text-gray-500 dark:text-gray-500">
							{$_('csvUpload.instructions.intro')}
							<a
								href={$_('csvUpload.instructions.url')}
								class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
								target="_blank"
								rel="noopener noreferrer"
							>
								{$_('csvUpload.instructions.linkText')}
							</a>
							{$_('csvUpload.instructions.outro')}
						</p>
						<button
							type="button"
							class="w-full h-32 border-2 border-dashed rounded-lg {dragOver
								? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
								: 'border-gray-300 dark:border-gray-600'} flex items-center justify-center cursor-pointer"
							on:dragover={handleDragOver}
							on:dragenter={handleDragEnter}
							on:dragleave={handleDragLeave}
							on:drop={handleDrop}
							on:click|preventDefault|stopPropagation={() => fileInput.click()}
						>
							<div class="text-center">
								<p class="hidden text-gray-600 dark:text-gray-400 hover:block">
									{$_('csvUpload.dropInstructions')}
								</p>
								<p class="block text-gray-600 dark:text-gray-400 hover:hidden">
									{$_('csvUpload.selectFile')}
								</p>
								<p class="hidden text-sm text-gray-500 dark:text-gray-500 hover:block">
									{$_('csvUpload.or')}
								</p>
								<button
									type="button"
									class="px-4 py-2 mt-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
									on:click|preventDefault|stopPropagation={() => fileInput.click()}
								>
									{$_('csvUpload.browse')}
								</button>
							</div>
						</button>
						<input
							type="file"
							accept=".csv"
							class="hidden"
							bind:this={fileInput}
							on:change|preventDefault|stopPropagation={handleFileSelect}
						/>
					{/if}
				</div>
			</div>
		{:else}
			<div class="p-4">
				{#if errorMessage}
					<div class="mb-4 text-red-600 dark:text-red-400">{errorMessage}</div>
				{:else if showSameDataWarning && !showOverwriteWarning}
					<div
						class="p-4 mb-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800"
					>
						<p class="text-yellow-700 dark:text-yellow-300">
							{$_('csvUpload.sameDataWarning')}
						</p>
					</div>
				{/if}

				{#if !showOverwriteWarning}
					<p class="mb-4 text-sm text-gray-500 dark:text-gray-500">
						{$_('csvUpload.instructions.intro')}
						<a
							href={$_('csvUpload.instructions.url')}
							class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
							target="_blank"
							rel="noopener noreferrer"
						>
							{$_('csvUpload.instructions.linkText')}
						</a>
						{$_('csvUpload.instructions.outro')}
					</p>
					<button
						type="button"
						class="w-full h-32 border-2 border-dashed rounded-lg {dragOver
							? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
							: 'border-gray-300 dark:border-gray-600'} flex items-center justify-center cursor-pointer"
						on:dragover={handleDragOver}
						on:dragenter={handleDragEnter}
						on:dragleave={handleDragLeave}
						on:drop={handleDrop}
						on:click|preventDefault|stopPropagation={() => fileInput.click()}
					>
						<div class="text-center">
							<p class="hidden text-gray-600 dark:text-gray-400 hover:block">
								{$_('csvUpload.dropInstructions')}
							</p>
							<p class="block text-gray-600 dark:text-gray-400 hover:hidden">
								{$_('csvUpload.selectFile')}
							</p>
							<p class="hidden text-sm text-gray-500 dark:text-gray-500 hover:block">
								{$_('csvUpload.or')}
							</p>
							<button
								type="button"
								class="px-4 py-2 mt-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
								on:click|preventDefault|stopPropagation={() => fileInput.click()}
							>
								{$_('csvUpload.browse')}
							</button>
						</div>
					</button>
					<input
						type="file"
						accept=".csv"
						class="hidden"
						bind:this={fileInput}
						on:change|preventDefault|stopPropagation={handleFileSelect}
					/>
				{/if}
			</div>
		{/if}
	</DialogBox>
{/if}
