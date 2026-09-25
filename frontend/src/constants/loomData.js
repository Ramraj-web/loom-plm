import {
  FileText, ClipboardList, Package, Layers, CheckCircle2, Warehouse, ShieldCheck,
  Shirt, Scissors, Palette, Factory, Truck, Users, Calendar, Radio, TrendingUp, ClipboardCheck, Zap
} from "lucide-react";

export const SHIPMENT_PERFORMANCE = [
  { month: "Dec", onTime: 74, target: 75 },
  { month: "Jan", onTime: 78, target: 75 },
  { month: "Feb", onTime: 73, target: 75 },
  { month: "Mar", onTime: 80, target: 75 },
  { month: "Apr", onTime: 77, target: 75 },
  { month: "May", onTime: 82.3, target: 75 },
];

/**
 * Robust date parser supporting "2026-11-21", "21 Nov 2026", "DEC 30", "25 May", etc.
 */
export function parseShipDateSafe(raw, fallbackYear = 2026) {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  const str = String(raw).trim();
  if (!str) return null;

  // 1. Try native parse
  let d = new Date(str);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    // If date string omitted year, browser might assign 2001 or current system year
    if (y >= 2020 && y <= 2035) return d;
  }

  // 2. Try appending fallback year if year is missing or anomalous
  const has4DigitYear = /\b(20\d{2})\b/.test(str);
  if (!has4DigitYear) {
    d = new Date(`${str} ${fallbackYear}`);
    if (!isNaN(d.getTime())) return d;
  }

  return !isNaN(d.getTime()) ? d : null;
}

/**
 * Dynamically computes an order's risk level based on:
 * - Target ship date vs current date (overdue or approaching deadline)
 * - Order status (Delayed / At Risk / On Track)
 * - Flagged delay reasons and stage statuses
 */
