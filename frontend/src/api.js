export const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

export const resourcesApi = {
  list: resource => request(`/api/resources/${resource}`),
  create: (resource, data) => request(`/api/resources/${resource}`, { method: "POST", body: JSON.stringify(data) }),
  update: (resource, id, data) => request(`/api/resources/${resource}/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (resource, id) => request(`/api/resources/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" }),
};