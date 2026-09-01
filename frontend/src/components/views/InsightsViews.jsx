import React, { useState, useMemo, useEffect } from "react";
import {
  TriangleAlert, Globe, Gauge, CheckCircle2, ClipboardList, Landmark, Clock, Truck, TrendingUp,
  Bell, Package, Calendar, CheckSquare, ClipboardCheck, Award, ShieldCheck, CheckCircle, Search, Trash2, Check,
  Plus, Edit, X, ChevronLeft, ChevronRight, Building2, Phone, Mail, MapPin, ExternalLink, AlertCircle, Layers
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import {
  SHIPMENT_PERFORMANCE, ROLE_OPTIONS, SEASON_OPTIONS, CAPA_STATUS_STYLE,
  NOTIFICATION_PRIORITY_STYLE, formatTimeAgo, SUPPLIER_TYPES, WORK_PURPOSES,
  calculateSupplierMetrics, INITIAL_SUPPLIER_WORK, INITIAL_SUPPLIERS
} from "../../constants/loomData.js";
import {
  Card, CardHeader, PageHeader, DarkCard, DarkCardHeader, MiniDonut, BackLink, statusPill
} from "../common/CommonUI.jsx";

export function FinanceEntryPage({ orders, financials, onUpdate, onUpdateOrderCost }) {
  const totals = orders.reduce((a, o) => ({
    planned: a.planned + (o.plannedCost || 0),
    actual: a.actual + (o.actualCost || 0),
  }), { planned: 0, actual: 0 });
  const totalVariance = totals.actual - totals.planned;
  const totalVariancePct = totals.planned > 0 ? (totalVariance / totals.planned) * 100 : 0;

  useEffect(() => {
    if (financials.cogs !== totals.actual) onUpdate("cogs", totals.actual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.actual]);

  const grossProfit = financials.revenue - financials.cogs;
  const grossMargin = financials.revenue > 0 ? Math.round((grossProfit / financials.revenue) * 1000) / 10 : 0;

  return (
    <div>
      <PageHeader title="Finance data" sub="Cost planned vs. cost obtained per order — Total COGS on the Executive Dashboard now comes straight from the actual costs below" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total planned cost</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>${totals.planned.toLocaleString()}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total cost obtained (actual)</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>${totals.actual.toLocaleString()}</div></Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Total variance</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: totalVariance > 0 ? "#D64545" : "#1F9E8D" }}>
            {totalVariance > 0 ? "+" : ""}{totalVariance.toLocaleString()} <span style={{ fontSize: 13 }}>({totalVariancePct > 0 ? "+" : ""}{totalVariancePct.toFixed(1)}%)</span>
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Cost by order" sub="Planned cost is set when the order is costed; actual cost is updated as spend comes in through the season" />
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 0.9fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Order / Style</div><div>Buyer</div><div>Planned cost</div><div>Cost obtained</div><div>Variance</div>
        </div>
        {orders.map(o => {
          const variance = (o.actualCost || 0) - (o.plannedCost || 0);
          const variancePct = o.plannedCost > 0 ? (variance / o.plannedCost) * 100 : 0;
          return (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "8px 4px", borderBottom: "1px solid #F5F5F7" }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{o.id}</div>
                <div style={{ fontWeight: 600, color: "#1B2130" }}>{o.style}</div>
              </div>
              <div>{o.buyer}</div>
              <div>
                <input
                  type="number"
                  value={o.plannedCost || 0}
                  onChange={e => onUpdateOrderCost(o.id, "plannedCost", Number(e.target.value))}
                  style={{ width: 92, fontSize: 12, padding: "5px 7px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                />
              </div>
              <div>
                <input
                  type="number"
                  value={o.actualCost || 0}
                  onChange={e => onUpdateOrderCost(o.id, "actualCost", Number(e.target.value))}
                  style={{ width: 92, fontSize: 12, padding: "5px 7px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                />
              </div>
              <div style={{ fontWeight: 600, color: variance > 0 ? "#D64545" : variance < 0 ? "#1F9E8D" : "#8A8D98" }}>
                {variance > 0 ? "+" : ""}{variance.toLocaleString()}{o.plannedCost > 0 ? ` (${variancePct > 0 ? "+" : ""}${variancePct.toFixed(1)}%)` : ""}
              </div>
            </div>
          );
        })}
      </Card>

      <Card style={{ maxWidth: 460 }}>
        <CardHeader title="Computed" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}><span style={{ color: "#8A8D98" }}>Gross profit</span><span style={{ fontWeight: 700 }}>${grossProfit.toLocaleString()}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "#8A8D98" }}>Gross margin</span><span style={{ fontWeight: 700 }}>{grossMargin}%</span></div>
      </Card>
    </div>
  );
}