export function computeDynamicOrderRisk(order) {
  if (!order) return "low";
  const now = new Date();
  const rawShip = order.shipDate || order.ship;
  const shipD = parseShipDateSafe(rawShip);

  let daysLeft = null;
  if (shipD) {
    daysLeft = Math.round((shipD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const stages = Array.isArray(order.stages) ? order.stages : [];
  const hasDelayFlag = stages.some(s => Boolean(s && typeof s.reason === "string" && s.reason.trim() !== "" && s.reason !== "No delay flagged"));
  const hasDelayedStage = stages.some(s => s && (s.status === "delayed" || (s.reason && (s.status === "in_progress" || s.status === "pending"))));

  // 1. High Risk:
  // - Order explicitly marked Delayed
  // - Ship date has already passed and order is not done (overdue)
  // - Critical delay flagged while status is At Risk
  // - Target ship date is within 7 days and order has incomplete critical stages
  if (order.status === "Delayed") return "high";
  if (daysLeft !== null && daysLeft < 0) return "high";
  if (hasDelayFlag && order.status === "At Risk") return "high";
  if (daysLeft !== null && daysLeft <= 7 && (hasDelayFlag || order.status === "At Risk")) return "high";

  // 2. Medium Risk:
  // - Status is At Risk
  // - Delay flag present
  // - Approaching ship deadline within 21 days
  if (order.status === "At Risk" || hasDelayFlag || hasDelayedStage) return "medium";
  if (daysLeft !== null && daysLeft <= 21) return "medium";

  // 3. Check existing risk or fallback to low
  if (order.risk === "high" || order.risk === "medium" || order.risk === "low") {
    return order.risk;
  }
  return "low";
}

/**
 * Dynamically computes 6-month shipment performance trend from active orders.
 * Evaluates orders by delivery date, completion date, and stage gate status.
 */
export function computeMonthlyShipmentPerformance(orders = [], options = {}) {
  const targetPct = options.target || 75;
  const activeOrders = (orders || []).filter(o => !o.isDeleted);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 - 11

  // 1. Find latest relevant date among active orders
  let latestDate = new Date(currentYear, currentMonth, 1);
  activeOrders.forEach(o => {
    const raw = o.shipDate || (o.completed && o.completedAt ? o.completedAt : null) || o.ship;
    const d = parseShipDateSafe(raw, currentYear);
    if (d && d.getTime() > latestDate.getTime()) {
      latestDate = d;
    }
  });

  let endYear = latestDate.getFullYear();
  let endMonth = latestDate.getMonth();

  // Cap window from pushing more than 3 months into the future
  const maxAllowedEnd = new Date(currentYear, currentMonth + 3, 1);
  if (new Date(endYear, endMonth, 1) > maxAllowedEnd) {
    endYear = maxAllowedEnd.getFullYear();
    endMonth = maxAllowedEnd.getMonth();
  }

  // Ensure end month is at least current month
  if (new Date(endYear, endMonth, 1) < new Date(currentYear, currentMonth, 1)) {
    endYear = currentYear;
    endMonth = currentMonth;
  }

  // Generate 6 consecutive calendar months
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const windowMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(endYear, endMonth - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    windowMonths.push({
      year: y,
      monthIdx: m,
      monthKey: `${y}-${String(m + 1).padStart(2, "0")}`,
      month: MONTH_NAMES[m],
      fullLabel: `${MONTH_NAMES[m]} ${y}`,
      start: new Date(y, m, 1).getTime(),
      end: new Date(y, m + 1, 0, 23, 59, 59, 999).getTime()
    });
  }

  // Criteria to check if an order is On-Time
  const isOrderOnTime = (order) => {
    if (order.status === "Delayed") return false;
    if (computeDynamicOrderRisk(order) === "high") return false;
    const stages = order.stages || [];
    const hasDelay = stages.some(s => s && (s.reason || s.status === "delayed" || s.disputed));
    if (hasDelay) return false;
    if (order.completed && order.completedAt && (order.shipDate || order.ship)) {
      const c = new Date(order.completedAt).getTime();
      const s = parseShipDateSafe(order.shipDate || order.ship, currentYear)?.getTime();
      if (!isNaN(c) && s && c > s + 86400000) return false;
    }
    return true;
  };

  const getOrderDates = (order) => {
    let start = null;
    let end = null;
    if (order.orderDate) start = parseShipDateSafe(order.orderDate, currentYear);
    else if (order.createdAt) start = parseShipDateSafe(order.createdAt, currentYear);

    if (order.shipDate || order.ship) {
      end = parseShipDateSafe(order.shipDate || order.ship, currentYear);
    } else if (order.completed && order.completedAt) {
      end = parseShipDateSafe(order.completedAt, currentYear);
    }

    if (!start && end) start = new Date(end.getTime() - 90 * 86400000);
    if (!end && start) end = new Date(start.getTime() + 90 * 86400000);
    if (!start && !end) {
      start = new Date();
      end = new Date(Date.now() + 90 * 86400000);
    }
    return {
      startTime: start.getTime(),
      endTime: end.getTime(),
      shipTime: end ? end.getTime() : null
    };
  };

  const result = windowMonths.map(wm => {
    // Collect specific matching orders for transparency
    const matchingOrders = activeOrders.filter(o => {
      const dates = getOrderDates(o);
      const shipInMonth = dates.shipTime !== null && dates.shipTime >= wm.start && dates.shipTime <= wm.end;
      const activeInMonth = dates.startTime <= wm.end && dates.endTime >= wm.start;
      return shipInMonth || activeInMonth;
    });

    const totalOrders = matchingOrders.length;
    const onTimeOrdersList = matchingOrders.filter(isOrderOnTime);
    const onTimeOrders = onTimeOrdersList.length;
    const delayedOrdersList = matchingOrders.filter(o => !isOrderOnTime(o));
    const delayedOrders = totalOrders - onTimeOrders;
    const onTimePct = totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 1000) / 10 : null;

    return {
      month: wm.month,
      fullLabel: wm.fullLabel,
      year: wm.year,
      onTime: onTimePct,
      target: targetPct,
      totalOrders,
      onTimeOrders,
      delayedOrders,
      orderNumbers: matchingOrders.map(o => o.id || o.primaryId).join(", "),
      delayedOrderNumbers: delayedOrdersList.map(o => o.id || o.primaryId).join(", ")
    };
  });

  const startMonth = windowMonths[0];
  const endMonthObj = windowMonths[windowMonths.length - 1];
  const rangeLabel = startMonth.year === endMonthObj.year
    ? `${startMonth.month} – ${endMonthObj.month} ${endMonthObj.year}`
    : `${startMonth.fullLabel} – ${endMonthObj.fullLabel}`;

  result.rangeLabel = rangeLabel;
  return result;
}

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

export const INITIAL_SUPPLIERS = [];

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

export const INITIAL_SUPPLIER_WORK = [];

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

export const INITIAL_CUSTOM_TASKS = [];

export const TA_STAGES_90 = [
  { name: "Order Confirmation & Enquiry", day: "Day 1", dept: "Program" },
  { name: "Yarn/Fabric Booking", day: "Day 1", dept: "Purchase – Fabric" },
  { name: "Work order", day: "Day 2", dept: "Program" },
  { name: "Costing", day: "Day 2-3", dept: "Costing" },
  { name: "CAD release", day: "Day 3", dept: "CAD" },
  { name: "Program Passing", day: "Day 3-5", dept: "Program" },
  { name: "Trims Plan", day: "Day 4-7", dept: "Purchase – Trims" },
  { name: "Lab Dip Approval", day: "Day 5-10", dept: "Merchandising" },
  { name: "Knitting", day: "Day 5-10", dept: "Process" },
  { name: "Artwork Approval", day: "Day 1-20", dept: "Merchandising" },
  { name: "Dyeing", day: "Day 11-25", dept: "Process" },
  { name: "Finishing", day: "Day 26-28", dept: "Finishing" },
  { name: "Sewing Trims IH", day: "Day 15", dept: "Purchase – Trims" },
  { name: "Packing Trims IH", day: "Day 25", dept: "Purchase – Trims" },
  { name: "Fabric IH", day: "Day 25", dept: "Warehouse" },
  { name: "Lot Card Approval", day: "Day 25-30", dept: "Quality" },
  { name: "PP Sample", day: "Day 25-35", dept: "Sample" },
  { name: "PP Meeting", day: "Day 30-33", dept: "Planning" },
  { name: "PP Approval", day: "Day 35-47", dept: "Merchandising" },
  { name: "Shrinkage closure", day: "Day 33-35", dept: "Quality" },
  { name: "Size Set Sample", day: "Day 35-38", dept: "Sample" },
  { name: "Size Set approval", day: "Day 38-40", dept: "Sample" },
  { name: "Cutting", day: "Day 37-42", dept: "Cutting" },
  { name: "Print / Emb / Outsource", day: "Day 42-44", dept: "Cutting" },
  { name: "Print / Emb / IH", day: "Day 45-60", dept: "Merchandising" },
  { name: "TOP Sample Sent", day: "Day 50-55", dept: "Sample" },
  { name: "Shipment Booking", day: "Day 65-70", dept: "Logistics & Documentation" },
  { name: "Testing", day: "Day 50-55", dept: "Testing" },
  { name: "TOP Sample Approval", day: "Day 72", dept: "Merchandising" },
  { name: "Reshape & Feeding", day: "Day 60-62", dept: "Production" },
  { name: "Production", day: "Day 63-78", dept: "Production" },
  { name: "CIP Start", day: "Day 78-85", dept: "Quality" },
  { name: "FI", day: "Day 86", dept: "Quality" },
  { name: "Garment OCR", day: "Day 89", dept: "Production" },
  { name: "EX-FTY", day: "Day 90", dept: "Logistics & Documentation" },
];

export const TA_STAGES_120 = [
  { name: "Order Confirmation & Enquiry", day: "Day 1", dept: "Program" },
  { name: "Yarn/Fabric Booking", day: "Day 3", dept: "Purchase – Fabric" },
  { name: "Work Order", day: "Day 3", dept: "Program" },
  { name: "Costing", day: "Day 3-7", dept: "Costing" },
  { name: "CAD Release", day: "Day 4", dept: "CAD" },
  { name: "Program Passing", day: "Day 4-7", dept: "Program" },
  { name: "Trims Plan", day: "Day 5-9", dept: "Purchase – Trims" },
  { name: "Lab Dip Approval", day: "Day 7-13", dept: "Merchandising" },
  { name: "Knitting", day: "Day 7-13", dept: "Purchase" },
  { name: "Artwork Approval", day: "Day 1-27", dept: "Merchandising" },
  { name: "Dyeing", day: "Day 15-33", dept: "Purchase" },
  { name: "Finishing", day: "Day 34-36", dept: "Finishing" },
  { name: "Sewing Trims IH", day: "Day 20", dept: "Purchase – Trims" },
  { name: "Packing Trims IH", day: "Day 33", dept: "Purchase – Trims" },
  { name: "Fabric IH", day: "Day 33", dept: "Warehouse" },
  { name: "Lot Card Approval", day: "Day 33-40", dept: "Quality" },
  { name: "PP Sample", day: "Day 33-47", dept: "Sample" },
  { name: "PP Meeting", day: "Day 40-44", dept: "Planning" },
  { name: "PP Approval", day: "Day 47-63", dept: "Merchandising" },
  { name: "Shrinkage Closure", day: "Day 44-47", dept: "Quality" },
  { name: "Size Set Sample", day: "Day 47-51", dept: "Sample" },
  { name: "Size Set Approval", day: "Day 51-53", dept: "Sample" },
  { name: "Cutting", day: "Day 49-56", dept: "Cutting" },
  { name: "Print / Emb / Outsource", day: "Day 56-59", dept: "Cutting" },
  { name: "Print / Emb / IH", day: "Day 60-80", dept: "Merchandising" },
  { name: "TOP Sample Sent", day: "Day 67-73", dept: "Sample" },
  { name: "Shipment Booking", day: "Day 87-93", dept: "Logistics & Documentation" },
  { name: "Testing", day: "Day 67-73", dept: "Testing" },
  { name: "TOP Sample Approval", day: "Day 96", dept: "Merchandising" },
  { name: "Reshape & Feeding", day: "Day 80-83", dept: "Production" },
  { name: "Production", day: "Day 84-104", dept: "Production" },
  { name: "CIP Start", day: "Day 104-113", dept: "Quality" },
  { name: "FI", day: "Day 115", dept: "Quality" },
  { name: "Garment OCR", day: "Day 119", dept: "Production" },
  { name: "EX-FTY", day: "Day 120", dept: "Logistics & Documentation" },
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
    { title: "Manager", name: "—", bullets: ["PO receiving", "Fabric plan app", "CMT plan app", "Pre budget plan app", "Bulk file app", "Process app", "VAP app", "Monitoring"] },
    { title: "Senior", name: "—", bullets: ["Fabric planning & app — projection & bulk", "CMT planning & app", "Acc planning & app", "Pre budget plan", "Lab dips app", "Trims app", "Buyer app — lab dips, trims, strike off, samples", "Monthly budget plan"] },
    { title: "PPS & TOP", name: "—", bullets: ["PP Sample", "TOP Sample", "Testing"] },
    { title: "Pro. Merch", name: "—", bullets: ["Style file prep & app", "Consumption details", "Foam CAD", "PP meeting", "Size set & shrinkage closure", "Packing app", "QIMA", "Follow up"] },
    { title: "VAP Merch", name: "—", bullets: ["Rate closure", "Grading app", "Bills closure", "Follow up — VAP"] },
  ],
  "Program": [
    { title: "Senior", name: "—", bullets: ["PO receiving", "Qty app", "Fabric plan app", "Acknowledgement tracking", "Merch approval"] },
    { title: "Assistant 1", name: "—", bullets: ["Work order sheet", "Fabric planning & app — requirement"] },
    { title: "Assistant 2", name: "—", bullets: ["Internal order entry", "Enquiry entry"] },
    { title: "Junior 1", name: "—" },
    { title: "Junior 2", name: "—", bullets: ["Fabric program"] },
  ],
  "Planning": [
    { title: "Senior", name: "—", bullets: ["Fabric plan", "Fabric receiving", "Cut plan", "PPM"] },
    { title: "Samples", name: "—", bullets: ["PPS", "TOP", "Testing", "File status"] },
    { title: "Cut Plan", name: "—" },
    { title: "Line Plan", name: "—", bullets: ["Line plan", "Shipment plan", "T&A", "Ready for feeding"] },
    { title: "Production O/P", name: "—", bullets: ["Fabric program"] },
  ],
  "Purchase – Fabric": [
    { title: "Senior", name: "—", bullets: ["Fabric req plan", "Supplier rate closure", "Lab dips acq", "Lab dips merch app"] },
    { title: "Assistant", name: "—", bullets: ["Lab dips acq", "Merch app", "Supplier communication"] },
    { title: "Junior", name: "—" },
    { title: "Junior", name: "—" },
    { title: "Data Entry", name: "—", bullets: ["PO raising", "ERP entries"] },
    { title: "Senior (Yarn)", name: "—", bullets: ["Yarn req plan", "Supplier rate closure", "Yarn acq", "Send to knitting"] },
  ],
  "Purchase – Trims": [
    { title: "Senior", name: "—", bullets: ["Cross check BOM", "Trims & accessories plan", "Rate closure", "Merch app", "PO raise — pre budget app", "Follow up"] },
    { title: "Assistant", name: "—" },
    { title: "Junior", name: "—" },
    { title: "Junior", name: "—" },
    { title: "Data Entry", name: "—", bullets: ["PO raising", "ERP entries"] },
  ],
  "Warehouse": [
    { title: "Senior", name: "—", bullets: ["Fabric inhouse", "Inspection", "CSV check", "Lot card & cutting app", "Merch req app", "Delivery"] },
    { title: "Assistant", name: "—", bullets: ["Fabric GRN & location", "ERP entries"] },
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
    { title: "Manager", name: "—" },
    { title: "Assistant", name: "—" },
    { title: "Assistant", name: "—" },
    { title: "Data Entry", name: "—" },
  ],
  "Production": [
    { title: "FM", name: "—", bullets: ["Line plan from planning", "File & complete kit", "Quality discussion on critical points"] },
    { title: "PM", name: "—", bullets: ["Cut qty acc", "OB chart from IE / line plan", "Comments from quality", "First op app"] },
    { title: "Supervisor", name: "—", bullets: ["Line qty op", "OCR details", "Manpower handling"] },
    { title: "IE", name: "—" },
    { title: "Assistant (IE)", name: "—" },
    { title: "Junior 1", name: "—" },
    { title: "Junior 2", name: "—" },
    { title: "OCR", name: "—", bullets: ["Process styles handling — supplier / in-house / sewing / finishing", "Balance qty — OCR report", "Follow up — size set"] },
  ],
  "IoT": [
    { title: "IoT", name: "—" },
    { title: "Junior 1", name: "—" },
    { title: "Junior 2", name: "—" },
  ],
  "Finishing": [
    { title: "Finishing Incharge", name: "—", bullets: ["Order qty complete", "Packing app from merch", "Ironing & packing", "Packing list", "Box auditing", "Inspection", "Dispatch"] },
    { title: "Ironing", name: "—" },
    { title: "Packing", name: "—" },
    { title: "Inspection", name: "—" },
    { title: "Data Entry", name: "—" },
  ],
  "Quality": [
    { title: "DGM", name: "—" },
    { title: "Assistant — Sample", name: "—", bullets: ["Tech pack — meeting", "Pattern — measurement check — fit check — app", "Artwork app", "Technical — sewing", "Final quality app"] },
    { title: "Manager — Bulk", name: "—", bullets: ["PPM", "Size set & shrinkage", "Cutting app", "First O/P — line setting — mechanism", "First checking", "Auditing", "Ironing"] },
    { title: "Assistant — Bulk", name: "—" },
    { title: "Quality Controller", name: "—" },
  ],
  "Sample": [
    { title: "DGM", name: "—" },
    { title: "Manager", name: "—", bullets: ["Tech pack — meeting", "Pattern — measurement check — fit check — app", "Artwork app", "Technical — sewing", "Final quality app"] },
    { title: "Costing", name: "—" },
    { title: "Senior", name: "—" },
    { title: "Junior", name: "—" },
  ],
  "CAD": [
    { title: "Pattern", name: "—" },
    { title: "Marker", name: "—" },
  ],
  "Costing": [
    { title: "Costing Senior", name: "—" },
    { title: "Costing Incharge", name: "—" },
  ],
  "Logistics & Documentation": [
    { title: "Senior", name: "—" },
    { title: "Assistant", name: "—" },
    { title: "Assistant", name: "—" },
    { title: "Junior", name: "—" },
  ],
  "VAP": [
    { title: "VAP Merch", name: "—", bullets: ["Rate closure", "Grading app", "Bills closure", "Follow up — VAP"] },
  ],
  "Compliance & Certification": [
    { title: "Compliance Officer", name: "—", bullets: ["Apply for and renew Transaction Certificates (TC) per shipment", "Apply for and maintain GOTS certification", "Apply for and maintain OCS certification", "Social compliance audits (BSCI, WRAP, SEDEX)", "Chemical management (ZDHC) and sustainability documentation"] },
  ],
  "Executive (MD)": [
    { title: "Managing Director", name: "—", bullets: ["Company Strategy & Leadership", "Final Order & Costing Sign-off", "Financial Performance & Margins", "Buyer & Factory Oversight"] },
    { title: "Director / COO", name: "—", bullets: ["Operations Oversight", "Capacity & Line Efficiency", "Inter-Department Governance"] },
  ],
};

export const DEFAULT_DEPT_DESCRIPTIONS = {
  "Executive (MD)": "Executive leadership suite & Managing Director oversight. Real-time factory performance, order health, financials, approvals, and company strategy.",
  "Merchandising": "Owns T&A steps: Order Confirmation & Enquiry, Tech Pack Received, Fit Approval, Size Set Approval, PP Approval. Responsible for buyer communications, approvals, and order tracking.",
  "Program": "Manages work orders, internal order entry, program sheets, fabric programming, and merchandiser approvals.",
  "Planning": "Responsible for line planning, capacity planning, cut plan, shipment planning, and PPM coordination.",
  "Costing": "Responsible for pre-budget cost estimation, fabric/trim consumption analysis, costing sheets, and pricing closure.",
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
  "Executive (MD)": TrendingUp,
  "Executive": TrendingUp,
  "Merchandising": Users, "Program": ClipboardList, "Planning": Calendar, "Costing": TrendingUp, "Purchase – Fabric": Package,
  "Purchase – Trims": Package, "Warehouse": Warehouse, "Testing": ShieldCheck, "Store": Warehouse,
  "Cutting": Scissors, "Production": Factory, "IoT": Radio, "Finishing": Shirt, "Quality": ShieldCheck,
  "Sample": Layers, "CAD": Palette, "Logistics & Documentation": Truck, "VAP": Palette,
  "Compliance & Certification": ShieldCheck,
};

export const DOC_TABS_CONFIG = {
  "Files": [
    "Techpacks",
    "PO Sheet",
    "Program Sheet",
    "Operational Breakdown (OB)",
    "updated guidelines",
    "Pattern Files",
    "CAD markers",
    "Stage Uploaded Files"
  ],
  "Order Sheet": ["Order Sheet"],
  "BOMs & POs": ["Fabric BOM", "Trims BOM", "Fabric PO", "Trims PO"],
  "Costing": ["Costing Sheet"],
  "RM Delivery": ["GRN / Delivery Challan", "Fabric Inspection Report"],
  "Sampling": ["Fit Sample Proof", "PP Sample Proof", "Size Set Proof", "TOP Sample Proof", "Testing Sample Proof"],
  "Pre-Production": [],
  "Quotation": [],
  "Production": ["Cutting Report", "Sewing Output Report"],
  "Inspection": ["Inline Inspection Report", "Final Inspection Report"],
  "Final OCR": ["OCR Report", "Dispatch Proof"],
  "Certificates": [],
};
export const DOC_TAB_NAMES = Object.keys(DOC_TABS_CONFIG);
export const DOC_TAB_ICONS = {
  "Files": FileText, "Order Sheet": ClipboardList, "BOMs & POs": Package, "Costing": TrendingUp,
  "RM Delivery": Truck, "Sampling": Layers, "Pre-Production": ClipboardCheck, "Quotation": Zap, "Production": Factory, "Inspection": ShieldCheck, "Final OCR": CheckCircle2, "Certificates": ShieldCheck,
};
export const CUSTOMIZABLE_TABS = new Set(["BOMs & POs", "RM Delivery", "Sampling", "Files"]);
export const STAGE_CHAT_TABS = ["RM Delivery", "Sampling", "Inspection", "Final OCR"];

export const TAB_ALLOWED_DEPTS = {
  "Files": ["Merchandising", "Sample", "CAD", "Production"],
  "BOMs & POs": ["Purchase – Fabric", "Purchase – Trims"],
  "Costing": ["Merchandising", "Finance"],
  "RM Delivery": ["Purchase – Fabric", "Purchase – Trims", "Warehouse", "Store"],
  "Sampling": ["Sample"],
  "Pre-Production": ["Merchandising", "Production Planning"],
  "Quotation": ["Merchandising", "VAP", "Executive", "Finance"],
  "Production": ["Cutting", "Production", "VAP"],
  "Inspection": ["Quality"],
  "Final OCR": ["Logistics & Documentation", "Production"],
  "Certificates": ["Compliance & Certification", "Merchandising", "Quality"],
};

/**
 * Metadata defining ownership badge for each document across tabs
 */
export const DOC_ITEM_METADATA = {
  // Files tab
  "Techpacks": { dept: "All depts — view only", color: "#15803D", bg: "#DCFCE7", border: "#BBF7D0" },
  "PO Sheet": { dept: "Merchandising", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Program Sheet": { dept: "Merchandising", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Operational Breakdown (OB)": { dept: "Production", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "updated guidelines": { dept: "Merchandising", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Updated guidelines": { dept: "Merchandising", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Pattern Files": { dept: "CAD", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "CAD markers": { dept: "CAD", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Stage Uploaded Files": { dept: "Merchandising", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },

  // Order Sheet & BOMs
  "Order Sheet": { dept: "Merchandising", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Fabric BOM": { dept: "Purchase – Fabric", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Trims BOM": { dept: "Purchase – Trims", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Fabric PO": { dept: "Purchase – Fabric", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Trims PO": { dept: "Purchase – Trims", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },

  // Costing & RM Delivery
  "Costing Sheet": { dept: "Costing / Merchandising", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "GRN / Delivery Challan": { dept: "Warehouse / Store", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Fabric Inspection Report": { dept: "Quality", color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },

  // Sampling
  "Fit Sample Proof": { dept: "Sample", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "PP Sample Proof": { dept: "Sample", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Size Set Proof": { dept: "Sample", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "TOP Sample Proof": { dept: "Sample", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Testing Sample Proof": { dept: "Quality / Lab", color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },

  // Production & Inspection & OCR
  "Cutting Report": { dept: "Cutting", color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },
  "Sewing Output Report": { dept: "Production", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Inline Inspection Report": { dept: "Quality", color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },
  "Final Inspection Report": { dept: "Quality", color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },
  "OCR Report": { dept: "Logistics", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
  "Dispatch Proof": { dept: "Logistics", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
};

export const PRE_PROD_DOC_TYPES = [
  {
    key: "techPack",
    label: "Tech Pack",
    hint: 'Upload "Techpacks" in the Files tab — it will link here automatically.',
    hasUpload: false,
    fields: [
      { key: "styleNo", label: "Style No." },
      { key: "revisionNo", label: "Revision No." },
      { key: "constructionNotes", label: "Key construction notes", fullWidth: true }
    ]
  },
  {
    key: "poSheet",
    label: "PO Sheet",
    hint: 'Upload "PO Sheet" in the Files tab or below — auto-scans PDF, Excel & Images to extract PO #, Qty, FOB Rate & Order Value.',
    hasUpload: true,
    uploadLabel: "Upload PO Sheet (Excel / PDF / Image)",
    fields: [
      { key: "poNumber", label: "PO Number" },
      { key: "poQty", label: "PO Qty (pcs)", type: "number" },
      { key: "fobPrice", label: "FOB Rate / pc (₹ / $)", type: "number" },
      { key: "orderValue", label: "Total Order Value (FOB)", type: "number" },
      { key: "poDate", label: "PO Date", halfWidth: true }
    ]
  },
  {
    key: "programSheet",
    label: "Program Sheet",
    hint: 'Upload "Program Sheet" in the Files tab — it will link here automatically.',
    hasUpload: false,
    fields: [
      { key: "cuttingStart", label: "Cutting start date" },
      { key: "targetShipWeek", label: "Target ship week" }
    ]
  },
  {
    key: "cmtPlanning",
    label: "CMT Planning",
    hasUpload: true,
    uploadLabel: "Upload CMT Planning",
    fields: [
      { key: "cmtRate", label: "CMT rate / pc (₹)", type: "number" },
      { key: "targetEfficiency", label: "Target efficiency (%)", type: "number" },
      { key: "lineAllocated", label: "Line allocated", halfWidth: true }
    ]
  },
  {
    key: "accPlanning",
    label: "ACC Planning",
    hasUpload: true,
    uploadLabel: "Upload ACC Planning",
    fields: [
      { key: "accessoriesList", label: "Key accessories" },
      { key: "leadTimeDays", label: "Lead time (days)", type: "number" }
    ]
  },
  {
    key: "grading",
    label: "Grading",
    hasUpload: true,
    uploadLabel: "Upload Grading",
    fields: [
      { key: "gradedSizes", label: "Graded size range" },
      { key: "gradeRuleRef", label: "Grade rule reference" }
    ]
  },
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
  { label: "Merchandiser", dept: "Merchandising", fullAccess: false },
  { label: "Fabric purchase", dept: "Purchase – Fabric", fullAccess: false },
  { label: "Trims purchase", dept: "Purchase – Trims", fullAccess: false },
  { label: "Sample incharge", dept: "Sample", fullAccess: false },
  { label: "Quality incharge", dept: "Quality", fullAccess: false },
  { label: "Cutting incharge", dept: "Cutting", fullAccess: false },
  { label: "Production manager", dept: "Production", fullAccess: false },
  { label: "Finishing incharge", dept: "Finishing", fullAccess: false },
  { label: "Logistics & documentation", dept: "Logistics & Documentation", fullAccess: false },
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

export const INITIAL_LEAVE_REQUESTS = [];

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

export const INITIAL_CERTIFICATIONS = [];

export const INITIAL_COMPLIANCES = [];

export const INITIAL_FINANCIALS = {
  revenue: 0,
  cogs: 0,
  ebitda: 0,
  stockValue: 0,
  cashFlow: 0,
  complianceScore: 100,
};

export const SEASON_OPTIONS = ["AW26", "SS26", "AW27", "SS27"];

export const INITIAL_DEBIT_NOTES = [];

export const INITIAL_CAPAS = [];

export const CAPA_STATUS_STYLE = {
  open: { bg: "#FCEBEB", fg: "#791F1F", label: "Open" },
  in_progress: { bg: "#FAEEDA", fg: "#633806", label: "In progress" },
  closed: { bg: "#E1F5EE", fg: "#085041", label: "Closed" },
};

export const RISK_DELAY_DAYS = { high: 3, medium: 2, low: 1 };

export const INITIAL_ORDERS = [];

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

export const INITIAL_NOTIFICATIONS = [];

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

export const INITIAL_DEPARTMENT_CHECKLISTS = {
  "Merchandising": [
    { id: "chk-merch-1", title: "sewing thread consumption", dueDate: "5/9/26", done: false },
    { id: "chk-merch-2", title: "shade card for trims sourcing", dueDate: "6/9/26", done: false },
    { id: "chk-merch-3", title: "CMT planning", dueDate: "2/9/26", done: false },
  ],
  "Cutting": [
    { id: "chk-cut-1", title: "Fabric relaxation test before lay", dueDate: "5/9/26", done: false },
    { id: "chk-cut-2", title: "Marker efficiency audit for style ST-7788", dueDate: "6/9/26", done: false },
    { id: "chk-cut-3", title: "End-bit fabric reconciliation", dueDate: "7/9/26", done: false },
  ],
  "Quality": [
    { id: "chk-qa-1", title: "Needle detector daily 9-point calibration", dueDate: "Today", done: false },
    { id: "chk-qa-2", title: "Inline AQL 2.5 audit on Line 3", dueDate: "5/9/26", done: false },
    { id: "chk-qa-3", title: "Review buyer comments on pre-final inspection", dueDate: "8/9/26", done: false },
  ],
  "Production": [
    { id: "chk-prod-1", title: "Line balancing for style GKT-1054", dueDate: "Today", done: false },
    { id: "chk-prod-2", title: "Daily hourly output board reconciliation", dueDate: "Today", done: false },
    { id: "chk-prod-3", title: "Preventive maintenance on overlock machines", dueDate: "6/9/26", done: false },
  ],
  "Sample Room": [
    { id: "chk-samp-1", title: "Fit sample pattern grading correction", dueDate: "5/9/26", done: false },
    { id: "chk-samp-2", title: "Strike-off lab dips swatch review", dueDate: "7/9/26", done: false },
  ],
  "Finance": [
    { id: "chk-fin-1", title: "Reconcile buyer LC amendments with sales team", dueDate: "8/9/26", done: false },
    { id: "chk-fin-2", title: "Debit notes settlement for delayed trims", dueDate: "10/9/26", done: false },
  ],
  "Executive": [
    { id: "chk-exec-1", title: "Review Q3 export shipment revenue & margins", dueDate: "10/9/26", done: false },
    { id: "chk-exec-2", title: "Approve fabric supplier credit limit revision", dueDate: "12/9/26", done: false },
  ],
};


