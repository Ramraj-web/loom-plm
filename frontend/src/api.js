// Save as: frontend/src/api.js
// This detects environment and uses correct API URL

// ✅ Smart API URL detection
const API_BASE_URL = (() => {
  // In development (Vite)
  if (import.meta.env.DEV) {
    return "http://localhost:5000"; // Local backend
  }
  // In production (Vercel) - use same domain
  if (typeof window !== "undefined") {
    return window.location.origin; // e.g., https://loom-plm.vercel.app
  }
  // Fallback
  return "https://loom-plm.vercel.app";
})();

console.log("📡 API Base URL:", API_BASE_URL);

// In-flight GET request deduplication map to prevent multiple parallel calls to same endpoint
const pendingRequests = new Map();

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const url = `${API_BASE_URL}${path}`;

  // If a GET request to the exact same URL is already in-flight, return the existing Promise
  if (method === "GET" && pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }

  const executeRequest = async () => {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        const errorMsg = payload.error || `HTTP ${response.status}: ${response.statusText || "Request failed"}`;
        console.error(`API Error on ${method} ${path}:`, errorMsg, payload);
        throw new Error(errorMsg);
      }

      return payload;
    } finally {
      if (method === "GET") {
        pendingRequests.delete(url);
      }
    }
  };

  const reqPromise = executeRequest();
  if (method === "GET") {
    pendingRequests.set(url, reqPromise);
  }

  return reqPromise;
}

// ===== STORAGE API =====
export const storageApi = {
  get: (key, shared = false) =>
    request(`/api/storage/${key}?shared=${shared}`),
  set: (key, value, shared = false) =>
    request(`/api/storage/${key}`, {
      method: "POST",
      body: JSON.stringify({ value, shared }),
    }),
  delete: (key, shared = false) =>
    request(`/api/storage/${key}?shared=${shared}`, { method: "DELETE" }),
  list: (prefix = "", shared = false) =>
    request(`/api/storage?prefix=${prefix}&shared=${shared}`),
};

// ===== RESOURCES API =====
export const resourcesApi = {
  list: (resource, query = "") =>
    request(`/api/resources/${encodeURIComponent(resource)}${query}`),
  get: (resource, id) =>
    request(`/api/resources/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`),
  create: (resource, data) =>
    request(`/api/resources/${encodeURIComponent(resource)}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (resource, id, data) =>
    request(`/api/resources/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  patch: (resource, id, data) =>
    request(`/api/resources/${encodeURIComponent(resource)}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (resource, id, query = "") =>
    request(`/api/resources/${encodeURIComponent(resource)}/${encodeURIComponent(id)}${query}`, { method: "DELETE" }),
  remove: (resource, id, query = "") =>
    request(`/api/resources/${encodeURIComponent(resource)}/${encodeURIComponent(id)}${query}`, { method: "DELETE" }),
};

// ===== HEALTH CHECK =====
export async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}