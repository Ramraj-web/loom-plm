export const RESOURCE_SEEDS = {
  tasks: [],
  orders: [
    { id: "GKT-1054", buyer: "Zara", country: "Spain", season: "AW26", style: "Hoodie", qty: 12500, ship: "20 May", risk: "high", status: "At Risk" },
    { id: "ST-7788", buyer: "H&M", country: "Sweden", season: "AW26", style: "T-Shirt", qty: 8000, ship: "18 May", risk: "high", status: "Delayed" },
    { id: "JKT-2231", buyer: "Uniqlo", country: "Japan", season: "AW26", style: "Jacket", qty: 6200, ship: "22 May", risk: "medium", status: "At Risk" },
    { id: "TR-8899", buyer: "M&S", country: "United Kingdom", season: "SS26", style: "Trouser", qty: 4500, ship: "25 May", risk: "medium", status: "On Track" },
    { id: "DR-5566", buyer: "Next", country: "United Kingdom", season: "SS26", style: "Dress", qty: 5300, ship: "23 May", risk: "medium", status: "Delayed" },
    { id: "PL-3321", buyer: "Zara", country: "Spain", season: "SS26", style: "Polo", qty: 9100, ship: "28 May", risk: "low", status: "On Track" },
  ],
  staff: [
    { id: "staff-arasinth-raja", name: "Arasinth Raja", title: "Manager", dept: "Merchandising", status: "present" },
    { id: "staff-suresh", name: "Suresh", title: "Senior", dept: "Merchandising", status: "present" },
    { id: "staff-selva-kumar", name: "Selva Kumar", title: "Senior", dept: "Purchase – Fabric", status: "present" },
    { id: "staff-shankar", name: "Shankar", title: "Senior", dept: "Purchase – Trims", status: "present" },
    { id: "staff-viswa", name: "Viswa", title: "Manager", dept: "Sample", status: "present" },
    { id: "staff-sezhiyan", name: "Sezhiyan", title: "DGM", dept: "Quality", status: "present" },
    { id: "staff-durai", name: "Durai", title: "Manager", dept: "Cutting", status: "present" },
    { id: "staff-praveen-kumar", name: "Praveen Kumar", title: "FM", dept: "Production", status: "present" },
    { id: "staff-gopal", name: "Gopal", title: "Finishing Incharge", dept: "Finishing", status: "present" },
    { id: "staff-srinivasan", name: "Srinivasan", title: "Senior", dept: "Logistics & Documentation", status: "present" },
  ],
  leaveRequests: [
    { id: "leave-1", name: "Suresh", dept: "Merchandising", from: "26 May", to: "27 May", reason: "Personal", status: "pending" },
    { id: "leave-2", name: "Selva Kumar", dept: "Purchase – Fabric", from: "29 May", to: "31 May", reason: "Family function", status: "pending" },
  ],
  financials: [{ id: "current", revenue: 4415000, cogs: 0, ebitda: 820000, cashFlow: 1236000, stockValue: 2548000, complianceScore: 96.3 }],
  certifications: [
    { id: "tc", name: "Transaction Certificate (TC)", note: "Per-shipment chain of custody", status: "applied", file: null },
    { id: "gots", name: "GOTS", note: "Annual facility certification", status: "approved", file: null },
    { id: "ocs", name: "OCS", note: "Organic content certification", status: "not_applied", file: null },
  ],
  debitNotes: [
    { id: "debit-1", season: "AW26", buyer: "H&M", po: "ST-7788", amount: 4200, reason: "Late shipment penalty", date: "2 Jun" },
    { id: "debit-2", season: "AW26", buyer: "Zara", po: "GKT-1054", amount: 1800, reason: "Quality claim", date: "5 Jun" },
  ],
  capas: [
    { id: "capa-1", season: "AW26", buyer: "H&M", po: "ST-7788", issue: "PP approval delay", action: "Escalate samples within 24 hrs", status: "in_progress", date: "3 Jun" },
    { id: "capa-2", season: "AW26", buyer: "Uniqlo", po: "JKT-2231", issue: "Trims shortage", action: "Add supplier lead-time buffer", status: "open", date: "6 Jun" },
  ],
  approvals: [
    { id: "app-101", title: "Fit Sample Approval", order: "GKT-1054", buyer: "Zara", department: "Sample", dueDate: "20 May", status: "Pending", comments: "Awaiting lab dip match approval", isDeleted: false },
    { id: "app-102", title: "PP Sample Sign-off", order: "ST-7788", buyer: "H&M", department: "Merchandising", dueDate: "18 May", status: "Under Review", comments: "Size specs verified, pending buyer sign-off", isDeleted: false },
    { id: "app-103", title: "Fabric Quality Approval", order: "JKT-2231", buyer: "Uniqlo", department: "Quality", dueDate: "22 May", status: "Approved", comments: "Color fastness test passed grade 4", isDeleted: false },
    { id: "app-104", title: "Trim Card Approval", order: "TR-8899", buyer: "M&S", department: "Purchase – Trims", dueDate: "25 May", status: "Approved", comments: "All zippers and buttons confirmed", isDeleted: false },
  ],
  departments: [
    { id: "dept-1", name: "Arasinth Raja", department: "Merchandising", level: "Manager", isDeleted: false },
    { id: "dept-2", name: "Suresh", department: "Merchandising", level: "Senior", isDeleted: false },
    { id: "dept-3", name: "Selva Kumar", department: "Purchase – Fabric", level: "Senior", isDeleted: false },
    { id: "dept-4", name: "Durai", department: "Cutting", level: "Manager", isDeleted: false },
    { id: "dept-5", name: "Praveen Kumar", department: "Production", level: "Manager", isDeleted: false },
    { id: "dept-6", name: "Sezhiyan", department: "QC", level: "Manager", isDeleted: false },
    { id: "dept-7", name: "Vidhya", department: "Planning", level: "Senior", isDeleted: false },
    { id: "dept-8", name: "Kavitha", department: "QC", level: "Junior", isDeleted: false },
  ],
  production: [
    { id: "prod-1", order: "GKT-1054", style: "Hoodie", stage: "Cutting", dueDate: "20 May", status: "At Risk", isDeleted: false },
    { id: "prod-2", order: "ST-7788", style: "T-Shirt", stage: "Sewing", dueDate: "18 May", status: "Delayed", isDeleted: false },
    { id: "prod-3", order: "JKT-2231", style: "Jacket", stage: "Feeding", dueDate: "22 May", status: "In Progress", isDeleted: false },
    { id: "prod-4", order: "TR-8899", style: "Trouser", stage: "Finishing", dueDate: "25 May", status: "On Track", isDeleted: false },
    { id: "prod-5", order: "PL-3321", style: "Polo", stage: "Packing", dueDate: "28 May", status: "On Track", isDeleted: false },
  ],
};

