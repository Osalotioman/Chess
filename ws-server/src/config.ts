import "dotenv/config";

export const host = process.env.HOST ?? "0.0.0.0";

export const port = Number(process.env.PORT ?? 8080);

const rawCorsOrigins = process.env.CORS_ORIGINS ?? "*";

export const corsOrigins = rawCorsOrigins
	.split(",")
	.map((origin) => origin.trim())
	.filter((origin) => origin.length > 0);

export const corsAllowCredentials = (process.env.CORS_ALLOW_CREDENTIALS ?? "true") === "true";

export const corsAllowNoOrigin = (process.env.CORS_ALLOW_NO_ORIGIN ?? "true") === "true";

export const apiServerOrigin = process.env.API_SERVER_ORIGIN ?? "http://localhost:4000";

export const internalWsSharedSecret = process.env.INTERNAL_WS_SHARED_SECRET ?? "";

export function isOriginAllowed(origin: string | undefined): boolean {
	if (!origin) {
		return corsAllowNoOrigin;
	}

	if (corsOrigins.includes("*")) {
		return true;
	}

	return corsOrigins.includes(origin);
}

