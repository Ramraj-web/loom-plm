import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertTriangle, Clock, Calendar, ChevronLeft, ChevronRight, X, ExternalLink,
  ShieldAlert, Volume2, VolumeX, ArrowRight, Eye, Sparkles, Layers, Scissors
} from "lucide-react";
import { computeOrderStageSchedules } from "./order/OrderWorkspace.jsx";
import { playNotificationSound, isSoundEnabled, setSoundEnabled } from "../utils/soundAlert.js";

// 5 minutes recurring alert interval as requested by user
const SNOOZE_DURATION_MS = 5 * 60 * 1000;
const STORAGE_SNOOZE_KEY = "loom_cutting_delay_snooze_until_5m";

// Format date range nicely (e.g. 24-29 Oct)
function formatDateRange(start, end) {
  if (!start) return "";
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sD = start.getDate();
  const sM = monthNames[start.getMonth()];
  if (!end || (start.getTime() === end.getTime())) {
    return `${sD} ${sM}`;
  }
  const eD = end.getDate();
  const eM = monthNames[end.getMonth()];
  if (start.getMonth() === end.getMonth()) {
    return `${sD}-${eD} ${sM}`;
  }
  return `${sD} ${sM} - ${eD} ${eM}`;
}

/**
 * Inspects an order and returns delay details if Cutting or any post-Cutting upcoming stage
 * has had its date modified / delayed.
 */
export function analyzeCuttingDelayForOrder(order) {
  if (!order || !Array.isArray(order.stages) || order.stages.length === 0) return null;
  if (order.status === "completed" || order.status === "cancelled" || order.completed === true || order.isDeleted === true) return null;

  const orderStartDate = order.orderDate || order.createdAt || order.ship;
  const schedules = computeOrderStageSchedules(order.stages, orderStartDate);

  // Locate Cutting stage
  let cuttingIdx = order.stages.findIndex(s => {
    const n = (s.name || s.label || "").trim().toLowerCase();
    const d = (s.dept || "").trim().toLowerCase();
    return n === "cutting" || d === "cutting" || n.includes("cutting");
  });

  if (cuttingIdx === -1) {
    if (order.stages.length > 21) {
      cuttingIdx = 21;
    } else {
      cuttingIdx = Math.min(order.stages.length - 1, 10);
    }
  }

  const cuttingStage = order.stages[cuttingIdx] || {};
  const cuttingSch = schedules[cuttingIdx] || {};

  // Inspect Cutting stage and all subsequent stages
  const affectedUpcomingStages = [];
  let maxShiftDays = Math.max(cuttingSch.shiftDays || 0, cuttingSch.doneDelayDays || 0);

  for (let i = cuttingIdx; i < order.stages.length; i++) {
    const stage = order.stages[i];
    const sch = schedules[i] || {};
    const shift = sch.shiftDays || sch.doneDelayDays || 0;
    if (shift > maxShiftDays) maxShiftDays = shift;

    const hasDateShift = shift > 0 || Boolean(sch.revisedDateStr);
    const hasReason = Boolean(stage.reason);
    const hasExplicitRevised = Boolean(stage.revisedDateStr || stage.delayedDate);

    // Overdue check (stage is pending/in_progress but past origEndDate)
    let isOverdue = false;
    if (stage.status !== "done" && sch.origEndDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const targetEnd = new Date(sch.origEndDate);
      targetEnd.setHours(0, 0, 0, 0);
      if (now > targetEnd) {
        isOverdue = true;
      }
    }

    if (hasDateShift || hasReason || hasExplicitRevised || isOverdue) {
      affectedUpcomingStages.push({
        stageIdx: i,
        stageNum: i + 1,
        name: stage.name || `Stage ${i + 1}`,
        dept: stage.dept || "Production",
        status: stage.status || "pending",
        planned: stage.planned || "—",
        origDateStr: sch.origStartDate ? formatDateRange(sch.origStartDate, sch.origEndDate) : (stage.planned || "—"),
        revisedDateStr: sch.revisedDateStr || (shift > 0 ? `+${shift}d delayed` : (isOverdue ? "Overdue" : null)),
        shiftDays: shift,
        reason: stage.reason || null,
        isOverdue,
        isCuttingItself: i === cuttingIdx
      });
    }
  }

  // Also detect if an upstream stage before Cutting caused the initial shift
  let triggerStage = null;
  if (cuttingSch.shiftDays > 0) {
    for (let j = 0; j < cuttingIdx; j++) {
      const st = order.stages[j];
      const sc = schedules[j] || {};
      if (sc.doneDelayDays > 0 || st.reason) {
        triggerStage = {
          name: st.name,
          dept: st.dept,
          delayDays: sc.doneDelayDays || 0,
          reason: st.reason
        };
        break;
      }
    }
  }

  // If Cutting or any post-cutting stage is affected, return the delay payload
  if (affectedUpcomingStages.length > 0 || maxShiftDays > 0) {
    const cuttingOrigDateStr = cuttingSch.origStartDate
      ? formatDateRange(cuttingSch.origStartDate, cuttingSch.origEndDate)
      : (cuttingStage.planned || "Day 37-42");

    return {
      orderId: order.id,
      style: order.style || order.styleNumber || order.name || `#${order.id}`,
      buyer: order.buyer || "Export Client",
      qty: order.qty || order.quantity || 0,
      targetShip: order.ship || "—",
      cuttingIdx,
      cuttingName: cuttingStage.name || "Cutting",
      cuttingPlanned: cuttingStage.planned || "Day 37-42",
      cuttingOrigDate: cuttingOrigDateStr,
      cuttingRevisedDate: cuttingSch.revisedDateStr || (cuttingSch.shiftDays > 0 ? `+${cuttingSch.shiftDays}d delayed` : null),
      cuttingShiftDays: cuttingSch.shiftDays || cuttingSch.doneDelayDays || 0,
      maxShiftDays,
      triggerStage,
      affectedStages: affectedUpcomingStages,
      allPostCuttingStages: order.stages.slice(cuttingIdx).map((st, relIdx) => {
        const absIdx = cuttingIdx + relIdx;
        const sch = schedules[absIdx] || {};
        return {
          absIdx,
          stageNum: absIdx + 1,
          name: st.name,
          dept: st.dept,
          status: st.status,
          planned: st.planned,
          origDateStr: sch.origStartDate ? formatDateRange(sch.origStartDate, sch.origEndDate) : (st.planned || "—"),
          revisedDateStr: sch.revisedDateStr,
          shiftDays: sch.shiftDays || sch.doneDelayDays || 0,
          reason: st.reason,
          isCutting: absIdx === cuttingIdx
        };
      })
    };
  }

  return null;
}

