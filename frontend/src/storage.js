// This file recreates the "window.storage" API (get/set/delete/list) that the
// original Claude Artifact environment provides automatically — but here it
// talks to OUR OWN backend (see /backend) so the app works outside Claude.ai.
//
// Endpoints expected on the backend (see backend/routes/storage.js):
//   GET    /api/storage/:key?shared=true|false
//   POST   /api/storage/:key   { value, shared }
//   DELETE /api/storage/:key?shared=true|false
//   GET    /api/storage?prefix=xxx&shared=true|false

export const API_BASE_URL = (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");
const BASE = `${API_BASE_URL}/api/storage`;

async function get(key, shared = false) {
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(key)}?shared=${shared}`);
    if (res.status === 404) {
      const local = localStorage.getItem(`storage:${key}`);
      return local ? { key, value: local, shared } : null;
    }
    if (!res.ok) throw new Error("Storage get failed");
    const data = await res.json();
    if (!data || data.value === null || data.value === undefined) {
      return null;
    }
    try {
      localStorage.setItem(`storage:${key}`, typeof data.value === "string" ? data.value : JSON.stringify(data.value));
    } catch (e) {}
    return data; // { key, value, shared }
  } catch (e) {
    const local = localStorage.getItem(`storage:${key}`);
    return local ? { key, value: local, shared } : null;
  }
}

async function set(key, value, shared = false) {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: stringValue, shared }),
    });
    if (!res.ok) {
      throw new Error(`Storage set failed with status ${res.status}`);
    }
    const data = await res.json();
    try {
      localStorage.setItem(`storage:${key}`, stringValue);
    } catch (e) {}
    return data;
  } catch (e) {
    // Only fallback to localStorage if backend request failed
    try {
      localStorage.setItem(`storage:${key}`, stringValue);
    } catch (err) {}
    console.warn(`[storage] Backend save failed for ${key}, cached locally:`, e.message);
    return { key, value: stringValue, shared, cachedLocally: true };
  }
}

async function del(key, shared = false) {
  try {
    localStorage.removeItem(`storage:${key}`);
  } catch (e) {}
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(key)}?shared=${shared}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Storage delete failed with status ${res.status}`);
    return await res.json();
  } catch (e) {
    return { key, deleted: true, shared, cachedLocally: true };
  }
}

async function list(prefix = "", shared = false) {
  try {
    const res = await fetch(`${BASE}?prefix=${encodeURIComponent(prefix)}&shared=${shared}`);
    if (!res.ok) throw new Error("Storage list failed");
    return await res.json();
  } catch (e) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`storage:${prefix}`)) {
        keys.push(k.replace(/^storage:/, ""));
      }
    }
    return { keys, prefix, shared };
  }
}

if (typeof window !== "undefined") {
  window.storage = { get, set, delete: del, list };
}

