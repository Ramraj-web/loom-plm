import React, { useState, useMemo } from "react";
import {
  CheckCircle2, Upload, Plus, Trash2, Check, RotateCcw, Archive, X,
  ShieldCheck, Award, FileText, AlertTriangle, Clock, Eye, Edit,
  Search, Filter, ExternalLink, ChevronRight, CheckCircle, AlertCircle,
  HelpCircle, Calendar, RefreshCw, ArrowUp, ArrowDown, Layers, GripVertical, Laptop, Smartphone, MapPin, Activity, Download
} from "lucide-react";
import {
  TA_STAGES, TA_STAGES_90, TA_STAGES_120, makeStages, DEPT_ICONS, ORG_STRUCTURE, ATTENDANCE_STATUS_STYLE, CERT_STATUS_STYLE,
  COMPLIANCE_STATUS_STYLE, COMPLIANCE_PRIORITY_STYLE, CERT_NAME_OPTIONS, BUYER_LIST, COMPLIANCE_CATEGORIES,
  DEFAULT_DEPT_DESCRIPTIONS, firstNamedAssignee
} from "../../constants/loomData.js";
import {
  Card, CardHeader, PageHeader, BackLink, statusPill, riskDot, collectTasks, GroupedTaskList, OrgChain, TaskTable
} from "../common/CommonUI.jsx";
import { AssignWorkModal } from "./InsightsViews.jsx";
import { sanitizeLocationString } from "../../utils/deviceLocation.js";
import { DepartmentPerformanceAndKPI } from "./DepartmentKPISection.jsx";