export function ReportsPage({ orders }) {
  const total = orders.length;
  const onTrack = orders.filter(o => o.status === "On Track").length;
  const totalQty = orders.reduce((a, o) => a + (Number(o.qty) || 0), 0);
  const rows = [
    ["Total orders", total],
    ["On-time rate", `${Math.round((onTrack / (total || 1)) * 100)}%`],
    ["Total order quantity", totalQty.toLocaleString() + " pcs"],
    ["Avg order lead time", "87 days"],
    ["Avg sampling time", "24 days"],
    ["Quality pass rate", "93.6%"],
  ];

  const seasonRows = useMemo(() => {
    const groups = {};
    orders.forEach(o => {
      const key = `${o.buyer}||${o.season || "—"}`;
      if (!groups[key]) groups[key] = { buyer: o.buyer, season: o.season || "—", ordered: 0, shipped: 0 };
      groups[key].ordered += (Number(o.qty) || 0);
      groups[key].shipped += (Number(o.shippedQty) || 0);
    });
    return Object.values(groups).map(g => ({
      ...g,
      diff: g.shipped - g.ordered,
      pctDiff: g.ordered > 0 ? ((g.shipped - g.ordered) / g.ordered) * 100 : 0,
    }));
  }, [orders]);

  return (
    <div>
      <PageHeader title="Reports" sub="Summary metrics — full report builder is next on the roadmap" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {rows.map(([label, val]) => (
          <Card key={label} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8A8D98" }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{val}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Shipped qty per season" sub="Ordered qty (from the PO) vs qty shipped (entered at Final OCR)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 1fr 1fr 0.9fr 0.9fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Buyer</div><div>Season</div><div>Ordered Qty</div><div>Shipped Qty</div><div>Difference</div><div>% Diff</div>
        </div>
        {seasonRows.map(r => (
          <div key={r.buyer + r.season} style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 1fr 1fr 0.9fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "9px 4px", borderBottom: "1px solid #F5F5F7" }}>
            <div style={{ fontWeight: 600, color: "#1B2130" }}>{r.buyer}</div>
            <div>{r.season}</div>
            <div>{r.ordered.toLocaleString()}</div>
            <div>{r.shipped.toLocaleString()}</div>
            <div style={{ color: r.diff < 0 ? "#D64545" : "#1F9E8D", fontWeight: 600 }}>{r.diff > 0 ? "+" : ""}{r.diff.toLocaleString()}</div>
            <div style={{ color: r.pctDiff < 0 ? "#D64545" : "#1F9E8D", fontWeight: 600 }}>{r.pctDiff > 0 ? "+" : ""}{r.pctDiff.toFixed(2)}%</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function InsightsPage({ orders }) {
  const allStages = orders.flatMap(o => o.stages || []);
  const counts = {};
  allStages.forEach(s => { if (s.reason) counts[s.reason] = (counts[s.reason] || 0) + 1; });
  const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = arr.reduce((a, [, c]) => a + c, 0) || 1;
  return (
    <div>
      <PageHeader title="All insights" sub="Root-cause breakdown across every flagged delay" />
      <Card>
        <CardHeader title="Delay reasons (all orders)" />
        {arr.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No delays flagged yet.</div>
        ) : arr.map(([reason, count]) => (
          <div key={reason} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: "#1B2130" }}>{reason}</span>
              <span style={{ color: "#8A8D98" }}>{count} ({Math.round(count / total * 100)}%)</span>
            </div>
            <div style={{ height: 6, background: "#F0F0F2", borderRadius: 999 }}>
              <div style={{ height: 6, width: `${count / total * 100}%`, background: "#D64545", borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function AssignWorkModal({
  orders = [],
  tasks = [],
  suppliers = [],
  prefillSupplierId = null,
  prefillOrderId = null,
  prefillStageIdx = null,
  prefillDept = null,
  prefillTaskName = null,
  onClose,
  onAssign
}) {
  const activeSuppliers = suppliers.filter(s => !s.isDeleted);
  const [supplierId, setSupplierId] = useState(prefillSupplierId || activeSuppliers[0]?.id || "");
  const [source, setSource] = useState("order"); // "order" | "my_task" | "dept_task"
  const [selectedOrderId, setSelectedOrderId] = useState(prefillOrderId || orders[0]?.id || "");
  const [selectedStageIdx, setSelectedStageIdx] = useState(prefillStageIdx !== null ? prefillStageIdx : 0);
  const [selectedDept, setSelectedDept] = useState(prefillDept || "VAP");
  const [selectedTaskName, setSelectedTaskName] = useState(prefillTaskName || "");
  const [purpose, setPurpose] = useState("Printing");
  const [description, setDescription] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatus] = useState("Pending");

  // Get currently selected order
  const currentOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || orders[0] || null;
  }, [orders, selectedOrderId]);

  // Available stages for selected order
  const availableStages = useMemo(() => {
    if (!currentOrder || !currentOrder.stages) return [];
    return currentOrder.stages;
  }, [currentOrder]);

  // Sync stage/department when order or stage selection changes
  useEffect(() => {
    if (availableStages.length > 0) {
      const stage = availableStages[selectedStageIdx] || availableStages[0];
      if (stage) {
        setSelectedDept(stage.dept || "VAP");
        setSelectedTaskName(stage.name || "Workflow Task");
        if (!expectedDate) {
          setExpectedDate(stage.planned || currentOrder?.ship || "20 May");
        }
      }
    }
  }, [availableStages, selectedStageIdx, currentOrder]);

  // Auto-generate suggested description
  useEffect(() => {
    if (currentOrder) {
      const task = selectedTaskName || (availableStages[selectedStageIdx]?.name) || "Production";
      setDescription(`${purpose} for ${currentOrder.id} (${currentOrder.style}) - ${task}`);
    }
  }, [purpose, selectedOrderId, selectedStageIdx, selectedTaskName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const sup = activeSuppliers.find(s => s.id === supplierId);
    if (!sup) {
      alert("Please select a supplier.");
      return;
    }
    if (!currentOrder) {
      alert("Please select an existing order.");
      return;
    }

    const newAssignment = {
      id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: currentOrder.id,
      style: currentOrder.style,
      buyer: currentOrder.buyer,
      qty: currentOrder.qty,
      supplierId: sup.id,
      supplierName: sup.name,
      source,
      dept: selectedDept,
      taskName: selectedTaskName || availableStages[selectedStageIdx]?.name || "Custom Job",
      stageIdx: selectedStageIdx,
      purpose,
      description: description.trim() || `${purpose} work for ${currentOrder.id}`,
      assignedDate: new Date().toISOString().split("T")[0],
      expectedDate: expectedDate || currentOrder.ship || "20 May",
      completedDate: null,
      status,
      qualityStatus: "Pending",
      qualityIssueDescription: "",
      createdAt: new Date().toISOString(),
      isDeleted: false
    };

    if (onAssign) {
      onAssign(newAssignment);
    }
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          width: "100%",
          maxWidth: 660,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0F0F2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#151B2E", margin: 0 }}>Assign Work to Supplier</h3>
            <p style={{ fontSize: 12.5, color: "#8A8D98", margin: "4px 0 0" }}>
              Link specific work from existing orders, tasks, or departments to a vendor
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A8D98", cursor: "pointer", padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

            {/* Supplier Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#374151", marginBottom: 5 }}>
                Select Supplier *
              </label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                required
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, fontWeight: 600, color: "#111827", background: "#F9FAFB" }}
              >
                {activeSuppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code} · {s.type})
                  </option>
                ))}
              </select>
            </div>



            {/* Order / Task Selectors based on source */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Select Existing Order *
                </label>
                <select
                  value={selectedOrderId}
                  onChange={e => {
                    setSelectedOrderId(e.target.value);
                    setSelectedStageIdx(0);
                  }}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                >
                  {orders.filter(o => !o.isDeleted).map(o => (
                    <option key={o.id} value={o.id}>
                      {o.id} · {o.style} ({o.buyer})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Task / Stage to Assign *
                </label>
                <select
                  value={selectedStageIdx}
                  onChange={e => {
                    const idx = Number(e.target.value);
                    setSelectedStageIdx(idx);
                    const s = availableStages[idx];
                    if (s) {
                      setSelectedDept(s.dept || "VAP");
                      setSelectedTaskName(s.name);
                    }
                  }}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                >
                  {availableStages.map((s, idx) => (
                    <option key={idx} value={idx}>
                      {s.name} ({s.dept})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-Populated Order / Task Summary Card */}
            {currentOrder && (
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 9, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  Linked Order & Task Information (Single Source of Truth)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>PO / Order ID</span>
                    <strong style={{ fontFamily: "monospace", color: "#378ADD" }}>{currentOrder.id}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Style</span>
                    <strong style={{ color: "#1B2130" }}>{currentOrder.style}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Buyer</span>
                    <span style={{ color: "#4B5563" }}>{currentOrder.buyer}</span>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Quantity</span>
                    <span style={{ color: "#4B5563", fontWeight: 600 }}>{Number(currentOrder.qty).toLocaleString()} pcs</span>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Department</span>
                    <span style={{ color: "#534AB7", fontWeight: 600 }}>{selectedDept}</span>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Current Stage / Task</span>
                    <span style={{ color: "#166534", fontWeight: 600 }}>{selectedTaskName || availableStages[selectedStageIdx]?.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Purpose of Supplier Work & Expected Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Purpose of Supplier Work *
                </label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                >
                  {WORK_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Expected Completion Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. 25 May"
                  value={expectedDate}
                  onChange={e => setExpectedDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                />
              </div>
            </div>

            {/* Work Description */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                Work Description & Instructions *
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Print front logo for PO GKT-1054 Hoodie"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
              />
            </div>

            {/* Initial Status */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                Initial Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
              >
                <option value="Pending">Pending (Waiting to start)</option>
                <option value="In Progress">In Progress (Work started)</option>
              </select>
            </div>

          </div>

          <div style={{ padding: "14px 24px", borderTop: "1px solid #F0F0F2", background: "#FAFAFB", display: "flex", justifyContent: "flex-end", gap: 10, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, fontWeight: 600, color: "#4B5563", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: "#534AB7", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Layers size={14} />
              Assign Work
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddSupplierModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: SUPPLIER_TYPES[0] || "Printing & Embroidery",
    contactPerson: "",
    mobile: "",
    email: "",
    address: "",
    city: "Tirupur",
    country: "India",
    onTimeTarget: 95,
    qualityTarget: 98,
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Supplier name is required.");
      return;
    }
    const newSup = {
      id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: form.name.trim(),
      code: form.code.trim() || `SUP-${Date.now().toString().slice(-4)}`,
      type: form.type,
      contactPerson: form.contactPerson.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      onTimeTarget: Number(form.onTimeTarget) || 95,
      qualityTarget: Number(form.qualityTarget) || 98,
      notes: form.notes.trim(),
      latestOrderDate: null,
      createdAt: new Date().toISOString(),
      isDeleted: false
    };

    if (onAdd) onAdd(newSup);
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0F0F2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#151B2E", margin: 0 }}>Add New Supplier</h3>
            <p style={{ fontSize: 12.5, color: "#8A8D98", margin: "4px 0 0" }}>Register a vendor for printing, dyeing, embroidery, fabric, or accessories</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A8D98", cursor: "pointer", padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
            
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1F9E8D", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Supplier Information
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dyeing & Printing"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Code / ID</label>
                <input
                  type="text"
                  placeholder="e.g. SUP-APX-05"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                >
                  {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Mobile / Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98420 12345"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. orders@apexdyeing.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Address</label>
              <input
                type="text"
                placeholder="e.g. 54, Industrial Estate, Angeripalayam Main Road"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>City</label>
                <input
                  type="text"
                  placeholder="e.g. Tirupur"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Country</label>
                <input
                  type="text"
                  placeholder="e.g. India"
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1F9E8D", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, borderTop: "1px solid #F0F0F2", paddingTop: 14 }}>
              Performance & Business Information
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>On-time Delivery Target %</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.onTimeTarget}
                  onChange={e => setForm({ ...form, onTimeTarget: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Quality Target %</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.qualityTarget}
                  onChange={e => setForm({ ...form, qualityTarget: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Notes / Capabilities</label>
              <textarea
                rows={2}
                placeholder="Specializations, machinery specs, certifications, capacity..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ padding: "14px 24px", borderTop: "1px solid #F0F0F2", background: "#FAFAFB", display: "flex", justifyContent: "flex-end", gap: 10, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, fontWeight: 600, color: "#4B5563", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#1F9E8D", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
            >
              Add Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditSupplierModal({ supplier, onClose, onSave }) {
  const [form, setForm] = useState({
    name: supplier?.name || "",
    code: supplier?.code || "",
    type: supplier?.type || SUPPLIER_TYPES[0] || "Printing & Embroidery",
    contactPerson: supplier?.contactPerson || "",
    mobile: supplier?.mobile || "",
    email: supplier?.email || "",
    address: supplier?.address || "",
    city: supplier?.city || "Tirupur",
    country: supplier?.country || "India",
    onTimeTarget: supplier?.onTimeTarget || 95,
    qualityTarget: supplier?.qualityTarget || 98,
    notes: supplier?.notes || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Supplier name is required.");
      return;
    }
    const updated = {
      ...supplier,
      name: form.name.trim(),
      code: form.code.trim() || supplier.code,
      type: form.type,
      contactPerson: form.contactPerson.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      onTimeTarget: Number(form.onTimeTarget) || 95,
      qualityTarget: Number(form.qualityTarget) || 98,
      notes: form.notes.trim()
    };

    if (onSave) onSave(updated);
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0F0F2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#151B2E", margin: 0 }}>Edit Supplier: {supplier?.name}</h3>
            <p style={{ fontSize: 12.5, color: "#8A8D98", margin: "4px 0 0" }}>Update supplier contact, location, and performance targets</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A8D98", cursor: "pointer", padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Code / ID</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                >
                  {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Contact Person</label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Mobile / Phone</label>
                <input
                  type="text"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>On-time Delivery Target %</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.onTimeTarget}
                  onChange={e => setForm({ ...form, onTimeTarget: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Quality Target %</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.qualityTarget}
                  onChange={e => setForm({ ...form, qualityTarget: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ padding: "14px 24px", borderTop: "1px solid #F0F0F2", background: "#FAFAFB", display: "flex", justifyContent: "flex-end", gap: 10, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, fontWeight: 600, color: "#4B5563", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#1F9E8D", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function supplierStatusPill(status) {
  const styles = {
    Excellent: { bg: "#E1F5EE", fg: "#085041" },
    Good: { bg: "#EFF6FF", fg: "#1D4ED8" },
    "Needs Attention": { bg: "#FEF3C7", fg: "#92400E" },
    Poor: { bg: "#FEE2E2", fg: "#991B1B" },
    New: { bg: "#F3F4F6", fg: "#4B5563" }
  };
  const s = styles[status] || styles.Good;
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
      {status}
    </span>
  );
}

export function SupplierDetailView({
  supplier,
  orders = [],
  supplierWork = [],
  onBack,
  onOpenOrder,
  onUpdateSupplier,
  onDeleteSupplier,
  onAssignWork,
  onUpdateWorkStatus,
  onUpdateWorkQuality
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const metrics = useMemo(() => calculateSupplierMetrics(supplier, orders, supplierWork), [supplier, orders, supplierWork]);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete supplier "${supplier.name}"? Historical order data will remain preserved.`)) {
      if (onDeleteSupplier) onDeleteSupplier(supplier.id);
      if (onBack) onBack();
    }
  };

  const handleStatusChange = (item, newStatus) => {
    if (onUpdateWorkStatus) {
      const isDone = newStatus === "Completed";
      const completedDate = isDone ? new Date().toISOString().split("T")[0] : null;
      onUpdateWorkStatus(item.id, newStatus, completedDate);
    }
  };

  const handleQualityChange = (item, newQualityStatus) => {
    let issueDesc = item.qualityIssueDescription || "";
    if (newQualityStatus === "Issue") {
      const entered = window.prompt("Enter quality issue description (e.g. Color mismatch, Embroidery thread tension):", issueDesc || "Quality rework required");
      if (entered === null) return;
      issueDesc = entered;
    }
    if (onUpdateWorkQuality) {
      onUpdateWorkQuality(item.id, newQualityStatus, issueDesc);
    }
  };

  return (
    <div>
      <BackLink onClick={onBack} label="Back to Supplier performance" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1B2130" }}>{supplier.name}</h1>
            {supplierStatusPill(metrics.status)}
          </div>
          <div style={{ fontSize: 13, color: "#8A8D98", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "monospace", color: "#534AB7", fontWeight: 600 }}>{supplier.code}</span>
            <span>·</span>
            <span>{supplier.type}</span>
            <span>·</span>
            <span>{supplier.city}, {supplier.country}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
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
              padding: "8px 16px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <Layers size={14} />
            Assign Work
          </button>
          <button
            onClick={() => setShowEdit(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#FFFFFF",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <Edit size={14} />
            Edit Supplier
          </button>
          <button
            onClick={handleDelete}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#FEE2E2",
              color: "#991B1B",
              border: "1px solid #FCA5A5",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <Trash2 size={14} />
            Delete Supplier
          </button>
        </div>
      </div>

      {/* Overview Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr", gap: 16, marginBottom: 20 }}>
        {/* Supplier Information Card */}
        <Card>
          <CardHeader title="Supplier Information" sub="Contact and facility profile" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 11, color: "#8A8D98" }}>Contact Person</div>
              <div style={{ fontWeight: 600, color: "#1B2130", marginTop: 1 }}>{supplier.contactPerson || "—"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "#8A8D98" }}>Mobile Number</div>
                <div style={{ fontWeight: 600, color: "#1B2130", marginTop: 1 }}>{supplier.mobile || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#8A8D98" }}>Email Address</div>
                <div style={{ fontWeight: 600, color: "#378ADD", marginTop: 1, wordBreak: "break-all" }}>{supplier.email || "—"}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#8A8D98" }}>Full Address</div>
              <div style={{ color: "#4B5563", marginTop: 1 }}>{supplier.address || "—"}, {supplier.city}, {supplier.country}</div>
            </div>
            {supplier.notes && (
              <div>
                <div style={{ fontSize: 11, color: "#8A8D98" }}>Capabilities & Notes</div>
                <div style={{ fontSize: 12, color: "#565A66", marginTop: 2, background: "#F9FAFB", padding: "8px 10px", borderRadius: 6, border: "1px solid #E5E7EB" }}>
                  {supplier.notes}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Performance KPI Cards */}
        <Card>
          <CardHeader title="Performance Summary" sub="Calculated dynamically from actual assigned supplier jobs" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Total Jobs / Orders</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>{metrics.jobs}</div>
              <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>Assigned workflow jobs</div>
            </div>

            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#166534", fontWeight: 600 }}>On-time Rate</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#15803D", marginTop: 4 }}>
                {metrics.onTimeRate !== null ? `${metrics.onTimeRate}%` : "—"}
              </div>
              <div style={{ fontSize: 11, color: "#166534", marginTop: 2 }}>{metrics.onTime} on-time of {metrics.jobs}</div>
            </div>

            <div style={{ background: metrics.delayed > 0 ? "#FEF2F2" : "#F8FAFC", border: metrics.delayed > 0 ? "1px solid #FECACA" : "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: metrics.delayed > 0 ? "#991B1B" : "#64748B", fontWeight: 600 }}>Delayed Orders</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: metrics.delayed > 0 ? "#DC2626" : "#475569", marginTop: 4 }}>{metrics.delayed}</div>
              <div style={{ fontSize: 11, color: metrics.delayed > 0 ? "#991B1B" : "#8A8D98", marginTop: 2 }}>Delayed or past due</div>
            </div>

            <div style={{ background: metrics.qualityIssues > 0 ? "#FEF2F2" : "#F8FAFC", border: metrics.qualityIssues > 0 ? "1px solid #FECACA" : "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: metrics.qualityIssues > 0 ? "#991B1B" : "#64748B", fontWeight: 600 }}>Quality Issues</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: metrics.qualityIssues > 0 ? "#DC2626" : "#475569", marginTop: 4 }}>{metrics.qualityIssues}</div>
              <div style={{ fontSize: 11, color: metrics.qualityIssues > 0 ? "#991B1B" : "#8A8D98", marginTop: 2 }}>Quality rework flags</div>
            </div>

            <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#0369A1", fontWeight: 600 }}>Quality Performance</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0284C7", marginTop: 4 }}>
                {metrics.qualityPerformance !== null ? `${metrics.qualityPerformance}%` : "—"}
              </div>
              <div style={{ fontSize: 11, color: "#0369A1", marginTop: 2 }}>Target: {supplier.qualityTarget || 98}%</div>
            </div>

            <div style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#7E22CE", fontWeight: 600 }}>Delivery Target</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#9333EA", marginTop: 4 }}>{supplier.onTimeTarget || 95}%</div>
              <div style={{ fontSize: 11, color: "#7E22CE", marginTop: 2 }}>Agreed SLA target</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Supplier Work & Orders Table */}
      <Card>
        <div style={{ padding: "0 0 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Supplier Work & Assigned Orders</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#F0EFFB", color: "#534AB7", padding: "2px 8px", borderRadius: 999 }}>
              {metrics.matchingItems.length} jobs
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#8A8D98" }}>All assignments derived from existing orders and department tasks</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.8fr 1fr 1fr 0.9fr 1.3fr 0.8fr 0.8fr 0.9fr 1fr", fontSize: 11, color: "#8A8D98", padding: "0 6px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Order / PO</div>
          <div>Style Number</div>
          <div>Buyer</div>
          <div>Department</div>
          <div>Task / Stage</div>
          <div>Purpose</div>
          <div>Work Description</div>
          <div>Assigned Date</div>
          <div>Expected Date</div>
          <div>Status</div>
          <div>Quality Status</div>
        </div>

        {metrics.matchingItems.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
            No work currently assigned to this supplier. Click <strong>+ Assign Work</strong> above to allocate work from an existing order or task.
          </div>
        ) : (
          metrics.matchingItems.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr 0.8fr 1fr 1fr 0.9fr 1.3fr 0.8fr 0.8fr 0.9fr 1fr",
                alignItems: "center",
                fontSize: 12,
                padding: "12px 6px",
                borderBottom: "1px solid #F5F5F7"
              }}
            >
              <div>
                <span
                  onClick={() => onOpenOrder && onOpenOrder(item.orderId)}
                  style={{ fontFamily: "monospace", fontSize: 12, color: "#378ADD", fontWeight: 700, cursor: "pointer" }}
                >
                  {item.orderId}
                </span>
                <div style={{ fontSize: 10.5, color: "#8A8D98" }}>{Number(item.qty || 0).toLocaleString()} pcs</div>
              </div>

              <div style={{ fontWeight: 600, color: "#1B2130" }}>{item.style}</div>
              <div style={{ color: "#4B5563" }}>{item.buyer}</div>
              <div>
                <span style={{ fontSize: 11, background: "#F0EFFB", color: "#534AB7", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                  {item.dept}
                </span>
              </div>
              <div style={{ color: "#1B2130", fontWeight: 500 }}>{item.taskName}</div>
              <div>
                <span style={{ fontSize: 11, background: "#E0F2FE", color: "#0369A1", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                  {item.purpose}
                </span>
              </div>
              <div style={{ color: "#4B5563", fontSize: 11.5, paddingRight: 8 }} title={item.description}>
                {item.description}
              </div>
              <div style={{ color: "#8A8D98", fontSize: 11 }}>{item.assignedDate}</div>
              <div style={{ color: "#1B2130", fontSize: 11.5, fontWeight: 500 }}>{item.expectedDate}</div>

              <div>
                <select
                  value={item.status}
                  onChange={e => handleStatusChange(item, e.target.value)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 6px",
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    background:
                      item.status === "Completed" ? "#E1F5EE" :
                      item.status === "Delayed" ? "#FEE2E2" :
                      item.status === "In Progress" ? "#FEF3C7" : "#F3F4F6",
                    color:
                      item.status === "Completed" ? "#085041" :
                      item.status === "Delayed" ? "#991B1B" :
                      item.status === "In Progress" ? "#92400E" : "#4B5563",
                    cursor: "pointer"
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              <div>
                <select
                  value={item.qualityStatus}
                  onChange={e => handleQualityChange(item, e.target.value)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 6px",
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    background:
                      item.qualityStatus === "Passed" ? "#E1F5EE" :
                      item.qualityStatus === "Issue" ? "#FEE2E2" : "#F3F4F6",
                    color:
                      item.qualityStatus === "Passed" ? "#085041" :
                      item.qualityStatus === "Issue" ? "#991B1B" : "#4B5563",
                    cursor: "pointer"
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Passed">Passed</option>
                  <option value="Issue">Issue</option>
                </select>
                {item.qualityIssueDescription && (
                  <div style={{ fontSize: 10, color: "#DC2626", marginTop: 2, lineHeight: 1.2 }}>
                    {item.qualityIssueDescription}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Edit Supplier Modal */}
      {showEdit && (
        <EditSupplierModal
          supplier={supplier}
          onClose={() => setShowEdit(false)}
          onSave={onUpdateSupplier}
        />
      )}

      {/* Assign Work Modal */}
      {showAssignModal && (
        <AssignWorkModal
          orders={orders}
          suppliers={[supplier]}
          prefillSupplierId={supplier.id}
          onClose={() => setShowAssignModal(false)}
          onAssign={onAssignWork}
        />
      )}
    </div>
  );
}

export function SupplierPerformancePage({
  orders = [],
  suppliers = INITIAL_SUPPLIERS,
  supplierWork = INITIAL_SUPPLIER_WORK,
  tasks = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAssignWork,
  onUpdateWorkStatus,
  onUpdateWorkQuality,
  onOpenOrder
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  const activeSuppliers = useMemo(() => {
    return suppliers.filter(s => !s.isDeleted);
  }, [suppliers]);

  // Priority sorting: most recent assigned order timestamp DESC
  const sortedSuppliers = useMemo(() => {
    return [...activeSuppliers].sort((a, b) => {
      const metricsA = calculateSupplierMetrics(a, orders, supplierWork);
      const metricsB = calculateSupplierMetrics(b, orders, supplierWork);

      let timeA = 0;
      if (a.latestOrderDate) timeA = new Date(a.latestOrderDate).getTime();
      if (metricsA.matchingItems.length > 0) {
        const itemA = metricsA.matchingItems[0];
        const t = itemA.assignedAt ? new Date(itemA.assignedAt).getTime() : 0;
        if (t > timeA) timeA = t;
      }

      let timeB = 0;
      if (b.latestOrderDate) timeB = new Date(b.latestOrderDate).getTime();
      if (metricsB.matchingItems.length > 0) {
        const itemB = metricsB.matchingItems[0];
        const t = itemB.assignedAt ? new Date(itemB.assignedAt).getTime() : 0;
        if (t > timeB) timeB = t;
      }

      // Suppliers with recent orders appear above suppliers with older or no orders
      if (timeA !== timeB) {
        return timeB - timeA;
      }

      // If neither has orders, sort by createdAt DESC
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdB - createdA;
    });
  }, [activeSuppliers, orders, supplierWork]);

  // Overall aggregate stats
  const overallStats = useMemo(() => {
    let totalJobs = 0;
    let totalOnTime = 0;
    let totalDelayed = 0;
    let totalQualityIssues = 0;

    activeSuppliers.forEach(sup => {
      const m = calculateSupplierMetrics(sup, orders, supplierWork);
      totalJobs += m.jobs;
      totalOnTime += m.onTime;
      totalDelayed += m.delayed;
      totalQualityIssues += m.qualityIssues;
    });

    const avgOnTime = totalJobs > 0 ? Math.round((totalOnTime / totalJobs) * 100) : 100;
    const qualityCompliance = totalJobs > 0 ? Math.round(((totalJobs - totalQualityIssues) / totalJobs) * 100) : 100;

    return {
      activeCount: activeSuppliers.length,
      totalJobs,
      totalOnTime,
      totalDelayed,
      avgOnTime,
      qualityCompliance
    };
  }, [activeSuppliers, orders, supplierWork]);

  const selectedSupplier = useMemo(() => {
    return activeSuppliers.find(s => s.id === selectedSupplierId);
  }, [activeSuppliers, selectedSupplierId]);

  if (selectedSupplier) {
    return (
      <SupplierDetailView
        supplier={selectedSupplier}
        orders={orders}
        supplierWork={supplierWork}
        onBack={() => setSelectedSupplierId(null)}
        onOpenOrder={onOpenOrder}
        onUpdateSupplier={onUpdateSupplier}
        onDeleteSupplier={onDeleteSupplier}
        onAssignWork={onAssignWork}
        onUpdateWorkStatus={onUpdateWorkStatus}
        onUpdateWorkQuality={onUpdateWorkQuality}
      />
    );
  }

  const scoreColor = (pct) => {
    if (pct === null) return "#8A8D98";
    if (pct >= 95) return "#1F9E8D";
    if (pct >= 85) return "#2563EB";
    if (pct >= 70) return "#D97706";
    return "#DC2626";
  };

  return (
    <div>
      {/* Header with Title & Action Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#151B2E", margin: 0 }}>Supplier performance</h1>
          <div style={{ fontSize: 13, color: "#8A8D98", marginTop: 4 }}>
            Vendor management and performance tracking — assign work from existing orders & tasks, track on-time delivery and quality
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 10 }}>
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
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <Layers size={16} />
            Assign Work
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#1F9E8D",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <Plus size={16} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Top Aggregate Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Active Suppliers</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>{overallStats.activeCount}</div>
          <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>Registered partner vendors</div>
        </Card>

        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Total Supplier Jobs</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#534AB7", marginTop: 4 }}>{overallStats.totalJobs}</div>
          <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>Work assignments allocated</div>
        </Card>

        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>Avg. On-Time Rate</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor(overallStats.avgOnTime), marginTop: 4 }}>
            {overallStats.avgOnTime}%
          </div>
          <div style={{ fontSize: 11, color: "#166534", marginTop: 2 }}>{overallStats.totalOnTime} on-time of {overallStats.totalJobs}</div>
        </Card>

        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0369A1" }}>Quality Compliance</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#0284C7", marginTop: 4 }}>
            {overallStats.qualityCompliance}%
          </div>
          <div style={{ fontSize: 11, color: "#0369A1", marginTop: 2 }}>Zero quality defect rate</div>
        </Card>
      </div>

      {/* Main Supplier Performance Table */}
      <Card>
        <div style={{ padding: "0 0 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Suppliers & Vendor Performance</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#E1F5EE", color: "#085041", padding: "2px 8px", borderRadius: 999 }}>
              {sortedSuppliers.length} suppliers
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#8A8D98" }}>Sorted by most recently assigned order / work</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr 0.6fr 0.6fr 0.8fr 0.9fr 1.1fr 1.2fr", fontSize: 11.5, color: "#8A8D98", padding: "0 6px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Supplier</div>
          <div>Jobs</div>
          <div>On-time</div>
          <div>Delayed</div>
          <div>Quality Issues</div>
          <div>On-time Rate</div>
          <div>Latest Order</div>
          <div>Orders</div>
        </div>

        {sortedSuppliers.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
            No suppliers registered yet. Click <strong>+ Add Supplier</strong> above to create your first vendor.
          </div>
        ) : (
          sortedSuppliers.map(supplier => {
            const metrics = calculateSupplierMetrics(supplier, orders, supplierWork);
            return (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplierId(supplier.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 0.6fr 0.6fr 0.6fr 0.8fr 0.9fr 1.1fr 1.2fr",
                  alignItems: "center",
                  fontSize: 12.5,
                  padding: "12px 6px",
                  borderBottom: "1px solid #F5F5F7",
                  cursor: "pointer"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#1B2130", display: "flex", alignItems: "center", gap: 6 }}>
                    {supplier.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "monospace", color: "#534AB7" }}>{supplier.code}</span>
                    <span>·</span>
                    <span>{supplier.type}</span>
                  </div>
                </div>

                <div style={{ fontWeight: 600, color: "#1B2130" }}>{metrics.jobs}</div>

                <div style={{ color: "#1F9E8D", fontWeight: 700 }}>{metrics.onTime}</div>

                <div style={{ color: metrics.delayed > 0 ? "#DC2626" : "#8A8D98", fontWeight: metrics.delayed > 0 ? 700 : 400 }}>
                  {metrics.delayed}
                </div>

                <div style={{ color: metrics.qualityIssues > 0 ? "#DC2626" : "#8A8D98", fontWeight: metrics.qualityIssues > 0 ? 700 : 400 }}>
                  {metrics.qualityIssues}
                </div>

                <div>
                  {metrics.onTimeRate !== null ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, color: scoreColor(metrics.onTimeRate) }}>{metrics.onTimeRate}%</span>
                      {supplierStatusPill(metrics.status)}
                    </div>
                  ) : (
                    <span style={{ color: "#9CA3AF" }}>—</span>
                  )}
                </div>

                <div>
                  {metrics.latestOrder ? (
                    <div>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenOrder) onOpenOrder(metrics.latestOrder.id);
                        }}
                        style={{ fontFamily: "monospace", fontSize: 11.5, color: "#378ADD", fontWeight: 700, cursor: "pointer" }}
                      >
                        {metrics.latestOrder.id}
                      </span>
                      <div style={{ fontSize: 10.5, color: "#8A8D98" }}>{metrics.latestOrder.ship || "In workflow"}</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>No orders yet</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                  {metrics.associatedOrders.length === 0 ? (
                    <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>No orders yet</span>
                  ) : (
                    <>
                      {metrics.associatedOrders.slice(0, 3).map(o => (
                        <span
                          key={o.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenOrder) onOpenOrder(o.id);
                          }}
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10.5,
                            color: "#378ADD",
                            background: "#F0F7FF",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: "1px solid #D0E1FD",
                            cursor: "pointer"
                          }}
                        >
                          {o.id}
                        </span>
                      ))}
                      {metrics.associatedOrders.length > 3 && (
                        <span style={{ fontSize: 10, color: "#6B7280", background: "#F3F4F6", padding: "2px 5px", borderRadius: 4 }}>
                          +{metrics.associatedOrders.length - 3} more
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <AddSupplierModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddSupplier}
        />
      )}

      {/* Assign Work Modal */}
      {showAssignModal && (
        <AssignWorkModal
          orders={orders}
          tasks={tasks}
          suppliers={activeSuppliers}
          onClose={() => setShowAssignModal(false)}
          onAssign={onAssignWork}
        />
      )}
    </div>
  );
}


export function NotificationsPage({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onOpenOrder,
  onNavigate
}) {
  const [tabFilter, setTabFilter] = useState("all"); // all | unread | order | tna | task | approval | compliance | certification
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead && n.isDeleted !== true).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (n.isDeleted === true) return false;
      
      // Tab filter
      if (tabFilter === "unread" && n.isRead) return false;
      if (["order", "tna", "task", "approval", "compliance", "certification"].includes(tabFilter) && n.type !== tabFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && n.priority !== priorityFilter) return false;

      // Date filter
      if (dateFilter !== "all") {
        const date = new Date(n.createdAt);
        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);
        if (dateFilter === "today" && diffHours > 24) return false;
        if (dateFilter === "week" && diffHours > 24 * 7) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (n.title || "").toLowerCase().includes(q);
        const msgMatch = (n.message || "").toLowerCase().includes(q);
        const idMatch = (n.relatedId || "").toLowerCase().includes(q);
        if (!titleMatch && !msgMatch && !idMatch) return false;
      }

      return true;
    });
  }, [notifications, tabFilter, priorityFilter, searchQuery, dateFilter]);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead && onMarkAsRead) {
      onMarkAsRead(notif.id);
    }
    if (notif.relatedModule === "orders" || notif.type === "order" || notif.type === "tna") {
      if (notif.relatedId && onOpenOrder) {
        onOpenOrder(notif.relatedId);
      } else if (onNavigate) {
        onNavigate("orders");
      }
    } else if (notif.relatedModule === "tasks" || notif.type === "task") {
      if (onNavigate) onNavigate("tasks");
    } else if (notif.relatedModule === "approvals" || notif.type === "approval") {
      if (onNavigate) onNavigate("approvals");
    } else if (notif.relatedModule === "compliance" || notif.type === "compliance" || notif.type === "certification") {
      if (onNavigate) onNavigate("compliance");
    }
  };

  const getNotificationIcon = (notif) => {
    const priority = notif.priority || "medium";
    const prioColor = NOTIFICATION_PRIORITY_STYLE[priority]?.iconColor || "#3B82F6";
    if (priority === "critical") return <TriangleAlert size={16} color="#DC2626" />;
    if (notif.type === "order") return <Package size={16} color={prioColor} />;
    if (notif.type === "tna") return <Calendar size={16} color={prioColor} />;
    if (notif.type === "task") return <CheckSquare size={16} color={prioColor} />;
    if (notif.type === "approval") return <ClipboardCheck size={16} color={prioColor} />;
    if (notif.type === "certification") return <Award size={16} color={prioColor} />;
    if (notif.type === "compliance") return <ShieldCheck size={16} color={prioColor} />;
    return <Bell size={16} color={prioColor} />;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#151B2E", margin: 0 }}>Notifications</h1>
          <div style={{ fontSize: 13, color: "#8A8D98", marginTop: 4 }}>
            Stay updated on live order delays, T&A stage milestones, assigned tasks, approvals, and buyer compliance deadlines
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {unreadCount > 0 && (
            <button
              onClick={() => onMarkAllAsRead && onMarkAllAsRead()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#F0EFFB",
                color: "#534AB7",
                border: "1px solid #D9D6F5",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <CheckCircle size={14} />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Rail */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { key: "all", label: "All", count: notifications.filter(n => n.isDeleted !== true).length },
          { key: "unread", label: "Unread", count: unreadCount, highlight: unreadCount > 0 },
          { key: "order", label: "Orders", count: notifications.filter(n => n.type === "order" && n.isDeleted !== true).length },
          { key: "tna", label: "T&A", count: notifications.filter(n => n.type === "tna" && n.isDeleted !== true).length },
          { key: "task", label: "My Tasks", count: notifications.filter(n => n.type === "task" && n.isDeleted !== true).length },
          { key: "approval", label: "Approvals", count: notifications.filter(n => n.type === "approval" && n.isDeleted !== true).length },
          { key: "compliance", label: "Compliance", count: notifications.filter(n => n.type === "compliance" && n.isDeleted !== true).length },
          { key: "certification", label: "Certifications", count: notifications.filter(n => n.type === "certification" && n.isDeleted !== true).length },
        ].map(tab => {
          const active = tabFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabFilter(tab.key)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: active ? "1px solid #534AB7" : "1px solid #E5E7EB",
                background: active ? "#534AB7" : "#FFFFFF",
                color: active ? "#FFFFFF" : tab.highlight ? "#DC2626" : "#4B5563",
                fontSize: 12.5,
                fontWeight: active || tab.highlight ? 700 : 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap"
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: active ? "rgba(255,255,255,0.25)" : tab.highlight ? "#FEE2E2" : "#F3F4F6",
                  color: active ? "#FFFFFF" : tab.highlight ? "#991B1B" : "#6B7280"
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Filters Bar */}
      <Card style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search notifications, orders, keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px 6px 30px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                fontSize: 12.5
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: "#6B7280", fontWeight: 600 }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: "#6B7280", fontWeight: 600 }}>Timeframe:</span>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
            >
              <option value="all">All Time</option>
              <option value="today">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>

          {(searchQuery || priorityFilter !== "all" || dateFilter !== "all" || tabFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("all");
                setDateFilter("all");
                setTabFilter("all");
              }}
              style={{ background: "none", border: "none", color: "#534AB7", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Notifications List */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CheckCircle size={22} color="#16A34A" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>No new notifications</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              {searchQuery || priorityFilter !== "all" || dateFilter !== "all" || tabFilter !== "all"
                ? "No notifications matching your filter criteria."
                : "You're all caught up."}
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif, idx) => {
            const prioStyle = NOTIFICATION_PRIORITY_STYLE[notif.priority] || NOTIFICATION_PRIORITY_STYLE.medium;
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif.id || idx}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 20px",
                  borderBottom: idx < filteredNotifications.length - 1 ? "1px solid #F3F4F6" : "none",
                  background: isUnread ? "#FAF8FE" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  position: "relative"
                }}
                onMouseEnter={e => e.currentTarget.style.background = isUnread ? "#F3EFFF" : "#F9FAFB"}
                onMouseLeave={e => e.currentTarget.style.background = isUnread ? "#FAF8FE" : "#FFFFFF"}
              >
                {/* Unread indicator bar */}
                {isUnread && (
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3.5, background: "#534AB7" }} />
                )}

                {/* Icon */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: isUnread ? "#F0EFFB" : "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2
                  }}
                >
                  {getNotificationIcon(notif)}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13.5, fontWeight: isUnread ? 700 : 600, color: "#111827" }}>
                      {notif.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "1.5px 7px",
                        borderRadius: 999,
                        background: prioStyle.bg,
                        color: prioStyle.fg,
                        textTransform: "capitalize"
                      }}
                    >
                      {prioStyle.label}
                    </span>
                    {isUnread && (
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: "#534AB7" }} />
                    )}
                  </div>

                  <div style={{ fontSize: 13, color: isUnread ? "#374151" : "#6B7280", lineHeight: 1.4 }}>
                    {notif.message}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, fontSize: 11.5, color: "#9CA3AF" }}>
                    <span>{formatTimeAgo(notif.createdAt)}</span>
                    <span>·</span>
                    <span style={{ textTransform: "capitalize" }}>{notif.relatedModule || notif.type}</span>
                    {notif.relatedId && (
                      <>
                        <span>·</span>
                        <span style={{ fontFamily: "monospace", color: "#534AB7", fontWeight: 600 }}>{notif.relatedId}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                  {isUnread && (
                    <button
                      onClick={() => onMarkAsRead && onMarkAsRead(notif.id)}
                      title="Mark as read"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#534AB7",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "4px 8px",
                        borderRadius: 6
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F0EFFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteNotification && onDeleteNotification(notif.id)}
                    title="Delete notification"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9CA3AF",
                      cursor: "pointer",
                      padding: 4,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FEE2E2"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "none"; }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

export function DebitNotesPage({ orders, notes, onAdd }) {
  const [form, setForm] = useState({ season: SEASON_OPTIONS[0], buyer: "", po: "", amount: "", reason: "", date: "" });
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const total = notes.reduce((a, n) => a + (Number(n.amount) || 0), 0);
  const bySeason = {};
  notes.forEach(n => { bySeason[n.season] = (bySeason[n.season] || 0) + (Number(n.amount) || 0); });

  function submit() {
    if (!form.buyer.trim() || !form.amount) return;
    onAdd({ id: Date.now(), season: form.season, buyer: form.buyer.trim(), po: form.po, amount: Number(form.amount), reason: form.reason.trim() || "—", date: form.date.trim() || "Today" });
    setForm({ season: form.season, buyer: "", po: "", amount: "", reason: "", date: "" });
  }

  return (
    <div>
      <PageHeader title="Debit Notes" sub="Entered by Merchandising each season — buyer deductions and claims against orders" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total debit notes</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>{notes.length}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total value</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>${total.toLocaleString()}</div></Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98", marginBottom: 4 }}>By season</div>
          {Object.entries(bySeason).map(([s, v]) => (
            <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span>{s}</span><span style={{ fontWeight: 600 }}>${v.toLocaleString()}</span></div>
          ))}
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Add a debit note" />
        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 1fr 0.8fr 1.4fr 0.8fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Season</label>
            <select value={form.season} onChange={e => set("season", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              {SEASON_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Buyer</label>
            <input value={form.buyer} onChange={e => set("buyer", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>PO (optional)</label>
            <select value={form.po} onChange={e => set("po", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              <option value="">—</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Amount ($)</label>
            <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Reason</label>
            <input value={form.reason} onChange={e => set("reason", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Date</label>
            <input value={form.date} onChange={e => set("date", e.target.value)} placeholder="e.g. 12 Jun" style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <button onClick={submit} style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#D64545", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Add</button>
        </div>
      </Card>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 0.9fr 0.9fr 1.6fr 0.8fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Season</div><div>Buyer</div><div>PO</div><div>Amount</div><div>Reason</div><div>Date</div>
        </div>
        {notes.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>No debit notes recorded yet.</div>
        ) : notes.map(n => (
          <div key={n.id} style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 0.9fr 0.9fr 1.6fr 0.8fr", alignItems: "center", fontSize: 12.5, padding: "10px 4px", borderBottom: "1px solid #F5F5F7" }}>
            <div>{n.season}</div>
            <div style={{ fontWeight: 600, color: "#1B2130" }}>{n.buyer}</div>
            <div style={{ fontFamily: "monospace", fontSize: 11 }}>{n.po || "—"}</div>
            <div style={{ color: "#D64545", fontWeight: 600 }}>${Number(n.amount).toLocaleString()}</div>
            <div style={{ color: "#565A66" }}>{n.reason}</div>
            <div>{n.date}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function CapasPage({ orders, capas, onAdd, onCycleStatus }) {
  const [form, setForm] = useState({ season: SEASON_OPTIONS[0], buyer: "", po: "", issue: "", action: "", date: "" });
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const openCount = capas.filter(c => c.status !== "closed").length;

  function submit() {
    if (!form.buyer.trim() || !form.issue.trim()) return;
    onAdd({ id: Date.now(), season: form.season, buyer: form.buyer.trim(), po: form.po, issue: form.issue.trim(), action: form.action.trim() || "—", status: "open", date: form.date.trim() || "Today" });
    setForm({ season: form.season, buyer: "", po: "", issue: "", action: "", date: "" });
  }

  return (
    <div>
      <PageHeader title="CAPAs Registered" sub="Corrective & Preventive Actions — entered by Merchandising each season, click a status to move it forward" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total CAPAs</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{capas.length}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Open / in progress</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#E2A83B" }}>{openCount}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Closed</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>{capas.length - openCount}</div></Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Register a CAPA" />
        <div style={{ display: "grid", gridTemplateColumns: "0.7fr 0.9fr 0.8fr 1.4fr 1.4fr 0.7fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Season</label>
            <select value={form.season} onChange={e => set("season", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              {SEASON_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Buyer</label>
            <input value={form.buyer} onChange={e => set("buyer", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>PO (optional)</label>
            <select value={form.po} onChange={e => set("po", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              <option value="">—</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Issue</label>
            <input value={form.issue} onChange={e => set("issue", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Corrective action</label>
            <input value={form.action} onChange={e => set("action", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Date</label>
            <input value={form.date} onChange={e => set("date", e.target.value)} placeholder="e.g. 12 Jun" style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <button onClick={submit} style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#534AB7", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Register</button>
        </div>
      </Card>

      <Card>
        {capas.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No CAPAs registered yet.</div>
        ) : capas.map(c => {
          const st = CAPA_STATUS_STYLE[c.status] || CAPA_STATUS_STYLE.open;
          return (
            <div key={c.id} style={{ padding: "12px 4px", borderBottom: "1px solid #F5F5F7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{c.issue}</div>
                  <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>{c.season} · {c.buyer}{c.po ? ` · PO #${c.po}` : ""} · {c.date}</div>
                  <div style={{ fontSize: 12, color: "#565A66", marginTop: 4 }}>Action: {c.action}</div>
                </div>
                <span
                  onClick={() => onCycleStatus(c.id)}
                  style={{ cursor: "pointer", background: st.bg, color: st.fg, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}
                >
                  {st.label}
                </span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

export function ExecutiveOverviewPage({ orders, attendance, financials, roster }) {
  const allStages = orders.flatMap(o => o.stages || []);
  const totalOrders = orders.length;
  const totalQty = orders.reduce((a, o) => a + (Number(o.qty) || 0), 0);

  const health = orders.map(o => {
    const flags = (o.stages || []).filter(s => s.reason).length;
    let score = 100 - flags * 15 - (o.status === "Delayed" ? 20 : 0);
    score = Math.max(0, Math.min(100, score));
    return { order: o, score };
  });
  const healthBuckets = [
    { name: "Healthy (80-100)", color: "#1F9E8D", value: health.filter(h => h.score >= 80).length },
    { name: "At Risk (60-79)", color: "#E2A83B", value: health.filter(h => h.score >= 60 && h.score < 80).length },
    { name: "Critical (40-59)", color: "#D85A30", value: health.filter(h => h.score >= 40 && h.score < 60).length },
    { name: "Severe (0-39)", color: "#D64545", value: health.filter(h => h.score < 40).length },
  ].filter(b => b.value > 0);
  const overallHealth = Math.round(health.reduce((a, h) => a + h.score, 0) / (health.length || 1));

  const onTrack = orders.filter(o => o.status === "On Track").length;
  const onTimePct = Math.round((onTrack / (totalOrders || 1)) * 100);

  const avgProgress = totalOrders > 0
    ? orders.reduce((a, o) => a + (o.stages ? o.stages.filter(s => s.status === "done").length / o.stages.length : 0), 0) / totalOrders
    : 0;
  const shippedPcs = Math.round(totalQty * avgProgress);
  const grossProfit = financials.revenue - financials.cogs;
  const grossMargin = financials.revenue > 0 ? Math.round((grossProfit / financials.revenue) * 1000) / 10 : 0;

  const reasonCounts = {};
  allStages.forEach(s => { if (s.reason) reasonCounts[s.reason] = (reasonCounts[s.reason] || 0) + 1; });
  const reasonArr = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const reasonTotal = reasonArr.reduce((a, [, c]) => a + c, 0) || 1;

  const alerts = [];
  orders.forEach(o => {
    if (!o.stages) return;
    o.stages.forEach(s => { if (s.reason) alerts.push({ text: `${s.reason} — ${o.style} PO #${o.id} (${s.dept})`, sev: o.risk }); });
  });

  const inProduction = allStages.filter(s => ["Cutting", "Production"].includes(s.dept) && s.status === "in_progress").length;
  const ordersAtRisk = orders.filter(o => o.status === "At Risk").length;
  const ordersDelayed = orders.filter(o => o.status === "Delayed").length;
  const ordersCompleted = orders.filter(o => o.status === "On Track" && o.stages && o.stages.every(s => s.status === "done")).length;

  const presentCount = roster.filter(s => (attendance[s.name] || "present") === "present").length;
  const capacityUtilization = Math.round((presentCount / (roster.length || 1)) * 100);

  const buyerCounts = {};
  orders.forEach(o => { buyerCounts[o.buyer] = (buyerCounts[o.buyer] || 0) + 1; });
  const buyerColors = ["#7F77DD", "#378ADD", "#1F9E8D", "#E2A83B", "#D64545", "#8A8D98"];
  const buyerData = Object.entries(buyerCounts).map(([name, value], i) => ({ name, value, color: buyerColors[i % buyerColors.length] }));

  const countryCounts = {};
  orders.forEach(o => { countryCounts[o.country] = (countryCounts[o.country] || 0) + 1; });
  const countryArr = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
  const countryMax = Math.max(...countryArr.map(c => c[1]), 1);

  const riskCounts = { high: orders.filter(o => o.risk === "high").length, medium: orders.filter(o => o.risk === "medium").length, low: orders.filter(o => o.risk === "low").length };
  const riskData = [
    { name: "High risk", value: riskCounts.high, color: "#D64545" },
    { name: "Medium risk", value: riskCounts.medium, color: "#E2A83B" },
    { name: "Low risk", value: riskCounts.low, color: "#1F9E8D" },
  ].filter(r => r.value > 0);

  const openPOStages = allStages.filter(s => (s.name === "Fabric Booking" || s.name === "Trim Booking") && s.status !== "done");
  const latePOStages = openPOStages.filter(s => s.reason);

  const openTasksRows = allStages.filter(s => s.status !== "done");
  const overdueRows = allStages.filter(s => s.status === "in_progress" && s.reason);
  const pendingApprovals = allStages.filter(s => s.name.toLowerCase().includes("approval") && s.status !== "done");

  const activityFeed = orders.map(o => {
    if (!o.stages) return null;
    const lastDoneIdx = [...o.stages].reverse().findIndex(s => s.status === "done");
    if (lastDoneIdx === -1) return null;
    const idx = o.stages.length - 1 - lastDoneIdx;
    const s = o.stages[idx];
    return { text: `${s.name} completed`, sub: `PO #${o.id} · ${s.dept}` };
  }).filter(Boolean).slice(0, 6);

  const kpis = [
    { label: "Total Orders", value: totalOrders, sub: `${totalQty.toLocaleString()} pcs`, icon: ClipboardList, color: "#378ADD" },
    { label: "Total Value (USD)", value: `$${(financials.revenue / 1e6).toFixed(2)}M`, icon: Landmark, color: "#1F9E8D" },
    { label: "On-Time Shipment %", value: `${onTimePct}%`, icon: Clock, color: "#378ADD" },
    { label: "Overall Order Health", value: `${overallHealth} /100`, icon: Gauge, color: "#E2A83B" },
    { label: "Total Shipped (PCS)", value: shippedPcs.toLocaleString(), icon: Truck, color: "#7F77DD" },
    { label: "Gross Margin", value: `${grossMargin}%`, icon: TrendingUp, color: "#E2A83B" },
  ];

  return (
    <div style={{ background: "#0E1424", margin: "-24px -28px", padding: 24, minHeight: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>MD Executive Dashboard</div>
        <div style={{ fontSize: 12.5, color: "#8489A0", marginTop: 2 }}>Real-time overview of entire organization performance</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 16 }}>
        {kpis.map(k => (
          <DarkCard key={k.label} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: k.color + "33", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={13} color={k.color} />
              </div>
              <div style={{ fontSize: 10, color: "#8489A0", textTransform: "uppercase" }}>{k.label}</div>
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 10.5, color: "#8489A0", marginTop: 2 }}>{k.sub}</div>}
          </DarkCard>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 0.9fr", gap: 12, marginBottom: 12 }}>
        <DarkCard>
          <DarkCardHeader title="Order Health Distribution" />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <MiniDonut data={healthBuckets} size={100} centerLabel={totalOrders} centerSub="Orders" />
            <div style={{ flex: 1 }}>
              {healthBuckets.map(b => (
                <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: b.color }} />
                  <span style={{ color: "#C7CADA", flex: 1 }}>{b.name}</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Shipment Performance Trend" sub="Last 6 months" />
          <div style={{ width: "100%", height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SHIPMENT_PERFORMANCE} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262E48" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8489A0" }} axisLine={{ stroke: "#262E48" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8489A0" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: "#171E33", border: "1px solid #262E48", color: "#fff" }} />
                <Line type="monotone" dataKey="onTime" name="On-time %" stroke="#7C8BFF" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="target" name="Target %" stroke="#4B5270" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Top Delay Reasons" sub="All orders" />
          {reasonArr.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "#8489A0" }}>No delays flagged.</div>
          ) : reasonArr.map(([reason, count]) => (
            <div key={reason} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: "#C7CADA" }}>{reason}</span>
                <span style={{ color: "#8489A0" }}>{Math.round(count / reasonTotal * 100)}%</span>
              </div>
              <div style={{ height: 5, background: "#262E48", borderRadius: 999 }}>
                <div style={{ height: 5, width: `${count / reasonTotal * 100}%`, background: "#D64545", borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </DarkCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: 12, marginBottom: 12 }}>
        <DarkCard>
          <DarkCardHeader title="Order & Production Performance" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              ["Orders in Production", inProduction, "#7F77DD"],
              ["Capacity Utilization", `${capacityUtilization}%`, "#378ADD"],
              ["Orders Completed", ordersCompleted, "#1F9E8D"],
              ["Orders At Risk", ordersAtRisk, "#E2A83B"],
              ["Orders Delayed", ordersDelayed, "#D64545"],
              ["Compliance Score", `${financials.complianceScore}%`, "#1F9E8D"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: "#0E1424", borderRadius: 10, padding: "12px 12px" }}>
                <div style={{ fontSize: 10, color: "#8489A0", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
        </DarkCard>
        <DarkCard>
          <DarkCardHeader title="Critical Alerts" action={`${alerts.length}`} />
          {alerts.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "#8489A0" }}>No active alerts.</div>
          ) : alerts.slice(0, 5).map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 0", borderBottom: i < 4 ? "1px solid #262E48" : "none" }}>
              <TriangleAlert size={13} color={a.sev === "high" ? "#D64545" : "#E2A83B"} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: "#C7CADA" }}>{a.text}</div>
            </div>
          ))}
        </DarkCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <DarkCard>
          <DarkCardHeader title="Orders by Buyer" />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MiniDonut data={buyerData} size={84} centerLabel={totalOrders} />
            <div style={{ flex: 1 }}>
              {buyerData.map(b => (
                <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontSize: 10.5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: b.color }} />
                  <span style={{ color: "#C7CADA", flex: 1 }}>{b.name}</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Orders by Country" />
          {countryArr.map(([country, count]) => (
            <div key={country} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, fontSize: 10.5 }}>
              <Globe size={11} color="#8489A0" style={{ flexShrink: 0 }} />
              <span style={{ color: "#C7CADA", width: 70, flexShrink: 0 }}>{country}</span>
              <div style={{ flex: 1, height: 5, background: "#262E48", borderRadius: 999 }}>
                <div style={{ height: 5, width: `${(count / countryMax) * 100}%`, background: "#378ADD", borderRadius: 999 }} />
              </div>
              <span style={{ color: "#fff", fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Quality Overview" />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <MiniDonut data={[{ name: "Pass", value: 93.4, color: "#1F9E8D" }, { name: "Fail", value: 6.6, color: "#262E48" }]} size={80} centerLabel="93.4%" centerSub="Pass rate" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#8489A0" }}>
            <span>Defect rate <b style={{ color: "#fff" }}>2.1%</b></span>
            <span>Rework <b style={{ color: "#fff" }}>1.8%</b></span>
          </div>
        </DarkCard>

        <DarkCard>
          <DarkCardHeader title="Predicted Shipment Risk" sub="Next 30 days" />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MiniDonut data={riskData} size={80} centerLabel={totalOrders} />
            <div style={{ flex: 1 }}>
              {riskData.map(r => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontSize: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: r.color }} />
                  <span style={{ color: "#C7CADA", flex: 1 }}>{r.name}</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 12 }}>
        <DarkCard>
          <DarkCardHeader title="Financial Overview" sub="YTD — entered by Finance team" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              ["Total Revenue", `$${(financials.revenue / 1e6).toFixed(2)}M`, "#fff"],
              ["Total COGS", `$${(financials.cogs / 1e6).toFixed(2)}M`, "#fff"],
              ["Gross Profit", `$${(grossProfit / 1e6).toFixed(2)}M`, "#1F9E8D"],
              ["Gross Margin", `${grossMargin}%`, "#1F9E8D"],
              ["EBITDA", `$${(financials.ebitda / 1e6).toFixed(2)}M`, "#fff"],
              ["Stock Value", `$${(financials.stockValue / 1e6).toFixed(2)}M`, "#fff"],
            ].map(([label, val, color]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "#8489A0", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
        </DarkCard>
        <DarkCard>
          <DarkCardHeader title="Activity Feed" sub="Latest updates" />
          {activityFeed.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "#8489A0" }}>No recent activity.</div>
          ) : activityFeed.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 0", borderBottom: i < activityFeed.length - 1 ? "1px solid #262E48" : "none" }}>
              <CheckCircle2 size={12} color="#1F9E8D" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: "#C7CADA" }}>{a.text}</div>
                <div style={{ fontSize: 9.5, color: "#8489A0" }}>{a.sub}</div>
              </div>
            </div>
          ))}
        </DarkCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        {[
          ["Open Tasks", openTasksRows.length, "#378ADD"],
          ["Overdue Tasks", overdueRows.length, "#D64545"],
          ["Pending Approvals", pendingApprovals.length, "#E2A83B"],
          ["Open POs", openPOStages.length, "#378ADD"],
          ["Late POs", latePOStages.length, "#D64545"],
          ["Cash Flow, YTD", `$${(financials.cashFlow / 1e6).toFixed(2)}M`, "#1F9E8D"],
        ].map(([label, val, color]) => (
          <DarkCard key={label} style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 9.5, color: "#8489A0", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
          </DarkCard>
        ))}
      </div>
    </div>
  );
}

export function SettingsPage({ role, setRole }) {
  return (
    <div>
      <PageHeader title="Settings" sub="Prototype account settings" />
      <Card style={{ maxWidth: 420 }}>
        <CardHeader title="Signed in as" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#8A8D98", display: "block", marginBottom: 6 }}>Role</label>
          <select
            value={role.label}
            onChange={e => setRole(ROLE_OPTIONS.find(r => r.label === e.target.value))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #E7E8ED", fontSize: 13 }}
          >
            {ROLE_OPTIONS.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 12, color: "#8A8D98" }}>Switching your role changes what shows up under "My tasks."</div>
      </Card>
    </div>
  );
}
