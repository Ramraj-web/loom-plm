import {
  FileText, ClipboardList, Package, Layers, CheckCircle2, Warehouse, ShieldCheck,
  Shirt, Scissors, Palette, Factory, Truck, Users, Calendar, Radio, TrendingUp, ClipboardCheck
} from "lucide-react";

export const SHIPMENT_PERFORMANCE = [
  { month: "Dec", onTime: 74, target: 75 },
  { month: "Jan", onTime: 78, target: 75 },
  { month: "Feb", onTime: 73, target: 75 },
  { month: "Mar", onTime: 80, target: 75 },
  { month: "Apr", onTime: 77, target: 75 },
  { month: "May", onTime: 82.3, target: 75 },
];

export const REASONS = [
  "Buyer approval delay", "Fabric delay", "Trims shortage",
  "Capacity shortage", "Quality rework", "Logistics", "Others"
];

export const VAP_SUPPLIERS = [
  "Elite Print & Embro", "ColorTex Dyeing", "Precision Embroidery Co.", "SunPrint Studio"
];

export const SUPPLIER_TYPES = [
  "Printing & Embroidery",
  "Dyeing & Washing",
  "Fabric Mill",
  "Trims & Accessories",
  "Knitting & Spinning",
  "Embellishment",
  "Others"
];

export const INITIAL_SUPPLIERS = [
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
];

export const WORK_PURPOSES = [
  "Printing",
  "Embroidery",
  "Dyeing",
  "Fabric Processing",
  "Trims",
  "Washing",
  "Finishing",
  "Packaging",
  "Testing",
  "Quality Inspection",
  "Sample Development",
  "CAD",
  "Other"
];

export const INITIAL_SUPPLIER_WORK = [
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
];

export function calculateSupplierMetrics(supplier, orders = [], supplierWork = []) {
  const supplierName = supplier?.name || "";
  const supplierId = supplier?.id || "";
  const matchingItems = [];
  const processedKeys = new Set();

  // 1. Process explicit work assignments
  const activeWork = (supplierWork.length > 0 ? supplierWork : INITIAL_SUPPLIER_WORK).filter(
    w => !w.isDeleted && (w.supplierId === supplierId || w.supplierName === supplierName)
  );

  activeWork.forEach((w) => {
    const parentOrder = orders.find(o => o.id === w.orderId) || {
      id: w.orderId,
      style: w.style || "Custom Style",
      buyer: w.buyer || "Direct Buyer",
      qty: w.qty || 0,
      ship: w.expectedDate,
      status: w.status === "Delayed" ? "Delayed" : "On Track"
    };

    const isDelayed = w.status === "Delayed";
    const isQualityIssue = w.qualityStatus === "Issue" || Boolean(w.qualityIssueDescription);

    const key = `${parentOrder.id}-${w.stageIdx !== undefined ? w.stageIdx : w.id}`;
    processedKeys.add(key);

    matchingItems.push({
      id: w.id,
      order: parentOrder,
      orderId: parentOrder.id,
      style: parentOrder.style,
      buyer: parentOrder.buyer,
      qty: parentOrder.qty,
      dept: w.dept || "VAP",
      taskName: w.taskName || "Custom Job",
      purpose: w.purpose || "Work Assignment",
      description: w.description || "",
      assignedDate: w.assignedDate || w.createdAt || "2026-05-10",
      expectedDate: w.expectedDate || parentOrder.ship || "—",
      completedDate: w.completedDate || null,
      status: w.status || "Pending",
      qualityStatus: w.qualityStatus || "Pending",
      qualityIssueDescription: w.qualityIssueDescription || "",
      isDelayed,
      isQualityIssue,
      assignedAt: w.createdAt || w.assignedDate
    });
  });

  // 2. Also check stage-level assignments from orders that haven't been captured in explicit work
  orders.forEach(o => {
    if (o.isDeleted) return;
    if (o.stages && Array.isArray(o.stages)) {
      o.stages.forEach((stage, idx) => {
        if (stage.supplier === supplierName || (supplierName && o.supplier === supplierName)) {
          const key = `${o.id}-${idx}`;
          if (!processedKeys.has(key)) {
            processedKeys.add(key);
            const isDelayed = Boolean(stage.reason || o.status === "Delayed");
            const isQualityIssue = Boolean(stage.reason === "Quality rework" || (stage.reason && stage.reason.toLowerCase().includes("quality")));
            
            matchingItems.push({
              id: `stage-${o.id}-${idx}`,
              order: o,
              orderId: o.id,
              style: o.style,
              buyer: o.buyer,
              qty: o.qty,
              dept: stage.dept || "VAP",
              taskName: stage.name,
              purpose: stage.dept === "VAP" ? "Printing & Embroidery" : "Fabric Processing",
              description: `${stage.name} for ${o.id} ${o.style}`,
              assignedDate: o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "2026-05-01",
              expectedDate: stage.planned || o.ship || "—",
              completedDate: stage.status === "done" ? o.ship : null,
              status: stage.status === "done" ? "Completed" : stage.status === "in_progress" ? (isDelayed ? "Delayed" : "In Progress") : "Pending",
              qualityStatus: isQualityIssue ? "Issue" : stage.status === "done" ? "Passed" : "Pending",
              qualityIssueDescription: isQualityIssue ? (stage.reason || "Quality inspection defect") : "",
              isDelayed,
              isQualityIssue,
              assignedAt: o.createdAt
            });
          }
        }
      });
    }
  });

  // Sort matching items latest first
  matchingItems.sort((a, b) => {
    const timeA = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
    const timeB = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
    return timeB - timeA;
  });

  const jobs = matchingItems.length;
  const delayed = matchingItems.filter(item => item.isDelayed).length;
  const qualityIssues = matchingItems.filter(item => item.isQualityIssue).length;
  const onTime = Math.max(0, jobs - delayed);
  const onTimeRate = jobs > 0 ? Math.round((onTime / jobs) * 100) : null;
  const qualityPerformance = jobs > 0 ? Math.round((Math.max(0, jobs - qualityIssues) / jobs) * 100) : null;

  // Unique associated orders (most recent first)
  const uniqueOrdersMap = new Map();
  matchingItems.forEach(item => {
    if (!uniqueOrdersMap.has(item.order.id)) {
      uniqueOrdersMap.set(item.order.id, item.order);
    }
  });
  const associatedOrders = Array.from(uniqueOrdersMap.values());

  // Determine latest order
  let latestOrder = null;
  if (associatedOrders.length > 0) {
    latestOrder = associatedOrders[0];
  }

  // Performance status
  let status = "New";
  if (jobs > 0) {
    if (onTimeRate >= 95 && qualityIssues === 0) status = "Excellent";
    else if (onTimeRate >= 85) status = "Good";
    else if (onTimeRate >= 70) status = "Needs Attention";
    else status = "Poor";
  }

  return {
    jobs,
    onTime,
    delayed,
    qualityIssues,
    onTimeRate,
    qualityPerformance,
    status,
    associatedOrders,
    matchingItems,
    latestOrder
  };
}

/**
 * Robust date comparison helper that matches targetDate with checkDate.
 * Handles ISO timestamps, YYYY-MM-DD, DD-MM-YYYY, and "12 May" formats across full 24-hour day.
 */
