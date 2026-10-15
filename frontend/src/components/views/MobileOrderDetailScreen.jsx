import React, { useState, useMemo } from "react";
import {
  ArrowLeft, Calendar, Package, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, ChevronDown, User, Tag, FileText, Check, Shield, Layers,
  RefreshCw, DollarSign, Bell, AlertCircle
} from "lucide-react";
import { statusPill, riskDot } from "../common/CommonUI.jsx";
import { MobileBottomNav } from "./MobileBottomNav.jsx";

/**
 * MobileOrderDetailScreen
 * Dedicated mobile-friendly Order Details screen.
 * Displays:
 *  - Header: Order ID, Buyer, Style, Delivery/Ship date, Status pill, Risk badge
 *  - Section Tabs: Overview, T&A Stages, Files / Docs, Updates
 *  - Interactive Phone-friendly T&A Stage Tracker (vertical timeline cards, expand/collapse, stage cycle & delay flagging)
 *  - Clean white cards, soft blue primary actions, balanced red/amber/teal/purple accents.
 */
export function MobileOrderDetailScreen({
  order,
  onBack,
  onUpdateStages,
  role,
  certifications = [],
  compliances = [],
  onNavigate
}) {
  const [activeSection, setActiveSection] = useState("overview"); // "overview" | "stages" | "files" | "updates"
  const [expandedStageIdx, setExpandedStageIdx] = useState(null);
  const [flaggingDelayIdx, setFlaggingDelayIdx] = useState(null);
  const [delayReasonText, setDelayReasonText] = useState("");

  if (!order) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#64748B" }}>
        <div>Order not found or has been removed.</div>
        <button
          onClick={onBack}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            background: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const orderStages = useMemo(() => {
    return Array.isArray(order.stages) ? order.stages : [];
  }, [order.stages]);

  const doneCount = orderStages.filter(s => s.status === "done").length;
  const progressPct = orderStages.length > 0 ? Math.round((doneCount / orderStages.length) * 100) : 0;
  const delayedStages = orderStages.filter(s => s.reason || s.status === "Delayed" || s.status === "delayed");

  // Multi-department ownership check for stages
  const userDeptList = useMemo(() => {
    if (Array.isArray(role?.departments) && role.departments.length > 0) {
      return role.departments.map(d => d.toLowerCase());
    }
    return [(role?.dept || "").toLowerCase()];
  }, [role]);

  const canEditStage = (stage) => {
    if (!role) return false;
    if (role.fullAccess || role.dept === "Executive" || role.dept === "Administrators") return true;
    return Boolean(stage?.dept && userDeptList.includes(stage.dept.toLowerCase()));
  };

  const handleCycleStageStatus = (stageIdx) => {
    const stage = orderStages[stageIdx];
    if (!stage || !canEditStage(stage) || !onUpdateStages) return;

    // Cycle: pending -> in_progress -> done -> pending
    let nextStatus = "in_progress";
    let actualDate = stage.actual || null;
    if (stage.status === "pending" || !stage.status) {
      nextStatus = "in_progress";
    } else if (stage.status === "in_progress") {
      nextStatus = "done";
      actualDate = new Date().toISOString().slice(0, 10);
    } else if (stage.status === "done") {
      nextStatus = "pending";
      actualDate = null;
    }

    const updated = orderStages.map((s, idx) => {
      if (idx !== stageIdx) return s;
      return {
        ...s,
        status: nextStatus,
        actual: actualDate,
        completedBy: nextStatus === "done" ? (role?.label || "User").split(" (")[0] : s.completedBy
      };
    });

    onUpdateStages(order.id, updated);
  };

  const handleSaveDelayReason = (stageIdx) => {
    if (!delayReasonText.trim() || !onUpdateStages) return;
    const updated = orderStages.map((s, idx) => {
      if (idx !== stageIdx) return s;
      return {
        ...s,
        reason: delayReasonText.trim()
      };
    });
    onUpdateStages(order.id, updated);
    setFlaggingDelayIdx(null);
    setDelayReasonText("");
  };

  const handleClearDelayReason = (stageIdx) => {
    if (!onUpdateStages) return;
    const updated = orderStages.map((s, idx) => {
      if (idx !== stageIdx) return s;
      const copy = { ...s };
      delete copy.reason;
      return copy;
    });
    onUpdateStages(order.id, updated);
    setFlaggingDelayIdx(null);
    setDelayReasonText("");
  };

  return (
    <div
      className="mobile-order-detail-screen"
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
      {/* Top Mobile Bar with Back Button */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)"
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            padding: "4px 8px 4px 0",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#2563EB",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          <span>Orders</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {statusPill(order.status || "On Track")}
          {order.risk && riskDot(order.risk)}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: "14px 14px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        
        {/* Order Header Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, fontFamily: "monospace", color: "#64748B", fontWeight: 700 }}>
                PO #{order.id}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "2px 0 0", color: "#0F172A", lineHeight: 1.25 }}>
                {order.style || "Garment Style"}
              </h2>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
                background: "#EFF6FF",
                color: "#2563EB",
                border: "1px solid #DBEAFE"
              }}
            >
              {order.buyer || "Direct Buyer"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Order Quantity</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                {(Number(order.qty) || 0).toLocaleString()} <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>pcs</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Delivery / Ship Date</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                {order.ship || "Not set"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Destination Country</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                {order.country || "—"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Season / Window</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                {order.season || "SS26"}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: "#64748B", fontWeight: 600 }}>T&A Execution Progress</span>
              <span style={{ color: "#2563EB", fontWeight: 700 }}>{progressPct}% ({doneCount}/{orderStages.length} stages)</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "#E2E8F0", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  borderRadius: 3,
                  background: progressPct === 100 ? "#10B981" : "#2563EB",
                  transition: "width 0.3s ease"
                }}
              />
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div
          style={{
            display: "flex",
            background: "#FFFFFF",
            borderRadius: 10,
            padding: 3,
            border: "1px solid #E2E8F0",
            gap: 4
          }}
        >
          {[
            { id: "overview", label: "Overview" },
            { id: "stages", label: `T&A Stages (${orderStages.length})` },
            { id: "files", label: "Files & Docs" },
            { id: "updates", label: "Updates" }
          ].map(tab => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                style={{
                  flex: 1,
                  padding: "7px 4px",
                  borderRadius: 7,
                  border: "none",
                  background: isActive ? "#EFF6FF" : "transparent",
                  color: isActive ? "#2563EB" : "#64748B",
                  fontSize: 11.5,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* SECTION 1: OVERVIEW */}
        {activeSection === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Color & Size Breakdown if available */}
            {Array.isArray(order.colorBreakdown) && order.colorBreakdown.length > 0 && (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  padding: "14px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>
                  Color & Size Breakdown
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {order.colorBreakdown.map((cb, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        background: "#F8FAFC",
                        borderRadius: 8,
                        border: "1px solid #EDF2F7",
                        fontSize: 12
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#3B82F6"
                          }}
                        />
                        <span style={{ fontWeight: 600, color: "#1E293B" }}>{cb.color || "Standard"}</span>
                        {cb.size && (
                          <span style={{ color: "#64748B", fontSize: 11 }}>({cb.size})</span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: "#0F172A" }}>
                        {Number(cb.qty || 0).toLocaleString()} pcs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Stage Status Banner */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "14px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
                Next Active Milestone
              </div>
              {orderStages.find(s => s.status !== "done") ? (
                (() => {
                  const s = orderStages.find(st => st.status !== "done");
                  return (
                    <div style={{ padding: "10px 12px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #DBEAFE" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1D4ED8" }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#475569", marginTop: 3 }}>
                        Owner: <b>{s.dept || "General"}</b> {s.planned ? `· Target: ${s.planned}` : ""}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection("stages")}
                        style={{
                          marginTop: 8,
                          padding: "6px 10px",
                          background: "#2563EB",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        View in T&A Timeline →
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div style={{ padding: "10px", background: "#ECFDF5", borderRadius: 8, color: "#065F46", fontSize: 12 }}>
                  🎉 All workflow stages for this garment order are 100% complete!
                </div>
              )}
            </div>

            {/* Costing Summary if present */}
            {order.costingApproval && (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  padding: "14px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Costing Status</div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: order.costingApproval.status === "approved" ? "#ECFDF5" : "#FFFBEB",
                      color: order.costingApproval.status === "approved" ? "#065F46" : "#B45309"
                    }}
                  >
                    {order.costingApproval.status === "approved" ? "Approved" : "Pending Sign-off"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#334155" }}>
                  Grand Total: <b>₹{Number(order.costingApproval.grandTotal || 0).toLocaleString()}</b> / pc
                </div>
                {order.costingApproval.approvedBy && (
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                    Approved by: {order.costingApproval.approvedBy}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: T&A STAGES TIMELINE */}
        {activeSection === "stages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Delay Alert if any */}
            {delayedStages.length > 0 && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "#991B1B",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                <span>
                  <b>{delayedStages.length} stage(s) flagged with delay:</b> Review below to advance or adjust bottlenecks.
                </span>
              </div>
            )}

            <div style={{ fontSize: 12, color: "#64748B", paddingLeft: 2 }}>
              Tap stage circle or card to expand details and update statuses.
            </div>

            {/* Vertical Stage Cards List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {orderStages.map((stage, idx) => {
                const isDone = stage.status === "done";
                const isInProgress = stage.status === "in_progress";
                const isDelayed = Boolean(stage.reason || stage.status === "Delayed");
                const isExpanded = expandedStageIdx === idx;
                const canEdit = canEditStage(stage);

                return (
                  <div
                    key={idx}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 12,
                      border: `1px solid ${isDelayed ? "#FECACA" : isDone ? "#D1FAE5" : isInProgress ? "#BFDBFE" : "#E2E8F0"}`,
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                      overflow: "hidden"
                    }}
                  >
                    {/* Stage Card Header */}
                    <div
                      onClick={() => setExpandedStageIdx(isExpanded ? null : idx)}
                      style={{
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        background: isDone ? "#F0FDF4" : isInProgress ? "#EFF6FF" : "#FFFFFF"
                      }}
                    >
                      {/* Status Circle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCycleStageStatus(idx);
                        }}
                        disabled={!canEdit}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          border: `2px solid ${isDone ? "#10B981" : isInProgress ? "#2563EB" : isDelayed ? "#EF4444" : "#CBD5E1"}`,
                          background: isDone ? "#10B981" : isInProgress ? "#2563EB" : "#FFFFFF",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          cursor: canEdit ? "pointer" : "default"
                        }}
                        title={canEdit ? "Tap to advance stage status" : "Stage locked to department owner"}
                      >
                        {isDone ? (
                          <Check size={16} strokeWidth={3} />
                        ) : isInProgress ? (
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFFFFF" }} />
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>{idx + 1}</span>
                        )}
                      </button>

                      {/* Stage Name & Dept */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: isDone ? "#065F46" : "#0F172A",
                              lineHeight: 1.3
                            }}
                          >
                            {stage.name}
                          </span>
                          {isDelayed && (
                            <span style={{ fontSize: 9.5, fontWeight: 700, background: "#FEE2E2", color: "#DC2626", padding: "1px 5px", borderRadius: 4 }}>
                              Delayed
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                          Dept: <b>{stage.dept || "General"}</b> {stage.planned ? `· ${stage.planned}` : ""}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <ChevronDown
                          size={17}
                          color="#94A3B8"
                          style={{
                            transform: isExpanded ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s ease"
                          }}
                        />
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div style={{ padding: "12px 14px 14px", borderTop: "1px solid #F1F5F9", background: "#FFFFFF" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11.5, marginBottom: 12 }}>
                          <div>
                            <span style={{ color: "#64748B" }}>Planned Target:</span>
                            <div style={{ fontWeight: 600, color: "#1E293B", marginTop: 1 }}>{stage.planned || "—"}</div>
                          </div>
                          <div>
                            <span style={{ color: "#64748B" }}>Actual Completed:</span>
                            <div style={{ fontWeight: 600, color: "#1E293B", marginTop: 1 }}>{stage.actual || "Pending"}</div>
                          </div>
                          <div>
                            <span style={{ color: "#64748B" }}>Department Owner:</span>
                            <div style={{ fontWeight: 600, color: "#1E293B", marginTop: 1 }}>{stage.dept || "General"}</div>
                          </div>
                          <div>
                            <span style={{ color: "#64748B" }}>Status:</span>
                            <div style={{ fontWeight: 600, color: isDone ? "#10B981" : isInProgress ? "#2563EB" : "#64748B", textTransform: "capitalize", marginTop: 1 }}>
                              {stage.status || "Pending"}
                            </div>
                          </div>
                        </div>

                        {/* Existing Delay Note if any */}
                        {stage.reason && (
                          <div style={{ padding: "8px 10px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA", fontSize: 11.5, color: "#991B1B", marginBottom: 10 }}>
                            <b>Delay Note:</b> {stage.reason}
                          </div>
                        )}

                        {/* Flagging Delay Form */}
                        {flaggingDelayIdx === idx ? (
                          <div style={{ background: "#F8FAFC", padding: "10px", borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 10 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
                              Flag Delay Reason:
                            </div>
                            <input
                              type="text"
                              value={delayReasonText}
                              onChange={e => setDelayReasonText(e.target.value)}
                              placeholder="e.g. Yarn shipment delayed by 2 days"
                              style={{
                                width: "100%",
                                padding: "7px 9px",
                                borderRadius: 6,
                                border: "1px solid #CBD5E1",
                                fontSize: 12,
                                marginBottom: 8,
                                boxSizing: "border-box"
                              }}
                            />
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleSaveDelayReason(idx)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  border: "none",
                                  background: "#EF4444",
                                  color: "#FFFFFF",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: "pointer"
                                }}
                              >
                                Save Flag
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFlaggingDelayIdx(null);
                                  setDelayReasonText("");
                                }}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                  border: "1px solid #CBD5E1",
                                  background: "#FFFFFF",
                                  color: "#475569",
                                  fontSize: 11.5,
                                  cursor: "pointer"
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {/* Stage Actions */}
                        {canEdit && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => handleCycleStageStatus(idx)}
                              style={{
                                flex: 1,
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "none",
                                background: isDone ? "#64748B" : "#2563EB",
                                color: "#FFFFFF",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4
                              }}
                            >
                              <CheckCircle2 size={14} />
                              {isDone ? "Reopen Stage" : isInProgress ? "Mark Completed" : "Start Stage"}
                            </button>

                            {stage.reason ? (
                              <button
                                type="button"
                                onClick={() => handleClearDelayReason(idx)}
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  border: "1px solid #CBD5E1",
                                  background: "#FFFFFF",
                                  color: "#475569",
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Clear Delay
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setFlaggingDelayIdx(idx);
                                  setDelayReasonText(stage.reason || "");
                                }}
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  border: "1px solid #FECACA",
                                  background: "#FEF2F2",
                                  color: "#DC2626",
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Flag Delay
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: FILES & DOCUMENTS */}
        {activeSection === "files" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "16px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>
                Pre-Production Documents & Specs
              </div>

              {["Tech Pack", "Size Spec Sheet", "Lab Dip Approval Sheet", "BOM & Trims Card"].map((docName, dIdx) => (
                <div
                  key={dIdx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#F8FAFC",
                    border: "1px solid #EDF2F7",
                    marginBottom: 6
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>{docName}</div>
                      <div style={{ fontSize: 10.5, color: "#64748B" }}>PDF · System Generated</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "#ECFDF5", padding: "2px 7px", borderRadius: 4 }}>
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: UPDATES & ACTIVITY */}
        {activeSection === "updates" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "16px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
                Recent Order Timeline Events
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>
                      Order created and initialized
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Initial PO Release"}
                    </div>
                  </div>
                </div>
                {doneCount > 0 && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>
                        {doneCount} T&A stage milestones successfully completed
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        Real-time tracked via department sign-offs
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Six-Tab Unified Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab="orders"
        onNavigate={onNavigate}
      />
    </div>
  );
}
