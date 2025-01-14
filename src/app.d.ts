// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals { }

		interface Platform {
			env: {
				// Add your environment variables and bindings here
				// Example: COUNTER: DurableObjectNamespace;
				COUNTER: DurableObjectNamespace;
			};
			context: {
				waitUntil(promise: Promise<void>): void;
			};
			caches: CacheStorage & { default: Cache }
		}

		// interface PageData {}
		// interface PageState {}
	}

	const pkg: {
		repository?: {
			url?: string;
		};
	};
}

export { };
