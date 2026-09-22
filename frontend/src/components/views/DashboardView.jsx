import React, { useState, useMemo, useEffect } from "react";
import {
  Package, CheckCircle2, TriangleAlert, ArrowDownRight, Zap, Factory, Clock, CircleAlert,
  Calendar, CheckSquare, Layers, ShieldCheck, Bell, DollarSign, ChevronRight, ChevronLeft, Truck, Users, X, Trash2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import {
  SHIPMENT_PERFORMANCE, computeMonthlyShipmentPerformance, TA_STAGES, STAGE_ICON_SET_BASE, ORG_STRUCTURE, RISK_DELAY_DAYS,
  collectActivitiesForDate, formatDisplayDate, isSameDay, computeDynamicOrderRisk, parseShipDateSafe
} from "../../constants/loomData.js";
import {
  Card, CardHeader, PageHeader, statusPill, riskDot, collectTasks
} from "../common/CommonUI.jsx";
import { analyzeCuttingDelayForOrder, CuttingDelayDashboardBanner } from "../CuttingDelayAlertModal.jsx";

export function DateWiseActivityFeed({
  selectedDate,
  orders = [],
  customTasks = [],
  compliances = [],
  certifications = [],
  supplierWork = [],
  notifications = [],
  leaveRequests = [],
  debitNotes = [],
  capas = [],
  attendance = {},
  onOpenOrder,
  onNavigate
}) {
  const [activeTab, setActiveTab] = useState("All");

  const allActivities = useMemo(() => {
    return collectActivitiesForDate(selectedDate, {
      orders,
      tasks: customTasks,
      compliances,
      certifications,
      supplierWork,
      notifications,
      leaveRequests,
      debitNotes,
      capas,
      attendance
    });
  }, [selectedDate, orders, customTasks, compliances, certifications, supplierWork, notifications, leaveRequests, debitNotes, capas, attendance]);

  const [activitySearch, setActivitySearch] = useState("");

  const filteredActivities = useMemo(() => {
    let list = allActivities;
    if (activeTab !== "All") {
      list = list.filter(a => a.category === activeTab);
    }
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      list = list.filter(a =>
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.dept && a.dept.toLowerCase().includes(q)) ||
        (a.actor && a.actor.toLowerCase().includes(q)) ||
        (a.orderId && a.orderId.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allActivities, activeTab, activitySearch]);

  const counts = useMemo(() => {
    const res = { All: allActivities.length, Orders: 0, "Tasks & T&A": 0, "Supplier Work": 0, "Quality & Compliance": 0, Notifications: 0 };
    allActivities.forEach(a => {
      if (res[a.category] !== undefined) res[a.category]++;
    });
    return res;
  }, [allActivities]);

  const formattedDate = formatDisplayDate(selectedDate);

  const getActivityIcon = (type) => {
    if (type === "order") return <Package size={13} color="#378ADD" />;
    if (type === "tna") return <Calendar size={13} color="#534AB7" />;
    if (type === "task") return <CheckSquare size={13} color="#1F9E8D" />;
    if (type === "supplier") return <Layers size={13} color="#8B5CF6" />;
    if (type === "compliance" || type === "certification") return <ShieldCheck size={13} color="#059669" />;
    if (type === "notification") return <Bell size={13} color="#DC2626" />;
    if (type === "financial") return <DollarSign size={13} color="#D97706" />;
    return <Clock size={13} color="#8A8D98" />;
  };

  const getStatusBadge = (act) => {
    if (!act.status) return null;
    if (typeof act.status === "object") return act.status;
    const s = String(act.status).toLowerCase();
    if (s.includes("done") || s.includes("passed") || s.includes("completed") || s.includes("approved")) {
      return <span style={{ background: "#E1F5EE", color: "#085041", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{act.status}</span>;
    }
    if (s.includes("delayed") || s.includes("critical") || s.includes("fail") || s.includes("issue")) {
      return <span style={{ background: "#FCEBEB", color: "#791F1F", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{act.status}</span>;
    }
    if (s.includes("progress") || s.includes("high") || s.includes("risk")) {
      return <span style={{ background: "#FAEEDA", color: "#633806", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{act.status}</span>;
    }
    return <span style={{ background: "#F0F0F2", color: "#565A66", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999 }}>{act.status}</span>;
  };



  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: "#1B2130" }}>Date-Wise Work & Activity History</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, background: "#F0EFFB", color: "#534AB7", padding: "3px 10px", borderRadius: 999, display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={12} /> {formattedDate}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#8A8D98", marginTop: 3 }}>
            Showing complete work, orders, tasks, stage completions, quality audits, and supplier activities recorded on {formattedDate}
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: allActivities.length > 0 ? "#1F9E8D" : "#8A8D98" }}>
          {allActivities.length} {allActivities.length === 1 ? "activity" : "activities"} logged
        </div>
      </div>

      {/* Category Tabs & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { key: "All", label: `All (${counts.All})` },
            { key: "Orders", label: `Orders (${counts.Orders})` },
            { key: "Tasks & T&A", label: `Tasks & T&A (${counts["Tasks & T&A"]})` },
            { key: "Supplier Work", label: `Supplier Work (${counts["Supplier Work"]})` },
            { key: "Quality & Compliance", label: `Quality & Compliance (${counts["Quality & Compliance"]})` },
            { key: "Notifications", label: `Notifications (${counts.Notifications})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                borderColor: activeTab === tab.key ? "#534AB7" : "#E5E7EB",
                background: activeTab === tab.key ? "#F0EFFB" : "transparent",
                color: activeTab === tab.key ? "#534AB7" : "#565A66",
                transition: "all 0.12s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {allActivities.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="text"
              placeholder="Search day's history..."
              value={activitySearch}
              onChange={e => setActivitySearch(e.target.value)}
              style={{
                padding: "4px 10px",
                fontSize: 11.5,
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                background: "transparent",
                color: "inherit",
                width: 170,
                outline: "none"
              }}
            />
            {activitySearch && (
              <button
                onClick={() => setActivitySearch("")}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 11,
                  color: "#8A8D98",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Activity Table / Empty State */}
      {filteredActivities.length === 0 ? (
        <div style={{ padding: "36px 16px", textAlign: "center" }}>
          <div style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(148, 163, 184, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Calendar size={18} color="#8A8D98" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>
            No activity found for {formattedDate}.
          </div>
          <div style={{ fontSize: 12, color: "#8A8D98", marginTop: 4, maxWidth: 440, margin: "4px auto 0" }}>
            No orders, tasks, stage progress, quality audits, or supplier assignments were recorded on this date. Select another date from the top header date picker or record activities today.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "grid", gridTemplateColumns: "85px 1.4fr 1.6fr 1.1fr 1fr 1fr", fontSize: 11, color: "#8A8D98", padding: "0 6px 8px", borderBottom: "1px solid #F0F0F2" }}>
            <div>Time</div>
            <div>Activity / Title</div>
            <div>Details & Scope</div>
            <div>Department</div>
            <div>Status</div>
            <div style={{ textAlign: "right" }}>Action</div>
          </div>

          {filteredActivities.map((act) => (
            <div
              key={act.id}
              style={{
                display: "grid",
                gridTemplateColumns: "85px 1.4fr 1.6fr 1.1fr 1fr 1fr",
                alignItems: "center",
                fontSize: 12,
                padding: "9px 6px",
                borderBottom: "1px solid #F5F5F7",
                transition: "background 0.12s ease"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#8A8D98", fontSize: 11, fontFamily: "monospace" }}>
                <Clock size={11} color="#94A3B8" />
                {act.time}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 7, paddingRight: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {getActivityIcon(act.type)}
                </div>
                <div style={{ fontWeight: 600, color: "#1B2130", lineHeight: 1.3 }}>
                  {act.title}
                </div>
              </div>

              <div style={{ fontSize: 11.5, color: "#565A66", paddingRight: 8, lineHeight: 1.35 }}>
                {act.description}
              </div>

              <div>
                <span style={{ fontSize: 11, color: "#534AB7", fontWeight: 600, background: "#F0EFFB", padding: "2px 7px", borderRadius: 6 }}>
                  {act.dept || "General"}
                </span>
              </div>

              <div>
                {getStatusBadge(act)}
              </div>

              <div style={{ textAlign: "right" }}>
                {act.orderId ? (
                  <button
                    onClick={() => onOpenOrder && onOpenOrder(act.orderId)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#378ADD",
                      fontWeight: 600,
                      fontSize: 11.5,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2
                    }}
                  >
                    View Order →
                  </button>
                ) : act.targetModule ? (
                  <button
                    onClick={() => onNavigate && onNavigate(act.targetModule)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1F9E8D",
                      fontWeight: 600,
                      fontSize: 11.5,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2
                    }}
                  >
                    Open View →
                  </button>
                ) : (
                  <span style={{ color: "#B0B2BA", fontSize: 11 }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function OrderDeliveryCalendarWidget({ orders = [], onOpenOrder, onNavigate }) {
  const [viewMode, setViewMode] = useState("milestones");
  const today = useMemo(() => new Date(), []);

  const activeOrders = useMemo(() => {
    return (orders || []).filter(o => o && o.isDeleted !== true && o.isDeleted !== "true" && !o.deletedAt && !o.completed);
  }, [orders]);

  // Compute upcoming shipments sorted by ship date
  const upcomingShipments = useMemo(() => {
    const list = [];
    activeOrders.forEach(o => {
      if (!o.ship) return;
      const d = new Date(o.ship);
      if (isNaN(d.getTime())) return;
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const inProgStage = (o.stages || []).find(s => s.status === "in_progress") ||
        (o.stages || []).find(s => s.status === "pending") ||
        (o.stages || [])[0];
      const doneCount = (o.stages || []).filter(s => s.status === "done").length;
      const totalCount = (o.stages || []).length || 1;
      const pct = Math.round((doneCount / totalCount) * 100);

      list.push({
        order: o,
        shipDate: d,
        shipDateStr: o.ship,
        diffDays,
        inProgStage,
        pct,
        doneCount,
        totalCount
      });
    });

    return list.sort((a, b) => a.shipDate - b.shipDate);
  }, [activeOrders, today]);

  // Month navigation state: default to earliest active shipment month (e.g. December 2026), or today's month
  const [currentYear, setCurrentYear] = useState(() => {
    if (upcomingShipments.length > 0) return upcomingShipments[0].shipDate.getFullYear();
    return today.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (upcomingShipments.length > 0) return upcomingShipments[0].shipDate.getMonth();
    return today.getMonth();
  });
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDateKey(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDateKey(null);
  };

  const jumpToMonth = (y, m) => {
    setCurrentYear(y);
    setCurrentMonth(m);
    setSelectedDateKey(null);
  };

  // Map orders by their parsed shipment dates
  const ordersByShipDate = useMemo(() => {
    const map = {};
    activeOrders.forEach(o => {
      if (!o.ship) return;
      const d = new Date(o.ship);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [activeOrders]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Calendar cells generation for currentYear / currentMonth
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    // Prev month padding
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        key: null
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isToday =
        today.getFullYear() === currentYear &&
        today.getMonth() === currentMonth &&
        today.getDate() === day;
      const shippingOrders = ordersByShipDate[key] || [];

      days.push({
        day,
        isCurrentMonth: true,
        isToday,
        key,
        shippingOrders
      });
    }

    // Trailing padding to make complete rows (35 or 42 cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        key: null
      });
    }

    return days;
  }, [currentYear, currentMonth, today, ordersByShipDate]);

  const selectedDayOrders = useMemo(() => {
    if (!selectedDateKey) return [];
    return ordersByShipDate[selectedDateKey] || [];
  }, [selectedDateKey, ordersByShipDate]);

  const getOrderStatusBadge = (status) => {
    const s = String(status || "At Risk");
    if (s === "On Track") return { bg: "#ECFDF5", fg: "#065F46", border: "#A7F3D0" };
    if (s === "Delayed") return { bg: "#FEF2F2", fg: "#991B1B", border: "#FECACA" };
    return { bg: "#FFFBEB", fg: "#92400E", border: "#FDE68A" };
  };

  return (
    <Card style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px 18px", boxSizing: "border-box" }}>
      {/* Header with Title, Mode Switcher & Calendar Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={16} color="#4F46E5" />
            <span>Delivery Schedule & Milestones</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            Real production shipment deadlines & active stage progress
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View Mode Toggle Button Group */}
          <div style={{ display: "inline-flex", background: "#F1F5F9", padding: "2px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <button
              type="button"
              onClick={() => setViewMode("milestones")}
              style={{
                padding: "4px 9px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                border: "none",
                background: viewMode === "milestones" ? "#FFFFFF" : "transparent",
                color: viewMode === "milestones" ? "#4F46E5" : "#64748B",
                boxShadow: viewMode === "milestones" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <Truck size={12} />
              Deliveries ({upcomingShipments.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("monthGrid")}
              style={{
                padding: "4px 9px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                border: "none",
                background: viewMode === "monthGrid" ? "#FFFFFF" : "transparent",
                color: viewMode === "monthGrid" ? "#4F46E5" : "#64748B",
                boxShadow: viewMode === "monthGrid" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <Calendar size={12} />
              Month Grid
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate("calendar")}
            style={{
              background: "none",
              border: "none",
              color: "#4F46E5",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              padding: "4px 6px"
            }}
          >
            Full calendar →
          </button>
        </div>
      </div>

      {/* VIEW 1: Delivery Milestones Schedule */}
      {viewMode === "milestones" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto", maxHeight: 310 }}>
          {upcomingShipments.length === 0 ? (
            <div style={{ padding: "30px 16px", textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
              No active orders with target ship dates found.
            </div>
          ) : (
            upcomingShipments.map(({ order: o, shipDateStr, diffDays, inProgStage, pct, doneCount, totalCount }) => {
              const bStyle = getOrderStatusBadge(o.status);
              return (
                <div
                  key={o.primaryId || o.id}
                  onClick={() => onOpenOrder && onOpenOrder(o.primaryId || o.id, o.primaryId)}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#CBD5E1"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: "#0F172A" }}>{o.id}</span>
                        <span style={{ fontSize: 11, color: "#64748B" }}>· {o.style}</span>
                        {o.buyer && (
                          <span style={{ fontSize: 10, background: "#EEF2FF", color: "#4338CA", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                            {o.buyer}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                        Current stage: <b style={{ color: "#334155" }}>{inProgStage?.name || "Order Started"}</b>
                        {inProgStage?.dept ? ` (${inProgStage.dept})` : ""}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        <Truck size={12} />
                        <span>Ship: {shipDateStr}</span>
                      </div>
                      <div style={{ fontSize: 9.5, color: diffDays < 0 ? "#DC2626" : diffDays <= 30 ? "#D97706" : "#64748B", fontWeight: 600, marginTop: 2 }}>
                        {diffDays < 0 ? `${Math.abs(diffDays)}d overdue` : `${diffDays} days left`}
                      </div>
                    </div>
                  </div>

                  {/* Stage Progress Bar & Status Pill */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <div style={{ flex: 1, background: "#E2E8F0", height: 6, borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: o.status === "Delayed" ? "#EF4444" : o.status === "At Risk" ? "#F59E0B" : "#10B981",
                          borderRadius: 999
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {doneCount}/{totalCount} ({pct}%)
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: bStyle.bg,
                        color: bStyle.fg,
                        border: `1px solid ${bStyle.border}`,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {o.status || "At Risk"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: Real Interactive Month Calendar Grid */}
      {viewMode === "monthGrid" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Month Switcher Header & Quick Month Shortcuts */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={prevMonth}
                style={{
                  background: "#F1F5F9",
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", minWidth: 120, textAlign: "center" }}>
                {monthNames[currentMonth]} {currentYear}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                style={{
                  background: "#F1F5F9",
                  border: "1px solid #E2E8F0",
                  borderRadius: 6,
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#475569"
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Quick Month Jump Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={() => jumpToMonth(today.getFullYear(), today.getMonth())}
                style={{
                  padding: "2px 7px",
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontWeight: 600,
                  border: currentMonth === today.getMonth() && currentYear === today.getFullYear() ? "1px solid #4F46E5" : "1px solid #E2E8F0",
                  background: currentMonth === today.getMonth() && currentYear === today.getFullYear() ? "#EEF2FF" : "#FFFFFF",
                  color: currentMonth === today.getMonth() && currentYear === today.getFullYear() ? "#4338CA" : "#64748B",
                  cursor: "pointer"
                }}
              >
                Today ({monthNames[today.getMonth()].slice(0, 3)})
              </button>

              <button
                type="button"
                onClick={() => jumpToMonth(2026, 11)}
                style={{
                  padding: "2px 7px",
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontWeight: 600,
                  border: currentMonth === 11 && currentYear === 2026 ? "1px solid #4F46E5" : "1px solid #E2E8F0",
                  background: currentMonth === 11 && currentYear === 2026 ? "#EEF2FF" : "#FFFFFF",
                  color: currentMonth === 11 && currentYear === 2026 ? "#4338CA" : "#64748B",
                  cursor: "pointer"
                }}
              >
                🚢 Dec Shipments
              </button>
            </div>
          </div>

          {/* Weekday Columns: Sun to Sat */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#64748B", paddingBottom: 4 }}>
            <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
          </div>

          {/* Month Days Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {calendarDays.map((c, i) => {
              const hasOrders = c.shippingOrders && c.shippingOrders.length > 0;
              const isSelected = selectedDateKey && selectedDateKey === c.key;

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (c.key) setSelectedDateKey(c.key === selectedDateKey ? null : c.key);
                  }}
                  style={{
                    height: 38,
                    borderRadius: 6,
                    border: isSelected
                      ? "1.5px solid #4F46E5"
                      : c.isToday
                        ? "1.5px solid #6366F1"
                        : hasOrders
                          ? "1px solid #FDE68A"
                          : "1px solid #F1F5F9",
                    background: isSelected
                      ? "#EEF2FF"
                      : c.isToday
                        ? "#F5F3FF"
                        : hasOrders
                          ? "#FEF9C3"
                          : c.isCurrentMonth
                            ? "#FFFFFF"
                            : "#F8FAFC",
                    padding: "3px 4px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: c.isCurrentMonth ? "pointer" : "default",
                    opacity: c.isCurrentMonth ? 1 : 0.35,
                    transition: "all 0.12s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, fontWeight: c.isToday || hasOrders ? 800 : 500, color: c.isToday ? "#4F46E5" : "#1E293B" }}>
                      {c.day}
                    </span>
                    {c.isToday && (
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4F46E5" }} />
                    )}
                  </div>

                  {hasOrders && (
                    <div
                      style={{
                        fontSize: 8.5,
                        fontWeight: 700,
                        background: "#B45309",
                        color: "#FFFFFF",
                        borderRadius: 3,
                        padding: "1px 3px",
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                      title={`${c.shippingOrders.length} order(s) shipping: ${c.shippingOrders.map(o => o.id).join(", ")}`}
                    >
                      🚢 {c.shippingOrders.length} Ship
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day Inspection Box (when a date is clicked) */}
          {selectedDateKey && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>Scheduled on {selectedDateKey}:</span>
                <span style={{ color: "#64748B", fontWeight: 500 }}>{selectedDayOrders.length} order(s)</span>
              </div>
              {selectedDayOrders.length === 0 ? (
                <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>
                  No order shipments scheduled on this date.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectedDayOrders.map(o => (
                    <div
                      key={o.id}
                      onClick={() => onOpenOrder && onOpenOrder(o.primaryId || o.id, o.primaryId)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: "6px 8px", cursor: "pointer" }}
                    >
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F172A" }}>{o.id} · {o.style}</div>
                        <div style={{ fontSize: 10, color: "#64748B" }}>Buyer: {o.buyer || "Direct"} · Qty: {(Number(o.qty) || 0).toLocaleString()} pcs</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A", padding: "2px 6px", borderRadius: 4 }}>
                          {o.status || "At Risk"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function Dashboard({
  orders = [],
  onOpenOrder,
  onNavigate,
  attendance,
  roster,
  selectedDate = "2026-05-12",
  customTasks = [],
  compliances = [],
  certifications = [],
  supplierWork = [],
  notifications = [],
  leaveRequests = [],
  debitNotes = [],
  capas = [],
  onApproveCosting,
  onRejectCosting,
  role = {},
  onOpenDept,
  userSessions = [],
  users = [],
  teams = []
}) {
  const activeOrders = useMemo(() => orders.filter(o => o.isDeleted !== true && o.completed !== true), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.completed === true && o.isDeleted !== true), [orders]);
  const deletedOrders = useMemo(() => orders.filter(o => o.isDeleted === true), [orders]);

  // Dynamic 6-month Shipment Performance Trend computed directly from orders
  const shipmentTrendData = useMemo(() => computeMonthlyShipmentPerformance(activeOrders), [activeOrders]);

  const stats = useMemo(() => {
    const total = activeOrders.length;
    const onTrack = activeOrders.filter(o => o.status === "On Track").length;
    const atRisk = activeOrders.filter(o => o.status === "At Risk").length;
    const delayed = activeOrders.filter(o => o.status === "Delayed").length;
    const shipRisk = activeOrders.filter(o => o.risk === "high" || o.risk === "medium").length;
    const totalQtyYear = activeOrders.reduce((a, o) => a + (Number(o.qty) || 0), 0);
    return { total, onTrack, atRisk, delayed, shipRisk, totalQtyYear };
  }, [activeOrders]);

  const allStages = useMemo(() => activeOrders.flatMap(o => o.stages || []), [activeOrders]);

  const stageCounts = useMemo(() => {
    return TA_STAGES.map((s, i) => {
      const matchingOrders = activeOrders.filter(o => {
        const status = o?.stages?.[i]?.status;
        return ["done", "in_progress", "pending"].includes(status);
      });
      const count = matchingOrders.filter(o => o.stages[i].status === "done" || o.stages[i].status === "in_progress").length;
      return { name: s.name, day: s.day, dept: s.dept, count, orders: matchingOrders, stageIdx: i };
    });
  }, [activeOrders]);

  const [selectedStageIdx, setSelectedStageIdx] = useState(null);

  const summary = useMemo(() => {
    const completed = allStages.filter(s => s.status === "done").length;
    const inProgress = allStages.filter(s => s.status === "in_progress" && !s.reason).length;
    const atRisk = allStages.filter(s => s.status === "in_progress" && s.reason).length;
    const pending = allStages.filter(s => s.status === "pending").length;
    return { completed, inProgress, atRisk, pending, total: allStages.length || 1 };
  }, [allStages]);

  // Compute live dynamic risk level for each order based on target ship date, delay flags, and status:
  const orderRiskMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(activeOrders)) return map;
    activeOrders.forEach(o => {
      if (!o) return;
      const orderId = o.id || o.primaryId;
      if (!orderId) return;
      map[orderId] = computeDynamicOrderRisk(o);
    });
    return map;
  }, [activeOrders]);

  const alerts = useMemo(() => {
    const items = [];
    if (!Array.isArray(activeOrders)) return items;
    activeOrders.forEach(o => {
      if (!o || !Array.isArray(o.stages)) return;
      const orderRisk = String(orderRiskMap[o.id || o.primaryId] || o.risk || "medium").toLowerCase();
      o.stages.forEach(s => {
        if (s && typeof s.reason === "string" && s.reason.trim() !== "" && s.reason !== "No delay flagged") {
          items.push({
            text: `${s.reason} — ${o.style || ""} PO #${o.id || o.primaryId || ""} (${s.dept || "General"})`,
            sev: orderRisk
          });
        }
      });
    });
    return items.slice(0, 5);
  }, [activeOrders, orderRiskMap]);

  const topAtRisk = useMemo(() => {
    if (!Array.isArray(activeOrders)) return [];
    return activeOrders
      .filter(o => o && o.status !== "On Track")
      .sort((a, b) => {
        const rA = String(orderRiskMap[a?.id || a?.primaryId] || a?.risk || "medium").toLowerCase();
        const rB = String(orderRiskMap[b?.id || b?.primaryId] || b?.risk || "medium").toLowerCase();
        return (rA === "high" ? 0 : 1) - (rB === "high" ? 0 : 1);
      })
      .slice(0, 5)
      .map(o => {
        const stages = Array.isArray(o.stages) ? o.stages : [];
        const flagged = stages.find(s => s && s.reason);
        const rawRisk = String(orderRiskMap[o.id || o.primaryId] || o.risk || "medium").toLowerCase();
        const delayDays = RISK_DELAY_DAYS && RISK_DELAY_DAYS[rawRisk] ? RISK_DELAY_DAYS[rawRisk] : 1;
        return {
          ...o,
          risk: rawRisk,
          predictedDelay: `${delayDays} Day${delayDays > 1 ? "s" : ""}`,
          primaryReason: flagged && typeof flagged.reason === "string" ? flagged.reason : "—"
        };
      });
  }, [activeOrders, orderRiskMap]);

  // Break down reasons into clean root-causes (splitting compound "Color: Reason · Color2: Reason2" strings)
  const reasonCounts = useMemo(() => {
    const counts = {};
    if (!Array.isArray(allStages)) return { arr: [], totalFlags: 1 };
    allStages.forEach(s => {
      if (!s || typeof s.reason !== "string" || !s.reason.trim() || s.reason === "No delay flagged") return;
      // Check if it has multiple colorway delay reasons joined by ' · '
      const parts = s.reason.split(/\s*·\s*/);
      parts.forEach(part => {
        let cleaned = typeof part === "string" ? part.trim() : "";
        // Remove colorway prefix like "Black: " or "215 IVORY: "
        if (cleaned.includes(": ")) {
          const colonIdx = cleaned.indexOf(": ");
          cleaned = cleaned.substring(colonIdx + 2).trim();
        }
        if (cleaned) {
          counts[cleaned] = (counts[cleaned] || 0) + 1;
        }
      });
    });
    const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalFlags = arr.reduce((a, [, c]) => a + c, 0) || 1;
    return { arr, totalFlags };
  }, [allStages]);

  const departmentCounts = useMemo(() => {
    if (!ORG_STRUCTURE || !Array.isArray(allStages)) return [];
    const depts = Object.keys(ORG_STRUCTURE);
    return depts.map(dept => {
      const count = allStages.filter(s => s && s.dept === dept && typeof s.reason === "string" && s.reason.trim() !== "" && s.reason !== "No delay flagged").length;
      return { dept, count };
    }).filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [allStages]);

  const riskCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    if (Array.isArray(activeOrders)) {
      activeOrders.forEach(o => {
        if (!o) return;
        const r = String(orderRiskMap[o.id || o.primaryId] || o.risk || "low").toLowerCase();
        if (r === "high") high++;
        else if (r === "medium") medium++;
        else low++;
      });
    }
    return { high, medium, low };
  }, [activeOrders, orderRiskMap]);

  const riskPieData = useMemo(() => {
    const data = [];
    if (riskCounts.high > 0) data.push({ name: "High risk", value: riskCounts.high, color: "#EF4444" });
    if (riskCounts.medium > 0) data.push({ name: "Medium risk", value: riskCounts.medium, color: "#F59E0B" });
    if (riskCounts.low > 0) data.push({ name: "Low risk", value: riskCounts.low, color: "#10B981" });
    return data;
  }, [riskCounts]);

  const lookFirstText = useMemo(() => {
    if (!departmentCounts || departmentCounts.length === 0) return null;
    const top = departmentCounts.slice(0, 2).map(d => d.dept);
    const topSum = departmentCounts.slice(0, 2).reduce((a, d) => a + d.count, 0);
    const totalFlags = reasonCounts?.totalFlags || 1;
    const pct = Math.round((topSum / totalFlags) * 100);
    return top.length === 2
      ? `${top[0]} and ${top[1]} delays account for ${pct}% of flagged issues this week.`
      : `${top[0]} delays account for ${pct}% of flagged issues this week.`;
  }, [departmentCounts, reasonCounts]);

  const aiInsightText = useMemo(() => {
    if (!reasonCounts || !reasonCounts.arr || reasonCounts.arr.length === 0) {
      if (riskCounts.high === 0 && riskCounts.medium === 0) {
        return "All active orders are on track — no production delays or shipment risks detected.";
      }
      return `${riskCounts.high > 0 ? `${riskCounts.high} order(s) carry high shipment risk` : `${riskCounts.medium} order(s) in medium risk`} — monitoring milestone progress closely.`;
    }
    const [topReason, topCount] = reasonCounts.arr[0];
    const pct = Math.round((topCount / (reasonCounts.totalFlags || 1)) * 100);
    const orderCountText = riskCounts.high > 0
      ? `${riskCounts.high} order${riskCounts.high === 1 ? "" : "s"} carry high shipment risk`
      : riskCounts.medium > 0
      ? `${riskCounts.medium} order${riskCounts.medium === 1 ? "" : "s"} at medium risk`
      : `${(stats?.atRisk || 0) + (stats?.delayed || 0)} orders with delay flags`;
    return `${orderCountText} — the leading cause is ${topReason} (${pct}%).`;
  }, [reasonCounts, riskCounts, stats]);

  const myTasksPreview = useMemo(() => {
    const items = [];
    if (!Array.isArray(activeOrders)) return items;
    activeOrders.forEach(o => {
      if (!o || !Array.isArray(o.stages)) return;
      o.stages.forEach(s => {
        if (s && s.status === "in_progress") items.push({ order: o, stage: s });
      });
    });
    return items.slice(0, 4);
  }, [activeOrders]);

  const bottomStats = useMemo(() => {
    // 1. Live Avg Order Lead Time (days between order creation/start and target ship date)
    let leadTimeDaysTotal = 0;
    let leadTimeCount = 0;
    activeOrders.forEach(o => {
      const shipStr = o.shipDate || o.ship;
      const startStr = o.orderDate || o.createdAt || o.createdDate;
      if (shipStr) {
        let shipD = new Date(shipStr);
        if (isNaN(shipD.getTime()) && typeof shipStr === "string") {
          shipD = new Date(`${shipStr} ${new Date().getFullYear()}`);
        }
        let startD = startStr ? new Date(startStr) : null;
        if (startD && isNaN(startD.getTime()) && typeof startStr === "string") {
          startD = new Date(`${startStr} ${new Date().getFullYear()}`);
        }
        if (!startD || isNaN(startD.getTime())) {
          // If no created date, calculate from stage Day 1 or standard lead
          const stageCount = o.stages?.length || 35;
          const estimatedLead = stageCount > 35 ? 120 : 90;
          leadTimeDaysTotal += estimatedLead;
          leadTimeCount++;
        } else if (!isNaN(shipD.getTime()) && !isNaN(startD.getTime())) {
          const diffDays = Math.round(Math.abs(shipD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            leadTimeDaysTotal += diffDays;
            leadTimeCount++;
          }
        }
      }
    });
    const avgOrderLeadTimeStr = leadTimeCount > 0 ? `${Math.round(leadTimeDaysTotal / leadTimeCount)} days` : "—";

    // 2. Live Avg Sampling Time (measured across proto/sample stages)
    let samplingDaysTotal = 0;
    let samplingCount = 0;
    activeOrders.forEach(o => {
      const sampleStages = (o.stages || []).filter(s => {
        const n = (s.name || "").toLowerCase();
        return n.includes("sample") || n.includes("proto") || n.includes("size set") || n.includes("fit");
      });
      sampleStages.forEach(s => {
        // Check stage day span string (e.g. "Day 25-35", "Day 35-38", or Day 50)
        const match = (s.day || "").match(/(\d+)\s*-\s*(\d+)/);
        if (match) {
          const span = Math.abs(parseInt(match[2], 10) - parseInt(match[1], 10));
          if (span > 0) {
            samplingDaysTotal += span;
            samplingCount++;
          }
        } else {
          const singleMatch = (s.day || "").match(/(\d+)/);
          if (singleMatch) {
            // Stage cycle day
            samplingDaysTotal += 7; // Average standard sample cycle window
            samplingCount++;
          }
        }
      });
    });
    const avgSamplingTimeStr = samplingCount > 0 ? `${Math.round(samplingDaysTotal / samplingCount)} days` : "—";

    // 3. Live On-Time Approval %
    const approvalStages = allStages.filter(s => s.name.toLowerCase().includes("approval"));
    const doneApprovals = approvalStages.filter(s => s.status === "done" && !s.reason).length;
    const onTimeApprovalPct = approvalStages.length > 0 ? Math.round((doneApprovals / approvalStages.length) * 100) : 0;

    // 4. Live Quality Pass Rate (from inspection records or completed quality stages)
    let totalInspectedUnits = 0;
    let totalPassedUnits = 0;
    let hasInspectionUnits = false;

    activeOrders.forEach(o => {
      const insp = o.inspectionData || {};
      ["inline", "endline", "final"].forEach(sec => {
        if (insp[sec]) {
          const inspected = Number(insp[sec].unitsInspected);
          const passed = Number(insp[sec].unitsPassed);
          if (!isNaN(inspected) && inspected > 0 && !isNaN(passed)) {
            totalInspectedUnits += inspected;
            totalPassedUnits += passed;
            hasInspectionUnits = true;
          }
        }
      });
    });

    let qualityPassRateStr = "100%";
    if (hasInspectionUnits && totalInspectedUnits > 0) {
      const rate = ((totalPassedUnits / totalInspectedUnits) * 100).toFixed(1);
      qualityPassRateStr = `${rate}%`;
    } else {
      // Fallback to live quality stages pass rate without quality reasons/issues
      const qualityStages = allStages.filter(s => s.dept === "Quality" || s.name.toLowerCase().includes("quality") || s.name.toLowerCase().includes("inspection"));
      if (qualityStages.length > 0) {
        const passQuality = qualityStages.filter(s => s.status === "done" && !s.reason).length;
        const inProgQualityNoIssue = qualityStages.filter(s => s.status === "in_progress" && !s.reason).length;
        const rate = Math.round(((passQuality + inProgQualityNoIssue * 0.5) / qualityStages.length) * 100);
        qualityPassRateStr = `${rate}%`;
      } else {
        qualityPassRateStr = "100%";
      }
    }

    // 5. Live Production Efficiency
    // Computed from productionLogs if available, or actual completed production stages
    let logEffSum = 0;
    let logEffCount = 0;
    activeOrders.forEach(o => {
      (o.productionLogs || []).forEach(pl => {
        const effVal = parseFloat(pl.efficiency);
        if (!isNaN(effVal) && effVal > 0) {
          logEffSum += effVal;
          logEffCount++;
        }
      });
    });

    let productionEfficiencyStr = "0%";
    if (logEffCount > 0) {
      productionEfficiencyStr = `${Math.round(logEffSum / logEffCount)}%`;
    } else {
      // Live production stage progress across active orders
      const prodStages = allStages.filter(s => s.dept === "Production" || s.dept === "Cutting" || s.dept === "VAP");
      const doneProd = prodStages.filter(s => s.status === "done").length;
      const inProgProd = prodStages.filter(s => s.status === "in_progress").length;
      if (prodStages.length > 0) {
        const effPct = Math.round(((doneProd + inProgProd * 0.5) / prodStages.length) * 100);
        productionEfficiencyStr = `${effPct}%`;
      } else {
        productionEfficiencyStr = "0%";
      }
    }

    // 6. Live Capacity Utilization (Ratio of in-progress & completed floor stages to total capacity)
    const floorStages = allStages.filter(s => s.dept === "Cutting" || s.dept === "Production");
    const activeFloorCount = floorStages.filter(s => s.status === "done" || s.status === "in_progress").length;
    const capacityUtilPct = floorStages.length > 0 ? Math.round((activeFloorCount / floorStages.length) * 100) : 0;

    return {
      avgOrderLeadTime: avgOrderLeadTimeStr,
      avgSamplingTime: avgSamplingTimeStr,
      onTimeApprovalPct,
      qualityPassRate: qualityPassRateStr,
      productionEfficiency: productionEfficiencyStr,
      capacityUtilPct
    };
  }, [activeOrders, allStages]);

  const cuttingDelayedOrders = useMemo(() => {
    if (!Array.isArray(activeOrders)) return [];
    const res = [];
    for (const ord of activeOrders) {
      const a = analyzeCuttingDelayForOrder(ord);
      if (a) res.push(a);
    }
    return res;
  }, [activeOrders]);

  const cards = [
    { label: "Active orders", value: stats.total, color: "#378ADD", Icon: Package, delta: `${completedOrders.length} completed · ${deletedOrders.length} deleted` },
    { label: "On track", value: stats.onTrack, color: "#1F9E8D", Icon: CheckCircle2, delta: `${Math.round((stats.onTrack / (stats.total || 1)) * 100)}% of active` },
    { label: "At risk", value: stats.atRisk, color: "#E2A83B", Icon: TriangleAlert, delta: `${Math.round((stats.atRisk / (stats.total || 1)) * 100)}% of active` },
    { label: "Delayed", value: stats.delayed, color: "#D64545", Icon: ArrowDownRight, delta: `${Math.round((stats.delayed / (stats.total || 1)) * 100)}% of active` },
    { label: "Completed orders", value: completedOrders.length, color: "#085041", Icon: CheckCircle2, delta: `${deletedOrders.length} in history` },
    { label: "Total qty active (pcs)", value: `${stats.totalQtyYear.toLocaleString()}`, color: "#0E9BB0", Icon: Factory, delta: "Sum of active order sheets" },
  ];

  return (
    <div>
      {/* Cutting Delay Warning Banner for Admin and MD */}
      <CuttingDelayDashboardBanner
        delayedOrders={cuttingDelayedOrders}
        onOpenAlert={() => window.dispatchEvent(new CustomEvent("loom_open_cutting_alert"))}
        snoozedUntil={Number(localStorage.getItem("loom_cutting_delay_snooze_until_5m")) || 0}
      />

      <PageHeader title="Dashboard" sub="Real-time overview of all orders and operations" />

      {/* Top 6 KPI Cards - Clean, modern, elevated styling with subtle accents */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 20 }}>
        {cards.map(c => (
          <Card
            key={c.label}
            className="kpi-overview-card"
            data-kpi={c.label.toLowerCase().replace(/\s+/g, '-')}
            style={{
              padding: "16px 18px",
              background: "#FFFFFF",
              border: "1px solid #E8EBF0",
              borderTop: `3.5px solid ${c.color}`,
              borderRadius: 12,
              boxShadow: "0 2px 5px rgba(15, 23, 42, 0.04)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div>
              <div className="kpi-icon-box" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: `linear-gradient(135deg, ${c.color}15 0%, ${c.color}25 100%)`,
                    border: `1px solid ${c.color}35`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <c.Icon size={17} color={c.color} />
                </div>
              </div>
              <div className="kpi-title" style={{ fontSize: 13, fontWeight: 700, color: "#1B2130", letterSpacing: "-0.2px" }}>{c.label}</div>
              <div className="kpi-val" style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: c.color, letterSpacing: "-0.5px" }}>{c.value}</div>
            </div>
            <div
              className="kpi-delta"
              style={{
                fontSize: 10.5,
                color: c.delta.startsWith("-") ? "#D64545" : "#475569",
                marginTop: 10,
                fontWeight: 600,
                background: "#F8FAFC",
                padding: "3px 9px",
                borderRadius: 6,
                border: "1px solid #E2E8F0",
                display: "inline-block",
                width: "fit-content"
              }}
            >
              {c.delta}
            </div>
          </Card>
        ))}
      </div>

      {/* Middle Row: Orders by department, Shipment performance, Risk analysis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 0.95fr", gap: 16, marginBottom: 18 }}>
        {/* 1. Orders by Department Card */}
        <Card style={{ background: "#FFFFFF", border: "1px solid #E8EBF0", borderRadius: 12, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)" }}>
          <CardHeader title="Orders by department" sub="Delay flags" action="View all" onAction={() => onNavigate("departments")} />
          {departmentCounts.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94A3B8", padding: "16px 0", textAlign: "center" }}>No delays flagged yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {departmentCounts.map((d, i) => {
                const max = Math.max(...departmentCounts.map(x => x.count), 1);
                const dotColor = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981", "#6366F1", "#D97706"][i % 6];
                return (
                  <div
                    key={d.dept}
                    onClick={() => onOpenDept && onOpenDept(d.dept)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      padding: "6px 8px",
                      borderRadius: 8,
                      background: "#F8FAFC",
                      border: "1px solid #F1F5F9",
                      transition: "background 0.15s ease, border-color 0.15s ease"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#EEF2F6";
                      e.currentTarget.style.borderColor = "#CBD5E1";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#F8FAFC";
                      e.currentTarget.style.borderColor = "#F1F5F9";
                    }}
                    title={`Click to open ${d.dept} department page`}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <div style={{ width: 90, fontSize: 12, color: "#1E293B", fontWeight: 700, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>{d.dept}</span>
                      <span style={{ fontSize: 11, color: "#6366F1" }}>→</span>
                    </div>
                    <div style={{ flex: 1, height: 8, background: "#E2E8F0", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(d.count / max) * 100}%`, background: dotColor, borderRadius: 999, transition: "width 0.3s ease" }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", width: 22, textAlign: "right" }}>{d.count}</div>
                  </div>
                );
              })}
            </div>
          )}
          {lookFirstText && (
            <div style={{ background: "linear-gradient(135deg, #F0EFFB 0%, #EEF2FF 100%)", border: "1px solid #DCD8F5", borderRadius: 10, padding: "11px 14px", marginTop: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#534AB7", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Where to look first</div>
              <div style={{ fontSize: 12, color: "#3730A3", lineHeight: 1.45, fontWeight: 500 }}>{lookFirstText}</div>
            </div>
          )}
        </Card>

        {/* 2. Shipment Performance Chart Card */}
        <Card style={{ background: "#FFFFFF", border: "1px solid #E8EBF0", borderRadius: 12, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)" }}>
          <CardHeader
            title="Shipment performance"
            sub={shipmentTrendData.rangeLabel ? `${shipmentTrendData.rangeLabel} (Based on Orders)` : "Last 6 months"}
          />
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shipmentTrendData} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pt = payload[0]?.payload;
                    if (!pt) return null;
                    return (
                      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 11.5 }}>
                        <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{pt.fullLabel || label}</div>
                        {pt.totalOrders > 0 ? (
                          <>
                            <div style={{ color: "#534AB7", fontWeight: 700 }}>
                              On-time: <span style={{ fontSize: 13 }}>{pt.onTime !== null ? `${pt.onTime}%` : "—"}</span>
                            </div>
                            <div style={{ color: "#475569", marginTop: 2 }}>
                              Orders: {pt.onTimeOrders} on-track / {pt.totalOrders} total {pt.delayedOrders > 0 ? `(${pt.delayedOrders} delayed)` : ""}
                            </div>
                            {pt.orderNumbers && (
                              <div style={{ color: "#64748B", fontSize: 10.5, marginTop: 3 }}>
                                Orders: <span style={{ fontFamily: "monospace", color: "#334155", fontWeight: 600 }}>{pt.orderNumbers}</span>
                              </div>
                            )}
                            {pt.delayedOrderNumbers && (
                              <div style={{ color: "#DC2626", fontSize: 10.5, marginTop: 1 }}>
                                Delayed: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{pt.delayedOrderNumbers}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ color: "#94A3B8" }}>No active order activity</div>
                        )}
                        <div style={{ color: "#64748B", marginTop: 4, fontSize: 10.5, borderTop: "1px dashed #E2E8F0", paddingTop: 4 }}>
                          🎯 Target Benchmark: <b>{pt.target}%</b> (Industry KPI Goal)
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Line type="monotone" dataKey="onTime" name="Actual On-time %" stroke="#534AB7" strokeWidth={2.5} dot={{ r: 3.5, fill: "#534AB7" }} activeDot={{ r: 5 }} connectNulls={true} />
                <Line type="monotone" dataKey="target" name="Target Goal % (75% Benchmark)" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 3. Risk Analysis Donut Card */}
        <Card style={{ background: "#FFFFFF", border: "1px solid #E8EBF0", borderRadius: 12, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)" }}>
          <CardHeader title="Risk analysis" action="View insights" onAction={() => onNavigate("insights")} />
          <div style={{ width: "100%", height: 140, minHeight: 140, position: "relative" }}>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={riskPieData && riskPieData.length > 0 ? riskPieData : [{ name: "No risk", value: 1, color: "#E7E8ED" }]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={3}
                  stroke="none"
                >
                  {(riskPieData && riskPieData.length > 0 ? riskPieData : [{ name: "default", color: "#E7E8ED" }]).map((d, i) => (
                    <Cell key={d?.name || i} fill={d?.color || "#E7E8ED"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>{stats?.total || 0}</div>
              <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600 }}>Orders</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center", marginTop: 4, marginBottom: 12 }}>
            {[
              ["High", "#EF4444", riskCounts.high],
              ["Medium", "#F59E0B", riskCounts.medium],
              ["Low", "#10B981", riskCounts.low]
            ].map(([l, c, count]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                <span>{l}:</span>
                <strong style={{ color: "#0F172A" }}>{count || 0}</strong>
              </div>
            ))}
          </div>
          {aiInsightText && (
            <div style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>AI Insight</div>
              <div style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.45 }}>{aiInsightText}</div>
            </div>
          )}
        </Card>
      </div>

      {/* T&A Progress Overview Section */}
      <Card style={{ marginBottom: 18, background: "#FFFFFF", border: "1px solid #E8EBF0", borderRadius: 12, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)" }}>
        <CardHeader
          title="T&A progress overview (all orders)"
          sub={`Real-time workflow milestones across ${activeOrders.length} active orders (${allStages.length} total live stages)`}
          action="Timeline / calendar"
          onAction={() => onNavigate("calendar")}
        />

        {/* Horizontal Workflow Stepper */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10 }}>
          {stageCounts.map((s, i) => {
            const Icon = STAGE_ICON_SET_BASE[i % STAGE_ICON_SET_BASE.length];
            const isSelected = selectedStageIdx === i;
            return (
              <div
                key={s.name}
                onClick={() => setSelectedStageIdx(isSelected ? null : i)}
                style={{
                  flex: "0 0 68px",
                  textAlign: "center",
                  background: isSelected ? "#EEF2FF" : "#F8FAFC",
                  padding: "8px 4px",
                  borderRadius: 8,
                  border: isSelected ? "2px solid #4F46E5" : "1px solid #F1F5F9",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  transform: isSelected ? "scale(1.04)" : "scale(1)",
                  boxShadow: isSelected ? "0 2px 8px rgba(79,70,229,0.18)" : "none"
                }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.borderColor = "#C7D2FE"; } }}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#F1F5F9"; } }}
              >
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: isSelected ? "#4F46E5" : "#EEF2FF", border: isSelected ? "1px solid #4338CA" : "1px solid #E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", transition: "all 0.15s ease" }}>
                  <Icon size={14} color={isSelected ? "#FFFFFF" : "#4F46E5"} />
                </div>
                <div style={{ fontSize: 9.5, color: isSelected ? "#312E81" : "#64748B", fontWeight: 600, marginTop: 6, lineHeight: 1.25, height: 24, overflow: "hidden" }}>{s.name}</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: isSelected ? "#4F46E5" : "#0F172A", marginTop: 2 }}>{s.count}</div>
              </div>
            );
          })}
        </div>

        {/* Expanded Stage Detail Panel */}
        {selectedStageIdx !== null && stageCounts[selectedStageIdx] && (() => {
          const sel = stageCounts[selectedStageIdx];
          const stageOrders = sel.orders || [];
          const doneOrders = stageOrders.filter(o => o.stages[sel.stageIdx]?.status === "done");
          const inProgressOrders = stageOrders.filter(o => o.stages[sel.stageIdx]?.status === "in_progress");
          const pendingOrders = stageOrders.filter(o => o.stages[sel.stageIdx]?.status === "pending");
          return (
            <div style={{
              background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)",
              border: "1px solid #E0E7FF",
              borderRadius: 10,
              padding: "16px 18px",
              marginBottom: 10,
              animation: "fadeIn 0.2s ease"
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1E1B4B", display: "flex", alignItems: "center", gap: 8 }}>
                    {(() => { const Ic = STAGE_ICON_SET_BASE[selectedStageIdx % STAGE_ICON_SET_BASE.length]; return <Ic size={16} color="#4F46E5" />; })()}
                    {sel.name}
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>Department: <strong style={{ color: "#334155" }}>{sel.dept}</strong></span>
                    <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>T&A: <strong style={{ color: "#334155" }}>{sel.day}</strong></span>
                    <span style={{ fontSize: 11, background: "#DBEAFE", color: "#1E40AF", fontWeight: 700, padding: "1px 8px", borderRadius: 999 }}>{stageOrders.length} order{stageOrders.length !== 1 ? "s" : ""}</span>
                    <span style={{ fontSize: 11, background: "#DCFCE7", color: "#166534", fontWeight: 700, padding: "1px 8px", borderRadius: 999 }}>{doneOrders.length} done</span>
                    <span style={{ fontSize: 11, background: "#FEF3C7", color: "#92400E", fontWeight: 700, padding: "1px 8px", borderRadius: 999 }}>{inProgressOrders.length} in progress</span>
                    <span style={{ fontSize: 11, background: "#F1F5F9", color: "#64748B", fontWeight: 700, padding: "1px 8px", borderRadius: 999 }}>{pendingOrders.length} pending</span>
                  </div>
                </div>
                <div
                  onClick={() => setSelectedStageIdx(null)}
                  style={{ cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#E0E7FF"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  title="Close details"
                >
                  <X size={16} color="#64748B" />
                </div>
              </div>

              {/* Orders Table */}
              {stageOrders.length === 0 ? (
                <div style={{ fontSize: 12, color: "#94A3B8", padding: "12px 0", textAlign: "center" }}>No orders have this stage yet.</div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: "auto", overflowX: "hidden" }}>
                  {/* Table Header */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.8fr 1.6fr",
                    gap: 8,
                    fontSize: 10.5,
                    color: "#64748B",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    paddingBottom: 6,
                    borderBottom: "1px solid #E2E8F0",
                    marginBottom: 4
                  }}>
                    <div>Order / PO</div>
                    <div>Style / Buyer</div>
                    <div>Due info</div>
                    <div>Stage Status</div>
                    <div>Delay / Reason</div>
                  </div>

                  {/* Order Rows */}
                  {stageOrders.map(o => {
                    const stage = o.stages[sel.stageIdx];
                    const status = stage?.status || "pending";
                    const reason = stage?.reason || "";
                    const dueInfo = stage?.planned || stage?.dueDate || sel.day || "—";
                    return (
                      <div
                        key={o.id || o.primaryId}
                        onClick={() => onOpenOrder && onOpenOrder(o.primaryId || o.id, o.primaryId)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.8fr 1.6fr",
                          gap: 8,
                          alignItems: "center",
                          fontSize: 11.5,
                          padding: "8px 4px",
                          borderBottom: "1px solid #F1F5F9",
                          cursor: "pointer",
                          borderRadius: 6,
                          transition: "background 0.12s ease"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#FFFFFF"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        title={`Click to open order ${o.id || o.primaryId}`}
                      >
                        <div style={{ fontWeight: 700, color: "#4F46E5", display: "flex", alignItems: "center", gap: 4 }}>
                          <Package size={12} color="#4F46E5" />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.id || o.primaryId}</span>
                        </div>
                        <div style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 600 }}>{o.style || "—"}</span>
                          {o.buyer && <span style={{ color: "#94A3B8", marginLeft: 4 }}>· {o.buyer}</span>}
                        </div>
                        <div style={{ color: "#475569", fontWeight: 600 }}>{dueInfo}</div>
                        <div>{statusPill(status)}</div>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {reason ? (
                            <span style={{ fontSize: 10.5, color: "#DC2626", fontWeight: 600 }}>⚠ {reason}</span>
                          ) : (
                            <span style={{ fontSize: 10.5, color: "#94A3B8" }}>No delay</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* 4 Summary Stat Chips */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
          <div style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", padding: "10px 14px", borderRadius: 8 }}>
            <div style={{ fontSize: 11.5, color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={13} />Completed</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#15803D", marginTop: 3 }}>
              {summary.completed} <span style={{ fontSize: 11.5, color: "#166534", fontWeight: 500 }}>({Math.round((summary.completed / summary.total) * 100)}%)</span>
            </div>
          </div>
          <div style={{ background: "#EFF6FF", border: "1px solid #DBEAFE", padding: "10px 14px", borderRadius: 8 }}>
            <div style={{ fontSize: 11.5, color: "#1E40AF", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} />In progress</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1D4ED8", marginTop: 3 }}>
              {summary.inProgress} <span style={{ fontSize: 11.5, color: "#1E40AF", fontWeight: 500 }}>({Math.round((summary.inProgress / summary.total) * 100)}%)</span>
            </div>
          </div>
          <div style={{ background: "#FFFBEB", border: "1px solid #FEF3C7", padding: "10px 14px", borderRadius: 8 }}>
            <div style={{ fontSize: 11.5, color: "#92400E", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><TriangleAlert size={13} />At risk</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#D97706", marginTop: 3 }}>
              {summary.atRisk} <span style={{ fontSize: 11.5, color: "#92400E", fontWeight: 500 }}>({Math.round((summary.atRisk / summary.total) * 100)}%)</span>
            </div>
          </div>
          <div style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", padding: "10px 14px", borderRadius: 8 }}>
            <div style={{ fontSize: 11.5, color: "#991B1B", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><CircleAlert size={13} />Pending</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#DC2626", marginTop: 3 }}>
              {summary.pending} <span style={{ fontSize: 11.5, color: "#991B1B", fontWeight: 500 }}>({Math.round((summary.pending / summary.total) * 100)}%)</span>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 16, marginBottom: 16, alignItems: "stretch" }}>
        <OrderDeliveryCalendarWidget orders={orders} onOpenOrder={onOpenOrder} onNavigate={onNavigate} />

        {/* Production vs plan (today) - Hidden per user request (preserved for future reference) */}
        {false && (
          <Card style={{ display: "none", flexDirection: "column", alignItems: "center" }}>
            <CardHeader title="Production vs plan (today)" action="Reports" onAction={() => onNavigate("reports")} />
            <div style={{ position: "relative", width: 120, height: 120, margin: "8px 0 16px" }}>
              <svg viewBox="0 0 36 36" width="120" height="120">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F0F0F2" strokeWidth="3.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#534AB7" strokeWidth="3.5" strokeDasharray={`${productionPlan.pct}, 100`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1B2130" }}>{productionPlan.pct}%</div>
                <div style={{ fontSize: 10.5, color: "#8A8D98" }}>Achieved</div>
              </div>
            </div>
            <div style={{ width: "100%", fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: "#8A8D98" }}>Planned</span><span style={{ fontWeight: 600 }}>{productionPlan.totalQty.toLocaleString()} pcs</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: "#8A8D98" }}>Actual</span><span style={{ fontWeight: 600, color: "#1F9E8D" }}>{productionPlan.actual.toLocaleString()} pcs</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8A8D98" }}>Balance</span><span style={{ fontWeight: 600, color: "#D64545" }}>{productionPlan.balance.toLocaleString()} pcs</span></div>
            </div>
          </Card>
        )}

        {/* My tasks Widget - Expanded to fill the covered area */}
        <Card style={{ display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
          <CardHeader title="My tasks" action="Open" onAction={() => onNavigate("tasks")} />
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 320 }}>
            {myTasksPreview.length === 0 ? (
              <div style={{ fontSize: 12, color: "#B0B2BA", padding: "16px 0" }}>Nothing in progress right now.</div>
            ) : myTasksPreview.map((item, i) => {
              const due = item.stage.reason
                ? { label: "Overdue", bg: "#FCEBEB", fg: "#791F1F" }
                : [{ label: "Due Today", bg: "#FCEBEB", fg: "#791F1F" }, { label: "Tomorrow", bg: "#FAEEDA", fg: "#633806" }, { label: "In 2 Days", bg: "#E6F1FB", fg: "#1D5A8A" }][i % 3];
              return (
                <div key={item.order.id + item.stage.name} onClick={() => onOpenOrder(item.order.id)} style={{ padding: "9px 0", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1B2130" }}>{item.stage.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: due.bg, color: due.fg, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{due.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 3 }}>
                    <span style={{ fontWeight: 600, color: "#475569" }}>{item.order.id}</span> · {item.order.style} · {item.order.buyer}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Attendance today Widget - Live attendance & leave data only */}
        {(() => {
          const todayStr = new Date().toISOString().slice(0, 10);

          // Build unified staff list exactly as AttendancePage does
          const staffList = [...(roster || [])];
          const existingNames = new Set((roster || []).map(r => (r.name || "").toLowerCase()));
          if (Array.isArray(users)) {
            users.forEach(u => {
              if (u.name && !existingNames.has(u.name.toLowerCase())) {
                const userTeamIds = Array.isArray(u.teamIds) && u.teamIds.length > 0 ? u.teamIds : (u.teamId ? [u.teamId] : []);
                const deptNames = Array.isArray(teams)
                  ? teams.filter(t => userTeamIds.includes(t.id)).map(t => t.name).join(", ")
                  : "";
                staffList.push({
                  id: u.id,
                  name: u.name,
                  username: u.username,
                  title: u.title || (userTeamIds.includes("team-admin") ? "Administrator" : "Team Member"),
                  dept: deptNames || "Merchandising",
                  isSystemUser: true
                });
                existingNames.add(u.name.toLowerCase());
              }
            });
          }

          // Real-time status lookup function
          const getLiveStatus = (person) => {
            const onLeave = (leaveRequests || []).find(l =>
              l.status === "approved" &&
              (l.name?.toLowerCase() === (person.name || "").toLowerCase())
            ) || (attendance && attendance[person.name] === "leave");

            if (onLeave) {
              return { status: "leave", label: "On leave", bg: "#FFFBEB", color: "#B45309" };
            }

            const session = (userSessions || []).find(s =>
              (s.date === todayStr || (s.loginTime && s.loginTime.startsWith(todayStr))) &&
              ((s.userId && s.userId === person.id) ||
               (s.username && person.username && s.username.toLowerCase() === person.username.toLowerCase()) ||
               (s.name && person.name && s.name.toLowerCase() === person.name.toLowerCase()))
            );

            if (session || (attendance && attendance[person.name] === "present")) {
              return { status: "present", label: "Present", bg: "#ECFDF5", color: "#047857" };
            }

            return { status: "absent", label: "Absent", bg: "#FEF2F2", color: "#B91C1C" };
          };

          const counts = { present: 0, absent: 0, leave: 0 };
          staffList.forEach(s => {
            const st = getLiveStatus(s);
            counts[st.status]++;
          });

          const totalStaff = staffList.length;
          const presentPct = totalStaff > 0 ? Math.round((counts.present / totalStaff) * 100) : 0;

          return (
            <Card style={{ display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
              <CardHeader title="Attendance today" action="Open" onAction={() => onNavigate("attendance")} />
              {totalStaff === 0 ? (
                <div style={{ fontSize: 12, color: "#B0B2BA", padding: "16px 0" }}>No staff or attendance records recorded yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", gap: 14 }}>
                  {/* Top Banner: Turnout % with live gauge & total staff */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)",
                      borderRadius: 10,
                      border: "1px solid #E2E8F0"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ position: "relative", width: 44, height: 44 }}>
                        <svg viewBox="0 0 36 36" width="44" height="44">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="3.8"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="3.8"
                            strokeDasharray={`${presentPct}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: "#0F172A"
                          }}
                        >
                          {presentPct}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>Overall Turnout</div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Live workforce attendance</div>
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        background: "#FFFFFF",
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                      }}
                    >
                      <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600 }}>Total Team</div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1E293B", marginTop: 1 }}>{totalStaff} staff</div>
                    </div>
                  </div>

                  {/* Turnout Progress Bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 5 }}>
                      <span>Turnout Ratio</span>
                      <span style={{ color: "#0F172A", fontWeight: 700 }}>{counts.present} of {totalStaff} present</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: "#F1F5F9", display: "flex", overflow: "hidden" }}>
                      <div style={{ width: `${(counts.present / (totalStaff || 1)) * 100}%`, background: "#10B981", transition: "width 0.3s" }} />
                      <div style={{ width: `${(counts.leave / (totalStaff || 1)) * 100}%`, background: "#F59E0B", transition: "width 0.3s" }} />
                      <div style={{ width: `${(counts.absent / (totalStaff || 1)) * 100}%`, background: "#EF4444", transition: "width 0.3s" }} />
                    </div>
                  </div>

                  {/* Status 3 Cards Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <div
                      style={{
                        background: "#F0FDF4",
                        border: "1px solid #DCFCE7",
                        borderRadius: 8,
                        padding: "10px 8px",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#166534" }}>Present</div>
                      <div style={{ fontSize: 19, fontWeight: 800, color: "#15803D", marginTop: 2 }}>{counts.present}</div>
                    </div>
                    <div
                      style={{
                        background: "#FEF2F2",
                        border: "1px solid #FEE2E2",
                        borderRadius: 8,
                        padding: "10px 8px",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#991B1B" }}>Absent</div>
                      <div style={{ fontSize: 19, fontWeight: 800, color: "#B91C1C", marginTop: 2 }}>{counts.absent}</div>
                    </div>
                    <div
                      style={{
                        background: "#FFFBEB",
                        border: "1px solid #FEF3C7",
                        borderRadius: 8,
                        padding: "10px 8px",
                        textAlign: "center"
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#92400E" }}>On Leave</div>
                      <div style={{ fontSize: 19, fontWeight: 800, color: "#D97706", marginTop: 2 }}>{counts.leave}</div>
                    </div>
                  </div>

                  {/* Staff Live Attendance Roster */}
                  <div
                    style={{
                      borderTop: "1px solid #F1F5F9",
                      paddingTop: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      maxHeight: 125,
                      overflowY: "auto"
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8A8D98", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
                      Live Roster Status
                    </div>
                    {staffList.slice(0, 6).map((s) => {
                      const st = getLiveStatus(s);
                      return (
                        <div
                          key={s.name}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "4px 0",
                            fontSize: 12
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: "#EEF2F6",
                                color: "#475569",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700
                              }}
                            >
                              {(s.name || "U")[0]}
                            </div>
                            <div>
                              <span style={{ fontWeight: 600, color: "#1E293B" }}>{s.name}</span>
                              <span style={{ fontSize: 10.5, color: "#94A3B8", marginLeft: 6 }}>{s.title || s.dept || ""}</span>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: st.bg,
                              color: st.color,
                              padding: "2px 7px",
                              borderRadius: 999
                            }}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })()}
      </div>

      <DateWiseActivityFeed
        selectedDate={selectedDate}
        orders={orders}
        customTasks={customTasks}
        compliances={compliances}
        certifications={certifications}
        supplierWork={supplierWork}
        notifications={notifications}
        leaveRequests={leaveRequests}
        debitNotes={debitNotes}
        capas={capas}
        attendance={attendance}
        onOpenOrder={onOpenOrder}
        onNavigate={onNavigate}
      />

      {(() => {
        const costingPending = orders.filter(o => o.costingApproval && o.costingApproval.status === "submitted");
        if (costingPending.length === 0) return null;
        return (
          <Card style={{ marginBottom: 16, borderLeft: "4px solid #F59E0B", background: "#FFFDF7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚠️ Costing Approval Sign-off Requests ({costingPending.length})</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#78350F", marginTop: 2 }}>
                  Merchandiser submitted costing sheets requiring sign-off from DGM / Managing Director
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate("approvals")}
                style={{ background: "#F59E0B", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                Go to Approvals →
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
              {costingPending.map(o => (
                <div key={o.id} style={{ background: "#FFFFFF", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: "#1E293B" }}>
                      PO #{o.id} — {o.style}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      Buyer: {o.buyer} · Rate: <b>₹{(o.costingApproval?.grandTotal || 0).toLocaleString()}</b> / pc
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => onOpenOrder && onOpenOrder(o.id)}
                      style={{ background: "#F1F5F9", color: "#334155", border: "none", borderRadius: 6, padding: "5px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      View Sheet
                    </button>
                    {role?.dept === "Executive" || role?.label?.toLowerCase().includes("md") || role?.label?.toLowerCase().includes("managing director") ? (
                      onApproveCosting && (
                        <button
                          onClick={() => onApproveCosting(o.id, role?.label || "Managing Director (MD)")}
                          style={{ background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 2px rgba(16, 185, 129, 0.2)" }}
                        >
                          ✓ Pass
                        </button>
                      )
                    ) : (
                      <span style={{ fontSize: 11, color: "#92400E", fontWeight: 700, background: "#FEF3C7", padding: "4px 8px", borderRadius: 6 }}>
                        Awaiting MD
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Critical alerts" action="Notifications" onAction={() => onNavigate("notifications")} />
        {alerts.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No active alerts. Flag a delay on an order to see it here.</div>
        ) : alerts.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 10px", marginBottom: 6, borderRadius: 8, background: "#FAFAFB", borderLeft: `3px solid ${a.sev === "high" ? "#D64545" : "#E2A83B"}` }}>
            <TriangleAlert size={14} color={a.sev === "high" ? "#D64545" : "#E2A83B"} style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: "#1B2130" }}>{a.text}</div>
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Top orders at risk" action="View all orders" onAction={() => onNavigate("orders")} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.9fr 0.9fr 0.7fr 0.9fr 1.2fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Order / Style</div><div>Buyer</div><div>Ship date</div><div>Status</div><div>Risk</div><div>Predicted delay</div><div></div><div>Primary reason</div>
        </div>
        {topAtRisk.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>No at-risk or delayed orders right now.</div>
        ) : topAtRisk.map(o => (
          <div
            key={o.id}
            onClick={() => onOpenOrder(o.id)}
            style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 0.8fr 0.9fr 0.9fr 0.7fr 0.9fr 1.2fr", alignItems: "center", fontSize: 12.5, padding: "10px 4px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{o.id}</div>
              <div style={{ fontWeight: 600, color: "#1B2130" }}>{o.style}</div>
            </div>
            <div>{o.buyer}</div>
            <div>{o.ship}</div>
            <div>{statusPill(o.status)}</div>
            <div style={{ display: "flex", alignItems: "center", textTransform: "capitalize" }}>{riskDot(o.risk)}{o.risk}</div>
            <div style={{ color: "#D64545", fontWeight: 600 }}>{o.predictedDelay}</div>
            <div></div>
            <div style={{ color: "#565A66" }}>{o.primaryReason}</div>
          </div>
        ))}
      </Card>

      <Card style={{ padding: "18px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            ["Avg Order Lead Time", bottomStats.avgOrderLeadTime],
            ["Avg Sampling Time", bottomStats.avgSamplingTime],
            ["On-Time Approval %", `${bottomStats.onTimeApprovalPct}%`],
            ["Quality Pass Rate", bottomStats.qualityPassRate],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1B2130" }}>{val}</div>
              <div style={{ fontSize: 10.5, color: "#8A8D98", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function MyDepartmentDashboard({
  orders = [],
  role,
  personName,
  onOpenOrder,
  onNavigate,
  selectedDate = "2026-05-12",
  customTasks = [],
  compliances = [],
  certifications = [],
  supplierWork = [],
  notifications = [],
  leaveRequests = [],
  debitNotes = [],
  capas = [],
  attendance = {},
  onUpdateTask = () => {},
  onDeleteTask = () => {},
  onAssignSupplier = () => {}
}) {

   const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_INDEX = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

function toDateKey(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseTaskDueDate(dueStr, orderStartDate) {
  if (!dueStr || typeof dueStr !== "string") return null;
  const trimmed = dueStr.trim();
  if (!trimmed) return null;

  const fromBase = (offsetDays) => {
    let base = new Date();
    if (orderStartDate) {
      const parsed = new Date(orderStartDate);
      if (!isNaN(parsed.getTime())) base = parsed;
    }
    return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDays);
  };

  const dayMatch = trimmed.match(/^day\s*(\d+)(?:\s*[-–]\s*(\d+)|\s+(\d+))?/i);
  if (dayMatch) {
    return fromBase(Math.max(0, parseInt(dayMatch[1], 10) - 1));
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.slice(0, 10).split("-").map(Number);
    if (parts.length === 3 && parts[1] >= 1 && parts[1] <= 12) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }

  const named = trimmed.match(/^(\d{1,2})(?:\s*[-–]\s*\d{1,2})?\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?/);
  if (named) {
    const month = MONTH_INDEX[named[2].slice(0, 3).toLowerCase()];
    if (month != null) {
      let year = named[3] ? parseInt(named[3], 10) : new Date().getFullYear();
      if (orderStartDate) {
        const parsed = new Date(orderStartDate);
        if (!isNaN(parsed.getTime()) && !named[3]) year = parsed.getFullYear();
      }
      return new Date(year, month, parseInt(named[1], 10));
    }
  }

  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  return null;
}

function formatDateKeyLabel(key) {
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return key;
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function calendarTaskTone(item) {
  if (item.kind === "tna") {
    if (item.stage?.reason) return { bg: "#FEE2E2", fg: "#991B1B", border: "#FECACA", bar: "#EF4444" };
    if (item.stage?.status === "in_progress") return { bg: "#FEF3C7", fg: "#92400E", border: "#FDE68A", bar: "#F59E0B" };
    if (item.stage?.status === "pending") return { bg: "#F1F5F9", fg: "#475569", border: "#E2E8F0", bar: "#94A3B8" };
    return { bg: "#D1FAE5", fg: "#065F46", border: "#A7F3D0", bar: "#10B981" };
  }
  if (item.priority === "high" || item.status === "delayed") return { bg: "#FEE2E2", fg: "#991B1B", border: "#FECACA", bar: "#EF4444" };
  if (item.status === "done") return { bg: "#D1FAE5", fg: "#065F46", border: "#A7F3D0", bar: "#10B981" };
  return { bg: "#E0F2FE", fg: "#075985", border: "#BAE6FD", bar: "#0EA5E9" };
}
  const rows = collectTasks(orders, role.dept);
  const openRows = rows.filter(r => r.stage.status !== "done");
  const delayedRows = rows.filter(r => r.stage.reason);
  const linkedOrders = orders.filter(o => o.stages && o.stages.some(s => s.dept === role.dept));

  const reasonCounts = {};
  rows.forEach(r => { if (r.stage.reason) reasonCounts[r.stage.reason] = (reasonCounts[r.stage.reason] || 0) + 1; });
  const reasonArr = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const reasonTotal = reasonArr.reduce((a, [, c]) => a + c, 0) || 1;
  const today = useMemo(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }, []);

  // Which task source(s) the calendar shows: all tasks, only T&A stages, or only custom tasks
  const [taskTab, setTaskTab] = useState("all");

  // Guard against a non-array orders prop and reuse it for order lookups below
  const safeOrders = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);

  // T&A stage rows are already scoped to this department by collectTasks above
  const filteredTnaRows = rows;

  // Custom tasks scoped to this department (tasks without a dept are treated as general/visible to all)
  const filteredCustomTasks = useMemo(() => {
    return (customTasks || []).filter(t => !t.dept || t.dept === role.dept);
  }, [customTasks, role]);

  const priorityColors = {
    low: { bg: "#F1F5F9", fg: "#475569" },
    medium: { bg: "#FEF3C7", fg: "#92400E" },
    high: { bg: "#FEE2E2", fg: "#991B1B" }
  };

  const [calMonth, setCalMonth] = useState(today.getMonth());
    const [calYear, setCalYear] = useState(today.getFullYear());
    const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
    const calendarItems = useMemo(() => {
        const items = [];
        if (taskTab === "all" || taskTab === "tna") {
          filteredTnaRows.forEach((r, idx) => {
            const due = parseTaskDueDate(r.stage?.planned, r.order?.orderDate || r.order?.createdAt || r.order?.ship);
            items.push({
              id: `tna-${r.order?.primaryId || r.order?.id}-${r.stageIdx ?? idx}`,
              kind: "tna",
              dateKey: toDateKey(due),
              title: r.stage?.name || "Stage task",
              dueLabel: r.stage?.planned || "—",
              status: r.stage?.status,
              order: r.order,
              stage: r.stage,
              dept: r.dept,
              reason: r.stage?.reason
            });
          });
        }
        if (taskTab === "all" || taskTab === "custom") {
          filteredCustomTasks.forEach(t => {
            const linkedOrder = safeOrders.find(o =>
              (o.primaryId && o.primaryId === t.orderId) ||
              (o._id && o._id === t.orderId) ||
              o.id === t.orderId
            );
            const due = parseTaskDueDate(t.dueDate, linkedOrder?.orderDate || linkedOrder?.createdAt);
            items.push({
              id: `custom-${t.id}`,
              kind: "custom",
              dateKey: toDateKey(due),
              title: t.title,
              dueLabel: t.dueDate || "—",
              status: t.status,
              task: t,
              order: linkedOrder,
              dept: t.dept,
              assignee: t.assignee,
              priority: t.priority,
              notes: t.notes
            });
          });
        }
        return items;
      }, [filteredTnaRows, filteredCustomTasks, taskTab, safeOrders]);

      const tasksByDate = useMemo(() => {
        const map = {};
        calendarItems.forEach(item => {
          const key = item.dateKey || "unscheduled";
          if (!map[key]) map[key] = [];
          map[key].push(item);
        });
        return map;
      }, [calendarItems]);

      const calendarDays = useMemo(() => {
        const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const days = [];
        const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
          days.push({ day: prevMonthDays - i, isCurrentMonth: false, key: null, tasks: [] });
        }
        for (let day = 1; day <= daysInMonth; day++) {
          const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
          days.push({
            day,
            isCurrentMonth: true,
            isToday,
            key,
            tasks: tasksByDate[key] || []
          });
        }
        const totalCells = days.length > 35 ? 42 : 35;
        const remaining = totalCells - days.length;
        for (let i = 1; i <= remaining; i++) {
          days.push({ day: i, isCurrentMonth: false, key: null, tasks: [] });
        }
        return days;
      }, [calYear, calMonth, today, tasksByDate]);

      const selectedDayTasks = selectedDateKey ? (tasksByDate[selectedDateKey] || []) : [];
      const unscheduledTasks = tasksByDate.unscheduled || [];

      const shiftMonth = (delta) => {
        const next = new Date(calYear, calMonth + delta, 1);
        setCalYear(next.getFullYear());
        setCalMonth(next.getMonth());
      };

      const jumpToToday = () => {
        setCalYear(today.getFullYear());
        setCalMonth(today.getMonth());
        setSelectedDateKey(toDateKey(today));
      };

      const [didAutoJump, setDidAutoJump] = useState(false);
      useEffect(() => {
        if (didAutoJump) return;
        const keys = calendarItems.map(i => i.dateKey).filter(Boolean).sort();
        if (!keys.length) return;
        const todayKey = toDateKey(today);
        const next = keys.find(k => k >= todayKey) || keys[0];
        const [y, m] = next.split("-").map(Number);
        setSelectedDateKey(next);
        setCalYear(y);
        setCalMonth(m - 1);
        setDidAutoJump(true);
      }, [calendarItems, didAutoJump, today]);

  return (
    <div>
      <PageHeader title={`${role.dept}`} sub={`Welcome, ${personName} — you're seeing only what's relevant to your department. Merchandisers, managers, and the MD can see the full organization.`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Open tasks</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#378ADD" }}>{openRows.length}</div>
        </Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Delayed / flagged</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#D64545" }}>{delayedRows.length}</div>
        </Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Orders touching your department</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>{linkedOrders.length}</div>
        </Card>
      </div>

       <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 16, alignItems: "start" }}>
              <Card style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={16} color="#0F766E" />
                      Task calendar
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                      {calendarItems.filter(i => i.dateKey).length} dated · {unscheduledTasks.length} unscheduled
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "inline-flex", background: "#F1F5F9", padding: "2px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                      {[
                        { key: "all", label: "All" },
                        { key: "tna", label: "T&A" },
                        { key: "custom", label: "Custom" }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setTaskTab(tab.key)}
                          style={{
                            padding: "4px 9px",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 6,
                            border: "none",
                            background: taskTab === tab.key ? "#FFFFFF" : "transparent",
                            color: taskTab === tab.key ? "#0F766E" : "#64748B",
                            boxShadow: taskTab === tab.key ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                            cursor: "pointer"
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => shiftMonth(-1)}
                      style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", minWidth: 132, textAlign: "center" }}>
                      {MONTH_NAMES_FULL[calMonth]} {calYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => shiftMonth(1)}
                      style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}
                    >
                      <ChevronRight size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={jumpToToday}
                      style={{
                        marginLeft: 4,
                        padding: "4px 9px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        border: "1px solid #0F766E",
                        background: "#ECFDF5",
                        color: "#0F766E",
                        cursor: "pointer"
                      }}
                    >
                      Today
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: 10.5, fontWeight: 700, color: "#64748B", paddingBottom: 6 }}>
                  <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
                  {calendarDays.map((c, i) => {
                    const hasTasks = c.tasks && c.tasks.length > 0;
                    const isSelected = selectedDateKey && selectedDateKey === c.key;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!c.isCurrentMonth}
                        onClick={() => {
                          if (c.key) setSelectedDateKey(c.key);
                        }}
                        style={{
                          minHeight: 72,
                          borderRadius: 8,
                          fontFamily: "inherit",
                          color: "inherit",
                          border: isSelected
                            ? "1.5px solid #0F766E"
                            : c.isToday
                              ? "1.5px solid #14B8A6"
                              : hasTasks
                                ? "1px solid #99F6E4"
                                : "1px solid #F1F5F9",
                          background: isSelected
                            ? "#ECFDF5"
                            : c.isToday
                              ? "#F0FDFA"
                              : hasTasks
                                ? "#F8FFFC"
                                : c.isCurrentMonth
                                  ? "#FFFFFF"
                                  : "#F8FAFC",
                          padding: "5px 6px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          cursor: c.isCurrentMonth ? "pointer" : "default",
                          opacity: c.isCurrentMonth ? 1 : 0.35,
                          textAlign: "left"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11.5, fontWeight: c.isToday || hasTasks ? 800 : 500, color: c.isToday ? "#0F766E" : "#1E293B" }}>
                            {c.day}
                          </span>
                          {hasTasks && (
                            <span style={{ fontSize: 9, fontWeight: 700, background: "#0F766E", color: "#FFFFFF", borderRadius: 999, padding: "0 5px", lineHeight: "14px" }}>
                              {c.tasks.length}
                            </span>
                          )}
                        </div>
                        {hasTasks && (
                          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                            {c.tasks.slice(0, 2).map(t => {
                              const tone = calendarTaskTone(t);
                              return (
                                <div
                                  key={t.id}
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 600,
                                    color: tone.fg,
                                    background: tone.bg,
                                    borderRadius: 4,
                                    padding: "1px 4px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {t.title}
                                </div>
                              );
                            })}
                            {c.tasks.length > 2 && (
                              <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>+{c.tasks.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap", fontSize: 11, color: "#64748B" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#F59E0B" }} /> In progress</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#EF4444" }} /> Delayed / high</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#0EA5E9" }} /> Custom task</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#10B981" }} /> Done</span>
                </div>
              </Card>

              <Card style={{ padding: "16px 18px", minHeight: 420 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    {selectedDateKey ? formatDateKeyLabel(selectedDateKey) : "Task details"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                    {selectedDayTasks.length} task{selectedDayTasks.length === 1 ? "" : "s"} on this date
                  </div>
                </div>

                {selectedDayTasks.length === 0 ? (
                  <div style={{ padding: "36px 8px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                    No tasks scheduled for this date. Click a highlighted day on the calendar.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 560, overflowY: "auto" }}>
                    {selectedDayTasks.map(item => {
                      const tone = calendarTaskTone(item);
                      const t = item.task;
                      const isDone = item.status === "done";
                      const pStyle = t ? (priorityColors[t.priority] || priorityColors.medium) : null;
                      return (
                        <div
                          key={item.id}
                          style={{
                            border: `1px solid ${tone.border}`,
                            background: "#FFFFFF",
                            borderRadius: 10,
                            padding: "12px 12px 12px 14px",
                            borderLeft: `4px solid ${tone.bar}`,
                            opacity: isDone ? 0.7 : 1
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: isDone ? "#8A8D98" : "#0F172A", textDecoration: isDone ? "line-through" : "none" }}>
                              {item.title}
                            </div>
                            {item.kind === "tna" ? statusPill(item.status) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {pStyle && (
                                  <span style={{ background: pStyle.bg, color: pStyle.fg, fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, textTransform: "capitalize" }}>
                                    {item.priority}
                                  </span>
                                )}
                                {statusPill(item.status)}
                              </div>
                            )}
                          </div>

                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 6, display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
                            {item.order && (
                              <span
                                onClick={() => onOpenOrder && onOpenOrder(item.order.primaryId || item.order.id, item.order.primaryId)}
                                style={{ color: "#0F766E", fontWeight: 700, cursor: "pointer", fontFamily: "monospace" }}
                              >
                                {item.order.id}{item.order.style ? ` · ${item.order.style}` : ""}
                              </span>
                            )}
                            {item.dept && <span>{item.dept}</span>}
                            <span>Due {item.dueLabel}</span>
                            {item.assignee && <span>{item.assignee}</span>}
                          </div>

                          {item.reason && (
                            <div style={{ fontSize: 11.5, color: "#991B1B", marginTop: 6, fontWeight: 600 }}>Flag: {item.reason}</div>
                          )}
                          {item.notes && (
                            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 6 }}>{item.notes}</div>
                          )}

                          {item.kind === "custom" && t && (
                            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#334155", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={e => onUpdateTask(t.id, { status: e.target.checked ? "done" : "in_progress" })}
                                  style={{ cursor: "pointer", accentColor: "#1F9E8D" }}
                                />
                                Mark done
                              </label>
                              <button
                                onClick={() => onAssignSupplier({ orderId: t.orderId || "", dept: t.dept || "Merchandising", taskName: t.title })}
                                style={{
                                  background: "#F0EFFB",
                                  color: "#534AB7",
                                  border: "1px solid #D6D2F3",
                                  borderRadius: 6,
                                  padding: "4px 8px",
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3
                                }}
                              >
                                <Layers size={12} />
                                Assign Supplier
                              </button>
                              <button
                                onClick={() => onDeleteTask(t.id)}
                                style={{
                                  background: "#FCEBEB",
                                  color: "#791F1F",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "4px 8px",
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center"
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}

                          {item.kind === "tna" && item.order && (
                            <button
                              onClick={() => onOpenOrder && onOpenOrder(item.order.primaryId || item.order.id, item.order.primaryId)}
                              style={{
                                marginTop: 10,
                                background: "#ECFDF5",
                                color: "#0F766E",
                                border: "1px solid #A7F3D0",
                                borderRadius: 6,
                                padding: "5px 10px",
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Open order
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {unscheduledTasks.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                      Unscheduled ({unscheduledTasks.length})
                    </div>
                    {unscheduledTasks.map(item => (
                      <div key={item.id} style={{ fontSize: 12, color: "#334155", padding: "6px 0", borderBottom: "1px solid #F8FAFC" }}>
                        {item.title}
                        {item.dueLabel && item.dueLabel !== "—" ? <span style={{ color: "#94A3B8" }}> · {item.dueLabel}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

        <div style={{ display: "grid", gap: 16, marginBottom: 16, marginTop:16 }}>

        <Card>
          <CardHeader title="Top delay reasons in your department" />
          {reasonArr.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No delays flagged in your department.</div>
          ) : reasonArr.map(([reason, count]) => (
            <div key={reason} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                <span style={{ color: "#1B2130" }}>{reason}</span>
                <span style={{ color: "#8A8D98" }}>{count} ({Math.round((count / reasonTotal) * 100)}%)</span>
              </div>
              <div style={{ height: 6, background: "#F0F0F2", borderRadius: 999 }}>
                <div style={{ height: 6, width: `${(count / reasonTotal) * 100}%`, background: "#D64545", borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <DateWiseActivityFeed
        selectedDate={selectedDate}
        orders={orders}
        customTasks={customTasks}
        compliances={compliances}
        certifications={certifications}
        supplierWork={supplierWork}
        notifications={notifications}
        leaveRequests={leaveRequests}
        debitNotes={debitNotes}
        capas={capas}
        attendance={attendance}
        onOpenOrder={onOpenOrder}
        onNavigate={onNavigate}
      />
    </div>
  );
}