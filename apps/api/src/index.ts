import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "@myapp/auth";
import { createDb } from "@myapp/db";

import itemsRouter from "./routes/items";

type Variables = {
	auth: ReturnType<typeof createAuth>;
	db: ReturnType<typeof createDb>;
};

const DEFAULT_ALLOWED_ORIGINS = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:4321",
	"http://127.0.0.1:4321",
];

function getAllowedOrigins(
	c: Context<{ Bindings: CloudflareBindings; Variables: Variables }>,
): string[] {
	const rawOrigins = c.env.ALLOWED_ORIGINS;
	if (!rawOrigins) return DEFAULT_ALLOWED_ORIGINS;
	const parsed = rawOrigins
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
	return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
}

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>();

// Global CORS (permissive — tighten for production)
app.use("*", cors());

// Scoped CORS for /api/* routes with origin allowlist
app.use(
	"/api/*",
	cors({
		origin: (origin, c) => {
			if (!origin) return undefined;
			const allowed = getAllowedOrigins(c);
			return allowed.includes(origin) ? origin : undefined;
		},
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

// Initialize db and auth per request and set on context
app.use("*", async (c, next) => {
	const db = createDb(c.env.DB);
	c.set("db", db);

	const auth = createAuth(
		{
			DB: db,
			KV: c.env.KV,
			GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
		},
		(c.req.raw as any).cf || {},
	);
	c.set("auth", auth);

	await next();
});

// Better Auth — handles all /api/auth/* routes
app.all("/api/auth/*", async (c) => {
	const auth = c.get("auth");
	return auth.handler(c.req.raw);
});

// Resource routes
app.route("/api/items", itemsRouter);

// Health check
app.get("/api/healthz", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (c) => {
	return c.text("Hello from Hono!");
});

export default app;
