import type { NextRequest } from "next/server";

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "content-encoding",
  "accept-encoding",
]);

function getBackendOrigin(): string {
  const backendOrigin = process.env.REST_BACKEND_ORIGIN;
  if (!backendOrigin) {
    throw new Error("REST_BACKEND_ORIGIN is not set");
  }
  return backendOrigin.replace(/\/$/, "");
}

function buildTargetUrl(req: NextRequest, pathSegments: string[]): string {
  const base = getBackendOrigin();
  const path = pathSegments.length ? `/${pathSegments.join("/")}` : "";
  const search = req.nextUrl.search;
  return `${base}${path}${search}`;
}

function copyRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

function copyResponseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers();
  upstreamHeaders.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

async function proxy(req: NextRequest, pathSegments: string[]): Promise<Response> {
  let targetUrl: string;
  try {
    targetUrl = buildTargetUrl(req, pathSegments);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy not configured";
    return Response.json({ message }, { status: 500 });
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: copyRequestHeaders(req),
      body,
      redirect: "manual",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upstream request failed";
    return Response.json(
      { message: `REST upstream fetch failed: ${message}` },
      { status: 502 },
    );
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: copyResponseHeaders(upstreamResponse.headers),
  });
}

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function OPTIONS(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(req, path);
}