export function isSameDay(targetDate, checkDate) {
  if (!targetDate || !checkDate) return false;
  
  let tYear, tMonth, tDay;
  if (typeof targetDate === "string") {
    const trimmedT = targetDate.trim();
    if (trimmedT.includes("-")) {
      const parts = trimmedT.split("T")[0].split("-");
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        tYear = parseInt(parts[0], 10);
        tMonth = parseInt(parts[1], 10) - 1;
        tDay = parseInt(parts[2], 10);
      } else {
        // DD-MM-YYYY
        tDay = parseInt(parts[0], 10);
        tMonth = parseInt(parts[1], 10) - 1;
        tYear = parseInt(parts[2], 10);
      }
    } else if (trimmedT.includes("/")) {
      const parts = trimmedT.split("/");
      if (parts[2]?.length === 4) {
        // DD/MM/YYYY
        tDay = parseInt(parts[0], 10);
        tMonth = parseInt(parts[1], 10) - 1;
        tYear = parseInt(parts[2], 10);
      }
    } else {
      const parsedT = new Date(trimmedT);
      if (!isNaN(parsedT.getTime())) {
        tYear = parsedT.getFullYear();
        tMonth = parsedT.getMonth();
        tDay = parsedT.getDate();
      }
    }
  } else if (targetDate instanceof Date && !isNaN(targetDate.getTime())) {
    tYear = targetDate.getFullYear();
    tMonth = targetDate.getMonth();
    tDay = targetDate.getDate();
  }

  if (tYear === undefined || isNaN(tYear) || tMonth === undefined || isNaN(tMonth) || tDay === undefined || isNaN(tDay)) return false;

  // Compare against checkDate
  if (typeof checkDate === "string") {
    const trimmed = checkDate.trim();
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const lower = trimmed.toLowerCase();
    
    // Check "12 May" or "12 May 2026" or "12-May-2026"
    const textMatch = lower.match(/^(\d{1,2})[\s\-]+([a-z]{3})(?:[\s\-]+(\d{4}))?$/);
    if (textMatch) {
      const day = parseInt(textMatch[1], 10);
      const monthIdx = monthNames.indexOf(textMatch[2]);
      const year = textMatch[3] ? parseInt(textMatch[3], 10) : tYear;
      if (day === tDay && monthIdx === tMonth && (textMatch[3] ? year === tYear : true)) {
        return true;
      }
    }

    // Check "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss"
    if (trimmed.includes("-")) {
      const parts = trimmed.split("T")[0].split("-");
      if (parts[0].length === 4) {
        const cYear = parseInt(parts[0], 10);
        const cMonth = parseInt(parts[1], 10) - 1;
        const cDay = parseInt(parts[2], 10);
        if (cYear === tYear && cMonth === tMonth && cDay === tDay) {
          return true;
        }
      } else if (parts[2]?.length === 4) {
        // DD-MM-YYYY
        const cDay = parseInt(parts[0], 10);
        const cMonth = parseInt(parts[1], 10) - 1;
        const cYear = parseInt(parts[2], 10);
        if (cYear === tYear && cMonth === tMonth && cDay === tDay) {
          return true;
        }
      }
    }

    // Check "DD/MM/YYYY"
    if (trimmed.includes("/")) {
      const parts = trimmed.split("/");
      if (parts[2]?.length === 4) {
        const cDay = parseInt(parts[0], 10);
        const cMonth = parseInt(parts[1], 10) - 1;
        const cYear = parseInt(parts[2], 10);
        if (cYear === tYear && cMonth === tMonth && cDay === tDay) {
          return true;
        }
      }
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return (
        d.getFullYear() === tYear &&
        d.getMonth() === tMonth &&
        d.getDate() === tDay
      );
    }
  } else if (checkDate instanceof Date && !isNaN(checkDate.getTime())) {
    return (
      checkDate.getFullYear() === tYear &&
      checkDate.getMonth() === tMonth &&
      checkDate.getDate() === tDay
    );
  }

  return false;
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return "Today";
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts[0].length === 4) {
      const year = parts[0];
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return `${day} ${monthNames[month]} ${year}`;
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  return dateStr;
}

