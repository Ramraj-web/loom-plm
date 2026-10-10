// Save as: frontend/src/api.js
// This detects environment and uses correct API URL

// ✅ Smart API URL detection
const API_BASE_URL = (() => {
  // In development (Vite server running on localhost:5173)
  if (import.meta.env.DEV) {
    return "http://localhost:5000"; // Local backend
  }
  // Inside Capacitor native Android/iOS WebView, window.location.origin is "https://localhost" or "capacitor://localhost"
  // Route API calls to the remote production backend
  if (typeof window !== "undefined" && (window.Capacitor?.isNativePlatform?.() || window.location.hostname === "localhost" || window.location.protocol === "capacitor:")) {
    return "https://loom-plm.vercel.app";
  }
  // In web production (Vercel) - use same domain
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin; // e.g., https://loom-plm.vercel.app
  }
  // Fallback
  return "https://loom-plm.vercel.app";
})();

console.log("📡 API Base URL:", API_BASE_URL);

// In-flight GET request deduplication map to prevent multiple parallel calls to same endpoint
const pendingRequests = new Map();

// Short-lived in-memory cache for GET requests to make screen transitions instant (0ms)
// Guarded with authEpoch to ensure no in-flight requests leak across logout/login
let currentAuthEpoch = 0;
const responseCache = new Map();
const DEFAULT_CACHE_TTL_MS = 15000;

export function clearApiCache(resourceName = null) {
  if (!resourceName) {
    currentAuthEpoch++; // Invalidates any pending in-flight responses from previous session
    responseCache.clear();
    return;
  }
  const prefix = `/api/resources/${resourceName}`;
  for (const url of responseCache.keys()) {
    if (url.includes(prefix)) {
      responseCache.delete(url);
    }
  }
}

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const url = `${API_BASE_URL}${path}`;
  const requestEpoch = currentAuthEpoch;

  // 1. Check in-memory cache for GET requests (URL includes complete query parameters)
  if (method === "GET" && !options.skipCache) {
    const cached = responseCache.get(url);
    if (cached && (Date.now() - cached.timestamp < (options.ttl || DEFAULT_CACHE_TTL_MS))) {
      return cached.data;
    }
  }

  // 2. If a GET request to the exact same URL is already in-flight, return the existing Promise
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

      // 3. Post-mutation invalidation on success
      if (method !== "GET") {
        const resourceMatch = path.match(/\/api\/resources\/([^/?]+)/);
        if (resourceMatch && resourceMatch[1]) {
          const resource = decodeURIComponent(resourceMatch[1]);
          clearApiCache(resource);
          // Invalidate related data when linked entities change
          if (resource === "compliances") clearApiCache("tasks");
          if (resource === "buyers") clearApiCache("orders");
        } else {
          clearApiCache();
        }
      }

      // 4. Cache ONLY successful GETs and ONLY if user/session has not changed mid-flight
      if (method === "GET" && requestEpoch === currentAuthEpoch) {
        responseCache.set(url, {
          timestamp: Date.now(),
          data: payload,
        });
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