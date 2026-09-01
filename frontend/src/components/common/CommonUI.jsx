import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";
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

export function Card({ children, style, className = "" }) {
  return (
    <div className={`loom-card ${className}`} style={{ background: "#fff", border: "1px solid #ECEDF1", borderRadius: 12, padding: "18px 20px", ...style }}>
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
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? <span key={i} style={{ color: "#378ADD", fontWeight: 600 }}>{part}</span> : part
  );
}

export function collectTasks(orders, deptFilter) {
  const rows = [];
  orders.forEach(o => {
    if (!o.stages) return;
    o.stages.forEach((s, idx) => {
      if (!deptFilter || s.dept === deptFilter) {
        rows.push({ order: o, stage: s, stageIdx: idx, dept: s.dept });
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
      {rows.map(({ order, stage, stageIdx }) => (
        <div
          key={order.id + stageIdx}
          onClick={() => onOpenOrder(order.id)}
          style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.9fr 1fr", alignItems: "center", fontSize: 12.5, padding: "10px 4px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{order.id}</div>
            <div style={{ fontWeight: 600, color: "#1B2130" }}>{order.style}</div>
          </div>
          <div>{stage.name}</div>
          <div>{stage.planned}</div>
          <div>{statusPill(stage.status)}</div>
          <div style={{ color: stage.reason ? "#A32D2D" : "#B0B2BA" }}>{stage.reason || "—"}</div>
        </div>
      ))}
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
  rows.forEach(r => {
    if (r.stage.reason) buckets[`Delayed — ${r.stage.reason}`].push(r);
    else if (r.stage.status === "in_progress") buckets["Awaiting action"].push(r);
    else if (r.stage.status === "pending") buckets["Not started yet"].push(r);
    else buckets["Completed"].push(r);
  });
  return Object.entries(buckets).filter(([, v]) => v.length > 0);
}

function groupColor(label) {
  if (label.startsWith("Delayed")) return "#D64545";
  if (label === "Awaiting action") return "#E2A83B";
  if (label === "Not started yet") return "#8A8D98";
  return "#1F9E8D";
}

export function GroupedTaskList({ rows, onOpenOrder, emptyText }) {
  const groups = useMemo(() => groupRows(rows), [rows]);
  const [openMap, setOpenMap] = useState({});
  if (rows.length === 0) {
    return <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>{emptyText}</div>;
  }
  const isOpen = (label) => (openMap[label] !== undefined ? openMap[label] : label !== "Completed");
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
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.9fr", fontSize: 10.5, color: "#B0B2BA", padding: "8px 10px 4px" }}>
                <div>Order / Style</div><div>Task / stage</div><div>Due</div><div>Status</div>
              </div>
              {groupItems.map(({ order, stage, stageIdx }) => (
                <div
                  key={order.id + stageIdx}
                  onClick={() => onOpenOrder(order.id)}
                  style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.9fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "9px 10px", borderBottom: "1px solid #F5F5F7", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{order.id}</div>
                    <div style={{ fontWeight: 600, color: "#1B2130" }}>{order.style}</div>
                  </div>
                  <div>{stage.name} <span style={{ color: "#B0B2BA", fontSize: 10.5 }}>· {stage.dept}</span></div>
                  <div>{stage.planned}</div>
                  <div>{statusPill(stage.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function MiniDonut({ data, size = 96, centerLabel, centerSub }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={size * 0.32} outerRadius={size * 0.48} paddingAngle={2} stroke="none">
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: size > 90 ? 18 : 14, fontWeight: 700, color: "#fff" }}>{centerLabel}</div>
          {centerSub && <div style={{ fontSize: 9, color: "#9498A8" }}>{centerSub}</div>}
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
  if (!stages) return null;
  for (let j = idx - 1; j >= 0; j--) {
    if (stages[j].name.toLowerCase().includes("approval")) {
      return stages[j].status !== "done" ? stages[j] : null;
    }
  }
  return null;
}
