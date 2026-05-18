const Redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

let client = null;
let isReady = false;

if (REDIS_URL) {
	client = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });

	// Prevent unhandled error events from crashing the process
	client.on('error', (err) => {
		console.error('[redis] error', err && err.message ? err.message : err);
	});

	client.on('connect', () => {
		isReady = true;
		console.log('[redis] connected');
	});

	client.on('end', () => {
		isReady = false;
		console.warn('[redis] connection closed');
	});
} else {
	console.warn('[redis] REDIS_URL not set - using in-memory stub');
}

// Minimal stub implementation used when Redis isn't reachable.
const stub = {
	async get() { return null; },
	async set() { return 'OK'; },
	async setex() { return 'OK'; },
	async del() { return 0; },
	async exists() { return 0; },
};

// Export a small wrapper that delegates to the real client when ready,
// otherwise uses the stub so callers don't need to handle nulls.
const exported = new Proxy({}, {
	get(_, prop) {
		if (client && isReady && typeof client[prop] === 'function') {
			return client[prop].bind(client);
		}

		// fallback to stubbed async function
		if (typeof stub[prop] === 'function') return stub[prop].bind(stub);

		// unknown property -> return a noop that resolves
		return async () => null;
	}
});

module.exports = exported;
