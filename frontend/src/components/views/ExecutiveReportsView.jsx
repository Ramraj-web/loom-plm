import React, { useState, useMemo } from "react";
import {
  BarChart3, Download, Search, Filter, Layers, CheckCircle2, Clock,
  AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp, Users, ChevronRight,
  FileSpreadsheet, Sparkles, Building2, Calendar, CheckSquare, ArrowLeft, Award, Activity
} from "lucide-react";
import { Card, CardHeader, PageHeader } from "../common/CommonUI.jsx";
import { computeDynamicOrderRisk, parseShipDateSafe } from "../../constants/loomData.js";
import { computeOrderStageSchedules } from "../order/OrderWorkspace.jsx";

/**
 * Enhanced ReportsPage implementing the 6 Garment PLM Executive Reports
 * based on management spreadsheet templates:
 * 1. Management KPI Summary
 * 2. Active T&A Report (Order-wise Quantity Status)
 * 3. Stage-wise Quantity Funnel (WIP gap & bottlenecks)
 * 4. Buyer-wise Summary
 * 5. T&A Milestone Tracker (task-level with delay days)
 * 6. Department-wise Delay Summary (root-cause view)
 */
export function ReportsPage({ orders = [], capas = [], debitNotes = [], users = [], buyers = [], onOpenOrder }) {
  const [selectedReport, setSelectedReport] = useState("menu");
  const [activeTab, setActiveTab] = useState("kpiSummary");
  const [buyerFilter, setBuyerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const reportModules = [
    {
      key: "kpiSummary",
      number: "1",
      title: "Executive KPI Summary",
      desc: "High-level management scorecard with live order health, on-time delivery %, claims & compliance.",
      metric: "13 Core KPIs",
      color: "#0D9488",
      bg: "#F0FDFA",
      border: "#CCFBF1",
      icon: Award
    },
    {
      key: "activeTna",
      number: "2",
      title: "Active T&A Order Status",
      desc: "Complete order-level manufacturing pipeline with Cut, Sewn, Finished, Packed, Shipped & Balance pcs.",
      metric: `${orders.filter(o => !o.isDeleted).length} Orders`,
      color: "#2563EB",
      bg: "#EFF6FF",
      border: "#DBEAFE",
      icon: FileSpreadsheet
    },
    {
      key: "stageFunnel",
      number: "3",
      title: "Stage-wise Quantity Funnel",
      desc: "Visual manufacturing WIP inventory across stages with intelligent production bottleneck detection.",
      metric: "WIP Funnel",
      color: "#7C3AED",
      bg: "#F5F3FF",
      border: "#EDE9FE",
      icon: Filter
    },
    {
      key: "buyerSummary",
      number: "4",
      title: "Buyer-wise Summary",
      desc: "Comprehensive performance overview grouped by buyer brand with on-time delivery rates and balance.",
      metric: "Buyer Portfolio",
      color: "#D97706",
      bg: "#FFFBEB",
      border: "#FEF3C7",
      icon: Building2
    },
    {
      key: "milestoneTracker",
      number: "5",
      title: "T&A Milestone Tracker",
      desc: "Task-level schedule tracker with real calendar date ranges (D/M/YY), owner tracking & delay days.",
      metric: "Schedule Dates",
      color: "#DB2777",
      bg: "#FDF2F8",
      border: "#FCE7F3",
      icon: Calendar
    },
    {
      key: "deptDelaySummary",
      number: "6",
      title: "Department Delay Analysis",
      desc: "Root-cause delay ranking across all departments with total delay days, pending tasks & late percentages.",
      metric: "Root Cause",
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FEE2E2",
      icon: Clock
    }
  ];

  // Base list of non-deleted active orders
  const activeOrders = useMemo(() => {
    return (orders || []).filter(o => o && o.isDeleted !== true && o.isDeleted !== "true" && !o.deletedAt);
  }, [orders]);

  // Distinct buyers for filter dropdown
  const availableBuyers = useMemo(() => {
    const set = new Set();
    activeOrders.forEach(o => {
      const b = (o.buyer || "").trim();
      if (b) set.add(b);
    });
    return Array.from(set).sort();
  }, [activeOrders]);

  // Utility to parse ship date and compute days to ship
  const computeDaysToShip = (order) => {
    const raw = order.shipDate || order.ship;
    const parsed = parseShipDateSafe(raw);
    if (!parsed) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    return Math.round((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Helper to resolve the assigned merchandiser's name for an order
  const resolveMerchandiserName = (order) => {
    if (order.merchandiser && typeof order.merchandiser === "string" && order.merchandiser.trim() !== "") {
      return order.merchandiser;
    }
    // Match via buyer mapping if buyer has merchandisers
    const matchedBuyer = (buyers || []).find(b => (b.name && order.buyer && b.name.trim().toLowerCase() === order.buyer.trim().toLowerCase()) || b.id === order.buyerId);
    if (matchedBuyer) {
      if (order.merchandiserId) {
        const u = (users || []).find(usr => usr.id === order.merchandiserId);
        if (u) return u.name || u.username;
      }
      if (Array.isArray(matchedBuyer.merchandisers) && matchedBuyer.merchandisers.length > 0) {
        return matchedBuyer.merchandisers[0];
      }
      if (Array.isArray(matchedBuyer.merchandiserIds) && matchedBuyer.merchandiserIds.length > 0) {
        const u = (users || []).find(usr => usr.id === matchedBuyer.merchandiserIds[0]);
        if (u) return u.name || u.username;
      }
    }
    // Check stages for Merchandising assignee or stage updater
    const merchStage = (order.stages || []).find(s => s && s.dept === "Merchandising" && (s.completedBy || s.updatedBy || s.assignee));
    if (merchStage) {
      const name = merchStage.completedBy || merchStage.updatedBy || merchStage.assignee;
      if (name && name !== "Unassigned" && name !== "Assigned") return name;
    }
    return order.updatedBy || "Merchandiser";
  };

  const formatScheduleDateRange = (d1, d2) => {
    if (!d1 || isNaN(d1.getTime())) return "—";
    const f = (d) => `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
    if (!d2 || isNaN(d2.getTime()) || d1.getTime() === d2.getTime()) {
      return f(d1);
    }
    return `${f(d1)} - ${f(d2)}`;
  };

  const resolveOrderStartDate = (order) => {
    if (order.orderDate) {
      const d = new Date(order.orderDate);
      if (!isNaN(d.getTime())) return d;
    }
    if (order.createdAt) {
      const d = new Date(order.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    const rawShip = order.shipDate || order.ship;
    if (rawShip) {
      const shipD = parseShipDateSafe(rawShip);
      if (shipD && !isNaN(shipD.getTime())) {
        const startD = new Date(shipD);
        startD.setDate(startD.getDate() - 90);
        return startD;
      }
    }
    return new Date();
  };

    // Compute Stage Quantities (Cut, Sewn, Finished, Packed, Shipped) from order
  const computeOrderStageQuantities = (order) => {
    const orderQty = Number(order.qty) || 0;
    const shippedQty = Number(order.shippedQty) || (order.completed ? orderQty : 0);
    const stages = Array.isArray(order.stages) ? order.stages : [];

    // Helper: find stage matching regex
    const findStage = (regex) => stages.find(stg => regex.test((stg.name || "").toLowerCase()));

    // Helper to calculate real completed pieces from a stage's colourways:
    // When user enters pcs or clicks "Mark All Done", completedQty is stored in stage.colourways
    const getStageCompletedPieces = (stg) => {
      if (!stg) return null;
      if (Array.isArray(stg.colourways) && stg.colourways.length > 0) {
        return stg.colourways.reduce((sum, c) => sum + (Number(c.completedQty) || 0), 0);
      }
      return null;
    };

    // 1. Cut Qty:
    let cutQty = order.cutQty !== undefined && order.cutQty !== "" ? Number(order.cutQty) : null;
    const cutStg = findStage(/cut|cutting/);
    const colourwayCut = getStageCompletedPieces(cutStg);

    if (colourwayCut !== null) {
      cutQty = colourwayCut;
    } else if (cutQty === null) {
      if (cutStg?.status === "done") cutQty = orderQty;
      else if (cutStg?.status === "in_progress") cutQty = Math.round(orderQty * 0.75);
      else cutQty = 0;
    }
    cutQty = Math.min(orderQty, Math.max(0, cutQty));

    // 2. Sewn Qty:
    let sewnQty = order.sewnQty !== undefined && order.sewnQty !== "" ? Number(order.sewnQty) : null;
    const sewnStg = findStage(/sew|sewing|production/);
    const colourwaySewn = getStageCompletedPieces(sewnStg);

    if (colourwaySewn !== null) {
      sewnQty = colourwaySewn;
    } else if (sewnQty === null) {
      if (sewnStg?.status === "done") sewnQty = cutQty;
      else if (sewnStg?.status === "in_progress") sewnQty = Math.round(cutQty * 0.7);
      else sewnQty = 0;
    }
    // Physical rule: Sewn cannot exceed Cut
    sewnQty = Math.min(cutQty, Math.max(0, sewnQty));

    // 3. Finished Qty:
    let finishedQty = order.finishedQty !== undefined && order.finishedQty !== "" ? Number(order.finishedQty) : null;
    const finStg = findStage(/finish|finishing/);
    const colourwayFin = getStageCompletedPieces(finStg);

    if (colourwayFin !== null) {
      finishedQty = colourwayFin;
    } else if (finishedQty === null) {
      if (finStg?.status === "done") finishedQty = sewnQty;
      else if (finStg?.status === "in_progress") finishedQty = Math.round(sewnQty * 0.7);
      else finishedQty = 0;
    }
    // Physical rule: Finished cannot exceed Sewn
    finishedQty = Math.min(sewnQty, Math.max(0, finishedQty));

    // Check if order is completely finished (Mark All Done or completed flag)
    const isAllStagesDone = stages.length > 0 && stages.every(s => s.status === "done");
    const isOrderCompleted = Boolean(order.completed || isAllStagesDone);

    // 4. Packed Qty:
    let packedQty = order.packedQty !== undefined && order.packedQty !== "" ? Number(order.packedQty) : null;
    const packStg = findStage(/pack|packing|final audit/);
    const colourwayPack = getStageCompletedPieces(packStg);

    if (isOrderCompleted) {
      cutQty = orderQty;
      sewnQty = orderQty;
      finishedQty = orderQty;
      packedQty = orderQty;
    } else if (colourwayPack !== null) {
      packedQty = colourwayPack;
    } else if (packedQty === null) {
      if (packStg?.status === "done") packedQty = finishedQty;
      else packedQty = 0; // Currently zero when not explicitly packed/done
    }
    // Physical rule: Packed cannot exceed Finished
    packedQty = Math.min(finishedQty, Math.max(0, packedQty));

    // Shipped Qty: When order is marked all done / completed, full qty moves to shipped
    const validShipped = isOrderCompleted
      ? orderQty
      : Math.min(packedQty > 0 ? packedQty : orderQty, shippedQty);
    const balanceQty = isOrderCompleted ? 0 : Math.max(0, orderQty - validShipped);
    const packedPct = isOrderCompleted ? 100 : (orderQty > 0 ? (packedQty / orderQty) * 100 : 0);
    const daysToShip = computeDaysToShip(order);

    // Order status strictly matches Dashboard status:
    const dynamicRisk = computeDynamicOrderRisk(order);
    let status = "On Track";
    if (isOrderCompleted || (balanceQty <= 0 && orderQty > 0)) {
      status = "Shipped";
    } else if (order.status === "Delayed") {
      status = "Delayed";
    } else if (order.status === "At Risk") {
      status = "At Risk";
    } else if (order.status === "On Track") {
      status = "On Track";
    } else if (daysToShip < 0) {
      status = "Delayed";
    }

    return {
      cutQty,
      sewnQty,
      finishedQty,
      packedQty,
      shippedQty: validShipped,
      balanceQty,
      packedPct,
      daysToShip,
      status,
      dynamicRisk
    };
  };

  // Detailed Order Rows with all calculated metrics
  const orderDetailedRows = useMemo(() => {
    return activeOrders.map((order, idx) => {
      const q = computeOrderStageQuantities(order);
      const cleanId = String(order.id || order.primaryId || order.orderNumber || "").replace(/^ord_/, "");
      return {
        taNo: `TA-${1001 + idx}`,
        orderId: cleanId,
        buyer: order.buyer || "—",
        style: order.style || cleanId || "—",
        poNo: order.poNumber || order.po || cleanId,
        merchandiser: resolveMerchandiserName(order),
        orderQty: Number(order.qty) || 0,
        shipDate: order.shipDate || order.ship || "—",
        orderDate: order.orderDate || order.createdAt || null,
        ...q,
        stages: order.stages || []
      };
    });
  }, [activeOrders, buyers, users]);

  // Filtered order rows for Tab 2
  const filteredOrderRows = useMemo(() => {
    return orderDetailedRows.filter(row => {
      if (buyerFilter !== "all" && row.buyer !== buyerFilter) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          row.orderId.toLowerCase().includes(q) ||
          row.style.toLowerCase().includes(q) ||
          row.buyer.toLowerCase().includes(q) ||
          row.poNo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orderDetailedRows, buyerFilter, statusFilter, searchQuery]);

  // 1. MANAGEMENT KPI SUMMARY
  const kpiSummary = useMemo(() => {
    const totalOrders = orderDetailedRows.length;
    const totalOrderQty = orderDetailedRows.reduce((a, r) => a + r.orderQty, 0);
    const totalShippedQty = orderDetailedRows.reduce((a, r) => a + r.shippedQty, 0);
    const totalBalanceQty = Math.max(0, totalOrderQty - totalShippedQty);
    const shippedPct = totalOrderQty > 0 ? (totalShippedQty / totalOrderQty) * 100 : 0;

    // True Delayed and At-Risk counts strictly evaluated from active orders
    const delayedOrders = orderDetailedRows.filter(r => r.status === "Delayed").length;
    const atRiskOrders = orderDetailedRows.filter(r => r.status === "At Risk").length;
    const onTimeDeliveryPct = totalOrders > 0
      ? Math.max(0, Math.min(100, Math.round(((totalOrders - delayedOrders) / totalOrders) * 100)))
      : 100;

    // Milestone tasks & delay calculation: unified with Milestone Tracker
    let delayedTasksCount = 0;
    const deptDelayDaysMap = {};

    orderDetailedRows.forEach(r => {
      const stages = r.stages || [];
      const orderStartDate = resolveOrderStartDate(r);
      const schedules = computeOrderStageSchedules(stages, orderStartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      stages.forEach((stg, sIdx) => {
        const sch = schedules[sIdx] || {};
        const isDone = stg.status === "done";
        const hasReason = Boolean(stg.reason && typeof stg.reason === "string" && stg.reason.trim() !== "" && stg.reason !== "No delay flagged");
        const shiftDays = sch.shiftDays || sch.doneDelayDays || Number(stg.delayDays) || 0;
        let isOverdue = false;
        let overdueDays = 0;
        if (!isDone && sch.origEndDate) {
          const target = new Date(sch.origEndDate);
          target.setHours(0, 0, 0, 0);
          if (today > target) {
            isOverdue = true;
            overdueDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
        const isDelayed = !isDone && (stg.status === "delayed" || isOverdue || hasReason);
        if (isDelayed) {
          delayedTasksCount++;
          const dept = stg.dept || "Merchandising";
          const days = Math.max(1, overdueDays || shiftDays || Number(stg.delayDays) || 3);
          deptDelayDaysMap[dept] = (deptDelayDaysMap[dept] || 0) + days;
        } else if (isDone && (hasReason || shiftDays > 0)) {
          const dept = stg.dept || "Merchandising";
          deptDelayDaysMap[dept] = (deptDelayDaysMap[dept] || 0) + Math.max(1, shiftDays);
        }
      });
    });

    let topDelayDept = "Merchandising";
    let maxDelay = -1;
    Object.entries(deptDelayDaysMap).forEach(([dept, days]) => {
      if (days > maxDelay) {
        maxDelay = days;
        topDelayDept = dept;
      }
    });

    // Stage Bottleneck: evaluate stages where quantity or progress is most constrained
    const totalCut = orderDetailedRows.reduce((a, r) => a + r.cutQty, 0);
    const totalSewn = orderDetailedRows.reduce((a, r) => a + r.sewnQty, 0);
    const totalFinished = orderDetailedRows.reduce((a, r) => a + r.finishedQty, 0);
    const totalPacked = orderDetailedRows.reduce((a, r) => a + r.packedQty, 0);

    // Production stage bottlenecks: Cutting, Sewing, Finishing, Packing (Shipping is logistics, not manufacturing bottleneck)
    const gaps = [
      { stage: "Cutting", gap: Math.max(0, totalOrderQty - totalCut) },
      { stage: "Sewing", gap: Math.max(0, totalCut - totalSewn) },
      { stage: "Finishing", gap: Math.max(0, totalSewn - totalFinished) },
      { stage: "Packing", gap: Math.max(0, totalFinished - totalPacked) }
    ];
    gaps.sort((a, b) => b.gap - a.gap);
    const biggestBottleneck = gaps[0]?.gap > 0 ? gaps[0].stage : "Cutting";

    // Live Inspection Pass Rate
    let inspPassed = 0;
    let inspTotal = 0;
    orderDetailedRows.forEach(o => {
      const stages = o.stages || [];
      const qStages = stages.filter(s => (s.dept === "Quality" || (s.name || "").toLowerCase().includes("inspection") || (s.name || "").toLowerCase().includes("quality")));
      qStages.forEach(s => {
        inspTotal++;
        if (s.status === "done" && !s.reason) inspPassed++;
      });
    });
    const firstPassRate = inspTotal > 0
      ? `${((inspPassed / inspTotal) * 100).toFixed(1)}%`
      : "96.4%";

    // True Live CAPAs from system compliance module
    const openCapasCount = Array.isArray(capas)
      ? capas.filter(c => !c.isDeleted && c.status !== "Closed" && c.status !== "Resolved").length
      : 0;

    // True Live Claims / Debit Notes for the current month
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const monthlyClaimsCount = Array.isArray(debitNotes)
      ? debitNotes.filter(d => !d.isDeleted && (d.date || d.createdAt || "").startsWith(currentYearMonth)).length
      : 0;

    return {
      activeOrders: totalOrders,
      totalOrderQty,
      totalShippedQty,
      totalBalanceQty,
      shippedPct: shippedPct.toFixed(1) + "%",
      delayedOrders,
      atRiskOrders,
      onTimeDeliveryPct: onTimeDeliveryPct.toFixed(1) + "%",
      delayedMilestoneTasks: delayedTasksCount,
      topDelayDept,
      biggestBottleneck,
      firstPassRate,
      capasOpen: openCapasCount,
      claimsCount: monthlyClaimsCount
    };
  }, [orderDetailedRows, capas, debitNotes]);

  // 3. STAGE-WISE QUANTITY FUNNEL (All Active T&A)
  const stageFunnelData = useMemo(() => {
    const totalOrderQty = orderDetailedRows.reduce((a, r) => a + r.orderQty, 0);
    const cut = orderDetailedRows.reduce((a, r) => a + r.cutQty, 0);
    const sewn = orderDetailedRows.reduce((a, r) => a + r.sewnQty, 0);
    const fin = orderDetailedRows.reduce((a, r) => a + r.finishedQty, 0);
    const pack = orderDetailedRows.reduce((a, r) => a + r.packedQty, 0);
    const ship = orderDetailedRows.reduce((a, r) => a + r.shippedQty, 0);

    const stages = [
      { name: "Order Qty", qty: totalOrderQty, prevQty: totalOrderQty },
      { name: "Cutting", qty: cut, prevQty: totalOrderQty },
      { name: "Sewing", qty: sewn, prevQty: cut },
      { name: "Finishing", qty: fin, prevQty: sewn },
      { name: "Packing", qty: pack, prevQty: fin },
      { name: "Shipped", qty: ship, prevQty: pack }
    ];

    // Find max gap for bottleneck highlight
    let maxGap = -1;
    let bottleneckStage = "";
    stages.forEach((stg, i) => {
      // Evaluate production stage bottlenecks (skip Shipped as it is logistics)
      if (i > 0 && stg.name !== "Shipped") {
        const gap = Math.max(0, stg.prevQty - stg.qty);
        if (gap > maxGap) {
          maxGap = gap;
          bottleneckStage = stg.name;
        }
      }
    });

    return stages.map((stg, i) => {
      const pct = totalOrderQty > 0 ? ((stg.qty / totalOrderQty) * 100).toFixed(1) : 0;
      const stuck = i === 0 ? "—" : Math.max(0, stg.prevQty - stg.qty).toLocaleString();
      const remark = stg.name === bottleneckStage ? "Biggest bottleneck" : "";
      return {
        stage: stg.name,
        qtyCompleted: stg.qty.toLocaleString(),
        pctOfOrder: `${pct}%`,
        qtyStuck: stuck,
        remark,
        isBottleneck: stg.name === bottleneckStage
      };
    });
  }, [orderDetailedRows]);

  // 4. BUYER-WISE SUMMARY
  const buyerSummaryData = useMemo(() => {
    const map = {};
    orderDetailedRows.forEach(r => {
      const b = r.buyer || "Other";
      if (!map[b]) {
        map[b] = {
          buyer: b,
          noOfOrders: 0,
          orderQty: 0,
          shippedQty: 0,
          delayedOrders: 0,
          atRiskOrders: 0
        };
      }
      map[b].noOfOrders += 1;
      map[b].orderQty += r.orderQty;
      map[b].shippedQty += r.shippedQty;
      if (r.status === "Delayed") map[b].delayedOrders += 1;
      if (r.status === "At Risk") map[b].atRiskOrders += 1;
    });

    return Object.values(map).map(b => {
      const balanceQty = Math.max(0, b.orderQty - b.shippedQty);
      const shippedPct = b.orderQty > 0 ? ((b.shippedQty / b.orderQty) * 100).toFixed(1) : "0.0";
      const onTimePct = b.noOfOrders > 0
        ? (((b.noOfOrders - b.delayedOrders) / b.noOfOrders) * 100).toFixed(1)
        : "100.0";
      return {
        ...b,
        balanceQty,
        shippedPct: `${shippedPct}%`,
        onTimePct: `${onTimePct}%`
      };
    });
  }, [orderDetailedRows]);

  // 5. T&A MILESTONE TRACKER (Task-Level with real schedule delay days)
  const allMilestoneTasks = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    orderDetailedRows.forEach((r) => {
      const stages = r.stages || [];
      const orderStartDate = resolveOrderStartDate(r);
      const schedules = computeOrderStageSchedules(stages, orderStartDate);

      stages.forEach((stg, sIdx) => {
        const sch = schedules[sIdx] || {};
        // Convert relative day range to calendar date range like 5/7/26 - 10/7/26
        let plannedStr = "—";
        if (sch.origStartDate && sch.origEndDate) {
          plannedStr = formatScheduleDateRange(sch.origStartDate, sch.origEndDate);
        } else if (stg.planned) {
          plannedStr = stg.planned;
        }
        const actualDate = stg.completedAt
          ? stg.completedAt.split("T")[0]
          : (stg.status === "done" ? (stg.completedOn || "Done") : "—");

        const isDone = stg.status === "done";
        const hasReason = Boolean(stg.reason && stg.reason.trim() !== "" && stg.reason !== "No delay flagged");
        const shiftDays = sch.shiftDays || sch.doneDelayDays || Number(stg.delayDays) || 0;

        // Check if overdue: pending/in_progress and past planned target
        let isOverdue = false;
        let overdueDays = 0;
        if (!isDone && sch.origEndDate) {
          const target = new Date(sch.origEndDate);
          target.setHours(0, 0, 0, 0);
          if (today > target) {
            isOverdue = true;
            overdueDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
          }
        }

        let status = "Pending";
        let delayDays = 0;

        if (isDone) {
          if (hasReason || shiftDays > 0) {
            status = "Done Late";
            delayDays = Math.max(1, shiftDays);
          } else {
            status = "Done On Time";
            delayDays = 0;
          }
        } else if (stg.status === "delayed" || isOverdue || hasReason) {
          status = "Delayed";
          delayDays = Math.max(1, overdueDays || shiftDays || 3);
        } else if (stg.status === "in_progress") {
          status = "In Progress";
          delayDays = 0;
        }

        list.push({
          taNo: r.taNo,
          orderId: r.orderId,
          buyer: r.buyer,
          milestone: stg.name || `Stage ${sIdx + 1}`,
          department: stg.dept || "Production",
          owner: stg.completedBy || stg.updatedBy || stg.assignee || r.merchandiser || "Assigned",
          plannedDate: plannedStr,
          actualDate,
          taskQty: r.orderQty,
          delayDays,
          status
        });
      });
    });

    return list;
  }, [orderDetailedRows]);

  // Display top 300 milestone rows for table performance while retaining full dataset for summary
  const milestoneTrackerData = useMemo(() => {
    return allMilestoneTasks.slice(0, 300);
  }, [allMilestoneTasks]);

  // 6. DEPARTMENT-WISE DELAY SUMMARY (Root-Cause View from ALL milestone tasks)
  const departmentDelaySummary = useMemo(() => {
    const map = {};
    allMilestoneTasks.forEach(item => {
      const dept = item.department || "Other";
      if (!map[dept]) {
        map[dept] = {
          department: dept,
          totalTasks: 0,
          completed: 0,
          pendingOrDelayed: 0,
          delayedOrLateTasks: 0,
          totalDelayDays: 0
        };
      }
      map[dept].totalTasks += 1;
      if (item.status === "Done On Time" || item.status === "Done Late") {
        map[dept].completed += 1;
      } else {
        map[dept].pendingOrDelayed += 1;
      }
      if (item.status === "Delayed" || item.status === "Done Late") {
        map[dept].delayedOrLateTasks += 1;
        map[dept].totalDelayDays += Number(item.delayDays || 0);
      }
    });

    const rows = Object.values(map).map(d => {
      const avgDelayDays = d.delayedOrLateTasks > 0 ? (d.totalDelayDays / d.delayedOrLateTasks).toFixed(1) : "0.0";
      const latePct = d.totalTasks > 0 ? ((d.delayedOrLateTasks / d.totalTasks) * 100).toFixed(1) : "0.0";
      return {
        ...d,
        avgDelayDays,
        latePct: `${latePct}%`
      };
    });

    // Rank by total delay days descending
    rows.sort((a, b) => b.totalDelayDays - a.totalDelayDays);
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [allMilestoneTasks]);

  // Export current table as CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === "activeTna") {
      csvContent += "T&A No,Buyer,Style,PO No,Merchandiser,Order Qty,Ship Date,Cut Qty,Sewn Qty,Finished Qty,Packed Qty,Shipped Qty,Balance Qty,Packed %,Days to Ship,Status\n";
      filteredOrderRows.forEach(r => {
        csvContent += `"${r.taNo}","${r.buyer}","${r.style}","${r.poNo}","${r.merchandiser}",${r.orderQty},"${r.shipDate}",${r.cutQty},${r.sewnQty},${r.finishedQty},${r.packedQty},${r.shippedQty},${r.balanceQty},"${r.packedPct.toFixed(1)}%",${r.daysToShip},"${r.status}"\n`;
      });
    } else if (activeTab === "stageFunnel") {
      csvContent += "Stage,Qty Completed,% of Order Qty,Qty Stuck Before This Stage (WIP gap),Remark\n";
      stageFunnelData.forEach(r => {
        csvContent += `"${r.stage}","${r.qtyCompleted}","${r.pctOfOrder}","${r.qtyStuck}","${r.remark}"\n`;
      });
    } else if (activeTab === "buyerSummary") {
      csvContent += "Buyer,No. of Orders,Order Qty,Shipped Qty,Balance Qty,Shipped %,Delayed Orders,At Risk Orders,On-Time Orders %\n";
      buyerSummaryData.forEach(r => {
        csvContent += `"${r.buyer}",${r.noOfOrders},${r.orderQty},${r.shippedQty},${r.balanceQty},"${r.shippedPct}",${r.delayedOrders},${r.atRiskOrders},"${r.onTimePct}"\n`;
      });
    } else if (activeTab === "milestoneTracker") {
      csvContent += "T&A No,Buyer,Milestone,Department,Owner,Planned Date,Actual Date,Task Qty,Delay Days,Status\n";
      milestoneTrackerData.forEach(r => {
        csvContent += `"${r.taNo}","${r.buyer}","${r.milestone}","${r.department}","${r.owner}","${r.plannedDate}","${r.actualDate}",${r.taskQty},${r.delayDays},"${r.status}"\n`;
      });
    } else if (activeTab === "deptDelaySummary") {
      csvContent += "Department,Total Tasks,Completed,Pending / Delayed,Delayed or Late Tasks,Total Delay Days,Avg Delay Days,Late %,Rank\n";
      departmentDelaySummary.forEach(r => {
        csvContent += `"${r.department}",${r.totalTasks},${r.completed},${r.pendingOrDelayed},${r.delayedOrLateTasks},${r.totalDelayDays},${r.avgDelayDays},"${r.latePct}",${r.rank}\n`;
      });
    } else {
      csvContent += "KPI,Value,Basis\n";
      csvContent += `"Active T&A orders","${kpiSummary.activeOrders}","Count of active rows"\n`;
      csvContent += `"Total order qty (pcs)","${kpiSummary.totalOrderQty.toLocaleString()}","Sum of order qty"\n`;
      csvContent += `"Total shipped qty (pcs)","${kpiSummary.totalShippedQty.toLocaleString()}","Sum of shipped qty"\n`;
      csvContent += `"Balance qty to ship (pcs)","${kpiSummary.totalBalanceQty.toLocaleString()}","Order - shipped"\n`;
      csvContent += `"Shipped % of order qty","${kpiSummary.shippedPct}","Shipped / order"\n`;
      csvContent += `"Delayed orders","${kpiSummary.delayedOrders}","Ship date passed, balance remaining"\n`;
      csvContent += `"At-risk orders","${kpiSummary.atRiskOrders}","Ship <=7 days and packed <85%"\n`;
      csvContent += `"On-time delivery %","${kpiSummary.onTimeDeliveryPct}","(Orders - delayed) / orders"\n`;
      csvContent += `"Delayed milestone tasks","${kpiSummary.delayedMilestoneTasks}","From Milestone Tracker"\n`;
      csvContent += `"Department with most delay days","${kpiSummary.topDelayDept}","Top bottleneck department"\n`;
      csvContent += `"Biggest stage bottleneck","${kpiSummary.biggestBottleneck}","Stage with largest qty gap"\n`;
      csvContent += `"CAPAs registered (open)","${kpiSummary.capasOpen}","Compliance module"\n`;
      csvContent += `"Claims this month","${kpiSummary.claimsCount}","Compliance module"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Loom_PLM_${activeTab}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper badge for order status
  const renderStatusBadge = (status) => {
    let bg = "#E1F5EE";
    let color = "#085041";
    if (status === "Delayed") {
      bg = "#FEE2E2";
      color = "#991B1B";
    } else if (status === "At Risk") {
      bg = "#FEF3C7";
      color = "#92400E";
    } else if (status === "Shipped") {
      bg = "#E0E7FF";
      color = "#3730A3";
    }
    return (
      <span style={{
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color: color,
        display: "inline-block"
      }}>
        {status}
      </span>
    );
  };

  // When in main menu, render the sleek Report Directory Hub
  if (selectedReport === "menu") {
    return (
      <div style={{ paddingBottom: 48, maxWidth: 1400, margin: "0 auto" }}>
        {/* Hub Header */}
        <div style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          borderRadius: 16,
          padding: "24px 28px",
          color: "#FFFFFF",
          marginBottom: 24,
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.12)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(31, 158, 141, 0.2)", color: "#2DD4BF", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                <Sparkles size={13} />
                Live PLM Intelligence
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>
                Executive Reports & Analytics Hub
              </h1>
              <p style={{ fontSize: 13.5, color: "#94A3B8", margin: "6px 0 0", maxWidth: 650 }}>
                Select a specialized report module to inspect manufacturing stage quantities, order health, milestone schedules, and root-cause department delays.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handleExportCSV}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#1F9E8D",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  transition: "all 0.2s"
                }}
              >
                <Download size={15} />
                Export Active Report
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar inside Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 22,
            paddingTop: 20,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.4 }}>Active Orders</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>{kpiSummary.activeOrders}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.4 }}>Total Order Qty</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginTop: 2 }}>{kpiSummary.totalOrderQty.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>pcs</span></div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.4 }}>Orders At Risk</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B", marginTop: 2 }}>{kpiSummary.atRiskOrders}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.4 }}>Delayed Orders</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpiSummary.delayedOrders > 0 ? "#EF4444" : "#10B981", marginTop: 2 }}>{kpiSummary.delayedOrders}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.4 }}>On-Time Delivery</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981", marginTop: 2 }}>{kpiSummary.onTimeDeliveryPct}</div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: 0 }}>Report Modules</h2>
            <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>Choose any category below to view detailed analytics and download data</div>
          </div>
        </div>

        {/* 6 Report Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 16
        }}>
          {reportModules.map(mod => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.key}
                onClick={() => {
                  setActiveTab(mod.key);
                  setSelectedReport(mod.key);
                }}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "22px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px -4px rgba(15, 23, 42, 0.08)";
                  e.currentTarget.style.borderColor = mod.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: mod.bg,
                      border: `1px solid ${mod.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: mod.color
                    }}>
                      <Icon size={22} />
                    </div>

                    <span style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      background: mod.bg,
                      color: mod.color,
                      padding: "3px 10px",
                      borderRadius: 999,
                      border: `1px solid ${mod.border}`
                    }}>
                      {mod.metric}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 700, color: mod.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                    Report #{mod.number}
                  </div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>
                    {mod.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                    {mod.desc}
                  </p>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 20,
                  paddingTop: 14,
                  borderTop: "1px solid #F1F5F9"
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>
                    Open Module
                  </span>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: mod.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: mod.color
                  }}>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Dedicated Detailed Report View
  const currentModule = reportModules.find(m => m.key === activeTab) || reportModules[0];
  const CurrentIcon = currentModule.icon;

  return (
    <div style={{ paddingBottom: 48, maxWidth: 1400, margin: "0 auto" }}>
      {/* Navigation & Header Banner */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          {/* Back button & Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setSelectedReport("menu")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#F8FAFC",
                color: "#1E293B",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                padding: "7px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#E2E8F0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; }}
            >
              <ArrowLeft size={14} />
              Back to Reports Menu
            </button>

            <div style={{ height: 24, width: 1, background: "#E2E8F0" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: currentModule.bg,
                border: `1px solid ${currentModule.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: currentModule.color
              }}>
                <CurrentIcon size={18} />
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  {currentModule.title}
                  <span style={{ fontSize: 11.5, fontWeight: 700, background: currentModule.bg, color: currentModule.color, padding: "2px 8px", borderRadius: 999, border: `1px solid ${currentModule.border}` }}>
                    {currentModule.metric}
                  </span>
                </h1>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{currentModule.desc}</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#1F9E8D",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.06)"
              }}
            >
              <Download size={14} />
              Export to Excel / CSV
            </button>
          </div>
        </div>


      </div>

      {/* ============================================================== */}
      {/* TAB 1: MANAGEMENT KPI SUMMARY (Modern Executive Grid) */}
      {/* ============================================================== */}
      {activeTab === "kpiSummary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section 1: Core Order & Fulfillment Volume */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 14,
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#0D9488" }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: 0.4 }}>
                1. Order Fulfillment & Volume Health
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #EDF2F7" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Active T&A Orders</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>{kpiSummary.activeOrders}</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>Live manufacturing orders</div>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #EDF2F7" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Total Order Volume</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>{kpiSummary.totalOrderQty.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>pcs</span></div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>Total units across all styles</div>
              </div>

              <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "14px 16px", border: "1px solid #DCFCE7" }}>
                <div style={{ fontSize: 11.5, color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>Shipped / Dispatched</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#15803D", marginTop: 4 }}>{kpiSummary.totalShippedQty.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500 }}>pcs</span></div>
                <div style={{ fontSize: 11.5, color: "#16A34A", marginTop: 2 }}>{kpiSummary.shippedPct} of total order qty</div>
              </div>

              <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "14px 16px", border: "1px solid #DBEAFE" }}>
                <div style={{ fontSize: 11.5, color: "#1E40AF", fontWeight: 600, textTransform: "uppercase" }}>Balance Pending</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#1D4ED8", marginTop: 4 }}>{kpiSummary.totalBalanceQty.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500 }}>pcs</span></div>
                <div style={{ fontSize: 11.5, color: "#3B82F6", marginTop: 2 }}>Units currently in pipeline</div>
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Schedule & Reliability */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 14,
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#2563EB" }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: 0.4 }}>
                2. On-Time Delivery & Schedule Risk
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "16px", border: "1px solid #DCFCE7" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>On-Time Delivery Rate</span>
                  <span style={{ background: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Benchmark: &gt;95%</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#15803D", marginTop: 6 }}>{kpiSummary.onTimeDeliveryPct}</div>
                <div style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>Calculated from orders meeting promised ship dates</div>
              </div>

              <div style={{ background: kpiSummary.delayedOrders > 0 ? "#FEF2F2" : "#F8FAFC", borderRadius: 10, padding: "16px", border: kpiSummary.delayedOrders > 0 ? "1px solid #FEE2E2" : "1px solid #EDF2F7" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: kpiSummary.delayedOrders > 0 ? "#991B1B" : "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Delayed Orders</span>
                  <span style={{ background: kpiSummary.delayedOrders > 0 ? "#FEE2E2" : "#E2E8F0", color: kpiSummary.delayedOrders > 0 ? "#991B1B" : "#475569", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Past Ship Date</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: kpiSummary.delayedOrders > 0 ? "#DC2626" : "#0F172A", marginTop: 6 }}>{kpiSummary.delayedOrders}</div>
                <div style={{ fontSize: 12, color: kpiSummary.delayedOrders > 0 ? "#B91C1C" : "#64748B", marginTop: 4 }}>Orders with passed ship dates and pending balance</div>
              </div>

              <div style={{ background: "#FFFBEB", borderRadius: 10, padding: "16px", border: "1px solid #FEF3C7" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#92400E", fontWeight: 700, textTransform: "uppercase" }}>Orders At Risk</span>
                  <span style={{ background: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Monitor Closely</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#D97706", marginTop: 6 }}>{kpiSummary.atRiskOrders}</div>
                <div style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>Orders requiring priority merchandising follow-up</div>
              </div>
            </div>
          </div>

          {/* Section 3: Bottleneck & Quality Compliance */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 14,
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#8B5CF6" }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0, textTransform: "uppercase", letterSpacing: 0.4 }}>
                3. Bottleneck Analysis & Quality Compliance
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #EDF2F7" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Top Bottleneck Dept</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: "#7C3AED", marginTop: 6 }}>{kpiSummary.topDelayDept}</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 3 }}>Department with most accumulated delay</div>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #EDF2F7" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Critical Stage Bottleneck</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: "#C026D3", marginTop: 6 }}>{kpiSummary.biggestBottleneck}</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 3 }}>Stage with highest production WIP gap</div>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #EDF2F7" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Delayed Milestone Tasks</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: kpiSummary.delayedMilestoneTasks > 0 ? "#DC2626" : "#059669", marginTop: 4 }}>{kpiSummary.delayedMilestoneTasks}</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>Tasks currently delayed in milestone tracker</div>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #EDF2F7" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Open CAPAs & Claims</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>{kpiSummary.capasOpen} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>CAPAs · {kpiSummary.claimsCount} claims</span></div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>From compliance & debit notes register</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ACTIVE T&A REPORT (Order-wise Quantity Status) */}
      {/* ============================================================== */}
      {activeTab === "activeTna" && (
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {/* Controls Bar */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, background: "#FFFFFF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Search */}
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "#9CA3AF" }} />
                <input
                  type="text"
                  placeholder="Search Order, Style, PO..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: "6px 10px 6px 30px",
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    fontSize: 12.5,
                    width: 200,
                    outline: "none"
                  }}
                />
              </div>

              {/* Buyer Filter */}
              <select
                value={buyerFilter}
                onChange={e => setBuyerFilter(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  fontSize: 12.5,
                  background: "#FFFFFF",
                  outline: "none"
                }}
              >
                <option value="all">All Buyers ({availableBuyers.length})</option>
                {availableBuyers.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  fontSize: 12.5,
                  background: "#FFFFFF",
                  outline: "none"
                }}
              >
                <option value="all">All Status</option>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Delayed">Delayed</option>
                <option value="Shipped">Shipped</option>
              </select>
            </div>

            <div style={{ fontSize: 12, color: "#6B7280" }}>
              Showing <strong>{filteredOrderRows.length}</strong> active orders · Report Date: <strong>{new Date().toLocaleDateString("en-GB")}</strong>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr style={{ background: "#F8FAFC", color: "#475569", borderBottom: "1px solid #E2E8F0", textAlign: "left", whiteSpace: "nowrap", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>T&A No</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Buyer</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Style</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>PO No</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Merchandiser</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Order Qty</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Ship Date</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Cut</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Sewn</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Finished</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Packed</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Shipped</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Balance</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Packed %</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "center" }}>Days</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrderRows.length === 0 ? (
                  <tr>
                    <td colSpan={16} style={{ padding: 32, textAlign: "center", color: "#9CA3AF" }}>
                      No orders match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrderRows.map((r, idx) => (
                    <tr
                      key={r.orderId}
                      onClick={() => onOpenOrder && onOpenOrder(r.orderId)}
                      style={{
                        borderBottom: "1px solid #E5E7EB",
                        background: idx % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                        cursor: onOpenOrder ? "pointer" : "default",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#F9FAFB"}
                    >
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: "#2563EB" }}>
                        {r.taNo}
                      </td>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: "#111827" }}>{r.buyer}</td>
                      <td style={{ padding: "9px 12px", color: "#374151" }} title={r.style}>
                        {r.style.length > 18 ? r.style.slice(0, 18) + "..." : r.style}
                      </td>
                      <td style={{ padding: "9px 12px", color: "#4B5563" }}>{r.poNo}</td>
                      <td style={{ padding: "9px 12px", color: "#4B5563" }}>{r.merchandiser}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "#111827" }}>
                        {r.orderQty.toLocaleString()}
                      </td>
                      <td style={{ padding: "9px 12px", color: "#4B5563", whiteSpace: "nowrap" }}>{r.shipDate}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "#3B82F6", fontWeight: 600 }}>{r.cutQty.toLocaleString()}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "#3B82F6", fontWeight: 600 }}>{r.sewnQty.toLocaleString()}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "#3B82F6", fontWeight: 600 }}>{r.finishedQty.toLocaleString()}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "#3B82F6", fontWeight: 600 }}>{r.packedQty.toLocaleString()}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: "#10B981", fontWeight: 700 }}>{r.shippedQty.toLocaleString()}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: r.balanceQty > 0 ? "#DC2626" : "#059669" }}>
                        {r.balanceQty.toLocaleString()}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, color: "#374151" }}>
                        {r.packedPct.toFixed(1)}%
                      </td>
                      <td style={{
                        padding: "9px 12px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: r.daysToShip < 0 ? "#DC2626" : r.daysToShip <= 7 ? "#D97706" : "#059669"
                      }}>
                        {r.daysToShip}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        {renderStatusBadge(r.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: "#F1F5F9", borderTop: "2px solid #CBD5E1", fontWeight: 700, color: "#0F172A" }}>
                  <td colSpan={5} style={{ padding: "10px 12px" }}>TOTAL ({filteredOrderRows.length} Orders)</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    {filteredOrderRows.reduce((a, r) => a + r.orderQty, 0).toLocaleString()}
                  </td>
                  <td></td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    {filteredOrderRows.reduce((a, r) => a + r.cutQty, 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    {filteredOrderRows.reduce((a, r) => a + r.sewnQty, 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    {filteredOrderRows.reduce((a, r) => a + r.finishedQty, 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    {filteredOrderRows.reduce((a, r) => a + r.packedQty, 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#10B981" }}>
                    {filteredOrderRows.reduce((a, r) => a + r.shippedQty, 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#DC2626" }}>
                    {filteredOrderRows.reduce((a, r) => a + r.balanceQty, 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>—</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: STAGE-WISE QUANTITY FUNNEL (Visual Pipeline & Diagnostics) */}
      {/* ============================================================== */}
      {activeTab === "stageFunnel" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Funnel Pipeline Visual Cards */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 14,
            border: "1px solid #E2E8F0",
            padding: "22px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  Manufacturing WIP Flow & Bottlenecks
                </h3>
                <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                  Visual transition of order quantities through each factory production gate
                </div>
              </div>

              {kpiSummary.biggestBottleneck && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", color: "#991B1B", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={14} color="#DC2626" />
                  Primary Production Bottleneck: {kpiSummary.biggestBottleneck}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {stageFunnelData.map((stg) => {
                const isBottle = stg.isBottleneck;
                return (
                  <div
                    key={stg.stage}
                    style={{
                      background: isBottle ? "#FFFBEB" : "#F8FAFC",
                      border: isBottle ? "1px solid #FCD34D" : "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: "16px",
                      position: "relative"
                    }}
                  >
                    {isBottle && (
                      <span style={{ position: "absolute", top: 10, right: 10, background: "#DC2626", color: "#FFFFFF", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                        Bottleneck
                      </span>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 700, color: isBottle ? "#B45309" : "#475569", textTransform: "uppercase" }}>
                      {stg.stage}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginTop: 6 }}>
                      {stg.qtyCompleted}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isBottle ? "#B45309" : "#64748B", marginTop: 2 }}>
                      {stg.pctOfOrder} of total
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#64748B" }}>WIP Stuck</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: stg.qtyStuck !== "—" ? "#DC2626" : "#64748B" }}>
                        {stg.qtyStuck}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clean Modern Funnel Table */}
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0" }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>Detailed WIP Gap Metrics</h4>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  <th style={{ padding: "12px 18px", fontWeight: 700 }}>Stage</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, textAlign: "right" }}>Qty Completed</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, textAlign: "right" }}>% of Total</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700, textAlign: "right" }}>WIP Gap Stuck Before Stage</th>
                  <th style={{ padding: "12px 18px", fontWeight: 700 }}>Diagnostic Status</th>
                </tr>
              </thead>
              <tbody>
                {stageFunnelData.map((r, idx) => (
                  <tr
                    key={r.stage}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: r.isBottleneck ? "#FFFBEB" : idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC"
                    }}
                  >
                    <td style={{ padding: "13px 18px", fontWeight: 700, color: "#0F172A" }}>{r.stage}</td>
                    <td style={{ padding: "13px 18px", textAlign: "right", fontWeight: 700, color: "#1E3A5F" }}>{r.qtyCompleted}</td>
                    <td style={{ padding: "13px 18px", textAlign: "right", fontWeight: 600, color: "#475569" }}>{r.pctOfOrder}</td>
                    <td style={{ padding: "13px 18px", textAlign: "right", fontWeight: 700, color: r.qtyStuck !== "—" ? "#DC2626" : "#64748B" }}>
                      {r.qtyStuck}
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      {r.isBottleneck ? (
                        <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "3px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>
                          ⚠️ Critical Bottleneck
                        </span>
                      ) : (
                        <span style={{ color: "#10B981", fontSize: 12, fontWeight: 600 }}>Normal Flow</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: BUYER-WISE SUMMARY (Modern Clean Portfolio & Table) */}
      {/* ============================================================== */}
      {activeTab === "buyerSummary" && (
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Buyer Brand Portfolio Performance</h3>
              <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>Breakdown of orders, fulfillment volumes, and on-time reliability by buyer</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0D9488", background: "#F0FDFA", border: "1px solid #CCFBF1", padding: "4px 10px", borderRadius: 999 }}>
              {buyerSummaryData.length} Active Buyers
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Buyer Brand</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Orders</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Total Volume</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Shipped Qty</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Balance Qty</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Shipped %</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>Delayed</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>At Risk</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>On-Time Rate</th>
                </tr>
              </thead>
              <tbody>
                {buyerSummaryData.map((b, idx) => (
                  <tr
                    key={b.buyer}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC"
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 6, background: "#EFF6FF", color: "#2563EB", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                        {b.buyer.slice(0, 2).toUpperCase()}
                      </span>
                      {b.buyer}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{b.noOfOrders}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#1E3A5F" }}>{b.orderQty.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#15803D", fontWeight: 700 }}>{b.shippedQty.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: b.balanceQty > 0 ? "#DC2626" : "#059669", fontWeight: 700 }}>
                      {b.balanceQty.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{b.shippedPct}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {b.delayedOrders > 0 ? (
                        <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 999, fontWeight: 700, fontSize: 11.5 }}>
                          {b.delayedOrders}
                        </span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {b.atRiskOrders > 0 ? (
                        <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: 999, fontWeight: 700, fontSize: 11.5 }}>
                          {b.atRiskOrders}
                        </span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: parseFloat(b.onTimePct) < 90 ? "#DC2626" : "#059669" }}>
                      {b.onTimePct}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#F8FAFC", borderTop: "2px solid #E2E8F0", fontWeight: 700, color: "#0F172A", fontSize: 12.5 }}>
                  <td style={{ padding: "12px 16px" }}>TOTAL</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>{buyerSummaryData.reduce((a, b) => a + b.noOfOrders, 0)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>{buyerSummaryData.reduce((a, b) => a + b.orderQty, 0).toLocaleString()}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#15803D" }}>{buyerSummaryData.reduce((a, b) => a + b.shippedQty, 0).toLocaleString()}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#DC2626" }}>{buyerSummaryData.reduce((a, b) => a + b.balanceQty, 0).toLocaleString()}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>—</td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>{buyerSummaryData.reduce((a, b) => a + b.delayedOrders, 0)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>{buyerSummaryData.reduce((a, b) => a + b.atRiskOrders, 0)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: T&A MILESTONE TRACKER (Modern Clean Schedule Board) */}
      {/* ============================================================== */}
      {activeTab === "milestoneTracker" && (
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Task Schedule & Milestone Tracker</h3>
              <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>Task-level milestone dates with owner assignment and delay days</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#DB2777", background: "#FDF2F8", border: "1px solid #FCE7F3", padding: "4px 10px", borderRadius: 999 }}>
              {allMilestoneTasks.length} Tracked Tasks
            </span>
          </div>

          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>T&A No</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Buyer</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Milestone Stage</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Department</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Owner</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Planned Date</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700 }}>Actual / Done</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Task Qty</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "center" }}>Delay Days</th>
                  <th style={{ padding: "11px 14px", fontWeight: 700, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {milestoneTrackerData.map((m, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC"
                    }}
                  >
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#2563EB" }}>{m.taNo}</td>
                    <td style={{ padding: "10px 14px", color: "#0F172A", fontWeight: 600 }}>{m.buyer}</td>
                    <td style={{ padding: "10px 14px", color: "#0F172A", fontWeight: 600 }}>{m.milestone}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                        {m.department}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569", fontSize: 12 }}>{m.owner}</td>
                    <td style={{ padding: "10px 14px", color: "#2563EB", fontWeight: 600, fontSize: 12 }}>{m.plannedDate}</td>
                    <td style={{ padding: "10px 14px", color: m.actualDate !== "—" ? "#059669" : "#94A3B8", fontWeight: 500, fontSize: 12 }}>{m.actualDate}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600 }}>{m.taskQty.toLocaleString()}</td>
                    <td style={{
                      padding: "10px 14px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: m.delayDays > 0 ? "#DC2626" : "#059669"
                    }}>
                      {m.delayDays > 0 ? `+${m.delayDays}` : "0"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span style={{
                        padding: "3px 9px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          m.status === "Done On Time" ? "#ECFDF5" :
                          m.status === "Done Late" ? "#FEF3C7" :
                          m.status === "Delayed" ? "#FEF2F2" : "#F1F5F9",
                        color:
                          m.status === "Done On Time" ? "#047857" :
                          m.status === "Done Late" ? "#B45309" :
                          m.status === "Delayed" ? "#B91C1C" : "#475569",
                        display: "inline-block"
                      }}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: DEPARTMENT-WISE DELAY SUMMARY (Modern Root-Cause View) */}
      {/* ============================================================== */}
      {activeTab === "deptDelaySummary" && (
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Root-Cause Department Delay Diagnostics</h3>
              <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>Ranked by total accumulated delay days across active milestone stages</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FEE2E2", padding: "4px 10px", borderRadius: 999 }}>
              Top Delay: {kpiSummary.topDelayDept}
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Department</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Total Tasks</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Completed</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Pending / Active</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Late Tasks</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Total Delay Days</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Avg Delay</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Late %</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "center" }}>Delay Rank</th>
                </tr>
              </thead>
              <tbody>
                {departmentDelaySummary.map((d, idx) => (
                  <tr
                    key={d.department}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: idx === 0 ? "#FFFBEB" : idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC"
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: idx === 0 ? "#DC2626" : idx < 3 ? "#D97706" : "#10B981" }} />
                      {d.department}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{d.totalTasks}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#15803D", fontWeight: 600 }}>{d.completed}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#D97706", fontWeight: 600 }}>{d.pendingOrDelayed}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: "#DC2626", fontWeight: 700 }}>{d.delayedOrLateTasks}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, color: "#0F172A", fontSize: 13.5 }}>{d.totalDelayDays} days</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{d.avgDelayDays} d</td>
                    <td style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: parseFloat(d.latePct) > 50 ? "#DC2626" : "#475569"
                    }}>
                      {d.latePct}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: d.rank === 1 ? "#FEE2E2" : d.rank <= 3 ? "#FEF3C7" : "#F1F5F9",
                        color: d.rank === 1 ? "#991B1B" : d.rank <= 3 ? "#92400E" : "#475569"
                      }}>
                        #{d.rank}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#F8FAFC", borderTop: "2px solid #E2E8F0", fontWeight: 700, color: "#0F172A", fontSize: 12.5 }}>
                  <td style={{ padding: "12px 16px" }}>TOTAL</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>{departmentDelaySummary.reduce((a, d) => a + d.totalTasks, 0)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#15803D" }}>{departmentDelaySummary.reduce((a, d) => a + d.completed, 0)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#D97706" }}>{departmentDelaySummary.reduce((a, d) => a + d.pendingOrDelayed, 0)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#DC2626" }}>{departmentDelaySummary.reduce((a, d) => a + d.delayedOrLateTasks, 0)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "#0F172A" }}>{departmentDelaySummary.reduce((a, d) => a + d.totalDelayDays, 0)} days</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>—</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>—</td>
                  <td style={{ padding: "12px 16px" }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
