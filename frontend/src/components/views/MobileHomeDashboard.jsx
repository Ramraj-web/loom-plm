import React, { useMemo } from "react";
import {
  Package, AlertTriangle, CheckSquare, ClipboardCheck, Bell,
  Calendar, Clock, ChevronRight, Home, Users, CheckCircle, TrendingUp,
  ArrowRight, ShieldCheck, DollarSign
} from "lucide-react";
import { statusPill, riskDot, collectTasks } from "../common/CommonUI.jsx";
import { formatTimeAgo } from "../../constants/loomData.js";
import { MobileBottomNav } from "./MobileBottomNav.jsx";

/**
 * MobileHomeDashboard
 * Modern light, clean mobile Home Dashboard.
 * Color updates: Light background, white cards, soft borders, soft blue primary accents,
 * balanced red/amber/teal/purple accents. No dominant green.
 */
export function MobileHomeDashboard({
  orders = [],
  customTasks = [],
  notifications = [],
  role = {},
  activeUser = {},
  onOpenOrder,
  onNavigate,
  isDarkMode = false
}) {
  // Deduplicate and filter active, non-deleted orders
  const activeOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return list.filter(o => o && o.isDeleted !== true && o.isDeleted !== "true" && !o.deletedAt && !o.completed);
  }, [orders]);

  // At-risk or delayed orders
  const atRiskOrDelayedOrders = useMemo(() => {
    return activeOrders.filter(o => o.status === "At Risk" || o.status === "Delayed" || o.risk === "high" || o.risk === "medium");
  }, [activeOrders]);

  // User's pending T&A tasks and assigned custom tasks
  const myPendingTasks = useMemo(() => {
    const userDeptList = Array.isArray(role?.departments) && role.departments.length > 0
      ? role.departments.map(d => d.toLowerCase())
      : [(role?.dept || "").toLowerCase()];

    // 1. T&A stages assigned or in user's dept that are not completed
    const tnaTasks = collectTasks(activeOrders, null).filter(r => {
      if (r.stage.status === "done") return false;
      if (role?.fullAccess || role?.dept === "Administrators" || role?.dept === "Executive") return true;
      return r.dept && userDeptList.includes(r.dept.toLowerCase());
    });

    // 2. Custom action items assigned to user or user's dept
    const cleanUser = String(activeUser?.name || role?.label || "").split(" (")[0].trim().toLowerCase();
    const cleanUsername = String(activeUser?.username || "").trim().toLowerCase();

    const customItems = (Array.isArray(customTasks) ? customTasks : []).filter(t => {
      if (!t || t.isDeleted || t.status === "done") return false;
      if (role?.fullAccess || role?.dept === "Administrators" || role?.dept === "Executive") return true;
      const assignee = String(t.assignee || "").replace(/^@/, "").toLowerCase();
      const directMatch = (cleanUser && (assignee === cleanUser || assignee.includes(cleanUser))) ||
        (cleanUsername && (assignee === cleanUsername || assignee.includes(cleanUsername)));
      if (directMatch) return true;
      return t.dept && (userDeptList.includes(t.dept.toLowerCase()) || t.dept === "All");
    });

    return {
      tnaCount: tnaTasks.length,
      customCount: customItems.length,
      totalCount: tnaTasks.length + customItems.length,
      preview: [
        ...customItems.slice(0, 3).map(t => ({
          id: t.id,
          title: t.title,
          dept: t.dept,
          due: t.dueDate,
          type: "custom",
          orderId: t.orderId
        })),
        ...tnaTasks.slice(0, 3).map(r => ({
          id: `${r.order.id}-${r.stage.name}`,
          title: `${r.order.id} · ${r.stage.name}`,
          dept: r.dept,
          due: r.stage.planned,
          type: "tna",
          orderId: r.order.id,
          primaryId: r.order.primaryId
        }))
      ].slice(0, 4)
    };
  }, [activeOrders, customTasks, role, activeUser]);

  // Pending Approvals (Costing sign-offs & Buyer/management checkpoints)
  const pendingApprovals = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    // Costing approval requests
    const costingPending = list.filter(o => o && !o.isDeleted && o.costingApproval && o.costingApproval.status === "submitted");

    // Stage checkpoints needing approvals (Fit, PP, Lab Dip, etc.)
    const approvalStages = collectTasks(list, null).filter(r =>
      r.stage.status !== "done" &&
      (r.stage.name.toLowerCase().includes("approval") || r.stage.name === "Tech Pack Received")
    );

    return {
      costingCount: costingPending.length,
      stageCount: approvalStages.length,
      totalCount: costingPending.length + approvalStages.length,
      preview: [
        ...costingPending.slice(0, 2).map(o => ({
          id: o.primaryId || o.id,
          title: `Costing Sign-off: ${o.id} (${o.style})`,
          sub: `${o.buyer || "Buyer"} · ₹${Number(o.costingApproval?.grandTotal || 0).toLocaleString()}`,
          orderId: o.primaryId || o.id
        })),
        ...approvalStages.slice(0, 2).map(r => ({
          id: `${r.order.id}-${r.stage.name}`,
          title: `${r.order.id}: ${r.stage.name}`,
          sub: `${r.order.style} · ${r.dept}`,
          orderId: r.order.primaryId || r.order.id
        }))
      ].slice(0, 3)
    };
  }, [orders]);

  // Recent important notifications
  const recentImportantNotifications = useMemo(() => {
    const notifs = Array.isArray(notifications) ? notifications : [];
    return notifs.slice(0, 4);
  }, [notifications]);

  const userName = (activeUser?.name || role?.label || "User").split(" (")[0];
  const userDept = role?.dept || "Operations";

  // Dynamic time-of-day greeting based on current local time
  const timeGreeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div
      className="mobile-home-dashboard"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        paddingBottom: 76,
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}
    >
      {/* Clean Light Top App Bar with Soft Blue Accent */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#FFFFFF",
          color: "#0F172A",
          padding: "12px 16px",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#EFF6FF",
              color: "#2563EB",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: "#0F172A" }}>
              Loom PLM
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
              {userName} · <span style={{ color: "#2563EB" }}>{userDept}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("notifications")}
            style={{
              position: "relative",
              cursor: "pointer",
              padding: 7,
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: "#F8FAFC",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {recentImportantNotifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#EF4444"
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Main Body Content */}
      <div style={{ padding: "14px 14px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        
        {/* Personalized Greeting Section */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: "16px 16px 14px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#0F172A",
                letterSpacing: -0.3,
                lineHeight: 1.25,
                marginBottom: 3
              }}
            >
              {timeGreeting}, <span style={{ color: "#2563EB" }}>{userName}</span> 👋
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "#64748B",
                fontWeight: 500
              }}
            >
              Here's what's happening today
            </div>
          </div>
          <div
            style={{
              padding: "4px 8px",
              borderRadius: 8,
              background: "#EFF6FF",
              border: "1px solid #DBEAFE",
              color: "#2563EB",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
              alignSelf: "flex-start"
            }}
          >
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>
        
        {/* Quick KPI Overview Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* 1. Active Orders Card */}
          <div
            onClick={() => onNavigate && onNavigate("orders")}
            role="button"
            tabIndex={0}
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "14px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              border: "1px solid #E2E8F0",
              cursor: "pointer",
              transition: "all 0.15s ease",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#EFF6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Package size={17} color="#2563EB" />
              </div>
              <ChevronRight size={15} color="#94A3B8" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#2563EB", letterSpacing: -0.5 }}>
              {activeOrders.length}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginTop: 2 }}>
              Active Orders
            </div>
          </div>

          {/* 2. At Risk / Delayed Card */}
          <div
            onClick={() => {
              if (onNavigate) {
                try {
                  const filterObj = { type: "status", value: "Delayed" };
                  localStorage.setItem("loom_orders_drilldown_filter", JSON.stringify(filterObj));
                  window.dispatchEvent(new CustomEvent("loom_orders_drilldown_filter_change", { detail: filterObj }));
                } catch (e) {}
                onNavigate("orders");
              }
            }}
            role="button"
            tabIndex={0}
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "14px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              border: "1px solid #E2E8F0",
              borderLeft: "4px solid #EF4444",
              cursor: "pointer",
              transition: "all 0.15s ease",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <AlertTriangle size={17} color="#DC2626" />
              </div>
              <ChevronRight size={15} color="#94A3B8" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#DC2626", letterSpacing: -0.5 }}>
              {atRiskOrDelayedOrders.length}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginTop: 2 }}>
              At Risk / Delayed
            </div>
          </div>

          {/* 3. My Pending Tasks Card */}
          <div
            onClick={() => onNavigate && onNavigate("tasks")}
            role="button"
            tabIndex={0}
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "14px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              border: "1px solid #E2E8F0",
              cursor: "pointer",
              transition: "all 0.15s ease",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#F5F3FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <CheckSquare size={17} color="#7C3AED" />
              </div>
              <ChevronRight size={15} color="#94A3B8" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#7C3AED", letterSpacing: -0.5 }}>
              {myPendingTasks.totalCount}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginTop: 2 }}>
              Pending Tasks
            </div>
          </div>

          {/* 4. Pending Approvals Card */}
          <div
            onClick={() => onNavigate && onNavigate("approvals")}
            role="button"
            tabIndex={0}
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "14px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              border: "1px solid #E2E8F0",
              cursor: "pointer",
              transition: "all 0.15s ease",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#FFFBEB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <ClipboardCheck size={17} color="#D97706" />
              </div>
              <ChevronRight size={15} color="#94A3B8" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#D97706", letterSpacing: -0.5 }}>
              {pendingApprovals.totalCount}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginTop: 2 }}>
              Pending Approvals
            </div>
          </div>
        </div>

        {/* Section 1: At-Risk / Delayed Orders List */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
            border: "1px solid #E2E8F0"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                At-Risk & Delayed Orders
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("orders")}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0
              }}
            >
              View all →
            </button>
          </div>

          {atRiskOrDelayedOrders.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", color: "#94A3B8", fontSize: 12.5 }}>
              ✨ Great news! All active orders are currently on track.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {atRiskOrDelayedOrders.slice(0, 3).map(o => (
                <div
                  key={o.primaryId || o.id}
                  onClick={() => onOpenOrder && onOpenOrder(o.primaryId || o.id, o.primaryId)}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 12px",
                    borderRadius: 10,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        {o.id}
                      </span>
                      {statusPill(o.status)}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.style} · {o.buyer || "Direct Buyer"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>
                      {o.ship || "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 700, marginTop: 2 }}>
                      {o.risk ? `${o.risk.toUpperCase()} RISK` : "DELAYED"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: My Pending Tasks */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
            border: "1px solid #E2E8F0"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                My Action Items & Tasks
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("tasks")}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0
              }}
            >
              View all ({myPendingTasks.totalCount}) →
            </button>
          </div>

          {myPendingTasks.preview.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", color: "#94A3B8", fontSize: 12.5 }}>
              No open tasks assigned to you right now.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myPendingTasks.preview.map(task => (
                <div
                  key={task.id}
                  onClick={() => {
                    if (task.orderId && onOpenOrder) {
                      onOpenOrder(task.primaryId || task.orderId);
                    } else if (onNavigate) {
                      onNavigate("tasks");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 12px",
                    borderRadius: 10,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      Dept: <b>{task.dept}</b> {task.due ? `· Due: ${task.due}` : ""}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#2563EB",
                      background: "#EFF6FF",
                      padding: "2px 8px",
                      borderRadius: 6,
                      flexShrink: 0
                    }}
                  >
                    Open
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Pending Approvals */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
            border: "1px solid #E2E8F0"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                Pending Approvals ({pendingApprovals.totalCount})
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("approvals")}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0
              }}
            >
              Open →
            </button>
          </div>

          {pendingApprovals.preview.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", color: "#94A3B8", fontSize: 12.5 }}>
              All approval checkpoints are up to date.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingApprovals.preview.map(appr => (
                <div
                  key={appr.id}
                  onClick={() => {
                    if (appr.orderId && onOpenOrder) {
                      onOpenOrder(appr.orderId);
                    } else if (onNavigate) {
                      onNavigate("approvals");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 12px",
                    borderRadius: 10,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {appr.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      {appr.sub}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#92400E",
                      background: "#FEF3C7",
                      padding: "2px 8px",
                      borderRadius: 6,
                      flexShrink: 0
                    }}
                  >
                    Action
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Recent Important Notifications */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
            border: "1px solid #E2E8F0"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB" }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                Recent Alerts & Updates
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("notifications")}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0
              }}
            >
              All →
            </button>
          </div>

          {recentImportantNotifications.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", color: "#94A3B8", fontSize: 12.5 }}>
              No recent notifications.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentImportantNotifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => onNavigate && onNavigate("notifications")}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 11px",
                    borderRadius: 10,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer"
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: n.priority === "critical" ? "#FEE2E2" : "#EFF6FF",
                      color: n.priority === "critical" ? "#DC2626" : "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  >
                    <Bell size={14} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.title || n.message}
                    </div>
                    {n.title && n.message && (
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.message}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>
                      {n.createdAt ? formatTimeAgo(n.createdAt) : "Recently"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Five-Tab Unified Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab="home"
        onNavigate={onNavigate}
        unreadCount={recentImportantNotifications.length}
        pendingApprovalsCount={pendingApprovals.totalCount}
        pendingTasksCount={myPendingTasks.totalCount}
      />
    </div>
  );
}
