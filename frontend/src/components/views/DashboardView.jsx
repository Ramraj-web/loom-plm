import React, { useState, useMemo } from "react";
import {
  Package, CheckCircle2, TriangleAlert, ArrowDownRight, Zap, Factory, Clock, CircleAlert,
  Calendar, CheckSquare, Layers, ShieldCheck, Bell, DollarSign, ChevronRight, ChevronLeft, Truck
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import {
  SHIPMENT_PERFORMANCE, computeMonthlyShipmentPerformance, TA_STAGES, STAGE_ICON_SET_BASE, ORG_STRUCTURE, RISK_DELAY_DAYS,
  collectActivitiesForDate, formatDisplayDate, isSameDay
} from "../../constants/loomData.js";
import {
  Card, CardHeader, PageHeader, statusPill, riskDot, collectTasks
} from "../common/CommonUI.jsx";

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
    <Card style={{ display: "flex", flexDirection: "column", height: "93%", padding: "16px 18px" }}>
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
  onOpenDept
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
      const count = activeOrders.filter(o => o.stages && o.stages[i] && (o.stages[i].status === "done" || o.stages[i].status === "in_progress")).length;
      return { name: s.name, count };
    });
  }, [activeOrders]);

  const summary = useMemo(() => {
    const completed = allStages.filter(s => s.status === "done").length;
    const inProgress = allStages.filter(s => s.status === "in_progress" && !s.reason).length;
    const atRisk = allStages.filter(s => s.status === "in_progress" && s.reason).length;
    const pending = allStages.filter(s => s.status === "pending").length;
    return { completed, inProgress, atRisk, pending, total: allStages.length || 1 };
  }, [allStages]);

  const reasonCounts = useMemo(() => {
    const counts = {};
    allStages.forEach(s => { if (s.reason) counts[s.reason] = (counts[s.reason] || 0) + 1; });
    const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalFlags = arr.reduce((a, [, c]) => a + c, 0) || 1;
    return { arr, totalFlags };
  }, [allStages]);

  const departmentCounts = useMemo(() => {
    const depts = Object.keys(ORG_STRUCTURE);
    return depts.map(dept => {
      const count = allStages.filter(s => s.dept === dept && s.reason).length;
      return { dept, count };
    }).filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [allStages]);

  const productionPlan = useMemo(() => {
    const totalQty = activeOrders.reduce((a, o) => a + (Number(o.qty) || 0), 0);
    const avgProgress = activeOrders.length > 0
      ? activeOrders.reduce((a, o) => a + (o.stages ? o.stages.filter(s => s.status === "done").length / o.stages.length : 0), 0) / activeOrders.length
      : 0;
    const actual = Math.round(totalQty * avgProgress);
    return { totalQty, actual, balance: totalQty - actual, pct: Math.round(avgProgress * 100) };
  }, [activeOrders]);

  const alerts = useMemo(() => {
    const items = [];
    activeOrders.forEach(o => {
      if (!o.stages) return;
      o.stages.forEach(s => {
        if (s.reason) items.push({ text: `${s.reason} — ${o.style} PO #${o.id} (${s.dept})`, sev: o.risk });
      });
    });
    return items.slice(0, 5);
  }, [activeOrders]);

  const topAtRisk = useMemo(() => {
    return activeOrders
      .filter(o => o.status !== "On Track")
      .sort((a, b) => (a.risk === "high" ? 0 : 1) - (b.risk === "high" ? 0 : 1))
      .slice(0, 5)
      .map(o => {
        const flagged = o.stages ? o.stages.find(s => s.reason) : null;
        return { ...o, predictedDelay: `${RISK_DELAY_DAYS[o.risk] || 1} Day${(RISK_DELAY_DAYS[o.risk] || 1) > 1 ? "s" : ""}`, primaryReason: flagged ? flagged.reason : "—" };
      });
  }, [activeOrders]);

  const riskCounts = useMemo(() => ({
    high: activeOrders.filter(o => o.risk === "high").length,
    medium: activeOrders.filter(o => o.risk === "medium").length,
    low: activeOrders.filter(o => o.risk === "low").length,
  }), [activeOrders]);
  const riskPieData = [
    { name: "High risk", value: riskCounts.high, color: "#D64545" },
    { name: "Medium risk", value: riskCounts.medium, color: "#E2A83B" },
    { name: "Low risk", value: riskCounts.low, color: "#1F9E8D" },
  ].filter(d => d.value > 0);

  const lookFirstText = useMemo(() => {
    if (departmentCounts.length === 0) return null;
    const top = departmentCounts.slice(0, 2).map(d => d.dept);
    const topSum = departmentCounts.slice(0, 2).reduce((a, d) => a + d.count, 0);
    const pct = Math.round((topSum / reasonCounts.totalFlags) * 100);
    return top.length === 2
      ? `${top[0]} and ${top[1]} delays account for ${pct}% of flagged issues this week.`
      : `${top[0]} delays account for ${pct}% of flagged issues this week.`;
  }, [departmentCounts, reasonCounts]);

  const aiInsightText = useMemo(() => {
    if (reasonCounts.arr.length === 0) return null;
    const [topReason, topCount] = reasonCounts.arr[0];
    const pct = Math.round((topCount / reasonCounts.totalFlags) * 100);
    return `${riskCounts.high} order${riskCounts.high === 1 ? "" : "s"} carry high shipment risk — the leading cause is ${topReason} (${pct}%).`;
  }, [reasonCounts, riskCounts]);

  const myTasksPreview = useMemo(() => {
    const items = [];
    activeOrders.forEach(o => {
      if (!o.stages) return;
      o.stages.forEach(s => {
        if (s.status === "in_progress") items.push({ order: o, stage: s });
      });
    });
    return items.slice(0, 4);
  }, [activeOrders]);

  const bottomStats = useMemo(() => {
    const approvalStages = allStages.filter(s => s.name.toLowerCase().includes("approval"));
    const doneApprovals = approvalStages.filter(s => s.status === "done" && !s.reason).length;
    const onTimeApprovalPct = approvalStages.length > 0 ? Math.round((doneApprovals / approvalStages.length) * 100) : 0;

    const floorStages = allStages.filter(s => s.dept === "Cutting" || s.dept === "Production");
    const doneFloor = floorStages.filter(s => s.status === "done").length;
    const capacityUtilPct = floorStages.length > 0 ? Math.round((doneFloor / floorStages.length) * 100) : 0;

    return { onTimeApprovalPct, capacityUtilPct };
  }, [allStages]);

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
      <PageHeader title="Dashboard" sub="Real-time overview of all orders and operations" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
        {cards.map(c => (
          <Card key={c.label} style={{ padding: "16px 18px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <c.Icon size={15} color={c.color} />
            </div>
            <div style={{ fontSize: 12.5, color: "#8A8D98" }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 10.5, color: c.delta.startsWith("-") ? "#D64545" : "#1F9E8D", marginTop: 4, fontWeight: 600 }}>{c.delta}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 0.9fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader title="Orders by department" sub="Delay flags" action="View all" onAction={() => onNavigate("departments")} />
          {departmentCounts.length === 0 ? (
            <div style={{ fontSize: 12, color: "#B0B2BA" }}>No delays flagged yet.</div>
          ) : departmentCounts.map((d, i) => {
            const max = Math.max(...departmentCounts.map(x => x.count), 1);
            const dotColor = ["#D64545", "#E2A83B", "#378ADD", "#1F9E8D", "#7F77DD", "#B0812E"][i % 6];
            return (
              <div
                key={d.dept}
                onClick={() => onOpenDept && onOpenDept(d.dept)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  cursor: "pointer",
                  padding: "4px 6px",
                  borderRadius: 6,
                  transition: "background 0.15s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#F4F4F6"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                title={`Click to open ${d.dept} department page`}
              >
                <span style={{ width: 7, height: 7, borderRadius: 999, background: dotColor, flexShrink: 0 }} />
                <div style={{ width: 85, fontSize: 11.5, color: "#1E293B", fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{d.dept}</span>
                  <span style={{ fontSize: 10, color: "#6366F1" }}>→</span>
                </div>
                <div style={{ flex: 1, height: 7, background: "#F0F0F2", borderRadius: 999 }}>
                  <div style={{ height: 7, width: `${(d.count / max) * 100}%`, background: dotColor, borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 12, color: "#8A8D98", width: 16, textAlign: "right" }}>{d.count}</div>
              </div>
            );
          })}
          {lookFirstText && (
            <div style={{ background: "#F0EFFB", border: "1px solid #DCD8F5", borderRadius: 10, padding: "10px 12px", marginTop: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#534AB7", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 }}>Where to look first</div>
              <div style={{ fontSize: 12, color: "#3D3878" }}>{lookFirstText}</div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Shipment performance"
            sub={shipmentTrendData.rangeLabel ? `${shipmentTrendData.rangeLabel} (Based on Orders)` : "Last 6 months"}
          />
          <div style={{ width: "100%", height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shipmentTrendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A8D98" }} axisLine={{ stroke: "#F0F0F2" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8A8D98" }} axisLine={false} tickLine={false} domain={[0, 100]} />
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
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="onTime" name="Actual On-time %" stroke="#534AB7" strokeWidth={2} dot={{ r: 3 }} connectNulls={true} />
                <Line type="monotone" dataKey="target" name="Target Goal % (75% Benchmark)" stroke="#B0B2BA" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ background: "#fff" }}>
          <CardHeader title="Risk analysis" action="View insights" onAction={() => onNavigate("insights")} />
          <div style={{ width: "100%", height: 140, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskPieData.length ? riskPieData : [{ name: "No risk", value: 1, color: "#E7E8ED" }]} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={3} stroke="none">
                  {(riskPieData.length ? riskPieData : [{ color: "#E7E8ED" }]).map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1B2130" }}>{stats.total}</div>
              <div style={{ fontSize: 10, color: "#8A8D98" }}>Orders</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: "center", marginTop: 4, marginBottom: 12 }}>
            {[["High", "#D64545"], ["Medium", "#E2A83B"], ["Low", "#1F9E8D"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#8A8D98" }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: c }} /> {l}
              </div>
            ))}
          </div>
          {aiInsightText && (
            <div style={{ background: "#F0EFFB", border: "1px solid #DCD8F5", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#534AB7", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 3 }}>AI Insight</div>
              <div style={{ fontSize: 12, color: "#3D3878" }}>{aiInsightText}</div>
            </div>
          )}
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="T&A progress overview (all orders)" sub="21-step workflow from the T&A template" action="Timeline / calendar" onAction={() => onNavigate("calendar")} />
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8 }}>
          {stageCounts.map((s, i) => {
            const Icon = STAGE_ICON_SET_BASE[i % STAGE_ICON_SET_BASE.length];
            return (
              <div key={s.name} style={{ flex: "0 0 64px", textAlign: "center" }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, background: "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <Icon size={14} color="#534AB7" />
                </div>
                <div style={{ fontSize: 9.5, color: "#8A8D98", marginTop: 6, lineHeight: 1.25 }}>{s.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2130", marginTop: 2 }}>{s.count}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 20, paddingTop: 16, borderTop: "1px solid #F0F0F2" }}>
          <div>
            <div style={{ fontSize: 11.5, color: "#1F9E8D", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} />Completed</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{summary.completed} <span style={{ fontSize: 11, color: "#8A8D98", fontWeight: 400 }}>({Math.round((summary.completed / summary.total) * 100)}%)</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#378ADD", display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />In progress</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{summary.inProgress} <span style={{ fontSize: 11, color: "#8A8D98", fontWeight: 400 }}>({Math.round((summary.inProgress / summary.total) * 100)}%)</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#E2A83B", display: "flex", alignItems: "center", gap: 4 }}><TriangleAlert size={12} />At risk</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{summary.atRisk} <span style={{ fontSize: 11, color: "#8A8D98", fontWeight: 400 }}>({Math.round((summary.atRisk / summary.total) * 100)}%)</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "#D64545", display: "flex", alignItems: "center", gap: 4 }}><CircleAlert size={12} />Pending</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{summary.pending} <span style={{ fontSize: 11, color: "#8A8D98", fontWeight: 400 }}>({Math.round((summary.pending / summary.total) * 100)}%)</span></div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.9fr", gap: 16, marginBottom: 16 }}>
        <OrderDeliveryCalendarWidget orders={orders} onOpenOrder={onOpenOrder} onNavigate={onNavigate} />

        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <CardHeader title="My tasks" action="Open" onAction={() => onNavigate("tasks")} />
            {myTasksPreview.length === 0 ? (
              <div style={{ fontSize: 12, color: "#B0B2BA" }}>Nothing in progress right now.</div>
            ) : myTasksPreview.map((item, i) => {
              const due = item.stage.reason
                ? { label: "Overdue", bg: "#FCEBEB", fg: "#791F1F" }
                : [{ label: "Due Today", bg: "#FCEBEB", fg: "#791F1F" }, { label: "Tomorrow", bg: "#FAEEDA", fg: "#633806" }, { label: "In 2 Days", bg: "#E6F1FB", fg: "#1D5A8A" }][i % 3];
              return (
                <div key={item.order.id + item.stage.name} onClick={() => onOpenOrder(item.order.id)} style={{ padding: "8px 0", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1B2130" }}>{item.stage.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: due.bg, color: due.fg, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{due.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>{item.order.style} · {item.order.buyer}</div>
                </div>
              );
            })}
          </Card>
          {attendance && roster && (
            <Card>
              <CardHeader title="Attendance today" action="Open" onAction={() => onNavigate("attendance")} />
              {(() => {
                const counts = { present: 0, absent: 0, leave: 0 };
                roster.forEach(s => { counts[attendance[s.name] || "present"]++; });
                return [["Present", counts.present, "#1F9E8D"], ["Absent", counts.absent, "#D64545"], ["On leave", counts.leave, "#E2A83B"]].map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #F5F5F7", fontSize: 12 }}>
                    <span style={{ color: "#565A66" }}>{label}</span>
                    <span style={{ fontWeight: 700, color }}>{val}</span>
                  </div>
                ));
              })()}
            </Card>
          )}
        </div>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
          {[
            ["Avg Order Lead Time", "87 days"],
            ["Avg Sampling Time", "24 days"],
            ["On-Time Approval %", `${bottomStats.onTimeApprovalPct}%`],
            ["Quality Pass Rate", "93.4%"],
            ["Production Efficiency", `${productionPlan.pct}%`],
            ["Capacity Utilization", `${bottomStats.capacityUtilPct}%`],
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
  attendance = {}
}) {
  const rows = collectTasks(orders, role.dept);
  const openRows = rows.filter(r => r.stage.status !== "done");
  const delayedRows = rows.filter(r => r.stage.reason);
  const linkedOrders = orders.filter(o => o.stages && o.stages.some(s => s.dept === role.dept));

  const reasonCounts = {};
  rows.forEach(r => { if (r.stage.reason) reasonCounts[r.stage.reason] = (reasonCounts[r.stage.reason] || 0) + 1; });
  const reasonArr = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const reasonTotal = reasonArr.reduce((a, [, c]) => a + c, 0) || 1;

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

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader title="Your orders" action="My tasks" onAction={() => onNavigate("tasks")} />
          {linkedOrders.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No orders currently touch your department.</div>
          ) : linkedOrders.map(o => (
            <div
              key={o.id}
              onClick={() => onOpenOrder(o.id)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{o.id}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{o.style} <span style={{ color: "#8A8D98", fontWeight: 400 }}>· {o.buyer}</span></div>
              </div>
              {statusPill(o.status)}
            </div>
          ))}
        </Card>

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
