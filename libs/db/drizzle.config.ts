/// <reference types="node" />
import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

const getLocalD1Url = () => {
	try {
		const basePath = path.resolve("../../.cloudflare-state/v3/d1");
		console.log(`Looking for local D1 database file in ${basePath}...`);
		const dbFile = fs
			.readdirSync(basePath, { encoding: "utf-8", recursive: true })
			.find((f) => f.endsWith(".sqlite"));
		console.log(`Found D1 database file: ${dbFile}`);

		if (!dbFile) {
			throw new Error(`No local D1 database file found in ${basePath}.`);
		}

		const url = path.resolve(basePath, dbFile);
		return url;
	} catch (err) {
		console.log(`Error ${err}`);
		return "";
	}
};

const target = process.env.TARGET;
if (!["local", "remote"].includes(target!)) {
	throw new Error(`Invalid target: ${target}. Must be 'local' or 'remote'.`);
}
console.log(`Running drizzle kit against ${target} database.`);

export default defineConfig(
	target !== "local"
		? {
				out: "./src/migrations",
				schema: "./src/schema/*.ts",
				dialect: "sqlite",
				driver: "d1-http",
				dbCredentials: {
					accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
					databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
					token: process.env.CLOUDFLARE_D1_TOKEN!,
				},
				tablesFilter: ["!_cf_KV", "!auth_*"],
			}
		: {
				out: "./src/migrations",
				schema: "./src/schema/*.ts",
				dialect: "sqlite",
				dbCredentials: {
					url: getLocalD1Url(),
				},
				tablesFilter: ["!_cf_KV", "!auth_*"],
			},
);
