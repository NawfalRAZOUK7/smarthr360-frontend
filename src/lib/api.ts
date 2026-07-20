"use client";

import { SERVICES } from "./config";

const ACCESS_KEY = "shr360.access";
const REFRESH_KEY = "shr360.refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * Unwrap the project's envelopes, including nested pagination:
 *   {data: [...]}, {data: {results: [...]}}, {results: [...]}, raw.
 */
function unwrap<T>(json: unknown): T {
  let v: unknown = json;
  if (v && typeof v === "object" && "data" in (v as Record<string, unknown>)) {
    const d = (v as Record<string, unknown>).data;
    if (d !== undefined) v = d;
  }
  if (
    v &&
    typeof v === "object" &&
    Array.isArray((v as Record<string, unknown>).results)
  ) {
    v = (v as Record<string, unknown>).results;
  }
  return v as T;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${SERVICES.auth}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const json = unwrap<{ access?: string; refresh?: string }>(await res.json());
    if (!json?.access) return false;
    storeTokens(json.access, json.refresh);
    return true;
  } catch {
    return false;
  }
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean; // default true
}

/**
 * Generic JSON request against one of the SmartHR360 services.
 * Handles the JWT bearer header and one transparent token refresh on 401.
 */
export async function api<T>(
  baseUrl: string,
  path: string,
  opts: RequestOptions = {},
  isRetry = false
): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && auth && !isRetry) {
    if (await tryRefresh()) return api<T>(baseUrl, path, opts, true);
    clearTokens();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) throw new ApiError(res.status, json);
  return unwrap<T>(json);
}

/**
 * Fetch a file (e.g. CSV) with the JWT bearer header and trigger a
 * browser download. Returns false if the request failed.
 */
export async function downloadFile(
  baseUrl: string,
  path: string,
  filename: string
): Promise<boolean> {
  const token = getAccessToken();
  const res = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) return false;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

export const authApi = <T>(path: string, opts?: RequestOptions) =>
  api<T>(SERVICES.auth, path, opts);
export const coreHrApi = <T>(path: string, opts?: RequestOptions) =>
  api<T>(SERVICES.coreHr, path, opts);
export const workloadApi = <T>(path: string, opts?: RequestOptions) =>
  api<T>(SERVICES.workload, path, opts);
export const retentionApi = <T>(path: string, opts?: RequestOptions) =>
  api<T>(SERVICES.retention, path, opts);
export const careerSimApi = <T>(path: string, opts?: RequestOptions) =>
  api<T>(SERVICES.careerSim, path, opts);
export const futureSkillsApi = <T>(path: string, opts?: RequestOptions) =>
  api<T>(SERVICES.futureSkills, path, opts);
export const policyGenApi = <T>(path: string, opts?: RequestOptions) =>
  api<T>(SERVICES.policyGen, path, opts);
