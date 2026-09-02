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
    {
      id: "tc",
      name: "Transaction Certificate (TC)",
      certNo: "TC-2026-8812",
      certType: "Organic Textile / Transaction",
      issuingOrg: "Control Union",
      buyer: "Zara",
      orderId: "GKT-1054",
      issueDate: "2026-01-10",
      expiryDate: "2026-12-31",
      status: "Approved",
      file: "TC_GKT1054_ControlUnion.pdf",
      notes: "Per-shipment chain of custody certificate for organic cotton hoodie batch.",
      isDeleted: false
    },
    {
      id: "gots",
      name: "GOTS",
      certNo: "GOTS-2026-001",
      certType: "Organic Textile",
      issuingOrg: "OneCert International",
      buyer: "All Buyers",
      orderId: "GKT-1054",
      issueDate: "2026-01-01",
      expiryDate: "2026-12-31",
      status: "Approved",
      file: "GOTS_Scope_Certificate_2026.pdf",
      notes: "Annual facility scope certificate for organic spinning and garmenting.",
      isDeleted: false
    },
    {
      id: "ocs",
      name: "OCS",
      certNo: "OCS-2025-449",
      certType: "Organic Content Standard",
      issuingOrg: "IDFL Laboratory & Institute",
      buyer: "H&M",
      orderId: "ST-7788",
      issueDate: "2025-08-15",
      expiryDate: "2026-09-15",
      status: "Under Review",
      file: null,
      notes: "Organic content certification renewal in progress.",
      isDeleted: false
    },
    {
      id: "oeko-tex-100",
      name: "OEKO-TEX Standard 100",
      certNo: "OEKO-2026-7890",
      certType: "Chemical & Safety",
      issuingOrg: "Hohenstein Institute",
      buyer: "Zara",
      orderId: "PL-3321",
      issueDate: "2025-06-01",
      expiryDate: "2026-06-01",
      status: "Expired",
      file: "OEKO_TEX_Standard_100_Cert.pdf",
      notes: "Class I testing for direct skin contact garments.",
      isDeleted: false
    },
    {
      id: "bci-cert",
      name: "BCI",
      certNo: "BCI-IND-2026-90",
      certType: "Better Cotton Initiative",
      issuingOrg: "Better Cotton Council",
      buyer: "M&S",
      orderId: "TR-8899",
      issueDate: "2026-02-15",
      expiryDate: "2026-09-20",
      status: "Approved",
      file: "BCI_Trader_Certificate.pdf",
      notes: "Mass balance chain of custody credits allocated.",
      isDeleted: false
    }
  ],
  compliances: [
    {
      id: "comp-1",
      name: "GOTS Scope & TC Verification",
      category: "Certification",
      buyer: "Zara",
      orderId: "GKT-1054",
      department: "Compliance & Certification",
      responsiblePerson: "Suresh",
      dueDate: "2026-05-18",
      linkedCert: "GOTS",
      description: "Verify transaction certificate and mill TC for 100% organic cotton yarn lot.",
      status: "Passed",
      priority: "High",
      completedAt: "2026-05-10T14:30:00.000Z",
      notes: "Scope certificate matches lot numbers.",
      isDeleted: false
    },
    {
      id: "comp-2",
      name: "Buyer Chemical Restriction (RSL/ZDHC)",
      category: "Environmental",
      buyer: "Zara",
      orderId: "GKT-1054",
      department: "Quality",
      responsiblePerson: "Sezhiyan",
      dueDate: "2026-05-19",
      linkedCert: "OEKO-TEX Standard 100",
      description: "ZDHC MRSL level 3 compliance sign-off for dyeing chemicals and auxiliary recipe.",
      status: "In Progress",
      priority: "Critical",
      notes: "Lab dip test report received, pending final bulk test.",
      isDeleted: false
    },
    {
      id: "comp-3",
      name: "Social Compliance Audit (BSCI / SMETA)",
      category: "Social Compliance",
      buyer: "H&M",
      orderId: "ST-7788",
      department: "Compliance & Certification",
      responsiblePerson: "Arasinth Raja",
      dueDate: "2026-05-20",
      linkedCert: "ISO",
      description: "Annual SMETA 4-pillar audit renewal for sewing facility units.",
      status: "Pending",
      priority: "High",
      notes: "Auditor visit scheduled for 15 May.",
      isDeleted: false
    },
    {
      id: "comp-4",
      name: "Metal Detection & Needle Policy Audit",
      category: "Factory Compliance",
      buyer: "Uniqlo",
      orderId: "JKT-2231",
      department: "Quality",
      responsiblePerson: "Kavitha",
      dueDate: "2026-05-22",
      linkedCert: "",
      description: "9-point 100% calibration log verification for 9-head metal detector line.",
      status: "Pending",
      priority: "Medium",
      notes: "Calibration logs updated daily.",
      isDeleted: false
    },
    {
      id: "comp-5",
      name: "M&S Fabric Quality & Azo Free Check",
      category: "Quality",
      buyer: "M&S",
      orderId: "TR-8899",
      department: "Purchase – Fabric",
      responsiblePerson: "Selva Kumar",
      dueDate: "2026-05-24",
      linkedCert: "BCI",
      description: "Azo-dye test and formaldehyde level testing certification.",
      status: "Passed",
      priority: "High",
      completedAt: "2026-05-08T11:00:00.000Z",
      notes: "Zero AZO detected in lab report #TR-8899-AZO.",
      isDeleted: false
    }
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
  notifications: [
    {
      id: "notif-seed-1",
      eventKey: "order-delayed-ST-7788",
      type: "order",
      title: "Order Delayed",
      message: "Order ST-7788 is delayed.",
      relatedModule: "orders",
      relatedId: "ST-7788",
      priority: "critical",
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      isDeleted: false
    },
    {
      id: "notif-seed-2",
      eventKey: "cert-expiring-gots",
      type: "certification",
      title: "Certification Expiring Soon",
      message: "GOTS certification expires in 15 days.",
      relatedModule: "compliance",
      relatedId: "gots",
      priority: "high",
      isRead: false,
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      isDeleted: false
    },
    {
      id: "notif-seed-3",
      eventKey: "task-assigned-pp-approval",
      type: "task",
      title: "New Task Assigned",
      message: "A new task 'PP Approval' has been assigned to you.",
      relatedModule: "tasks",
      relatedId: "task-comp-comp-3",
      priority: "medium",
      isRead: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      isDeleted: false
    },
    {
      id: "notif-seed-4",
      eventKey: "approval-required-app-101",
      type: "approval",
      title: "Approval Required",
      message: "Fit Sample Approval requires your review for order GKT-1054.",
      relatedModule: "approvals",
      relatedId: "GKT-1054",
      priority: "high",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isDeleted: false
    },
    {
      id: "notif-seed-5",
      eventKey: "tna-stage-completed-GKT-1054-fabric",
      type: "tna",
      title: "T&A Stage Completed",
      message: "Fabric stage completed for GKT-1054.",
      relatedModule: "tna",
      relatedId: "GKT-1054",
      priority: "low",
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isDeleted: false
    }
  ],
  suppliers: [
    {
      id: "sup-elite-print",
      name: "Elite Print & Embro",
      code: "SUP-EPE-01",
      type: "Printing & Embroidery",
      contactPerson: "Manoj Kumar",
      mobile: "+91 98421 88320",
      email: "orders@eliteprint.com",
      address: "42, Avinashi Road, Anupparpalayam",
      city: "Tirupur",
      country: "India",
      onTimeTarget: 95,
      qualityTarget: 98,
      notes: "Specialized in reactive rotary printing, high-density embroidery, and silicone badge application.",
      latestOrderDate: "2026-05-10T10:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      isDeleted: false
    },
    {
      id: "sup-colortex",
      name: "ColorTex Dyeing",
      code: "SUP-CTX-02",
      type: "Dyeing & Washing",
      contactPerson: "R. Saravanan",
      mobile: "+91 94432 19045",
      email: "labdips@colortexdyeing.in",
      address: "18, SIPCOT Industrial Park, Perundurai",
      city: "Erode",
      country: "India",
      onTimeTarget: 92,
      qualityTarget: 96,
      notes: "OEKO-TEX Class 1 certified soft flow and garment dyeing facility.",
      latestOrderDate: "2026-05-08T14:30:00.000Z",
      createdAt: "2026-01-05T00:00:00.000Z",
      isDeleted: false
    },
    {
      id: "sup-precision-embro",
      name: "Precision Embroidery Co.",
      code: "SUP-PEC-03",
      type: "Printing & Embroidery",
      contactPerson: "Anand Venkatesh",
      mobile: "+91 97890 55112",
      email: "info@precisionembro.com",
      address: "7/14, Angeripalayam Main Road",
      city: "Tirupur",
      country: "India",
      onTimeTarget: 95,
      qualityTarget: 99,
      notes: "Multi-head Tajima embroidery machines with laser cutting and sequin attachment.",
      latestOrderDate: "2026-05-05T09:15:00.000Z",
      createdAt: "2026-01-10T00:00:00.000Z",
      isDeleted: false
    },
    {
      id: "sup-sunprint",
      name: "SunPrint Studio",
      code: "SUP-SPS-04",
      type: "Printing & Embroidery",
      contactPerson: "K. Murugan",
      mobile: "+91 98944 67200",
      email: "contact@sunprintstudio.com",
      address: "115, Palladam Road, Veerapandi",
      city: "Tirupur",
      country: "India",
      onTimeTarget: 90,
      qualityTarget: 95,
      notes: "Digital pigment printing, sublimation printing, and heat transfer labels.",
      latestOrderDate: "2026-05-02T11:45:00.000Z",
      createdAt: "2026-01-15T00:00:00.000Z",
      isDeleted: false
    }
  ],
  supplierWork: [
    {
      id: "work-1",
      orderId: "GKT-1054",
      supplierId: "sup-elite-print",
      supplierName: "Elite Print & Embro",
      source: "order",
      dept: "VAP",
      taskName: "Printing / Embroidery",
      stageIdx: 13,
      purpose: "Printing",
      description: "Front chest pigment printing and puff print for Zara Hoodie batch",
      assignedDate: "2026-05-10",
      expectedDate: "20 May",
      completedDate: null,
      status: "In Progress",
      qualityStatus: "Pending",
      qualityIssueDescription: "",
      createdAt: "2026-05-10T10:00:00.000Z",
      isDeleted: false
    },
    {
      id: "work-2",
      orderId: "ST-7788",
      supplierId: "sup-precision-embro",
      supplierName: "Precision Embroidery Co.",
      source: "dept_task",
      dept: "Production",
      taskName: "Printing / Embroidery",
      stageIdx: 13,
      purpose: "Embroidery",
      description: "Chest multi-head embroidery for H&M T-Shirt",
      assignedDate: "2026-05-05",
      expectedDate: "18 May",
      completedDate: null,
      status: "Delayed",
      qualityStatus: "Issue",
      qualityIssueDescription: "Embroidery thread tension and color mismatch",
      createdAt: "2026-05-05T09:15:00.000Z",
      isDeleted: false
    },
    {
      id: "work-3",
      orderId: "PL-3321",
      supplierId: "sup-colortex",
      supplierName: "ColorTex Dyeing",
      source: "dept_task",
      dept: "Purchase – Fabric",
      taskName: "Fabric Booking",
      stageIdx: 2,
      purpose: "Dyeing",
      description: "Reactive yarn dyeing and lab dip matching for Zara Polo pique fabric",
      assignedDate: "2026-05-08",
      expectedDate: "28 May",
      completedDate: "2026-05-27",
      status: "Completed",
      qualityStatus: "Passed",
      qualityIssueDescription: "",
      createdAt: "2026-05-08T14:30:00.000Z",
      isDeleted: false
    },
    {
      id: "work-4",
      orderId: "TR-8899",
      supplierId: "sup-sunprint",
      supplierName: "SunPrint Studio",
      source: "order",
      dept: "VAP",
      taskName: "Printing / Embroidery",
      stageIdx: 13,
      purpose: "Printing",
      description: "Heat transfer care labels and pocket branding for M&S Trouser",
      assignedDate: "2026-05-02",
      expectedDate: "25 May",
      completedDate: "2026-05-24",
      status: "Completed",
      qualityStatus: "Passed",
      qualityIssueDescription: "",
      createdAt: "2026-05-02T11:45:00.000Z",
      isDeleted: false
    }
  ]
};

