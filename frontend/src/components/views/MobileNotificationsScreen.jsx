import React, { useState, useMemo } from "react";
import {
  Bell, CheckCheck, Trash2, ChevronRight, Package, Calendar,
  CheckSquare, Award, ShieldCheck, TriangleAlert, Filter
} from "lucide-react";
import { formatTimeAgo, NOTIFICATION_PRIORITY_STYLE } from "../../constants/loomData.js";
import { MobileBottomNav } from "./MobileBottomNav.jsx";
import { registerPushDevice, getNotificationPermission, isPushNotificationSupported, triggerMobileDrawerAlert } from "../../utils/pushAlerts.js";
import { Smartphone, CheckCircle2 } from "lucide-react";

/**
 * MobileNotificationsScreen
 * Clean light mobile Notifications / Updates screen.
 */
export function MobileNotificationsScreen({
  notifications = [],
  activeUser = null,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenOrder,
  onNavigate
}) {
  const [pushPermission, setPushPermission] = useState(() => getNotificationPermission());
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [testSent, setTestSent] = useState(false);
  const handleSendTestAlert = () => {
    setTestSent(true);
    triggerMobileDrawerAlert({
      title: "LOOM PLM Alert 🔔",
      message: `Hello ${activeUser?.name || "User"}! Mobile notification drawer alert is working perfectly.`,
      priority: "high"
    });
    try {
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: activeUser?.id,
          title: "LOOM PLM Alert 🔔",
          message: `Hello ${activeUser?.name || "User"}! Mobile notification drawer alert is working.`,
          priority: "high"
        })
      }).catch(() => {});
    } catch (e) {}
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleEnablePush = async () => {
    setIsSubscribing(true);
    try {
      await registerPushDevice(activeUser);
      setPushPermission(getNotificationPermission());
    } finally {
      setIsSubscribing(false);
    }
  };

    const [filterTab, setFilterTab] = useState("all"); // 'all' | 'unread' | 'tasks' | 'orders'

  const safeNotifs = useMemo(() => {
    return (Array.isArray(notifications) ? notifications : []).filter(n => n && n.isDeleted !== true);
  }, [notifications]);

  const unreadCount = useMemo(() => safeNotifs.filter(n => !n.isRead).length, [safeNotifs]);

  const filteredNotifs = useMemo(() => {
    return safeNotifs.filter(n => {
      if (filterTab === "unread" && n.isRead) return false;
      if (filterTab === "tasks" && n.type !== "task" && n.relatedModule !== "tasks") return false;
      if (filterTab === "orders" && n.type !== "order" && n.relatedModule !== "orders") return false;
      return true;
    });
  }, [safeNotifs, filterTab]);

  const handleNotifClick = (notif) => {
    if (onMarkAsRead && !notif.isRead) {
      onMarkAsRead(notif.id);
    }
    if ((notif.relatedModule === "orders" || notif.type === "order" || notif.type === "tna") && notif.relatedId) {
      if (onOpenOrder) onOpenOrder(notif.relatedId);
    } else if (notif.relatedModule === "tasks" || notif.type === "task") {
      if (onNavigate) onNavigate("tasks");
    } else if (notif.relatedModule === "approvals" || notif.type === "approval") {
      if (onNavigate) onNavigate("approvals");
    }
  };

  const getNotifIcon = (n) => {
    const priority = n.priority || "medium";
    if (priority === "critical") return <TriangleAlert size={16} color="#DC2626" />;
    if (n.type === "order") return <Package size={16} color="#2563EB" />;
    if (n.type === "task") return <CheckSquare size={16} color="#7C3AED" />;
    if (n.type === "tna") return <Calendar size={16} color="#2563EB" />;
    return <Bell size={16} color="#2563EB" />;
  };

  return (
    <div
      className="mobile-notifications-screen"
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
      {/* Header */}
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
              fontSize: 16
            }}
          >
            <Bell size={19} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>Updates & Alerts</div>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
              <span style={{ color: "#2563EB", fontWeight: 700 }}>{unreadCount}</span> unread
            </div>
          </div>
        </div>

        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            onClick={onMarkAllAsRead}
            style={{
              background: "#EFF6FF",
              color: "#2563EB",
              border: "1px solid #BFDBFE",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Main Container */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Mobile Drawer Alert Card */}
        {isPushNotificationSupported() && (
          pushPermission !== "granted" ? (
            <div style={{
              background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
              border: "1px solid #BFDBFE",
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", flexShrink: 0 }}>
                  <Smartphone size={17} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF" }}>Mobile Drawer Alerts</div>
                  <div style={{ fontSize: 11, color: "#3B82F6", fontWeight: 500 }}>Get instant phone drawer alerts like SMS</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={isSubscribing}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 12px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "0 1px 3px rgba(37,99,235,0.3)"
                }}
              >
                {isSubscribing ? "Activating..." : "Enable"}
              </button>
            </div>
          ) : (
            <div style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 10,
              padding: "9px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#166534", fontWeight: 600 }}>
                <CheckCircle2 size={15} color="#16A34A" />
                <span>Mobile Drawer Alerts: <strong>Active</strong></span>
              </div>
              <button
                type="button"
                onClick={handleSendTestAlert}
                style={{
                  background: testSent ? "#059669" : "#16A34A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 7,
                  padding: "5px 11px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: "0 1px 2px rgba(22,163,74,0.3)"
                }}
              >
                <Bell size={12} />
                {testSent ? "Alert Sent! ✓" : "Send Test Alert"}
              </button>
            </div>
          )
        )}

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { id: "all", label: `All (${safeNotifs.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "tasks", label: "Tasks" },
            { id: "orders", label: "Orders" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: "6px 13px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: filterTab === tab.id ? 700 : 500,
                border: "1px solid",
                borderColor: filterTab === tab.id ? "#2563EB" : "#E2E8F0",
                background: filterTab === tab.id ? "#2563EB" : "#FFFFFF",
                color: filterTab === tab.id ? "#FFFFFF" : "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {filteredNotifs.length === 0 ? (
            <div style={{ background: "#FFFFFF", padding: "36px 20px", borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center", color: "#64748B" }}>
              <Bell size={36} color="#2563EB" style={{ margin: "0 auto 10px", opacity: 0.8 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>No notifications</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>You are completely caught up!</div>
            </div>
          ) : (
            filteredNotifs.map(n => {
              const isUnread = !n.isRead;
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    background: isUnread ? "#FFFFFF" : "#F8FAFC",
                    borderRadius: 12,
                    padding: "12px 14px",
                    border: `1px solid ${isUnread ? "#BFDBFE" : "#E2E8F0"}`,
                    boxShadow: isUnread ? "0 2px 6px rgba(37,99,235,0.06)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    position: "relative"
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: n.priority === "critical" ? "#FEF2F2" : "#EFF6FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  >
                    {getNotifIcon(n)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: "#0F172A" }}>
                        {n.title || n.message}
                      </div>
                      {isUnread && (
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", flexShrink: 0 }} />
                      )}
                    </div>
                    {n.title && n.message && (
                      <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2, lineHeight: 1.3 }}>
                        {n.message}
                      </div>
                    )}
                    <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 5 }}>
                      {n.createdAt ? formatTimeAgo(n.createdAt) : "Recently"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Five-Tab Unified Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab="notifications"
        onNavigate={onNavigate}
        unreadCount={unreadCount}
      />
    </div>
  );
}
