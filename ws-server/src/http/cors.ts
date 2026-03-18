import type http from "node:http";

import { corsAllowCredentials, corsOrigins, isOriginAllowed } from "../config.js";

const defaultAllowedHeaders = "Content-Type, Authorization";
const defaultAllowedMethods = "GET, OPTIONS";

function getAllowedOriginHeader(requestOrigin: string | undefined): string | null {
  if (corsOrigins.includes("*")) {
    if (corsAllowCredentials && requestOrigin) {
      return requestOrigin;
    }
    return "*";
  }

  if (requestOrigin && isOriginAllowed(requestOrigin)) {
    return requestOrigin;
  }

  return null;
}

export function applyCors(req: http.IncomingMessage, res: http.ServerResponse): void {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = getAllowedOriginHeader(requestOrigin);

  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
  }

  if (corsAllowCredentials) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Access-Control-Allow-Methods", defaultAllowedMethods);
  res.setHeader("Access-Control-Allow-Headers", defaultAllowedHeaders);
}

export function handleCorsPreflight(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  if (req.method !== "OPTIONS") {
    return false;
  }

  applyCors(req, res);
  res.writeHead(204);
  res.end();
  return true;
}
