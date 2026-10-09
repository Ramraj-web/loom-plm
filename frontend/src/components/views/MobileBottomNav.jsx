import React from "react";
import { Home, Package, CheckSquare, ClipboardCheck, Bell, MoreHorizontal } from "lucide-react";

/**
 * MobileBottomNav
 * 6-tab unified bottom navigation bar for mobile devices (max-width: 768px).
 * Color Palette: Clean white/subtle background, soft medium-light blue (#2563EB / #3B82F6) for active tab.
 */
export function MobileBottomNav({
  activeTab = "home", // "home" | "orders" | "tasks" | "approvals" | "notifications" | "more"
  onNavigate,
  unreadCount = 0,
  pendingApprovalsCount = 0,
  pendingTasksCount = 0
}) {
  const tabs = [
    {
      id: "dashboard",
      key: "home",
      label: "Home",
      icon: Home
    },
    {
      id: "orders",
      key: "orders",
      label: "Orders",
      icon: Package
    },
    {
      id: "tasks",
      key: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : null
    },
    {
      id: "approvals",
      key: "approvals",
      label: "Approvals",
      icon: ClipboardCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null
    },
    {
      id: "notifications",
      key: "notifications",
      label: "Updates",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      id: "more",
      key: "more",
      label: "More",
      icon: MoreHorizontal
    }
  ];

  return (
    <div
      className="mobile-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 62,
        background: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 50,
        padding: "3px 4px env(safe-area-inset-bottom, 3px)",
        boxShadow: "0 -2px 12px rgba(15, 23, 42, 0.05)"
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.key || activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onNavigate && onNavigate(tab.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              cursor: "pointer",
              flex: 1,
              minWidth: 0,
              background: "none",
              border: "none",
              padding: "3px 0",
              color: isActive ? "#2563EB" : "#64748B",
              position: "relative",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <div style={{ position: "relative" }}>
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
              {tab.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -7,
                    minWidth: 14,
                    height: 14,
                    borderRadius: 999,
                    background: tab.key === "approvals" ? "#F59E0B" : "#EF4444",
                    color: "#FFFFFF",
                    fontSize: 9,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    lineHeight: 1
                  }}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: -0.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%"
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                style={{
                  position: "absolute",
                  bottom: 1,
                  width: 14,
                  height: 2.5,
                  borderRadius: 2,
                  background: "#2563EB"
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
