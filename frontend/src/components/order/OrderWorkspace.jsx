import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar, CheckCircle2, Clock, Circle, Lock, ChevronDown, Upload, Send, Zap,
  AlertTriangle, FileText, ClipboardList, Package, Layers, ShieldCheck, Factory, Truck, TrendingUp,
  Eye, Trash2, X, Download, Check
} from "lucide-react";
import {
  REASONS, VAP_SUPPLIERS, DOC_TABS_CONFIG, DOC_TAB_NAMES, DOC_TAB_ICONS, CUSTOMIZABLE_TABS,
  STAGE_CHAT_TABS, TAB_ALLOWED_DEPTS, DOC_ITEM_METADATA, PRE_PROD_DOC_TYPES, allPreProdApproved,
  HIGHLIGHT_DEPT_OPTIONS, ALL_PEOPLE, COSTING_TEMPLATES, firstNamedAssignee
} from "../../constants/loomData.js";
import {
  Card, CardHeader, BackLink, statusPill, riskDot, gatingApproval, renderWithMentions
} from "../common/CommonUI.jsx";
import { AssignWorkModal } from "../views/InsightsViews.jsx";
import { OrderStageAlignmentModal } from "../views/OperationsViews.jsx";
import { OutsourcingQuotationPanel } from "./OutsourcingQuotationPanel.jsx";
import { ProductionTab } from "./ProductionTab.jsx";
import { InspectionTab } from "./InspectionTab.jsx";
import { CertificatesTab } from "./CertificatesTab.jsx";
import { scanPOSheetFile } from "../../utils/poDocumentScanner.js";

