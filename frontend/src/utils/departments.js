export const normalizeDepartmentName = name => String(name || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