export function formatActivityTime(isoString) {
  if (!isoString) return "10:00 AM";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "10:00 AM";
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Aggregates all real activities and work history across the application for the given date.
 */
export function collectActivitiesForDate(targetDate, {
  orders = [],
  tasks = [],
  compliances = [],
  certifications = [],
  supplierWork = [],
  notifications = [],
  leaveRequests = [],
  debitNotes = [],
  capas = [],
  attendance = {}
} = {}) {
  const activities = [];

  // 1. Orders & T&A Stages
  orders.forEach(o => {
    if (o.isDeleted) return;

    if (isSameDay(targetDate, o.createdAt)) {
      activities.push({
        id: `order-create-${o.id}`,
        timestamp: o.createdAt || new Date(targetDate).toISOString(),
        time: formatActivityTime(o.createdAt),
        type: "order",
        category: "Orders",
        title: `Order Created: #${o.id} · ${o.style}`,
        description: `New buyer order created for ${o.buyer} (${Number(o.qty || 0).toLocaleString()} pcs, Ship ${o.ship})`,
        dept: "Merchandising",
        actor: "Merchandising Team",
        status: o.status,
        orderId: o.id,
        targetModule: "orders"
      });
    }

    if (o.completed && isSameDay(targetDate, o.completedAt)) {
      activities.push({
        id: `order-complete-${o.id}`,
        timestamp: o.completedAt,
        time: formatActivityTime(o.completedAt),
        type: "order",
        category: "Orders",
        title: `Order Completed: #${o.id} · ${o.style}`,
        description: `Order successfully completed and ready for dispatch for ${o.buyer}`,
        dept: "Logistics & Documentation",
        actor: "Production & Shipping",
        status: "Completed",
        orderId: o.id,
        targetModule: "orders"
      });
    }

    // Stages
    if (o.stages && Array.isArray(o.stages)) {
      o.stages.forEach((stage, idx) => {
        if (stage.completedAt && isSameDay(targetDate, stage.completedAt)) {
          activities.push({
            id: `stage-done-${o.id}-${idx}`,
            timestamp: stage.completedAt,
            time: formatActivityTime(stage.completedAt),
            type: "tna",
            category: "Tasks & T&A",
            title: `T&A Stage Completed: ${stage.name}`,
            description: `Stage finished for order #${o.id} (${o.style} · ${o.buyer})`,
            dept: stage.dept || "Merchandising",
            actor: stage.assignee || "Assigned Team",
            status: "Done",
            orderId: o.id,
            targetModule: "orders"
          });
        } else if (stage.flaggedAt && isSameDay(targetDate, stage.flaggedAt)) {
          activities.push({
            id: `stage-flag-${o.id}-${idx}`,
            timestamp: stage.flaggedAt,
            time: formatActivityTime(stage.flaggedAt),
            type: "tna",
            category: "Tasks & T&A",
            title: `Delay Flagged on ${stage.name}`,
            description: `Issue flagged: "${stage.reason || 'Delay'}" on order #${o.id} (${o.style})`,
            dept: stage.dept || "Production",
            actor: stage.assignee || "Department Lead",
            status: "Delayed",
            orderId: o.id,
            targetModule: "orders"
          });
        } else if (stage.updatedAt && isSameDay(targetDate, stage.updatedAt)) {
          activities.push({
            id: `stage-progress-${o.id}-${idx}`,
            timestamp: stage.updatedAt,
            time: formatActivityTime(stage.updatedAt),
            type: "tna",
            category: "Tasks & T&A",
            title: `T&A Stage In Progress: ${stage.name}`,
            description: `Work commenced on stage for order #${o.id} (${o.style})`,
            dept: stage.dept || "Production",
            actor: stage.assignee || "Production Floor",
            status: "In Progress",
            orderId: o.id,
            targetModule: "orders"
          });
        }
      });
    }

    // Pre-Prod documents
    if (o.preProd) {
      Object.entries(o.preProd).forEach(([key, doc]) => {
        if (doc.approvedAt && isSameDay(targetDate, doc.approvedAt)) {
          activities.push({
            id: `preprod-app-${o.id}-${key}`,
            timestamp: doc.approvedAt,
            time: formatActivityTime(doc.approvedAt),
            type: "approval",
            category: "Tasks & T&A",
            title: `Pre-Production Document Approved: ${key}`,
            description: `Approved for order #${o.id} (${o.style}) by ${doc.approvedBy || "Merchandiser"}`,
            dept: "Merchandising",
            actor: doc.approvedBy || "Merchandiser",
            status: "Approved",
            orderId: o.id,
            targetModule: "orders"
          });
        }
      });
    }
  });

  // 2. Custom Tasks
  tasks.forEach(t => {
    if (t.createdAt && isSameDay(targetDate, t.createdAt)) {
      activities.push({
        id: `custom-task-create-${t.id}`,
        timestamp: t.createdAt,
        time: formatActivityTime(t.createdAt),
        type: "task",
        category: "Tasks & T&A",
        title: `Task Assigned: ${t.title}`,
        description: `Action item assigned to ${t.assignee || 'Team'} (${t.dept || 'General'}) · Due: ${t.dueDate || '—'}${t.orderId ? ` · Related PO #${t.orderId}` : ''}`,
        dept: t.dept || "Merchandising",
        actor: t.assignee || "Task Lead",
        status: t.status === "done" ? "Done" : "In Progress",
        orderId: t.orderId,
        targetModule: "tasks"
      });
    }
    if (t.completedAt && isSameDay(targetDate, t.completedAt)) {
      activities.push({
        id: `custom-task-done-${t.id}`,
        timestamp: t.completedAt,
        time: formatActivityTime(t.completedAt),
        type: "task",
        category: "Tasks & T&A",
        title: `Task Completed: ${t.title}`,
        description: `Completed by ${t.assignee || 'Assignee'}`,
        dept: t.dept || "Merchandising",
        actor: t.assignee || "Assignee",
        status: "Done",
        orderId: t.orderId,
        targetModule: "tasks"
      });
    }
  });

  // 3. Supplier Work
  supplierWork.forEach(w => {
    if (w.isDeleted) return;
    if (isSameDay(targetDate, w.assignedDate || w.createdAt)) {
      activities.push({
        id: `supp-work-assign-${w.id}`,
        timestamp: w.createdAt || w.assignedDate,
        time: formatActivityTime(w.createdAt),
        type: "supplier",
        category: "Supplier Work",
        title: `Work Assigned to Supplier: ${w.supplierName}`,
        description: `Purpose: ${w.purpose || 'Processing'} · Order #${w.orderId} (${w.description || 'Production Batch'}) · Expected: ${w.expectedDate || '—'}`,
        dept: w.dept || "VAP",
        actor: "Sourcing & Merchandising",
        status: w.status || "In Progress",
        orderId: w.orderId,
        targetModule: "supplierPerformance"
      });
    }
    if (w.completedDate && isSameDay(targetDate, w.completedDate)) {
      activities.push({
        id: `supp-work-done-${w.id}`,
        timestamp: w.completedDate,
        time: formatActivityTime(w.completedDate),
        type: "supplier",
        category: "Supplier Work",
        title: `Supplier Completed Work: ${w.supplierName}`,
        description: `Completed ${w.purpose || 'work'} for order #${w.orderId} · Quality: ${w.qualityStatus || 'Passed'}`,
        dept: w.dept || "VAP",
        actor: w.supplierName,
        status: "Completed",
        orderId: w.orderId,
        targetModule: "supplierPerformance"
      });
    }
  });

  // 4. Compliances & Certifications
  compliances.forEach(c => {
    if (c.isDeleted) return;
    if (c.completedAt && isSameDay(targetDate, c.completedAt)) {
      activities.push({
        id: `comp-done-${c.id}`,
        timestamp: c.completedAt,
        time: formatActivityTime(c.completedAt),
        type: "compliance",
        category: "Quality & Compliance",
        title: `Compliance Audit Passed: ${c.name}`,
        description: `Verified for buyer ${c.buyer} (${c.department}) · ${c.notes || c.description}`,
        dept: c.department || "Compliance & Certification",
        actor: c.responsiblePerson || "Compliance Officer",
        status: "Passed",
        orderId: c.orderId,
        targetModule: "compliance"
      });
    } else if (c.createdAt && isSameDay(targetDate, c.createdAt)) {
      activities.push({
        id: `comp-create-${c.id}`,
        timestamp: c.createdAt,
        time: formatActivityTime(c.createdAt),
        type: "compliance",
        category: "Quality & Compliance",
        title: `Compliance Requirement Logged: ${c.name}`,
        description: `Initiated for order #${c.orderId} (${c.buyer}) · Due: ${c.dueDate}`,
        dept: c.department || "Compliance & Certification",
        actor: c.responsiblePerson || "Compliance Team",
        status: c.status || "In Progress",
        orderId: c.orderId,
        targetModule: "compliance"
      });
    }
  });

  certifications.forEach(cert => {
    if (cert.isDeleted) return;
    if (cert.issueDate && isSameDay(targetDate, cert.issueDate)) {
      activities.push({
        id: `cert-issue-${cert.id}`,
        timestamp: cert.issueDate,
        time: formatActivityTime(cert.issueDate),
        type: "certification",
        category: "Quality & Compliance",
        title: `Certificate Issued: ${cert.name}`,
        description: `Cert #${cert.certNo || '—'} issued by ${cert.issuingOrg || 'Agency'} for ${cert.buyer} · Valid until ${cert.expiryDate}`,
        dept: "Compliance & Certification",
        actor: cert.issuingOrg || "Compliance Officer",
        status: cert.status || "Approved",
        orderId: cert.orderId,
        targetModule: "compliance"
      });
    }
  });

  // 5. Notifications
  notifications.forEach(n => {
    if (n.isDeleted) return;
    if (n.createdAt && isSameDay(targetDate, n.createdAt)) {
      activities.push({
        id: `notif-act-${n.id}`,
        timestamp: n.createdAt,
        time: formatActivityTime(n.createdAt),
        type: "notification",
        category: "Notifications",
        title: `System Alert: ${n.title}`,
        description: n.message,
        dept: n.relatedModule || "System",
        actor: "Loom PLM Engine",
        status: n.priority,
        orderId: n.relatedId,
        targetModule: n.relatedModule || "notifications"
      });
    }
  });

  // 6. Debit Notes & CAPAs
  debitNotes.forEach(dn => {
    if (isSameDay(targetDate, dn.date || dn.createdAt)) {
      activities.push({
        id: `debit-note-${dn.id}`,
        timestamp: dn.createdAt || new Date(targetDate).toISOString(),
        time: formatActivityTime(dn.createdAt),
        type: "financial",
        category: "Orders",
        title: `Debit Note Issued: #${dn.id} (${dn.buyer})`,
        description: `Amount: $${Number(dn.amount).toLocaleString()} · PO #${dn.po} · Reason: ${dn.reason}`,
        dept: "Finance",
        actor: "Finance Team",
        status: "Debit Note",
        orderId: dn.po,
        targetModule: "debitNotes"
      });
    }
  });

  capas.forEach(capa => {
    if (isSameDay(targetDate, capa.date || capa.createdAt)) {
      activities.push({
        id: `capa-${capa.id}`,
        timestamp: capa.createdAt || new Date(targetDate).toISOString(),
        time: formatActivityTime(capa.createdAt),
        type: "quality",
        category: "Quality & Compliance",
        title: `CAPA Action Logged: #${capa.id} (${capa.buyer})`,
        description: `Issue: ${capa.issue} · Action: ${capa.action}`,
        dept: "Quality",
        actor: "Quality Assurance",
        status: capa.status,
        orderId: capa.po,
        targetModule: "capas"
      });
    }
  });

  // 7. Leave Requests
  if (Array.isArray(leaveRequests)) {
    leaveRequests.forEach(lr => {
      if (isSameDay(targetDate, lr.from) || isSameDay(targetDate, lr.to) || isSameDay(targetDate, lr.createdAt)) {
        activities.push({
          id: `leave-req-${lr.id}`,
          timestamp: lr.createdAt || new Date(targetDate).toISOString(),
          time: formatActivityTime(lr.createdAt),
          type: "task",
          category: "Tasks & T&A",
          title: `Staff Leave ${lr.status === 'approved' ? 'Approved' : lr.status === 'rejected' ? 'Rejected' : 'Requested'}: ${lr.name}`,
          description: `Department: ${lr.dept || 'Staff'} · Duration: ${lr.from} to ${lr.to} · Reason: ${lr.reason || 'Personal'}`,
          dept: lr.dept || "Merchandising",
          actor: lr.name,
          status: lr.status === "approved" ? "Approved" : lr.status === "rejected" ? "Rejected" : "Pending",
          targetModule: "attendance"
        });
      }
    });
  }

  // Sort newest first
  activities.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  return activities;
}

export const INITIAL_CUSTOM_TASKS = [
  {
    id: "task-seed-1",
    title: "Review and approve lab dip test report for GKT-1054",
    orderId: "GKT-1054",
    dept: "Purchase – Fabric",
    assignee: "Selva Kumar",
    dueDate: "20 May",
    priority: "high",
    notes: "Reactive dye shade approval required before bulk fabric dyeing.",
    status: "in_progress",
    createdAt: "2026-05-12T08:00:00.000Z"
  },
  {
    id: "task-seed-2",
    title: "Finalize pattern grading marker with CAD team",
    orderId: "ST-7788",
    dept: "CAD",
    assignee: "Senthil",
    dueDate: "18 May",
    priority: "medium",
    notes: "Grading rules updated for EU size specs.",
    status: "in_progress",
    createdAt: "2026-05-12T11:20:00.000Z"
  },
  {
    id: "task-seed-3",
    title: "Quality inline audit for Zara Hoodie sewing line #2",
    orderId: "GKT-1054",
    dept: "Quality",
    assignee: "Sezhiyan",
    dueDate: "14 May",
    priority: "high",
    notes: "Hoodie pocket bar tack and double needle seam inspection.",
    status: "done",
    createdAt: "2026-05-11T09:00:00.000Z",
    completedAt: "2026-05-12T15:30:00.000Z"
  },
  {
    id: "task-seed-4",
    title: "Verify export packing list & customs carton count",
    orderId: "PL-3321",
    dept: "Logistics & Documentation",
    assignee: "Srinivasan",
    dueDate: "28 May",
    priority: "medium",
    notes: "Commercial invoice draft ready.",
    status: "in_progress",
    createdAt: "2026-05-10T14:00:00.000Z"
  }
];

export const TA_STAGES_90 = [
  { name: "Order Confirmation & Enquiry", day: "Day 1", dept: "Merchandising" },
  { name: "Tech Pack Received", day: "Day 1", dept: "Merchandising" },
  { name: "Fabric Booking", day: "Day 1-3", dept: "Purchase – Fabric" },
  { name: "Trim Booking", day: "Day 3-4", dept: "Purchase – Trims" },
  { name: "Fit Sample", day: "Day 2-6", dept: "Sample" },
  { name: "Fit Approval", day: "Day 7-13", dept: "Merchandising" },
  { name: "Fabric In-House", day: "Day 25", dept: "Store" },
  { name: "Fabric Inspection", day: "Day 28", dept: "Quality" },
  { name: "Size Set Sample", day: "Day 26-28", dept: "Sample" },
  { name: "Size Set Approval", day: "Day 31", dept: "Merchandising" },
  { name: "PP Sample", day: "Day 27-32", dept: "Production" },
  { name: "PP Approval", day: "Day 33-36", dept: "Merchandising" },
  { name: "Cutting", day: "Day 33-38", dept: "Cutting" },
  { name: "Printing / Embroidery", day: "Day 39-55", dept: "VAP" },
  { name: "Feeding", day: "Day 56-61", dept: "Production" },
  { name: "Sewing", day: "Day 62-84", dept: "Production" },
  { name: "Finishing", day: "Day 84-86", dept: "Finishing" },
  { name: "Packing", day: "Day 86-88", dept: "Finishing" },
  { name: "Final Inspection", day: "Day 88-90", dept: "Quality" },
  { name: "Shipment Documentation", day: "Day 90", dept: "Logistics & Documentation" },
  { name: "Goods Ready / Shipment", day: "Day 90", dept: "Logistics & Documentation" },
];

export const TA_STAGES_120 = [
  { name: "Order Confirmation & Enquiry", day: "Day 1", dept: "Merchandising" },
  { name: "Tech Pack Received", day: "Day 1", dept: "Merchandising" },
  { name: "Fabric Booking", day: "Day 1-3", dept: "Purchase – Fabric" },
  { name: "Trim Booking", day: "Day 3-4", dept: "Purchase – Trims" },
  { name: "Fit Sample", day: "Day 2-6", dept: "Sample" },
  { name: "Fit Approval", day: "Day 7-13", dept: "Merchandising" },
  { name: "Fabric In-House", day: "Day 50", dept: "Store" },
  { name: "Fabric Inspection", day: "Day 50-52", dept: "Quality" },
  { name: "Size Set Sample", day: "Day 53-60", dept: "Sample" },
  { name: "Size Set Approval", day: "Day 60-64", dept: "Merchandising" },
  { name: "PP Sample", day: "Day 53-60", dept: "Production" },
  { name: "PP Approval", day: "Day 60-64", dept: "Merchandising" },
  { name: "Cutting", day: "Day 65-70", dept: "Cutting" },
  { name: "Garment Dye", day: "Day 70-84", dept: "VAP" },
  { name: "Printing / Embroidery", day: "Day 84-98", dept: "VAP" },
  { name: "Feeding", day: "Day 98-100", dept: "Production" },
  { name: "Sewing", day: "Day 100-112", dept: "Production" },
  { name: "Finishing", day: "Day 112-114", dept: "Finishing" },
  { name: "Packing", day: "Day 115-118", dept: "Finishing" },
  { name: "Final Inspection", day: "Day 118-120", dept: "Quality" },
  { name: "Shipment Documentation", day: "Day 120", dept: "Logistics & Documentation" },
  { name: "Goods Ready / Shipment", day: "Day 120", dept: "Logistics & Documentation" },
];

export const TA_TEMPLATES = { "90": TA_STAGES_90, "120": TA_STAGES_120 };
export const TA_STAGES = TA_STAGES_90;

export const STAGE_ICON_SET_BASE = [
  FileText, ClipboardList, Package, Package, Layers, CheckCircle2, Warehouse, ShieldCheck,
  Layers, CheckCircle2, Shirt, CheckCircle2, Scissors, Palette, Palette, Factory, Shirt,
  Shirt, Shirt, ShieldCheck, FileText, Truck
];

export const COSTING_TEMPLATES = {
  fabric: {
    label: "Fabric to Garment",
    sections: [
      { section: "Fabric", items: ["Fabric 1", "Fabric 2", "Dyeing", "Finishing — peach/sueded/acid wash/bio wash", "Compacting"] },
      { section: "Trims & Accessories", items: ["Sewing Thread", "Zip / Buttons / Elastic", "Main Label", "Care Label", "Disclaimer Tag", "Hang Tag", "Oversize Tag", "Tissue", "Fusing Sticker / Label", "Polybag", "Carton"] },
      { section: "VAP", items: ["Print / Embroidery / Hot Fix Stone"] },
      { section: "CMT", items: ["Cutting", "Power Table", "Singer", "Checking", "Ironing", "Packing", "Quality Inspection"] },
      { section: "Overheads", items: [] },
      { section: "Rejection", items: [] },
      { section: "Commercial Costs", items: [] },
      { section: "Profit", items: [] },
    ],
  },
  yarn: {
    label: "Yarn to Garment",
    sections: [
      { section: "Yarn & Fabrication", items: ["Yarn 1", "Yarn 2", "Knitting", "Heat Setting", "Dyeing", "Finishing — peach/sueded/acid wash/bio wash", "Compacting"] },
      { section: "Trims & Accessories", items: ["Sewing Thread", "Zip / Buttons / Elastic", "Main Label", "Care Label", "Disclaimer Tag", "Hang Tag", "Oversize Tag", "Tissue", "Fusing Sticker / Label", "Polybag", "Carton"] },
      { section: "VAP", items: ["Print / Embroidery / Hot Fix Stone"] },
      { section: "CMT", items: ["Cutting", "Power Table", "Singer", "Checking", "Ironing", "Packing", "Printing / Embroidery", "Quality Inspection"] },
      { section: "Overheads", items: [] },
      { section: "Rejection", items: [] },
      { section: "Commercial Costs", items: [] },
      { section: "Profit", items: [] },
    ],
  },
};

export function buildCostingRows(templateKey) {
  const tmpl = COSTING_TEMPLATES[templateKey] || COSTING_TEMPLATES.fabric;
  const rows = [];
  tmpl.sections.forEach(sec => {
    if (sec.items.length === 0) {
      rows.push({ label: sec.section, section: sec.section, isHeader: false, price: 0, qty: 1 });
    } else {
      rows.push({ label: sec.section, section: sec.section, isHeader: true });
      sec.items.forEach(item => rows.push({ label: item, section: sec.section, isHeader: false, price: 0, qty: 1 }));
    }
  });
  return rows;
}

export const ORG_STRUCTURE = {
  "Merchandising": [
    { title: "Manager", name: "Arasinth Raja", bullets: ["PO receiving", "Fabric plan app", "CMT plan app", "Pre budget plan app", "Bulk file app", "Process app", "VAP app", "Monitoring"] },
    { title: "Senior", name: "Suresh", bullets: ["Fabric planning & app — projection & bulk", "CMT planning & app", "Acc planning & app", "Pre budget plan", "Lab dips app", "Trims app", "Buyer app — lab dips, trims, strike off, samples", "Monthly budget plan"] },
    { title: "PPS & TOP", name: "Logesh", bullets: ["PP Sample", "TOP Sample", "Testing"] },
    { title: "Pro. Merch", name: "Gokul & Saravanan", bullets: ["Style file prep & app", "Consumption details", "Foam CAD", "PP meeting", "Size set & shrinkage closure", "Packing app", "QIMA", "Follow up"] },
    { title: "VAP Merch", name: "Srinivasan", bullets: ["Rate closure", "Grading app", "Bills closure", "Follow up — VAP"] },
  ],
  "Program": [
    { title: "Senior", name: "Vidhya", bullets: ["PO receiving", "Qty app", "Fabric plan app", "Acknowledgement tracking", "Merch approval"] },
    { title: "Assistant 1", name: "Selvi", bullets: ["Work order sheet", "Fabric planning & app — requirement"] },
    { title: "Assistant 2", name: "Arachana", bullets: ["Internal order entry", "Enquiry entry"] },
    { title: "Junior 1", name: "Geetha" },
    { title: "Junior 2", name: "Sandhya", bullets: ["Fabric program"] },
  ],
  "Planning": [
    { title: "Senior", name: "Krishnan", bullets: ["Fabric plan", "Fabric receiving", "Cut plan", "PPM"] },
    { title: "Samples", name: "Nivedhini", bullets: ["PPS", "TOP", "Testing", "File status"] },
    { title: "Cut Plan", name: "Ramya" },
    { title: "Line Plan", name: "Thangaraj", bullets: ["Line plan", "Shipment plan", "T&A", "Ready for feeding"] },
    { title: "Production O/P", name: "—", bullets: ["Fabric program"] },
  ],
  "Purchase – Fabric": [
    { title: "Senior", name: "Selva Kumar", bullets: ["Fabric req plan", "Supplier rate closure", "Lab dips acq", "Lab dips merch app"] },
    { title: "Assistant", name: "Raja Sekar", bullets: ["Lab dips acq", "Merch app", "Supplier communication"] },
    { title: "Junior", name: "Thiru" },
    { title: "Junior", name: "—" },
    { title: "Data Entry", name: "—", bullets: ["PO raising", "ERP entries"] },
    { title: "Senior (Yarn)", name: "Tamil", bullets: ["Yarn req plan", "Supplier rate closure", "Yarn acq", "Send to knitting"] },
  ],
  "Purchase – Trims": [
    { title: "Senior", name: "Shankar", bullets: ["Cross check BOM", "Trims & accessories plan", "Rate closure", "Merch app", "PO raise — pre budget app", "Follow up"] },
    { title: "Assistant", name: "Renuka" },
    { title: "Junior", name: "—" },
    { title: "Junior", name: "—" },
    { title: "Data Entry", name: "—", bullets: ["PO raising", "ERP entries"] },
  ],
  "Warehouse": [
    { title: "Senior", name: "Shiva Kumar", bullets: ["Fabric inhouse", "Inspection", "CSV check", "Lot card & cutting app", "Merch req app", "Delivery"] },
    { title: "Assistant", name: "Surekha", bullets: ["Fabric GRN & location", "ERP entries"] },
  ],
  "Testing": [
    { title: "Senior", name: "—", bullets: ["Fabric inspection", "Fabric testing", "CSV check", "Shrinkage", "Lot card prep & app — DGM", "Merch app"] },
    { title: "Assistant", name: "—" },
  ],
  "Store": [
    { title: "Manager", name: "—" },
    { title: "Assistant", name: "—" },
    { title: "Quality Check", name: "—" },
    { title: "Data Entry 2", name: "—" },
  ],
  "Cutting": [
    { title: "Manager", name: "Durai" },
    { title: "Assistant", name: "—" },
    { title: "Assistant", name: "Chandhini" },
    { title: "Data Entry", name: "Mahesh" },
  ],
  "Production": [
    { title: "FM", name: "Praveen Kumar", bullets: ["Line plan from planning", "File & complete kit", "Quality discussion on critical points"] },
    { title: "PM", name: "Shiva Kumar", bullets: ["Cut qty acc", "OB chart from IE / line plan", "Comments from quality", "First op app"] },
    { title: "Supervisor", name: "—", bullets: ["Line qty op", "OCR details", "Manpower handling"] },
    { title: "IE", name: "Sekar" },
    { title: "Assistant (IE)", name: "Marutha Muthu" },
    { title: "Junior 1", name: "Pasumathi" },
    { title: "Junior 2", name: "Haritha" },
    { title: "OCR", name: "Dinesh", bullets: ["Process styles handling — supplier / in-house / sewing / finishing", "Balance qty — OCR report", "Follow up — size set"] },
  ],
  "IoT": [
    { title: "IoT", name: "Aravind" },
    { title: "Junior 1", name: "—" },
    { title: "Junior 2", name: "—" },
  ],
  "Finishing": [
    { title: "Finishing Incharge", name: "Gopal", bullets: ["Order qty complete", "Packing app from merch", "Ironing & packing", "Packing list", "Box auditing", "Inspection", "Dispatch"] },
    { title: "Ironing", name: "—" },
    { title: "Packing", name: "—" },
    { title: "Inspection", name: "—" },
    { title: "Data Entry", name: "—" },
  ],
  "Quality": [
    { title: "DGM", name: "Sezhiyan" },
    { title: "Assistant — Sample", name: "Kamalkannan", bullets: ["Tech pack — meeting", "Pattern — measurement check — fit check — app", "Artwork app", "Technical — sewing", "Final quality app"] },
    { title: "Manager — Bulk", name: "Prakash", bullets: ["PPM", "Size set & shrinkage", "Cutting app", "First O/P — line setting — mechanism", "First checking", "Auditing", "Ironing"] },
    { title: "Assistant — Bulk", name: "Soundar Raj" },
    { title: "Quality Controller", name: "—" },
  ],
  "Sample": [
    { title: "DGM", name: "Raza" },
    { title: "Manager", name: "Viswa", bullets: ["Tech pack — meeting", "Pattern — measurement check — fit check — app", "Artwork app", "Technical — sewing", "Final quality app"] },
    { title: "Costing", name: "Subha Devi" },
    { title: "Senior", name: "Abdur" },
    { title: "Junior", name: "Cahaya Dewi" },
  ],
  "CAD": [
    { title: "Pattern", name: "Ramesh" },
    { title: "Marker", name: "Suresh" },
  ],
  "Logistics & Documentation": [
    { title: "Senior", name: "Srinivasan" },
    { title: "Assistant", name: "Raghu" },
    { title: "Assistant", name: "Prakash" },
    { title: "Junior", name: "—" },
  ],
  "VAP": [
    { title: "VAP Merch", name: "Srinivasan", bullets: ["Rate closure", "Grading app", "Bills closure", "Follow up — VAP"] },
  ],
  "Compliance & Certification": [
    { title: "Compliance Officer", name: "—", bullets: ["Apply for and renew Transaction Certificates (TC) per shipment", "Apply for and maintain GOTS certification", "Apply for and maintain OCS certification", "Social compliance audits (BSCI, WRAP, SEDEX)", "Chemical management (ZDHC) and sustainability documentation"] },
  ],
};

export const DEFAULT_DEPT_DESCRIPTIONS = {
  "Merchandising": "Owns T&A steps: Order Confirmation & Enquiry, Tech Pack Received, Fit Approval, Size Set Approval, PP Approval. Responsible for buyer communications, approvals, and order tracking.",
  "Program": "Manages work orders, internal order entry, program sheets, fabric programming, and merchandiser approvals.",
  "Planning": "Responsible for line planning, capacity planning, cut plan, shipment planning, and PPM coordination.",
  "Purchase – Fabric": "Owns T&A step: Fabric Booking. Responsible for fabric requirement planning, yarn planning, supplier rate closure, and lab dips acquisition.",
  "Purchase – Trims": "Owns T&A step: Trim Booking. Responsible for BOM verification, trims & accessories planning, supplier rate closure, and PO generation.",
  "Warehouse": "Responsible for fabric in-house receipt, inspection, CSV checking, lot cards, and stock delivery.",
  "Testing": "Responsible for fabric testing, shrinkage checks, CSV verification, and test report approvals.",
  "Store": "Owns T&A step: Fabric In-House. Responsible for raw material storage, inventory tracking, and material issuance.",
  "Cutting": "Owns T&A step: Cutting. Responsible for fabric cutting, pattern execution, markers, and cut bundle generation.",
  "Production": "Owns T&A steps: PP Sample, Feeding, Sewing. Responsible for line execution, OB chart implementation, sewing quality, and daily output.",
  "IoT": "Responsible for smart factory IoT sensors, real-time machine monitoring, and production tracking devices.",
  "Finishing": "Owns T&A steps: Finishing, Packing. Responsible for thread trimming, ironing, packing list generation, box auditing, and dispatch readiness.",
  "Quality": "Owns T&A steps: Fabric Inspection, Final Inspection. Responsible for tech pack adherence, sample inspection, inline QC, bulk auditing, and final quality sign-off.",
  "Sample": "Owns T&A steps: Fit Sample, Size Set Sample. Responsible for prototype development, fit sample creation, pattern verification, and sample submissions.",
  "CAD": "Responsible for digital pattern making, grading, marker making, and fabric consumption optimization.",
  "Logistics & Documentation": "Owns T&A steps: Shipment Documentation, Goods Ready / Shipment. Responsible for export documentation, customs clearance, shipping line coordination, and dispatch.",
  "VAP": "Owns T&A step: Printing / Embroidery. Responsible for value-added processes including printing, embroidery, dyeing, washing, and embellishment closure.",
  "Compliance & Certification": "Responsible for factory social compliance, buyer audits (BSCI, SMETA), certifications (GOTS, OCS, TC, OEKO-TEX), and sustainability standards.",
};

export const DEPT_ICONS = {
  "Merchandising": Users, "Program": ClipboardList, "Planning": Calendar, "Purchase – Fabric": Package,
  "Purchase – Trims": Package, "Warehouse": Warehouse, "Testing": ShieldCheck, "Store": Warehouse,
  "Cutting": Scissors, "Production": Factory, "IoT": Radio, "Finishing": Shirt, "Quality": ShieldCheck,
  "Sample": Layers, "CAD": Palette, "Logistics & Documentation": Truck, "VAP": Palette,
  "Compliance & Certification": ShieldCheck,
};

export const DOC_TABS_CONFIG = {
  "Files": ["Techpacks", "Operational Breakdown (OB)", "Points of measure", "Pattern Files", "CAD markers", "Stage Uploaded Files"],
  "Order Sheet": ["Order Sheet"],
  "BOMs & POs": ["Fabric BOM", "Trims BOM", "Fabric PO", "Trims PO"],
  "Costing": ["Costing Sheet"],
  "RM Delivery": ["GRN / Delivery Challan", "Fabric Inspection Report"],
  "Sampling": ["Fit Sample Proof", "PP Sample Proof", "Size Set Proof", "TOP Sample Proof", "Testing Sample Proof"],
  "Pre-Production": [],
  "Compliance & Certs": [],
  "Production": ["Cutting Report", "Sewing Output Report"],
  "Inspection": ["Inline Inspection Report", "Final Inspection Report"],
  "Final OCR": ["OCR Report", "Dispatch Proof"],
};
export const DOC_TAB_NAMES = Object.keys(DOC_TABS_CONFIG);
export const DOC_TAB_ICONS = {
  "Files": FileText, "Order Sheet": ClipboardList, "BOMs & POs": Package, "Costing": TrendingUp,
  "RM Delivery": Truck, "Sampling": Layers, "Pre-Production": ClipboardCheck, "Compliance & Certs": ShieldCheck, "Production": Factory, "Inspection": ShieldCheck, "Final OCR": CheckCircle2,
};
export const CUSTOMIZABLE_TABS = new Set(["BOMs & POs", "RM Delivery", "Sampling", "Files"]);
export const STAGE_CHAT_TABS = ["RM Delivery", "Sampling", "Inspection", "Final OCR"];

export const TAB_ALLOWED_DEPTS = {
  "Files": ["Merchandising", "Sample", "CAD"],
  "BOMs & POs": ["Purchase – Fabric", "Purchase – Trims"],
  "Costing": ["Merchandising", "Finance"],
  "RM Delivery": ["Purchase – Fabric", "Purchase – Trims", "Warehouse", "Store"],
  "Sampling": ["Sample"],
  "Pre-Production": ["Merchandising", "Production Planning"],
  "Compliance & Certs": ["Compliance & Certification", "Merchandising", "Quality"],
  "Production": ["Cutting", "Production", "VAP"],
  "Inspection": ["Quality"],
  "Final OCR": ["Logistics & Documentation", "Production"],
};

export const PRE_PROD_DOC_TYPES = [
  { key: "techPack", label: "Tech Pack", fields: [{ key: "styleNo", label: "Style No." }, { key: "revisionNo", label: "Revision No." }, { key: "constructionNotes", label: "Key construction notes" }] },
  { key: "poSheet", label: "PO Sheet", fields: [{ key: "poNumber", label: "PO Number" }, { key: "poQty", label: "PO Qty", type: "number" }, { key: "poDate", label: "PO Date" }] },
  { key: "programSheet", label: "Program Sheet", fields: [{ key: "cuttingStart", label: "Cutting start date" }, { key: "targetShipWeek", label: "Target ship week" }] },
  { key: "cmtPlanning", label: "CMT Planning", fields: [{ key: "cmtRate", label: "CMT rate / pc ($)", type: "number" }, { key: "targetEfficiency", label: "Target efficiency (%)", type: "number" }, { key: "lineAllocated", label: "Line allocated" }] },
  { key: "accPlanning", label: "ACC Planning", fields: [{ key: "accessoriesList", label: "Key accessories" }, { key: "leadTimeDays", label: "Lead time (days)", type: "number" }] },
  { key: "grading", label: "Grading", fields: [{ key: "gradedSizes", label: "Graded size range" }, { key: "gradeRuleRef", label: "Grade rule reference" }] },
];

export function initPreProd() {
  const obj = {};
  PRE_PROD_DOC_TYPES.forEach(d => { obj[d.key] = { values: {}, status: "draft", approvedBy: null, approvedAt: null }; });
  return obj;
}

export function allPreProdApproved(order) {
  if (!order || !order.preProd) return false;
  return PRE_PROD_DOC_TYPES.every(d => order.preProd[d.key] && order.preProd[d.key].status === "approved");
}

export const HIGHLIGHT_DEPT_OPTIONS = Object.keys(ORG_STRUCTURE);

export function getAllPeopleNames() {
  const names = new Set();
  Object.values(ORG_STRUCTURE).forEach(roles => roles.forEach(r => {
    if (r.name && r.name !== "—") {
      r.name.split(/&|,/).forEach(n => names.add(n.trim()));
    }
  }));
  return Array.from(names).sort();
}
export const ALL_PEOPLE = getAllPeopleNames();

export function firstNamedAssignee(dept) {
  const roles = ORG_STRUCTURE[dept] || [];
  const found = roles.find(r => r.name && r.name !== "—");
  return found ? `${found.name} (${found.title})` : "Unassigned";
}

export function makeStages(template, activeUpto = 0, delayedAt = null) {
  const list = TA_TEMPLATES[template] || TA_STAGES_90;
  return list.map((s, i) => {
    let completedAt = null;
    let updatedAt = null;
    let flaggedAt = null;

    if (i < activeUpto) {
      completedAt = i === activeUpto - 1 ? "2026-05-12T14:30:00.000Z" : "2026-05-10T12:00:00.000Z";
    } else if (i === activeUpto) {
      updatedAt = "2026-05-12T09:00:00.000Z";
      if (delayedAt === i) {
        flaggedAt = "2026-05-12T11:45:00.000Z";
      }
    }

    return {
      name: s.name,
      dept: s.dept,
      status: i < activeUpto ? "done" : i === activeUpto ? "in_progress" : "pending",
      assignee: firstNamedAssignee(s.dept),
      reason: delayedAt === i ? REASONS[0] : null,
      planned: s.day,
      supplier: s.dept === "VAP" ? VAP_SUPPLIERS[0] : undefined,
      completedAt,
      completedOn: completedAt ? new Date(completedAt).toLocaleDateString() : null,
      updatedAt,
      flaggedAt
    };
  });
}

export const ROLE_OPTIONS = [
  { label: "Merchandiser (Arasinth Raja)", dept: "Merchandising", fullAccess: true },
  { label: "Fabric purchase (Selva Kumar)", dept: "Purchase – Fabric", fullAccess: false },
  { label: "Trims purchase (Shankar)", dept: "Purchase – Trims", fullAccess: false },
  { label: "Sample (Viswa)", dept: "Sample", fullAccess: true },
  { label: "Quality (Sezhiyan)", dept: "Quality", fullAccess: true },
  { label: "Cutting (Durai)", dept: "Cutting", fullAccess: true },
  { label: "Production (Praveen Kumar)", dept: "Production", fullAccess: true },
  { label: "Finishing (Gopal)", dept: "Finishing", fullAccess: true },
  { label: "Logistics & documentation (Srinivasan)", dept: "Logistics & Documentation", fullAccess: false },
  { label: "Compliance officer", dept: "Compliance & Certification", fullAccess: false },
  { label: "Finance Team", dept: "Finance", fullAccess: false },
  { label: "Managing Director (MD)", dept: "Executive", fullAccess: true },
];

export function buildStaffList() {
  const staff = [];
  const seen = new Set();
  Object.entries(ORG_STRUCTURE).forEach(([dept, roles]) => {
    roles.forEach(r => {
      if (!r.name || r.name === "—") return;
      r.name.split(/&|,/).map(n => n.trim()).forEach(name => {
        if (seen.has(name)) return;
        seen.add(name);
        staff.push({ name, title: r.title, dept });
      });
    });
  });
  return staff;
}
export const STAFF_LIST = buildStaffList();

export function seedAttendance() {
  const rec = {};
  STAFF_LIST.forEach((s, i) => { rec[s.name] = i % 11 === 0 ? "absent" : i % 13 === 0 ? "leave" : "present"; });
  return rec;
}

export const INITIAL_LEAVE_REQUESTS = [
  { id: 1, name: STAFF_LIST[2] ? STAFF_LIST[2].name : "Staff", dept: STAFF_LIST[2] ? STAFF_LIST[2].dept : "", from: "26 May", to: "27 May", reason: "Personal", status: "pending" },
  { id: 2, name: STAFF_LIST[8] ? STAFF_LIST[8].name : "Staff", dept: STAFF_LIST[8] ? STAFF_LIST[8].dept : "", from: "29 May", to: "31 May", reason: "Family function", status: "pending" },
  { id: 3, name: STAFF_LIST[15] ? STAFF_LIST[15].name : "Staff", dept: STAFF_LIST[15] ? STAFF_LIST[15].dept : "", from: "20 May", to: "20 May", reason: "Medical", status: "approved" },
];

export const ATTENDANCE_STATUS_STYLE = {
  present: { bg: "#E1F5EE", fg: "#085041", label: "Present" },
  absent: { bg: "#FCEBEB", fg: "#791F1F", label: "Absent" },
  leave: { bg: "#FAEEDA", fg: "#633806", label: "On leave" },
};

export const CERT_STATUS_STYLE = {
  Draft: { bg: "#F0F0F2", fg: "#565A66", label: "Draft" },
  Applied: { bg: "#FAEEDA", fg: "#633806", label: "Applied" },
  "Under Review": { bg: "#EAF2FC", fg: "#1D4ED8", label: "Under Review" },
  Approved: { bg: "#E1F5EE", fg: "#085041", label: "Approved" },
  Rejected: { bg: "#FCEBEB", fg: "#791F1F", label: "Rejected" },
  Expired: { bg: "#FEE2E2", fg: "#991B1B", label: "Expired" },
  // Backward compatibility keys
  not_applied: { bg: "#F0F0F2", fg: "#565A66", label: "Not applied" },
  applied: { bg: "#FAEEDA", fg: "#633806", label: "Applied" },
  approved: { bg: "#E1F5EE", fg: "#085041", label: "Approved" },
};

export const COMPLIANCE_STATUS_STYLE = {
  Pending: { bg: "#F0F0F2", fg: "#565A66", label: "Pending" },
  "In Progress": { bg: "#FAEEDA", fg: "#633806", label: "In Progress" },
  Passed: { bg: "#E1F5EE", fg: "#085041", label: "Passed" },
  Failed: { bg: "#FCEBEB", fg: "#791F1F", label: "Failed" },
  Waived: { bg: "#F3E8FF", fg: "#6B21A8", label: "Waived" },
};

export const COMPLIANCE_PRIORITY_STYLE = {
  Low: { bg: "#F0FDF4", fg: "#166534" },
  Medium: { bg: "#FFFBEB", fg: "#92400E" },
  High: { bg: "#FEF2F2", fg: "#991B1B" },
  Critical: { bg: "#7F1D1D", fg: "#FFFFFF" },
};

export const CERT_NAME_OPTIONS = [
  "GOTS",
  "OCS",
  "OEKO-TEX",
  "BCI",
  "ISO",
  "Transaction Certificate (TC)",
  "GRS (Global Recycled Standard)",
  "RCS (Recycled Claim Standard)",
  "FSC",
  "SEDEX / SMETA",
  "WRAP",
  "HIGG FEM / FSLM",
];

export const BUYER_LIST = [
  "All Buyers",
  "Zara",
  "H&M",
  "Uniqlo",
  "M&S",
  "Next",
];

export const COMPLIANCE_CATEGORIES = [
  "Buyer Requirement",
  "Factory Compliance",
  "Social Compliance",
  "Environmental",
  "Quality",
  "Documentation",
  "Shipment",
  "Certification",
];

export const INITIAL_CERTIFICATIONS = [
  {
    id: "tc",
    key: "tc",
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
    note: "Per-shipment chain of custody certificate for organic cotton hoodie batch.",
    notes: "Per-shipment chain of custody certificate for organic cotton hoodie batch.",
    isDeleted: false
  },
  {
    id: "gots",
    key: "gots",
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
    note: "Global Organic Textile Standard — annual facility certification",
    notes: "Annual facility scope certificate for organic spinning and garmenting.",
    isDeleted: false
  },
  {
    id: "ocs",
    key: "ocs",
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
    note: "Organic Content Standard — annual facility certification",
    notes: "Organic content certification renewal in progress.",
    isDeleted: false
  },
  {
    id: "oeko-tex-100",
    key: "oeko-tex-100",
    name: "OEKO-TEX",
    certNo: "OEKO-2026-7890",
    certType: "Chemical & Safety",
    issuingOrg: "Hohenstein Institute",
    buyer: "Zara",
    orderId: "PL-3321",
    issueDate: "2025-06-01",
    expiryDate: "2026-06-01",
    status: "Expired",
    file: "OEKO_TEX_Standard_100_Cert.pdf",
    note: "OEKO-TEX Standard 100 Class I testing for direct skin contact",
    notes: "Class I testing for direct skin contact garments.",
    isDeleted: false
  },
  {
    id: "bci-cert",
    key: "bci-cert",
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
    note: "Better Cotton Initiative mass balance credits allocated",
    notes: "Mass balance chain of custody credits allocated.",
    isDeleted: false
  }
];

export const INITIAL_COMPLIANCES = [
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
    linkedCert: "OEKO-TEX",
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
];

export const INITIAL_FINANCIALS = {
  revenue: 4415000,
  cogs: 3610000,
  ebitda: 2137000,
  stockValue: 2548000,
  cashFlow: 1236000,
  complianceScore: 96,
};

export const SEASON_OPTIONS = ["AW26", "SS26", "AW27", "SS27"];

export const INITIAL_DEBIT_NOTES = [
  { id: 1, season: "AW26", buyer: "H&M", po: "ST-7788", amount: 4200, reason: "Late shipment penalty", date: "2 Jun" },
  { id: 2, season: "AW26", buyer: "Zara", po: "GKT-1054", amount: 1800, reason: "Quality claim — stitching defect", date: "5 Jun" },
];

export const INITIAL_CAPAS = [
  { id: 1, season: "AW26", buyer: "H&M", po: "ST-7788", issue: "PP approval delay caused late cutting start", action: "Escalate PP samples to buyer within 24 hrs of readiness; weekly follow-up call", status: "in_progress", date: "3 Jun" },
  { id: 2, season: "AW26", buyer: "Uniqlo", po: "JKT-2231", issue: "Trims shortage delayed cutting", action: "Add a 2-week buffer to trims booking for new suppliers", status: "open", date: "6 Jun" },
  { id: 3, season: "SS26", buyer: "M&S", po: "TR-8899", issue: "Minor rework on button attachment", action: "Retrain sewing line on button placement SOP", status: "closed", date: "20 May" },
];

export const CAPA_STATUS_STYLE = {
  open: { bg: "#FCEBEB", fg: "#791F1F", label: "Open" },
  in_progress: { bg: "#FAEEDA", fg: "#633806", label: "In progress" },
  closed: { bg: "#E1F5EE", fg: "#085041", label: "Closed" },
};

export const RISK_DELAY_DAYS = { high: 3, medium: 2, low: 1 };

export const INITIAL_ORDERS = [
  { id: "GKT-1054", buyer: "Zara", country: "Spain", season: "AW26", style: "Hoodie", qty: 12500, ship: "20 May", risk: "high", status: "At Risk", activeUpto: 10, delayedAt: 10, createdAt: "2026-05-12T08:30:00.000Z" },
  { id: "ST-7788", buyer: "H&M", country: "Sweden", season: "AW26", style: "T-Shirt", qty: 8000, ship: "18 May", risk: "high", status: "Delayed", activeUpto: 5, delayedAt: 5, createdAt: "2026-05-10T09:15:00.000Z" },
  { id: "JKT-2231", buyer: "Uniqlo", country: "Japan", season: "AW26", style: "Jacket", qty: 6200, ship: "22 May", risk: "medium", status: "At Risk", activeUpto: 7, delayedAt: null, createdAt: "2026-05-11T14:00:00.000Z" },
  { id: "TR-8899", buyer: "M&S", country: "United Kingdom", season: "SS26", style: "Trouser", qty: 4500, ship: "25 May", risk: "medium", status: "On Track", activeUpto: 13, delayedAt: null, createdAt: "2026-05-08T10:00:00.000Z" },
  { id: "DR-5566", buyer: "Next", country: "United Kingdom", season: "SS26", style: "Dress", qty: 5300, ship: "23 May", risk: "medium", status: "Delayed", activeUpto: 8, delayedAt: 8, createdAt: "2026-05-09T11:30:00.000Z" },
  { id: "PL-3321", buyer: "Zara", country: "Spain", season: "SS26", style: "Polo", qty: 9100, ship: "28 May", risk: "low", status: "On Track", activeUpto: 15, delayedAt: null, createdAt: "2026-05-06T15:00:00.000Z" },
];

export const NOTIFICATION_PRIORITY_STYLE = {
  critical: { bg: "#FEE2E2", fg: "#991B1B", border: "#F87171", label: "Critical", iconColor: "#DC2626" },
  high: { bg: "#FEF3C7", fg: "#92400E", border: "#FCD34D", label: "High", iconColor: "#D97706" },
  medium: { bg: "#EFF6FF", fg: "#1E40AF", border: "#93C5FD", label: "Medium", iconColor: "#2563EB" },
  low: { bg: "#F3F4F6", fg: "#374151", border: "#E5E7EB", label: "Low", iconColor: "#6B7280" },
};

export const NOTIFICATION_TYPE_CONFIG = {
  order: { label: "Orders", defaultIcon: "Package", color: "#3B82F6", module: "orders" },
  tna: { label: "T&A", defaultIcon: "Calendar", color: "#8B5CF6", module: "orders" },
  task: { label: "My Tasks", defaultIcon: "CheckSquare", color: "#10B981", module: "tasks" },
  approval: { label: "Approvals", defaultIcon: "ClipboardCheck", color: "#F59E0B", module: "approvals" },
  compliance: { label: "Compliance", defaultIcon: "ShieldCheck", color: "#059669", module: "compliance" },
  certification: { label: "Certification", defaultIcon: "Award", color: "#0D9488", module: "compliance" },
};

export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-seed-1",
    eventKey: "order-delayed-ST-7788",
    type: "order",
    title: "Order Delayed",
    message: "Order ST-7788 is delayed due to PP sample approval bottleneck.",
    relatedModule: "orders",
    relatedId: "ST-7788",
    priority: "critical",
    isRead: false,
    createdAt: "2026-05-12T11:45:00.000Z",
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
    createdAt: "2026-05-12T09:10:00.000Z",
    isDeleted: false
  },
  {
    id: "notif-seed-3",
    eventKey: "task-assigned-pp-approval",
    type: "task",
    title: "New Task Assigned",
    message: "A new task 'Review and approve lab dip test report' has been assigned to you.",
    relatedModule: "tasks",
    relatedId: "task-seed-1",
    priority: "medium",
    isRead: false,
    createdAt: "2026-05-12T08:00:00.000Z",
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
    createdAt: "2026-05-11T16:00:00.000Z",
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
    createdAt: "2026-05-10T10:00:00.000Z",
    isDeleted: false
  }
];

export function formatTimeAgo(isoString) {
  if (!isoString) return "Just now";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