import { MongoClient } from "mongodb";

let memoryDB = JSON.parse(JSON.stringify(RESOURCE_SEEDS));
let memoryStorage = { personal: {}, shared: {} };

// Global cached connection for Vercel Serverless
let cachedClient = global._mongoClient;
let cachedDb = global._mongoDb;

async function getMongoCollections() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      await cachedClient.connect();
      global._mongoClient = cachedClient;
    }
    
    if (!cachedDb) {
      cachedDb = cachedClient.db(process.env.MONGODB_DB_NAME || "loom_plm");
      global._mongoDb = cachedDb;
    }

    const storage = cachedDb.collection("storage");
    const resources = cachedDb.collection("resources");
    
    return { resources, storage };
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    // Reset cache on error to force reconnect next request
    cachedClient = null;
    cachedDb = null;
    global._mongoClient = null;
    global._mongoDb = null;
    return null;
  }
}

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
  "compliances",
  "debitNotes",
  "capas",
  "notifications",
  "suppliers",
  "supplierWork",
];

function validResource(name) {
  return Object.prototype.hasOwnProperty.call(RESOURCE_SEEDS, name);
}

function makeId(resource, record) {
  return record?.id || `${resource}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default async function handler(req, res) {
  try {
    // 1. CORS Headers
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

    // 2. Health check
    if (pathname === "/api/health" || pathname === "/health" || pathname === "/api" || pathname === "/") {
      return res.status(200).json({ ok: true, environment: "vercel-serverless", timestamp: new Date().toISOString() });
    }

    // 3. Resources API: /api/resources/:resource/:id?
    const resourceMatch = pathname.match(/^\/(?:api\/)?resources\/([^/]+)(?:\/([^/]+))?\/?$/);
    if (resourceMatch) {
      const resource = resourceMatch[1];
      const id = resourceMatch[2] ? decodeURIComponent(resourceMatch[2]) : null;

      if (!validResource(resource)) {
        return res.status(404).json({ error: "Unknown resource" });
      }

      const mongoCols = await getMongoCollections();
      const isSoftDelete = SOFT_DELETE_RESOURCES.includes(resource);
      const showAll = url.searchParams.get("all") === "true";

      // GET /api/resources/:resource or /api/resources/:resource/:id
      if (req.method === "GET") {
        if (mongoCols?.resources) {
          if (id) {
            const record = await mongoCols.resources.findOne({ resource, id }, { projection: { _id: 0 } });
            if (!record) return res.status(404).json({ error: "Record not found" });
            return res.status(200).json(record);
          }
          const filter = isSoftDelete && !showAll
            ? { resource, isDeleted: isTrash ? true : { $ne: true } }
            : { resource };
          const items = await mongoCols.resources.find(filter).project({ _id: 0 }).toArray();
          return res.status(200).json(items);
        }

        if (!Array.isArray(memoryDB[resource])) {
          memoryDB[resource] = JSON.parse(JSON.stringify(RESOURCE_SEEDS[resource] || []));
        }

        if (id) {
          const item = memoryDB[resource].find(r => String(r.id) === id);
          if (!item) return res.status(404).json({ error: "Record not found" });
          return res.status(200).json(item);
        }
        const items = memoryDB[resource].filter(r => {
          if (!isSoftDelete || showAll) return true;
          return isTrash ? r.isDeleted === true : r.isDeleted !== true;
        });
        return res.status(200).json(items);
      }

      // POST /api/resources/:resource
      if (req.method === "POST") {
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
        const recordId = makeId(resource, body);
        const record = {
          ...body,
          id: recordId,
          resource,
          ...(isSoftDelete ? { isDeleted: false } : {}),
        };

        if (mongoCols?.resources) {
          delete record._id;
          await mongoCols.resources.replaceOne({ resource, id: recordId }, { resource, ...record }, { upsert: true });
          return res.status(201).json(record);
        }

        if (!Array.isArray(memoryDB[resource])) memoryDB[resource] = [];
        const existingIdx = memoryDB[resource].findIndex(r => String(r.id) === String(recordId));
        if (existingIdx >= 0) memoryDB[resource][existingIdx] = record;
        else memoryDB[resource] = [record, ...memoryDB[resource]];
        return res.status(201).json(record);
      }

      // PUT or PATCH /api/resources/:resource/:id
      if (req.method === "PUT" || req.method === "PATCH") {
        if (!id) return res.status(400).json({ error: "Record ID required" });
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

        if (mongoCols?.resources) {
          const existing = await mongoCols.resources.findOne({ resource, id });
          const updated = { ...(existing || {}), ...body, id, resource };
          delete updated._id;
          await mongoCols.resources.replaceOne({ resource, id }, { resource, ...updated }, { upsert: true });
          return res.status(200).json(updated);
        }

        if (!Array.isArray(memoryDB[resource])) memoryDB[resource] = [];
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

      // DELETE /api/resources/:resource/:id
      if (req.method === "DELETE") {
        if (!id) return res.status(400).json({ error: "Record ID required" });

        if (mongoCols?.resources) {
          if (isSoftDelete) {
            const update = { $set: { isDeleted: true, deletedAt: new Date().toISOString() } };
            const result = await mongoCols.resources.updateOne({ resource, id }, update);
            if (!result.matchedCount) return res.status(404).json({ error: "Record not found" });
            return res.status(200).json({ id, deleted: true, isDeleted: true });
          }
          const result = await mongoCols.resources.deleteOne({ resource, $or: [{ id }, { name: id }] });
          return res.status(200).json({ id, deleted: result.deletedCount > 0 });
        }

        if (!Array.isArray(memoryDB[resource])) memoryDB[resource] = [];
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

    // 4. Storage API: /api/storage/:key?
    const storageMatch = pathname.match(/^\/(?:api\/)?storage(?:\/([^/]+))?\/?$/);
    if (storageMatch) {
      const key = storageMatch[1] ? decodeURIComponent(storageMatch[1]) : null;
      const shared = url.searchParams.get("shared") === "true";
      const bucket = shared ? "shared" : "personal";
      const mongoCols = await getMongoCollections();

      if (req.method === "GET") {
        if (mongoCols?.storage) {
          if (key) {
            const record = await mongoCols.storage.findOne({ key, shared });
            return res.status(200).json({ key, value: record ? record.value : null, shared });
          }
          const prefix = url.searchParams.get("prefix") || "";
          const records = await mongoCols.storage.find({ shared, key: { $regex: `^${prefix}` } }).project({ _id: 0, key: 1 }).toArray();
          return res.status(200).json({ keys: records.map(r => r.key), prefix, shared });
        }

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
        if (mongoCols?.storage) {
          await mongoCols.storage.updateOne(
            { key, shared: !!body.shared },
            { $set: { key, value: body.value, shared: !!body.shared } },
            { upsert: true }
          );
          return res.status(200).json({ key, value: body.value, shared: !!body.shared });
        }
        memoryStorage[bucket][key] = body.value;
        return res.status(200).json({ key, value: body.value, shared: !!body.shared });
      }

      if (req.method === "DELETE" && key) {
        if (mongoCols?.storage) {
          const resDel = await mongoCols.storage.deleteOne({ key, shared });
          return res.status(200).json({ key, deleted: resDel.deletedCount > 0, shared });
        }
        const deleted = key in memoryStorage[bucket];
        delete memoryStorage[bucket][key];
        return res.status(200).json({ key, deleted, shared });
      }
    }

    // 4. Gemini Highlights API
    if (
      pathname === "/api/gemini/extract-highlights" ||
      pathname === "/api/claude/extract-highlights" ||
      pathname === "/gemini/extract-highlights" ||
      pathname === "/claude/extract-highlights"
    ) {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const { techPackNotes, deptOptions } = body;
      if (!techPackNotes || !techPackNotes.trim()) {
        return res.status(400).json({ error: "techPackNotes is required" });
      }
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server" });
      }
      const deptList = Array.isArray(deptOptions) && deptOptions.length ? deptOptions : ["All"];
      const prompt = `You are reviewing a garment tech pack's comments / notes section for a production team. Pull out only the distinct, important buyer instructions that a team could miss and cause rework — things like materials, trims, colors, construction details, measurements, approvals, or packing requirements. Ignore generic boilerplate.

Return ONLY a JSON array, no markdown fences, no explanation. Each item must follow this format:
{"text": "<concise instruction, under 20 words>", "dept": "<one of: ${deptList.join(", ")}, or All if it applies broadly>"}

If nothing relevant is found, return [].

Tech pack notes:
"""
${techPackNotes}
"""`;

      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        let result;
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
          result = await model.generateContent(prompt);
        } catch (err) {
          const fallbackModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
          result = await fallbackModel.generateContent(prompt);
        }
        const responseText = result.response.text();
        const raw = responseText ? responseText.trim() : "";
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        const items = JSON.parse(cleaned);
        return res.status(200).json({ items });
      } catch (err) {
        return res.status(500).json({ error: err.message || "Failed to process Gemini request" });
      }
    }

    return res.status(404).json({ error: "API Route not found", pathname });
  } catch (error) {
    console.error("Vercel Function Handler Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
