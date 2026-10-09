import React, { useMemo, useState } from "react";
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Package, Clock, FileText, DollarSign, Calendar, X
} from "lucide-react";
import { collectTasks, statusPill } from "../common/CommonUI.jsx";
import { MobileBottomNav } from "./MobileBottomNav.jsx";

/**
 * MobileApprovalsScreen
 * Dedicated mobile Approvals screen for costing sign-offs and workflow checkpoints.
 * Supports viewing approval details, approving/rejecting costing, and jumping to order details.
 */
export function MobileApprovalsScreen({
  orders = [],
  role = {},
  onOpenOrder,
  onApproveCosting,
  onRejectCosting,
  onNavigate
}) {
  const [selectedApproval, setSelectedApproval] = useState(null);

  const safeOrders = useMemo(() => {
    return (Array.isArray(orders) ? orders : []).filter(o => o && !o.isDeleted);
  }, [orders]);

  // Costing approvals pending
  const costingPendingOrders = useMemo(() => {
    return safeOrders.filter(o => o.costingApproval && o.costingApproval.status === "submitted");
  }, [safeOrders]);

  // Stage checkpoints needing approvals (Fit, PP, Lab Dip, etc.)
  const approvalStages = useMemo(() => {
    return collectTasks(safeOrders, null).filter(r =>
      r.stage.status !== "done" &&
      (r.stage.name.toLowerCase().includes("approval") || r.stage.name === "Tech Pack Received")
    );
  }, [safeOrders]);

  const canApprove = Boolean(
    role?.fullAccess ||
    role?.dept === "Executive" ||
    role?.dept === "Executive (MD)" ||
    role?.label?.toLowerCase().includes("md") ||
    role?.label?.toLowerCase().includes("managing director")
  );

  return (
    <div
      className="mobile-approvals-screen"
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#FFFBEB",
              color: "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <ClipboardCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: "#0F172A" }}>
              Approvals
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
              <span style={{ color: "#D97706", fontWeight: 700 }}>{costingPendingOrders.length + approvalStages.length}</span> pending actions
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Section 1: Costing Sign-offs */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: 0.3 }}>
              Costing Sign-offs ({costingPendingOrders.length})
            </span>
          </div>

          {costingPendingOrders.length === 0 ? (
            <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center", color: "#64748B", fontSize: 12.5 }}>
              ✨ No costing sheets awaiting sign-off right now.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {costingPendingOrders.map(o => (
                <div
                  key={o.id}
                  onClick={() => setSelectedApproval({
                    type: "costing",
                    id: o.id,
                    orderId: o.id,
                    primaryId: o.primaryId || o.id,
                    title: `Costing Sign-off: PO #${o.id}`,
                    style: o.style,
                    buyer: o.buyer,
                    qty: o.qty,
                    requestedBy: o.costingApproval?.submittedBy || "Costing Dept",
                    submittedAt: o.costingApproval?.submittedAt || o.orderDate || "Recently",
                    status: o.costingApproval?.status || "submitted",
                    grandTotal: o.costingApproval?.grandTotal || 0,
                    orderObj: o
                  })}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    padding: "14px",
                    border: "1px solid #E2E8F0",
                    borderLeft: "4px solid #F59E0B",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div
                        style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}
                      >
                        PO #{o.id} — {o.style}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                        Buyer: {o.buyer || "Direct"} · Qty: {Number(o.qty || 0).toLocaleString()} pcs
                      </div>
                    </div>
                    <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>
                      Submitted
                    </span>
                  </div>

                  <div style={{ background: "#FFFBEB", borderRadius: 8, padding: "8px 10px", border: "1px solid #FDE68A", fontSize: 12, color: "#78350F" }}>
                    Grand Total: <b>₹{Number(o.costingApproval?.grandTotal || 0).toLocaleString()}</b> per pc
                    {o.costingApproval?.submittedBy && ` · By ${o.costingApproval.submittedBy}`}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#64748B" }}>
                    <span>Tap for full details & sign-off</span>
                    <ChevronRight size={16} color="#94A3B8" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Stage Checkpoints & Buyer Approvals */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, marginTop: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: 0.3 }}>
              Workflow & Stage Approvals ({approvalStages.length})
            </span>
          </div>

          {approvalStages.length === 0 ? (
            <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center", color: "#64748B", fontSize: 12.5 }}>
              All stage checkpoints (Fit, Lab Dip, PP) are approved.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {approvalStages.map((r, i) => (
                <div
                  key={`${r.order.id}-${r.stage.name}-${i}`}
                  onClick={() => setSelectedApproval({
                    type: "stage",
                    id: `${r.order.id}-${r.stage.name}`,
                    orderId: r.order.id,
                    primaryId: r.order.primaryId || r.order.id,
                    title: `${r.stage.name} Checkpoint`,
                    stageName: r.stage.name,
                    style: r.order.style,
                    buyer: r.order.buyer,
                    dept: r.dept,
                    requestedBy: r.dept || "Merchandising",
                    dueDate: r.stage.planned || "Not set",
                    status: r.stage.status || "pending",
                    orderObj: r.order
                  })}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    padding: "12px 14px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                      #{r.order.id} · {r.stage.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                      {r.order.style} · Dept: {r.dept}
                    </div>
                    {r.stage.planned && (
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                        Target: <b>{r.stage.planned}</b>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Mobile Approval Details Bottom Sheet */}
      {selectedApproval && (
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
          onClick={() => setSelectedApproval(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              width: "100%",
              maxWidth: 480,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "20px 18px 24px",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
              maxHeight: "85vh",
              overflowY: "auto"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: selectedApproval.type === "costing" ? "#D97706" : "#2563EB"
                  }}
                >
                  {selectedApproval.type === "costing" ? "Costing Sign-off Request" : "Workflow Stage Checkpoint"}
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: "3px 0 0", color: "#0F172A" }}>
                  {selectedApproval.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApproval(null)}
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

            {/* Approval Info Grid */}
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                padding: "14px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Related Order</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                  #{selectedApproval.orderId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Garment Style</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                  {selectedApproval.style || "Standard"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Buyer</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                  {selectedApproval.buyer || "Direct"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Requested By</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                  {selectedApproval.requestedBy || "Department"}
                </div>
              </div>

              {selectedApproval.grandTotal > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>Grand Total (INR)</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#B45309", marginTop: 2 }}>
                    ₹{Number(selectedApproval.grandTotal).toLocaleString()} / pc
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Status</div>
                <div style={{ marginTop: 2 }}>
                  {statusPill(selectedApproval.status)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedApproval.type === "costing" && canApprove && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onApproveCosting) onApproveCosting(selectedApproval.orderId, role?.label || "Managing Director");
                      setSelectedApproval(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 10,
                      border: "none",
                      background: "#16A34A",
                      color: "#FFFFFF",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Approve Costing
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt("Reason for rejecting costing?", "Revisions required");
                      if (reason !== null && onRejectCosting) {
                        onRejectCosting(selectedApproval.orderId, reason);
                        setSelectedApproval(null);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 10,
                      border: "1px solid #FECACA",
                      background: "#FEF2F2",
                      color: "#DC2626",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}

              {/* Open Order Detail */}
              <button
                type="button"
                onClick={() => {
                  const targetId = selectedApproval.primaryId || selectedApproval.orderId;
                  setSelectedApproval(null);
                  if (onOpenOrder) onOpenOrder(targetId);
                }}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#0F172A",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer"
                }}
              >
                <Package size={15} />
                View Full Order #{selectedApproval.orderId}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Six-Tab Unified Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab="approvals"
        onNavigate={onNavigate}
        pendingApprovalsCount={costingPendingOrders.length + approvalStages.length}
      />
    </div>
  );
}