/**
 * Persistent warning banner for Admin & MD Dashboard
 */
export function CuttingDelayDashboardBanner({ delayedOrders = [], onOpenAlert, snoozedUntil }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!delayedOrders || delayedOrders.length === 0) return null;

  const isSnoozed = snoozedUntil && now < snoozedUntil;
  const remainingSec = isSnoozed ? Math.max(0, Math.ceil((snoozedUntil - now) / 1000)) : 0;
  const remMin = Math.floor(remainingSec / 60);
  const remSec = remainingSec % 60;
  const formattedCountdown = `${remMin}:${remSec < 10 ? "0" : ""}${remSec}`;

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #7F1D1D 0%, #991B1B 60%, #B91C1C 100%)",
        color: "#FFFFFF",
        padding: "12px 20px",
        borderRadius: 14,
        marginBottom: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        boxShadow: "0 6px 20px rgba(185, 28, 28, 0.35)",
        border: "1.5px solid #EF4444",
        animation: "pulse 3s infinite"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <AlertTriangle size={20} color="#FEF08A" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
              ⚠️ Cutting & Upcoming Stage Delay Warning ({delayedOrders.length} {delayedOrders.length === 1 ? "Order" : "Orders"} Modified)
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: isSnoozed ? "rgba(254, 240, 138, 0.25)" : "rgba(239, 68, 68, 0.9)",
                color: isSnoozed ? "#FEF08A" : "#FFFFFF",
                padding: "2px 9px",
                borderRadius: 999,
                border: "1px solid rgba(255, 255, 255, 0.35)"
              }}
            >
              {isSnoozed ? `Snoozed (Next alert in ${formattedCountdown})` : "Active 5-Min Full Screen Warning"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#FECACA", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Orders with modified cutting/downstream dates: {delayedOrders.map(d => `#${d.orderId} (+${d.maxShiftDays}d)`).join(", ")}.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenAlert}
        style={{
          background: "#FFFFFF",
          color: "#991B1B",
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          fontSize: 12.5,
          fontWeight: 800,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
          flexShrink: 0,
          transition: "transform 0.15s ease"
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <Eye size={15} />
        <span>Open Full Screen Alert</span>
      </button>
    </div>
  );
}

/**
 * Full-screen Emergency Warning Modal for Admin & MD
 * Pops up automatically every 5 minutes when Cutting or post-Cutting stages are delayed.
 * Displays affected orders one by one with navigation, date comparison, and downstream cascade.
 */
export default function CuttingDelayAlertModal({
  orders = [],
  role = {},
  activeUser = {},
  onOpenOrder
}) {
  // Check if current user is Admin or MD
  const isMDOrAdmin = useMemo(() => {
    const isMD = Boolean(
      role?.isMD ||
      role?.dept === "Executive" ||
      role?.dept === "Executive (MD)" ||
      role?.fullAccess ||
      (role?.label && /(^|[^a-z])md([^a-z]|$)|managing director/i.test(role.label)) ||
      (activeUser?.name && /(^|[^a-z])md([^a-z]|$)|managing director/i.test(activeUser.name)) ||
      (activeUser?.email && /(^|[^a-z])md([^a-z]|$)|managing director/i.test(activeUser.email)) ||
      activeUser?.isMD === true
    );

    const isAdmin = Boolean(
      role?.fullAccess ||
      role?.dept === "Administrators" ||
      (role?.label && role.label.toLowerCase().includes("admin")) ||
      (activeUser?.username && activeUser.username.toLowerCase() === "admin") ||
      activeUser?.teamId === "team-admin" ||
      (activeUser?.name && activeUser.name.toLowerCase().includes("admin"))
    );

    return isMD || isAdmin;
  }, [role, activeUser]);

  // Analyze all active orders for Cutting and post-cutting delays
  const delayedOrders = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) return [];
    const res = [];
    for (const ord of orders) {
      const analysis = analyzeCuttingDelayForOrder(ord);
      if (analysis) res.push(analysis);
    }
    return res;
  }, [orders]);

  const [isOpen, setIsOpen] = useState(false);
  const [currentOrderIdx, setCurrentOrderIdx] = useState(0);
  const [snoozedUntil, setSnoozedUntil] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SNOOZE_KEY);
      if (stored) {
        const val = Number(stored);
        if (!isNaN(val) && val > Date.now()) return val;
      }
    } catch (e) {}
    return 0;
  });

  const [soundEnabled, setLocalSoundEnabled] = useState(() => isSoundEnabled());
  const [now, setNow] = useState(Date.now());
  const [openedAt, setOpenedAt] = useState(null);
  const [autoDismissEnabled, setAutoDismissEnabled] = useState(true);

  // Track when modal was opened
  useEffect(() => {
    if (isOpen) {
      setOpenedAt(Date.now());
    } else {
      setOpenedAt(null);
    }
  }, [isOpen]);

  // Listen for manual trigger from dashboard banner
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
      playNotificationSound("critical");
    };
    window.addEventListener("loom_open_cutting_alert", handleOpenModal);
    return () => window.removeEventListener("loom_open_cutting_alert", handleOpenModal);
  }, []);

  // Keep countdown ticking
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Recurring 5-minute check
  useEffect(() => {
    if (!isMDOrAdmin) {
      setIsOpen(false);
      return;
    }

    const checkInterval = setInterval(() => {
      const curTime = Date.now();
      let activeSnooze = 0;
      try {
        const stored = localStorage.getItem(STORAGE_SNOOZE_KEY);
        if (stored) activeSnooze = Number(stored) || 0;
      } catch (e) {}

      if (curTime >= activeSnooze && delayedOrders.length > 0) {
        // Time to trigger recurring 5-min alert!
        setIsOpen(prev => {
          if (!prev) {
            playNotificationSound("critical");
          }
          return true;
        });
      }
    }, 5000); // Check every 5 seconds

    // Initial check on load or when delayedOrders first detected
    const curTime = Date.now();
    let activeSnooze = 0;
    try {
      const stored = localStorage.getItem(STORAGE_SNOOZE_KEY);
      if (stored) activeSnooze = Number(stored) || 0;
    } catch (e) {}

    if (curTime >= activeSnooze && delayedOrders.length > 0) {
      setIsOpen(true);
      playNotificationSound("critical");
    }

    return () => clearInterval(checkInterval);
  }, [isMDOrAdmin, delayedOrders.length]);

  // Snooze handler (5 minutes)
  const handleAcknowledgeAndSnooze = useCallback((durationMs = SNOOZE_DURATION_MS) => {
    const nextSnooze = Date.now() + durationMs;
    setSnoozedUntil(nextSnooze);
    try {
      localStorage.setItem(STORAGE_SNOOZE_KEY, String(nextSnooze));
    } catch (e) {}
    setIsOpen(false);
  }, []);

  // Auto-close after 5 minutes if left unattended on screen
  useEffect(() => {
    if (!isOpen || !openedAt || !autoDismissEnabled) return;
    const elapsed = now - openedAt;
    if (elapsed >= 5 * 60 * 1000) {
      handleAcknowledgeAndSnooze();
    }
  }, [isOpen, openedAt, now, autoDismissEnabled, handleAcknowledgeAndSnooze]);

  // Bounds check on current order index
  useEffect(() => {
    if (currentOrderIdx >= delayedOrders.length && delayedOrders.length > 0) {
      setCurrentOrderIdx(0);
    }
  }, [delayedOrders.length, currentOrderIdx]);

  // Direct Review order action
  const handleReviewOrder = useCallback((orderId) => {
    // Snooze for 5 minutes while reviewing order
    handleAcknowledgeAndSnooze(SNOOZE_DURATION_MS);
    if (onOpenOrder) {
      onOpenOrder(orderId);
    }
  }, [handleAcknowledgeAndSnooze, onOpenOrder]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setLocalSoundEnabled(next);
    setSoundEnabled(next);
    if (next) playNotificationSound("medium");
  };

  // Keyboard navigation: Left/Right arrows, Escape to close/snooze
  useEffect(() => {
    if (!isOpen || delayedOrders.length <= 1) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setCurrentOrderIdx(prev => (prev > 0 ? prev - 1 : delayedOrders.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentOrderIdx(prev => (prev < delayedOrders.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        handleAcknowledgeAndSnooze();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, delayedOrders.length, handleAcknowledgeAndSnooze]);

  if (!isMDOrAdmin || !isOpen || delayedOrders.length === 0) {
    return null;
  }

  const currentOrder = delayedOrders[currentOrderIdx] || delayedOrders[0];
  if (!currentOrder) return null;

  const autoDismissRemainingSec = openedAt && autoDismissEnabled
    ? Math.max(0, Math.ceil((openedAt + 5 * 60 * 1000 - now) / 1000))
    : 0;
  const autoDismissMin = Math.floor(autoDismissRemainingSec / 60);
  const autoDismissSec = autoDismissRemainingSec % 60;
  const formattedAutoDismiss = `${autoDismissMin}:${autoDismissSec < 10 ? "0" : ""}${autoDismissSec}`;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        background: "rgba(10, 15, 29, 0.95)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 32px",
        overflowY: "auto",
        animation: "fadeIn 0.2s ease-out"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1040,
          background: "#0F172A",
          border: "2px solid #EF4444",
          borderRadius: 22,
          boxShadow: "0 30px 80px -15px rgba(220, 38, 38, 0.5), 0 0 50px rgba(239, 68, 68, 0.3)",
          color: "#F8FAFC",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh"
        }}
      >
        {/* Fullscreen Header Bar */}
        <div
          style={{
            background: "linear-gradient(90deg, #991B1B 0%, #7F1D1D 50%, #450A0A 100%)",
            padding: "18px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(239, 68, 68, 0.35)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid rgba(255, 255, 255, 0.35)",
                flexShrink: 0
              }}
            >
              <ShieldAlert size={26} color="#FEE2E2" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    background: "#EF4444",
                    color: "#FFFFFF",
                    padding: "3px 9px",
                    borderRadius: 6,
                    letterSpacing: 0.8,
                    textTransform: "uppercase"
                  }}
                >
                  FULL SCREEN WARNING ALERT
                </span>
                <span style={{ fontSize: 11.5, color: "#FECACA", fontWeight: 700 }}>
                  Recurring every 5 mins for Admin & MD
                </span>
                {/* Auto-dismiss countdown badge */}
                <button
                  type="button"
                  onClick={() => setAutoDismissEnabled(prev => !prev)}
                  style={{
                    fontSize: 11,
                    color: autoDismissEnabled ? "#FEF08A" : "#CBD5E1",
                    background: autoDismissEnabled ? "rgba(0, 0, 0, 0.35)" : "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: 20,
                    padding: "2px 10px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5
                  }}
                  title="Click to toggle: Auto-close after 5 minutes vs Keep open until acknowledged"
                >
                  <Clock size={12} />
                  <span>
                    {autoDismissEnabled ? `Auto-closing in ${formattedAutoDismiss}` : "Stay Open (Manual Close)"}
                  </span>
                </button>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", marginTop: 3 }}>
                Cutting & Downstream Production Stages Date Modified
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              title={soundEnabled ? "Mute Alert Sounds" : "Unmute Alert Sounds"}
              style={{
                background: "rgba(255, 255, 255, 0.14)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 9,
                color: "#FFFFFF",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} color="#FCA5A5" />}
            </button>

            {/* Snooze / Close */}
            <button
              type="button"
              onClick={() => handleAcknowledgeAndSnooze()}
              title="Acknowledge and snooze for 5 minutes"
              style={{
                background: "rgba(255, 255, 255, 0.14)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 9,
                color: "#FFFFFF",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Order Pagination Bar (One by One) */}
        <div
          style={{
            background: "#1E293B",
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #334155"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.4 }}>
              Delayed Orders ({delayedOrders.length}):
            </span>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", maxWidth: 560 }}>
              {delayedOrders.map((ord, idx) => (
                <button
                  key={ord.orderId}
                  type="button"
                  onClick={() => setCurrentOrderIdx(idx)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: currentOrderIdx === idx ? "1.5px solid #EF4444" : "1px solid #334155",
                    background: currentOrderIdx === idx ? "#7F1D1D" : "#0F172A",
                    color: currentOrderIdx === idx ? "#FFFFFF" : "#94A3B8",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>#{ord.orderId}</span>
                  <span style={{ fontSize: 10.5, color: "#FCA5A5", fontWeight: 800 }}>+{ord.maxShiftDays}d</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#E2E8F0" }}>
              Order {currentOrderIdx + 1} of {delayedOrders.length}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                disabled={currentOrderIdx === 0}
                onClick={() => setCurrentOrderIdx(prev => Math.max(0, prev - 1))}
                style={{
                  background: currentOrderIdx === 0 ? "#334155" : "#475569",
                  border: "none",
                  borderRadius: 7,
                  color: "#FFFFFF",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: currentOrderIdx === 0 ? "not-allowed" : "pointer"
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                disabled={currentOrderIdx === delayedOrders.length - 1}
                onClick={() => setCurrentOrderIdx(prev => Math.min(delayedOrders.length - 1, prev + 1))}
                style={{
                  background: currentOrderIdx === delayedOrders.length - 1 ? "#334155" : "#475569",
                  border: "none",
                  borderRadius: 7,
                  color: "#FFFFFF",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: currentOrderIdx === delayedOrders.length - 1 ? "not-allowed" : "pointer"
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body: Current Order Inspection */}
        <div style={{ padding: "22px 28px", overflowY: "auto", flex: 1 }}>
          {/* Order Details Header Card */}
          <div
            style={{
              background: "#1E293B",
              borderRadius: 14,
              padding: "18px 22px",
              border: "1px solid #334155",
              display: "grid",
              gridTemplateColumns: "1.4fr 1.2fr 1.1fr 1fr",
              gap: 16,
              alignItems: "center",
              marginBottom: 18
            }}
          >
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                Order Number & Style
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#F8FAFC", marginTop: 2 }}>
                #{currentOrder.orderId}
              </div>
              <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 2, fontWeight: 600 }}>
                {currentOrder.style}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                Buyer / Customer
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC", marginTop: 2 }}>
                {currentOrder.buyer}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                Order Qty: <span style={{ color: "#F8FAFC", fontWeight: 700 }}>{Number(currentOrder.qty).toLocaleString()} pcs</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                Target Shipment
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC", marginTop: 2 }}>
                {currentOrder.targetShip}
              </div>
              <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 800, marginTop: 2 }}>
                Schedule Delay: +{currentOrder.maxShiftDays} Days
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                onClick={() => handleReviewOrder(currentOrder.orderId)}
                style={{
                  background: "#4F46E5",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.45)",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#4338CA"}
                onMouseLeave={e => e.currentTarget.style.background = "#4F46E5"}
              >
                <span>Review Order</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>

          {/* Primary Cutting Delay Alert Card */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(127, 29, 29, 0.35) 0%, rgba(30, 41, 59, 0.8) 100%)",
              border: "2px solid #EF4444",
              borderRadius: 16,
              padding: "18px 22px",
              marginBottom: 20
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#7F1D1D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #DC2626",
                    flexShrink: 0
                  }}
                >
                  <Scissors size={20} color="#FEF08A" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Stage Delay: {currentOrder.cuttingName}</span>
                    <span style={{ fontSize: 11.5, background: "#DC2626", color: "#FFFFFF", padding: "3px 9px", borderRadius: 999, fontWeight: 800 }}>
                      +{currentOrder.maxShiftDays} Days Schedule Slip
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#FECACA", marginTop: 4 }}>
                    {currentOrder.triggerStage
                      ? `Pushed by previous stage delay: ${currentOrder.triggerStage.name} (+${currentOrder.triggerStage.delayDays}d)`
                      : `Cutting date modified. This slips all downstream milestones towards target shipment.`}
                  </div>
                </div>
              </div>

              {/* Date Comparison Box */}
              <div
                style={{
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14
                }}
              >
                <div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Original Planned</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#CBD5E1" }}>{currentOrder.cuttingOrigDate}</div>
                </div>
                <ArrowRight size={18} color="#EF4444" />
                <div>
                  <div style={{ fontSize: 10.5, color: "#FCA5A5", fontWeight: 700, textTransform: "uppercase" }}>New Shifted Date</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#EF4444" }}>
                    {currentOrder.cuttingRevisedDate || `${currentOrder.cuttingOrigDate} (+${currentOrder.maxShiftDays}d)`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cascade Table: Cutting & All Upcoming Downstream Stages */}
          <div style={{ background: "#1E293B", borderRadius: 16, padding: "18px 22px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#F8FAFC", display: "flex", alignItems: "center", gap: 7 }}>
                  <Calendar size={15} color="#818CF8" />
                  <span>Cascade Impact on Cutting & Downstream Stages</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
                  Shows the ripple effect on upcoming stages due to the Cutting schedule modification.
                </div>
              </div>
              <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 600 }}>
                {currentOrder.allPostCuttingStages.length} downstream stages tracked
              </span>
            </div>

            <div style={{ overflowX: "auto", maxHeight: 270, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155", color: "#94A3B8", textAlign: "left", fontSize: 11, textTransform: "uppercase" }}>
                    <th style={{ padding: "9px 12px" }}>#</th>
                    <th style={{ padding: "9px 12px" }}>Stage Name</th>
                    <th style={{ padding: "9px 12px" }}>Dept</th>
                    <th style={{ padding: "9px 12px" }}>Original Planned</th>
                    <th style={{ padding: "9px 12px" }}>New Shifted Date</th>
                    <th style={{ padding: "9px 12px", textAlign: "center" }}>Schedule Shift</th>
                    <th style={{ padding: "9px 12px", textAlign: "right" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.allPostCuttingStages.map(st => {
                    const isDelayed = st.shiftDays > 0 || Boolean(st.revisedDateStr);
                    const isCutting = st.isCutting;

                    return (
                      <tr
                        key={st.absIdx}
                        style={{
                          borderBottom: "1px solid #283548",
                          background: isCutting ? "rgba(220, 38, 38, 0.15)" : isDelayed ? "rgba(239, 68, 68, 0.06)" : "transparent"
                        }}
                      >
                        <td style={{ padding: "9px 12px", color: isCutting ? "#FCA5A5" : "#64748B", fontWeight: 700 }}>
                          {st.stageNum}
                        </td>
                        <td style={{ padding: "9px 12px", fontWeight: isCutting ? 800 : 600, color: isCutting ? "#FFFFFF" : "#E2E8F0" }}>
                          {st.name} {isCutting && <span style={{ fontSize: 10, background: "#DC2626", color: "#fff", padding: "1px 7px", borderRadius: 4, marginLeft: 6 }}>CUTTING</span>}
                        </td>
                        <td style={{ padding: "9px 12px", color: "#94A3B8", fontSize: 11.5 }}>
                          {st.dept}
                        </td>
                        <td style={{ padding: "9px 12px", color: "#CBD5E1" }}>
                          {st.origDateStr}
                        </td>
                        <td style={{ padding: "9px 12px", fontWeight: 700, color: isDelayed ? "#EF4444" : "#10B981" }}>
                          {st.revisedDateStr || st.origDateStr}
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "center" }}>
                          {st.shiftDays > 0 ? (
                            <span style={{ background: "#7F1D1D", color: "#FECACA", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                              +{st.shiftDays}d
                            </span>
                          ) : (
                            <span style={{ color: "#10B981", fontSize: 11.5, fontWeight: 600 }}>On Plan</span>
                          )}
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 6,
                              textTransform: "capitalize",
                              background: st.status === "done" ? "#064E3B" : st.status === "in_progress" ? "#78350F" : "#1E293B",
                              color: st.status === "done" ? "#6EE7B7" : st.status === "in_progress" ? "#FDE68A" : "#94A3B8",
                              border: "1px solid rgba(255, 255, 255, 0.1)"
                            }}
                          >
                            {st.status?.replace("_", " ") || "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            background: "#0F172A",
            padding: "18px 28px",
            borderTop: "1px solid #334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Clock size={15} color="#EF4444" />
            <span style={{ fontSize: 12, color: "#CBD5E1" }}>
              Alert triggers every <b>5 minutes</b> for Admin and MD until resolved.
            </span>
            <span style={{ fontSize: 11, color: autoDismissEnabled ? "#FEF08A" : "#94A3B8" }}>
              {autoDismissEnabled ? `• Auto-closing in ${formattedAutoDismiss} if untouched` : `• Persistent on screen`}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* If multiple orders, Next Order button */}
            {delayedOrders.length > 1 && currentOrderIdx < delayedOrders.length - 1 && (
              <button
                type="button"
                onClick={() => setCurrentOrderIdx(prev => prev + 1)}
                style={{
                  background: "#334155",
                  color: "#FFFFFF",
                  border: "1px solid #475569",
                  borderRadius: 10,
                  padding: "9px 16px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Next Order ({delayedOrders.length - currentOrderIdx - 1} remaining) →
              </button>
            )}

            {/* Acknowledge & Snooze 5 Mins */}
            <button
              type="button"
              onClick={() => handleAcknowledgeAndSnooze()}
              style={{
                background: "transparent",
                color: "#CBD5E1",
                border: "1px solid #475569",
                borderRadius: 10,
                padding: "9px 16px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#94A3B8"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#475569"}
            >
              <Clock size={14} />
              <span>Acknowledge & Snooze for 5 Mins</span>
            </button>

            {/* Review in Order Workspace */}
            <button
              type="button"
              onClick={() => handleReviewOrder(currentOrder.orderId)}
              style={{
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(220, 38, 38, 0.45)"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#B91C1C"}
              onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)"}
            >
              <ExternalLink size={15} />
              <span>Go to Order #{currentOrder.orderId}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
