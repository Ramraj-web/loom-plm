// This file recreates the "window.storage" API (get/set/delete/list) that the
// original Claude Artifact environment provides automatically — but here it
// talks to OUR OWN backend (see /backend) so the app works outside Claude.ai.
//
// Endpoints expected on the backend (see backend/routes/storage.js):
//   GET    /api/storage/:key?shared=true|false
//   POST   /api/storage/:key   { value, shared }
//   DELETE /api/storage/:key?shared=true|false
//   GET    /api/storage?prefix=xxx&shared=true|false

export const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const BASE = `${API_BASE_URL}/api/storage`;

async function get(key, shared = false) {
  const res = await fetch(`${BASE}/${encodeURIComponent(key)}?shared=${shared}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Storage get failed");
  return res.json(); // { key, value, shared }
}

async function set(key, value, shared = false) {
  const res = await fetch(`${BASE}/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value, shared }),
  });
  if (!res.ok) throw new Error("Storage set failed");
  return res.json();
}

async function del(key, shared = false) {
  const res = await fetch(`${BASE}/${encodeURIComponent(key)}?shared=${shared}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Storage delete failed");
  return res.json();
}

async function list(prefix = "", shared = false) {
  const res = await fetch(`${BASE}?prefix=${encodeURIComponent(prefix)}&shared=${shared}`);
  if (!res.ok) throw new Error("Storage list failed");
  return res.json();
}

if (typeof window !== "undefined") {
  window.storage = { get, set, delete: del, list };
}
