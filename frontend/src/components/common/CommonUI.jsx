import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { REASONS } from "../../constants/loomData.js";

export function riskDot(risk) {
  const c = risk === "high" ? "#D64545" : risk === "medium" ? "#E2A83B" : "#1F9E8D";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: c, marginRight: 8 }} />;
}

export function statusPill(status) {
  const map = {
    "On Track": { bg: "#E1F5EE", fg: "#085041" },
    "At Risk": { bg: "#FAEEDA", fg: "#633806" },
    "Delayed": { bg: "#FCEBEB", fg: "#791F1F" },
    "done": { bg: "#E1F5EE", fg: "#085041" },
    "in_progress": { bg: "#FAEEDA", fg: "#633806" },
    "pending": { bg: "#F0F0F2", fg: "#565A66" },
  };
  const labelMap = { done: "Done", in_progress: "In progress", pending: "Pending" };
  const s = map[status] || map["On Track"];
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {labelMap[status] || status}
    </span>
  );
}

export function Card({ children, style, className = "", ...props }) {
  return (
    <div className={`loom-card ${className}`} style={{ background: "#fff", border: "1px solid #ECEDF1", borderRadius: 12, padding: "18px 20px", ...style }} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, sub, action, onAction }) {
  return (
    <div className="loom-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>{sub}</div>}
      </div>
      {action && (
        <div onClick={onAction} style={{ fontSize: 12, color: "#378ADD", display: "flex", alignItems: "center", gap: 2, cursor: "pointer", whiteSpace: "nowrap" }}>
          {action} <ChevronRight size={12} />
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, sub }) {
  return (
    <div className="loom-page-header" style={{ marginBottom: 22 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1B2130" }}>{title}</h1>
      {sub && <div style={{ fontSize: 13.5, color: "#8A8D98", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function BackLink({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="loom-back-link"
      style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#565A66", fontSize: 13, cursor: "pointer", marginBottom: 20, padding: 0 }}
    >
      <ChevronLeft size={16} /> {label}
    </button>
  );
}

export function renderWithMentions(text) {
  if (!text) return "";
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span
        key={i}
        style={{
          color: "#2563EB",
          background: "#EFF6FF",
          padding: "1px 5px",
          borderRadius: 4,
          fontWeight: 600,
          border: "1px solid #BFDBFE",
          display: "inline-block",
          margin: "0 1px"
        }}
      >
        {part}
      </span>
    ) : part
  );
}

export function isStageCompleted(stage) {
  const status = String(stage?.status || "").toLowerCase().trim();
  return status === "done" || status === "completed" || Boolean(stage?.completedAt);
}

export function isTaskCompleted(task) {
  const status = String(task?.status || "").toLowerCase().trim();
  return status === "done" || status === "completed" || Boolean(task?.completedAt);
}


export function resolveStageScheduleDates(order, stage) {
  const plannedStr = String(stage?.planned || stage?.days || "").trim();
  const hasMonth = /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(plannedStr);
  if (hasMonth && !/^day/i.test(plannedStr)) {
    return plannedStr;
  }

  let baseDate = new Date();
  if (order?.orderDate) {
    const d = new Date(order.orderDate);
    if (!isNaN(d.getTime())) baseDate = d;
  } else if (order?.createdAt) {
    const d = new Date(order.createdAt);
    if (!isNaN(d.getTime())) baseDate = d;
  } else if (order?.shipDate || order?.ship) {
    const d = new Date(order.shipDate || order.ship);
    if (!isNaN(d.getTime())) {
      baseDate = new Date(d);
      baseDate.setDate(baseDate.getDate() - 90);
    }
  }

  let startOffset = 0;
  let endOffset = 0;
  if (typeof stage?.startDay === "number" && typeof stage?.endDay === "number") {
    startOffset = stage.startDay;
    endOffset = stage.endDay;
  } else {
    const match = plannedStr.match(/(?:day\s*)?(\d+)(?:\s*-\s*(\d+))?/i);
    if (match) {
      startOffset = parseInt(match[1], 10);
      endOffset = match[2] ? parseInt(match[2], 10) : startOffset;
    }
  }

  const addDays = (d, days) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  const startD = addDays(baseDate, startOffset);
  const endD = addDays(baseDate, endOffset);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const startDay = startD.getDate();
  const endDay = endD.getDate();
  const startMonth = months[startD.getMonth()];
  const endMonth = months[endD.getMonth()];
  const year = endD.getFullYear();

  if (startMonth === endMonth && startDay !== endDay) {
    return `${startDay} - ${endDay} ${endMonth} ${year}`;
  } else if (startMonth !== endMonth) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }
  return `${endDay} ${endMonth} ${year}`;
}

export function resolveTaskPriority(order, stage, isLocked, isDone) {
  if (isDone) return "low";
  if (stage?.priority && ["high", "critical", "medium", "low"].includes(String(stage.priority).toLowerCase())) {
    return String(stage.priority).toLowerCase() === "critical" ? "high" : String(stage.priority).toLowerCase();
  }
  const isDelayed = Boolean(stage?.reason && stage?.reason !== "No delay flagged") || stage?.status === "delayed";
  const isHighRisk = String(order?.risk || "").toLowerCase() === "high";
  if (isDelayed || isHighRisk) {
    return "high";
  }
  if (stage?.status === "in_progress" || !isLocked) {
    return "medium";
  }
  return "low";
}

export function collectTasks(orders, deptFilter) {
  const rows = [];
  (orders || []).forEach(o => {
    if (!o || o.isDeleted === true || o.isDeleted === "true" || !!o.deletedAt) return;
    const orderId = o.id || o.orderId || o.primaryId;
    if (!orderId || typeof o.style !== "string" || !o.style.trim()) return;
    if (!Array.isArray(o.stages)) return;
    o.stages.forEach((s, idx) => {
      // Guard: skip null/undefined stage entries (can occur with corrupted backend data)
      if (!s || typeof s !== "object") return;
      if (!deptFilter || s.dept === deptFilter) {
        const gate = gatingApproval(o.stages, idx);
        const isLocked = Boolean(gate);
        const isDone = isStageCompleted(s);
        const priority = resolveTaskPriority(o, s, isLocked, isDone);
        const displayDue = resolveStageScheduleDates(o, s);
        rows.push({
          order: o,
          stage: s,
          stageIdx: idx,
          dept: s.dept,
          isLocked,
          lockedGate: gate,
          priority,
          displayDue
        });
      }
    });
  });
  return rows;
}

export function TaskTable({ rows, onOpenOrder, emptyText }) {
  if (rows.length === 0) {
    return <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>{emptyText}</div>;
  }
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.9fr 1fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
        <div>Order / Style</div><div>Task / stage</div><div>Due</div><div>Status</div><div>Flag</div>
      </div>
      {rows.map(({ order, stage, stageIdx }, itemIdx) => {
        const orderKey = order?.primaryId || order?.id;
        return (
          <div
            key={`${orderKey || "ord"}-${stage?.name || ""}-${stageIdx ?? itemIdx}-${itemIdx}`}
            onClick={() => onOpenOrder && onOpenOrder(order.primaryId || order.id, order.primaryId)}
            style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.9fr 1fr", alignItems: "center", fontSize: 12.5, padding: "10px 4px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{order.id}</span>
                {order.color && (
                  <span style={{ fontSize: 9.5, background: "#EFF6FF", color: "#1D4ED8", padding: "1px 5px", borderRadius: 4, fontWeight: 600 }}>
                    {order.color}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 600, color: "#1B2130" }}>{order.style}</div>
            </div>
            <div>{stage.name}</div>
            <div>{stage.planned}</div>
            <div>{statusPill(stage.status)}</div>
            <div style={{ color: stage.reason ? "#A32D2D" : "#B0B2BA" }}>{stage.reason || "—"}</div>
          </div>
        );
      })}
    </div>
  );
}

export function OrgChain({ roles }) {
  return (
    <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 6 }}>
      {roles.map((r, i) => (
        <React.Fragment key={i}>
          <div style={{ minWidth: 152, maxWidth: 152, flexShrink: 0 }}>
            <div style={{ background: "#F7F7F9", border: "1px solid #ECEDF1", borderRadius: 8, padding: "9px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1B2130", textTransform: "uppercase", letterSpacing: 0.3 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "#565A66", marginTop: 2 }}>{r.name || "—"}</div>
            </div>
            {r.bullets && r.bullets.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 14, fontSize: 10, color: "#8A8D98", lineHeight: 1.55 }}>
                {r.bullets.map(b => <li key={b}>{b}</li>)}
              </ul>
            )}
          </div>
          {i < roles.length - 1 && (
            <div style={{ display: "flex", alignItems: "flex-start", paddingTop: 16, color: "#C9A455", flexShrink: 0 }}>
              <ChevronRight size={16} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function groupRows(rows) {
  const buckets = {};
  REASONS.forEach(r => { buckets[`Delayed — ${r}`] = []; });
  buckets["Awaiting action"] = [];
  buckets["Not started yet"] = [];
  buckets["Completed"] = [];
  (Array.isArray(rows) ? rows : []).forEach(r => {
    const stage = r?.stage || {};
    const sStatus = String(stage.status || "").toLowerCase().trim();
    const isDone = sStatus === "done" || sStatus === "completed" || !!stage.completedAt;
    const bucket = isDone
      ? "Completed"
      : stage.reason
        ? `Delayed — ${stage.reason}`
        : sStatus === "in_progress" || (!r.isLocked && sStatus !== "pending")
          ? "Awaiting action"
          : "Not started yet";
    (buckets[bucket] ??= []).push(r);
  });

  const priorityWeight = { high: 3, medium: 2, low: 1 };
  Object.keys(buckets).forEach(b => {
    buckets[b].sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
      if (pDiff !== 0) return pDiff;
      return (a.order?.id || "").localeCompare(b.order?.id || "");
    });
  });

  return Object.entries(buckets).filter(([, v]) => v.length > 0);
}

function groupColor(label) {
  if (label.startsWith("Delayed")) return "#D64545";
  if (label === "Awaiting action") return "#E2A83B";
  if (label === "Not started yet") return "#8A8D98";
  return "#1F9E8D";
}

export function GroupedTaskList({ rows, onOpenOrder, emptyText, completedDefaultOpen = false }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const groups = useMemo(() => groupRows(safeRows), [safeRows]);
  const [openMap, setOpenMap] = useState({});
  if (safeRows.length === 0) {
    return <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>{emptyText}</div>;
  }
  const isOpen = (label) => (openMap[label] !== undefined ? openMap[label] : label !== "Completed" || completedDefaultOpen);
  const toggle = (label) => setOpenMap(m => ({ ...m, [label]: !isOpen(label) }));

  return (
    <div>
      {groups.map(([label, groupItems]) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div
            onClick={() => toggle(label)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "9px 10px", background: "#FAFAFB", borderRadius: 8 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: groupColor(label), flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1B2130" }}>{label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11.5, color: "#8A8D98", background: "#EFEFF2", borderRadius: 999, padding: "1px 8px" }}>{groupItems.length}</span>
              <ChevronDown size={13} style={{ transform: isOpen(label) ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .15s" }} />
            </div>
          </div>
          {isOpen(label) && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.7fr 1.1fr 0.8fr", fontSize: 10.5, color: "#8A8D98", padding: "8px 10px 4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>
                <div>Order / Style</div><div>Task / stage</div><div>Priority</div><div>Due Date</div><div>Status</div>
              </div>
              {groupItems.map(({ order, stage, stageIdx, isLocked, lockedGate, priority, displayDue }, itemIdx) => {
                const orderKey = order?.primaryId || order?.id;
                return (
                  <div
                    key={`${orderKey || "ord"}-${stage?.name || ""}-${stageIdx ?? itemIdx}-${itemIdx}`}
                    onClick={() => onOpenOrder && onOpenOrder(order.primaryId || order.id, order.primaryId)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.1fr 1.3fr 0.7fr 1.1fr 0.8fr",
                      alignItems: "center",
                      fontSize: 12.5,
                      padding: "10px 10px",
                      borderBottom: "1px solid #F5F5F7",
                      cursor: "pointer",
                      background: isLocked ? "#FAFAFB" : "transparent"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isLocked ? "#F1F5F9" : "#FAFAFB"}
                    onMouseLeave={e => e.currentTarget.style.background = isLocked ? "#FAFAFB" : "transparent"}
                  >
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span>{order.id}</span>
                        {order.buyer && (
                          <span style={{ fontSize: 9.5, background: "#E6F7F4", color: "#0D7A68", padding: "1px 7px", borderRadius: 20, fontWeight: 700, letterSpacing: 0.2, border: "1px solid #A7E3D8", fontFamily: "inherit" }}>
                            {order.buyer}
                          </span>
                        )}
                        {order.color && (
                          <span style={{ fontSize: 9.5, background: "#EFF6FF", color: "#1D4ED8", padding: "1px 5px", borderRadius: 4, fontWeight: 600 }}>
                            {order.color}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, color: "#1B2130", marginTop: 2 }}>{order.style}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: "#1B2130" }}>
                        {stage.name} <span style={{ color: "#8A8D98", fontSize: 11 }}>· {stage.dept}</span>
                      </div>
                      {isLocked && lockedGate && (
                        <div style={{ marginTop: 3, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: "#B45309", background: "#FEF3C7", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                          <Lock size={10} /> Waiting for: {lockedGate.name}
                        </div>
                      )}
                    </div>
                    <div>
                      {priority === "high" ? (
                        <span style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626" }} /> High
                        </span>
                      ) : priority === "medium" ? (
                        <span style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706" }} /> Medium
                        </span>
                      ) : (
                        <span style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8" }} /> Low
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                      {displayDue || stage.planned || "—"}
                    </div>
                    <div>{statusPill(stage.status)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function MiniDonut({ data, size = 96, centerLabel, centerSub, labelColor }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={size * 0.32} outerRadius={size * 0.48} paddingAngle={2} stroke="none">
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
      </PieChart>
      {centerLabel && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: size > 90 ? 18 : 14, fontWeight: 700, color: labelColor || "#fff" }}>{centerLabel}</div>
          {centerSub && <div style={{ fontSize: 9, color: labelColor ? "#64748B" : "#9498A8" }}>{centerSub}</div>}
        </div>
      )}
    </div>
  );
}

export function DarkCard({ children, style }) {
  return <div style={{ background: "#171E33", border: "1px solid #262E48", borderRadius: 12, padding: "16px 18px", ...style }}>{children}</div>;
}

export function DarkCardHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 0.4 }}>{title}</div>
        {sub && <div style={{ fontSize: 10.5, color: "#8489A0", marginTop: 2 }}>{sub}</div>}
      </div>
      {action && <div style={{ fontSize: 11, color: "#7C8BFF", cursor: "pointer" }}>{action}</div>}
    </div>
  );
}

export function gatingApproval(stages, idx) {
  if (!Array.isArray(stages) || idx <= 0) return null;
  const currentStage = stages[idx];
  if (!currentStage) return null;

  // 1. Parallel stages (isParallel: true / default parallel) are ALWAYS OPEN from Day 1
  if (currentStage.isParallel === true || currentStage.alwaysEnabled === true || currentStage.parallel === true) {
    return null;
  }

  // 2. Sequential stages (isParallel: false) open ONLY when the previous stage completes
  if (currentStage.isParallel === false || currentStage.parallel === false || currentStage.sequential === true) {
    const prevStage = stages[idx - 1];
    if (prevStage && prevStage.status !== "done") {
      if (Array.isArray(prevStage.colourways) && prevStage.colourways.length > 0) {
        const anyDone = prevStage.colourways.some(c => c.status === "done" || (Number(c.completedQty) || 0) > 0);
        if (!anyDone) return prevStage;
      } else {
        return prevStage;
      }
    }
  }

  // 3. Check for previous gating approval steps
  for (let j = idx - 1; j >= 0; j--) {
    const s = stages[j];
    if (s && s.name && s.name.toLowerCase().includes("approval")) {
      if (Array.isArray(s.colourways) && s.colourways.length > 0) {
        const anyDone = s.colourways.some(c => c.status === "done" || (Number(c.completedQty) || 0) > 0);
        if (!anyDone && s.status !== "done") {
          return s;
        }
      } else if (s.status !== "done") {
        return s;
      }
    }
  }
  return null;
}
