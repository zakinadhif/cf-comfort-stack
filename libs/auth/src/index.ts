import type { D1Database, IncomingRequestCfProperties } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { withCloudflare } from "better-auth-cloudflare";
import type { Db } from "@myapp/db";

interface AuthEnv {
	KV?: KVNamespace;
	DB: Db;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
}

/**
 * Creates a Better Auth instance.
 *
 * - Pass `env` at runtime (inside a Cloudflare Worker request handler).
 * - Omit `env` for CLI usage (e.g. `pnpm better-auth:generate`) — uses
 *   a mock drizzle adapter so the CLI can introspect the auth schema without
 *   needing real Cloudflare bindings.
 */
function createAuth(env?: AuthEnv, cf?: IncomingRequestCfProperties) {
	const db = env ? env.DB : ({} as any);

	return betterAuth({
		...withCloudflare(
			{
				autoDetectIpAddress: true,
				geolocationTracking: true,
				cf: cf || {},
				d1: env
					? {
							db,
							options: {
								usePlural: true,
								debugLogs: false,
							},
						}
					: undefined,
				kv: env?.KV as any,
			},
			{
				emailAndPassword: {
					enabled: true,
				},
				socialProviders: env
					? {
							google: {
								enabled: true,
								clientId: env.GOOGLE_CLIENT_ID,
								clientSecret: env.GOOGLE_CLIENT_SECRET,
							},
						}
					: {},
				rateLimit: {
					enabled: true,
					window: 60, // seconds (minimum KV TTL)
					max: 100, // requests per window
				},
			},
		),
		// Only add the drizzle adapter for CLI schema generation.
		// At runtime, the D1 binding is used directly via better-auth-cloudflare.
		...(env
			? {}
			: {
					database: drizzleAdapter({} as D1Database, {
						provider: "sqlite",
						usePlural: true,
					}),
				}),
	});
}

// Export for CLI schema generation (`pnpm better-auth:generate`)
export const auth = createAuth();

// Export for runtime usage inside Cloudflare Workers
export { createAuth };
