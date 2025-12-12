// src/services/api.ts
export type ApiResult = {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const USERS_BASE = `${API_BASE}`;

async function parseJSONSafe(resp: Response) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
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
export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}
export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}
export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/* basic auth header */
export function authHeader(): Record<string, string> {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

/* User login (SimpleJWT TokenObtainPairView expects username+password by default) */
export async function userLogin(
  username: string,
  password: string,
): Promise<ApiResult> {
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
  return {
    ok: false,
    status: resp.status,
    error: data?.detail || data?.error || "Login failed",
    data,
  };
}

/* Admin login (your AdminLoginView returns tokens) */
export async function adminLogin(
  username: string,
  password: string,
): Promise<ApiResult> {
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
  return {
    ok: false,
    status: resp.status,
    error: data?.detail || data?.error || "Admin login failed",
    data,
  };
}

export async function emailLogin(
  email: string,
  password: string,
): Promise<ApiResult> {
  const url = `${API_BASE}/auth/login/`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    saveTokens(data);
    return { ok: true, status: resp.status, data };
  }
  return {
    ok: false,
    status: resp.status,
    error: data?.detail || data?.error || "Login failed",
    data,
  };
}

/* Admin register (same fields as user plus a secret code) */
export async function adminRegister(payload: {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
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
  return {
    ok: false,
    status: resp.status,
    error: data?.detail || data?.error || "Refresh failed",
    data,
  };
}

/* Generic fetch wrapper which auto-refreshes token on 401 once */
export async function fetchWithAuth(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<Response> {
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
    console.log(
      "Fetching profile with token:",
      token ? "Token exists" : "No token found",
    );

    const resp = await fetchWithAuth(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include", // Ensure cookies are sent with the request
    });

    const data = await parseJSONSafe(resp);
    console.log("Profile response status:", resp.status, "data:", data);

    if (resp.ok) {
      return { ok: true, status: resp.status, data };
    } else {
      console.error("Profile fetch failed:", {
        status: resp.status,
        statusText: resp.statusText,
        data,
      });
      if (resp.status === 403) {
        // If we get a 403, clear tokens as they might be invalid
        clearTokens();
        return {
          ok: false,
          status: resp.status,
          error: "Session expired or invalid. Please log in again.",
          data,
        };
      }
      return {
        ok: false,
        status: resp.status,
        error:
          data?.detail ||
          data?.error ||
          `Failed to fetch profile: ${resp.statusText}`,
        data,
      };
    }
  } catch (error) {
    console.error("Error in getProfile:", error);
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Network error",
      data: null,
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
  landmark?: string;
  location_url?: string;
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
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  landmark?: string;
  location_url?: string;
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
const CHAT_BASE = `${API_BASE}/chat`;

export async function fetchAdminSummary(): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/summary/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load admin summary";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchAdminUsers(): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/users/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load users";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchAdminUserActivity(userId: number): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/users/${userId}/activity/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load user activity";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchAdminFoundReports(
  status?: string,
): Promise<ApiResult> {
  const qs =
    status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const url = `${PETS_BASE}/admin/reports/found/${qs}`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load found reports";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchAdminLostReports(
  status?: string,
): Promise<ApiResult> {
  const qs =
    status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const url = `${PETS_BASE}/admin/reports/lost/${qs}`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load lost reports";
  return { ok: false, status: resp.status, error: message, data };
}

export async function updateAdminFoundReport(
  id: number,
  payload: any,
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

// Admin delete helpers used by AdminHome Pets tab
export async function deleteAdminFoundReport(id: number): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/reports/found/${id}/`;
  const resp = await fetchWithAuth(url, { method: "DELETE" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message =
    extractErrorMessage(data) ?? "Failed to delete found report";
  return { ok: false, status: resp.status, error: message, data };
}

export async function deleteAdminLostReport(id: number): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/reports/lost/${id}/`;
  const resp = await fetchWithAuth(url, { method: "DELETE" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message =
    extractErrorMessage(data) ?? "Failed to delete lost report";
  return { ok: false, status: resp.status, error: message, data };
}

export async function updateAdminLostReport(
  id: number,
  payload: any,
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
  weight?: string;
  estimated_age?: string;
  found_city: string;
  state: string;
  pincode?: string;
  description: string;
  location_url?: string;
  found_time?: string;
  photo?: File | null;
}): Promise<ApiResult> {
  const url = `${PETS_BASE}/reports/found/`;
  const formData = new FormData();
  formData.append("pet_type", payload.pet_type);
  formData.append("found_city", payload.found_city);
  formData.append("state", payload.state);
  if (payload.pincode) formData.append("pincode", payload.pincode);
  formData.append("description", payload.description);
  if (payload.location_url)
    formData.append("location_url", payload.location_url);
  if (payload.found_time) formData.append("found_time", payload.found_time);
  if (payload.breed) formData.append("breed", payload.breed);
  if (payload.color) formData.append("color", payload.color);
  if (payload.weight) formData.append("weight", payload.weight);
  if (payload.estimated_age)
    formData.append("estimated_age", payload.estimated_age);
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

export async function updateMyLostReport(
  id: number,
  payload: Partial<{
    pet_name: string;
    pet_type: string;
    breed: string;
    color: string;
    weight: string;
    vaccinated: string;
    age: string;
    city: string;
    state: string;
    pincode: string;
    description: string;
    location_url: string;
    lost_time: string;
  }>,
): Promise<ApiResult> {
  const url = `${PETS_BASE}/reports/lost/${id}/`;
  const resp = await fetchWithAuth(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to update report";
  return { ok: false, status: resp.status, error: message, data };
}

export async function updateMyFoundReport(
  id: number,
  payload: Partial<{
    pet_type: string;
    breed: string;
    color: string;
    weight: string;
    estimated_age: string;
    found_city: string;
    state: string;
    pincode: string;
    description: string;
    location_url: string;
    found_time: string;
  }>,
): Promise<ApiResult> {
  const url = `${PETS_BASE}/reports/found/${id}/`;
  const resp = await fetchWithAuth(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to update report";
  return { ok: false, status: resp.status, error: message, data };
}

/* Fetch all reports for dashboard display */
export async function fetchAllReports(): Promise<ApiResult> {
  const url = `${PETS_BASE}/reports/all/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load reports";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchMyActivity(): Promise<ApiResult> {
  const url = `${PETS_BASE}/my-activity/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load activity";
  return { ok: false, status: resp.status, error: message, data };
}

// ===== Volunteers API =====
export async function createVolunteerRequest(payload: {
  full_name: string;
  date_of_birth?: string;
  phone_number: string;
  email: string;
  city: string;
  state?: string;
  pincode: string;
  availability?: string;
  skills?: string;
  experience_level: "beginner" | "moderate" | "experienced" | "professional";
  id_proof_type?: string;
  id_proof_document?: File | null;
  motivation?: string;
}): Promise<ApiResult> {
  const url = `${USERS_BASE}/volunteers/`;
  const fd = new FormData();
  fd.append("full_name", payload.full_name);
  fd.append("phone_number", payload.phone_number);
  fd.append("email", payload.email);
  fd.append("city", payload.city);
  if (payload.state) fd.append("state", payload.state);
  fd.append("pincode", payload.pincode);
  fd.append("experience_level", payload.experience_level);
  if (payload.date_of_birth) fd.append("date_of_birth", payload.date_of_birth);
  if (payload.availability) fd.append("availability", payload.availability);
  if (payload.skills) fd.append("skills", payload.skills);
  if (payload.id_proof_type) fd.append("id_proof_type", payload.id_proof_type);
  if (payload.id_proof_document) fd.append("id_proof_document", payload.id_proof_document);
  if (payload.motivation) fd.append("motivation", payload.motivation);

  const resp = await fetchWithAuth(url, { method: "POST", body: fd });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to submit volunteer";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchMyVolunteerRequests(): Promise<ApiResult> {
  const url = `${USERS_BASE}/volunteers/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load volunteers";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchAdminVolunteerRequests(params?: {
  status?: string;
  q?: string;
  city?: string;
  state?: string;
}): Promise<ApiResult> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  if (params?.city) qs.set("city", params.city);
  if (params?.state) qs.set("state", params.state);
  const url = `${USERS_BASE}/admin/volunteers/${qs.toString() ? `?${qs.toString()}` : ""}`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load volunteer requests";
  return { ok: false, status: resp.status, error: message, data };
}

export async function updateAdminVolunteerRequest(id: number, payload: {
  status?: "pending" | "approved" | "rejected";
  admin_notes?: string;
}): Promise<ApiResult> {
  const url = `${USERS_BASE}/admin/volunteers/${id}/`;
  const resp = await fetchWithAuth(url, { method: "PATCH", body: JSON.stringify(payload) });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to update volunteer";
  return { ok: false, status: resp.status, error: message, data };
}

export async function deleteAdminVolunteerRequest(id: number): Promise<ApiResult> {
  const url = `${USERS_BASE}/admin/volunteers/${id}/`;
  const resp = await fetchWithAuth(url, { method: "DELETE" });
  const data = await parseJSONSafe(resp);
  if (resp.ok || resp.status === 204) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to delete volunteer";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchAdminVolunteerDetail(id: number): Promise<ApiResult> {
  const url = `${USERS_BASE}/admin/volunteers/${id}/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to load volunteer";
  return { ok: false, status: resp.status, error: message, data };
}

/* Fetch public lost pet reports for dashboard */
export async function fetchPublicLostPets(): Promise<ApiResult> {
  const url = `${PETS_BASE}/public/lost/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load lost pets";
  return { ok: false, status: resp.status, error: message, data };
}

/* Fetch public found pet reports for dashboard */
export async function fetchPublicFoundPets(): Promise<ApiResult> {
  const url = `${PETS_BASE}/public/found/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load found pets";
  return { ok: false, status: resp.status, error: message, data };
}

/* Fetch user's own lost pet reports */
export async function fetchMyLostPets(): Promise<ApiResult> {
  const url = `${PETS_BASE}/reports/lost/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load your lost pets";
  return { ok: false, status: resp.status, error: message, data };
}

/* Fetch user's own found pet reports */
export async function fetchMyFoundPets(): Promise<ApiResult> {
  const url = `${PETS_BASE}/reports/found/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load your found pets";
  return { ok: false, status: resp.status, error: message, data };
}

export async function reportLostPet(payload: {
  pet_name?: string;
  pet_type: string;
  breed?: string;
  color?: string;
  weight?: string;
  vaccinated?: string;
  age?: string;
  city: string;
  state: string;
  pincode?: string;
  description: string;
  location_url?: string;
  lost_time?: string;
  photo?: File | null;
}): Promise<ApiResult> {
  const url = `${PETS_BASE}/reports/lost/`;
  const formData = new FormData();
  if (payload.pet_name) formData.append("pet_name", payload.pet_name);
  formData.append("pet_type", payload.pet_type);
  if (payload.breed) formData.append("breed", payload.breed);
  if (payload.color) formData.append("color", payload.color);
  if (payload.weight) formData.append("weight", payload.weight);
  if (payload.vaccinated) formData.append("vaccinated", payload.vaccinated);
  if (payload.age) formData.append("age", payload.age);
  formData.append("city", payload.city);
  formData.append("state", payload.state);
  if (payload.pincode) formData.append("pincode", payload.pincode);
  formData.append("description", payload.description);
  if (payload.location_url)
    formData.append("location_url", payload.location_url);
  if (payload.lost_time) formData.append("lost_time", payload.lost_time);
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

// ===== ADOPTION FEATURE API FUNCTIONS =====

/* Fetch pet details for adoption */
export async function fetchPetDetails(petId: number): Promise<ApiResult> {
  const url = `${PETS_BASE}/pets/${petId}/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load pet details";
  return { ok: false, status: resp.status, error: message, data };
}

/* Fetch all available pets for adoption */
export async function fetchAvailablePets(): Promise<ApiResult> {
  const url = `${PETS_BASE}/pets/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load pets";
  return { ok: false, status: resp.status, error: message, data };
}

/* Submit adoption request */
export async function submitAdoptionRequest(
  petId: number,
  payload: {
    phone: string;
    address: string;
    household_info?: string;
    experience_with_pets: string;
    reason_for_adopting: string;
    has_other_pets: boolean;
    other_pets_details?: string;
    home_ownership: "own" | "rent";
    preferred_meeting?: string;
  },
): Promise<ApiResult> {
  const url = `${PETS_BASE}/pets/${petId}/adoption-requests/`;
  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message =
    extractErrorMessage(data) ?? "Failed to submit adoption request";
  return { ok: false, status: resp.status, error: message, data };
}

/* Fetch user's adoption requests */
export async function fetchMyAdoptionRequests(): Promise<ApiResult> {
  const url = `${PETS_BASE}/my-adoption-requests/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message =
    extractErrorMessage(data) ?? "Failed to load adoption requests";
  return { ok: false, status: resp.status, error: message, data };
}

// ===== Chat API (rooms & messages) =====

export async function getRooms(): Promise<{
  ok: boolean;
  status: number;
  rooms?: any[];
  error?: string;
}> {
  const url = `${CHAT_BASE}/rooms/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, rooms: data?.rooms ?? [] };
  }
  const message = extractErrorMessage(data) ?? "Failed to load chat rooms";
  return { ok: false, status: resp.status, error: message };
}

export async function getRoomDetail(roomId: string): Promise<{
  ok: boolean;
  status: number;
  room?: any;
  members?: any[];
  error?: string;
}> {
  const url = `${CHAT_BASE}/rooms/${roomId}/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return {
      ok: true,
      status: resp.status,
      room: data?.room,
      members: data?.members ?? [],
    };
  }
  const message = extractErrorMessage(data) ?? "Failed to load room";
  return { ok: false, status: resp.status, error: message };
}

export async function getRoomMessages(
  roomId: string,
  limit = 50,
): Promise<{
  ok: boolean;
  status: number;
  messages?: any[];
  error?: string;
}> {
  const url = `${CHAT_BASE}/messages/room/${roomId}/?limit=${limit}`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return {
      ok: true,
      status: resp.status,
      messages: data?.messages ?? [],
    };
  }
  const message = extractErrorMessage(data) ?? "Failed to load messages";
  return { ok: false, status: resp.status, error: message };
}

export async function createMessage(
  roomId: string,
  content: string,
): Promise<{
  ok: boolean;
  status: number;
  message?: any;
  error?: string;
}> {
  const url = `${CHAT_BASE}/messages/room/${roomId}/`;
  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, message: data?.message };
  }
  const message = extractErrorMessage(data) ?? "Failed to send message";
  return { ok: false, status: resp.status, error: message };
}

export async function createRoom(title: string): Promise<{
  ok: boolean;
  status: number;
  room?: any;
  error?: string;
}> {
  const url = `${CHAT_BASE}/rooms/`;
  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, room: data?.room };
  }
  const message = extractErrorMessage(data) ?? "Failed to create room";
  return { ok: false, status: resp.status, error: message };
}

export async function lookupUserByEmail(email: string): Promise<{
  ok: boolean;
  status: number;
  user?: any;
  error?: string;
}> {
  const url = `${CHAT_BASE}/users/by-email?email=${encodeURIComponent(email)}`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, user: data?.user };
  }
  const message = extractErrorMessage(data) ?? "Failed to lookup user";
  return { ok: false, status: resp.status, error: message };
}

export async function addMember(
  roomId: string,
  userId: string,
): Promise<{
  ok: boolean;
  status: number;
  member?: any;
  error?: string;
}> {
  const url = `${CHAT_BASE}/rooms/${roomId}/members/`;
  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, member: data?.member };
  }
  const message = extractErrorMessage(data) ?? "Failed to add member";
  return { ok: false, status: resp.status, error: message };
}

/* Fetch messages for adoption request */
export async function fetchAdoptionMessages(
  adoptionRequestId: number,
): Promise<ApiResult> {
  const url = `${PETS_BASE}/adoption-requests/${adoptionRequestId}/messages/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load messages";
  return { ok: false, status: resp.status, error: message, data };
}

/* Send message in adoption request chat */
export async function sendAdoptionMessage(
  adoptionRequestId: number,
  text: string,
): Promise<ApiResult> {
  const url = `${PETS_BASE}/adoption-requests/${adoptionRequestId}/messages/create/`;
  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to send message";
  return { ok: false, status: resp.status, error: message, data };
}

// General chat (user-admin) helpers

export async function fetchChatConversations(): Promise<ApiResult> {
  const url = `${PETS_BASE}/chat/conversations/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load conversations";
  return { ok: false, status: resp.status, error: message, data };
}

export async function createChatConversation(): Promise<ApiResult> {
  const url = `${PETS_BASE}/chat/conversations/`;
  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify({}),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to request chat";
  return { ok: false, status: resp.status, error: message, data };
}

// Create a conversation with optional pet context so admin knows which pet
// the user is chatting about (lost / found / adoption).
export async function createChatConversationWithPet(payload: {
  pet_id?: number;
  pet_name?: string;
  pet_kind?: string; // "lost" | "found" | "adoption" etc
}): Promise<ApiResult> {
  const url = `${PETS_BASE}/chat/conversations/`;
  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to request chat";
  return { ok: false, status: resp.status, error: message, data };
}

export async function confirmChatConversation(id: number): Promise<ApiResult> {
  const url = `${PETS_BASE}/chat/conversations/${id}/confirm/`;
  const resp = await fetchWithAuth(url, { method: "POST", body: JSON.stringify({}) });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to confirm chat";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchChatMessagesUser(conversationId: number): Promise<ApiResult> {
  const url = `${PETS_BASE}/chat/conversations/${conversationId}/messages/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load messages";
  return { ok: false, status: resp.status, error: message, data };
}

export async function sendChatMessageUser(conversationId: number, text: string): Promise<ApiResult> {
  const url = `${PETS_BASE}/chat/conversations/${conversationId}/messages/`;
  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to send message";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchAdminChatConversations(statusFilter?: string): Promise<ApiResult> {
  const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
  const url = `${PETS_BASE}/admin/chat/conversations/${qs}`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load admin conversations";
  return { ok: false, status: resp.status, error: message, data };
}

export async function acceptAdminConversation(id: number): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/chat/conversations/${id}/accept/`;
  const resp = await fetchWithAuth(url, { method: "POST", body: JSON.stringify({}) });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to accept chat";
  return { ok: false, status: resp.status, error: message, data };
}

export async function closeAdminConversation(id: number): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/chat/conversations/${id}/close/`;
  const resp = await fetchWithAuth(url, { method: "POST", body: JSON.stringify({}) });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to close chat";
  return { ok: false, status: resp.status, error: message, data };
}

export async function fetchChatMessagesAdmin(conversationId: number): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/chat/conversations/${conversationId}/messages/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to load messages";
  return { ok: false, status: resp.status, error: message, data };
}

export async function sendChatMessageAdmin(conversationId: number, text: string): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/chat/conversations/${conversationId}/messages/`;
  const resp = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message = extractErrorMessage(data) ?? "Failed to send message";
  return { ok: false, status: resp.status, error: message, data };
}

/* Admin: Fetch all adoption requests */
export async function fetchAllAdoptionRequests(): Promise<ApiResult> {
  const url = `${PETS_BASE}/adoption-requests/`;
  const resp = await fetchWithAuth(url, { method: "GET" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message =
    extractErrorMessage(data) ?? "Failed to load adoption requests";
  return { ok: false, status: resp.status, error: message, data };
}

/* Admin: Update adoption request status */
export async function updateAdoptionRequestStatus(
  requestId: number,
  payload: {
    status?: "pending" | "approved" | "rejected";
    admin_notes?: string;
  },
): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/adoption-requests/${requestId}/`;
  const resp = await fetchWithAuth(url, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message =
    extractErrorMessage(data) ?? "Failed to update adoption request";
  return { ok: false, status: resp.status, error: message, data };
}

export async function deleteAdoptionRequest(
  requestId: number,
): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/adoption-requests/${requestId}/`;
  const resp = await fetchWithAuth(url, { method: "DELETE" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) {
    return { ok: true, status: resp.status, data };
  }
  const message =
    extractErrorMessage(data) ?? "Failed to delete adoption request";
  return { ok: false, status: resp.status, error: message, data };
}

export async function adminClearAllData(): Promise<ApiResult> {
  const url = `${PETS_BASE}/admin/clear-data/`;
  const resp = await fetchWithAuth(url, { method: "POST" });
  const data = await parseJSONSafe(resp);
  if (resp.ok) return { ok: true, status: resp.status, data };
  const message = extractErrorMessage(data) ?? "Failed to clear data";
  return { ok: false, status: resp.status, error: message, data };
}
