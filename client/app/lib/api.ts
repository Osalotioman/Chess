export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const API_BASE_PATH = "/api";

function normalizePath(path: string) {
  if (!path) return API_BASE_PATH;
  const base = API_BASE_PATH.endsWith("/") ? API_BASE_PATH.slice(0, -1) : API_BASE_PATH;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function parseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

interface RequestOptions {
  method?: ApiMethod;
  token?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", token, body, headers, signal } = options;
  const hasBody = body !== undefined;
  const computedHeaders: HeadersInit = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let response: Response;
  try {
    response = await fetch(normalizePath(path), {
      method,
      headers: computedHeaders,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new ApiError(`Request failed before reaching API: ${message}`, 0, {
      message,
      reason: "network_error",
    });
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Request failed (${response.status})`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function apiGet<T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) {
  return apiRequest<T>(path, { ...options, method: "POST", body });
}

export function apiPut<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) {
  return apiRequest<T>(path, { ...options, method: "PUT", body });
}

export function apiPatch<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) {
  return apiRequest<T>(path, { ...options, method: "PATCH", body });
}

export function apiDelete<T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
}
