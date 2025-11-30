// src/services/api.ts
export type ApiResult = {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function parseJSONSafe(resp: Response) {
  try { return await resp.json(); } catch { return null; }
}

function collectFirstError(errors: any): string | null {
  if (!errors) return null;
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) {
    for (const entry of errors) {
      const nested = collectFirstError(entry);
      if (nested) return nested;
    }
    return null;
  }
  if (typeof errors === "object") {
    for (const key of Object.keys(errors)) {
      const nested = collectFirstError(errors[key]);
      if (nested) {
        return key === "non_field_errors" ? nested : `${key}: ${nested}`;
      }
    }
  }
  return null;
}

function extractErrorMessage(data: any): string | null {
  return (
    collectFirstError(data?.errors) ??
    data?.detail ??
    data?.error ??
    data?.message ??
    null
  );
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

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
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

/* Admin register (same fields as user plus a secret code) */
export async function adminRegister(payload: {
  username: string; email: string; password: string;
  full_name: string; phone_number: string; state: string; city: string; address: string; pincode: string;
  code: string;
}): Promise<ApiResult> {
  const url = `${API_BASE}/admin/register/`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Admin registration failed";
  return { ok: false, status: resp.status, error: message, data };
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
  const buildHeaders = () => {
    const base = new Headers(init.headers ?? {});
    if (!isFormData(init.body) && !base.has("Content-Type")) {
      base.set("Content-Type", "application/json");
    }
    const auth = authHeader();
    Object.entries(auth).forEach(([key, value]) => base.set(key, value));
    return base;
  };

  let resp = await fetch(input, {
    ...init,
    headers: buildHeaders(),
    credentials: init.credentials ?? "same-origin",
  });
  if (resp.status === 401) {
    // try refresh once
    const ref = await refreshAccess();
    if (ref.ok) {
      resp = await fetch(input, {
        ...init,
        headers: buildHeaders(),
        credentials: init.credentials ?? "same-origin",
      });
    }
  }
  return resp;
}

/* Get current user's profile */
export async function getProfile(): Promise<ApiResult> {
  const url = `${API_BASE}/users/me/`;
  try {
    const token = getAccessToken();
    console.log('Fetching profile with token:', token ? 'Token exists' : 'No token found');
    
    const resp = await fetchWithAuth(url, { 
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Ensure cookies are sent with the request
    });
    
    const data = await parseJSONSafe(resp);
    console.log('Profile response status:', resp.status, 'data:', data);
    
    if (resp.ok) {
      return { ok: true, status: resp.status, data };
    } else {
      console.error('Profile fetch failed:', { status: resp.status, statusText: resp.statusText, data });
      if (resp.status === 403) {
        // If we get a 403, clear tokens as they might be invalid
        clearTokens();
        return { 
          ok: false, 
          status: resp.status, 
          error: 'Session expired or invalid. Please log in again.',
          data 
        };
      }
      return { 
        ok: false, 
        status: resp.status, 
        error: data?.detail || data?.error || `Failed to fetch profile: ${resp.statusText}`,
        data 
      };
    }
  } catch (error) {
    console.error('Error in getProfile:', error);
    return { 
      ok: false, 
      status: 0, 
      error: error instanceof Error ? error.message : 'Network error',
      data: null 
    };
  }
}

export async function updateProfile(payload: {
  full_name?: string;
  phone_number?: string;
  address?: string;
  state?: string;
  city?: string;
  pincode?: string;
  password?: string;
}): Promise<ApiResult> {
  const url = `${API_BASE}/users/me/`;
  const resp = await fetchWithAuth(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to update profile";
  return { ok: false, status: resp.status, error: message, data };
}

/* Register - matches your RegisterSerializer required fields */
export async function registerUser(payload: {
  username: string; email: string; password: string;
  full_name: string; phone_number: string; state: string; city: string; address: string; pincode: string;
}): Promise<ApiResult> {
  const url = `${API_BASE}/auth/register/`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Registration failed";
  return { ok: false, status: resp.status, error: message, data };
}

const PETS_BASE = `${API_BASE}/pets`;

export async function fetchAdminSummary(): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/summary/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load admin summary";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchAdminFoundReports(status?: string): Promise<ApiResult> {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const url = `${PETS_BASE}/admin/reports/found/${qs}`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load found reports";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchAdminLostReports(status?: string): Promise<ApiResult> {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const url = `${PETS_BASE}/admin/reports/lost/${qs}`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load lost reports";
  return { ok: false, status: resp.status, error: message, data };
}

export async function updateAdminFoundReport(
  id: number,
  payload: { status?: string; admin_notes?: string }
): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/reports/found/${id}/`;
  const resp = await fetchWithAuth(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to update report";
  return { ok: false, status: resp.status, error: message, data };
}

export async function updateAdminLostReport(
  id: number,
  payload: { status?: string; admin_notes?: string }
): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/reports/lost/${id}/`;
  const resp = await fetchWithAuth(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to update report";
  return { ok: false, status: resp.status, error: message, data };
}

export async function reportFoundPet(payload: {
  pet_type: string;
  breed?: string;
  color?: string;
  estimated_age?: string;
  found_city: string;
  state: string;
  description: string;
  photo?: File | null;
}): Promise<ApiResult> {
  const url = `${PETS_BASE}/reports/found/`;
  const formData = new FormData();
  formData.append("pet_type", payload.pet_type);
  formData.append("found_city", payload.found_city);
  formData.append("state", payload.state);
  formData.append("description", payload.description);
  if (payload.breed) formData.append("breed", payload.breed);
  if (payload.color) formData.append("color", payload.color);
  if (payload.estimated_age) formData.append("estimated_age", payload.estimated_age);
  if (payload.photo) formData.append("photo", payload.photo);

  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: formData,
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to submit report";
  return { ok: false, status: resp.status, error: message, data };
}

export async function reportLostPet(payload: {
  pet_name?: string;
  pet_type: string;
  breed?: string;
  color?: string;
  age?: string;
  city: string;
  state: string;
  description: string;
  photo?: File | null;
}): Promise<ApiResult> {
  const url = `${PETS_BASE}/reports/lost/`;
  const formData = new FormData();
  if (payload.pet_name) formData.append("pet_name", payload.pet_name);
  formData.append("pet_type", payload.pet_type);
  if (payload.breed) formData.append("breed", payload.breed);
  if (payload.color) formData.append("color", payload.color);
  if (payload.age) formData.append("age", payload.age);
  formData.append("city", payload.city);
  formData.append("state", payload.state);
  formData.append("description", payload.description);
  if (payload.photo) formData.append("photo", payload.photo);

  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: formData,
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to submit report";
  return { ok: false, status: resp.status, error: message, data };
}