let memoryDB = JSON.parse(JSON.stringify(RESOURCE_SEEDS));
let memoryStorage = { personal: {}, shared: {} };

const SOFT_DELETE_RESOURCES = [
  "orders",
  "tasks",
  "approvals",
  "departments",
  "production",
  "staff",
  "leaveRequests",
  "financials",
  "certifications",
  "debitNotes",
  "capas",
];

function validResource(name) {
  return Object.prototype.hasOwnProperty.call(RESOURCE_SEEDS, name);
}

function makeId(resource, record) {
  return record?.id || `${resource}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const url = new URL(req.url, `https://${host}`);
    const pathname = url.pathname;
    const isTrash = url.searchParams.get("trash") === "true";

    // 1. Health check
    if (pathname === "/api/health" || pathname === "/health" || pathname === "/api" || pathname === "/") {
      return res.status(200).json({ ok: true, environment: "vercel-serverless", timestamp: new Date().toISOString() });
    }

    // 2. Resources API
    const resourceMatch = pathname.match(/^\/(?:api\/)?resources\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (resourceMatch) {
      const resource = resourceMatch[1];
      const id = resourceMatch[2] ? decodeURIComponent(resourceMatch[2]) : null;

      if (!validResource(resource)) {
        return res.status(404).json({ error: "Unknown resource" });
      }

      if (!Array.isArray(memoryDB[resource])) {
        memoryDB[resource] = JSON.parse(JSON.stringify(RESOURCE_SEEDS[resource] || []));
      }

      const isSoftDelete = SOFT_DELETE_RESOURCES.includes(resource);

      // GET
      if (req.method === "GET") {
        if (id) {
          const item = memoryDB[resource].find(r => String(r.id) === id);
          if (!item) return res.status(404).json({ error: "Record not found" });
          return res.status(200).json(item);
        }
        const items = memoryDB[resource].filter(r => {
          if (!isSoftDelete) return true;
          return isTrash ? r.isDeleted === true : r.isDeleted !== true;
        });
        return res.status(200).json(items);
      }

      // POST
      if (req.method === "POST") {
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
        const record = {
          ...body,
          id: makeId(resource, body),
          ...(isSoftDelete ? { isDeleted: false } : {}),
        };
        memoryDB[resource] = [record, ...memoryDB[resource]];
        return res.status(201).json(record);
      }

      // PUT or PATCH
      if (req.method === "PUT" || req.method === "PATCH") {
        if (!id) return res.status(400).json({ error: "Record ID required" });
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
        const index = memoryDB[resource].findIndex(r => String(r.id) === id);
        if (index < 0) return res.status(404).json({ error: "Record not found" });

        const updated = {
          ...memoryDB[resource][index],
          ...body,
          id,
        };
        memoryDB[resource][index] = updated;
        return res.status(200).json(updated);
      }

      // DELETE
      if (req.method === "DELETE") {
        if (!id) return res.status(400).json({ error: "Record ID required" });
        const index = memoryDB[resource].findIndex(r => String(r.id) === id);
        if (index < 0) return res.status(404).json({ error: "Record not found" });

        if (isSoftDelete) {
          memoryDB[resource][index] = {
            ...memoryDB[resource][index],
            isDeleted: true,
            deletedAt: new Date().toISOString(),
          };
          return res.status(200).json({ id, deleted: true, isDeleted: true });
        }

        memoryDB[resource].splice(index, 1);
        return res.status(200).json({ id, deleted: true });
      }
    }

    // 3. Storage API
    const storageMatch = pathname.match(/^\/(?:api\/)?storage(?:\/([^/]+))?\/?$/);
    if (storageMatch) {
      const key = storageMatch[1] ? decodeURIComponent(storageMatch[1]) : null;
      const shared = url.searchParams.get("shared") === "true";
      const bucket = shared ? "shared" : "personal";

      if (req.method === "GET") {
        if (key) {
          const val = memoryStorage[bucket][key];
          if (val === undefined) return res.status(200).json({ key, value: null, shared });
          return res.status(200).json({ key, value: val, shared });
        }
        const prefix = url.searchParams.get("prefix") || "";
        const keys = Object.keys(memoryStorage[bucket]).filter(k => k.startsWith(prefix));
        return res.status(200).json({ keys, prefix, shared });
      }

      if (req.method === "POST" && key) {
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
        memoryStorage[bucket][key] = body.value;
        return res.status(200).json({ key, value: body.value, shared: !!body.shared });
      }

      if (req.method === "DELETE" && key) {
        const deleted = key in memoryStorage[bucket];
        delete memoryStorage[bucket][key];
        return res.status(200).json({ key, deleted, shared });
      }
    }

    return res.status(404).json({ error: "API Route not found", pathname });
  } catch (error) {
    console.error("Vercel Function Handler Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
