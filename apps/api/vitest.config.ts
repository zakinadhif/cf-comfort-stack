import { defineConfig } from "vitest/config";

const cloudflareWorkersShimPath = new URL(
	"./tests/shims/cloudflare-workers.ts",
	import.meta.url,
).pathname;

export default defineConfig({
	resolve: {
		alias: {
			"cloudflare:workers": cloudflareWorkersShimPath,
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		clearMocks: true,
		restoreMocks: true,
	},
});
