// src/services/api.ts
export type ApiResult = {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? ""; // if empty, assume proxy or same origin

async function parseJSONSafe(resp: Response) {
  try { return await resp.json(); } catch { return null; }
}

/* token helpers */
export function saveTokens(data: any) {
  if (data?.access) localStorage.setItem("access_token", data.access);
  if (data?.refresh) localStorage.setItem("refresh_token", data.refresh);
}
export function getAccessToken(): string | null { return localStorage.getItem("access_token"); }
export function getRefreshToken(): string | null { return localStorage.getItem("refresh_token"); }
export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/* basic auth header */
export function authHeader(): Record<string,string> {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* User login (SimpleJWT TokenObtainPairView expects username+password by default) */
export async function userLogin(username: string, password: string): Promise<ApiResult> {
  const url = `${API_BASE}/auth/token/`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    saveTokens(data);
    return { ok: true, status: resp.status, data };
  }
  return { ok: false, status: resp.status, error: data?.detail || data?.error || "Login failed", data };
}

/* Admin login (your AdminLoginView returns tokens) */
export async function adminLogin(username: string, password: string): Promise<ApiResult> {
  const url = `${API_BASE}/admin/login/`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    saveTokens(data);
    return { ok: true, status: resp.status, data };
  }
  return { ok: false, status: resp.status, error: data?.detail || data?.error || "Admin login failed", data };
}

/* Refresh access token */
export async function refreshAccess(): Promise<ApiResult> {
  const refresh = getRefreshToken();
  if (!refresh) return { ok: false, status: 0, error: "No refresh token" };
  const url = `${API_BASE}/auth/token/refresh/`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    if (data?.access) localStorage.setItem("access_token", data.access);
    return { ok: true, status: resp.status, data };
  }
  clearTokens();
  return { ok: false, status: resp.status, error: data?.detail || data?.error || "Refresh failed", data };
}

/* Generic fetch wrapper which auto-refreshes token on 401 once */
export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const headers = { "Content-Type": "application/json", ...(init.headers ?? {}) as any, ...authHeader() };
  let resp = await fetch(input, { ...init, headers, credentials: init.credentials ?? "same-origin" });
  if (resp.status === 401) {
    // try refresh once
    const ref = await refreshAccess();
    if (ref.ok) {
      const headers2 = { "Content-Type": "application/json", ...(init.headers ?? {}) as any, ...authHeader() };
      resp = await fetch(input, { ...init, headers: headers2, credentials: init.credentials ?? "same-origin" });
    }
  }
  return resp;
}

/* Get current user's profile */
export async function getProfile(): Promise<ApiResult> {
  const url = `${API_BASE}/users/me/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  return { ok: false, status: resp.status, error: data?.detail || data?.error || "Failed to fetch profile", data };
}

/* Register - matches your RegisterSerializer required fields */
export async function registerUser(payload: {
  username: string; email: string; password: string;
  full_name: string; phone_number: string; address: string; pincode: string;
}): Promise<ApiResult> {
  const url = `${API_BASE}/auth/register/`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  return { ok: false, status: resp.status, error: data?.detail || data?.error || "Registration failed", data };
}
