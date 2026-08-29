export const API_BASE_URL = (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = payload.error || `HTTP ${response.status}: ${response.statusText || "Request failed"}`;
    console.error(`API Error on ${options.method || "GET"} ${path}:`, errorMsg, payload);
    throw new Error(errorMsg);
  }
  return payload;
}

export const resourcesApi = {
  list: (resource, suffix = "") => request(`/api/resources/${resource}${suffix}`),
  create: (resource, data) => request(`/api/resources/${resource}`, { method: "POST", body: JSON.stringify(data) }),
  update: (resource, id, data) => request(`/api/resources/${resource}/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  patch: (resource, id, data) => request(`/api/resources/${resource}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (resource, id) => request(`/api/resources/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export const aiApi = {
  extractHighlights: (techPackNotes, deptOptions = ["All"]) =>
    request(`/api/gemini/extract-highlights`, {
      method: "POST",
      body: JSON.stringify({ techPackNotes, deptOptions }),
    }),
};