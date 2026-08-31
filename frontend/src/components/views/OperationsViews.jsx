import React, { useState, useMemo } from "react";
import { CheckCircle2, Upload, Plus, Trash2, Check, RotateCcw, Archive, X } from "lucide-react";
import {
  TA_STAGES, DEPT_ICONS, ORG_STRUCTURE, ATTENDANCE_STATUS_STYLE, CERT_STATUS_STYLE
} from "../../constants/loomData.js";
import {
  Card, CardHeader, PageHeader, BackLink, statusPill, riskDot, collectTasks, GroupedTaskList, OrgChain, TaskTable
} from "../common/CommonUI.jsx";

export function OrdersPage({
  orders = [],
  onOpenOrder,
  onAddOrder,
  onCompleteOrder,
  onUncompleteOrder,
  onDeleteOrder,
  onRestoreOrder
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeletedSection, setShowDeletedSection] = useState(true);
  const [form, setForm] = useState({
    id: "",
    style: "",
    buyer: "Zara",
    country: "Spain",
    season: "AW26",
    qty: 10000,
    ship: "25 May",
    risk: "low",
    status: "On Track"
  });

  const activeOrders = useMemo(() => orders.filter(o => o.isDeleted !== true && o.completed !== true), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.completed === true && o.isDeleted !== true), [orders]);
  const deletedOrders = useMemo(() => orders.filter(o => o.isDeleted === true), [orders]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id.trim() || !form.style.trim()) return;

    const newOrder = {
      id: form.id.trim().toUpperCase(),
      style: form.style.trim(),
      buyer: form.buyer.trim(),
      country: form.country.trim(),
      season: form.season.trim(),
      qty: Number(form.qty) || 5000,
      ship: form.ship.trim() || "15 Jun",
      risk: form.risk,
      status: form.status,
      completed: false,
      isDeleted: false,
      completedAt: null,
      deletedAt: null,
    };

    if (onAddOrder) onAddOrder(newOrder);
    setForm({
      id: "",
      style: "",
      buyer: "Zara",
      country: "Spain",
      season: "AW26",
      qty: 10000,
      ship: "25 May",
      risk: "low",
      status: "On Track"
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

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.7fr 0.9fr 0.8fr", fontSize: 11.5, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>PO / Style</div><div>Buyer</div><div>Country</div><div>Season</div><div>Qty</div><div>Ship date</div><div>Risk</div><div>Status</div><div style={{ textAlign: "right" }}>Actions</div>
        </div>

        {activeOrders.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
            No active orders. Click <strong>+ Add Order</strong> above to create one.
          </div>
        ) : (
          activeOrders.map(o => (
            <div
              key={o.id}
              style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.7fr 0.9fr 0.8fr", alignItems: "center", fontSize: 13, padding: "12px 4px", borderBottom: "1px solid #F5F5F7" }}
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
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteOrder && onDeleteOrder(o.id); }}
                  title="Delete order (move to history)"
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

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.8fr 1.1fr", fontSize: 11.5, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>PO / Style</div><div>Buyer</div><div>Country</div><div>Season</div><div>Qty</div><div>Ship date</div><div>Status</div><div style={{ textAlign: "right" }}>Actions</div>
        </div>

        {completedOrders.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "#8A8D98", fontSize: 12.5 }}>
            No completed orders yet. Complete all T&A stages inside an order's details page to automatically move it here.
          </div>
        ) : (
          completedOrders.map(o => (
            <div
              key={o.id}
              style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 0.8fr 1.1fr", alignItems: "center", fontSize: 13, padding: "12px 4px", borderBottom: "1px solid #F5F5F7", background: "#FAFDFB" }}
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
                <span style={{ background: "#E1F5EE", color: "#085041", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
                  Completed
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                <button
                  onClick={() => onUncompleteOrder && onUncompleteOrder(o.id)}
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
                <button
                  onClick={() => onDeleteOrder && onDeleteOrder(o.id)}
                  title="Delete order"
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
              </div>
            </div>
          ))
        )}
      </Card>

      {/* 3. Deleted Orders / History Section */}
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
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 1fr 0.8fr", fontSize: 11.5, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
              <div>PO / Style</div><div>Buyer</div><div>Country</div><div>Season</div><div>Qty</div><div>Ship date</div><div>Deleted date</div><div style={{ textAlign: "right" }}>Actions</div>
            </div>

            {deletedOrders.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#8A8D98", fontSize: 12.5 }}>
                No deleted orders in history.
              </div>
            ) : (
              deletedOrders.map(o => (
                <div
                  key={o.id}
                  style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 0.8fr 1fr 0.8fr", alignItems: "center", fontSize: 13, padding: "12px 4px", borderBottom: "1px solid #F5F5F7", opacity: 0.85 }}
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
                  <div style={{ fontSize: 11.5, color: "#9CA3AF" }}>
                    {o.deletedAt ? new Date(o.deletedAt).toLocaleDateString() : "Archived"}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button
                      onClick={() => onRestoreOrder && onRestoreOrder(o.id)}
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
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </Card>

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
          onClick={() => setShowAddModal(false)}
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
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
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
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
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
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Destination Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Spain"
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
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
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
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
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
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
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4B5563", marginBottom: 4 }}>Initial Risk</label>
                  <select
                    value={form.risk}
                    onChange={e => setForm({ ...form, risk: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
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
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13 }}
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
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function MyTasksPage({
  orders = [],
  role,
  tasks = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onOpenOrder
}) {
  const [showModal, setShowModal] = useState(false);
  const [taskTab, setTaskTab] = useState("all"); // "all" | "custom" | "tna"
  const [form, setForm] = useState({
    title: "",
    orderId: "",
    dept: role?.dept || "Merchandising",
    assignee: role?.label?.split(" (")[0] || "",
    dueDate: "20 May",
    priority: "medium",
    notes: ""
  });

  const tnaRows = useMemo(() => collectTasks(orders, role?.dept).filter(r => r.stage.status !== "done"), [orders, role]);
  
  const roleCustomTasks = useMemo(() => {
    return tasks.filter(t => !role?.dept || role.fullAccess || t.dept === role.dept || t.dept === "All");
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
      {/* Page Header with Title and Add Task button */}
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
                    {orders.filter(o => !o.isDeleted).map(o => (
                      <option key={o.id} value={o.id}>{o.id} - {o.style}</option>
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

export function ApprovalsPage({ orders, onOpenOrder }) {
  const rows = useMemo(() => collectTasks(orders, null).filter(r => r.stage.name.toLowerCase().includes("approval") || r.stage.name === "Tech Pack Received"), [orders]);
  const pendingCount = rows.filter(r => r.stage.status !== "done").length;
  return (
    <div>
      <PageHeader title="Approvals" sub={`Buyer approval checkpoints — Fit, Size Set, and PP — plus tech pack receipt. ${pendingCount} not yet approved.`} />
      <Card>
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

export function CompliancePage({ certifications, onCycle, onUpload }) {
  return (
    <div>
      <PageHeader title="Compliance & Certification" sub="TC, GOTS, and OCS applications owned by the Compliance & Certification team — click a status to update it, and attach the certificate once it's obtained" />
      <Card>
        {certifications.map(c => {
          const st = CERT_STATUS_STYLE[c.status] || CERT_STATUS_STYLE.not_applied;
          const inputId = `cert-upload-${c.key}`;
          return (
            <div key={c.key} style={{ padding: "14px 4px", borderBottom: "1px solid #F5F5F7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1B2130" }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>{c.note}</div>
                </div>
                <span
                  onClick={() => onCycle(c.key)}
                  style={{ cursor: "pointer", background: st.bg, color: st.fg, fontSize: 11.5, fontWeight: 600, padding: "5px 12px", borderRadius: 999, whiteSpace: "nowrap" }}
                >
                  {st.label}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, background: c.file ? "#F7FBF9" : "#FAFAFB", border: `1px solid ${c.file ? "#DCEFE6" : "#EFEFF2"}`, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 11.5, color: c.file ? "#1F9E8D" : "#B0B2BA", display: "flex", alignItems: "center", gap: 6 }}>
                  {c.file ? <><CheckCircle2 size={13} /> {c.file} attached</> : "Certificate not uploaded yet"}
                </div>
                <div>
                  <input
                    type="file"
                    id={inputId}
                    style={{ display: "none" }}
                    onChange={e => { const f = e.target.files[0]; if (f) onUpload(c.key, f.name); }}
                  />
                  <label
                    htmlFor={inputId}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "#534AB7", background: "#F0EFFB", border: "1px solid #D9D6F5", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}
                  >
                    <Upload size={11} /> {c.file ? "Replace" : "Upload certificate"}
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

export function AttendancePage({ roster, attendance, onCycle, leaveRequests, onApprove, onReject, onAddStaff, onEditStaff, onRemoveStaff, onAddLeaveRequest }) {
  const [form, setForm] = useState({ name: "", title: "", dept: Object.keys(ORG_STRUCTURE)[0] });
  const [editingName, setEditingName] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", title: "", dept: "" });
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ name: "", dept: "", from: "", to: "", reason: "" });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setEdit = (field, val) => setEditForm(f => ({ ...f, [field]: val }));

  const counts = { present: 0, absent: 0, leave: 0 };
  roster.forEach(s => { counts[attendance[s.name] || "present"]++; });
  const pending = leaveRequests.filter(l => l.status === "pending");

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
      <PageHeader title="Attendance & Leave" sub="Click a staff member's status to cycle Present → Absent → On leave. Add new joiners or edit/remove team members below." />
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

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Add a joiner" sub="Add anyone new who's joined the team — changes persist immediately" />
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.2fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full name" style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Title</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Junior / Incharge" style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
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
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.8fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Name</div><div>Title</div><div>Department</div><div>Status</div><div style={{ textAlign: "right" }}>Actions</div>
        </div>
        {roster.map(s => {
          const isEditing = editingName === s.name;
          const status = attendance[s.name] || "present";
          const st = ATTENDANCE_STATUS_STYLE[status] || ATTENDANCE_STATUS_STYLE.present;

          if (isEditing) {
            return (
              <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.8fr", alignItems: "center", fontSize: 12.5, padding: "8px 4px", borderBottom: "1px solid #F7F7F9", background: "#FAF9FE" }}>
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
            <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.8fr", alignItems: "center", fontSize: 12.5, padding: "8px 4px", borderBottom: "1px solid #F7F7F9" }}>
              <div style={{ fontWeight: 600, color: "#1B2130" }}>{s.name}</div>
              <div style={{ color: "#8A8D98" }}>{s.title}</div>
              <div style={{ color: "#8A8D98" }}>{s.dept}</div>
              <div>
                <span
                  onClick={() => onCycle(s.name)}
                  style={{ cursor: "pointer", background: st.bg, color: st.fg, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}
                >
                  {st.label}
                </span>
              </div>
              <div style={{ textAlign: "right", display: "flex", gap: 10, justifyContent: "flex-end" }}>
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
    </div>
  );
}

export function DepartmentsPage({ orders, onOpenDept, orgStructure }) {
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
          return (
            <Card key={deptName} style={{ cursor: "pointer" }}>
              <div onClick={() => onOpenDept(deptName)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F0EFFB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={13} color="#534AB7" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>{deptName}</div>
                  </div>
                  {taskCount !== null && <span style={{ fontSize: 11, color: "#8A8D98" }}>{taskCount} open tasks</span>}
                </div>
                <div style={{ fontSize: 11, color: "#8A8D98", marginBottom: 6 }}>{roles.length} roles · {linkedStages.length > 0 ? `owns: ${linkedStages.join(", ")}` : "support function"}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function DepartmentDetail({ deptName, orders, onBack, onOpenOrder, orgStructure }) {
  const roles = orgStructure[deptName] || [];
  const rows = collectTasks(orders, deptName);
  const linkedStages = TA_STAGES.filter(s => s.dept === deptName);
  return (
    <div>
      <BackLink onClick={onBack} label="Back to departments" />
      <PageHeader title={deptName} sub={linkedStages.length > 0 ? `Owns T&A step${linkedStages.length > 1 ? "s" : ""}: ${linkedStages.map(s => s.name).join(", ")}` : "Support department — not yet a T&A step owner"} />
      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Reporting structure & responsibilities" />
        <OrgChain roles={roles} />
      </Card>
      <Card>
        <CardHeader title="Linked tasks" />
        {linkedStages.length > 0 ? (
          <TaskTable rows={rows} onOpenOrder={onOpenOrder} emptyText="No tasks tracked for this department yet." />
        ) : (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>This department isn't a T&A stage owner in the current template, so no live tasks show here yet.</div>
        )}
      </Card>
    </div>
  );
}