export function DisputeStageModal({
  isOpen,
  onClose,
  stage,
  stageIdx,
  order,
  people = [],
  onSubmitDispute,
  currentUserName = "User"
}) {
  if (!isOpen || !stage) return null;
  const initialTagged = stage.completedBy && stage.completedBy !== "Unassigned" ? stage.completedBy : "";
  const [taggedUser, setTaggedUser] = useState(initialTagged);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const allUsersList = useMemo(() => {
    const list = [];
    const seen = new Set();
    (people || []).forEach(p => {
      const uName = p.username || p.name;
      if (uName && !seen.has(uName.toLowerCase())) {
        seen.add(uName.toLowerCase());
        list.push({
          id: p.id || uName,
          name: p.name || p.username,
          username: p.username || p.name,
          dept: p.dept || p.teamName || "Team"
        });
      }
    });
    (ALL_PEOPLE || []).forEach(n => {
      if (n && n !== "—" && !seen.has(n.toLowerCase())) {
        seen.add(n.toLowerCase());
        list.push({ id: n, name: n, username: n.toLowerCase().replace(/\s+/g, ""), dept: "Staff" });
      }
    });
    return list;
  }, [people]);

  const query = taggedUser.startsWith("@") ? taggedUser.slice(1).toLowerCase().trim() : taggedUser.toLowerCase().trim();
  const suggestions = allUsersList.filter(u => {
    if (!query) return true;
    return u.username.toLowerCase().includes(query) ||
           u.name.toLowerCase().includes(query) ||
           (u.dept && u.dept.toLowerCase().includes(query));
  }).slice(0, 8);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please specify the reason why this stage was falsely completed.");
      return;
    }
    const cleanTagged = taggedUser.trim().replace(/^@/, "");
    if (!cleanTagged) {
      setError("Please mention or tag the responsible user.");
      return;
    }
    onSubmitDispute({
      orderId: order.id,
      orderStyle: order.style,
      stageIdx,
      stageName: stage.name,
      stageDept: stage.dept,
      completedBy: stage.completedBy || "Unassigned",
      taggedUser: cleanTagged,
      reason: reason.trim(),
      reportedBy: currentUserName,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, maxWidth: 520, width: "100%", padding: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}>
              <AlertTriangle size={19} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Report False Stage Completion</h3>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                Order #{order.id} ({order.style}) · Stage: {stage.name}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12 }}>
            <div style={{ color: "#64748B" }}>Owning Department: <b style={{ color: "#1E293B" }}>{stage.dept}</b></div>
            <div style={{ color: "#64748B", marginTop: 4 }}>
              Completed By: <b style={{ color: "#1E293B" }}>{stage.completedBy || "Unassigned"}</b> {stage.completedAt && `on ${formatStageDoneDate(stage.completedAt)}`}
            </div>
          </div>

          <div style={{ marginBottom: 14, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                Mention / Tag Responsible False User (@) *
              </label>
              <button
                type="button"
                onClick={() => {
                  setTaggedUser("@");
                  setShowSuggestions(true);
                }}
                style={{
                  background: "#EDE9FE",
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#534AB7",
                  cursor: "pointer"
                }}
              >
                + Browse Users (@)
              </button>
            </div>
            <input
              type="text"
              required
              value={taggedUser}
              onFocus={() => setShowSuggestions(true)}
              onChange={e => {
                setTaggedUser(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Type @ to search users or select from list"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box" }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 30,
                  background: "#FFFFFF",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.18)",
                  marginTop: 4,
                  maxHeight: 180,
                  overflowY: "auto"
                }}
              >
                <div style={{ padding: "6px 10px", fontSize: 10.5, fontWeight: 700, color: "#64748B", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                  SELECT USER TO TAG:
                </div>
                {suggestions.map(u => (
                  <div
                    key={u.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setTaggedUser(`@${u.username || u.name}`);
                      setShowSuggestions(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #F8FAFC",
                      fontSize: 12
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: "#1E293B" }}>@{u.username || u.name}</span>
                      {u.name && u.name !== u.username && (
                        <span style={{ color: "#64748B", marginLeft: 6 }}>({u.name})</span>
                      )}
                    </div>
                    <span style={{ fontSize: 10.5, color: "#4F46E5", background: "#EEF2FF", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                      {u.dept}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
              This user will be logged in the dispute registry, notified directly, and penalized -10 pts in the MD Dashboard.
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Reason for Complaint / False Completion Details *
            </label>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={e => { setReason(e.target.value); setError(""); }}
              placeholder="Describe why this stage was falsely committed (e.g. Trims Plan marked complete without BOM verification, lab dip samples not actually approved, etc.)"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
            />
            {error && <div style={{ color: "#DC2626", fontSize: 11.5, marginTop: 4 }}>{error}</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#fff", fontSize: 12.5, fontWeight: 600, color: "#64748B", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#DC2626", fontSize: 12.5, fontWeight: 600, color: "#fff", cursor: "pointer" }}
            >
              Submit Complaint to MD & Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



// 1. Stages that require colours pop up (Exact 16 stages requested by user)
export const COLOURWAY_REQUIRED_STAGES = [
  "lab dip approval",
  "artwork approval",
  "dyeing",
  "fabric ih",
  "lot card approval",
  "shrinkage closure",
  "cutting",
  "vap send",
  "testing",
  "print / emb / hotfix complete",
  "print/emb/ hotfix complete",
  "print / emb complete",
  "print/emb complete",
  "vap complete",
  "reshape & feeding",
  "reshape and feeding",
  "production",
  "cip start",
  "fi",
  "final inspection",
  "garment ocr",
  "ex-fty",
  "ex - fty",
  "ex fty"
];

export function isColourwayStage(stageName) {
  if (!stageName) return false;
  const norm = stageName.trim().toLowerCase().replace(/\s+/g, " ");
  return COLOURWAY_REQUIRED_STAGES.some(s => {
    if (norm === s) return true;
    if (norm.replace(/[^a-z0-9]/g, "") === s.replace(/[^a-z0-9]/g, "")) return true;
    return false;
  });
}

// 2. Bind actual calendar dates instead of Day 1, Day 2
export function formatStagePlannedDate(planned, orderStartDate) {
  if (!planned || typeof planned !== "string") return planned || "";
  const trimmed = planned.trim();
  if (!trimmed.toLowerCase().startsWith("day")) {
    return trimmed; // Already a real calendar date (e.g. "23 Apr")
  }

  const match = trimmed.match(/day\s*(\d+)(?:\s*-\s*(\d+))?/i);
  if (!match) return trimmed;

  const startDayOffset = Math.max(0, parseInt(match[1], 10) - 1);
  const endDayOffset = match[2] ? Math.max(0, parseInt(match[2], 10) - 1) : null;

  let baseDate = new Date();
  if (orderStartDate) {
    const parsed = new Date(orderStartDate);
    if (!isNaN(parsed.getTime())) baseDate = parsed;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d1 = new Date(baseDate.getTime() + startDayOffset * 24 * 60 * 60 * 1000);
  const d1Str = `${d1.getDate()} ${monthNames[d1.getMonth()]}`;

  if (endDayOffset !== null) {
    const d2 = new Date(baseDate.getTime() + endDayOffset * 24 * 60 * 60 * 1000);
    if (d1.getMonth() === d2.getMonth()) {
      return `${d1.getDate()}-${d2.getDate()} ${monthNames[d1.getMonth()]}`;
    }
    return `${d1Str} - ${d2.getDate()} ${monthNames[d2.getMonth()]}`;
  }

  return d1Str;
}

export function formatStageDoneDate(completedAt) {
  if (!completedAt) return "";
  try {
    const d = new Date(completedAt);
    if (isNaN(d.getTime())) return String(completedAt);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const isSameYear = d.getFullYear() === now.getFullYear();
    return isSameYear
      ? `${d.getDate()} ${monthNames[d.getMonth()]}`
      : `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return "";
  }
}

export function StageColourwayModal({
  isOpen,
  onClose,
  stage,
  stageIdx,
  order,
  orderColourways = [],
  onUpdateStageColourways,
  canEdit = true,
  onOpenDispute
}) {
  if (!isOpen || !stage) return null;

  // Initialize local colourways state from stage.colourways or orderColourways
  const initialColourways = useMemo(() => {
    if (Array.isArray(stage.colourways) && stage.colourways.length > 0) {
      return stage.colourways.map(c => {
        const qty = Number(c.qty) || 0;
        const status = c.status || (stage.status === "done" ? "done" : stage.status === "in_progress" ? "in_progress" : "pending");
        const completedQty = c.completedQty != null ? Number(c.completedQty) : (status === "done" ? qty : 0);
        return {
          color: c.color,
          qty,
          status,
          completedQty,
          reason: c.reason || "",
          customReason: c.customReason || ""
        };
      });
    }
    const baseList = orderColourways.length > 0 ? orderColourways : [{ color: order.color || "Standard", qty: Number(order.qty) || 0 }];
    return baseList.map(c => {
      const qty = Number(c.qty) || 0;
      const status = stage.status === "done" ? "done" : stage.status === "in_progress" ? "in_progress" : "pending";
      return {
        color: c.color,
        qty,
        status,
        completedQty: status === "done" ? qty : 0,
        reason: stage.reason || "",
        customReason: ""
      };
    });
  }, [stage, orderColourways, order]);

  const [colourways, setColourways] = useState(initialColourways);

  useEffect(() => {
    setColourways(initialColourways);
  }, [initialColourways]);

  const totalPieces = colourways.reduce((sum, c) => sum + (Number(c.qty) || 0), 0);
  const completedPieces = colourways.reduce((sum, c) => sum + (Number(c.completedQty) || 0), 0);
  const pendingPieces = Math.max(0, totalPieces - completedPieces);
  const doneCount = colourways.filter(c => c.status === "done").length;

  const commitUpdates = (nextList) => {
    setColourways(nextList);
    if (onUpdateStageColourways) {
      onUpdateStageColourways(stageIdx, nextList);
    }
  };

  const handleStatusToggle = (index) => {
    if (!canEdit) return;
    const nextList = colourways.map((c, i) => {
      if (i !== index) return c;
      const nextStatus = c.status === "pending" ? "in_progress" : c.status === "in_progress" ? "done" : "pending";
      const nextCompleted = nextStatus === "done" ? c.qty : nextStatus === "pending" ? 0 : (c.completedQty || 0);
      return {
        ...c,
        status: nextStatus,
        completedQty: nextCompleted,
        reason: nextStatus === "done" ? "" : c.reason
      };
    });
    commitUpdates(nextList);
  };

  const handleQtyChange = (index, val) => {
    if (!canEdit) return;
    const num = Math.max(0, Math.min(Number(val) || 0, colourways[index].qty));
    const nextList = colourways.map((c, i) => {
      if (i !== index) return c;
      let nextStatus = c.status;
      if (num >= c.qty) nextStatus = "done";
      else if (num > 0) nextStatus = "in_progress";
      return {
        ...c,
        completedQty: num,
        status: nextStatus
      };
    });
    commitUpdates(nextList);
  };

  const handleReasonChange = (index, val) => {
    if (!canEdit) return;
    const nextList = colourways.map((c, i) => {
      if (i !== index) return c;
      return {
        ...c,
        reason: val,
        customReason: val === "Others" ? c.customReason : ""
      };
    });
    commitUpdates(nextList);
  };

  const handleCustomReasonChange = (index, val) => {
    if (!canEdit) return;
    const nextList = colourways.map((c, i) => {
      if (i !== index) return c;
      return {
        ...c,
        customReason: val
      };
    });
    commitUpdates(nextList);
  };

  const handleMarkAllDone = () => {
    if (!canEdit) return;
    const nextList = colourways.map(c => ({
      ...c,
      status: "done",
      completedQty: c.qty,
      reason: ""
    }));
    commitUpdates(nextList);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(2px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh"
        }}
      >
        {/* Header matching user reference image */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #F3F4F6", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                {stage.name}
              </div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4, fontWeight: 500 }}>
                {doneCount}/{colourways.length} colourways done
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                padding: 6,
                borderRadius: 8,
                cursor: "pointer",
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#111827"}
              onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6, lineHeight: 1.4 }}>
            This stage completes automatically once every colourway below is marked Done.
          </div>
        </div>

        {/* Quantity Summary: Completed vs Pending Pieces */}
        <div style={{ padding: "10px 24px", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
          <div style={{ display: "flex", gap: 14 }}>
            <span>Total: <strong style={{ color: "#111827" }}>{(Number(totalPieces) || 0).toLocaleString()} pcs</strong></span>
            <span style={{ color: "#16A34A" }}>Completed: <strong>{(Number(completedPieces) || 0).toLocaleString()} pcs</strong></span>
            <span style={{ color: "#DC2626" }}>Pending: <strong>{(Number(pendingPieces) || 0).toLocaleString()} pcs</strong></span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: doneCount === colourways.length ? "#16A34A" : "#6366F1" }}>
            {totalPieces > 0 ? Math.round((completedPieces / totalPieces) * 100) : 0}% Done
          </div>
        </div>

        {/* Colourways List */}
        <div style={{ padding: "16px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {colourways.map((c, i) => {
            const isDone = c.status === "done";
            const isInProgress = c.status === "in_progress";
            const isPending = !isDone && !isInProgress;
            const cCompleted = c.completedQty != null ? Number(c.completedQty) : (isDone ? (Number(c.qty) || 0) : 0);
            const cPending = Math.max(0, (Number(c.qty) || 0) - cCompleted);
            const hasDelay = Boolean(c.reason && c.reason !== "No delay flagged");

            return (
              <div
                key={i}
                style={{
                  border: `1px solid ${hasDelay ? "#FED7AA" : isDone ? "#BBF7D0" : "#E5E7EB"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: hasDelay ? "#FFFDF9" : isDone ? "#F0FDF4" : "#FFFFFF",
                  transition: "all 0.15s ease"
                }}
              >
                {/* Top Row: Color name & qty on left, status pill on right */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", letterSpacing: "0.02em" }}>
                      {c.color}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                      {(Number(c.qty) || 0).toLocaleString()} pcs
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => handleStatusToggle(i)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 999,
                      padding: "4px 14px",
                      border: `1px solid ${isDone ? "#86EFAC" : isInProgress ? "#FDE68A" : "#E5E7EB"}`,
                      background: isDone ? "#DCFCE7" : isInProgress ? "#FEF3C7" : "#F3F4F6",
                      color: isDone ? "#15803D" : isInProgress ? "#B45309" : "#4B5563",
                      cursor: canEdit ? "pointer" : "default",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}
                    title={canEdit ? "Click to toggle status: Pending → In progress → Done" : "Read-only"}
                  >
                    {isDone && <Check size={12} />}
                    {isDone ? "Done" : isInProgress ? "In progress" : "Pending"}
                  </button>
                </div>

                {/* Pieces breakdown: Completed vs Pending */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F9FAFB", padding: "6px 10px", borderRadius: 8, fontSize: 11.5, marginBottom: 10 }}>
                  <div style={{ color: "#4B5563" }}>
                    Completed: <strong style={{ color: "#16A34A" }}>{(Number(cCompleted) || 0).toLocaleString()}</strong> pcs
                  </div>
                  <div style={{ color: "#4B5563" }}>
                    Pending: <strong style={{ color: "#DC2626" }}>{(Number(cPending) || 0).toLocaleString()}</strong> pcs
                  </div>
                  {canEdit && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10.5, color: "#9CA3AF" }}>Set done:</span>
                      <input
                        type="number"
                        min="0"
                        max={c.qty}
                        value={cCompleted}
                        onChange={(e) => handleQtyChange(i, e.target.value)}
                        style={{
                          width: 60,
                          padding: "2px 4px",
                          fontSize: 11,
                          border: "1px solid #D1D5DB",
                          borderRadius: 4,
                          textAlign: "right"
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Delay Selector (Why delayed) */}
                <div>
                  <select
                    value={c.reason || ""}
                    disabled={!canEdit}
                    onChange={(e) => handleReasonChange(i, e.target.value)}
                    style={{
                      width: "100%",
                      fontSize: 12.5,
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: `1px solid ${hasDelay ? "#FDBA74" : "#E5E7EB"}`,
                      background: hasDelay ? "#FFF7ED" : "#FFFFFF",
                      color: hasDelay ? "#9A3412" : "#374151",
                      cursor: canEdit ? "pointer" : "default"
                    }}
                  >
                    <option value="">No delay flagged</option>
                    <option value="Buyer approval delay">Buyer approval delay</option>
                    <option value="Fabric delay">Fabric delay / IH pending</option>
                    <option value="Yarn shortage">Yarn shortage</option>
                    <option value="Dyeing defect">Dyeing defect / Shade mismatch</option>
                    <option value="Lab dip pending">Lab dip approval pending</option>
                    <option value="Printing / Embroidery delay">Printing / Embroidery delay</option>
                    <option value="Trims shortage">Trims shortage</option>
                    <option value="Quality rework">Quality rework / Inspection failure</option>
                    <option value="Capacity shortage">Capacity shortage</option>
                    <option value="Supplier delay">Supplier / Vendor delay</option>
                    <option value="Logistics">Logistics / Freight delay</option>
                    <option value="Others">Others (Custom reason...)</option>
                  </select>
                  {c.reason === "Others" && (
                    <input
                      type="text"
                      placeholder="Specify custom delay reason..."
                      value={c.customReason || ""}
                      disabled={!canEdit}
                      onChange={(e) => handleCustomReasonChange(i, e.target.value)}
                      style={{
                        width: "100%",
                        marginTop: 6,
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #FDBA74",
                        background: "#FFFBEB"
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {canEdit && doneCount < colourways.length && (
              <button
                type="button"
                onClick={handleMarkAllDone}
                style={{
                  fontSize: 12,
                  color: "#059669",
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Mark All Done
              </button>
            )}
            {/* Report False / Dispute button inside modal for completed stages */}
            {stage.status === "done" && onOpenDispute && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDispute(stage, stageIdx);
                }}
                style={{
                  fontSize: 11.5,
                  color: stage.disputed ? "#DC2626" : "#C2410C",
                  background: stage.disputed ? "#FEF2F2" : "#FFF7ED",
                  border: `1px solid ${stage.disputed ? "#FCA5A5" : "#FDBA74"}`,
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
                title="Report false stage completion to MD & Admin"
              >
                <AlertTriangle size={12} />
                {stage.disputed ? "Disputed" : "Report False"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "#fff",
              background: "#534AB7",
              border: "none",
              padding: "7px 18px",
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function StageNode({ stage, idx, onCycle, onReason, onSupplierChange, onOpenDispute, lockedBy, suppliers = [], canEdit = true, roleDept = "", orderColourways = [], onOpenColourways, orderStartDate }) {
  const [open, setOpen] = useState(false);
  const locked = !!lockedBy;
  const isAllowedToEdit = !locked && canEdit;
  const supplierOptions = suppliers.length > 0
    ? suppliers.filter(s => !s.isDeleted).map(s => s.name || s)
    : VAP_SUPPLIERS;

  // Colourways breakdown: ONLY for the 16 stages specified!
  const hasColourways = Array.isArray(orderColourways) && orderColourways.length > 0 && isColourwayStage(stage.name);
  const displayPlannedDate = formatStagePlannedDate(stage.planned, orderStartDate);
  const rawDoneDate = stage.completedAt || stage.completedOn || stage.doneDate || stage.updatedAt || (Array.isArray(stage.colourways) ? stage.colourways.find(c => c.completedAt)?.completedAt : null);
  const displayDoneDate = formatStageDoneDate(rawDoneDate);
  const currentColourways = (Array.isArray(stage.colourways) && stage.colourways.length > 0)
    ? stage.colourways
    : (orderColourways.length > 0 ? orderColourways.map(c => ({
        color: c.color,
        qty: c.qty,
        status: stage.status === "done" ? "done" : stage.status === "in_progress" ? "in_progress" : "pending",
        reason: stage.reason || "",
        completedQty: stage.status === "done" ? c.qty : 0
      })) : []);
  const doneColourwaysCount = currentColourways.filter(c => c.status === "done").length;
  const totalColourwaysCount = currentColourways.length;

  const icon =
    stage.status === "done" ? <CheckCircle2 size={17} color="#1F9E8D" /> :
    locked ? <Lock size={14} color="#B0B2BA" /> :
    stage.status === "in_progress" ? <Clock size={17} color="#E2A83B" /> :
    <Circle size={17} color="#C7CAD1" />;

  const tooltipTitle = locked
    ? `Locked until ${lockedBy} is approved`
    : !canEdit
    ? `Only ${stage.dept} department can complete this stage (You are in: ${roleDept})`
    : hasColourways
    ? "Click to open colorway breakdown & delay tracking"
    : stage.status === "done"
    ? "Stage completed (Stays completed; use 'Report False' to dispute)"
    : stage.status === "in_progress"
    ? "Click to mark as Done"
    : "Click to start (Pending → In Progress)";

  const handleStageClick = () => {
    if (!isAllowedToEdit) return;
    if (hasColourways && onOpenColourways) {
      onOpenColourways(idx);
    } else {
      onCycle(idx);
    }
  };

  return (
    <div style={{ flex: "0 0 134px", minWidth: 134, position: "relative", opacity: locked ? 0.6 : !canEdit ? 0.75 : 1 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          onClick={handleStageClick}
          title={tooltipTitle}
          style={{
            width: 30, height: 30, borderRadius: 999, background: "#fff",
            border: `2px solid ${stage.status === "done" ? "#1F9E8D" : locked ? "#D9DBE1" : stage.status === "in_progress" ? "#E2A83B" : "#D9DBE1"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: isAllowedToEdit ? "pointer" : "not-allowed", flexShrink: 0
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, height: 2, background: stage.status === "done" ? "#1F9E8D" : "#E7E8ED" }} />
      </div>

      {/* Stage Name - Clickable when colourways are present */}
      <div
        onClick={handleStageClick}
        style={{
          marginTop: 8,
          fontSize: 11.5,
          fontWeight: 600,
          color: locked ? "#B0B2BA" : "#1B2130",
          lineHeight: 1.3,
          cursor: isAllowedToEdit ? "pointer" : "default"
        }}
        title={hasColourways ? "Click to open colorway tracking popup" : ""}
      >
        {stage.name}
      </div>

      <div style={{ fontSize: 10.5, color: "#8A8D98", marginTop: 2, fontWeight: 500 }} title={`Planned date: ${displayPlannedDate}`}>{displayPlannedDate}</div>
      <div style={{ fontSize: 10, color: canEdit ? "#1F9E8D" : "#B0B2BA", marginTop: 2, fontWeight: canEdit ? 600 : 400 }}>
        {stage.dept} {!canEdit && "(Read-only)"}
      </div>

      {/* Prominent Colorway Badge button */}
      {hasColourways && (
        <div style={{ marginTop: 5 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenColourways && onOpenColourways(idx);
            }}
            style={{
              background: doneColourwaysCount === totalColourwaysCount && totalColourwaysCount > 0 ? "#ECFDF5" : doneColourwaysCount > 0 ? "#FEF3C7" : "#EEF2FF",
              color: doneColourwaysCount === totalColourwaysCount && totalColourwaysCount > 0 ? "#047857" : doneColourwaysCount > 0 ? "#B45309" : "#4338CA",
              border: `1px solid ${doneColourwaysCount === totalColourwaysCount && totalColourwaysCount > 0 ? "#A7F3D0" : doneColourwaysCount > 0 ? "#FDE68A" : "#C7D2FE"}`,
              borderRadius: 999,
              padding: "2.5px 8px",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              whiteSpace: "nowrap",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
            }}
            title="Click to view & update colorway pieces, status, and delay reasons"
          >
            {doneColourwaysCount === totalColourwaysCount && totalColourwaysCount > 0 ? (
              <CheckCircle2 size={10} color="#047857" />
            ) : (
              <Layers size={10} />
            )}
            <span>{doneColourwaysCount}/{totalColourwaysCount} colours</span>
          </button>
        </div>
      )}

      {stage.dept === "VAP" && (
        <select
          value={stage.supplier || ""}
          onChange={e => onSupplierChange(idx, e.target.value)}
          style={{ marginTop: 4, width: "100%", fontSize: 9.5, padding: "2px 4px", borderRadius: 5, border: "1px solid #E0DBF5", color: "#534AB7", background: "#F8F7FD" }}
        >
          <option value="">No supplier set</option>
          {supplierOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {locked && (
        <div style={{ fontSize: 10, color: "#B0812E", marginTop: 4, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
          <Lock size={9} /> Needs {lockedBy}
        </div>
      )}
      {!locked && stage.status === "done" && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 10, color: "#1F9E8D", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <CheckCircle2 size={10} color="#1F9E8D" /> Done
            </span>
            {displayDoneDate && (
              <span style={{ color: "#0D9488", fontWeight: 500 }}>
                • {displayDoneDate}
              </span>
            )}
          </div>
          {stage.completedBy && (
            <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`Completed by ${stage.completedBy}${displayDoneDate ? ` on ${displayDoneDate}` : ""}`}>
              by {stage.completedBy}
            </div>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenDispute && onOpenDispute(stage, idx); }}
            style={{
              marginTop: 4,
              background: stage.disputed ? "#FEF2F2" : "#FFF7ED",
              color: stage.disputed ? "#DC2626" : "#C2410C",
              border: `1px solid ${stage.disputed ? "#FCA5A5" : "#FDBA74"}`,
              borderRadius: 5,
              padding: "2px 6px",
              fontSize: 9.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 3
            }}
            title="Report false stage completion to MD & Admin"
          >
            <AlertTriangle size={9} />
            {stage.disputed ? "Disputed" : "Report False"}
          </button>
        </div>
      )}
      {!locked && stage.status === "in_progress" && (
        <>
          <div style={{ fontSize: 10.5, color: "#E2A83B", marginTop: 2, fontWeight: 500 }}>
            {stage.assignee && stage.assignee !== "Unassigned" ? stage.assignee : "In Progress"}
          </div>
          {hasColourways && doneColourwaysCount > 0 && (
            <div style={{ fontSize: 9.5, color: "#059669", fontWeight: 600, marginTop: 1 }}>
              ✓ {doneColourwaysCount}/{totalColourwaysCount} colours received
            </div>
          )}
          <div style={{ marginTop: 6 }}>
            <button
              onClick={() => setOpen(!open)}
              style={{
                fontSize: 10.5, background: stage.reason ? "#FCEBEB" : "#F4F4F6",
                color: stage.reason ? "#791F1F" : "#565A66", border: "none",
                padding: "3px 7px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
              }}
            >
              {stage.reason || "Flag delay"} <ChevronDown size={10} />
            </button>
            {open && (
              <div style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: "1px solid #E7E8ED", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 10, minWidth: 170, marginTop: -24 }}>
                {REASONS.map(r => (
                  <div
                    key={r}
                    onClick={() => { onReason(idx, r); setOpen(false); }}
                    style={{ padding: "8px 12px", fontSize: 12.5, cursor: "pointer", color: "#1B2130" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F7F7F9"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {r}
                  </div>
                ))}
                <div
                  onClick={() => { onReason(idx, null); setOpen(false); }}
                  style={{ padding: "8px 12px", fontSize: 12.5, cursor: "pointer", color: "#8A8D98", borderTop: "1px solid #F0F0F2" }}
                >
                  Clear
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PreProductionTab({ order, role, onFieldChange, onSubmit, onApprove }) {
  const canApprove = role.fullAccess || role.dept === "Executive";
  const allApproved = allPreProdApproved(order);

  // Count approved documents
  const approvedDocsCount = PRE_PROD_DOC_TYPES.filter(d => order.preProd && order.preProd[d.key] && order.preProd[d.key].status === "approved").length;

  // Track local upload state for files
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [ppMeetingDone, setPpMeetingDone] = useState(false);
  const [sizeSetDone, setSizeSetDone] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);

  const handleFileUpload = async (docKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFiles(prev => ({ ...prev, [docKey]: file.name }));

    // Auto-scan if PO Sheet or PO document uploaded!
    if (docKey === "poSheet" || file.name.toLowerCase().includes("po") || file.name.toLowerCase().includes("order")) {
      setIsScanning(true);
      setScanMessage("Scanning document for PO #, Qty, FOB Rate & Order Value...");
      try {
        const extracted = await scanPOSheetFile(file);
        if (extracted && (extracted.fobPrice || extracted.orderValue || extracted.poQty || extracted.poNumber)) {
          if (extracted.poNumber) onFieldChange("poSheet", "poNumber", extracted.poNumber);
          if (extracted.poQty) onFieldChange("poSheet", "poQty", extracted.poQty);
          if (extracted.fobPrice) onFieldChange("poSheet", "fobPrice", extracted.fobPrice);
          if (extracted.orderValue) onFieldChange("poSheet", "orderValue", extracted.orderValue);

          const summaryParts = [];
          if (extracted.poNumber) summaryParts.push(`PO #${extracted.poNumber}`);
          if (extracted.poQty) summaryParts.push(`Qty: ${(Number(extracted.poQty) || 0).toLocaleString()}`);
          if (extracted.fobPrice) summaryParts.push(`FOB: ₹${extracted.fobPrice}`);
          if (extracted.orderValue) summaryParts.push(`Order Value: ₹${(Number(extracted.orderValue) || 0).toLocaleString()}`);

          setScanMessage(`✓ Extracted from ${file.name}: ${summaryParts.join(" · ")}`);
        } else {
          setScanMessage(`Attached ${file.name}. (You can also review or enter values manually below)`);
        }
      } catch (err) {
        console.warn("Scan failed:", err);
        setScanMessage(`Attached ${file.name}`);
      } finally {
        setIsScanning(false);
        setTimeout(() => setScanMessage(null), 8000);
      }
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 24 }}>
      {/* Top Banner when all approved */}
      {allApproved ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#15803D", fontWeight: 600 }}>
          <CheckCircle2 size={15} /> All sign-off documents approved — PP Meeting can now be held.
        </div>
      ) : null}

      {/* Auto-scan notification toast / banner */}
      {scanMessage && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: isScanning ? "#EFF6FF" : "#F0FDF4",
          border: `1px solid ${isScanning ? "#BFDBFE" : "#BBF7D0"}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          fontSize: 12.5, color: isScanning ? "#1D4ED8" : "#15803D", fontWeight: 600
        }}>
          {isScanning ? (
            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #3B82F6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#F1F5F9", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#475569" }}>
          {approvedDocsCount}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>Pre-production sign-off</div>
          <div style={{ fontSize: 11.5, color: "#6B7280" }}>
            All documents must be approved before PP Meeting.
          </div>
        </div>
      </div>

      {/* 6 Pre-Production Document Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {PRE_PROD_DOC_TYPES.map(doc => {
          const state = (order.preProd && order.preProd[doc.key]) || { values: {}, status: "draft" };
          const isDraft = !state.status || state.status === "draft";
          const isSubmitted = state.status === "submitted";
          const isApproved = state.status === "approved";

          const uploadedName = uploadedFiles[doc.key];

          return (
            <div
              key={doc.key}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: "16px 18px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
              }}
            >
              {/* Card Header & Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{doc.label}</div>
                <div>
                  {isDraft && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: "#F1F5F9", color: "#475569", padding: "3px 10px", borderRadius: 999, border: "1px solid #E2E8F0" }}>
                      Draft
                    </span>
                  )}
                  {isSubmitted && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: "#FEF3C7", color: "#B45309", padding: "3px 10px", borderRadius: 999, border: "1px solid #FDE68A" }}>
                      Pending Approval
                    </span>
                  )}
                  {isApproved && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: "#DCFCE7", color: "#15803D", padding: "3px 10px", borderRadius: 999, border: "1px solid #BBF7D0" }}>
                      Approved
                    </span>
                  )}
                </div>
              </div>

              {/* Subtitle hint */}
              {doc.hint && (
                <div style={{ fontSize: 11.5, color: "#6B7280", marginBottom: 12 }}>
                  {doc.hint}
                </div>
              )}

              {/* Dashed upload button for CMT, ACC, Grading */}
              {doc.hasUpload && (
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      background: "#F5F3FF",
                      border: "1px dashed #C4B5FD",
                      borderRadius: 8,
                      color: "#6D28D9",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "7px 14px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Upload size={13} />
                    {uploadedName ? `Attached: ${uploadedName}` : doc.uploadLabel}
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(doc.key, e)}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              )}

              {/* Fields Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {/* Row 1: First 2 fields */}
                <div style={{ display: "grid", gridTemplateColumns: doc.fields.length >= 2 ? "1fr 1fr" : "1fr", gap: 12 }}>
                  {doc.fields.slice(0, 2).map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11.5, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 4 }}>
                        {f.label}
                      </label>
                      <input
                        type={f.type || "text"}
                        value={state.values[f.key] || ""}
                        disabled={isApproved}
                        onChange={e => onFieldChange(doc.key, f.key, e.target.value)}
                        style={{
                          width: "100%",
                          fontSize: 12.5,
                          padding: "7px 10px",
                          borderRadius: 6,
                          border: "1px solid #D1D5DB",
                          background: isApproved ? "#F9FAFB" : "#FFFFFF",
                          color: "#111827",
                          boxSizing: "border-box",
                          outline: "none"
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Remaining fields if more than 2 */}
                {doc.fields.length > 2 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {doc.fields.slice(2).map(f => (
                      <div key={f.key} style={{ gridColumn: f.fullWidth ? "1 / -1" : undefined }}>
                        <label style={{ fontSize: 11.5, fontWeight: 500, color: "#6B7280", display: "block", marginBottom: 4 }}>
                          {f.label}
                        </label>
                        <input
                          type={f.type || "text"}
                          value={state.values[f.key] ?? ""}
                          disabled={isApproved}
                          onChange={e => onFieldChange(doc.key, f.key, e.target.value)}
                          style={{
                            width: "100%",
                            fontSize: 12.5,
                            padding: "7px 10px",
                            borderRadius: 6,
                            border: "1px solid #D1D5DB",
                            background: isApproved ? "#F9FAFB" : "#FFFFFF",
                            color: "#111827",
                            boxSizing: "border-box",
                            outline: "none"
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isDraft && (
                  <button
                    type="button"
                    onClick={() => onSubmit(doc.key)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      background: "#4338CA",
                      border: "none",
                      borderRadius: 6,
                      padding: "7px 16px",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                  >
                    Submit for approval
                  </button>
                )}
                {isSubmitted && canApprove && (
                  <button
                    type="button"
                    onClick={() => onApprove(doc.key)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      background: "#16A34A",
                      border: "none",
                      borderRadius: 6,
                      padding: "7px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Check size={13} strokeWidth={3} /> Approve
                  </button>
                )}
                {isSubmitted && !canApprove && (
                  <div style={{ fontSize: 12, color: "#B45309", background: "#FEF3C7", padding: "5px 12px", borderRadius: 6, border: "1px solid #FDE68A" }}>
                    Waiting on manager approval
                  </div>
                )}
                {isApproved && (
                  <div style={{ fontSize: 12, color: "#15803D", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={14} /> Approved by {state.approvedBy || "Manager"} · {state.approvedAt || "Recently"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Gated Milestones (from screenshot) */}
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Milestone 1: PP Meeting */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: allApproved ? "#10B981" : "#CBD5E1" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>PP Meeting</div>
            <div style={{ fontSize: 11.5, color: "#6B7280" }}>
              Conducted after all sign-off documents are approved.
            </div>
          </div>

          {!allApproved ? (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={14} /> Complete all sign-off documents first.
            </div>
          ) : ppMeetingDone ? (
            <div style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 16px", fontSize: 12.5, color: "#15803D", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} /> PP Meeting conducted & approved. Production authorized to proceed.
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setPpMeetingDone(true)}
                style={{
                  background: "#4F46E5",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Conduct & Approve PP Meeting
              </button>
            </div>
          )}
        </div>

        {/* Milestone 2: Size Set & Shrinkage closure */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: ppMeetingDone ? "#10B981" : "#CBD5E1" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Size Set & Shrinkage closure</div>
            <div style={{ fontSize: 11.5, color: "#6B7280" }}>
              Owned by Quality — after PP Meeting is approved.
            </div>
          </div>

          {!ppMeetingDone ? (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={14} /> PP Meeting must be approved first.
            </div>
          ) : sizeSetDone ? (
            <div style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 16px", fontSize: 12.5, color: "#15803D", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} /> Size Set & Shrinkage closed by Quality team.
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => setSizeSetDone(true)}
                style={{
                  background: "#16A34A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Close Size Set & Shrinkage (Quality Sign-off)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderComplianceSection({ order, certifications = [], compliances = [] }) {
  const linkedCerts = certifications.filter(c => c.isDeleted !== true && (c.orderId === order.id || (c.buyer === order.buyer && !c.orderId)));
  const linkedComps = compliances.filter(c => c.isDeleted !== true && (c.orderId === order.id || (c.buyer === order.buyer && !c.orderId)));

  const now = new Date();
  const getDaysUntilExpiry = (expiryDateStr) => {
    if (!expiryDateStr) return null;
    const exp = new Date(expiryDateStr);
    if (isNaN(exp.getTime())) return null;
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Compliance & Certification Checkpoints</div>
          <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>
            Live buyer certifications, scope validity, and compliance testing requirements linked to PO #{order.id} ({order.buyer})
          </div>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "#F0EFFB", color: "#534AB7" }}>
          {linkedComps.filter(c => c.status === "Passed").length}/{linkedComps.length || 1} Checked
        </span>
      </div>

      {/* Linked Certifications */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Certifications ({linkedCerts.length})
        </div>
        {linkedCerts.length === 0 ? (
          <div style={{ padding: "12px 14px", borderRadius: 8, background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#9CA3AF", fontSize: 12 }}>
            No specific certifications linked to this order yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {linkedCerts.map(c => {
              const days = getDaysUntilExpiry(c.expiryDate);
              const isExp = c.status === "Expired" || (days !== null && days < 0);
              const isExpSoon = days !== null && days >= 0 && days <= 30 && c.status === "Approved";
              return (
                <div key={c.id || c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: isExp ? "#FEF2F2" : "#F7FBF9", border: `1px solid ${isExp ? "#FECACA" : "#DCEFE6"}` }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={13} color="#059669" />
                      {c.name} <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6B7280", fontWeight: 400 }}>({c.certNo || "No cert#"})</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                      Issuing Body: {c.issuingOrg || "Accredited"} · Expiry: {c.expiryDate || "—"} {isExpSoon ? " (Expiring Soon)" : isExp ? " (Expired)" : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: isExp ? "#FEE2E2" : "#DCFCE7", color: isExp ? "#991B1B" : "#065F46" }}>
                      {isExp ? "Expired" : isExpSoon ? "Expiring Soon" : (c.status || "Approved")}
                    </span>
                    {c.file && <div style={{ fontSize: 10, color: "#059669", marginTop: 2 }}>✓ {c.file}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Linked Compliance Requirements */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Compliance & Quality Requirements ({linkedComps.length})
        </div>
        {linkedComps.length === 0 ? (
          <div style={{ padding: "12px 14px", borderRadius: 8, background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#9CA3AF", fontSize: 12 }}>
            No compliance requirements linked to this PO.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {linkedComps.map(comp => {
              const isPassed = comp.status === "Passed";
              const isFailed = comp.status === "Failed";
              return (
                <div key={comp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: isFailed ? "#FEF2F2" : isPassed ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${isFailed ? "#FECACA" : isPassed ? "#BBF7D0" : "#E5E7EB"}` }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      {isPassed ? <CheckCircle2 size={13} color="#059669" /> : isFailed ? <AlertTriangle size={13} color="#DC2626" /> : <Clock size={13} color="#D97706" />}
                      {comp.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                      {comp.category} · Assigned: {comp.responsiblePerson || "Unassigned"} ({comp.department || "Compliance"}) · Due: {comp.dueDate || "—"}
                    </div>
                    {comp.description && <div style={{ fontSize: 11.5, color: "#4B5563", marginTop: 3 }}>{comp.description}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: isPassed ? "#DCFCE7" : isFailed ? "#FEE2E2" : "#FEF3C7", color: isPassed ? "#065F46" : isFailed ? "#991B1B" : "#92400E" }}>
                      {comp.status}
                    </span>
                    <div style={{ fontSize: 10, color: "#6B7280", marginTop: 3 }}>Priority: {comp.priority || "Medium"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CostingTab({ order, role = {}, onSetTemplate, onUpdateRow, onAddRow, onSubmitCosting, onApproveCosting, onRejectCosting }) {
  const tmpl = COSTING_TEMPLATES[order.costingTemplate] || COSTING_TEMPLATES.fabric;
  const rows = order.costingRows || [];
  const grandTotal = rows.reduce((a, r) => a + (r.isHeader ? 0 : (Number(r.price) || 0) * (Number(r.qty) || 0)), 0);

  const [usdRate, setUsdRate] = useState(83.5);
  const [eurRate, setEurRate] = useState(90.2);

  const costingApproval = order.costingApproval || {};
  const isApproved = costingApproval.status === "approved";
  const isSubmitted = costingApproval.status === "submitted";
  const isRejected = costingApproval.status === "rejected";
  const isMDOrExec = role?.dept === "Executive" || role?.fullAccess;

  const handleSubmitApproval = () => {
    if (onSubmitCosting) {
      onSubmitCosting(order.primaryId || order.id, { grandTotal, currency: "INR" });
    }
  };

  const handleApprove = () => {
    if (onApproveCosting) {
      onApproveCosting(order.primaryId || order.id, role?.label || "Managing Director (MD)");
    }
  };

  const handleReject = () => {
    if (onRejectCosting) {
      const reason = window.prompt("Reason for rejecting costing?", "Needs review / price adjustment");
      if (reason !== null) {
        onRejectCosting(order.primaryId || order.id, reason);
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Costing — {tmpl.label}</div>
        <select
          value={order.costingTemplate || "fabric"}
          onChange={e => onSetTemplate(order.primaryId || order.id, e.target.value)}
          style={{ fontSize: 12, padding: "5px 8px", borderRadius: 7, border: "1px solid #E7E8ED" }}
        >
          <option value="fabric">Fabric to Garment</option>
          <option value="yarn">Yarn to Garment</option>
        </select>
      </div>
      <div style={{ fontSize: 11.5, color: "#8A8D98", marginBottom: 16 }}>
        Matches the two costing sheets from your T&A workbook. Switching templates resets the entered values below. Use "Add other fabric / trim" for anything this style needs that isn't in the standard list.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.7fr 0.9fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
        <div>Particulars</div><div>Price</div><div>Qty</div><div>Total</div>
      </div>
      {rows.map((row, i) => (
        row.isHeader ? (
          <div key={i} style={{ fontSize: 12, fontWeight: 700, color: "#1B2130", padding: "12px 4px 6px" }}>{row.label}</div>
        ) : (() => {
          const isPercentageRow = ["Overheads", "Rejection", "Commercial Costs", "Profit"].includes(row.label);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.7fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "6px 4px", borderBottom: "1px solid #F7F7F9", background: row.custom ? "#FBFAFF" : isPercentageRow ? "#FAFAFC" : "transparent" }}>
              {row.custom ? (
                <input
                  value={row.label}
                  placeholder="e.g. Recycled polyester tape"
                  onChange={e => onUpdateRow(order.id, i, "label", e.target.value)}
                  style={{ fontSize: 12.5, padding: "5px 8px", borderRadius: 6, border: "1px solid #E0DBF5", marginLeft: 8, marginRight: 8, color: "#1B2130" }}
                />
              ) : (
                <div style={{ color: isPercentageRow ? "#1E293B" : "#565A66", fontWeight: isPercentageRow ? 600 : 400, paddingLeft: 8 }}>{row.label}</div>
              )}

              {/* Price / Rate Column */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="number"
                  value={row.price}
                  onChange={e => onUpdateRow(order.id, i, "price", e.target.value)}
                  style={{ width: isPercentageRow ? 52 : 64, fontSize: 12, padding: "4px 6px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                />
                {isPercentageRow && <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>%</span>}
              </div>

              {/* Qty Column */}
              {isPercentageRow ? (
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>of cost</div>
              ) : (
                <input
                  type="number"
                  value={row.qty}
                  onChange={e => onUpdateRow(order.id, i, "qty", e.target.value)}
                  style={{ width: 54, fontSize: 12, padding: "4px 6px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                />
              )}

              {/* Total Column */}
              <div style={{ fontWeight: 600, color: isPercentageRow ? "#64748B" : "#1B2130", fontSize: 12.5 }}>
                {isPercentageRow ? "—" : ((Number(row.price) || 0) * (Number(row.qty) || 0)).toLocaleString()}
              </div>
            </div>
          );
        })()
      ))}
      <button
        onClick={() => onAddRow(order.id)}
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, background: "#F5F3FF", color: "#534AB7", border: "1px dashed #C9BFF0", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
      >
        + Add other fabric / trim
      </button>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1.5px solid #ECEDF1" }}>
        {/* TOTAL COST (per pc) & TOTAL PLANNED BUDGET Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2130", letterSpacing: 0.5 }}>TOTAL COST (per pc)</div>
            <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>
              Includes overheads, rejection, commercial costs, and profit margin
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#151B2E", marginTop: 4 }}>
              ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: "10px 16px", textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Total Order Planned Cost (Feeds Finances)
            </div>
            <div style={{ fontSize: 11, color: "#15803D", marginTop: 2 }}>
              {Number(order.qty || 0).toLocaleString("en-IN")} pcs × ₹{grandTotal.toLocaleString()} / pc
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#14532D", marginTop: 4 }}>
              ₹{(Math.round(grandTotal * (Number(order.qty) || 0))).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Currency Conversion Section */}
        <div style={{ marginTop: 18, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Currency conversion
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* USD Box */}
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 10, padding: "12px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>USD</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748B" }}>
                  <span>$1 = ₹</span>
                  <input
                    type="number"
                    step="0.1"
                    value={usdRate}
                    onChange={e => setUsdRate(Number(e.target.value) || 0)}
                    style={{ width: 56, fontSize: 11.5, fontWeight: 600, padding: "3px 6px", borderRadius: 6, border: "1px solid #CBD5E1", textAlign: "right" }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0284C7" }}>
                $ {usdRate > 0 ? (grandTotal / usdRate).toFixed(2) : "0.00"}
              </div>
              <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 4 }}>
                ₹{grandTotal} @ ₹{usdRate} / $1
              </div>
            </div>

            {/* EUR Box */}
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 10, padding: "12px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>EUR</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748B" }}>
                  <span>€1 = ₹</span>
                  <input
                    type="number"
                    step="0.1"
                    value={eurRate}
                    onChange={e => setEurRate(Number(e.target.value) || 0)}
                    style={{ width: 56, fontSize: 11.5, fontWeight: 600, padding: "3px 6px", borderRadius: 6, border: "1px solid #CBD5E1", textAlign: "right" }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#4F46E5" }}>
                € {eurRate > 0 ? (grandTotal / eurRate).toFixed(2) : "0.00"}
              </div>
              <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 4 }}>
                ₹{grandTotal} @ ₹{eurRate} / €1
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 10 }}>
            Enter current exchange rate above — conversion is per pc cost
          </div>
        </div>

        {/* Costing Approval Section */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: isApproved ? "#ECFDF5" : isSubmitted ? "#FFFBEB" : isRejected ? "#FEF2F2" : "#F1F5F9", border: `1px solid ${isApproved ? "#A7F3D0" : isSubmitted ? "#FDE68A" : isRejected ? "#FECACA" : "#E2E8F0"}`, borderRadius: 10, padding: "12px 16px" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B" }}>Costing approval</div>
            <div style={{ fontSize: 11, color: isApproved ? "#059669" : isSubmitted ? "#D97706" : isRejected ? "#DC2626" : "#64748B", marginTop: 2, fontWeight: isApproved || isSubmitted || isRejected ? 600 : 400 }}>
              {isApproved
                ? `✓ Approved by ${costingApproval.approvedBy || "Managing Director (MD)"} (${costingApproval.approvedDate || "Approved"}) · Pass`
                : isSubmitted
                ? `⏳ Submitted for DGM / MD approval (${costingApproval.submittedDate || "Pending sign-off"}). Awaiting MD authorization.`
                : isRejected
                ? `✕ Costing rejected by MD (${costingApproval.reason || "Revisions needed"}). Please revise sheet and resubmit.`
                : "Requires sign-off from DGM / Managing Director"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {isApproved ? (
              <button
                style={{
                  background: "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: "default",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)"
                }}
              >
                <span>✓</span> Approved (Pass)
              </button>
            ) : isMDOrExec ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    handleSubmitApproval();
                    handleApprove();
                  }}
                  style={{
                    background: "#10B981",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 18px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)"
                  }}
                >
                  ✓ Approve & Sync to Finance
                </button>
                {isSubmitted && (
                  <button
                    onClick={handleReject}
                    style={{
                      background: "#EF4444",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Reject
                  </button>
                )}
              </div>
            ) : isSubmitted ? (
              <button
                disabled
                title="Submitted to Managing Director (MD) for authorization"
                style={{
                  background: "#F59E0B",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "not-allowed",
                  opacity: 0.95,
                  boxShadow: "0 2px 4px rgba(245, 158, 11, 0.2)"
                }}
              >
                ⏳ Pending MD Approval (Synced)
              </button>
            ) : isRejected ? (
              <button
                onClick={handleSubmitApproval}
                style={{
                  background: "#378ADD",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(55, 138, 221, 0.2)"
                }}
              >
                Resubmit for MD approval
              </button>
            ) : (
              <button
                onClick={handleSubmitApproval}
                style={{
                  background: "#378ADD",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(55, 138, 221, 0.2)"
                }}
              >
                Submit & Sync to Finance
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderHighlightsCard({ order, role }) {
  const [highlights, setHighlights] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [tagDept, setTagDept] = useState("All");
  const [showResolved, setShowResolved] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const personName = role.label.split(" (")[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (window.storage && window.storage.get) {
          const res = await window.storage.get(`highlights:${order.id}`, true);
          if (!cancelled) setHighlights(res && res.value ? JSON.parse(res.value) : []);
        } else {
          const local = localStorage.getItem(`highlights:${order.id}`);
          if (!cancelled) setHighlights(local ? JSON.parse(local) : []);
        }
      } catch (e) {
        if (!cancelled) setHighlights([]);
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [order.id]);

  async function persist(next) {
    setHighlights(next);
    try {
      if (window.storage && window.storage.set) {
        await window.storage.set(`highlights:${order.id}`, JSON.stringify(next), true);
      } else {
        localStorage.setItem(`highlights:${order.id}`, JSON.stringify(next));
      }
    } catch (e) {}
  }

  function addHighlight() {
    const t = text.trim();
    if (!t) return;
    const item = { id: Date.now(), text: t, dept: tagDept, by: personName, ts: new Date().toLocaleString(), resolved: false, source: "manual" };
    persist([item, ...highlights]);
    setText("");
    setTagDept("All");
  }

  async function extractFromTechPack() {
    const source = pasteText.trim();
    if (!source) return;
    setExtracting(true);
    setExtractError("");
    try {
      const response = await fetch("/api/gemini/extract-highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techPackNotes: source,
          deptOptions: HIGHLIGHT_DEPT_OPTIONS,
        }),
      });
      const data = await response.json();
      const parsed = data.items || [];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setExtractError("No specific instructions found in that text — try pasting the full comments section.");
      } else {
        const validDepts = new Set(["All", ...HIGHLIGHT_DEPT_OPTIONS]);
        const items = parsed.map(p => ({
          id: Date.now() + Math.random(),
          text: String(p.text || "").slice(0, 200),
          dept: validDepts.has(p.dept) ? p.dept : "All",
          by: `${personName} (auto-extracted)`,
          ts: new Date().toLocaleString(),
          resolved: false,
          source: "auto",
        })).filter(i => i.text);
        persist([...items, ...highlights]);
        setPasteText("");
      }
    } catch (e) {
      setExtractError("Couldn't extract right now — you can still add a note manually below.");
    } finally {
      setExtracting(false);
    }
  }

  function toggleResolved(id) {
    persist(highlights.map(h => h.id === id ? { ...h, resolved: !h.resolved } : h));
  }

  if (!loaded) return null;
  const unresolved = highlights.filter(h => !h.resolved);
  const resolved = highlights.filter(h => h.resolved);

  return (
    <div style={{ background: "#FFFBF0", border: "1px solid #F5E3B8", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#FBEFD1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle size={14} color="#966B1E" />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#5A3E0E" }}>Order Highlights — Buyer Comments & Tech Pack Notes</div>
      </div>
      <div style={{ fontSize: 11.5, color: "#8A6E2E", margin: "4px 0 14px", marginLeft: 36 }}>
        Paste the tech pack's comments section below and it's read automatically — no need to type each note out by hand.
      </div>

      <div style={{ background: "#fff", border: "1px solid #EBD9A0", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="Paste the tech pack's comments / buyer notes section here…"
          rows={3}
          style={{ width: "98%", fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #EBD9A0", resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <button
            onClick={() => setShowManualAdd(!showManualAdd)}
            style={{ fontSize: 11.5, color: "#8A6E2E", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            {showManualAdd ? "Hide manual add" : "Add a note manually instead"}
          </button>
          <button
            onClick={extractFromTechPack}
            disabled={extracting || !pasteText.trim()}
            style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: extracting ? "#C7A75A" : "#B0812E", border: "none", borderRadius: 8, padding: "8px 16px", cursor: extracting ? "default" : "pointer" }}
          >
            {extracting ? "Reading tech pack…" : "Auto-extract highlights"}
          </button>
        </div>
        {extractError && <div style={{ fontSize: 11.5, color: "#A32D2D", marginTop: 8 }}>{extractError}</div>}
      </div>

      {showManualAdd && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addHighlight(); }}
            placeholder="e.g. Buyer wants matte snap buttons, not shiny — confirmed on call"
            style={{ flex: 1, fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #EBD9A0" }}
          />
          <select value={tagDept} onChange={e => setTagDept(e.target.value)} style={{ fontSize: 12, padding: "8px 8px", borderRadius: 8, border: "1px solid #EBD9A0" }}>
            <option value="All">All departments</option>
            {HIGHLIGHT_DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={addHighlight} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#B0812E", border: "none", borderRadius: 8, padding: "0 16px", cursor: "pointer" }}>Add</button>
        </div>
      )}

      {unresolved.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "#8A6E2E" }}>No open highlights — nothing flagged from the buyer or tech pack right now.</div>
      ) : unresolved.map(h => {
        const relevant = h.dept !== "All" && h.dept === role.dept;
        return (
          <div
            key={h.id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "10px 12px", marginBottom: 8, borderRadius: 10, background: relevant ? "#FCEBEB" : "#fff", border: `1px solid ${relevant ? "#F0C4C4" : "#F0E4C0"}` }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#3D2E0E", fontWeight: relevant ? 700 : 500 }}>
                {h.source === "auto" && <Zap size={11} color="#B0812E" style={{ marginRight: 4, verticalAlign: -1 }} />}
                {h.text}
              </div>
              <div style={{ fontSize: 10.5, color: "#9C8659", marginTop: 3 }}>
                {h.dept !== "All" && <span style={{ background: "#F0E4C0", color: "#6B5216", padding: "1px 7px", borderRadius: 999, marginRight: 6 }}>{h.dept}</span>}
                {h.by} · {h.ts}
              </div>
            </div>
            <button onClick={() => toggleResolved(h.id)} style={{ fontSize: 11, fontWeight: 600, color: "#6B5216", background: "#F0E4C0", border: "none", borderRadius: 999, padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
              Mark noted
            </button>
          </div>
        );
      })}

      {resolved.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div onClick={() => setShowResolved(!showResolved)} style={{ fontSize: 11.5, color: "#8A6E2E", cursor: "pointer", fontWeight: 600 }}>
            {showResolved ? "Hide" : "Show"} noted ({resolved.length})
          </div>
          {showResolved && resolved.map(h => (
            <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "8px 12px", marginTop: 6, borderRadius: 10, background: "#F7F5EE" }}>
              <div style={{ fontSize: 12.5, color: "#A79A78", textDecoration: "line-through" }}>{h.text}</div>
              <button onClick={() => toggleResolved(h.id)} style={{ fontSize: 10.5, color: "#8A6E2E", background: "none", border: "none", cursor: "pointer" }}>Reopen</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsPanel({
  order, role, costingContent, preProdContent, quotationContent, complianceContent,
  onUpdateShippedQty, onAddProductionLog, onDeleteProductionLog, onUpdateInspectionData, onUpdateCertificates,
  people = [],
  onPushNotification,
  onPreProdField
}) {
  const [activeTab, setActiveTab] = useState("Files");
  const [docs, setDocs] = useState({});
  const [customTypes, setCustomTypes] = useState({});
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [messages, setMessages] = useState([]);
  const [includeStages, setIncludeStages] = useState(() => Object.fromEntries(STAGE_CHAT_TABS.map(t => [t, true])));
  const [draft, setDraft] = useState("");
  const [mentionQuery, setMentionQuery] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (window.storage && window.storage.get) {
          const res = await window.storage.get(`docs:${order.id}`, true);
          if (!cancelled) setDocs(res && res.value ? JSON.parse(res.value) : {});
        } else {
          const local = localStorage.getItem(`docs:${order.id}`);
          if (!cancelled) setDocs(local ? JSON.parse(local) : {});
        }
      } catch (e) { if (!cancelled) setDocs({}); }
      try {
        if (window.storage && window.storage.get) {
          const res2 = await window.storage.get(`chat:${order.id}`, true);
          if (!cancelled) setMessages(res2 && res2.value ? JSON.parse(res2.value) : []);
        } else {
          const local2 = localStorage.getItem(`chat:${order.id}`);
          if (!cancelled) setMessages(local2 ? JSON.parse(local2) : []);
        }
      } catch (e) { if (!cancelled) setMessages([]); }
      try {
        if (window.storage && window.storage.get) {
          const res3 = await window.storage.get(`customTypes:${order.id}`, true);
          if (!cancelled) setCustomTypes(res3 && res3.value ? JSON.parse(res3.value) : {});
        } else {
          const local3 = localStorage.getItem(`customTypes:${order.id}`);
          if (!cancelled) setCustomTypes(local3 ? JSON.parse(local3) : {});
        }
      } catch (e) { if (!cancelled) setCustomTypes({}); }
    })();
    return () => { cancelled = true; };
  }, [order.id]);

  const uploaderName = role && role.label ? role.label.split(" (")[0] : "User";

  async function upload(docType, file) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const entry = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        uploadedAt: new Date().toLocaleString(),
        by: uploaderName
      };
      const next = { ...docs, [docType]: entry };
      setDocs(next);
      try {
        if (window.storage && window.storage.set) {
          await window.storage.set(`docs:${order.id}`, JSON.stringify(next), true);
        } else {
          localStorage.setItem(`docs:${order.id}`, JSON.stringify(next));
        }
      } catch (e) {
        console.warn("Storage upload save error:", e.message);
      }
    };
    reader.readAsDataURL(file);

    // Auto-scan PO Sheet or order files for FOB and Order Value
    if (docType === "PO Sheet" || file.name.toLowerCase().includes("po") || file.name.toLowerCase().includes("order")) {
      setScanStatus({ text: `Scanning ${file.name} for PO & FOB values...`, loading: true });
      try {
        const extracted = await scanPOSheetFile(file);
        if (extracted && (extracted.fobPrice || extracted.orderValue || extracted.poQty || extracted.poNumber)) {
          if (onPreProdField) {
            if (extracted.poNumber) onPreProdField(order.primaryId || order.id, "poSheet", "poNumber", extracted.poNumber);
            if (extracted.poQty) onPreProdField(order.primaryId || order.id, "poSheet", "poQty", extracted.poQty);
            if (extracted.fobPrice) onPreProdField(order.primaryId || order.id, "poSheet", "fobPrice", extracted.fobPrice);
            if (extracted.orderValue) onPreProdField(order.primaryId || order.id, "poSheet", "orderValue", extracted.orderValue);
          }

          const details = [];
          if (extracted.poNumber) details.push(`PO #${extracted.poNumber}`);
          if (extracted.poQty) details.push(`Qty: ${(Number(extracted.poQty) || 0).toLocaleString()}`);
          if (extracted.fobPrice) details.push(`FOB: ₹${extracted.fobPrice}`);
          if (extracted.orderValue) details.push(`Order Value: ₹${(Number(extracted.orderValue) || 0).toLocaleString()}`);

          setScanStatus({ text: `✓ Auto-scanned & synced to Order Value: ${details.join(" · ")}`, loading: false });
        } else {
          setScanStatus({ text: `✓ Attached ${file.name}. (Values can also be reviewed in Pre-Production tab)`, loading: false });
        }
      } catch (err) {
        console.warn("Scan failed:", err);
        setScanStatus({ text: `Attached ${file.name}`, loading: false });
      } finally {
        setTimeout(() => setScanStatus(null), 8000);
      }
    }
  }

  async function deleteDoc(docType) {
    if (!window.confirm(`Are you sure you want to delete the file for "${docType}"?`)) return;
    const next = { ...docs };
    delete next[docType];
    setDocs(next);
    try {
      if (window.storage && window.storage.set) {
        await window.storage.set(`docs:${order.id}`, JSON.stringify(next), true);
      } else {
        localStorage.setItem(`docs:${order.id}`, JSON.stringify(next));
      }
    } catch (e) {
      console.warn("Storage delete error:", e.message);
    }
  }

  async function addCustomType() {
    const label = customLabel.trim();
    if (!label) return;
    const next = { ...customTypes, [activeTab]: [...(customTypes[activeTab] || []), label] };
    setCustomTypes(next);
    setCustomLabel("");
    setAddingCustom(false);
    try {
      if (window.storage && window.storage.set) {
        await window.storage.set(`customTypes:${order.id}`, JSON.stringify(next), true);
      } else {
        localStorage.setItem(`customTypes:${order.id}`, JSON.stringify(next));
      }
    } catch (e) {}
  }

  async function sendMessage() {
    if (!draft.trim()) return;
    const text = draft.trim();
    const msg = { id: Date.now(), author: uploaderName, text, ts: new Date().toLocaleString(), stage: STAGE_CHAT_TABS.includes(activeTab) ? activeTab : null };
    const next = [...messages, msg];
    setMessages(next);
    setDraft("");
    setMentionQuery(null);
    try {
      if (window.storage && window.storage.set) {
        await window.storage.set(`chat:${order.id}`, JSON.stringify(next), true);
      } else {
        localStorage.setItem(`chat:${order.id}`, JSON.stringify(next));
      }
    } catch (e) {}

    // Dispatch direct user notifications for each @mentioned user!
    if (onPushNotification) {
      const mentionMatches = text.match(/@([a-zA-Z0-9_.-]+)/g);
      if (mentionMatches && mentionMatches.length > 0) {
        const uniqueMentions = Array.from(new Set(mentionMatches.map(m => m.replace(/^@/, "").trim())));
        uniqueMentions.forEach(uTag => {
          onPushNotification({
            eventKey: `chat-mention-${order.id}-${msg.id}-${uTag}`,
            type: "task",
            title: `Mentioned in Order #${order.id} Chat`,
            message: `@${uploaderName} mentioned you in Order #${order.id} (${order.style}): "${text}"`,
            relatedModule: "orders",
            relatedId: order.id,
            targetUser: uTag,
            priority: "high"
          });
        });
      }
    }
  }

  function handleDraftChange(e) {
    const val = e.target.value;
    setDraft(val);
    const m = val.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);
    setMentionQuery(m !== null ? m[1] : null);
  }

  function insertMention(u) {
    const userTag = `@${u.username || u.name} `;
    setDraft(d => d.replace(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/, match => {
      return match.startsWith(" ") ? ` ${userTag}` : userTag;
    }));
    setMentionQuery(null);
  }

  const allUsersList = useMemo(() => {
    const list = [];
    const seen = new Set();
    (people || []).forEach(p => {
      const uName = p.username || p.name;
      if (uName && !seen.has(uName.toLowerCase())) {
        seen.add(uName.toLowerCase());
        list.push({
          id: p.id || uName,
          name: p.name || p.username,
          username: p.username || p.name,
          dept: p.dept || p.teamName || "Team"
        });
      }
    });
    (ALL_PEOPLE || []).forEach(n => {
      if (n && n !== "—" && !seen.has(n.toLowerCase())) {
        seen.add(n.toLowerCase());
        list.push({ id: n, name: n, username: n.toLowerCase().replace(/\s+/g, ""), dept: "Staff" });
      }
    });
    return list;
  }, [people]);

  const mentionSuggestions = mentionQuery !== null
    ? allUsersList.filter(u => {
        const q = mentionQuery.toLowerCase();
        return u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
      }).slice(0, 6)
    : [];

  const visibleMessages = messages.filter(m => !m.stage || includeStages[m.stage]);
  const docTypes = [...(DOC_TABS_CONFIG[activeTab] || []), ...(customTypes[activeTab] || [])];
  const ActiveIcon = DOC_TAB_ICONS[activeTab] || FileText;
  const ACCENT = "#534AB7";
  const allowedDepts = TAB_ALLOWED_DEPTS[activeTab] || [];
  const canUploadHere = role.fullAccess || allowedDepts.includes(role.dept);

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {/* Vertical icon rail */}
      <div style={{ width: 92, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
        {DOC_TAB_NAMES.map(tab => {
          const Icon = DOC_TAB_ICONS[tab] || FileText;
          const active = activeTab === tab;
          return (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center",
                padding: "10px 4px", borderRadius: 10, cursor: "pointer",
                background: active ? "#F0EFFB" : "transparent",
                border: active ? "1px solid #D9D6F5" : "1px solid transparent",
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: active ? ACCENT : "#F0F0F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={active ? "#fff" : "#8A8D98"} />
              </div>
              <div style={{ fontSize: 9.5, fontWeight: active ? 700 : 500, color: active ? "#39328F" : "#8A8D98", lineHeight: 1.2 }}>{tab}</div>
            </div>
          );
        })}
      </div>

      <Card style={{ flex: 1, padding: 0, overflow: "hidden" }}>
        <div style={{ height: 3, background: ACCENT }} />
        <div style={{ padding: "18px 20px" }}>
          {activeTab === "Costing" && costingContent ? costingContent : activeTab === "Pre-Production" && preProdContent ? preProdContent : activeTab === "Quotation" && quotationContent ? quotationContent : activeTab === "Production" ? (
            <ProductionTab
              order={order}
              role={role}
              docs={docs}
              onUploadDoc={upload}
              onDeleteDoc={deleteDoc}
              onViewDoc={(doc) => setPreviewDoc(doc)}
              onAddProductionLog={onAddProductionLog}
              onDeleteProductionLog={onDeleteProductionLog}
              canUploadHere={canUploadHere}
            />
          ) : activeTab === "Inspection" ? (
            <InspectionTab
              order={order}
              role={role}
              docs={docs}
              onUploadDoc={upload}
              onDeleteDoc={deleteDoc}
              onViewDoc={(doc) => setPreviewDoc(doc)}
              onUpdateInspectionData={onUpdateInspectionData}
              canUploadHere={canUploadHere}
            />
          ) : activeTab === "Certificates" || activeTab === "Compliance & Certs" ? (
            <CertificatesTab
              order={order}
              role={role}
              docs={docs}
              onUploadDoc={upload}
              onDeleteDoc={deleteDoc}
              onViewDoc={(doc) => setPreviewDoc(doc)}
              onUpdateCertificates={onUpdateCertificates}
              canUploadHere={canUploadHere}
            />
          ) : (
          <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ActiveIcon size={13} color={ACCENT} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>{activeTab}</div>
          </div>
          <div style={{ fontSize: 11.5, color: "#8A8D98", marginBottom: 16, marginLeft: 34 }}>
            {activeTab === "Files" ? "Source documents for this order — uploading PO Sheet automatically extracts FOB & PO Values" : "Upload proof once this T&A action is complete"}
            {!canUploadHere && allowedDepts.length > 0 && (
              <span style={{ color: "#B0812E", fontWeight: 600 }}> · Attaching here is owned by {allowedDepts.join(" / ")}</span>
            )}
          </div>
          {scanStatus && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: scanStatus.loading ? "#EFF6FF" : "#F0FDF4",
              border: `1px solid ${scanStatus.loading ? "#BFDBFE" : "#BBF7D0"}`,
              borderRadius: 8, padding: "10px 14px", marginBottom: 14,
              fontSize: 12.5, color: scanStatus.loading ? "#1D4ED8" : "#15803D", fontWeight: 600
            }}>
              {scanStatus.loading ? (
                <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #3B82F6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <span>{scanStatus.text}</span>
            </div>
          )}
          {activeTab === "Final OCR" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F7F7F9", border: "1px solid #ECEDF1", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1B2130" }}>Shipped quantity</div>
                <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>Actual qty dispatched — this is what feeds the Buyer Qty Difference Per Season report, in place of an estimate.</div>
              </div>
              <input
                type="number"
                value={order.shippedQty || 0}
                disabled={!canUploadHere}
                onChange={e => onUpdateShippedQty(order.primaryId || order.id, Number(e.target.value))}
                style={{ width: 110, fontSize: 13, fontWeight: 600, padding: "7px 10px", borderRadius: 8, border: "1px solid #E7E8ED", textAlign: "right" }}
              />
              <span style={{ fontSize: 11.5, color: "#8A8D98" }}>/ {(Number(order.qty) || 0).toLocaleString()} pcs ordered</span>
            </div>
          )}
          {docTypes.map((docType, i) => {
            const entry = docs[docType];
            const inputId = `upload-${order.id}-${activeTab}-${i}`;
            const isImage = entry && (entry.type?.startsWith("image/") || entry.dataUrl?.startsWith("data:image/"));
            const isPdf = entry && (entry.type === "application/pdf" || entry.name?.toLowerCase().endsWith(".pdf") || entry.dataUrl?.startsWith("data:application/pdf"));

            const meta = DOC_ITEM_METADATA[docType];

            return (
              <div key={docType} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", marginBottom: 8, borderRadius: 10, background: entry ? "#F7FBF9" : "#FAFAFB", border: `1px solid ${entry ? "#DCEFE6" : "#EFEFF2"}` }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{docType}</span>
                    {meta && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: meta.color || "#4338CA",
                          background: meta.bg || "#EEF2FF",
                          border: `1px solid ${meta.border || "#C7D2FE"}`,
                          padding: "1px 8px",
                          borderRadius: 999,
                          display: "inline-block"
                        }}
                      >
                        {meta.dept}
                      </span>
                    )}
                  </div>
                  {entry ? (
                    <div style={{ fontSize: 11, color: "#1F9E8D", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                      <span
                        onClick={() => setPreviewDoc({ ...entry, docType })}
                        style={{ fontWeight: 600, color: "#047857", cursor: "pointer", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}
                        title="Click to view file"
                      >
                        {isImage && (
                          <img src={entry.dataUrl} alt={entry.name} style={{ width: 18, height: 18, objectFit: "cover", borderRadius: 3, border: "1px solid #A7F3D0" }} />
                        )}
                        {entry.name}
                      </span>
                      <span style={{ color: "#64748B" }}>· {entry.by} · {entry.uploadedAt}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#B0B2BA", marginTop: 3 }}>Not uploaded yet</div>
                  )}
                </div>

                {/* 3 Action Options: View, Upload/Replace, Delete */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {/* 1. View Button (Enabled when file is uploaded) */}
                  {entry && (
                    <button
                      onClick={() => setPreviewDoc({ ...entry, docType })}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11.5, fontWeight: 600, color: "#2563EB",
                        border: "1px solid #BFDBFE", background: "#EFF6FF",
                        borderRadius: 8, padding: "5px 10px", cursor: "pointer"
                      }}
                      title="View file or preview document"
                    >
                      <Eye size={12} /> View
                    </button>
                  )}

                  {/* 2. Upload / Replace Button */}
                  {canUploadHere ? (
                    <>
                      <input
                        type="file"
                        id={inputId}
                        style={{ display: "none" }}
                        onChange={e => { const f = e.target.files[0]; if (f) upload(docType, f); e.target.value = ""; }}
                      />
                      <label
                        htmlFor={inputId}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 11.5, fontWeight: 600,
                          color: entry ? "#0D9488" : ACCENT,
                          border: `1px solid ${entry ? "#99F6E4" : "#D9D6F5"}`,
                          background: "#fff", borderRadius: 8, padding: "5px 10px", cursor: "pointer"
                        }}
                        title={entry ? "Replace existing file" : "Upload new file"}
                      >
                        <Upload size={12} /> {entry ? "Replace" : "Upload"}
                      </label>
                    </>
                  ) : (
                    !entry && <span style={{ fontSize: 11, color: "#B0B2BA", fontWeight: 600, padding: "5px 10px" }}>View only</span>
                  )}

                  {/* 3. Delete Button */}
                  {entry && canUploadHere && (
                    <button
                      onClick={() => deleteDoc(docType)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11.5, fontWeight: 600, color: "#DC2626",
                        border: "1px solid #FECACA", background: "#FEF2F2",
                        borderRadius: 8, padding: "5px 9px", cursor: "pointer"
                      }}
                      title="Delete uploaded file"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {CUSTOMIZABLE_TABS.has(activeTab) && canUploadHere && (
            addingCustom ? (
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  autoFocus
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addCustomType(); }}
                  placeholder="e.g. Other Trim — Elastic Tape"
                  style={{ flex: 1, fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #E7E8ED" }}
                />
                <button onClick={addCustomType} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer" }}>Add</button>
                <button onClick={() => { setAddingCustom(false); setCustomLabel(""); }} style={{ fontSize: 12, color: "#8A8D98", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
              </div>
            ) : (
              <div
                onClick={() => setAddingCustom(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 14px", borderRadius: 10, border: "1px dashed #D9D6F5", color: ACCENT, fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginTop: 4 }}
              >
                + Add other {activeTab === "Sampling" ? "sample type" : activeTab === "Costing" ? "line item" : "material / trim / file"}
              </div>
            )
          )}
          </>
          )}
        </div>
      </Card>

      <Card style={{ width: 280, flexShrink: 0, padding: 0, display: "flex", flexDirection: "column", maxHeight: 560, overflow: "hidden" }}>
        <div style={{ height: 3, background: "#378ADD" }} />
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #ECEDF1", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "#EAF2FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={12} color="#378ADD" />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2130" }}>Activity & Chat</div>
        </div>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #ECEDF1" }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#8A8D98", letterSpacing: 0.4, marginBottom: 8 }}>INCLUDE STAGE CHATS</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STAGE_CHAT_TABS.map(tab => (
              <div key={tab} onClick={() => setIncludeStages(s => ({ ...s, [tab]: !s[tab] }))} style={{ textAlign: "center", cursor: "pointer" }}>
                <div style={{ padding: "5px 9px", border: `1.5px solid ${includeStages[tab] ? "#378ADD" : "#DADCE2"}`, background: includeStages[tab] ? "#EAF2FC" : "#fff", borderRadius: 999, fontSize: 9.5, color: includeStages[tab] ? "#255D9E" : "#8A8D98", fontWeight: 600 }}>
                  {tab}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", minHeight: 140 }}>
          {visibleMessages.length === 0 ? (
            <div style={{ fontSize: 12, color: "#B0B2BA" }}>No messages yet. Tag a teammate with @ to loop them in.</div>
          ) : visibleMessages.map(m => (
            <div key={m.id} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: "#7F77DD", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {m.author.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 11.5 }}>
                  <span style={{ fontWeight: 700, color: "#1B2130" }}>{m.author}</span>{" "}
                  <span style={{ color: "#B0B2BA" }}>{m.ts}</span>
                  {m.stage && <span style={{ color: "#B0B2BA" }}> · {m.stage}</span>}
                </div>
                <div style={{ fontSize: 12.5, color: "#1B2130", background: "#F5F6F8", borderRadius: 10, padding: "6px 10px", marginTop: 3, display: "inline-block" }}>
                  {renderWithMentions(m.text)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #ECEDF1", padding: "10px 16px", position: "relative" }}>
          {mentionSuggestions.length > 0 && (
            <div style={{ position: "absolute", bottom: "100%", left: 16, right: 16, background: "#fff", border: "1px solid #ECEDF1", borderRadius: 8, boxShadow: "0 -6px 20px rgba(0,0,0,0.12)", marginBottom: 6, zIndex: 100, overflow: "hidden" }}>
              <div style={{ padding: "6px 12px", fontSize: 10.5, fontWeight: 700, color: "#8A8D98", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                SUGGESTED TEAM MEMBERS (TAG WITH @)
              </div>
              {mentionSuggestions.map(u => (
                <div
                  key={u.id}
                  onClick={() => insertMention(u)}
                  style={{ padding: "8px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                >
                  <span style={{ fontWeight: 600, color: "#1E293B" }}>@{u.username} <span style={{ fontWeight: 400, color: "#64748B" }}>({u.name})</span></span>
                  <span style={{ fontSize: 10.5, color: "#94A3B8" }}>{u.dept}</span>
                </div>
              ))}
            </div>
          )}
          <textarea
            value={draft}
            onChange={handleDraftChange}
            placeholder="Type a message... Use @ to mention"
            rows={2}
            style={{ width: "92%", border: "1px solid #E7E8ED", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, resize: "none", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={sendMessage} style={{ display: "flex", alignItems: "center", gap: 5, background: "#378ADD", color: "#fff", border: "none", borderRadius: 999, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Send size={11} /> Send
            </button>
          </div>
        </div>
      </Card>

      {/* Full File Preview Modal (Image / PDF / File Viewer) */}
      {previewDoc && (
        <div
          onClick={() => setPreviewDoc(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFFFF", borderRadius: 14, maxWidth: "90vw", width: 850,
              maxHeight: "90vh", display: "flex", flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{previewDoc.docType} — {previewDoc.name}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  Uploaded by {previewDoc.by} · {previewDoc.uploadedAt}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {previewDoc.dataUrl && (
                  <a
                    href={previewDoc.dataUrl}
                    download={previewDoc.name}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      fontSize: 12, fontWeight: 600, color: "#2563EB",
                      background: "#EFF6FF", border: "1px solid #BFDBFE",
                      borderRadius: 8, padding: "6px 12px", textDecoration: "none"
                    }}
                  >
                    <Download size={13} /> Download
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{
                    background: "#F1F5F9", border: "none", borderRadius: 8,
                    width: 32, height: 32, display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", color: "#64748B"
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body / File Display */}
            <div style={{ flex: 1, padding: 20, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", minHeight: 350 }}>
              {previewDoc.dataUrl && (previewDoc.type?.startsWith("image/") || previewDoc.dataUrl.startsWith("data:image/")) ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
              ) : previewDoc.dataUrl && (previewDoc.type === "application/pdf" || previewDoc.name?.toLowerCase().endsWith(".pdf") || previewDoc.dataUrl.startsWith("data:application/pdf")) ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.name}
                  style={{ width: "100%", height: "70vh", border: "none", borderRadius: 8 }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 12, border: "1px solid #CBD5E1" }}>
                  <FileText size={48} color="#64748B" style={{ margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{previewDoc.name}</div>
                  <div style={{ fontSize: 12, color: "#64748B", margin: "6px 0 16px" }}>File format preview not directly supported in browser view.</div>
                  {previewDoc.dataUrl && (
                    <a
                      href={previewDoc.dataUrl}
                      download={previewDoc.name}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#378ADD", color: "#fff", padding: "8px 16px",
                        borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none"
                      }}
                    >
                      <Download size={13} /> Download File
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderWorkspace({
  order, onBack, onUpdateStages, role, onSetTemplate, onSetCostingTemplate,
  onUpdateCostingRow, onAddCostingRow, onUpdateShippedQty, onPreProdField,
  onPreProdSubmit, onPreProdApprove, onUpdateQuotation, onSubmitQuotation,
  onApproveQuotation, onRejectQuotation, onSubmitCosting, onApproveCosting, onRejectCosting,
  certifications = [], compliances = [],
  suppliers = [], onAssignSupplier, onAssignWork, onAddProductionLog, onDeleteProductionLog, onUpdateInspectionData, onUpdateCertificates, allOrders = [], people = [],
  onReportComplaint,
  onPushNotification
}) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAlignModal, setShowAlignModal] = useState(false);
  const [disputeModalData, setDisputeModalData] = useState(null);
  const [colourwayModalStageIdx, setColourwayModalStageIdx] = useState(null);
  const cuttingIdx = order.stages.findIndex(s => s.name === "Cutting");
  const bulkGateOpen = allPreProdApproved(order);

  // Derive colourways ONLY if this order has color breakdown or multiple colors configured
  const orderColourways = useMemo(() => {
    // 1. Color breakdown array with valid entries (e.g. from Add Order multi-color table)
    if (Array.isArray(order.colorBreakdown) && order.colorBreakdown.length > 0) {
      const map = new Map();
      for (const item of order.colorBreakdown) {
        const cName = (item.color || "").trim();
        if (!cName) continue;
        const qty = Number(item.qty) || 0;
        if (!map.has(cName)) {
          map.set(cName, { color: cName, qty: 0 });
        }
        map.get(cName).qty += qty;
      }
      const list = Array.from(map.values());
      if (list.length > 0) return list;
    }
    // 2. Explicit multiple colors in order.colors
    if (Array.isArray(order.colors) && order.colors.length > 1) {
      const perColorQty = Math.round((Number(order.qty) || 0) / order.colors.length);
      return order.colors.map(c => ({ color: c, qty: perColorQty }));
    }
    // 3. If an order does NOT have colors added, return [] so old orders do not bind colors and remain completely unaffected!
    return [];
  }, [order.colorBreakdown, order.colors, order.qty]);

  const handleUpdateStageColourways = (stageIdx, updatedColourways) => {
    const currentStage = order.stages[stageIdx];
    if (!currentStage) return;

    const allDone = updatedColourways.length > 0 && updatedColourways.every(c => c.status === "done");
    const anyInProgress = updatedColourways.some(c => c.status === "in_progress" || c.status === "done");

    let nextStatus = allDone ? "done" : anyInProgress ? "in_progress" : "pending";

    let assignee = currentStage.assignee;
    if (nextStatus !== "pending" && (!assignee || assignee === "Unassigned")) {
      const found = firstNamedAssignee(currentStage.dept);
      assignee = found !== "Unassigned" ? found : "Assigned";
    }

    const flagged = updatedColourways
      .filter(c => c.reason && c.reason !== "No delay flagged")
      .map(c => {
        const rText = c.reason === "Others" && c.customReason ? c.customReason : c.reason;
        return `${c.color}: ${rText}`;
      });
    const nextReason = flagged.length > 0 ? flagged.join(" · ") : null;

    const stages = order.stages.map((s, i) => {
      if (i !== stageIdx) return s;
      return {
        ...s,
        colourways: updatedColourways,
        status: nextStatus,
        assignee: assignee || s.assignee,
        reason: nextReason,
        completedBy: allDone ? (s.completedBy || role?.label || "User") : (nextStatus === "done" ? s.completedBy : null),
        completedAt: allDone ? (s.completedAt || new Date().toISOString()) : (nextStatus === "done" ? s.completedAt : null)
      };
    });

    onUpdateStages(order.id, stages);
  };

  const cycle = (idx) => {
    if (gatingApproval(order.stages, idx)) return;
    const current = order.stages[idx];
    if (current && current.status === "done") {
      // Completed stages stay completed — do not cycle back to pending!
      return;
    }
    const stages = order.stages.map((s, i) => {
      if (i !== idx) return s;
      const next = s.status === "pending" ? "in_progress" : "done";
      let assignee = s.assignee;
      if (next !== "pending" && (!assignee || assignee === "Unassigned")) {
        const found = firstNamedAssignee(s.dept);
        assignee = found !== "Unassigned" ? found : "Assigned";
      }
      const nowIso = new Date().toISOString();
      const currentUserName = role?.label || "User";
      return {
        ...s,
        status: next,
        assignee: assignee || s.assignee,
        reason: next === "done" ? null : s.reason,
        completedAt: next === "done" ? (s.completedAt || nowIso) : s.completedAt,
        completedBy: next === "done" ? (s.completedBy || currentUserName) : s.completedBy
      };
    });
    onUpdateStages(order.id, stages);
  };

  const setReason = (idx, reason) => {
    const stages = order.stages.map((s, i) => i === idx ? { ...s, reason } : s);
    onUpdateStages(order.id, stages);
  };

  const setSupplier = (idx, supplier) => {
    const stages = order.stages.map((s, i) => i === idx ? { ...s, supplier } : s);
    if (onAssignSupplier) {
      onAssignSupplier(order.id, idx, supplier);
    }
    onUpdateStages(order.id, stages);
  };

  const doneCount = (order.stages || []).filter(s => s.status === "done").length;
  const flaggedReasons = (order.stages || []).filter(s => s.reason).map(s => `${s.name}: ${s.reason}`);

  const trackerCard = (
    <div style={{ background: "#fff", border: "1px solid #ECEDF1", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={14} color="#534AB7" />
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1B2130" }}>T&A stage tracker</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#8A8D98" }}>Template:</span>
          <select
            value={order.template || "90"}
            onChange={e => onSetTemplate(order.id, e.target.value)}
            style={{ fontSize: 12, padding: "5px 8px", borderRadius: 7, border: "1px solid #E7E8ED" }}
          >
            <option value="90">90-day (standard)</option>
            <option value="120">120-day (dye / print, longer lead time)</option>
          </select>
          <button
            type="button"
            onClick={() => setShowAlignModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 12px",
              borderRadius: 7,
              border: "1px solid #D6D2F3",
              background: "#F0EFFB",
              color: "#534AB7",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
            title="Reorder and align T&A stages 1 to end based on actual process"
          >
            Align & Reorder Stages
          </button>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#B0B2BA", margin: "6px 0 16px" }}>
        {(order.stages || []).length} steps from the {order.template || "90"}-day T&A template — pick 120-day for styles with a longer delivery window.{orderColourways.length > 0 ? " Click any stage circle or colour badge (e.g. \"0/2 colours\") to manage color-wise pieces & delays." : " Click any stage circle to advance progress."} Stages after an approval step stay locked until approved.
      </div>
      <div style={{ display: "flex", gap: 2, overflowX: "auto", paddingBottom: 8 }}>
        {(order.stages || []).map((s, i) => {
          const gate = gatingApproval(order.stages, i);
          
          // Strict Multi-Department Ownership:
          // Admin, Executive, fullAccess can edit any stage.
          // Department users can edit/complete stages belonging to ANY of their assigned departments!
          const userDeptList = Array.isArray(role?.departments) && role.departments.length > 0
            ? role.departments.map(d => d.toLowerCase())
            : [(role?.dept || "").toLowerCase()];
          
          const canEditThisStage = Boolean(
            role?.fullAccess ||
            role?.dept === "Executive" ||
            role?.dept === "Administrators" ||
            (s.dept && userDeptList.includes(s.dept.toLowerCase()))
          );

          return (
            <StageNode
              key={i}
              stage={s}
              idx={i}
              onCycle={cycle}
              onReason={setReason}
              onSupplierChange={setSupplier}
              onOpenDispute={(st, index) => setDisputeModalData({ isOpen: true, stage: st, stageIdx: index })}
              lockedBy={gate ? gate.name : null}
              suppliers={suppliers}
              canEdit={canEditThisStage}
              roleDept={role?.dept || "User"}
              orderColourways={orderColourways}
              onOpenColourways={(index) => setColourwayModalStageIdx(index)}
              orderStartDate={order.orderDate || order.createdAt || order.ship}
            />
          );
        })}
      </div>
      {flaggedReasons.length > 0 && (
        <div style={{ background: "#FCEBEB", border: "1px solid #F5CFCF", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 8, alignItems: "flex-start", marginTop: 16 }}>
          <AlertTriangle size={16} color="#A32D2D" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#791F1F" }}>{flaggedReasons.join(" · ")}</div>
        </div>
      )}
    </div>
  );

  const costingContent = (
    <CostingTab
      order={order}
      role={role}
      onSetTemplate={onSetCostingTemplate}
      onUpdateRow={onUpdateCostingRow}
      onAddRow={onAddCostingRow}
      onSubmitCosting={onSubmitCosting}
      onApproveCosting={onApproveCosting}
      onRejectCosting={onRejectCosting}
    />
  );

  const preProdContent = (
    <PreProductionTab
      order={order}
      role={role}
      onFieldChange={(docKey, fieldKey, value) => onPreProdField(order.id, docKey, fieldKey, value)}
      onSubmit={(docKey) => onPreProdSubmit(order.id, docKey)}
      onApprove={(docKey) => onPreProdApprove(order.id, docKey, role.label.split(" (")[0])}
    />
  );

  const complianceContent = (
    <OrderComplianceSection order={order} certifications={certifications} compliances={compliances} />
  );

  const quotationContent = (
    <OutsourcingQuotationPanel
      order={order}
      role={role}
      suppliers={suppliers}
      onUpdateQuotation={onUpdateQuotation}
      onSubmitQuotation={onSubmitQuotation}
      onApproveQuotation={onApproveQuotation}
      onRejectQuotation={onRejectQuotation}
    />
  );

  return (
    <div>
      <BackLink onClick={onBack} label="Back" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#8A8D98", marginBottom: 4 }}>PO #{order.id}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#1B2130" }}>{order.style}</h1>
          <div style={{ fontSize: 13.5, color: "#565A66", marginTop: 4, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span>{order.buyer} · {order.country} · {(Number(order.qty) || 0).toLocaleString()} pcs · Ship {order.ship}</span>
            {Array.isArray(order.colorBreakdown) && order.colorBreakdown.length > 0 ? (
              <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, marginLeft: 6 }}>
                {order.colorBreakdown.map((b, bi) => (
                  <span
                    key={bi}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: "#EDE9FE",
                      color: "#534AB7",
                      padding: "2px 8px",
                      borderRadius: 6,
                      border: "1px solid #D6D2F3"
                    }}
                  >
                    {b.color} {b.size && `(${b.size})`}: {b.qty} pcs
                  </span>
                ))}
              </div>
            ) : order.color ? (
              <span style={{ fontSize: 11, background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                {order.color}
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowAssignModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#534AB7",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <Layers size={14} />
            Assign to Supplier
          </button>
          {statusPill(order.status)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#F7F7F9", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Stage progress</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{doneCount}/{(order.stages || []).length} done</div>
        </div>
        <div style={{ background: "#F7F7F9", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Risk level</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, textTransform: "capitalize", display: "flex", alignItems: "center" }}>{riskDot(order.risk)}{order.risk}</div>
        </div>
        <div style={{ background: "#F7F7F9", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Open delay flags</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{flaggedReasons.length}</div>
        </div>
      </div>

      <OrderHighlightsCard order={order} role={role} />

      {trackerCard}

      <DocumentsPanel
        order={order}
        role={role}
        costingContent={costingContent}
        preProdContent={preProdContent}
        quotationContent={quotationContent}
        complianceContent={complianceContent}
        onUpdateShippedQty={onUpdateShippedQty}
        onAddProductionLog={onAddProductionLog}
        onDeleteProductionLog={onDeleteProductionLog}
        onUpdateInspectionData={onUpdateInspectionData}
        onUpdateCertificates={onUpdateCertificates}
        people={people}
        onPushNotification={onPushNotification}
        onPreProdField={onPreProdField}
      />

      {showAssignModal && (
        <AssignWorkModal
          orders={allOrders.length > 0 ? allOrders : [order]}
          suppliers={suppliers}
          prefillOrderId={order.id}
          onClose={() => setShowAssignModal(false)}
          onAssign={onAssignWork}
        />
      )}

      {showAlignModal && (
        <OrderStageAlignmentModal
          order={order}
          isOpen={showAlignModal}
          onClose={() => setShowAlignModal(false)}
          onSaveStages={(orderId, updatedStages, tmpl) => {
            if (onSetTemplate && tmpl !== order.template) {
              onSetTemplate(orderId, tmpl);
            }
            if (onUpdateStages) {
              onUpdateStages(orderId, updatedStages);
            }
            setShowAlignModal(false);
          }}
        />
      )}

      {disputeModalData?.isOpen && (
        <DisputeStageModal
          isOpen={true}
          stage={disputeModalData.stage}
          stageIdx={disputeModalData.stageIdx}
          order={order}
          people={people}
          currentUserName={role?.label || "User"}
          onClose={() => setDisputeModalData(null)}
          onSubmitDispute={(complaint) => {
            if (onReportComplaint) {
              onReportComplaint(complaint);
            }
          }}
        />
      )}

      {colourwayModalStageIdx !== null && order.stages && order.stages[colourwayModalStageIdx] && (
        <StageColourwayModal
          isOpen={true}
          onClose={() => setColourwayModalStageIdx(null)}
          stage={order.stages[colourwayModalStageIdx]}
          stageIdx={colourwayModalStageIdx}
          order={order}
          orderColourways={orderColourways}
          onUpdateStageColourways={handleUpdateStageColourways}
          onOpenDispute={(st, index) => setDisputeModalData({ isOpen: true, stage: st, stageIdx: index })}
          canEdit={
            Boolean(
              role?.fullAccess ||
              role?.dept === "Executive" ||
              role?.dept === "Administrators" ||
              (order.stages[colourwayModalStageIdx]?.dept &&
                (Array.isArray(role?.departments) && role.departments.length > 0
                  ? role.departments.map(d => d.toLowerCase())
                  : [(role?.dept || "").toLowerCase()]
                ).includes(order.stages[colourwayModalStageIdx].dept.toLowerCase())
              )
            ) && !gatingApproval(order.stages, colourwayModalStageIdx)
          }
        />
      )}
    </div>
  );
}