export function OrdersPage({
  orders = [],
  isAdmin = false,
  onOpenOrder,
  onAddOrder,
  onCompleteOrder,
  onUncompleteOrder,
  onDeleteOrder,
  onRestoreOrder,
  onPermanentDeleteOrder
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeletedSection, setShowDeletedSection] = useState(false);
  const [alignModalOrder, setAlignModalOrder] = useState(null);

  const [form, setForm] = useState({
    id: "",
    style: "",
    buyer: "Zara",
    country: "Spain",
    season: "AW26",
    qty: "",
    ship: "25 May",
    risk: "low",
    status: "On Track",
    colorBreakdown: [
      { color: "", size: "M", qty: "" }
    ]
  });

  const activeOrders = useMemo(() => orders.filter(o => o.isDeleted !== true && o.completed !== true), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.completed === true && o.isDeleted !== true), [orders]);
  const deletedOrders = useMemo(() => orders.filter(o => o.isDeleted === true), [orders]);

  const addColorBreakdownRow = () => {
    setForm(prev => ({
      ...prev,
      colorBreakdown: [
        ...prev.colorBreakdown,
        { color: "", size: "M", qty: "" }
      ]
    }));
  };

  const removeColorBreakdownRow = (index) => {
    setForm(prev => {
      let next = prev.colorBreakdown.filter((_, i) => i !== index);
      if (next.length === 0) {
        next = [{ color: "", size: "M", qty: "" }];
      }
      const totalQty = next.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      return {
        ...prev,
        colorBreakdown: next,
        qty: totalQty > 0 ? totalQty : ""
      };
    });
  };

  const updateColorBreakdownRow = (index, field, value) => {
    setForm(prev => {
      const next = [...prev.colorBreakdown];
      next[index] = {
        ...next[index],
        [field]: field === "qty" ? (value === "" ? "" : Math.max(0, Number(value) || 0)) : value
      };
      // Auto sum quantities
      const totalQty = next.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      return {
        ...prev,
        colorBreakdown: next,
        qty: totalQty > 0 ? totalQty : (field === "qty" && value === "" ? "" : prev.qty)
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id.trim() || !form.style.trim()) return;

    // Filter to valid non-empty breakdown rows
    const validBreakdown = form.colorBreakdown.filter(
      b => (b.color && b.color.trim()) || (b.qty && Number(b.qty) > 0)
    );
    const distinctColors = Array.from(new Set(
      validBreakdown.map(b => b.color.trim()).filter(Boolean)
    ));
    const summaryColorStr = distinctColors.join(", ") || "";
    const totalBreakdownQty = validBreakdown.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const finalQty = totalBreakdownQty > 0 ? totalBreakdownQty : (Number(form.qty) || 0);

    const newOrder = {
      primaryId: "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
      id: form.id.trim().toUpperCase(),
      style: form.style.trim(),
      buyer: form.buyer.trim(),
      country: form.country.trim(),
      season: form.season.trim(),
      qty: finalQty,
      ship: form.ship.trim() || "15 Jun",
      color: summaryColorStr,
      colors: distinctColors,
      colorBreakdown: validBreakdown,
      risk: form.risk,
      status: form.status,
      completed: false,
      isDeleted: false,
      completedAt: null,
      deletedAt: null,
    };

    if (onAddOrder) onAddOrder(newOrder);

    // Open T&A Stage Alignment Dialog for this newly created order
    setAlignModalOrder(newOrder);

    setForm({
      id: "",
      style: "",
      buyer: "Zara",
      country: "Spain",
      season: "AW26",
      qty: "",
      ship: "25 May",
      risk: "low",
      status: "On Track",
      colorBreakdown: [
        { color: "", size: "M", qty: "" }
      ]
    });
    setShowAddModal(false);
  };

  return (
    <div>
      {/* Header with Title and + Add Order Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#151B2E", margin: 0 }}>Orders</h1>
          <div style={{ fontSize: 13, color: "#8A8D98", marginTop: 4 }}>
            {activeOrders.length} active order{activeOrders.length === 1 ? "" : "s"} · {completedOrders.length} completed · {deletedOrders.length} in history
          </div>
        </div>
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
          Add Order
        </button>
      </div>

      {/* 1. Active Orders Section */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Active Orders</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#E1F5EE", color: "#085041", padding: "2px 8px", borderRadius: 999 }}>
              {activeOrders.length} active
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.7fr 0.9fr 0.8fr 0.7fr", fontSize: 11.5, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>PO / Style</div><div>Buyer</div><div>Country</div><div>Season</div><div>Qty</div><div>Ship date</div><div>Risk</div><div>Status</div><div>Color</div><div style={{ textAlign: "right" }}>Actions</div>
        </div>

        {activeOrders.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
            No active orders. Click <strong>+ Add Order</strong> above to create one.
          </div>
        ) : (
          activeOrders.map(o => (
            <div
              key={o.primaryId || o.id}
              style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.7fr 0.9fr 0.8fr 0.7fr", alignItems: "center", fontSize: 13, padding: "12px 4px", borderBottom: "1px solid #F5F5F7" }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer" }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#8A8D98" }}>{o.id}</div>
                <div style={{ fontWeight: 600, color: "#1B2130" }}>{o.style}</div>
              </div>
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer" }}>{o.buyer}</div>
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer" }}>{o.country}</div>
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer" }}>{o.season || "SS26"}</div>
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer" }}>{Number(o.qty || 0).toLocaleString()}</div>
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer" }}>{o.ship}</div>
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", textTransform: "capitalize" }}>
                {riskDot(o.risk)}{o.risk}
              </div>
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer" }}>
                {statusPill(o.status)}
              </div>
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer" }}>
                {Array.isArray(o.colorBreakdown) && o.colorBreakdown.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {o.colorBreakdown.slice(0, 2).map((b, bi) => (
                      <span
                        key={bi}
                        style={{
                          fontSize: 10.5,
                          background: "#F0EFFB",
                          color: "#534AB7",
                          padding: "1px 5px",
                          borderRadius: 4,
                          fontWeight: 600,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {b.color} {b.size && `(${b.size})`} {b.qty && `· ${b.qty}`}
                      </span>
                    ))}
                    {o.colorBreakdown.length > 2 && (
                      <span style={{ fontSize: 10, color: "#6B7280", alignSelf: "center", fontWeight: 700 }}>
                        +{o.colorBreakdown.length - 2}
                      </span>
                    )}
                  </div>
                ) : Array.isArray(o.colors) && o.colors.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {o.colors.map((c, ci) => (
                      <span key={ci} style={{ fontSize: 10.5, background: "#F3F4F6", color: "#374151", padding: "1px 5px", borderRadius: 4, fontWeight: 500 }}>
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: o.color ? "#1B2130" : "#9CA3AF" }}>{o.color || "—"}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteOrder && onDeleteOrder(o.primaryId || o.id); }}
                    title="Delete order (Admin only)"
                    style={{
                      background: "#FCEBEB",
                      color: "#791F1F",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3
                    }}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* 2. Completed Orders Section */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Completed Orders</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#F0FDF4", color: "#166534", padding: "2px 8px", borderRadius: 999 }}>
              {completedOrders.length} completed
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#8A8D98" }}>Finished orders — kept in history</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 1.1fr", fontSize: 11.5, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>PO / Style</div><div>Buyer</div><div>Country</div><div>Season</div><div>Qty</div><div>Ship date</div><div>Color</div><div>Status</div><div style={{ textAlign: "right" }}>Actions</div>
        </div>

        {completedOrders.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "#8A8D98", fontSize: 12.5 }}>
            No completed orders yet. Complete all T&A stages inside an order's details page to automatically move it here.
          </div>
        ) : (
          completedOrders.map(o => (
            <div
              key={o.primaryId || o.id}
              style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 1.1fr", alignItems: "center", fontSize: 13, padding: "12px 4px", borderBottom: "1px solid #F5F5F7", background: "#FAFDFB" }}
            >
              <div onClick={() => onOpenOrder && onOpenOrder(o.id)} style={{ cursor: "pointer" }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#8A8D98" }}>{o.id}</div>
                <div style={{ fontWeight: 600, color: "#1B2130" }}>{o.style}</div>
              </div>
              <div>{o.buyer}</div>
              <div>{o.country}</div>
              <div>{o.season || "SS26"}</div>
              <div>{Number(o.qty || 0).toLocaleString()}</div>
              <div>{o.ship}</div>
              <div>
                {Array.isArray(o.colorBreakdown) && o.colorBreakdown.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {o.colorBreakdown.slice(0, 2).map((b, bi) => (
                      <span
                        key={bi}
                        style={{
                          fontSize: 10.5,
                          background: "#F0EFFB",
                          color: "#534AB7",
                          padding: "1px 5px",
                          borderRadius: 4,
                          fontWeight: 600,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {b.color} {b.size && `(${b.size})`}
                      </span>
                    ))}
                    {o.colorBreakdown.length > 2 && (
                      <span style={{ fontSize: 10, color: "#6B7280", alignSelf: "center", fontWeight: 700 }}>
                        +{o.colorBreakdown.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ color: o.color ? "#1B2130" : "#9CA3AF" }}>{o.color || "—"}</span>
                )}
              </div>
              <div>
                <span style={{ background: "#E1F5EE", color: "#085041", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
                  Completed
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                <button
                  onClick={() => onUncompleteOrder && onUncompleteOrder(o.primaryId || o.id)}
                  title="Move back to Active orders"
                  style={{
                    background: "#F5F3FF",
                    color: "#534AB7",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3
                  }}
                >
                  <RotateCcw size={12} />
                  Reopen
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onDeleteOrder && onDeleteOrder(o.primaryId || o.id)}
                    title="Delete order (Admin only)"
                    style={{
                      background: "#FCEBEB",
                      color: "#791F1F",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3
                    }}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* 3. Deleted Orders / History Section (Admin Only) */}
      {isAdmin && (
      <Card>
        <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Deleted Orders (History)</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#F3F4F6", color: "#4B5563", padding: "2px 8px", borderRadius: 999 }}>
              {deletedOrders.length} archived
            </span>
          </div>
          <button
            onClick={() => setShowDeletedSection(!showDeletedSection)}
            style={{ background: "none", border: "none", color: "#534AB7", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
          >
            {showDeletedSection ? "Hide" : "Show"}
          </button>
        </div>

        {showDeletedSection && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr", fontSize: 11.5, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
              <div>PO / Style</div><div>Buyer</div><div>Country</div><div>Season</div><div>Qty</div><div>Ship date</div><div>Color</div><div>Deleted date</div><div style={{ textAlign: "right" }}>Actions</div>
            </div>

            {deletedOrders.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#8A8D98", fontSize: 12.5 }}>
                No deleted orders in history.
              </div>
            ) : (
              deletedOrders.map(o => (
                <div
                  key={o.primaryId || o.id}
                  style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr", alignItems: "center", fontSize: 13, padding: "12px 4px", borderBottom: "1px solid #F5F5F7", opacity: 0.85 }}
                >
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#8A8D98", textDecoration: "line-through" }}>{o.id}</div>
                    <div style={{ fontWeight: 600, color: "#6B7280" }}>{o.style}</div>
                  </div>
                  <div style={{ color: "#6B7280" }}>{o.buyer}</div>
                  <div style={{ color: "#6B7280" }}>{o.country}</div>
                  <div style={{ color: "#6B7280" }}>{o.season || "SS26"}</div>
                  <div style={{ color: "#6B7280" }}>{Number(o.qty || 0).toLocaleString()}</div>
                  <div style={{ color: "#6B7280" }}>{o.ship}</div>
                  <div style={{ color: o.color ? "#6B7280" : "#9CA3AF" }}>{o.color || "—"}</div>
                  <div style={{ fontSize: 11.5, color: "#9CA3AF" }}>
                    {o.deletedAt ? new Date(o.deletedAt).toLocaleDateString() : "Archived"}
                  </div>
                  <div style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center" }}>
                    <button
                      onClick={() => onRestoreOrder && onRestoreOrder(o.primaryId || o.id)}
                      title="Restore order back to active list"
                      style={{
                        background: "#E1F5EE",
                        color: "#085041",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3
                      }}
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to PERMANENTLY delete order ${o.id}? This cannot be undone.`)) {
                          onPermanentDeleteOrder && onPermanentDeleteOrder(o.primaryId || o.id);
                        }
                      }}
                      title="Permanently delete order forever"
                      style={{
                        background: "#FCEBEB",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3
                      }}
                    >
                      <Trash2 size={12} />
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </Card>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              width: "100%",
              maxWidth: 520,
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              position: "relative"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#151B2E", margin: 0 }}>Add New Order</h3>
                <p style={{ fontSize: 12.5, color: "#8A8D98", margin: "4px 0 0" }}>Create an order and generate its 21-stage T&A pipeline</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "#8A8D98", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>PO / Order ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-8821"
                    value={form.id}
                    onChange={e => setForm({ ...form, id: e.target.value })}
                    style={{ width: "92%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Style / Garment Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oversized Hoodie"
                    value={form.style}
                    onChange={e => setForm({ ...form, style: e.target.value })}
                    style={{ width: "92%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Buyer</label>
                  <input
                    type="text"
                    placeholder="e.g. Zara"
                    value={form.buyer}
                    onChange={e => setForm({ ...form, buyer: e.target.value })}
                    style={{ width: "92%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Destination Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Spain"
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    style={{ width: "92%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Season</label>
                  <input
                    type="text"
                    placeholder="e.g. AW26"
                    value={form.season}
                    onChange={e => setForm({ ...form, season: e.target.value })}
                    style={{ width: "92%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Quantity (pcs)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10000"
                    value={form.qty}
                    onChange={e => setForm({ ...form, qty: e.target.value })}
                    style={{ width: "92%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Multi-Colour & Size Quantity Breakdown */}
              <div style={{ marginBottom: 16, padding: "12px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2937" }}>Multi-Colour & Size Breakdown</span>
                    <span style={{ fontSize: 11, color: "#6B7280", marginLeft: 8 }}>(e.g. Red M - 250 pcs)</span>
                  </div>
                  <button
                    type="button"
                    onClick={addColorBreakdownRow}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "#EDE9FE",
                      color: "#534AB7",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <Plus size={12} /> Add Colour / Size
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                  {form.colorBreakdown.map((row, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 1fr auto", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Colour (e.g. Red, Black)"
                        value={row.color}
                        onChange={e => updateColorBreakdownRow(idx, "color", e.target.value)}
                        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
                      />
                      <select
                        value={row.size}
                        onChange={e => updateColorBreakdownRow(idx, "size", e.target.value)}
                        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
                      >
                        {["XS", "S", "M", "L", "XL", "2XL", "3XL", "Free Size"].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty (e.g. 250)"
                        value={row.qty}
                        onChange={e => updateColorBreakdownRow(idx, "qty", e.target.value)}
                        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12, textAlign: "right" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeColorBreakdownRow(idx)}
                        title="Remove or clear row"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          padding: 4
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 6, borderTop: "1px dashed #E5E7EB", fontSize: 11.5, color: "#4B5563" }}>
                  <span>Total Order Quantity: <b style={{ color: "#1F2937" }}>{(form.colorBreakdown.reduce((s, i) => s + (Number(i.qty) || 0), 0) || Number(form.qty) || 0).toLocaleString()} pcs</b></span>
                  <span style={{ color: "#534AB7", fontWeight: 600 }}>
                    {form.colorBreakdown.filter(b => b.color || b.qty).length} variant{form.colorBreakdown.filter(b => b.color || b.qty).length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Ship Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 25 May"
                    value={form.ship}
                    onChange={e => setForm({ ...form, ship: e.target.value })}
                    style={{ width: "90%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Initial Risk</label>
                  <select
                    value={form.risk}
                    onChange={e => setForm({ ...form, risk: e.target.value })}
                    style={{ width: "95%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    style={{ width: "95%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 7,
                    border: "1px solid #D1D5DB",
                    background: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#4B5563",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: 7,
                    border: "none",
                    background: "#1F9E8D",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    cursor: "pointer"
                  }}
                >
                  Create Order & Realign T&A →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Order Creation T&A Stage Alignment Dialog */}
      {alignModalOrder && (
        <OrderStageAlignmentModal
          order={alignModalOrder}
          isOpen={Boolean(alignModalOrder)}
          onClose={() => setAlignModalOrder(null)}
          onSaveStages={(orderId, updatedStages, tmpl) => {
            if (onAddOrder) {
              // Also update stages in orders state if onAddOrder/onUpdateStages available
              const found = orders.find(o => o.id === orderId);
              if (found) {
                found.stages = updatedStages;
                found.template = tmpl;
              }
            }
            setAlignModalOrder(null);
          }}
        />
      )}
    </div>
  );
}

export function MyTasksPage({
  orders = [],
  role,
  tasks = [],
  suppliers = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAssignWork,
  onOpenOrder
}) {
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignPrefill, setAssignPrefill] = useState(null);
  const [taskTab, setTaskTab] = useState("all");
  const [form, setForm] = useState({
    title: "",
    orderId: "",
    dept: role?.dept || "Merchandising",
    assignee: role?.label?.split(" (")[0] || "",
    dueDate: "20 May",
    priority: "medium",
    notes: ""
  });

  const tnaRows = useMemo(() => {
    const userDeptList = Array.isArray(role?.departments) && role.departments.length > 0
      ? role.departments.map(d => d.toLowerCase())
      : [(role?.dept || "").toLowerCase()];

    return collectTasks(orders, null).filter(r => {
      if (r.stage.status === "done") return false;
      if (role?.fullAccess || role?.dept === "Administrators" || role?.dept === "Executive") return true;
      return r.dept && userDeptList.includes(r.dept.toLowerCase());
    });
  }, [orders, role]);

  const roleCustomTasks = useMemo(() => {
    const userDeptList = Array.isArray(role?.departments) && role.departments.length > 0
      ? role.departments
      : [role?.dept || ""];

    return tasks.filter(t => {
      if (role?.fullAccess || role?.dept === "Administrators" || role?.dept === "Executive") return true;
      return userDeptList.includes(t.dept) || t.dept === "All";
    });
  }, [tasks, role]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const newTask = {
      title: form.title.trim(),
      orderId: form.orderId ? form.orderId.trim().toUpperCase() : null,
      dept: form.dept || role?.dept || "Merchandising",
      assignee: form.assignee.trim() || role?.label?.split(" (")[0] || "Unassigned",
      dueDate: form.dueDate.trim() || "25 May",
      priority: form.priority || "medium",
      notes: form.notes.trim(),
      status: "in_progress",
      createdAt: new Date().toISOString()
    };
    if (onAddTask) onAddTask(newTask);
    setForm({
      title: "",
      orderId: "",
      dept: role?.dept || "Merchandising",
      assignee: role?.label?.split(" (")[0] || "",
      dueDate: "20 May",
      priority: "medium",
      notes: ""
    });
    setShowModal(false);
  };

  const priorityColors = {
    high: { bg: "#FCEBEB", fg: "#791F1F" },
    medium: { bg: "#FAEEDA", fg: "#633806" },
    low: { bg: "#E1F5EE", fg: "#085041" }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#151B2E", margin: 0 }}>My tasks</h1>
          <div style={{ fontSize: 13, color: "#8A8D98", marginTop: 4 }}>
            Showing tasks for {role?.label} — {role?.dept} · {tnaRows.length} T&A stage task{tnaRows.length === 1 ? "" : "s"} · {roleCustomTasks.length} custom task{roleCustomTasks.length === 1 ? "" : "s"}
          </div>
        </div>
        <button
          onClick={() => {
            setForm(f => ({
              ...f,
              dept: role?.dept || "Merchandising",
              assignee: role?.label?.split(" (")[0] || ""
            }));
            setShowModal(true);
          }}
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
          Add Task
        </button>
      </div>

      {/* Task Filters Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "all", label: `All Tasks (${tnaRows.length + roleCustomTasks.length})` },
          { key: "custom", label: `Custom & Assigned Tasks (${roleCustomTasks.length})` },
          { key: "tna", label: `T&A Stage Tasks (${tnaRows.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setTaskTab(tab.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              borderColor: taskTab === tab.key ? "#1F9E8D" : "#E5E7EB",
              background: taskTab === tab.key ? "#E1F5EE" : "#FFFFFF",
              color: taskTab === tab.key ? "#085041" : "#4B5563"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Custom / Assigned Action Items Section */}
      {(taskTab === "all" || taskTab === "custom") && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Assigned & Action Items</span>
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#E0DBF5", color: "#3D3878", padding: "2px 8px", borderRadius: 999 }}>
                {roleCustomTasks.length} task{roleCustomTasks.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.9fr 0.8fr 0.7fr 0.9fr 0.8fr", fontSize: 11.5, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
            <div>Task Description</div><div>Related Order</div><div>Department</div><div>Assignee</div><div>Due</div><div>Status</div><div style={{ textAlign: "right" }}>Actions</div>
          </div>

          {roleCustomTasks.length === 0 ? (
            <div style={{ padding: "28px 0", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
              No custom tasks yet. Click <strong>Add Task</strong> above to assign an action item.
            </div>
          ) : (
            roleCustomTasks.map(t => {
              const isDone = t.status === "done";
              const pStyle = priorityColors[t.priority] || priorityColors.medium;
              return (
                <div
                  key={t.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 0.9fr 0.9fr 0.8fr 0.7fr 0.9fr 0.8fr",
                    alignItems: "center",
                    fontSize: 12.5,
                    padding: "12px 4px",
                    borderBottom: "1px solid #F5F5F7",
                    opacity: isDone ? 0.65 : 1
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={e => onUpdateTask && onUpdateTask(t.id, { status: e.target.checked ? "done" : "in_progress" })}
                      style={{ marginTop: 2, cursor: "pointer", accentColor: "#1F9E8D" }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: isDone ? "#8A8D98" : "#1B2130", textDecoration: isDone ? "line-through" : "none" }}>
                        {t.title}
                      </div>
                      {t.notes && <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>{t.notes}</div>}
                    </div>
                  </div>

                  <div>
                    {t.orderId ? (
                      <span
                        onClick={() => onOpenOrder && onOpenOrder(t.orderId)}
                        style={{ fontFamily: "monospace", fontSize: 11.5, color: "#378ADD", cursor: "pointer", fontWeight: 600 }}
                      >
                        {t.orderId}
                      </span>
                    ) : (
                      <span style={{ color: "#B0B2BA", fontSize: 11.5 }}>General</span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: "#565A66" }}>{t.dept || "All"}</div>
                  <div style={{ fontSize: 12, color: "#1B2130" }}>{t.assignee || "—"}</div>
                  <div style={{ fontSize: 12, color: "#8A8D98" }}>{t.dueDate || "—"}</div>

                  <div>
                    <span style={{ background: pStyle.bg, color: pStyle.fg, fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, textTransform: "capitalize", marginRight: 6 }}>
                      {t.priority}
                    </span>
                    {statusPill(t.status)}
                  </div>

                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                    <button
                      onClick={() => {
                        setAssignPrefill({
                          orderId: t.orderId || "",
                          dept: t.dept || "Merchandising",
                          taskName: t.title
                        });
                        setShowAssignModal(true);
                      }}
                      title="Assign work to external supplier"
                      style={{
                        background: "#F0EFFB",
                        color: "#534AB7",
                        border: "1px solid #D6D2F3",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3
                      }}
                    >
                      <Layers size={12} />
                      Assign Supplier
                    </button>
                    <button
                      onClick={() => onDeleteTask && onDeleteTask(t.id)}
                      title="Delete task"
                      style={{
                        background: "#FCEBEB",
                        color: "#791F1F",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      )}

      {/* 2. T&A Schedule Stage Tasks Section */}
      {(taskTab === "all" || taskTab === "tna") && (
        <Card>
          <CardHeader title={`${role?.dept || "Department"} — T&A stage schedule tasks`} sub="Auto-synced from active order stage trackers" />
          <GroupedTaskList rows={tnaRows} onOpenOrder={onOpenOrder} emptyText="No open stage tasks for this role right now." />
        </Card>
      )}

      {/* Add Task Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(2px)"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 14,
            width: "100%",
            maxWidth: 520,
            padding: 24,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#111827" }}>Add New Task</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Task Title / Action Item *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Review and approve lab dip test report"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Related Order (optional)</label>
                  <select
                    value={form.orderId}
                    onChange={e => setForm({ ...form, orderId: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                  >
                    <option value="">-- General Task / None --</option>
                    {Array.from(new Map((orders || []).filter(o => !o.isDeleted).map(o => [o.id, o])).values()).map((o, idx) => (
                      <option key={o.primaryId || `${o.id}-${idx}`} value={o.id}>{o.id} - {o.style}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Department</label>
                  <select
                    value={form.dept}
                    onChange={e => setForm({ ...form, dept: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                  >
                    {["Merchandising", "Program", "Planning", "Purchase – Fabric", "Purchase – Trims", "Sample", "Store", "Cutting", "Production", "Quality", "Finishing", "Logistics & Documentation", "CAD", "VAP", "Compliance & Certification"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Assignee</label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh"
                    value={form.assignee}
                    onChange={e => setForm({ ...form, assignee: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Due Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 20 May"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Priority</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["low", "medium", "high"].map(p => (
                    <label
                      key={p}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        border: "1px solid",
                        borderColor: form.priority === p ? "#1F9E8D" : "#E5E7EB",
                        borderRadius: 6,
                        background: form.priority === p ? "#E1F5EE" : "#FAFAFB",
                        fontSize: 12,
                        fontWeight: 600,
                        textAlign: "center",
                        cursor: "pointer",
                        textTransform: "capitalize",
                        color: form.priority === p ? "#085041" : "#4B5563"
                      }}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={form.priority === p}
                        onChange={() => setForm({ ...form, priority: p })}
                        style={{ display: "none" }}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or instructions..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 7,
                    border: "1px solid #D1D5DB",
                    background: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#4B5563",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: 7,
                    border: "none",
                    background: "#1F9E8D",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#FFFFFF",
                    cursor: "pointer"
                  }}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Work to Supplier Modal */}
      {showAssignModal && (
        <AssignWorkModal
          orders={orders}
          tasks={tasks}
          suppliers={suppliers}
          prefillOrderId={assignPrefill?.orderId}
          prefillDept={assignPrefill?.dept}
          prefillTaskName={assignPrefill?.taskName}
          onClose={() => {
            setShowAssignModal(false);
            setAssignPrefill(null);
          }}
          onAssign={onAssignWork}
        />
      )}
    </div>
  );
}

export function CalendarPage({ orders, onOpenOrder }) {
  return (
    <div>
      <PageHeader title="Timeline / calendar" sub="Full 21-step T&A schedule across all active orders" />
      <Card>
        {orders.map(o => (
          <div key={o.id} style={{ marginBottom: 20 }}>
            <div onClick={() => onOpenOrder(o.id)} style={{ fontSize: 12.5, fontWeight: 600, color: "#1B2130", marginBottom: 8, cursor: "pointer" }}>
              {o.id} · {o.style} <span style={{ color: "#8A8D98", fontWeight: 400 }}>({o.buyer}, ship {o.ship})</span>
            </div>
            <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
              {(o.stages || []).map((s, i) => (
                <div
                  key={i}
                  onClick={() => onOpenOrder(o.id)}
                  title={`${s.name} — ${s.status} (${s.dept})`}
                  style={{
                    flex: "0 0 32px", height: 22, borderRadius: 5, cursor: "pointer",
                    background: s.status === "done" ? "#1F9E8D" : s.status === "in_progress" ? (s.reason ? "#D64545" : "#E2A83B") : "#EDEEF1"
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function ApprovalsPage({ orders = [], onOpenOrder, onApproveCosting, onRejectCosting, role = {} }) {
  const rows = useMemo(() => collectTasks(orders, null).filter(r => r.stage.name.toLowerCase().includes("approval") || r.stage.name === "Tech Pack Received"), [orders]);
  const pendingCount = rows.filter(r => r.stage.status !== "done").length;

  const costingPendingOrders = useMemo(() => {
    return orders.filter(o => o.costingApproval && o.costingApproval.status === "submitted");
  }, [orders]);

  const costingApprovedOrders = useMemo(() => {
    return orders.filter(o => o.costingApproval && o.costingApproval.status === "approved");
  }, [orders]);

  return (
    <div>
      <PageHeader
        title="Approvals"
        sub={`Management and buyer approval checkpoints — Costing sign-offs (${costingPendingOrders.length} pending), Fit, Size Set, and PP (${pendingCount} pending).`}
      />

      {/* COSTING APPROVALS SECTION */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
              <span>Costing Sign-off (DGM / MD Approvals)</span>
              {costingPendingOrders.length > 0 && (
                <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
                  {costingPendingOrders.length} Pending
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
              Requests submitted from order costing sheets requiring Managing Director authorization
            </div>
          </div>
        </div>

        {costingPendingOrders.length === 0 && costingApprovedOrders.length === 0 ? (
          <div style={{ padding: "18px 0", textAlign: "center", color: "#9CA3AF", fontSize: 12.5 }}>
            No costing approval requests at this time. Submit for approval from the order Costing tab.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {costingPendingOrders.map(o => (
              <div
                key={o.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 8,
                  padding: "12px 16px"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      onClick={() => onOpenOrder && onOpenOrder(o.id)}
                      style={{ cursor: "pointer", fontWeight: 700, color: "#1E293B", textDecoration: "underline", fontSize: 13 }}
                    >
                      PO #{o.id} — {o.style}
                    </span>
                    <span style={{ fontSize: 11, color: "#6B7280" }}>({o.buyer})</span>
                    <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 999 }}>
                      ⏳ Pending Sign-off
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#78350F", marginTop: 4 }}>
                    Total Cost: <b>₹{(o.costingApproval?.grandTotal || 0).toLocaleString()}</b> per pc · Submitted by {o.costingApproval?.submittedBy || "Merchandiser"} on {o.costingApproval?.submittedDate || "Today"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => onOpenOrder && onOpenOrder(o.id)}
                    style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", color: "#334155", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Review Sheet
                  </button>
                  {role?.dept === "Executive" || role?.label?.toLowerCase().includes("md") || role?.label?.toLowerCase().includes("managing director") ? (
                    <>
                      <button
                        onClick={() => onApproveCosting && onApproveCosting(o.id, role?.label || "Managing Director (MD)")}
                        style={{ background: "#10B981", border: "none", color: "#FFFFFF", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 2px rgba(16, 185, 129, 0.2)" }}
                      >
                        ✓ Approve (Pass)
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt("Reason for rejecting costing?", "Revisions needed");
                          if (reason !== null && onRejectCosting) onRejectCosting(o.id, reason);
                        }}
                        style={{ background: "#EF4444", border: "none", color: "#FFFFFF", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: 11.5, color: "#92400E", fontWeight: 700, background: "#FEF3C7", padding: "5px 10px", borderRadius: 6 }}>
                      Awaiting MD Sign-off
                    </span>
                  )}
                </div>
              </div>
            ))}

            {costingApprovedOrders.slice(0, 3).map(o => (
              <div
                key={o.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: 8,
                  padding: "10px 16px",
                  opacity: 0.9
                }}
              >
                <div>
                  <span
                    onClick={() => onOpenOrder && onOpenOrder(o.id)}
                    style={{ cursor: "pointer", fontWeight: 600, color: "#166534", textDecoration: "underline", fontSize: 12.5 }}
                  >
                    PO #{o.id} — {o.style} ({o.buyer})
                  </span>
                  <div style={{ fontSize: 11, color: "#15803D", marginTop: 2 }}>
                    ✓ Approved by {o.costingApproval?.approvedBy || "MD"} ({o.costingApproval?.approvedDate || "Approved"}) · Status: Pass
                  </div>
                </div>
                <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999 }}>
                  ✓ Pass
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
          Buyer Stage Approvals & Tech Pack Receipt
        </div>
        <GroupedTaskList rows={rows} onOpenOrder={onOpenOrder} emptyText="No approval items right now." />
      </Card>
    </div>
  );
}

export function ProductionPage({ orders, onOpenOrder }) {
  const rows = useMemo(() => collectTasks(orders, null).filter(r => ["Cutting", "Production"].includes(r.dept)), [orders]);
  return (
    <div>
      <PageHeader title="Production" sub="Cutting room and production floor status across all orders, grouped by delay cause" />
      <Card>
        <GroupedTaskList rows={rows} onOpenOrder={onOpenOrder} emptyText="No production-stage tasks right now." />
      </Card>
    </div>
  );
}

export function QualityPage({ orders, onOpenOrder }) {
  const rows = useMemo(() => collectTasks(orders, "Quality"), [orders]);
  const reworkCount = rows.filter(r => r.stage.reason === "Quality rework").length;
  return (
    <div>
      <PageHeader title="Quality" sub="Fabric inspection and final inspection checkpoints" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Checkpoints tracked</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{rows.length}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Flagged for rework</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>{reworkCount}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>First pass rate</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>93.4%</div></Card>
      </div>
      <Card>
        <GroupedTaskList rows={rows} onOpenOrder={onOpenOrder} emptyText="No quality checkpoints yet." />
      </Card>
    </div>
  );
}

export function CompliancePage({
  certifications = [],
  compliances = [],
  orders = [],
  roster = [],
  role = {},
  onAddCertification,
  onUpdateCertification,
  onDeleteCertification,
  onRestoreCertification,
  onAddCompliance,
  onUpdateCompliance,
  onDeleteCompliance,
  onRestoreCompliance,
  onCycleCert,
  onOpenOrder
}) {
  const [activeTab, setActiveTab] = useState("compliances"); // "compliances" | "history"
  
  // Modals state
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [showAddCompModal, setShowAddCompModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null); // for Details modal
  const [editingCert, setEditingCert] = useState(null); // for Edit modal
  const [selectedComp, setSelectedComp] = useState(null); // for Details / Workflow modal
  const [editingComp, setEditingComp] = useState(null); // for Edit modal
  const [failureReasonPrompt, setFailureReasonPrompt] = useState(false);
  const [failureReasonText, setFailureReasonText] = useState("");

  // Certification Filters state
  const [certSearch, setCertSearch] = useState("");
  const [certStatusFilter, setCertStatusFilter] = useState("all");
  const [certBuyerFilter, setCertBuyerFilter] = useState("all");
  const [certTypeFilter, setCertTypeFilter] = useState("all");
  const [certExpiryFilter, setCertExpiryFilter] = useState("all");
  const [certOrderFilter, setCertOrderFilter] = useState("all");

  // Compliance Filters state
  const [compSearch, setCompSearch] = useState("");
  const [compStatusFilter, setCompStatusFilter] = useState("all");
  const [compPriorityFilter, setCompPriorityFilter] = useState("all");
  const [compBuyerFilter, setCompBuyerFilter] = useState("all");
  const [compCategoryFilter, setCompCategoryFilter] = useState("all");
  const [compDeptFilter, setCompDeptFilter] = useState("all");
  const [compOrderFilter, setCompOrderFilter] = useState("all");

  // Certification form state
  const [certForm, setCertForm] = useState({
    name: "GOTS",
    customName: "",
    certNo: "",
    certType: "Organic Textile",
    issuingOrg: "Control Union",
    buyer: "All Buyers",
    orderId: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "Approved",
    file: null,
    fileName: "",
    notes: ""
  });

  // Compliance form state
  const [compForm, setCompForm] = useState({
    name: "",
    category: "Buyer Requirement",
    buyer: "Zara",
    orderId: "",
    department: "Compliance & Certification",
    responsiblePerson: "Suresh",
    dueDate: "20 May",
    linkedCert: "GOTS",
    description: "",
    status: "Pending",
    priority: "High",
    notes: ""
  });

  // Date-based helper functions
  const now = new Date();
  const getDaysUntilExpiry = (expiryDateStr) => {
    if (!expiryDateStr) return null;
    const exp = new Date(expiryDateStr);
    if (isNaN(exp.getTime())) return null;
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEffectiveCertStatus = (c) => {
    if (c.status === "Expired") return "Expired";
    const days = getDaysUntilExpiry(c.expiryDate);
    if (days !== null) {
      if (days < 0) return "Expired";
      if (days <= 30 && c.status === "Approved") return "Expiring Soon";
    }
    return c.status || "Draft";
  };

  // Filter Active vs Deleted
  const activeCerts = useMemo(() => certifications.filter(c => c.isDeleted !== true), [certifications]);
  const deletedCerts = useMemo(() => certifications.filter(c => c.isDeleted === true), [certifications]);
  const activeCompliances = useMemo(() => compliances.filter(c => c.isDeleted !== true), [compliances]);
  const deletedCompliances = useMemo(() => compliances.filter(c => c.isDeleted === true), [compliances]);

  // Dynamic KPI calculations
  const certKpis = useMemo(() => {
    const total = activeCerts.length;
    const approved = activeCerts.filter(c => c.status === "Approved" || c.status === "approved").length;
    const pendingReview = activeCerts.filter(c => c.status === "Under Review" || c.status === "Applied" || c.status === "applied" || c.status === "Draft").length;
    
    let expired = 0;
    let expiringSoon = 0;
    activeCerts.forEach(c => {
      const days = getDaysUntilExpiry(c.expiryDate);
      if (c.status === "Expired" || (days !== null && days < 0)) {
        expired++;
      } else if (days !== null && days >= 0 && days <= 30) {
        expiringSoon++;
      }
    });

    return { total, approved, expiringSoon, expired, pendingReview };
  }, [activeCerts]);

  const compKpis = useMemo(() => {
    const total = activeCompliances.length;
    const passed = activeCompliances.filter(c => c.status === "Passed").length;
    const pending = activeCompliances.filter(c => c.status === "Pending" || c.status === "In Progress").length;
    const failed = activeCompliances.filter(c => c.status === "Failed").length;
    return { total, passed, pending, failed };
  }, [activeCompliances]);

  // Filtered Certifications
  const filteredCerts = useMemo(() => {
    return activeCerts.filter(c => {
      const searchMatch = !certSearch.trim() ||
        (c.name || "").toLowerCase().includes(certSearch.toLowerCase()) ||
        (c.certNo || "").toLowerCase().includes(certSearch.toLowerCase()) ||
        (c.issuingOrg || "").toLowerCase().includes(certSearch.toLowerCase()) ||
        (c.buyer || "").toLowerCase().includes(certSearch.toLowerCase()) ||
        (c.orderId || "").toLowerCase().includes(certSearch.toLowerCase());

      const effectiveStatus = getEffectiveCertStatus(c);
      const statusMatch = certStatusFilter === "all" ||
        (certStatusFilter === "Approved" && (c.status === "Approved" || c.status === "approved")) ||
        (certStatusFilter === "Applied" && (c.status === "Applied" || c.status === "applied")) ||
        (certStatusFilter === "Under Review" && c.status === "Under Review") ||
        (certStatusFilter === "Draft" && c.status === "Draft") ||
        (certStatusFilter === "Rejected" && c.status === "Rejected") ||
        (certStatusFilter === "Expired" && (c.status === "Expired" || effectiveStatus === "Expired")) ||
        (certStatusFilter === "Expiring Soon" && effectiveStatus === "Expiring Soon");

      const buyerMatch = certBuyerFilter === "all" || c.buyer === certBuyerFilter || c.buyer === "All Buyers";
      const typeMatch = certTypeFilter === "all" || (c.certType || "").toLowerCase().includes(certTypeFilter.toLowerCase());
      const orderMatch = certOrderFilter === "all" || c.orderId === certOrderFilter;

      const expiryMatch = certExpiryFilter === "all" ||
        (certExpiryFilter === "expired" && effectiveStatus === "Expired") ||
        (certExpiryFilter === "expiring_soon" && effectiveStatus === "Expiring Soon") ||
        (certExpiryFilter === "valid" && effectiveStatus !== "Expired" && effectiveStatus !== "Expiring Soon");

      return searchMatch && statusMatch && buyerMatch && typeMatch && orderMatch && expiryMatch;
    });
  }, [activeCerts, certSearch, certStatusFilter, certBuyerFilter, certTypeFilter, certExpiryFilter, certOrderFilter]);

  // Filtered Compliances
  const filteredCompliances = useMemo(() => {
    return activeCompliances.filter(c => {
      const searchMatch = !compSearch.trim() ||
        (c.name || "").toLowerCase().includes(compSearch.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(compSearch.toLowerCase()) ||
        (c.buyer || "").toLowerCase().includes(compSearch.toLowerCase()) ||
        (c.orderId || "").toLowerCase().includes(compSearch.toLowerCase()) ||
        (c.responsiblePerson || "").toLowerCase().includes(compSearch.toLowerCase());

      const statusMatch = compStatusFilter === "all" || c.status === compStatusFilter;
      const priorityMatch = compPriorityFilter === "all" || c.priority === compPriorityFilter;
      const buyerMatch = compBuyerFilter === "all" || c.buyer === compBuyerFilter || c.buyer === "All Buyers";
      const categoryMatch = compCategoryFilter === "all" || c.category === compCategoryFilter;
      const deptMatch = compDeptFilter === "all" || c.department === compDeptFilter;
      const orderMatch = compOrderFilter === "all" || c.orderId === compOrderFilter;

      return searchMatch && statusMatch && priorityMatch && buyerMatch && categoryMatch && deptMatch && orderMatch;
    });
  }, [activeCompliances, compSearch, compStatusFilter, compPriorityFilter, compBuyerFilter, compCategoryFilter, compDeptFilter, compOrderFilter]);

  // Handler for creating Certification
  const handleCreateCert = (e) => {
    e.preventDefault();
    const finalName = certForm.name === "Other" ? certForm.customName : certForm.name;
    if (!finalName.trim()) return;

    const certData = {
      name: finalName.trim(),
      certNo: certForm.certNo.trim() || `${finalName.toUpperCase().replace(/\s+/g, "-")}-${Date.now().toString().slice(-4)}`,
      certType: certForm.certType.trim() || "Compliance Certification",
      issuingOrg: certForm.issuingOrg.trim() || "Accredited Bureau",
      buyer: certForm.buyer || "All Buyers",
      orderId: certForm.orderId || null,
      issueDate: certForm.issueDate || new Date().toISOString().split("T")[0],
      expiryDate: certForm.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: certForm.status || "Approved",
      file: certForm.fileName ? certForm.fileName : null,
      notes: certForm.notes.trim()
    };

    onAddCertification(certData);
    setShowAddCertModal(false);
    setCertForm({
      name: "GOTS",
      customName: "",
      certNo: "",
      certType: "Organic Textile",
      issuingOrg: "Control Union",
      buyer: "All Buyers",
      orderId: "",
      issueDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Approved",
      file: null,
      fileName: "",
      notes: ""
    });
  };

  // Handler for creating Compliance
  const handleCreateComp = (e) => {
    e.preventDefault();
    if (!compForm.name.trim()) return;

    const compData = {
      name: compForm.name.trim(),
      category: compForm.category || "Buyer Requirement",
      buyer: compForm.buyer || "All Buyers",
      orderId: compForm.orderId || null,
      department: compForm.department || "Compliance & Certification",
      responsiblePerson: compForm.responsiblePerson || "Suresh",
      dueDate: compForm.dueDate || "20 May",
      linkedCert: compForm.linkedCert || "",
      description: compForm.description.trim(),
      status: compForm.status || "Pending",
      priority: compForm.priority || "High",
      notes: compForm.notes.trim()
    };

    onAddCompliance(compData);
    setShowAddCompModal(false);
    setCompForm({
      name: "",
      category: "Buyer Requirement",
      buyer: "Zara",
      orderId: "",
      department: "Compliance & Certification",
      responsiblePerson: "Suresh",
      dueDate: "20 May",
      linkedCert: "GOTS",
      description: "",
      status: "Pending",
      priority: "High",
      notes: ""
    });
  };

  // Update existing certification
  const handleSaveEditCert = (e) => {
    e.preventDefault();
    if (!editingCert) return;
    onUpdateCertification(editingCert.id || editingCert.key, editingCert);
    setEditingCert(null);
  };

  // Update existing compliance
  const handleSaveEditComp = (e) => {
    e.preventDefault();
    if (!editingComp) return;
    onUpdateCompliance(editingComp.id, editingComp);
    setEditingComp(null);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#1B2130" }}>Compliance & Certification</h1>
          <div style={{ fontSize: 13.5, color: "#6B7280", marginTop: 4 }}>
            Track buyer requirements, certifications, documents, approvals and expiry dates.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowAddCompModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#534AB7",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <Plus size={15} /> Add Compliance
          </button>
        </div>
      </div>

      {/* Compliance KPI Cards Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <Card style={{ padding: "14px 16px", borderLeft: "4px solid #4F46E5" }}>
          <div style={{ fontSize: 11.5, color: "#8A8D98", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Compliance Requirements</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "#1B2130" }}>{compKpis.total}</div>
        </Card>
        <Card style={{ padding: "14px 16px", borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: 11.5, color: "#8A8D98", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Passed</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "#059669" }}>{compKpis.passed}</div>
        </Card>
        <Card style={{ padding: "14px 16px", borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: 11.5, color: "#8A8D98", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Pending</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "#D97706" }}>{compKpis.pending}</div>
        </Card>
        <Card style={{ padding: "14px 16px", borderLeft: "4px solid #EF4444" }}>
          <div style={{ fontSize: 11.5, color: "#8A8D98", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Failed</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "#DC2626" }}>{compKpis.failed}</div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: "flex", gap: 10, borderBottom: "2px solid #E5E7EB", marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab("compliances")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 18px",
            border: "none",
            borderBottom: activeTab === "compliances" ? "3px solid #534AB7" : "3px solid transparent",
            background: "none",
            color: activeTab === "compliances" ? "#534AB7" : "#6B7280",
            fontWeight: activeTab === "compliances" ? 700 : 500,
            fontSize: 14,
            cursor: "pointer",
            marginBottom: -2
          }}
        >
          <ShieldCheck size={16} /> Compliance Requirements ({activeCompliances.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 18px",
            border: "none",
            borderBottom: activeTab === "history" ? "3px solid #6B7280" : "3px solid transparent",
            background: "none",
            color: activeTab === "history" ? "#1F2937" : "#6B7280",
            fontWeight: activeTab === "history" ? 700 : 500,
            fontSize: 14,
            cursor: "pointer",
            marginBottom: -2
          }}
        >
          <Archive size={16} /> Deleted / History ({deletedCompliances.length})
        </button>
      </div>

      {/* TAB 1: CERTIFICATIONS */}
      {activeTab === "certifications" && (
        <div>
          {/* Filters Bar */}
          <Card style={{ padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr 1fr", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search certification, number, buyer..."
                  value={certSearch}
                  onChange={e => setCertSearch(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                />
              </div>
              <select
                value={certStatusFilter}
                onChange={e => setCertStatusFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Under Review">Under Review</option>
                <option value="Applied">Applied</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
                <option value="Draft">Draft</option>
                <option value="Rejected">Rejected</option>
              </select>
              <select
                value={certBuyerFilter}
                onChange={e => setCertBuyerFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Buyers</option>
                {BUYER_LIST.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={certTypeFilter}
                onChange={e => setCertTypeFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Types</option>
                <option value="Organic">Organic Textile</option>
                <option value="Chemical">Chemical & Safety</option>
                <option value="Cotton">Cotton Initiative</option>
                <option value="Social">Social Compliance</option>
                <option value="Environmental">Environmental</option>
              </select>
              <select
                value={certExpiryFilter}
                onChange={e => setCertExpiryFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Expiry</option>
                <option value="valid">Valid & Active</option>
                <option value="expiring_soon">Expiring Soon (≤30d)</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={certOrderFilter}
                onChange={e => setCertOrderFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Orders</option>
                {Array.from(new Map((orders || []).filter(o => !o.isDeleted).map(o => [o.id, o])).values()).map((o, idx) => (
                  <option key={o.primaryId || `${o.id}-${idx}`} value={o.id}>{o.id} ({o.buyer})</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Certifications Table */}
          <Card style={{ padding: "0 0 8px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1.2fr 0.9fr 0.9fr 0.9fr 0.9fr 1.1fr 1fr 1fr", fontSize: 11.5, fontWeight: 600, color: "#6B7280", padding: "12px 16px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
              <div>Certification</div>
              <div>Certificate No.</div>
              <div>Type</div>
              <div>Buyer</div>
              <div>Order / PO</div>
              <div>Issue Date</div>
              <div>Expiry Date</div>
              <div>Status</div>
              <div>Document</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>

            {filteredCerts.length === 0 ? (
              <div style={{ padding: "36px 16px", textAlign: "center", color: "#9CA3AF" }}>
                <Award size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#4B5563" }}>No certifications match your filters</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing search criteria or click "+ Add Certification" to create one.</div>
              </div>
            ) : (
              filteredCerts.map(c => {
                const effectiveStatus = getEffectiveCertStatus(c);
                const days = getDaysUntilExpiry(c.expiryDate);
                const isExpSoon = days !== null && days >= 0 && days <= 30 && c.status === "Approved";
                const isExp = c.status === "Expired" || (days !== null && days < 0);
                const st = CERT_STATUS_STYLE[c.status] || CERT_STATUS_STYLE[effectiveStatus] || CERT_STATUS_STYLE.Draft;

                return (
                  <div
                    key={c.id || c.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1.2fr 1.2fr 0.9fr 0.9fr 0.9fr 0.9fr 1.1fr 1fr 1fr",
                      alignItems: "center",
                      fontSize: 12.5,
                      padding: "12px 16px",
                      borderBottom: "1px solid #F3F4F6",
                      background: isExp ? "#FEF2F2" : isExpSoon ? "#FFFBEB" : "#FFFFFF"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
                        <Award size={14} color="#1F9E8D" />
                        {c.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{c.issuingOrg || "Standard Org"}</div>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 11.5, color: "#374151", fontWeight: 600 }}>
                      {c.certNo || "—"}
                    </div>
                    <div style={{ color: "#4B5563" }}>{c.certType || "Standard"}</div>
                    <div>
                      <span style={{ background: "#F3F4F6", color: "#374151", padding: "2px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 600 }}>
                        {c.buyer || "All Buyers"}
                      </span>
                    </div>
                    <div>
                      {c.orderId ? (
                        <span
                          onClick={() => onOpenOrder && onOpenOrder(c.orderId)}
                          style={{ cursor: "pointer", color: "#534AB7", fontWeight: 600, fontFamily: "monospace", fontSize: 11.5, textDecoration: "underline" }}
                        >
                          {c.orderId}
                        </span>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>—</span>
                      )}
                    </div>
                    <div style={{ color: "#4B5563", fontSize: 11.5 }}>{c.issueDate || "—"}</div>
                    <div>
                      <div style={{ color: isExp ? "#DC2626" : isExpSoon ? "#D97706" : "#374151", fontWeight: isExp || isExpSoon ? 700 : 500, fontSize: 11.5 }}>
                        {c.expiryDate || "—"}
                      </div>
                      {isExpSoon && <div style={{ fontSize: 10, color: "#D97706", fontWeight: 700 }}>({days}d left)</div>}
                      {isExp && <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 700 }}>(Expired)</div>}
                    </div>
                    <div>
                      {isExp ? (
                        <span style={{ background: "#FEE2E2", color: "#991B1B", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
                          Expired
                        </span>
                      ) : isExpSoon ? (
                        <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
                          Expiring Soon
                        </span>
                      ) : (
                        <span
                          onClick={() => onCycleCert && onCycleCert(c.key || c.id)}
                          title="Click to cycle status"
                          style={{ cursor: "pointer", background: st.bg, color: st.fg, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}
                        >
                          {st.label || c.status}
                        </span>
                      )}
                    </div>
                    <div>
                      {c.file ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#059669", fontSize: 11.5, fontWeight: 600 }}>
                          <CheckCircle size={12} /> Attached
                        </span>
                      ) : (
                        <span style={{ color: "#9CA3AF", fontSize: 11.5 }}>Pending</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setSelectedCert(c)}
                        title="View Details"
                        style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 6, padding: "4px 7px", cursor: "pointer" }}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => setEditingCert({ ...c })}
                        title="Edit Certification"
                        style={{ background: "#EEF2FF", color: "#4F46E5", border: "none", borderRadius: 6, padding: "4px 7px", cursor: "pointer" }}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => onDeleteCertification && onDeleteCertification(c.id || c.key)}
                        title="Delete Certification (Soft delete)"
                        style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "4px 7px", cursor: "pointer" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: COMPLIANCE REQUIREMENTS */}
      {activeTab === "compliances" && (
        <div>
          {/* Filters Bar */}
          <Card style={{ padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search requirement, description, assignee..."
                  value={compSearch}
                  onChange={e => setCompSearch(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                />
              </div>
              <select
                value={compStatusFilter}
                onChange={e => setCompStatusFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Waived">Waived</option>
              </select>
              <select
                value={compPriorityFilter}
                onChange={e => setCompPriorityFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select
                value={compBuyerFilter}
                onChange={e => setCompBuyerFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Buyers</option>
                {BUYER_LIST.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={compCategoryFilter}
                onChange={e => setCompCategoryFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Categories</option>
                {COMPLIANCE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select
                value={compDeptFilter}
                onChange={e => setCompDeptFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Departments</option>
                {Object.keys(ORG_STRUCTURE).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={compOrderFilter}
                onChange={e => setCompOrderFilter(e.target.value)}
                style={{ padding: "7px 8px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5, color: "#374151" }}
              >
                <option value="all">All Orders</option>
                {Array.from(new Map((orders || []).filter(o => !o.isDeleted).map(o => [o.id, o])).values()).map((o, idx) => (
                  <option key={o.primaryId || `${o.id}-${idx}`} value={o.id}>{o.id}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Compliance Table */}
          <Card style={{ padding: "0 0 8px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.1fr 0.9fr 0.9fr 1.1fr 0.9fr 1fr 0.8fr 0.9fr 1.4fr", fontSize: 11.5, fontWeight: 600, color: "#6B7280", padding: "12px 16px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
              <div>Requirement</div>
              <div>Category</div>
              <div>Buyer</div>
              <div>Order / PO</div>
              <div>Responsible</div>
              <div>Due Date</div>
              <div>Linked Cert</div>
              <div>Priority</div>
              <div>Status</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>

            {filteredCompliances.length === 0 ? (
              <div style={{ padding: "36px 16px", textAlign: "center", color: "#9CA3AF" }}>
                <ShieldCheck size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#4B5563" }}>No compliance requirements match your filters</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Click "+ Add Compliance" to create a new requirement.</div>
              </div>
            ) : (
              filteredCompliances.map(comp => {
                const st = COMPLIANCE_STATUS_STYLE[comp.status] || COMPLIANCE_STATUS_STYLE.Pending;
                const pr = COMPLIANCE_PRIORITY_STYLE[comp.priority] || COMPLIANCE_PRIORITY_STYLE.Medium;

                return (
                  <div
                    key={comp.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.6fr 1.1fr 0.9fr 0.9fr 1.1fr 0.9fr 1fr 0.8fr 0.9fr 1.4fr",
                      alignItems: "center",
                      fontSize: 12.5,
                      padding: "12px 16px",
                      borderBottom: "1px solid #F3F4F6",
                      background: comp.status === "Failed" ? "#FEF2F2" : "#FFFFFF"
                    }}
                  >
                    <div>
                      <div
                        onClick={() => setSelectedComp(comp)}
                        style={{ fontWeight: 700, color: "#111827", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <ShieldCheck size={14} color="#534AB7" />
                        {comp.name}
                      </div>
                      {comp.description && (
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 158 }}>
                          {comp.description}
                        </div>
                      )}
                    </div>
                    <div>
                      <span style={{ background: "#F3F4F6", color: "#4B5563", fontSize: 11, padding: "2px 6px", borderRadius: 4 }}>
                        {comp.category}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: "#374151" }}>{comp.buyer || "All Buyers"}</div>
                    <div>
                      {comp.orderId ? (
                        <span
                          onClick={() => onOpenOrder && onOpenOrder(comp.orderId)}
                          style={{ cursor: "pointer", color: "#534AB7", fontWeight: 600, fontFamily: "monospace", fontSize: 11.5, textDecoration: "underline" }}
                        >
                          {comp.orderId}
                        </span>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>—</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1F2937" }}>{comp.responsiblePerson || "Unassigned"}</div>
                      <div style={{ fontSize: 10.5, color: "#8A8D98" }}>{comp.department || "Compliance"}</div>
                    </div>
                    <div style={{ color: "#4B5563", fontSize: 11.5 }}>{comp.dueDate || "—"}</div>
                    <div>
                      {comp.linkedCert ? (
                        <span style={{ background: "#EEF2FF", color: "#4338CA", padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {comp.linkedCert}
                        </span>
                      ) : (
                        <span style={{ color: "#9CA3AF" }}>—</span>
                      )}
                    </div>
                    <div>
                      <span style={{ background: pr.bg, color: pr.fg, fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                        {comp.priority || "Medium"}
                      </span>
                    </div>
                    <div>
                      <span style={{ background: st.bg, color: st.fg, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
                        {comp.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setSelectedComp(comp)}
                        title="View Workflow"
                        style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => setEditingComp({ ...comp })}
                        title="Edit Compliance"
                        style={{ background: "#EEF2FF", color: "#4F46E5", border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => onUpdateCompliance(comp.id, { status: "Passed", completedAt: new Date().toISOString() })}
                        title="Mark Passed"
                        style={{ background: "#ECFDF5", color: "#059669", border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer", fontWeight: 600, fontSize: 11 }}
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => {
                          setSelectedComp(comp);
                          setFailureReasonPrompt(true);
                        }}
                        title="Mark Failed"
                        style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer", fontWeight: 600, fontSize: 11 }}
                      >
                        Fail
                      </button>
                      <button
                        onClick={() => onDeleteCompliance && onDeleteCompliance(comp.id)}
                        title="Delete (Soft delete)"
                        style={{ background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: DELETED / HISTORY */}
      {activeTab === "history" && (
        <div>
          {/* Deleted Compliances */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                Deleted Compliance Requirements ({deletedCompliances.length})
              </div>
              <span style={{ fontSize: 12, color: "#6B7280" }}>Recoverable requirement records</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.1fr 1fr 1fr 1fr 1.2fr 0.8fr", fontSize: 11.5, color: "#6B7280", padding: "0 4px 8px", borderBottom: "1px solid #E5E7EB" }}>
              <div>Requirement</div>
              <div>Category</div>
              <div>Buyer</div>
              <div>Order</div>
              <div>Status</div>
              <div>Deleted At</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>

            {deletedCompliances.length === 0 ? (
              <div style={{ padding: "18px 0", textAlign: "center", color: "#9CA3AF", fontSize: 12.5 }}>
                No deleted compliance requirements in archive.
              </div>
            ) : (
              deletedCompliances.map(comp => (
                <div
                  key={comp.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1.1fr 1fr 1fr 1fr 1.2fr 0.8fr",
                    alignItems: "center",
                    fontSize: 12.5,
                    padding: "10px 4px",
                    borderBottom: "1px solid #F3F4F6",
                    opacity: 0.8
                  }}
                >
                  <div style={{ textDecoration: "line-through", color: "#6B7280", fontWeight: 600 }}>{comp.name}</div>
                  <div>{comp.category}</div>
                  <div>{comp.buyer}</div>
                  <div>{comp.orderId || "—"}</div>
                  <div><span style={{ fontSize: 11, color: "#6B7280" }}>{comp.status}</span></div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{comp.deletedAt ? new Date(comp.deletedAt).toLocaleDateString() : "Archived"}</div>
                  <div style={{ textAlign: "right" }}>
                    <button
                      onClick={() => onRestoreCompliance(comp.id)}
                      style={{ background: "#ECFDF5", color: "#059669", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}
                    >
                      <RotateCcw size={11} /> Restore
                    </button>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {/* MODAL 1: ADD CERTIFICATION */}
      {showAddCertModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={() => setShowAddCertModal(false)}
        >
          <div
            style={{ background: "#FFFFFF", borderRadius: 12, width: "100%", maxWidth: 640, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Add Certification</h3>
                <p style={{ fontSize: 12.5, color: "#6B7280", margin: "4px 0 0" }}>Register a buyer, facility, or transaction certificate</p>
              </div>
              <button onClick={() => setShowAddCertModal(false)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateCert}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Certification Name *</label>
                  <select
                    value={certForm.name}
                    onChange={e => setCertForm({ ...certForm, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    {CERT_NAME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>
                {certForm.name === "Other" && (
                  <div>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Custom Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bluesign"
                      value={certForm.customName}
                      onChange={e => setCertForm({ ...certForm, customName: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                    />
                  </div>
                )}
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Certificate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. GOTS-2026-001"
                    value={certForm.certNo}
                    onChange={e => setCertForm({ ...certForm, certNo: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Certification Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Organic Textile / Chemical Safety"
                    value={certForm.certType}
                    onChange={e => setCertForm({ ...certForm, certType: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Issuing Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Control Union / Hohenstein"
                    value={certForm.issuingOrg}
                    onChange={e => setCertForm({ ...certForm, issuingOrg: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Applicable Buyer</label>
                  <select
                    value={certForm.buyer}
                    onChange={e => setCertForm({ ...certForm, buyer: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    {BUYER_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Applicable Order / PO</label>
                  <select
                    value={certForm.orderId}
                    onChange={e => setCertForm({ ...certForm, orderId: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="">None (Facility-wide / General)</option>
                    {Array.from(new Map((orders || []).filter(o => !o.isDeleted).map(o => [o.id, o])).values()).map((o, idx) => (
                      <option key={o.primaryId || `${o.id}-${idx}`} value={o.id}>{o.id} ({o.buyer} · {o.style})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Issue Date</label>
                  <input
                    type="date"
                    value={certForm.issueDate}
                    onChange={e => setCertForm({ ...certForm, issueDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Expiry Date</label>
                  <input
                    type="date"
                    value={certForm.expiryDate}
                    onChange={e => setCertForm({ ...certForm, expiryDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Status</label>
                  <select
                    value={certForm.status}
                    onChange={e => setCertForm({ ...certForm, status: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Applied">Applied</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Document Upload / File Name</label>
                <input
                  type="text"
                  placeholder="e.g. GOTS_Certificate_2026.pdf"
                  value={certForm.fileName}
                  onChange={e => setCertForm({ ...certForm, fileName: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Notes & Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Scope, test conditions, validity clauses..."
                  value={certForm.notes}
                  onChange={e => setCertForm({ ...certForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddCertModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, cursor: "pointer", color: "#4B5563" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: "#1F9E8D", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                >
                  Add Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD COMPLIANCE */}
      {showAddCompModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={() => setShowAddCompModal(false)}
        >
          <div
            style={{ background: "#FFFFFF", borderRadius: 12, width: "100%", maxWidth: 640, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Add Compliance Requirement</h3>
                <p style={{ fontSize: 12.5, color: "#6B7280", margin: "4px 0 0" }}>Set up a checkpoint, social audit, chemical test, or document check</p>
              </div>
              <button onClick={() => setShowAddCompModal(false)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateComp}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Compliance Requirement Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GOTS Scope Verification / ZDHC MRSL Level 3 Check"
                  value={compForm.name}
                  onChange={e => setCompForm({ ...compForm, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Category</label>
                  <select
                    value={compForm.category}
                    onChange={e => setCompForm({ ...compForm, category: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    {COMPLIANCE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Buyer</label>
                  <select
                    value={compForm.buyer}
                    onChange={e => setCompForm({ ...compForm, buyer: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    {BUYER_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Linked Order / PO</label>
                  <select
                    value={compForm.orderId}
                    onChange={e => setCompForm({ ...compForm, orderId: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="">None (Factory-wide)</option>
                    {Array.from(new Map((orders || []).filter(o => !o.isDeleted).map(o => [o.id, o])).values()).map((o, idx) => (
                      <option key={o.primaryId || `${o.id}-${idx}`} value={o.id}>{o.id} ({o.buyer} · {o.style})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Required Certification</label>
                  <select
                    value={compForm.linkedCert}
                    onChange={e => setCompForm({ ...compForm, linkedCert: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="">None</option>
                    {activeCerts.map(c => <option key={c.id || c.key} value={c.name}>{c.name} ({c.certNo || "No cert#"})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Responsible Department</label>
                  <select
                    value={compForm.department}
                    onChange={e => setCompForm({ ...compForm, department: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    {Object.keys(ORG_STRUCTURE).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Responsible Person</label>
                  <select
                    value={compForm.responsiblePerson}
                    onChange={e => setCompForm({ ...compForm, responsiblePerson: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    {roster.map(s => <option key={s.name} value={s.name}>{s.name} ({s.dept})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Due Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 20 May / 2026-05-20"
                    value={compForm.dueDate}
                    onChange={e => setCompForm({ ...compForm, dueDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Status</label>
                  <select
                    value={compForm.status}
                    onChange={e => setCompForm({ ...compForm, status: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Waived">Waived</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Priority</label>
                  <select
                    value={compForm.priority}
                    onChange={e => setCompForm({ ...compForm, priority: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Requirement Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed criteria, chemical parameters, audit standard..."
                  value={compForm.description}
                  onChange={e => setCompForm({ ...compForm, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddCompModal(false)}
                  style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, cursor: "pointer", color: "#4B5563" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: "#534AB7", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                >
                  Add Compliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CERTIFICATION DETAILS & LIFECYCLE */}
      {selectedCert && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={() => setSelectedCert(null)}
        >
          <div
            style={{ background: "#FFFFFF", borderRadius: 14, width: "100%", maxWidth: 600, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: "#111827", margin: 0 }}>{selectedCert.name}</h3>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: "#E1F5EE", color: "#085041" }}>
                    {selectedCert.status}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 4 }}>
                  Certificate #{selectedCert.certNo || "Unspecified"} · {selectedCert.issuingOrg || "Accredited Body"}
                </div>
              </div>
              <button onClick={() => setSelectedCert(null)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}><X size={18} /></button>
            </div>

            {/* Lifecycle Stages Display */}
            <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Certification Lifecycle</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                {["Applied", "Under Review", "Approved", "Active", "Expiring Soon", "Expired"].map((step, idx) => {
                  const effective = getEffectiveCertStatus(selectedCert);
                  const isCurrent = (effective === step) || (selectedCert.status === step);
                  const isPast = (step === "Applied" && ["Under Review", "Approved", "Active", "Expiring Soon", "Expired"].includes(effective)) ||
                                 (step === "Under Review" && ["Approved", "Active", "Expiring Soon", "Expired"].includes(effective)) ||
                                 (step === "Approved" && ["Active", "Expiring Soon", "Expired"].includes(effective));

                  return (
                    <div key={step} style={{ textAlign: "center", flex: 1, position: "relative", zIndex: 2 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          margin: "0 auto 4px",
                          background: isCurrent ? "#1F9E8D" : isPast ? "#10B981" : "#E5E7EB",
                          color: isCurrent || isPast ? "#FFFFFF" : "#6B7280",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {isPast ? "✓" : idx + 1}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "#111827" : "#6B7280" }}>
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, marginBottom: 18 }}>
              <div style={{ background: "#F9FAFB", padding: "10px 12px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Applicable Buyer</div>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedCert.buyer || "All Buyers"}</div>
              </div>
              <div style={{ background: "#F9FAFB", padding: "10px 12px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Linked Order / PO</div>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedCert.orderId || "None (Facility-wide)"}</div>
              </div>
              <div style={{ background: "#F9FAFB", padding: "10px 12px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Issue Date</div>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedCert.issueDate || "—"}</div>
              </div>
              <div style={{ background: "#F9FAFB", padding: "10px 12px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Expiry Date</div>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedCert.expiryDate || "—"}</div>
              </div>
            </div>

            {/* Document Info */}
            <div style={{ background: selectedCert.file ? "#F0FDF4" : "#F9FAFB", border: `1px solid ${selectedCert.file ? "#BBF7D0" : "#E5E7EB"}`, borderRadius: 8, padding: "12px 14px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={16} color={selectedCert.file ? "#059669" : "#6B7280"} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>
                    {selectedCert.file || "No document file uploaded yet"}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>
                    {selectedCert.file ? "Verified official certificate attachment" : "Attach the verified PDF certificate"}
                  </div>
                </div>
              </div>
              {selectedCert.file && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#059669", background: "#DCFCE7", padding: "3px 8px", borderRadius: 6 }}>
                  Verified
                </span>
              )}
            </div>

            {selectedCert.notes && (
              <div style={{ fontSize: 12.5, color: "#4B5563", background: "#F9FAFB", padding: "10px 12px", borderRadius: 8, marginBottom: 18 }}>
                <span style={{ fontWeight: 600 }}>Notes: </span> {selectedCert.notes}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => {
                  const target = selectedCert;
                  setSelectedCert(null);
                  setEditingCert({ ...target });
                }}
                style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "#534AB7", color: "#FFFFFF", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Edit Certificate
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", color: "#374151", fontSize: 13, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: COMPLIANCE WORKFLOW DETAIL */}
      {selectedComp && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={() => { setSelectedComp(null); setFailureReasonPrompt(false); }}
        >
          <div
            style={{ background: "#FFFFFF", borderRadius: 14, width: "100%", maxWidth: 640, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: "#111827", margin: 0 }}>{selectedComp.name}</h3>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: selectedComp.status === "Passed" ? "#E1F5EE" : selectedComp.status === "Failed" ? "#FEE2E2" : "#F3F4F6", color: selectedComp.status === "Passed" ? "#085041" : selectedComp.status === "Failed" ? "#991B1B" : "#374151" }}>
                    {selectedComp.status}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 4 }}>
                  Category: {selectedComp.category} · Priority: {selectedComp.priority}
                </div>
              </div>
              <button onClick={() => { setSelectedComp(null); setFailureReasonPrompt(false); }} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}><X size={18} /></button>
            </div>

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, marginBottom: 16 }}>
              <div style={{ background: "#F9FAFB", padding: "10px 12px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Buyer & Order</div>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedComp.buyer} {selectedComp.orderId ? `(PO #${selectedComp.orderId})` : ""}</div>
              </div>
              <div style={{ background: "#F9FAFB", padding: "10px 12px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Responsible Department & Person</div>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedComp.responsiblePerson} ({selectedComp.department})</div>
              </div>
              <div style={{ background: "#F9FAFB", padding: "10px 12px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Due Date</div>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedComp.dueDate || "—"}</div>
              </div>
              <div style={{ background: "#F9FAFB", padding: "10px 12px", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6B7280" }}>Linked Certification</div>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{selectedComp.linkedCert || "None"}</div>
              </div>
            </div>

            {selectedComp.description && (
              <div style={{ fontSize: 13, color: "#374151", background: "#F9FAFB", padding: "12px 14px", borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>Description & Testing Scope</div>
                {selectedComp.description}
              </div>
            )}

            {selectedComp.failureReason && (
              <div style={{ fontSize: 13, color: "#991B1B", background: "#FEF2F2", border: "1px solid #FECACA", padding: "12px 14px", borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", marginBottom: 4 }}>Failure Reason / Non-Conformance</div>
                {selectedComp.failureReason}
              </div>
            )}

            {/* Failure Reason Input if prompted */}
            {failureReasonPrompt && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>
                  Enter Non-Conformance / Failure Reason *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Formaldehyde level exceeded 20 ppm in lab test #1029..."
                  value={failureReasonText}
                  onChange={e => setFailureReasonText(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #DC2626", fontSize: 12.5 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setFailureReasonPrompt(false)}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 12, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!failureReasonText.trim()) return;
                      onUpdateCompliance(selectedComp.id, {
                        status: "Failed",
                        failureReason: failureReasonText.trim(),
                        failedAt: new Date().toISOString()
                      });
                      setSelectedComp({
                        ...selectedComp,
                        status: "Failed",
                        failureReason: failureReasonText.trim(),
                        failedAt: new Date().toISOString()
                      });
                      setFailureReasonPrompt(false);
                      setFailureReasonText("");
                    }}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#DC2626", color: "#FFFFFF", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Confirm Mark Failed
                  </button>
                </div>
              </div>
            )}

            {/* Workflow Action Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E5E7EB", paddingTop: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    onUpdateCompliance(selectedComp.id, { status: "In Progress" });
                    setSelectedComp({ ...selectedComp, status: "In Progress" });
                  }}
                  style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#F9FAFB", fontSize: 12.5, fontWeight: 600, color: "#374151", cursor: "pointer" }}
                >
                  Start Review
                </button>
                <button
                  onClick={() => {
                    const completedAt = new Date().toISOString();
                    onUpdateCompliance(selectedComp.id, { status: "Passed", completedAt });
                    setSelectedComp({ ...selectedComp, status: "Passed", completedAt });
                  }}
                  style={{ padding: "8px 14px", borderRadius: 7, border: "none", background: "#10B981", fontSize: 12.5, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                >
                  Mark Passed
                </button>
                <button
                  onClick={() => setFailureReasonPrompt(true)}
                  style={{ padding: "8px 14px", borderRadius: 7, border: "none", background: "#EF4444", fontSize: 12.5, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                >
                  Mark Failed
                </button>
                <button
                  onClick={() => {
                    onUpdateCompliance(selectedComp.id, { status: "Waived" });
                    setSelectedComp({ ...selectedComp, status: "Waived" });
                  }}
                  style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid #C084FC", background: "#FAF5FF", fontSize: 12.5, fontWeight: 600, color: "#7E22CE", cursor: "pointer" }}
                >
                  Waive
                </button>
              </div>

              <button
                onClick={() => { setSelectedComp(null); setFailureReasonPrompt(false); }}
                style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 12.5, cursor: "pointer", color: "#4B5563" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT CERTIFICATION */}
      {editingCert && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={() => setEditingCert(null)}
        >
          <div
            style={{ background: "#FFFFFF", borderRadius: 12, width: "100%", maxWidth: 600, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Edit Certification</h3>
              <button onClick={() => setEditingCert(null)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEditCert}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Certification Name</label>
                  <input
                    type="text"
                    required
                    value={editingCert.name}
                    onChange={e => setEditingCert({ ...editingCert, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Certificate No.</label>
                  <input
                    type="text"
                    value={editingCert.certNo || ""}
                    onChange={e => setEditingCert({ ...editingCert, certNo: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Issuing Org</label>
                  <input
                    type="text"
                    value={editingCert.issuingOrg || ""}
                    onChange={e => setEditingCert({ ...editingCert, issuingOrg: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Status</label>
                  <select
                    value={editingCert.status}
                    onChange={e => setEditingCert({ ...editingCert, status: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Applied">Applied</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Issue Date</label>
                  <input
                    type="date"
                    value={editingCert.issueDate || ""}
                    onChange={e => setEditingCert({ ...editingCert, issueDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Expiry Date</label>
                  <input
                    type="date"
                    value={editingCert.expiryDate || ""}
                    onChange={e => setEditingCert({ ...editingCert, expiryDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Attached Document File Name</label>
                <input
                  type="text"
                  value={editingCert.file || ""}
                  onChange={e => setEditingCert({ ...editingCert, file: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Notes</label>
                <textarea
                  rows={2}
                  value={editingCert.notes || ""}
                  onChange={e => setEditingCert({ ...editingCert, notes: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, cursor: "pointer", color: "#4B5563" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: "#1F9E8D", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT COMPLIANCE */}
      {editingComp && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={() => setEditingComp(null)}
        >
          <div
            style={{ background: "#FFFFFF", borderRadius: 12, width: "100%", maxWidth: 600, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Edit Compliance Requirement</h3>
              <button onClick={() => setEditingComp(null)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEditComp}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Requirement Name</label>
                <input
                  type="text"
                  required
                  value={editingComp.name}
                  onChange={e => setEditingComp({ ...editingComp, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Category</label>
                  <select
                    value={editingComp.category}
                    onChange={e => setEditingComp({ ...editingComp, category: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    {COMPLIANCE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Status</label>
                  <select
                    value={editingComp.status}
                    onChange={e => setEditingComp({ ...editingComp, status: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Waived">Waived</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Responsible Person</label>
                  <select
                    value={editingComp.responsiblePerson || "Suresh"}
                    onChange={e => setEditingComp({ ...editingComp, responsiblePerson: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    {roster.map(s => <option key={s.name} value={s.name}>{s.name} ({s.dept})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Due Date</label>
                  <input
                    type="text"
                    value={editingComp.dueDate || ""}
                    onChange={e => setEditingComp({ ...editingComp, dueDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Priority</label>
                  <select
                    value={editingComp.priority || "Medium"}
                    onChange={e => setEditingComp({ ...editingComp, priority: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  value={editingComp.description || ""}
                  onChange={e => setEditingComp({ ...editingComp, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingComp(null)}
                  style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, cursor: "pointer", color: "#4B5563" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: "#534AB7", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function AttendancePage({
  roster,
  attendance,
  onCycle,
  leaveRequests,
  onApprove,
  onReject,
  onAddStaff,
  onEditStaff,
  onRemoveStaff,
  onAddLeaveRequest,
  userSessions = [],
  isAdmin = false,
  isMD = false,
  users = [],
  teams = []
}) {
  const canViewUsage = isAdmin || isMD;
  const [activeTab, setActiveTab] = useState("attendance");
  const [sessionSearch, setSessionSearch] = useState("");
  const [form, setForm] = useState({ name: "", title: "", dept: Object.keys(ORG_STRUCTURE)[0] });
  const [editingName, setEditingName] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", title: "", dept: "" });
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ name: "", dept: "", from: "", to: "", reason: "" });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setEdit = (field, val) => setEditForm(f => ({ ...f, [field]: val }));

  const todayStr = new Date().toISOString().slice(0, 10);

  // Merge registered system users into roster
  const unifiedStaff = useMemo(() => {
    const list = [...(roster || [])];
    const existingNames = new Set((roster || []).map(r => (r.name || "").toLowerCase()));
    if (Array.isArray(users)) {
      users.forEach(u => {
        if (u.name && !existingNames.has(u.name.toLowerCase())) {
          const userTeamIds = Array.isArray(u.teamIds) && u.teamIds.length > 0 ? u.teamIds : (u.teamId ? [u.teamId] : []);
          const deptNames = Array.isArray(teams)
            ? teams.filter(t => userTeamIds.includes(t.id)).map(t => t.name).join(", ")
            : "";
          list.push({
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            title: u.title || (userTeamIds.includes("team-admin") ? "Administrator" : "Team Member"),
            dept: deptNames || "Merchandising",
            isSystemUser: true
          });
          existingNames.add(u.name.toLowerCase());
        }
      });
    }
    return list;
  }, [roster, users, teams]);

  const getStaffAttendance = (person) => {
    // 1. Check if marked on leave
    const onLeave = (leaveRequests || []).find(l =>
      l.status === "approved" &&
      (l.name.toLowerCase() === (person.name || "").toLowerCase())
    ) || (attendance[person.name] === "leave");

    if (onLeave) {
      return {
        status: "leave",
        label: "On leave",
        reason: onLeave.reason || "Approved Leave"
      };
    }

    // 2. Check if logged in today
    const session = userSessions.find(s =>
      (s.date === todayStr || (s.loginTime && s.loginTime.startsWith(todayStr))) &&
      ((s.userId && s.userId === person.id) ||
       (s.username && person.username && s.username.toLowerCase() === person.username.toLowerCase()) ||
       (s.name && person.name && s.name.toLowerCase() === person.name.toLowerCase()))
    );

    if (session || attendance[person.name] === "present") {
      const inTime = session?.loginTime ? new Date(session.loginTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
      return {
        status: "present",
        label: "Present",
        inTime,
        device: session?.device,
        deviceType: session?.deviceType || "Laptop / Desktop",
        location: session?.location
      };
    }

    // 3. Otherwise Absent
    return {
      status: "absent",
      label: "Absent"
    };
  };

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, leave: 0 };
    unifiedStaff.forEach(s => {
      const att = getStaffAttendance(s);
      if (c[att.status] !== undefined) c[att.status]++;
    });
    return c;
  }, [unifiedStaff, attendance, userSessions, leaveRequests]);

  const pending = (leaveRequests || []).filter(l => l.status === "pending");

  const filteredSessions = useMemo(() => {
    if (!sessionSearch.trim()) return userSessions;
    const q = sessionSearch.toLowerCase();
    return userSessions.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.dept && s.dept.toLowerCase().includes(q))
    );
  }, [userSessions, sessionSearch]);

  function submitAdd() {
    if (!form.name.trim()) return;
    onAddStaff({ name: form.name.trim(), title: form.title.trim() || "Staff", dept: form.dept });
    setForm({ name: "", title: "", dept: form.dept });
  }

  function startEdit(s) {
    setEditingName(s.name);
    setEditForm({ name: s.name, title: s.title, dept: s.dept });
  }

  function saveEdit() {
    if (!editForm.name.trim() || !editingName) return;
    if (onEditStaff) {
      onEditStaff(editingName, { name: editForm.name.trim(), title: editForm.title.trim() || "Staff", dept: editForm.dept });
    }
    setEditingName(null);
  }

  function submitLeave() {
    if (!leaveForm.name.trim() || !leaveForm.from.trim()) return;
    const selectedStaff = roster.find(s => s.name === leaveForm.name);
    const dept = selectedStaff ? selectedStaff.dept : leaveForm.dept || "General";
    if (onAddLeaveRequest) {
      onAddLeaveRequest({
        id: `leave-${Date.now()}`,
        name: leaveForm.name,
        dept,
        from: leaveForm.from,
        to: leaveForm.to || leaveForm.from,
        reason: leaveForm.reason.trim() || "Personal",
        status: "pending",
      });
    }
    setLeaveForm({ name: "", dept: "", from: "", to: "", reason: "" });
    setShowAddLeave(false);
  }

  return (
    <div>
      <PageHeader
        title="Attendance & System Usage"
        sub="Monitor staff attendance, daily leave requests, and user login/logout activity hours."
      />

      {canViewUsage && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button
            onClick={() => setActiveTab("attendance")}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              border: activeTab === "attendance" ? "none" : "1px solid #E2E8F0",
              background: activeTab === "attendance" ? "#534AB7" : "#FFFFFF",
              color: activeTab === "attendance" ? "#FFFFFF" : "#64748B"
            }}
          >
            Staff Register & Leave
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              border: activeTab === "sessions" ? "none" : "1px solid #E2E8F0",
              background: activeTab === "sessions" ? "#534AB7" : "#FFFFFF",
              color: activeTab === "sessions" ? "#FFFFFF" : "#64748B",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            User Login Sessions & Usage Hours
            <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: activeTab === "sessions" ? "rgba(255,255,255,0.25)" : "#E0E7FF", color: activeTab === "sessions" ? "#fff" : "#4338CA" }}>
              {userSessions.length}
            </span>
          </button>
        </div>
      )}

      {activeTab === "sessions" ? (
        <div>
          {/* KPI Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            <Card style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#8A8D98" }}>Active Online Users</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#10B981", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                {userSessions.filter(s => s.active).length} online
              </div>
            </Card>
            <Card style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#8A8D98" }}>Total Logins Recorded</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#534AB7" }}>
                {userSessions.length} sessions
              </div>
            </Card>
            <Card style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#8A8D98" }}>Total Hours Used (All Users)</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#378ADD" }}>
                {userSessions.reduce((acc, s) => acc + (Number(s.hoursUsed) || 0), 0).toFixed(1)} hrs
              </div>
            </Card>
            <Card style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#8A8D98" }}>Avg Session Duration</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#E2A83B" }}>
                {userSessions.length > 0 ? (userSessions.reduce((acc, s) => acc + (Number(s.hoursUsed) || 0), 0) / userSessions.length).toFixed(1) : 0} hrs
              </div>
            </Card>
          </div>

          {/* Sessions Table Card */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 14px", borderBottom: "1px solid #F1F5F9", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>User Login & Logout Session History</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  Every login automatically marks attendance as Present and tracks session duration.
                </div>
              </div>
              <input
                type="text"
                value={sessionSearch}
                onChange={e => setSessionSearch(e.target.value)}
                placeholder="Filter by user or department..."
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5, width: 220 }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 940 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #E2E8F0", background: "#F8FAFC" }}>
                    <th style={{ padding: "10px 8px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "155px" }}>User / Name</th>
                    <th style={{ padding: "10px 8px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "100px" }}>Username</th>
                    <th style={{ padding: "10px 8px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "120px" }}>Department</th>
                    <th style={{ padding: "10px 8px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "170px" }}>Device Telemetry</th>
                    <th style={{ padding: "10px 8px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "190px" }}>Location</th>
                    <th style={{ padding: "10px 8px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "125px" }}>Login Time</th>
                    <th style={{ padding: "10px 8px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "120px" }}>Logout Time</th>
                    <th style={{ padding: "10px 8px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "100px" }}>Hours Used</th>
                    <th style={{ padding: "10px 8px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "100px", textAlign: "right" }}>Daily Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>
                        No login session records found.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map(s => {
                      const loginDate = s.loginTime ? new Date(s.loginTime) : null;
                      const logoutDate = s.logoutTime ? new Date(s.logoutTime) : null;
                      const hoursNum = Number(s.hoursUsed) || 0;
                      const hoursFormatted = hoursNum < 1
                        ? `${Math.max(1, Math.round(hoursNum * 60))} mins`
                        : `${Math.floor(hoursNum)}h ${Math.round((hoursNum % 1) * 60)}m (${hoursNum.toFixed(2)}h)`;

                      return (
                        <tr
                          key={s.id}
                          style={{
                            borderBottom: "1px solid #F1F5F9",
                            fontSize: 12.5,
                            verticalAlign: "middle"
                          }}
                        >
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EEF2FF", color: "#4F46E5", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {(s.name || s.username || "U").slice(0, 1).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: "#1E293B" }}>{s.name || "User"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px", color: "#64748B", fontFamily: "monospace", fontSize: 12 }}>
                            @{s.username || "—"}
                          </td>
                          <td style={{ padding: "10px 8px", color: "#64748B" }}>
                            {s.dept || "—"}
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#1F2937", fontWeight: 600, fontSize: 11.5 }}>
                              {s.deviceType === "Mobile" ? <Smartphone size={13} color="#534AB7" /> : <Laptop size={13} color="#1F9E8D" />}
                              <span>{s.deviceType || "Laptop"}</span>
                            </div>
                            {s.device && (
                              <div style={{ fontSize: 10.5, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.device}>
                                {s.device}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#1F2937", fontSize: 11.5 }}>
                              <MapPin size={12} color="#DC2626" style={{ flexShrink: 0 }} />
                              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={sanitizeLocationString(s.location)}>
                                {sanitizeLocationString(s.location) || "Office"}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px", color: "#334155", fontSize: 12 }}>
                            {loginDate ? loginDate.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            {s.active ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 7px", borderRadius: 999, background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 700 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                                Online
                              </span>
                            ) : (
                              <span style={{ color: "#64748B", fontSize: 12 }}>
                                {logoutDate ? logoutDate.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "10px 8px" }}>
                            <span style={{ fontWeight: 700, color: s.active ? "#059669" : "#1E293B", background: s.active ? "#F0FDF4" : "#F8FAFC", padding: "2px 6px", borderRadius: 6, border: `1px solid ${s.active ? "#BBF7D0" : "#E2E8F0"}` }}>
                              {hoursFormatted}
                            </span>
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#059669", background: "#ECFDF5", padding: "2px 7px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                              <Check size={12} /> Present
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Present today</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>{counts.present}</div></Card>
            <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Absent today</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>{counts.absent}</div></Card>
            <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>On leave today</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#E2A83B" }}>{counts.leave}</div></Card>
          </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 12px" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Leave requests</div>
            <div style={{ fontSize: 11.5, color: "#8A8D98" }}>{pending.length} pending approval</div>
          </div>
          <button
            onClick={() => setShowAddLeave(!showAddLeave)}
            style={{ fontSize: 12, fontWeight: 600, color: "#534AB7", background: "#F5F3FF", border: "1px solid #E0DBF5", borderRadius: 7, padding: "5px 12px", cursor: "pointer" }}
          >
            {showAddLeave ? "Cancel" : "+ Request leave"}
          </button>
        </div>

        {showAddLeave && (
          <div style={{ background: "#F8F7FF", border: "1px solid #E4E0F8", borderRadius: 8, padding: "12px", marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr auto", gap: 8, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Staff member</label>
                <select
                  value={leaveForm.name}
                  onChange={e => {
                    const found = roster.find(s => s.name === e.target.value);
                    setLeaveForm(f => ({ ...f, name: e.target.value, dept: found ? found.dept : f.dept }));
                  }}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #D5CEF2", fontSize: 12 }}
                >
                  <option value="">Select staff...</option>
                  {roster.map(s => <option key={s.name} value={s.name}>{s.name} ({s.dept})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>From</label>
                <input value={leaveForm.from} onChange={e => setLeaveForm(f => ({ ...f, from: e.target.value }))} placeholder="e.g. 2 Jun" style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #D5CEF2", fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>To</label>
                <input value={leaveForm.to} onChange={e => setLeaveForm(f => ({ ...f, to: e.target.value }))} placeholder="e.g. 4 Jun" style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #D5CEF2", fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Reason</label>
                <input value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Personal / Medical" style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #D5CEF2", fontSize: 12 }} />
              </div>
              <button onClick={submitLeave} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#534AB7", border: "none", borderRadius: 6, padding: "7px 14px", cursor: "pointer" }}>Submit</button>
            </div>
          </div>
        )}

        {leaveRequests.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No leave requests.</div>
        ) : leaveRequests.map(l => (
          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderBottom: "1px solid #F5F5F7" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{l.name} <span style={{ color: "#8A8D98", fontWeight: 400 }}>· {l.dept}</span></div>
              <div style={{ fontSize: 11.5, color: "#8A8D98" }}>{l.from} – {l.to} · {l.reason}</div>
            </div>
            {l.status === "pending" ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onApprove(l.id)} style={{ fontSize: 12, fontWeight: 600, color: "#085041", background: "#E1F5EE", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>Approve</button>
                <button onClick={() => onReject(l.id)} style={{ fontSize: 12, fontWeight: 600, color: "#791F1F", background: "#FCEBEB", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>Reject</button>
              </div>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 600, color: l.status === "approved" ? "#085041" : "#791F1F" }}>{l.status === "approved" ? "Approved" : "Rejected"}</span>
            )}
          </div>
        ))}
      </Card>

      
    {/* future enhancemenst */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Add a joiner" sub="Add anyone new who's joined the team — changes persist immediately" />
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.2fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full name" style={{ width: "94%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Title</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Junior / Incharge" style={{ width: "94%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Department</label>
            <select value={form.dept} onChange={e => set("dept", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              {Object.keys(ORG_STRUCTURE).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={submitAdd} style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#1F9E8D", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Add</button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Today's roster" sub="Click a status pill to cycle it — edit or remove team members" />
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.1fr 1.6fr 0.9fr", fontSize: 11, color: "#6B7280", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Name & Account</div><div>Title</div><div>Department</div><div>Today's Attendance Status</div><div style={{ textAlign: "right" }}>Actions</div>
        </div>
        {unifiedStaff.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
            No staff members in the roster yet. Use the "Add a joiner" form above to add team members.
          </div>
        ) : unifiedStaff.map(s => {
          const isEditing = editingName === s.name;
          const att = getStaffAttendance(s);
          const st = ATTENDANCE_STATUS_STYLE[att.status] || ATTENDANCE_STATUS_STYLE.absent;

          if (isEditing) {
            return (
              <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.1fr 1.6fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "8px 4px", borderBottom: "1px solid #F7F7F9", background: "#FAF9FE" }}>
                <div>
                  <input value={editForm.name} onChange={e => setEdit("name", e.target.value)} style={{ width: "90%", padding: "4px 6px", borderRadius: 5, border: "1px solid #D5CEF2", fontSize: 12 }} />
                </div>
                <div>
                  <input value={editForm.title} onChange={e => setEdit("title", e.target.value)} style={{ width: "90%", padding: "4px 6px", borderRadius: 5, border: "1px solid #D5CEF2", fontSize: 12 }} />
                </div>
                <div>
                  <select value={editForm.dept} onChange={e => setEdit("dept", e.target.value)} style={{ width: "90%", padding: "4px 6px", borderRadius: 5, border: "1px solid #D5CEF2", fontSize: 12 }}>
                    {Object.keys(ORG_STRUCTURE).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <span style={{ background: st.bg, color: st.fg, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999 }}>{st.label}</span>
                </div>
                <div style={{ textAlign: "right", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={saveEdit} style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: "#1F9E8D", border: "none", borderRadius: 5, padding: "4px 8px", cursor: "pointer" }}>Save</button>
                  <button onClick={() => setEditingName(null)} style={{ fontSize: 11, color: "#8A8D98", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            );
          }

          return (
            <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.1fr 1.6fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "9px 4px", borderBottom: "1px solid #F7F7F9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#F3F4F6", color: "#4B5563", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(s.name || "U").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1B2130" }}>{s.name}</div>
                  {s.username && <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>@{s.username}</div>}
                </div>
              </div>
              <div style={{ color: "#8A8D98" }}>{s.title}</div>
              <div style={{ color: "#8A8D98" }}>{s.dept}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <span
                    onClick={() => onCycle(s.name)}
                    title="Click to cycle status (Present / On Leave / Absent)"
                    style={{ cursor: "pointer", background: st.bg, color: st.fg, fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}
                  >
                    {att.status === "present" ? "✓ Present" : att.status === "leave" ? "🏖 On leave" : "✕ Absent"}
                  </span>
                  {att.status === "present" && (
                    <span style={{ fontSize: 11, color: "#059669", display: "inline-flex", alignItems: "center", gap: 4, background: "#ECFDF5", padding: "2px 7px", borderRadius: 6 }}>
                      {att.deviceType === "Mobile" ? <Smartphone size={12} color="#534AB7" /> : <Laptop size={12} color="#1F9E8D" />}
                      {att.inTime && <span>In: {att.inTime}</span>}
                      {att.location && <span title={sanitizeLocationString(att.location)}>· 📍 {sanitizeLocationString(att.location).split("(")[0].trim()}</span>}
                    </span>
                  )}
                  {att.status === "leave" && att.reason && (
                    <span style={{ fontSize: 11, color: "#92400E", background: "#FEF3C7", padding: "2px 6px", borderRadius: 4 }}>
                      {att.reason}
                    </span>
                  )}
                  {att.status === "absent" && (
                    <span style={{ fontSize: 10.5, color: "#9CA3AF" }}>(No login today)</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                <button
                  onClick={() => {
                    setLeaveForm(f => ({ ...f, name: s.name, dept: s.dept, reason: "Personal" }));
                    setShowAddLeave(true);
                  }}
                  title="Mark or request leave for this staff"
                  style={{ fontSize: 11, color: "#534AB7", background: "#EDE9FE", border: "none", borderRadius: 5, padding: "3px 7px", cursor: "pointer", fontWeight: 600 }}
                >
                  On leave
                </button>
                <button
                  onClick={() => startEdit(s)}
                  style={{ fontSize: 11, color: "#378ADD", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onRemoveStaff(s.name)}
                  title="Remove — no longer with the company"
                  style={{ fontSize: 11, color: "#B0812E", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        </Card>
      </>
      )}
    </div>
  );
}

export function EditDepartmentModal({
  deptName,
  description = "",
  roles = [],
  onClose,
  onSave
}) {
  const [name, setName] = useState(deptName || "");
  const [desc, setDesc] = useState(description || "");
  const [roleList, setRoleList] = useState(() => {
    if (!Array.isArray(roles) || roles.length === 0) {
      return [{ title: "Manager", name: "", bullets: [] }];
    }
    return roles.map(r => ({
      title: r.title || "",
      name: r.name || "",
      bullets: Array.isArray(r.bullets) ? [...r.bullets] : []
    }));
  });

  const handleRoleChange = (index, field, value) => {
    setRoleList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddRole = () => {
    setRoleList(prev => [...prev, { title: "", name: "", bullets: [""] }]);
  };

  const handleDeleteRole = (index) => {
    const roleTitle = roleList[index]?.title || "this role";
    if (window.confirm(`Are you sure you want to remove ${roleTitle}?`)) {
      setRoleList(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleMoveRole = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= roleList.length) return;
    setRoleList(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleAddResponsibility = (roleIndex) => {
    setRoleList(prev => {
      const updated = [...prev];
      const currentBullets = Array.isArray(updated[roleIndex].bullets) ? [...updated[roleIndex].bullets] : [];
      updated[roleIndex] = {
        ...updated[roleIndex],
        bullets: [...currentBullets, ""]
      };
      return updated;
    });
  };

  const handleResponsibilityChange = (roleIndex, bulletIndex, value) => {
    setRoleList(prev => {
      const updated = [...prev];
      const currentBullets = Array.isArray(updated[roleIndex].bullets) ? [...updated[roleIndex].bullets] : [];
      currentBullets[bulletIndex] = value;
      updated[roleIndex] = {
        ...updated[roleIndex],
        bullets: currentBullets
      };
      return updated;
    });
  };

  const handleDeleteResponsibility = (roleIndex, bulletIndex) => {
    setRoleList(prev => {
      const updated = [...prev];
      const currentBullets = Array.isArray(updated[roleIndex].bullets) ? [...updated[roleIndex].bullets] : [];
      updated[roleIndex] = {
        ...updated[roleIndex],
        bullets: currentBullets.filter((_, i) => i !== bulletIndex)
      };
      return updated;
    });
  };

  const handleMoveResponsibility = (roleIndex, bulletIndex, direction) => {
    setRoleList(prev => {
      const updated = [...prev];
      const currentBullets = Array.isArray(updated[roleIndex].bullets) ? [...updated[roleIndex].bullets] : [];
      const targetIndex = bulletIndex + direction;
      if (targetIndex < 0 || targetIndex >= currentBullets.length) return prev;
      const temp = currentBullets[bulletIndex];
      currentBullets[bulletIndex] = currentBullets[targetIndex];
      currentBullets[targetIndex] = temp;
      updated[roleIndex] = {
        ...updated[roleIndex],
        bullets: currentBullets
      };
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalName = name.trim();
    if (!finalName) {
      alert("Department name cannot be empty.");
      return;
    }

    const cleanedRoles = roleList.map(r => ({
      title: r.title.trim() || "Role",
      name: r.name.trim() || "—",
      bullets: (r.bullets || []).map(b => b.trim()).filter(Boolean)
    }));

    if (onSave) {
      onSave({
        name: finalName,
        description: desc.trim(),
        roles: cleanedRoles
      });
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
          maxWidth: 720,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0F0F2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#151B2E", margin: 0 }}>
              Edit Department: <span style={{ color: "#1F9E8D" }}>{deptName}</span>
            </h3>
            <p style={{ fontSize: 12.5, color: "#8A8D98", margin: "4px 0 0" }}>
              Update department details, reporting hierarchy, personnel, and assigned responsibilities.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#8A8D98", cursor: "pointer", padding: 6, borderRadius: 6 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
            
            {/* Department Name & Description */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 22 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Merchandising"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#111827",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                  Department Description
                </label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Describe the department's core focus, owning T&A stages, and key workflows..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 13,
                    color: "#1F2937",
                    lineHeight: 1.5,
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            {/* Reporting Structure Section */}
            <div style={{ borderTop: "1px solid #F0F0F2", paddingTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#151B2E", margin: 0 }}>
                    Reporting Structure & Responsibilities
                  </h4>
                  <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>
                    Define the roles, assign individuals, and maintain specific responsibilities.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddRole}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#E1F5EE",
                    color: "#085041",
                    border: "1px solid #A2E2CD",
                    borderRadius: 7,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <Plus size={14} />
                  Add Role
                </button>
              </div>

              {/* Roles List */}
              {roleList.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "#8A8D98", fontSize: 13, background: "#FAFAFB", borderRadius: 8, border: "1px dashed #D1D5DB" }}>
                  No roles configured for this department. Click <strong>+ Add Role</strong> above to create one.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {roleList.map((role, rIdx) => (
                    <div
                      key={rIdx}
                      style={{
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: 10,
                        padding: "14px 16px",
                        position: "relative"
                      }}
                    >
                      {/* Role Card Header Row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: "#EDE9FE", color: "#5B21B6", padding: "2px 8px", borderRadius: 999 }}>
                            Role #{rIdx + 1}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>
                            {role.title ? role.title : "Untitled Role"}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleMoveRole(rIdx, -1)}
                            disabled={rIdx === 0}
                            title="Move role up"
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #D1D5DB",
                              borderRadius: 5,
                              padding: 4,
                              cursor: rIdx === 0 ? "not-allowed" : "pointer",
                              opacity: rIdx === 0 ? 0.4 : 1,
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                          >
                            <ArrowUp size={13} color="#4B5563" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveRole(rIdx, 1)}
                            disabled={rIdx === roleList.length - 1}
                            title="Move role down"
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #D1D5DB",
                              borderRadius: 5,
                              padding: 4,
                              cursor: rIdx === roleList.length - 1 ? "not-allowed" : "pointer",
                              opacity: rIdx === roleList.length - 1 ? 0.4 : 1,
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                          >
                            <ArrowDown size={13} color="#4B5563" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(rIdx)}
                            title="Delete role"
                            style={{
                              background: "#FEE2E2",
                              border: "1px solid #FCA5A5",
                              color: "#991B1B",
                              borderRadius: 5,
                              padding: "4px 8px",
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              marginLeft: 6
                            }}
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Role Inputs (Role Title & Person Name) */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>
                            Role / Designation *
                          </label>
                          <input
                            type="text"
                            required
                            value={role.title}
                            onChange={e => handleRoleChange(rIdx, "title", e.target.value)}
                            placeholder="e.g. Manager, Senior, Incharge"
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: 6,
                              border: "1px solid #D1D5DB",
                              fontSize: 12.5,
                              boxSizing: "border-box"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>
                            Person / Employee Name
                          </label>
                          <input
                            type="text"
                            value={role.name}
                            onChange={e => handleRoleChange(rIdx, "name", e.target.value)}
                            placeholder="e.g. Raj, Suresh, —"
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: 6,
                              border: "1px solid #D1D5DB",
                              fontSize: 12.5,
                              boxSizing: "border-box"
                            }}
                          />
                        </div>
                      </div>

                      {/* Responsibilities Sub-List */}
                      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#374151" }}>
                            Responsibilities ({role.bullets?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddResponsibility(rIdx)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#1F9E8D",
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              padding: 0
                            }}
                          >
                            <Plus size={13} />
                            Add Responsibility
                          </button>
                        </div>

                        {(!role.bullets || role.bullets.length === 0) ? (
                          <div style={{ fontSize: 11.5, color: "#9CA3AF", fontStyle: "italic", padding: "6px 0" }}>
                            No responsibilities listed. Click <strong>+ Add Responsibility</strong> to assign tasks to this role.
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {role.bullets.map((bullet, bIdx) => (
                              <div key={bIdx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 5, height: 5, borderRadius: 999, background: "#9CA3AF", flexShrink: 0 }} />
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={e => handleResponsibilityChange(rIdx, bIdx, e.target.value)}
                                  placeholder="e.g. PO receiving, Fabric plan approval..."
                                  style={{
                                    flex: 1,
                                    padding: "5px 8px",
                                    borderRadius: 5,
                                    border: "1px solid #E5E7EB",
                                    fontSize: 12,
                                    color: "#1F2937",
                                    boxSizing: "border-box"
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleMoveResponsibility(rIdx, bIdx, -1)}
                                  disabled={bIdx === 0}
                                  title="Move up"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: bIdx === 0 ? "not-allowed" : "pointer",
                                    opacity: bIdx === 0 ? 0.3 : 0.7,
                                    padding: 2,
                                    display: "inline-flex"
                                  }}
                                >
                                  <ArrowUp size={12} color="#4B5563" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveResponsibility(rIdx, bIdx, 1)}
                                  disabled={bIdx === role.bullets.length - 1}
                                  title="Move down"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: bIdx === role.bullets.length - 1 ? "not-allowed" : "pointer",
                                    opacity: bIdx === role.bullets.length - 1 ? 0.3 : 0.7,
                                    padding: 2,
                                    display: "inline-flex"
                                  }}
                                >
                                  <ArrowDown size={12} color="#4B5563" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteResponsibility(rIdx, bIdx)}
                                  title="Remove responsibility"
                                  style={{
                                    background: "#FEE2E2",
                                    border: "none",
                                    color: "#DC2626",
                                    borderRadius: 4,
                                    padding: "3px 6px",
                                    cursor: "pointer",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    display: "inline-flex",
                                    alignItems: "center"
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Role Button at the bottom */}
                  <button
                    type="button"
                    onClick={handleAddRole}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      border: "1px dashed #A2E2CD",
                      background: "#F0FDF4",
                      color: "#085041",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <Plus size={15} />
                    Add Role
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #F0F0F2",
              background: "#FAFAFB",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                borderRadius: 7,
                border: "1px solid #D1D5DB",
                background: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                color: "#4B5563",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 20px",
                borderRadius: 7,
                border: "none",
                background: "#1F9E8D",
                fontSize: 13,
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DepartmentsPage({ orders, onOpenDept, orgStructure, deptDescriptions, users = [], teams = [] }) {
  const stageLinkedDepts = useMemo(() => new Set(TA_STAGES.map(s => s.dept)), []);
  const coveredCount = stageLinkedDepts.size;
  const deptNames = Object.keys(orgStructure);

  return (
    <div>
      <PageHeader title="Departments" sub="Full org structure from your charts — every T&A stage below is owned by exactly one department" />
      <Card style={{ marginBottom: 16, background: "#F0F7F4", border: "1px solid #CDEBDF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle2 size={18} color="#1F9E8D" />
          <div style={{ fontSize: 13, color: "#085041" }}>
            <strong>{TA_STAGES.length}/{TA_STAGES.length}</strong> T&A steps have an owning department, across <strong>{coveredCount}</strong> departments directly in the workflow and <strong>{deptNames.length - coveredCount}</strong> supporting departments (CAD, Warehouse, Testing, Store, IoT, Program, Planning) that feed those steps but aren't a named stage owner yet.
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {deptNames.map(deptName => {
          const roles = orgStructure[deptName] || [];
          const taskCount = stageLinkedDepts.has(deptName) ? collectTasks(orders, deptName).filter(r => r.stage.status !== "done").length : null;
          const Icon = DEPT_ICONS[deptName] || CheckCircle2;
          const linkedStages = TA_STAGES.filter(s => s.dept === deptName).map(s => s.name);
          const description = deptDescriptions?.[deptName] || DEFAULT_DEPT_DESCRIPTIONS[deptName] || "";
          const isExec = deptName === "Executive (MD)" || deptName === "Executive";
          return (
            <Card
              key={deptName}
              style={{
                cursor: "pointer",
                border: isExec ? "1.5px solid #7F77DD" : undefined,
                background: isExec ? "#FAF9FF" : undefined
              }}
            >
              <div onClick={() => onOpenDept(deptName)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: isExec ? "#7F77DD" : "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={14} color={isExec ? "#FFFFFF" : "#534AB7"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130", display: "flex", alignItems: "center", gap: 6 }}>
                        {deptName}
                        {isExec && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "#7F77DD", color: "#FFF", padding: "1px 7px", borderRadius: 999 }}>
                            MD Dashboard
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExec ? (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#534AB7" }}>Open Dashboard →</span>
                  ) : (
                    taskCount !== null && <span style={{ fontSize: 11, color: "#8A8D98" }}>{taskCount} open tasks</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: isExec ? "#534AB7" : "#8A8D98", marginBottom: 6 }}>
                  {roles.length} roles · {isExec ? "Enterprise Leadership & Governance" : (linkedStages.length > 0 ? `owns: ${linkedStages.join(", ")}` : "support function")}
                </div>
                {description && (
                  <div style={{ fontSize: 12, color: "#565A66", lineHeight: 1.4, marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {description}
                  </div>
                )}

                {(() => {
                  const deptUsers = Array.isArray(users) ? users.filter(u => {
                    const userTeamIds = Array.isArray(u.teamIds) && u.teamIds.length > 0 ? u.teamIds : (u.teamId ? [u.teamId] : []);
                    const userDepts = Array.isArray(teams) ? teams.filter(t => userTeamIds.includes(t.id)).map(t => t.name.toLowerCase()) : [];
                    return userDepts.includes(deptName.toLowerCase()) || (u.teamId === "team-admin" && deptName === "Administrators");
                  }) : [];

                  return (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                      <span style={{ color: "#534AB7", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        👥 {deptUsers.length} mapped user{deptUsers.length === 1 ? "" : "s"}
                      </span>
                      {deptUsers.length > 0 && (
                        <span style={{ color: "#6B7280" }}>
                          {deptUsers.slice(0, 2).map(u => u.name).join(", ")}{deptUsers.length > 2 ? ` +${deptUsers.length - 2}` : ""}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function DepartmentDetail({
  deptName,
  orders,
  onBack,
  onOpenOrder,
  orgStructure,
  deptDescriptions,
  onUpdateDepartment,
  suppliers = [],
  onAssignWork,
  users = [],
  teams = [],
  attendance = {},
  userSessions = []
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const roles = orgStructure[deptName] || [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const mappedUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(u => {
      const userTeamIds = Array.isArray(u.teamIds) && u.teamIds.length > 0 ? u.teamIds : (u.teamId ? [u.teamId] : []);
      const userDepts = Array.isArray(teams) ? teams.filter(t => userTeamIds.includes(t.id)).map(t => t.name.toLowerCase()) : [];
      return userDepts.includes(deptName.toLowerCase()) || (u.teamId === "team-admin" && deptName === "Administrators");
    });
  }, [users, teams, deptName]);
  const allDeptTasks = useMemo(() => collectTasks(orders, deptName), [orders, deptName]);
  const linkedStages = TA_STAGES.filter(s => s.dept === deptName);
  const description = deptDescriptions?.[deptName] || DEFAULT_DEPT_DESCRIPTIONS[deptName] || (linkedStages.length > 0 ? `Owns T&A step${linkedStages.length > 1 ? "s" : ""}: ${linkedStages.map(s => s.name).join(", ")}` : "Support department — not yet a T&A step owner");

  // Separate tasks into Process, Pending, and Done without duplicates
  const processTasks = useMemo(() => {
    return allDeptTasks.filter(({ stage }) => {
      const s = (stage?.status || "").toLowerCase();
      return s === "in_progress" || s === "in progress";
    });
  }, [allDeptTasks]);

  const pendingTasks = useMemo(() => {
    return allDeptTasks.filter(({ stage }) => {
      const s = (stage?.status || "").toLowerCase();
      return s === "pending" || s === "not_started" || s === "not started";
    });
  }, [allDeptTasks]);

  const doneTasks = useMemo(() => {
    return allDeptTasks.filter(({ stage }) => {
      const s = (stage?.status || "").toLowerCase();
      return s === "done" || s === "completed";
    });
  }, [allDeptTasks]);

  const handleSaveDepartment = (updatedData) => {
    if (onUpdateDepartment) {
      onUpdateDepartment(deptName, updatedData);
    }
  };

  return (
    <div>
      <BackLink onClick={onBack} label="Back to departments" />
      
      {/* Department Heading with Edit Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1B2130" }}>{deptName}</h1>
          <div style={{ fontSize: 13.5, color: "#565A66", marginTop: 4, maxWidth: 850, lineHeight: 1.5 }}>
            {description}
          </div>
          {linkedStages.length > 0 && (
            <div style={{ fontSize: 12, color: "#1F9E8D", fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#1F9E8D", display: "inline-block" }} />
              Owns T&A step{linkedStages.length > 1 ? "s" : ""}: {linkedStages.map(s => s.name).join(", ")}
            </div>
          )}
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
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              whiteSpace: "nowrap"
            }}
          >
            <Layers size={15} />
            Assign Supplier Work
          </button>
          <button
            onClick={() => setShowEditModal(true)}
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
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              whiteSpace: "nowrap"
            }}
          >
            <Edit size={15} />
            Edit Department
          </button>
        </div>
      </div>

      {/* Assigned Department Members & User Telemetry Card */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F0F0F2", marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Assigned Department Members & Active Status</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: "#E0DBF5", color: "#3D3878", padding: "2px 8px", borderRadius: 999 }}>
              {mappedUsers.length} user{mappedUsers.length === 1 ? "" : "s"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#8A8D98" }}>
            Mapped via User Access & Permissions
          </span>
        </div>

        {mappedUsers.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#8A8D98", fontSize: 12.5 }}>
            No users currently mapped to {deptName}. You can assign users to {deptName} in Settings → User Access.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {mappedUsers.map(u => {
              const isOnline = userSessions.some(s => s.active && (s.userId === u.id || s.username === u.username));
              const sessionToday = userSessions.find(s => (s.userId === u.id || s.username === u.username) && (s.date === todayStr || (s.loginTime && s.loginTime.startsWith(todayStr))));
              const isPresent = Boolean(sessionToday || attendance[u.name] === "present");
              const isOnLeave = attendance[u.name] === "leave";

              return (
                <div key={u.id || u.username} style={{ padding: "12px 14px", border: "1px solid #E5E7EB", borderRadius: 10, background: "#FFFFFF", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 999, background: "#534AB7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, position: "relative" }}>
                        {(u.name || "U").charAt(0).toUpperCase()}
                        {isOnline && (
                          <span style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: "#10B981", border: "1.5px solid #fff" }} title="Online now" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>{u.email || (u.username ? `@${u.username}` : "Staff")}</div>
                      </div>
                    </div>

                    {isPresent ? (
                      <span style={{ fontSize: 10.5, fontWeight: 700, background: "#E1F5EE", color: "#085041", padding: "2px 8px", borderRadius: 999 }}>
                        ✓ Present
                      </span>
                    ) : isOnLeave ? (
                      <span style={{ fontSize: 10.5, fontWeight: 700, background: "#FAEEDA", color: "#633806", padding: "2px 8px", borderRadius: 999 }}>
                        🏖 On Leave
                      </span>
                    ) : (
                      <span style={{ fontSize: 10.5, fontWeight: 600, background: "#FCEBEB", color: "#791F1F", padding: "2px 8px", borderRadius: 999 }}>
                        ✕ Absent
                      </span>
                    )}
                  </div>

                  {sessionToday && (
                    <div style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 2, paddingTop: 6, borderTop: "1px dashed #F3F4F6" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 600, color: "#374151" }}>
                        {sessionToday.deviceType === "Mobile" ? <Smartphone size={12} color="#534AB7" /> : <Laptop size={12} color="#1F9E8D" />}
                        {sessionToday.deviceType || "Laptop"}
                      </span>
                      {sessionToday.location && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }} title={sessionToday.location}>
                          <MapPin size={11} color="#DC2626" />
                          {sessionToday.location.split("(")[0].trim()}
                        </span>
                      )}
                      {sessionToday.loginTime && (
                        <span style={{ color: "#059669", fontWeight: 600 }}>
                          In: {new Date(sessionToday.loginTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Reporting Structure Card */}
      {/* <Card style={{ marginBottom: 20 }}>
        <CardHeader title="Reporting structure & responsibilities" />
        <OrgChain roles={roles} />
      </Card> */}

      {/* Department Performance & Employee KPI Tracking */}
      <DepartmentPerformanceAndKPI
        deptName={deptName}
        roles={roles}
        allDeptTasks={allDeptTasks}
        doneTasks={doneTasks}
        processTasks={processTasks}
      />

      {/* Linked Tasks: 1. Process Tasks */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Process Tasks</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#FAEEDA", color: "#633806", padding: "2px 8px", borderRadius: 999 }}>
              {processTasks.length}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#8A8D98" }}>Currently in progress</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 0.9fr 1.1fr 0.9fr 1fr", fontSize: 11.5, color: "#8A8D98", padding: "0 6px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Order / Style</div>
          <div>Task / Stage</div>
          <div>Due</div>
          <div>Assigned To</div>
          <div>Status</div>
          <div>Flag</div>
        </div>

        {processTasks.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#8A8D98", fontSize: 12.5 }}>
            No process tasks
          </div>
        ) : (
          processTasks.map(({ order, stage, stageIdx }) => (
            <div
              key={order.id + "-proc-" + stageIdx}
              onClick={() => onOpenOrder && onOpenOrder(order.id)}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.4fr 0.9fr 1.1fr 0.9fr 1fr",
                alignItems: "center",
                fontSize: 12.5,
                padding: "11px 6px",
                borderBottom: "1px solid #F5F5F7",
                cursor: "pointer"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11.5, color: "#8A8D98" }}>{order.id}</div>
                <div style={{ fontWeight: 600, color: "#1B2130" }}>{order.style}</div>
              </div>
              <div style={{ color: "#1B2130" }}>{stage.name}</div>
              <div style={{ color: "#565A66" }}>{stage.planned || order.ship || "—"}</div>
              <div style={{ color: "#565A66" }}>{stage.assignee || firstNamedAssignee(deptName) || "Assigned"}</div>
              <div>{statusPill(stage.status)}</div>
              <div style={{ color: stage.reason ? "#D64545" : "#B0B2BA", fontWeight: stage.reason ? 600 : 400 }}>
                {stage.reason || "—"}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Linked Tasks: 2. Pending Tasks */}
      <Card style={{ marginBottom: 18 }}>
        <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Pending Tasks</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#F0F0F2", color: "#565A66", padding: "2px 8px", borderRadius: 999 }}>
              {pendingTasks.length}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#8A8D98" }}>Waiting to be started</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 0.9fr 1.1fr 0.9fr 1fr", fontSize: 11.5, color: "#8A8D98", padding: "0 6px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Order / Style</div>
          <div>Task / Stage</div>
          <div>Due</div>
          <div>Assigned To</div>
          <div>Status</div>
          <div>Flag</div>
        </div>

        {pendingTasks.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#8A8D98", fontSize: 12.5 }}>
            No pending tasks
          </div>
        ) : (
          pendingTasks.map(({ order, stage, stageIdx }) => (
            <div
              key={order.id + "-pend-" + stageIdx}
              onClick={() => onOpenOrder && onOpenOrder(order.id)}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.4fr 0.9fr 1.1fr 0.9fr 1fr",
                alignItems: "center",
                fontSize: 12.5,
                padding: "11px 6px",
                borderBottom: "1px solid #F5F5F7",
                cursor: "pointer"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11.5, color: "#8A8D98" }}>{order.id}</div>
                <div style={{ fontWeight: 600, color: "#1B2130" }}>{order.style}</div>
              </div>
              <div style={{ color: "#1B2130" }}>{stage.name}</div>
              <div style={{ color: "#565A66" }}>{stage.planned || order.ship || "—"}</div>
              <div style={{ color: "#565A66" }}>{stage.assignee || firstNamedAssignee(deptName) || "Assigned"}</div>
              <div>{statusPill(stage.status)}</div>
              <div style={{ color: stage.reason ? "#D64545" : "#B0B2BA", fontWeight: stage.reason ? 600 : 400 }}>
                {stage.reason || "—"}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Linked Tasks: 3. Done Tasks */}
      <Card>
        <div style={{ padding: "0 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Done Tasks</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#E1F5EE", color: "#085041", padding: "2px 8px", borderRadius: 999 }}>
              {doneTasks.length}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#8A8D98" }}>Completed tasks</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 0.9fr 1.1fr 0.9fr 1fr", fontSize: 11.5, color: "#8A8D98", padding: "0 6px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Order / Style</div>
          <div>Task / Stage</div>
          <div>Completed On</div>
          <div>Assigned To</div>
          <div>Status</div>
          <div>Flag</div>
        </div>

        {doneTasks.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#8A8D98", fontSize: 12.5 }}>
            No completed tasks
          </div>
        ) : (
          doneTasks.map(({ order, stage, stageIdx }) => (
            <div
              key={order.id + "-done-" + stageIdx}
              onClick={() => onOpenOrder && onOpenOrder(order.id)}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.4fr 0.9fr 1.1fr 0.9fr 1fr",
                alignItems: "center",
                fontSize: 12.5,
                padding: "11px 6px",
                borderBottom: "1px solid #F5F5F7",
                cursor: "pointer",
                background: "#FAFDFB"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#F0F9F5"}
              onMouseLeave={e => e.currentTarget.style.background = "#FAFDFB"}
            >
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 11.5, color: "#8A8D98" }}>{order.id}</div>
                <div style={{ fontWeight: 600, color: "#1B2130" }}>{order.style}</div>
              </div>
              <div style={{ color: "#1B2130" }}>{stage.name}</div>
              <div style={{ color: "#085041", fontWeight: 500 }}>
                {stage.completedOn || stage.completedAt || (order.completed && order.completedAt ? new Date(order.completedAt).toLocaleDateString() : null) || stage.planned || "Completed"}
              </div>
              <div style={{ color: "#565A66" }}>{stage.assignee || firstNamedAssignee(deptName) || "Assigned"}</div>
              <div>{statusPill(stage.status)}</div>
              <div style={{ color: stage.reason ? "#D64545" : "#B0B2BA", fontWeight: stage.reason ? 600 : 400 }}>
                {stage.reason || "—"}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Edit Department Modal */}
      {showEditModal && (
        <EditDepartmentModal
          deptName={deptName}
          description={deptDescriptions?.[deptName] || DEFAULT_DEPT_DESCRIPTIONS[deptName] || ""}
          roles={roles}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveDepartment}
        />
      )}

      {/* Assign Work to Supplier Modal */}
      {showAssignModal && (
        <AssignWorkModal
          orders={orders}
          suppliers={suppliers}
          prefillDept={deptName}
          onClose={() => setShowAssignModal(false)}
          onAssign={onAssignWork}
        />
      )}
    </div>
  );
}

export function OrderStageAlignmentModal({
  order,
  isOpen,
  onClose,
  onSaveStages
}) {
  if (!isOpen || !order) return null;

  const currentTemplate = order.template || "90";
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [stages, setStages] = useState(() => {
    if (Array.isArray(order.stages) && order.stages.length > 0) {
      return JSON.parse(JSON.stringify(order.stages));
    }
    return makeStages(currentTemplate, 0, null);
  });

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleTemplateChange = (tmpl) => {
    setSelectedTemplate(tmpl);
    setStages(makeStages(tmpl, 0, null));
  };

  const moveStage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;
    const nextStages = [...stages];
    const temp = nextStages[index];
    nextStages[index] = nextStages[targetIndex];
    nextStages[targetIndex] = temp;
    setStages(nextStages);
  };

  const removeStage = (index) => {
    if (stages.length <= 1) {
      alert("At least one T&A stage is required.");
      return;
    }
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "" + index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = (e, index) => {
    if (dragOverIdx === index) {
      setDragOverIdx(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== targetIndex) {
      const nextStages = [...stages];
      const [movedItem] = nextStages.splice(draggedIdx, 1);
      nextStages.splice(targetIndex, 0, movedItem);
      setStages(nextStages);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const [customStageName, setCustomStageName] = useState("");
  const [customStageDept, setCustomStageDept] = useState("Merchandising");
  const [customStageDay, setCustomStageDay] = useState("Day 10");

  const addCustomStage = (e) => {
    e.preventDefault();
    if (!customStageName.trim()) return;
    const newStage = {
      name: customStageName.trim(),
      dept: customStageDept,
      status: "pending",
      assignee: firstNamedAssignee(customStageDept),
      reason: null,
      planned: customStageDay.trim() || "Day 1",
      completedAt: null,
      completedOn: null,
      updatedAt: null,
      flaggedAt: null
    };
    setStages([...stages, newStage]);
    setCustomStageName("");
  };

  const handleSave = () => {
    onSaveStages(order.id, stages, selectedTemplate);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 16
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          width: "100%",
          maxWidth: 820,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF8FE" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#534AB7", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                T&A WORKFLOW ALIGNMENT
              </span>
              <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace", fontWeight: 600 }}>PO #{order.id}</span>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "4px 0 0" }}>
              Align & Prioritize T&A Stages: {order.style} ({order.buyer})
            </h3>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0" }}>
              Reorder stages 1 to {stages.length} to match client's actual production flow, or switch between 90-day and 120-day templates.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Template Selector Bar */}
        <div style={{ padding: "12px 24px", background: "#F3F4F6", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#374151" }}>T&A Template:</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => handleTemplateChange("90")}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  border: selectedTemplate === "90" ? "2px solid #534AB7" : "1px solid #D1D5DB",
                  background: selectedTemplate === "90" ? "#EDE9FE" : "#FFFFFF",
                  color: selectedTemplate === "90" ? "#4338CA" : "#4B5563",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                90-Day Standard ({TA_STAGES_90.length} stages)
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange("120")}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  border: selectedTemplate === "120" ? "2px solid #534AB7" : "1px solid #D1D5DB",
                  background: selectedTemplate === "120" ? "#EDE9FE" : "#FFFFFF",
                  color: selectedTemplate === "120" ? "#4338CA" : "#4B5563",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                120-Day Extended Dye/Print ({TA_STAGES_120.length} stages)
              </button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
            Total Pipeline Steps: <b style={{ color: "#1F2937" }}>{stages.length}</b>
          </div>
        </div>

        {/* Stages List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {/* Drag & Drop Instruction Banner */}
          <div style={{
            padding: "9px 14px",
            background: "#F5F3FF",
            border: "1px solid #DDD6FE",
            borderRadius: 8,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#5B21B6"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={16} color="#7C3AED" />
              <span><b>Drag & Drop Pipeline:</b> Grab any stage by the handle (<GripVertical size={13} style={{ display: "inline", verticalAlign: "middle" }} />) and drop to realign priority 1 to {stages.length}.</span>
            </div>
            <span style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600 }}>Up / Down buttons also supported</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stages.map((stage, idx) => (
              <div
                key={`${stage.name}-${idx}`}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={(e) => handleDragLeave(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: draggedIdx === idx ? "#EDE9FE" : dragOverIdx === idx ? "#F3E8FF" : (idx % 2 === 0 ? "#F9FAFB" : "#FFFFFF"),
                  border: dragOverIdx === idx ? "2px dashed #7C3AED" : draggedIdx === idx ? "2px dashed #A78BFA" : "1px solid #E5E7EB",
                  borderRadius: 8,
                  gap: 12,
                  opacity: draggedIdx === idx ? 0.45 : 1,
                  transform: dragOverIdx === idx ? "scale(1.01)" : "none",
                  transition: "background 0.15s ease, border 0.15s ease, transform 0.15s ease",
                  boxShadow: dragOverIdx === idx ? "0 4px 12px rgba(124, 58, 237, 0.15)" : "none"
                }}
              >
                {/* Priority / Order Index & Drag Handle */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <div
                    title="Drag to reorder"
                    style={{
                      cursor: "grab",
                      color: "#9CA3AF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "2px 4px",
                      borderRadius: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#534AB7"}
                    onMouseLeave={e => e.currentTarget.style.color = "#9CA3AF"}
                  >
                    <GripVertical size={17} />
                  </div>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: "#534AB7",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{stage.name}</span>
                      {stage.name.toLowerCase().includes("approval") && (
                        <span style={{ fontSize: 10, background: "#FEF3C7", color: "#92400E", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                          Gating Approval
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 2, display: "flex", gap: 10 }}>
                      <span>Department: <b style={{ color: "#374151" }}>{stage.dept}</b></span>
                      <span>Target: <b style={{ color: "#374151" }}>{stage.planned || `Day ${idx + 1}`}</b></span>
                    </div>
                  </div>
                </div>

                {/* Reorder Buttons (Move Up / Down / Remove) */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveStage(idx, -1)}
                    title="Prioritize higher (Move Up)"
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "1px solid #D1D5DB",
                      background: idx === 0 ? "#F3F4F6" : "#FFFFFF",
                      color: idx === 0 ? "#9CA3AF" : "#374151",
                      cursor: idx === 0 ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    <ArrowUp size={13} /> Up
                  </button>
                  <button
                    type="button"
                    disabled={idx === stages.length - 1}
                    onClick={() => moveStage(idx, 1)}
                    title="Prioritize lower (Move Down)"
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "1px solid #D1D5DB",
                      background: idx === stages.length - 1 ? "#F3F4F6" : "#FFFFFF",
                      color: idx === stages.length - 1 ? "#9CA3AF" : "#374151",
                      cursor: idx === stages.length - 1 ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    <ArrowDown size={13} /> Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStage(idx)}
                    title="Remove stage from this order"
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "1px solid #FECACA",
                      background: "#FEF2F2",
                      color: "#DC2626",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add custom stage */}
          <div style={{ marginTop: 16, padding: "14px 16px", background: "#F9FAFB", border: "1px dashed #D1D5DB", borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
              + Insert Custom Stage to this Pipeline
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: 10, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Stage Name (e.g. Special Foil Print)"
                value={customStageName}
                onChange={e => setCustomStageName(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
              />
              <select
                value={customStageDept}
                onChange={e => setCustomStageDept(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
              >
                {Object.keys(ORG_STRUCTURE).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Target Day (e.g. Day 22)"
                value={customStageDay}
                onChange={e => setCustomStageDay(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
              />
              <button
                type="button"
                onClick={addCustomStage}
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: "#534AB7",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Add Stage
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF8FE" }}>
          <button
            type="button"
            onClick={() => handleTemplateChange(selectedTemplate)}
            style={{
              background: "none",
              border: "none",
              color: "#6B7280",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <RotateCcw size={13} /> Reset to Default Template Order
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 18px",
                borderRadius: 7,
                border: "1px solid #D1D5DB",
                background: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
                color: "#4B5563",
                cursor: "pointer"
              }}
            >
              Skip / Keep Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: "8px 22px",
                borderRadius: 7,
                border: "none",
                background: "#1F9E8D",
                fontSize: 13,
                fontWeight: 700,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(31, 158, 141, 0.2)"
              }}
            >
              Confirm & Save T&A Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export function AuditLoggerPage({
  auditLogs = [],
  userSessions = [],
  onClearAuditLogs,
  users = [],
  teams = []
}) {
  const [activeTab, setActiveTab] = useState("userDurations"); // "userDurations" | "events"
  const [durationFormat, setDurationFormat] = useState("both"); // "both" | "mins" | "hours"
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserForDetail, setSelectedUserForDetail] = useState(null);

  // Filter state for Audit Events tab
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  // Compute dates: today start, week start (Monday), month start (1st)
  const dateRanges = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    return {
      nowMs: now.getTime(),
      todayStartMs: todayStart.getTime(),
      weekStartMs: weekStart.getTime(),
      monthStartMs: monthStart.getTime()
    };
  }, []);

  // Consolidate per-user session minutes: today, this week, this month, overall
  const userDurationStats = useMemo(() => {
    const userMap = new Map();

    // 1. Seed from registered users list
    (users || []).forEach(u => {
      const userTeamIds = Array.isArray(u.teamIds) && u.teamIds.length > 0 ? u.teamIds : (u.teamId ? [u.teamId] : []);
      const userDepts = Array.isArray(teams) ? teams.filter(t => userTeamIds.includes(t.id)).map(t => t.name) : [];
      const primaryDept = userDepts[0] || (u.teamId === "team-admin" ? "Administrators" : "General");
      const key = (u.username || u.name || u.id).toLowerCase();

      userMap.set(key, {
        id: u.id,
        username: u.username || "",
        name: u.name || u.username || "User",
        dept: primaryDept,
        departments: userDepts,
        sessions: [],
        todayMinutes: 0,
        weekMinutes: 0,
        monthMinutes: 0,
        overallMinutes: 0,
        isOnline: false,
        totalLogins: 0,
        lastLoginTime: null,
        lastDevice: null,
        lastLocation: null
      });
    });

    // 2. Aggregate from userSessions
    (userSessions || []).forEach(sess => {
      const userKey = (sess.username || sess.name || sess.userId || "").toLowerCase();
      if (!userKey) return;

      if (!userMap.has(userKey)) {
        userMap.set(userKey, {
          id: sess.userId || userKey,
          username: sess.username || userKey,
          name: sess.name || sess.username || "User",
          dept: sess.dept || "General",
          departments: [sess.dept || "General"],
          sessions: [],
          todayMinutes: 0,
          weekMinutes: 0,
          monthMinutes: 0,
          overallMinutes: 0,
          isOnline: false,
          totalLogins: 0,
          lastLoginTime: null,
          lastDevice: null,
          lastLocation: null
        });
      }

      const rec = userMap.get(userKey);
      rec.sessions.push(sess);
      rec.totalLogins += 1;

      // Calculate session duration in minutes
      let sMins = 0;
      const loginMs = sess.loginTime ? new Date(sess.loginTime).getTime() : 0;
      const logoutMs = sess.logoutTime ? new Date(sess.logoutTime).getTime() : 0;

      if (sess.active) {
        rec.isOnline = true;
        sMins = loginMs ? Math.max(1, Math.round((dateRanges.nowMs - loginMs) / 60000)) : 1;
      } else if (logoutMs && loginMs && logoutMs >= loginMs) {
        sMins = Math.max(1, Math.round((logoutMs - loginMs) / 60000));
      } else if (sess.hoursUsed) {
        sMins = Math.max(1, Math.round(Number(sess.hoursUsed) * 60));
      }

      rec.overallMinutes += sMins;

      if (loginMs >= dateRanges.todayStartMs) {
        rec.todayMinutes += sMins;
      }
      if (loginMs >= dateRanges.weekStartMs) {
        rec.weekMinutes += sMins;
      }
      if (loginMs >= dateRanges.monthStartMs) {
        rec.monthMinutes += sMins;
      }

      // Track last login info
      if (!rec.lastLoginTime || (loginMs && loginMs > new Date(rec.lastLoginTime).getTime())) {
        rec.lastLoginTime = sess.loginTime;
        rec.lastDevice = sess.device || sess.deviceType;
        rec.lastLocation = sess.location;
      }
    });

    return Array.from(userMap.values()).sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      if (b.todayMinutes !== a.todayMinutes) return b.todayMinutes - a.todayMinutes;
      return b.overallMinutes - a.overallMinutes;
    });
  }, [users, teams, userSessions, dateRanges]);

  // Filtered user stats based on search and department
  const filteredUserStats = useMemo(() => {
    return userDurationStats.filter(u => {
      if (deptFilter !== "ALL" && u.dept.toLowerCase() !== deptFilter.toLowerCase()) {
        const matchesAny = (u.departments || []).some(d => d.toLowerCase() === deptFilter.toLowerCase());
        if (!matchesAny) return false;
      }
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        const matches =
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.dept && u.dept.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [userDurationStats, deptFilter, userSearch]);

  // Overall totals across all users
  const totalSummary = useMemo(() => {
    let today = 0;
    let week = 0;
    let month = 0;
    let overall = 0;
    let onlineCount = 0;

    userDurationStats.forEach(u => {
      today += u.todayMinutes;
      week += u.weekMinutes;
      month += u.monthMinutes;
      overall += u.overallMinutes;
      if (u.isOnline) onlineCount += 1;
    });

    return { today, week, month, overall, onlineCount };
  }, [userDurationStats]);

  // Formatting helper for duration
  const formatTime = (minutes) => {
    if (!minutes || minutes <= 0) return "0 mins";
    const m = Math.round(minutes);
    const h = Math.floor(m / 60);
    const remM = m % 60;

    if (durationFormat === "mins") {
      return `${m} mins`;
    }
    if (durationFormat === "hours") {
      if (h === 0) return `${remM}m`;
      return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
    }
    // "both" (e.g. "45 mins" or "135 mins (2h 15m)")
    if (h === 0) return `${m} mins`;
    return `${m} mins (${h}h ${remM > 0 ? `${remM}m` : ""})`.replace("  ", " ");
  };

  // Export User Usage Duration CSV
  const exportUserUsageCsv = () => {
    if (filteredUserStats.length === 0) {
      alert("No user duration records to export.");
      return;
    }
    const headers = [
      "User Name",
      "Username",
      "Department",
      "Status",
      "Today (Minutes)",
      "Today (Formatted)",
      "This Week (Minutes)",
      "This Week (Formatted)",
      "This Month (Minutes)",
      "This Month (Formatted)",
      "Overall (Minutes)",
      "Overall (Formatted)",
      "Total Logins",
      "Last Login Time",
      "Last Device",
      "Last Location"
    ];

    const rows = filteredUserStats.map(u => [
      `"${(u.name || "").replace(/"/g, '""')}"`,
      `"${(u.username || "").replace(/"/g, '""')}"`,
      `"${(u.dept || "").replace(/"/g, '""')}"`,
      `"${u.isOnline ? "Online" : "Offline"}"`,
      u.todayMinutes,
      `"${formatTime(u.todayMinutes)}"`,
      u.weekMinutes,
      `"${formatTime(u.weekMinutes)}"`,
      u.monthMinutes,
      `"${formatTime(u.monthMinutes)}"`,
      u.overallMinutes,
      `"${formatTime(u.overallMinutes)}"`,
      u.totalLogins,
      `"${u.lastLoginTime || "Never"}"`,
      `"${(u.lastDevice || "").replace(/"/g, '""')}"`,
      `"${(sanitizeLocationString(u.lastLocation) || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `user_login_durations_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics for Audit Events tab
  const loginsToday = useMemo(() => {
    return auditLogs.filter(l => l.eventType === "LOGIN" && (l.timestamp || "").startsWith(todayStr)).length;
  }, [auditLogs, todayStr]);

  const stageClicks = useMemo(() => {
    return auditLogs.filter(l => l.eventType === "STAGE").length;
  }, [auditLogs]);

  const uniqueActiveUsers = useMemo(() => {
    const userSet = new Set();
    auditLogs.forEach(l => {
      if (l.username) userSet.add(l.username);
    });
    return userSet.size;
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (eventTypeFilter !== "ALL" && log.eventType !== eventTypeFilter) return false;
      if (userFilter !== "ALL" && log.username !== userFilter && log.userName !== userFilter) return false;
      if (dateFilter && !((log.timestamp || "").startsWith(dateFilter))) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          (log.action && log.action.toLowerCase().includes(q)) ||
          (log.userName && log.userName.toLowerCase().includes(q)) ||
          (log.username && log.username.toLowerCase().includes(q)) ||
          (log.userDept && log.userDept.toLowerCase().includes(q)) ||
          (log.device && log.device.toLowerCase().includes(q)) ||
          (log.location && log.location.toLowerCase().includes(q)) ||
          (log.targetId && log.targetId.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [auditLogs, eventTypeFilter, userFilter, dateFilter, searchTerm]);

  const exportEventsCsv = () => {
    if (filteredLogs.length === 0) {
      alert("No logs available to export.");
      return;
    }
    const headers = ["Timestamp", "Date", "Time", "Event Type", "User", "Username", "Department", "Action Description", "Device", "Device Type", "Location", "Target ID"];
    const rows = filteredLogs.map(l => {
      const dt = l.timestamp ? new Date(l.timestamp) : new Date();
      const datePart = dt.toLocaleDateString();
      const timePart = dt.toLocaleTimeString();
      return [
        `"${l.timestamp || ""}"`,
        `"${datePart}"`,
        `"${timePart}"`,
        `"${l.eventType || ""}"`,
        `"${(l.userName || "").replace(/"/g, '""')}"`,
        `"${(l.username || "").replace(/"/g, '""')}"`,
        `"${(l.userDept || "").replace(/"/g, '""')}"`,
        `"${(l.action || "").replace(/"/g, '""')}"`,
        `"${(l.device || "").replace(/"/g, '""')}"`,
        `"${(l.deviceType || "").replace(/"/g, '""')}"`,
        `"${(sanitizeLocationString(l.location) || "").replace(/"/g, '""')}"`,
        `"${(l.targetId || "").replace(/"/g, '""')}"`
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.join("\n")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `loom_audit_logs_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const eventBadgeStyles = {
    LOGIN: { bg: "#E0F2FE", color: "#0369A1", border: "#BAE6FD" },
    LOGOUT: { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
    ORDER: { bg: "#EDE9FE", color: "#534AB7", border: "#DDD6FE" },
    STAGE: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
    TASK: { bg: "#E1F5EE", color: "#085041", border: "#A7F3D0" },
    ATTENDANCE: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    LEAVE: { bg: "#FAEEDA", color: "#633806", border: "#FED7AA" },
    ADMIN: { bg: "#FCEBEB", color: "#791F1F", border: "#FECACA" },
    SYSTEM: { bg: "#F3F4F6", color: "#374151", border: "#E5E7EB" }
  };

  const allDepts = useMemo(() => {
    const set = new Set();
    userDurationStats.forEach(u => {
      if (u.dept) set.add(u.dept);
      (u.departments || []).forEach(d => set.add(d));
    });
    return Array.from(set).sort();
  }, [userDurationStats]);

  return (
    <div>
      <PageHeader
        title="Event Logger & Screen Time Tracking"
        sub="Administrative dashboard tracking user login minutes (per day, week, month, and overall) alongside telemetry and system audit actions."
      />

      {/* Top Navigation Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, borderBottom: "1px solid #E2E8F0", paddingBottom: 12 }}>
        <button
          type="button"
          onClick={() => setActiveTab("userDurations")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 18px",
            borderRadius: 8,
            border: activeTab === "userDurations" ? "1.5px solid #534AB7" : "1px solid #CBD5E1",
            background: activeTab === "userDurations" ? "#534AB7" : "#FFFFFF",
            color: activeTab === "userDurations" ? "#FFFFFF" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: activeTab === "userDurations" ? "0 2px 4px rgba(83, 74, 183, 0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <Clock size={16} />
          User Login & Screen Time Breakdown
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            background: activeTab === "userDurations" ? "rgba(255,255,255,0.25)" : "#E2E8F0",
            color: activeTab === "userDurations" ? "#FFFFFF" : "#334155",
            padding: "1px 7px",
            borderRadius: 999
          }}>
            {filteredUserStats.length} Users
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("events")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 18px",
            borderRadius: 8,
            border: activeTab === "events" ? "1.5px solid #534AB7" : "1px solid #CBD5E1",
            background: activeTab === "events" ? "#534AB7" : "#FFFFFF",
            color: activeTab === "events" ? "#FFFFFF" : "#475569",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: activeTab === "events" ? "0 2px 4px rgba(83, 74, 183, 0.25)" : "none",
            transition: "all 0.15s ease"
          }}
        >
          <Activity size={16} />
          All Audit Events & Activity Trail
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            background: activeTab === "events" ? "rgba(255,255,255,0.25)" : "#E2E8F0",
            color: activeTab === "events" ? "#FFFFFF" : "#334155",
            padding: "1px 7px",
            borderRadius: 999
          }}>
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* KPI Cards based on Active Tab */}
      {activeTab === "userDurations" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          <Card style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Today's Total Time</div>
              <span style={{ fontSize: 11, color: "#059669", background: "#ECFDF5", padding: "1px 7px", borderRadius: 6, fontWeight: 700 }}>Per Day</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#059669" }}>
              {formatTime(totalSummary.today)}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
              Active today across all logged-in staff
            </div>
          </Card>

          <Card style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>This Week's Time</div>
              <span style={{ fontSize: 11, color: "#2563EB", background: "#EFF6FF", padding: "1px 7px", borderRadius: 6, fontWeight: 700 }}>Per Week</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#2563EB" }}>
              {formatTime(totalSummary.week)}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
              Since Monday 00:00 AM
            </div>
          </Card>

          <Card style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>This Month's Time</div>
              <span style={{ fontSize: 11, color: "#7C3AED", background: "#F5F3FF", padding: "1px 7px", borderRadius: 6, fontWeight: 700 }}>Per Month</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#7C3AED" }}>
              {formatTime(totalSummary.month)}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
              Cumulative for current calendar month
            </div>
          </Card>

          <Card style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Overall Total Time</div>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "#059669",
                background: "#ECFDF5",
                padding: "2px 7px",
                borderRadius: 999,
                fontWeight: 700
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                {totalSummary.onlineCount} Online
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: "#1E293B" }}>
              {formatTime(totalSummary.overall)}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
              All-time logged usage hours
            </div>
          </Card>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          <Card style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8A8D98" }}>Total Recorded Events</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "#1F2937" }}>
              {auditLogs.length}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Full administrative history</div>
          </Card>
          <Card style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8A8D98" }}>Logins Today</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "#059669", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#059669", boxShadow: "0 0 6px #059669" }} />
              {loginsToday}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Daily present verifications</div>
          </Card>
          <Card style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8A8D98" }}>T&A Stage Clicks</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "#D97706" }}>
              {stageClicks}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Pipeline updates recorded</div>
          </Card>
          <Card style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8A8D98" }}>Unique Active Users</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "#534AB7" }}>
              {uniqueActiveUsers}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Across all departments</div>
          </Card>
        </div>
      )}

      {/* TAB 1: User Login & Screen Time Breakdown */}
      {activeTab === "userDurations" && (
        <Card>
          {/* Controls Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 16px", borderBottom: "1px solid #F1F5F9", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Search */}
              <div style={{ position: "relative", minWidth: 220 }}>
                <input
                  type="text"
                  placeholder="Search user name or username..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 12px 7px 30px",
                    borderRadius: 7,
                    border: "1px solid #D1D5DB",
                    fontSize: 12.5,
                    boxSizing: "border-box"
                  }}
                />
                <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              </div>

              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "1px solid #D1D5DB",
                  fontSize: 12.5,
                  background: "#FFFFFF",
                  color: "#374151"
                }}
              >
                <option value="ALL">All Departments</option>
                {allDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Format Toggle */}
              <div style={{ display: "inline-flex", alignItems: "center", background: "#F1F5F9", padding: "3px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <button
                  type="button"
                  onClick={() => setDurationFormat("both")}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: "none",
                    background: durationFormat === "both" ? "#FFFFFF" : "transparent",
                    color: durationFormat === "both" ? "#534AB7" : "#64748B",
                    boxShadow: durationFormat === "both" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    cursor: "pointer"
                  }}
                >
                  Both (Mins + Hours)
                </button>
                <button
                  type="button"
                  onClick={() => setDurationFormat("mins")}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: "none",
                    background: durationFormat === "mins" ? "#FFFFFF" : "transparent",
                    color: durationFormat === "mins" ? "#534AB7" : "#64748B",
                    boxShadow: durationFormat === "mins" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    cursor: "pointer"
                  }}
                >
                  Minutes Only (mins)
                </button>
                <button
                  type="button"
                  onClick={() => setDurationFormat("hours")}
                  style={{
                    padding: "4px 10px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: "none",
                    background: durationFormat === "hours" ? "#FFFFFF" : "transparent",
                    color: durationFormat === "hours" ? "#534AB7" : "#64748B",
                    boxShadow: durationFormat === "hours" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    cursor: "pointer"
                  }}
                >
                  Hours & Mins
                </button>
              </div>
            </div>

            {/* Export CSV */}
            <div>
              <button
                type="button"
                onClick={exportUserUsageCsv}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "1px solid #D1D5DB",
                  background: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer"
                }}
              >
                <Download size={13} /> Export Usage CSV
              </button>
            </div>
          </div>

          {/* User Screen Time Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 980 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E5E7EB", background: "#F8FAFC" }}>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "170px" }}>User / Staff</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "130px" }}>Department</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "95px" }}>Live Status</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#059669", width: "140px" }}>Per Day (Today)</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#2563EB", width: "145px" }}>Per Week (This Week)</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#7C3AED", width: "150px" }}>Per Month (This Month)</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#1E293B", width: "150px" }}>Overall (All-Time)</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "80px", textAlign: "center" }}>Logins</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "100px", textAlign: "center" }}>History</th>
                </tr>
              </thead>
              <tbody>
                {filteredUserStats.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "40px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                      No user records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUserStats.map(u => {
                    return (
                      <tr
                        key={u.id || u.username}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          transition: "background 0.1s ease",
                          verticalAlign: "middle"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {/* User Profile */}
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              background: u.isOnline ? "#ECFDF5" : "#EEF2FF",
                              color: u.isOnline ? "#059669" : "#4F46E5",
                              fontWeight: 700,
                              fontSize: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              border: u.isOnline ? "2px solid #10B981" : "1px solid #E0E7FF"
                            }}>
                              {(u.name || u.username || "U").slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#1E293B", fontSize: 13 }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>@{u.username || "—"}</div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "2px 7px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: "#F1F5F9",
                            color: "#475569",
                            border: "1px solid #E2E8F0"
                          }}>
                            {u.dept || "General"}
                          </span>
                        </td>

                        {/* Live Status */}
                        <td style={{ padding: "12px" }}>
                          {u.isOnline ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 8px",
                              borderRadius: 999,
                              background: "#ECFDF5",
                              color: "#059669",
                              fontSize: 11,
                              fontWeight: 700
                            }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 5px #10B981" }} />
                              Online
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 6px",
                              borderRadius: 999,
                              background: "#F8FAFC",
                              color: "#94A3B8",
                              fontSize: 11,
                              fontWeight: 500
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1" }} />
                              Offline
                            </span>
                          )}
                        </td>

                        {/* Today's Time (Per Day) */}
                        <td style={{ padding: "12px" }}>
                          {u.todayMinutes > 0 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <span style={{
                                fontWeight: 700,
                                color: "#059669",
                                background: "#ECFDF5",
                                padding: "2px 8px",
                                borderRadius: 6,
                                border: "1px solid #A7F3D0",
                                fontSize: 12
                              }}>
                                {formatTime(u.todayMinutes)}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* This Week (Per Week) */}
                        <td style={{ padding: "12px" }}>
                          {u.weekMinutes > 0 ? (
                            <span style={{
                              fontWeight: 700,
                              color: "#2563EB",
                              background: "#EFF6FF",
                              padding: "2px 8px",
                              borderRadius: 6,
                              border: "1px solid #BFDBFE",
                              fontSize: 12
                            }}>
                              {formatTime(u.weekMinutes)}
                            </span>
                          ) : (
                            <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* This Month (Per Month) */}
                        <td style={{ padding: "12px" }}>
                          {u.monthMinutes > 0 ? (
                            <span style={{
                              fontWeight: 700,
                              color: "#7C3AED",
                              background: "#F5F3FF",
                              padding: "2px 8px",
                              borderRadius: 6,
                              border: "1px solid #DDD6FE",
                              fontSize: 12
                            }}>
                              {formatTime(u.monthMinutes)}
                            </span>
                          ) : (
                            <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* Overall Time */}
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            fontWeight: 700,
                            color: "#1E293B",
                            background: "#F8FAFC",
                            padding: "2px 8px",
                            borderRadius: 6,
                            border: "1px solid #E2E8F0",
                            fontSize: 12
                          }}>
                            {formatTime(u.overallMinutes)}
                          </span>
                        </td>

                        {/* Total Logins */}
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: "#475569",
                            background: "#F1F5F9",
                            padding: "2px 7px",
                            borderRadius: 999
                          }}>
                            {u.totalLogins}
                          </span>
                        </td>

                        {/* View History Button */}
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDetail(u)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid #CBD5E1",
                              background: "#FFFFFF",
                              color: "#534AB7",
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                            title="View full login history"
                          >
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: All Audit Events & Action Trail */}
      {activeTab === "events" && (
        <Card>
          {/* Controls Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 16px", borderBottom: "1px solid #F1F5F9", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ position: "relative", minWidth: 240 }}>
                <input
                  type="text"
                  placeholder="Search action, user, PO, device..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 12px 7px 30px",
                    borderRadius: 7,
                    border: "1px solid #D1D5DB",
                    fontSize: 12.5,
                    boxSizing: "border-box"
                  }}
                />
                <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              </div>

              <select
                value={eventTypeFilter}
                onChange={e => setEventTypeFilter(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "1px solid #D1D5DB",
                  fontSize: 12.5,
                  background: "#FFFFFF",
                  color: "#374151"
                }}
              >
                <option value="ALL">All Event Types</option>
                <option value="LOGIN">Logins</option>
                <option value="LOGOUT">Logouts</option>
                <option value="ORDER">Order Actions</option>
                <option value="STAGE">T&A Stages</option>
                <option value="TASK">Tasks</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="LEAVE">Leaves</option>
                <option value="ADMIN">Admin / Settings</option>
              </select>

              <select
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                style={{
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "1px solid #D1D5DB",
                  fontSize: 12.5,
                  background: "#FFFFFF",
                  color: "#374151"
                }}
              >
                <option value="ALL">All Users</option>
                {Array.from(new Set(auditLogs.map(l => l.userName).filter(Boolean))).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 7,
                  border: "1px solid #D1D5DB",
                  fontSize: 12.5,
                  color: "#374151"
                }}
              />

              {(searchTerm || eventTypeFilter !== "ALL" || userFilter !== "ALL" || dateFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setEventTypeFilter("ALL");
                    setUserFilter("ALL");
                    setDateFilter("");
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    background: "#F9FAFB",
                    fontSize: 11.5,
                    color: "#4B5563",
                    cursor: "pointer"
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={exportEventsCsv}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "1px solid #D1D5DB",
                  background: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer"
                }}
              >
                <Download size={13} /> Export Events CSV
              </button>

              {onClearAuditLogs && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear all audit logs? This action cannot be undone.")) {
                      onClearAuditLogs();
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 7,
                    border: "1px solid #FCA5A5",
                    background: "#FEF2F2",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#DC2626",
                    cursor: "pointer"
                  }}
                >
                  <Trash2 size={13} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Table Container with Overflow & Semantic Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 920 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E5E7EB", background: "#F8FAFC" }}>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "140px", whiteSpace: "nowrap" }}>Date & Time</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "95px", whiteSpace: "nowrap" }}>Event Type</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "170px" }}>User & Department</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569" }}>Action / Clicks</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "195px" }}>Device Telemetry</th>
                  <th style={{ padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: "#475569", width: "230px" }}>Location (GPS / Region)</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                      No audit events found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const dt = log.timestamp ? new Date(log.timestamp) : new Date();
                    const dateStr = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                    const timeStr = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
                    const badgeStyle = eventBadgeStyles[log.eventType] || eventBadgeStyles.SYSTEM;
                    const isMobile = log.deviceType === "Mobile" || (log.device && /Mobile|Android|iPhone/i.test(log.device));

                    return (
                      <tr
                        key={log.id}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          transition: "background 0.1s ease",
                          verticalAlign: "middle"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 600, color: "#1F2937", fontSize: 12.5 }}>{dateStr}</div>
                          <div style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace", marginTop: 2 }}>{timeStr}</div>
                        </td>

                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: `1px solid ${badgeStyle.border}`,
                            letterSpacing: 0.3
                          }}>
                            {log.eventType}
                          </span>
                        </td>

                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "#534AB7",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 700,
                              flexShrink: 0
                            }}>
                              {(log.userName || "U").charAt(0).toUpperCase()}
                            </span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5 }}>{log.userName}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2, paddingLeft: 29 }}>
                            {log.userDept || "General"}
                          </div>
                        </td>

                        <td style={{ padding: "12px", color: "#374151" }}>
                          <div style={{ lineHeight: 1.45, fontSize: 12.5 }}>{log.action}</div>
                          {log.targetId && (
                            <span style={{ display: "inline-block", marginTop: 2, fontSize: 10.5, fontFamily: "monospace", color: "#534AB7", background: "#F5F3FF", padding: "1px 6px", borderRadius: 4 }}>
                              Ref: {log.targetId}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#1F2937", fontWeight: 600, fontSize: 12 }}>
                            {isMobile ? <Smartphone size={14} color="#534AB7" /> : <Laptop size={14} color="#1F9E8D" />}
                            <span>{log.deviceType || (isMobile ? "Mobile" : "Laptop / Desktop")}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.device}>
                            {log.device || "Browser Client"}
                          </div>
                        </td>

                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#1F2937", fontSize: 12 }}>
                            <MapPin size={13} color="#DC2626" style={{ flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={sanitizeLocationString(log.location)}>
                              {sanitizeLocationString(log.location) || "Local Office"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Individual User Sessions Detail Modal */}
      {selectedUserForDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16
          }}
          onClick={() => setSelectedUserForDetail(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              width: "100%",
              maxWidth: 820,
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: selectedUserForDetail.isOnline ? "#ECFDF5" : "#EEF2FF",
                  color: selectedUserForDetail.isOnline ? "#059669" : "#4F46E5",
                  fontWeight: 700,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: selectedUserForDetail.isOnline ? "2px solid #10B981" : "1px solid #CBD5E1"
                }}>
                  {(selectedUserForDetail.name || "U").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1E293B" }}>
                    {selectedUserForDetail.name}
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B", marginLeft: 8 }}>
                      @{selectedUserForDetail.username || "—"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748B", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <span>Dept: <strong>{selectedUserForDetail.dept}</strong></span>
                    <span>·</span>
                    <span>Status: {selectedUserForDetail.isOnline ? <strong style={{ color: "#059669" }}>● Online Now</strong> : "Offline"}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                style={{
                  border: "none",
                  background: "#F1F5F9",
                  borderRadius: 6,
                  width: 30,
                  height: 30,
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

            {/* Modal Summary Badges */}
            <div style={{ padding: "12px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}>
                <span style={{ color: "#64748B" }}>Today: </span>
                <strong style={{ color: "#059669" }}>{formatTime(selectedUserForDetail.todayMinutes)}</strong>
              </div>
              <div style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}>
                <span style={{ color: "#64748B" }}>This Week: </span>
                <strong style={{ color: "#2563EB" }}>{formatTime(selectedUserForDetail.weekMinutes)}</strong>
              </div>
              <div style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}>
                <span style={{ color: "#64748B" }}>This Month: </span>
                <strong style={{ color: "#7C3AED" }}>{formatTime(selectedUserForDetail.monthMinutes)}</strong>
              </div>
              <div style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}>
                <span style={{ color: "#64748B" }}>Overall: </span>
                <strong style={{ color: "#1E293B" }}>{formatTime(selectedUserForDetail.overallMinutes)}</strong>
              </div>
              <div style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}>
                <span style={{ color: "#64748B" }}>Total Sessions: </span>
                <strong style={{ color: "#475569" }}>{selectedUserForDetail.sessions.length}</strong>
              </div>
            </div>

            {/* Sessions Table */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
              {selectedUserForDetail.sessions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8", fontSize: 13 }}>
                  No recorded login sessions for this user yet.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#475569" }}>
                      <th style={{ padding: "8px 6px" }}>Login Time</th>
                      <th style={{ padding: "8px 6px" }}>Logout Time</th>
                      <th style={{ padding: "8px 6px" }}>Duration (Minutes)</th>
                      <th style={{ padding: "8px 6px" }}>Device</th>
                      <th style={{ padding: "8px 6px" }}>Location</th>
                      <th style={{ padding: "8px 6px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserForDetail.sessions.map((sess, idx) => {
                      const loginDate = sess.loginTime ? new Date(sess.loginTime) : null;
                      const logoutDate = sess.logoutTime ? new Date(sess.logoutTime) : null;
                      const loginMs = loginDate ? loginDate.getTime() : 0;
                      const logoutMs = logoutDate ? logoutDate.getTime() : 0;
                      let sMins = 0;
                      if (sess.active) {
                        sMins = loginMs ? Math.max(1, Math.round((Date.now() - loginMs) / 60000)) : 1;
                      } else if (logoutMs && loginMs) {
                        sMins = Math.max(1, Math.round((logoutMs - loginMs) / 60000));
                      } else if (sess.hoursUsed) {
                        sMins = Math.max(1, Math.round(Number(sess.hoursUsed) * 60));
                      }

                      return (
                        <tr key={sess.id || idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "9px 6px", color: "#1E293B", fontWeight: 600 }}>
                            {loginDate ? loginDate.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ padding: "9px 6px", color: "#64748B" }}>
                            {sess.active ? (
                              <span style={{ color: "#059669", fontWeight: 700 }}>In Progress...</span>
                            ) : logoutDate ? (
                              logoutDate.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                            ) : "—"}
                          </td>
                          <td style={{ padding: "9px 6px" }}>
                            <span style={{
                              fontWeight: 700,
                              color: sess.active ? "#059669" : "#1E293B",
                              background: sess.active ? "#ECFDF5" : "#F1F5F9",
                              padding: "2px 7px",
                              borderRadius: 6
                            }}>
                              {formatTime(sMins)}
                            </span>
                          </td>
                          <td style={{ padding: "9px 6px", color: "#475569" }}>
                            {sess.device || sess.deviceType || "Laptop"}
                          </td>
                          <td style={{ padding: "9px 6px", color: "#475569" }}>
                            {sanitizeLocationString(sess.location) || "Office"}
                          </td>
                          <td style={{ padding: "9px 6px", textAlign: "center" }}>
                            {sess.active ? (
                              <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 999, background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 700 }}>
                                Online Now
                              </span>
                            ) : (
                              <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 999, background: "#F1F5F9", color: "#64748B", fontSize: 11 }}>
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}