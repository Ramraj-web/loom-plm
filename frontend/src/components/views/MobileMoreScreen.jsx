import React, { useState } from "react";
import {
  User, Building2, Users, HelpCircle, Info, LogOut,
  ChevronRight, Shield, Mail, CheckCircle2, Phone, ExternalLink, X, AlertCircle
} from "lucide-react";
import { MobileBottomNav } from "./MobileBottomNav.jsx";

/**
 * MobileMoreScreen
 * Dedicated 6th mobile tab for Profile, Departments, Buyer Details, Help & Support, About Loom PLM, and Logout.
 * Theme: Light, clean background (#F8FAFC) with white cards, subtle borders, soft blue accents.
 */
export function MobileMoreScreen({
  activeUser = {},
  role = {},
  orgStructure = {},
  buyers = [],
  onNavigate,
  onOpenDept,
  onLogout,
  isDarkMode = false
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const fullName = activeUser?.name || role?.label || "Authenticated User";
  const cleanName = String(fullName).split(" (")[0].trim();
  const username = activeUser?.username || "user";
  const email = activeUser?.email || `${username}@loom.local`;
  const departmentName = role?.dept || activeUser?.department || "Operations";
  const employeeId = activeUser?.employeeId || "EMP-001";
  const userInitials = (cleanName || "U")
    .split(" ")
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const totalDepts = Object.keys(orgStructure || {}).length || 18;
  const totalBuyers = Array.isArray(buyers) ? buyers.length : 0;

  const menuSections = [
    {
      group: "Account & Organization",
      items: [
        {
          id: "profile",
          label: "Profile & Account",
          sub: `${cleanName} · ${email}`,
          icon: User,
          iconColor: "#2563EB",
          iconBg: "#EFF6FF",
          badge: role?.label ? "Active" : null,
          badgeColor: "#10B981",
          badgeBg: "#ECFDF5",
          action: () => onNavigate && onNavigate("settings")
        },
        {
          id: "departments",
          label: "Departments",
          sub: `${totalDepts} business units & T&A stage teams`,
          icon: Building2,
          iconColor: "#7C3AED",
          iconBg: "#F5F3FF",
          badge: `${totalDepts} Teams`,
          badgeColor: "#7C3AED",
          badgeBg: "#F5F3FF",
          action: () => onNavigate && onNavigate("departments")
        },
        {
          id: "buyers",
          label: "Buyer Details",
          sub: `${totalBuyers} registered global buyers & brands`,
          icon: Users,
          iconColor: "#0D9488",
          iconBg: "#F0FDFA",
          badge: `${totalBuyers} Buyers`,
          badgeColor: "#0D9488",
          badgeBg: "#F0FDFA",
          action: () => onNavigate && onNavigate("orders")
        }
      ]
    },
    {
      group: "Support & Information",
      items: [
        {
          id: "help",
          label: "Help & Support",
          sub: "Workflow guides, shortcuts & assistance",
          icon: HelpCircle,
          iconColor: "#F59E0B",
          iconBg: "#FFFBEB",
          action: () => setShowHelpModal(true)
        },
        {
          id: "about",
          label: "About Loom PLM",
          sub: "Version 1.0.0 (Enterprise Garment PLM)",
          icon: Info,
          iconColor: "#0284C7",
          iconBg: "#F0F9FF",
          action: () => setShowAboutModal(true)
        }
      ]
    },
    {
      group: "Session",
      items: [
        {
          id: "logout",
          label: "Logout",
          sub: "End current authenticated session safely",
          icon: LogOut,
          iconColor: "#EF4444",
          iconBg: "#FEF2F2",
          isDestructive: true,
          action: () => setShowLogoutConfirm(true)
        }
      ]
    }
  ];

  return (
    <div
      className="mobile-more-screen"
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
      {/* Top Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#FFFFFF",
          color: "#0F172A",
          padding: "14px 16px",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: "#0F172A" }}>
          More
        </div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
            background: "#EFF6FF",
            color: "#2563EB",
            border: "1px solid #DBEAFE"
          }}
        >
          {departmentName}
        </div>
      </div>

      <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16 }}>
        
        {/* User Profile Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: 14
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#EFF6FF",
              color: "#2563EB",
              border: "2px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 18,
              flexShrink: 0
            }}
          >
            {userInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0F172A",
                  letterSpacing: -0.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {cleanName}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "#F1F5F9",
                  color: "#475569"
                }}
              >
                {employeeId}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748B",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {email}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#2563EB",
                  background: "#EFF6FF",
                  padding: "2px 7px",
                  borderRadius: 999,
                  border: "1px solid #DBEAFE"
                }}
              >
                {role?.label || "General Access"}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Groups */}
        {menuSections.map((sec, sIdx) => (
          <div key={sIdx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                paddingLeft: 4
              }}
            >
              {sec.group}
            </div>

            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                overflow: "hidden"
              }}
            >
              {sec.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isLast = iIdx === sec.items.length - 1;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "13px 14px",
                      background: "transparent",
                      border: "none",
                      borderBottom: isLast ? "none" : "1px solid #F1F5F9",
                      cursor: "pointer",
                      textAlign: "left",
                      WebkitTapHighlightColor: "transparent",
                      transition: "background 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: item.iconBg,
                          color: item.iconColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Icon size={18} strokeWidth={2.2} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: item.isDestructive ? "#DC2626" : "#0F172A",
                            lineHeight: 1.3
                          }}
                        >
                          {item.label}
                        </div>
                        {item.sub && (
                          <div
                            style={{
                              fontSize: 11,
                              color: item.isDestructive ? "#EF4444" : "#64748B",
                              marginTop: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            {item.sub}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 6,
                            color: item.badgeColor,
                            background: item.badgeBg
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={17} color={item.isDestructive ? "#FCA5A5" : "#94A3B8"} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer Info */}
        <div
          style={{
            textAlign: "center",
            padding: "8px 0 16px",
            fontSize: 11,
            color: "#94A3B8"
          }}
        >
          Loom PLM Enterprise Platform · v1.0.0
        </div>
      </div>

      {/* Help & Support Sheet Modal */}
      {showHelpModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
          onClick={() => setShowHelpModal(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              width: "100%",
              maxWidth: 480,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "20px 18px 28px",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
              maxHeight: "85vh",
              overflowY: "auto"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#FEF3C7",
                    color: "#D97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <HelpCircle size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                  Help & Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748B"
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 16 }}>
              Need assistance navigating Loom PLM or managing garment order milestones? Here are quick help topics:
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", marginBottom: 4 }}>
                  📦 Managing Orders & Stages
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  Track active POs, view 21 to 40-step T&A pipelines, update color-wise piece quantities, and advance stage statuses in real time.
                </div>
              </div>

              <div style={{ padding: "12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", marginBottom: 4 }}>
                  ✅ Updating Assigned Tasks
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  Filter by status, search by keyword, view critical due dates, and update task progress directly from the Tasks tab.
                </div>
              </div>

              <div style={{ padding: "12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", marginBottom: 4 }}>
                  💬 AI Assistant Support
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  Use the green AI chatbot button on the lower right to ask questions about delayed orders, specific styles, or department bottlenecks.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              style={{
                marginTop: 18,
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* About Loom PLM Modal */}
      {showAboutModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
          onClick={() => setShowAboutModal(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              width: "100%",
              maxWidth: 480,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "20px 18px 28px",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.15)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#EFF6FF",
                    color: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Info size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                  About Loom PLM
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748B"
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#475569" }}>
              <div style={{ padding: "12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0F172A", marginBottom: 2 }}>
                  Loom PLM Enterprise
                </div>
                <div style={{ fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                  Apparel & Garment Manufacturing Lifecycle Platform
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ color: "#64748B" }}>Version</span>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>1.0.0</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ color: "#64748B" }}>Environment</span>
                <span style={{ fontWeight: 700, color: "#10B981" }}>Enterprise Production</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ color: "#64748B" }}>Workflow Modules</span>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>T&A Tracker · Costing · CAPA · IoT</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ color: "#64748B" }}>Active User</span>
                <span style={{ fontWeight: 700, color: "#2563EB" }}>{cleanName}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAboutModal(false)}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: "20px",
              width: "100%",
              maxWidth: 340,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              textAlign: "center"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#FEF2F2",
                color: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px"
              }}
            >
              <LogOut size={24} />
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
              Sign out of Loom PLM?
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748B", lineHeight: 1.4 }}>
              Are you sure you want to log out, <strong>{cleanName}</strong>? You will need to sign back in with your credentials.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  border: "none",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer"
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Six-Tab Unified Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab="more"
        onNavigate={onNavigate}
      />
    </div>
  );
}
