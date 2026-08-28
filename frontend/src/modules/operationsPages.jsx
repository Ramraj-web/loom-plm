import React, { useEffect, useState } from "react";
import { Eye, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { resourcesApi } from "../api.js";

const panel = { background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, padding: 18, marginBottom: 16 };
const muted = { color: "#697386", fontSize: 13 };
const button = { border: 0, borderRadius: 7, padding: "8px 12px", cursor: "pointer", fontWeight: 600, color: "#fff", background: "#168A78" };
const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #DDE1E8", borderRadius: 7, fontSize: 13, boxSizing: "border-box" };
const iconButton = { border: "1px solid #DDE1E8", background: "#fff", color: "#315E8A", borderRadius: 6, padding: 6, cursor: "pointer" };

function useOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { resourcesApi.list("orders").then(setOrders).catch(e => setError(e.message)); }, []);
  return { orders, error };
}

function Layout({ title, description, children, error }) {
  return <section><div style={{ marginBottom: 22 }}><h1 style={{ margin: 0, color: "#172033", fontSize: 26 }}>{title}</h1><p style={{ ...muted, margin: "7px 0 0" }}>{description}</p></div>{error && <div style={{ ...panel, color: "#8B2630", background: "#FCEBEB" }}>{error}</div>}{children}</section>;
}

function OrderTable({ orders, onOpen, onEdit, onDelete, onRestore, deleted = false }) {
  return <div style={{ ...panel, overflowX: "auto" }}>{orders.length === 0 ? <div style={muted}>{deleted ? "Trash is empty." : "No live orders found."}</div> : <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}><thead><tr>{["PO / Style", "Buyer", "Country", "Quantity", "Ship date", "Risk", "Status", "Actions"].map(label => <th key={label} style={th}>{label}</th>)}</tr></thead><tbody>{orders.map(order => <tr key={order.id}><td style={td}><strong>{order.id}</strong><br /><span style={muted}>{order.style}</span></td><td style={td}>{order.buyer}</td><td style={td}>{order.country}</td><td style={td}>{Number(order.qty || 0).toLocaleString()}</td><td style={td}>{order.ship}</td><td style={td}>{order.risk}</td><td style={td}>{order.status}</td><td style={td}><div style={{ display: "flex", gap: 6 }}><button onClick={() => onOpen(order)} title="View" style={iconButton}><Eye size={14} /></button>{deleted ? <button onClick={() => onRestore(order)} title="Restore" style={{ ...iconButton, color: "#168A78" }}><RotateCcw size={14} /></button> : <><button onClick={() => onEdit(order)} title="Edit" style={iconButton}><Pencil size={14} /></button><button onClick={() => onDelete(order)} title="Delete" style={{ ...iconButton, color: "#B53D45" }}><Trash2 size={14} /></button></>}</div></td></tr>)}</tbody></table>}</div>;
}

const orderFields = ["id", "buyer", "country", "season", "style", "qty", "ship", "risk", "status"];
const emptyOrder = { id: "", buyer: "", country: "", season: "", style: "", qty: "", ship: "", risk: "medium", status: "On Track" };

export function OrdersPage({ onOpenOrder }) {
  const { orders: initialOrders, error: initialError } = useOrders();
  const [orders, setOrders] = useState([]);
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [form, setForm] = useState(emptyOrder);
  const [mode, setMode] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setOrders(initialOrders); }, [initialOrders]);
  async function loadTrash() { try { setDeletedOrders(await resourcesApi.list("orders?trash=true")); } catch (e) { setError(e.message); } }
  function beginAdd() { setForm(emptyOrder); setMode("add"); setError(""); }
  function beginEdit(order) { setForm(Object.fromEntries(orderFields.map(field => [field, order[field] ?? ""]))); setMode("edit"); setError(""); }
  function view(order) { setForm(order); setMode("view"); setError(""); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const value = { ...form, id: form.id.trim(), qty: Number(form.qty) };
      const saved = mode === "add" ? await resourcesApi.create("orders", value) : await resourcesApi.update("orders", form.id, value);
      setOrders(current => mode === "add" ? [saved, ...current] : current.map(order => order.id === saved.id ? saved : order));
      setMode(null);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  async function remove(order) { if (!window.confirm(`Delete order ${order.id}?`)) return; try { await resourcesApi.remove("orders", order.id); setOrders(current => current.filter(item => item.id !== order.id)); await loadTrash(); } catch (e) { setError(e.message); } }
  async function restore(order) { try { const saved = await resourcesApi.update("orders", order.id, { ...order, isDeleted: false, deletedAt: null }); setDeletedOrders(current => current.filter(item => item.id !== order.id)); setOrders(current => [saved, ...current]); } catch (e) { setError(e.message); } }
  const readOnly = mode === "view";
  return <Layout title="Orders" description="Live purchase orders across buyers and factories." error={initialError || error}>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}><button onClick={beginAdd} style={button}><Plus size={15} /> Add Order</button><button onClick={() => { setShowTrash(current => !current); if (!showTrash) loadTrash(); }} style={{ ...button, color: "#315E8A", background: "#EDF5FB" }}><Trash2 size={15} /> {showTrash ? "Active Orders" : "Deleted Orders"}</button></div>
    {mode && <div style={panel}><h2 style={h2}>{readOnly ? "View order" : mode === "add" ? "Add order" : "Edit order"}</h2><form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: 10, alignItems: "end" }}>{orderFields.map(field => <label key={field} style={{ color: "#697386", fontSize: 11 }}>{field === "id" ? "PO / ID" : field[0].toUpperCase() + field.slice(1)}<input type={field === "qty" ? "number" : "text"} value={form[field] ?? ""} readOnly={readOnly || (field === "id" && mode === "edit")} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} style={inputStyle} /></label>)}<div style={{ display: "flex", gap: 6 }}>{!readOnly && <button type="submit" disabled={saving} style={button}><Save size={15} /> {saving ? "Saving..." : mode === "add" ? "Save Order" : "Save Changes"}</button>}<button type="button" onClick={() => setMode(null)} style={{ ...button, color: "#697386", background: "#F2F4F7" }}><X size={15} /> Close</button></div></form></div>}
    <OrderTable orders={showTrash ? deletedOrders : orders} onOpen={view} onEdit={beginEdit} onDelete={remove} onRestore={restore} deleted={showTrash} />
  </Layout>;
}

export function OrderDetailPage({ order, onBack }) {
  const [techNotes, setTechNotes] = useState(order.notes || order.comments || "Double needle stitch at hem. Contrast bartack on front pocket. Pre-wash fabric before cutting. Deliver fit samples by May 10.");
  const [highlights, setHighlights] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  async function handleExtractHighlights() {
    if (!techNotes.trim()) return;
    setLoadingAi(true);
    setAiError("");
    try {
      const res = await fetch("/api/gemini/extract-highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techPackNotes: techNotes,
          deptOptions: ["Merchandising", "Sample", "Quality", "Cutting", "Production", "Finishing", "All"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract highlights");
      setHighlights(data.items || []);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setLoadingAi(false);
    }
  }

  return (
    <Layout title={order.style || order.id} description={`PO ${order.id} · ${order.buyer} · ${order.country}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onBack} style={button}>Back to orders</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={panel}>
          <h2 style={h2}>Order details</h2>
          {Object.entries(order)
            .filter(([key]) => !["id", "_id"].includes(key))
            .map(([key, value]) => (
              <div key={key} style={detail}>
                <span>{key}</span>
                <strong>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}</strong>
              </div>
            ))}
        </div>

        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ ...h2, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              ✨ Gemini AI Tech Pack Analysis
            </h2>
          </div>
          <p style={{ ...muted, marginTop: 0, marginBottom: 12 }}>
            Extract actionable instructions, trims, and quality checks from tech pack notes using Google Gemini.
          </p>

          <textarea
            value={techNotes}
            onChange={(e) => setTechNotes(e.target.value)}
            rows={4}
            placeholder="Paste buyer tech pack notes, instructions, or specifications here..."
            style={{ ...inputStyle, marginBottom: 10, fontFamily: "inherit" }}
          />

          <button
            onClick={handleExtractHighlights}
            disabled={loadingAi || !techNotes.trim()}
            style={{
              ...button,
              background: loadingAi ? "#93C5FD" : "#168A78",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loadingAi ? "Analyzing with Gemini..." : "⚡ Auto-extract Highlights (Gemini AI)"}
          </button>

          {aiError && (
            <div style={{ marginTop: 10, padding: 8, background: "#FCEBEB", color: "#8B2630", borderRadius: 6, fontSize: 12 }}>
              {aiError}
            </div>
          )}

          {highlights.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 13, color: "#172033" }}>Extracted Critical Highlights ({highlights.length})</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {highlights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 6,
                      fontSize: 13,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{h.text}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "#E0F2FE",
                        color: "#0369A1",
                      }}
                    >
                      {h.dept || "All"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


const taskFields = ["title", "description", "assignee", "dueDate", "status"];
const emptyTask = { title: "", description: "", assignee: "", dueDate: "", status: "open" };

export function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [editingId, setEditingId] = useState(null);
  const [mode, setMode] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() { setLoading(true); try { setTasks(await resourcesApi.list("tasks")); setError(""); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  async function loadTrash() { try { setDeletedTasks(await resourcesApi.list("tasks", "?trash=true")); } catch (e) { setError(e.message); } }
  useEffect(() => { load(); }, []);
  function beginAdd() { setForm(emptyTask); setEditingId(null); setMode("add"); setError(""); }
  function beginEdit(task) { setForm(Object.fromEntries(taskFields.map(field => [field, task[field] ?? ""]))); setEditingId(task.id); setMode("edit"); setError(""); }
  function view(task) { setForm(task); setMode("view"); setError(""); }
  async function save(event) { event.preventDefault(); setSaving(true); try { const value = { ...form, title: form.title.trim() }; const saved = mode === "add" ? await resourcesApi.create("tasks", value) : await resourcesApi.update("tasks", editingId, value); setTasks(current => mode === "add" ? [saved, ...current] : current.map(task => task.id === saved.id ? saved : task)); setMode(null); setEditingId(null); } catch (e) { setError(e.message); } finally { setSaving(false); } }
  async function remove(task) { if (!window.confirm(`Delete task ${task.title}?`)) return; try { await resourcesApi.remove("tasks", task.id); setTasks(current => current.filter(item => item.id !== task.id)); await loadTrash(); } catch (e) { setError(e.message); } }
  async function restore(task) { try { const saved = await resourcesApi.update("tasks", task.id, { ...task, isDeleted: false, deletedAt: null }); setDeletedTasks(current => current.filter(item => item.id !== task.id)); setTasks(current => [saved, ...current]); } catch (e) { setError(e.message); } }
  const readOnly = mode === "view";
  return <Layout title="My tasks" description="Open operational tasks from live task records." error={error}>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}><button onClick={beginAdd} style={button}><Plus size={15} /> Add Task</button><button onClick={() => { setShowTrash(current => !current); if (!showTrash) loadTrash(); }} style={{ ...button, color: "#315E8A", background: "#EDF5FB" }}><Trash2 size={15} /> {showTrash ? "Active Tasks" : "Deleted Tasks"}</button></div>
    {mode && <div style={panel}><h2 style={h2}>{readOnly ? "View task" : mode === "add" ? "Add task" : "Edit task"}</h2><form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: 10, alignItems: "end" }}>{taskFields.map(field => <label key={field} style={{ color: "#697386", fontSize: 11 }}>{field[0].toUpperCase() + field.slice(1)}<input value={form[field] ?? ""} readOnly={readOnly} required={field === "title"} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} style={inputStyle} /></label>)}<div style={{ display: "flex", gap: 6 }}>{!readOnly && <button type="submit" disabled={saving} style={button}><Save size={15} /> {saving ? "Saving..." : mode === "add" ? "Save Task" : "Save Changes"}</button>}<button type="button" onClick={() => setMode(null)} style={{ ...button, color: "#697386", background: "#F2F4F7" }}><X size={15} /> Close</button></div></form></div>}
    {loading ? <div style={panel}><span style={muted}>Loading live tasks...</span></div> : <TaskTable tasks={showTrash ? deletedTasks : tasks} deleted={showTrash} onView={view} onEdit={beginEdit} onDelete={remove} onRestore={restore} />}
  </Layout>;
}

function TaskTable({ tasks, deleted, onView, onEdit, onDelete, onRestore }) { return <div style={{ ...panel, overflowX: "auto" }}>{tasks.length === 0 ? <div style={muted}>{deleted ? "Trash is empty." : "No tasks yet."}</div> : <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}><thead><tr>{["Task", "Description", "Assignee", "Due date", "Status", "Actions"].map(label => <th key={label} style={th}>{label}</th>)}</tr></thead><tbody>{tasks.map(task => <tr key={task.id}><td style={td}><strong>{task.title}</strong></td><td style={td}>{task.description}</td><td style={td}>{task.assignee}</td><td style={td}>{task.dueDate}</td><td style={td}>{task.status}</td><td style={td}><div style={{ display: "flex", gap: 6 }}><button onClick={() => onView(task)} title="View" style={iconButton}><Eye size={14} /></button>{deleted ? <button onClick={() => onRestore(task)} title="Restore" style={{ ...iconButton, color: "#168A78" }}><RotateCcw size={14} /></button> : <><button onClick={() => onEdit(task)} title="Edit" style={iconButton}><Pencil size={14} /></button><button onClick={() => onDelete(task)} title="Delete" style={{ ...iconButton, color: "#B53D45" }}><Trash2 size={14} /></button></>}</div></td></tr>)}</tbody></table>}</div>; }
function DerivedPage({ title, description, filter, emptyText }) { const { orders, error } = useOrders(); const rows = orders.filter(filter); return <Layout title={title} description={description} error={error}><div style={panel}>{rows.length ? rows.map(order => <div key={order.id} style={row}><strong>{order.id} · {order.style}</strong><span style={muted}>{order.buyer} · {order.status}</span></div>) : <span style={muted}>{emptyText}</span>}</div></Layout>; }
export function CalendarPage() { return <DerivedPage title="Timeline / calendar" description="Shipment schedule from live order records." filter={() => true} emptyText="No scheduled orders." />; }

const approvalFields = ["title", "order", "buyer", "department", "dueDate", "status", "comments"];
const emptyApproval = { title: "", order: "", buyer: "", department: "", dueDate: "", status: "Pending", comments: "" };

export function ApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [deletedApprovals, setDeletedApprovals] = useState([]);
  const [form, setForm] = useState(emptyApproval);
  const [editingId, setEditingId] = useState(null);
  const [mode, setMode] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setApprovals(await resourcesApi.list("approvals"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrash() {
    try {
      setDeletedApprovals(await resourcesApi.list("approvals", "?trash=true"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  function beginAdd() {
    setForm(emptyApproval);
    setEditingId(null);
    setMode("add");
    setError("");
  }

  function beginEdit(approval) {
    setForm(Object.fromEntries(approvalFields.map(f => [f, approval[f] ?? ""])));
    setEditingId(approval.id);
    setMode("edit");
    setError("");
  }

  function view(approval) {
    setForm(approval);
    setMode("view");
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const value = { ...form, title: (form.title || "").trim() };
      const saved = mode === "add"
        ? await resourcesApi.create("approvals", value)
        : await resourcesApi.update("approvals", editingId, value);
      setApprovals(current => mode === "add" ? [saved, ...current] : current.map(item => item.id === saved.id ? saved : item));
      setMode(null);
      setEditingId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(approval) {
    if (!window.confirm(`Delete approval "${approval.title || approval.id}"?`)) return;
    try {
      await resourcesApi.remove("approvals", approval.id);
      setApprovals(current => current.filter(item => item.id !== approval.id));
      await loadTrash();
    } catch (e) {
      setError(e.message);
    }
  }

  async function restore(approval) {
    try {
      const saved = await resourcesApi.update("approvals", approval.id, { ...approval, isDeleted: false, deletedAt: null });
      setDeletedApprovals(current => current.filter(item => item.id !== approval.id));
      setApprovals(current => [saved, ...current]);
    } catch (e) {
      setError(e.message);
    }
  }

  const readOnly = mode === "view";

  return (
    <Layout title="Approvals" description="Operational sign-offs, sample checks, and buyer approvals." error={error}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
        <button onClick={beginAdd} style={button}><Plus size={15} /> Add Approval</button>
        <button
          onClick={() => {
            setShowTrash(current => !current);
            if (!showTrash) loadTrash();
          }}
          style={{ ...button, color: "#315E8A", background: "#EDF5FB" }}
        >
          <Trash2 size={15} /> {showTrash ? "Active Approvals" : "Deleted Approvals"}
        </button>
      </div>

      {mode && (
        <div style={panel}>
          <h2 style={h2}>{readOnly ? "View approval" : mode === "add" ? "Add approval" : "Edit approval"}</h2>
          <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: 10, alignItems: "end" }}>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Approval Item / Title
              <input
                value={form.title ?? ""}
                readOnly={readOnly}
                required
                placeholder="e.g. Fit Sample Approval"
                onChange={e => setForm(c => ({ ...c, title: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Order / PO
              <input
                value={form.order ?? ""}
                readOnly={readOnly}
                placeholder="e.g. GKT-1054"
                onChange={e => setForm(c => ({ ...c, order: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Buyer
              <input
                value={form.buyer ?? ""}
                readOnly={readOnly}
                placeholder="e.g. Zara"
                onChange={e => setForm(c => ({ ...c, buyer: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Department
              <input
                value={form.department ?? ""}
                readOnly={readOnly}
                placeholder="e.g. Merchandising"
                onChange={e => setForm(c => ({ ...c, department: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Due Date
              <input
                value={form.dueDate ?? ""}
                readOnly={readOnly}
                placeholder="e.g. 20 May"
                onChange={e => setForm(c => ({ ...c, dueDate: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Status
              {readOnly ? (
                <input value={form.status ?? ""} readOnly style={inputStyle} />
              ) : (
                <select
                  value={form.status ?? "Pending"}
                  onChange={e => setForm(c => ({ ...c, status: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Revision Requested">Revision Requested</option>
                </select>
              )}
            </label>
            <label style={{ color: "#697386", fontSize: 11, gridColumn: "span 3" }}>
              Comments / Notes
              <input
                value={form.comments ?? ""}
                readOnly={readOnly}
                placeholder="e.g. Sample approved with size adjustments"
                onChange={e => setForm(c => ({ ...c, comments: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {!readOnly && (
                <button type="submit" disabled={saving} style={button}>
                  <Save size={15} /> {saving ? "Saving..." : mode === "add" ? "Save Approval" : "Save Changes"}
                </button>
              )}
              <button type="button" onClick={() => setMode(null)} style={{ ...button, color: "#697386", background: "#F2F4F7" }}>
                <X size={15} /> Close
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={panel}><span style={muted}>Loading live approvals...</span></div>
      ) : (
        <ApprovalTable
          approvals={showTrash ? deletedApprovals : approvals}
          deleted={showTrash}
          onView={view}
          onEdit={beginEdit}
          onDelete={remove}
          onRestore={restore}
        />
      )}
    </Layout>
  );
}

function ApprovalTable({ approvals, deleted, onView, onEdit, onDelete, onRestore }) {
  return (
    <div style={{ ...panel, overflowX: "auto" }}>
      {approvals.length === 0 ? (
        <div style={muted}>{deleted ? "Trash is empty." : "No approvals found."}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
          <thead>
            <tr>
              {["Approval Item", "Order / PO", "Buyer", "Department", "Due Date", "Status", "Comments", "Actions"].map(label => (
                <th key={label} style={th}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {approvals.map(app => (
              <tr key={app.id}>
                <td style={td}><strong>{app.title || "—"}</strong></td>
                <td style={td}>{app.order || "—"}</td>
                <td style={td}>{app.buyer || "—"}</td>
                <td style={td}>{app.department || "—"}</td>
                <td style={td}>{app.dueDate || "—"}</td>
                <td style={td}>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    background: app.status === "Approved" ? "#E6F4EA" : app.status === "Rejected" ? "#FCEBEB" : app.status === "Under Review" ? "#FEF3D6" : "#EDF5FB",
                    color: app.status === "Approved" ? "#137333" : app.status === "Rejected" ? "#C5221F" : app.status === "Under Review" ? "#B06000" : "#1A73E8",
                  }}>
                    {app.status || "Pending"}
                  </span>
                </td>
                <td style={{ ...td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={app.comments}>
                  {app.comments || "—"}
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onView(app)} title="View" style={iconButton}>
                      <Eye size={14} />
                    </button>
                    {deleted ? (
                      <button onClick={() => onRestore(app)} title="Restore" style={{ ...iconButton, color: "#168A78" }}>
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => onEdit(app)} title="Edit" style={iconButton}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(app)} title="Delete" style={{ ...iconButton, color: "#B53D45" }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const prodFields = ["order", "style", "stage", "dueDate", "status"];
const emptyProd = { order: "", style: "", stage: "Cutting", dueDate: "", status: "In Progress" };

export function ProductionPage() {
  const [productionList, setProductionList] = useState([]);
  const [deletedProduction, setDeletedProduction] = useState([]);
  const [form, setForm] = useState(emptyProd);
  const [editingId, setEditingId] = useState(null);
  const [mode, setMode] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setProductionList(await resourcesApi.list("production"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrash() {
    try {
      setDeletedProduction(await resourcesApi.list("production", "?trash=true"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  function beginAdd() {
    setForm(emptyProd);
    setEditingId(null);
    setMode("add");
    setError("");
  }

  function beginEdit(record) {
    setForm(Object.fromEntries(prodFields.map(f => [f, record[f] ?? ""])));
    setEditingId(record.id);
    setMode("edit");
    setError("");
  }

  function view(record) {
    setForm(record);
    setMode("view");
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const value = {
        order: (form.order || "").trim(),
        style: (form.style || "").trim(),
        stage: (form.stage || "").trim(),
        dueDate: (form.dueDate || "").trim(),
        status: (form.status || "").trim(),
      };
      const saved = mode === "add"
        ? await resourcesApi.create("production", value)
        : await resourcesApi.update("production", editingId, value);
      setProductionList(current => mode === "add" ? [saved, ...current] : current.map(item => item.id === saved.id ? saved : item));
      setMode(null);
      setEditingId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(record) {
    if (!window.confirm(`Delete production record for order "${record.order || record.id}"?`)) return;
    try {
      await resourcesApi.remove("production", record.id);
      setProductionList(current => current.filter(item => item.id !== record.id));
      await loadTrash();
    } catch (e) {
      setError(e.message);
    }
  }

  async function restore(record) {
    try {
      const saved = await resourcesApi.update("production", record.id, { ...record, isDeleted: false, deletedAt: null });
      setDeletedProduction(current => current.filter(item => item.id !== record.id));
      setProductionList(current => [saved, ...current]);
    } catch (e) {
      setError(e.message);
    }
  }

  const readOnly = mode === "view";

  return (
    <Layout title="Production" description="Live factory line tracking, cutting, sewing, and stage schedules." error={error}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
        <button onClick={beginAdd} style={button}><Plus size={15} /> Add Production</button>
        <button
          onClick={() => {
            setShowTrash(current => !current);
            if (!showTrash) loadTrash();
          }}
          style={{ ...button, color: "#315E8A", background: "#EDF5FB" }}
        >
          <Trash2 size={15} /> {showTrash ? "Active Production" : "Deleted Production"}
        </button>
      </div>

      {mode && (
        <div style={panel}>
          <h2 style={h2}>{readOnly ? "View production record" : mode === "add" ? "Add production" : "Edit production"}</h2>
          <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: 10, alignItems: "end" }}>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Order
              <input
                value={form.order ?? ""}
                readOnly={readOnly}
                required
                placeholder="e.g. GKT-1054"
                onChange={e => setForm(c => ({ ...c, order: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Style
              <input
                value={form.style ?? ""}
                readOnly={readOnly}
                required
                placeholder="e.g. Hoodie, T-Shirt..."
                onChange={e => setForm(c => ({ ...c, style: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Stage
              <input
                list="stage-suggestions"
                value={form.stage ?? ""}
                readOnly={readOnly}
                required
                placeholder="e.g. Cutting, Sewing..."
                onChange={e => setForm(c => ({ ...c, stage: e.target.value }))}
                style={inputStyle}
              />
              <datalist id="stage-suggestions">
                <option value="Cutting" />
                <option value="Printing / Embroidery" />
                <option value="Feeding" />
                <option value="Sewing" />
                <option value="Finishing" />
                <option value="Packing" />
                <option value="Pre-Production" />
                <option value="VAP" />
              </datalist>
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Due Date
              <input
                value={form.dueDate ?? ""}
                readOnly={readOnly}
                required
                placeholder="e.g. 20 May"
                onChange={e => setForm(c => ({ ...c, dueDate: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Status
              {readOnly ? (
                <input value={form.status ?? ""} readOnly style={inputStyle} />
              ) : (
                <select
                  value={form.status ?? "In Progress"}
                  onChange={e => setForm(c => ({ ...c, status: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              )}
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {!readOnly && (
                <button type="submit" disabled={saving} style={button}>
                  <Save size={15} /> {saving ? "Saving..." : mode === "add" ? "Save Production" : "Save Changes"}
                </button>
              )}
              <button type="button" onClick={() => setMode(null)} style={{ ...button, color: "#697386", background: "#F2F4F7" }}>
                <X size={15} /> Close
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={panel}><span style={muted}>Loading live production records...</span></div>
      ) : (
        <ProductionTable
          productionList={showTrash ? deletedProduction : productionList}
          deleted={showTrash}
          onView={view}
          onEdit={beginEdit}
          onDelete={remove}
          onRestore={restore}
        />
      )}
    </Layout>
  );
}

function ProductionTable({ productionList, deleted, onView, onEdit, onDelete, onRestore }) {
  return (
    <div style={{ ...panel, overflowX: "auto" }}>
      {productionList.length === 0 ? (
        <div style={muted}>{deleted ? "Trash is empty." : "No production records found."}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr>
              {["Order", "Style", "Stage", "Due Date", "Status", "Actions"].map(label => (
                <th key={label} style={th}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productionList.map(prod => (
              <tr key={prod.id}>
                <td style={td}><strong>{prod.order || "—"}</strong></td>
                <td style={td}>{prod.style || "—"}</td>
                <td style={td}>{prod.stage || "—"}</td>
                <td style={td}>{prod.dueDate || "—"}</td>
                <td style={td}>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    background: prod.status === "On Track" || prod.status === "Completed" ? "#E6F4EA" : prod.status === "Delayed" ? "#FCEBEB" : prod.status === "At Risk" ? "#FEF3D6" : "#EDF5FB",
                    color: prod.status === "On Track" || prod.status === "Completed" ? "#137333" : prod.status === "Delayed" ? "#C5221F" : prod.status === "At Risk" ? "#B06000" : "#1A73E8",
                  }}>
                    {prod.status || "—"}
                  </span>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onView(prod)} title="View" style={iconButton}>
                      <Eye size={14} />
                    </button>
                    {deleted ? (
                      <button onClick={() => onRestore(prod)} title="Restore" style={{ ...iconButton, color: "#168A78" }}>
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => onEdit(prod)} title="Edit" style={iconButton}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(prod)} title="Delete" style={{ ...iconButton, color: "#B53D45" }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const deptFields = ["name", "department", "level"];
const emptyDept = { name: "", department: "", level: "Senior" };

export function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [deletedDepartments, setDeletedDepartments] = useState([]);
  const [form, setForm] = useState(emptyDept);
  const [editingId, setEditingId] = useState(null);
  const [mode, setMode] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setDepartments(await resourcesApi.list("departments"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrash() {
    try {
      setDeletedDepartments(await resourcesApi.list("departments", "?trash=true"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  function beginAdd() {
    setForm(emptyDept);
    setEditingId(null);
    setMode("add");
    setError("");
  }

  function beginEdit(record) {
    setForm(Object.fromEntries(deptFields.map(f => [f, record[f] ?? ""])));
    setEditingId(record.id);
    setMode("edit");
    setError("");
  }

  function view(record) {
    setForm(record);
    setMode("view");
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const value = {
        name: (form.name || "").trim(),
        department: (form.department || "").trim(),
        level: (form.level || "").trim(),
      };
      const saved = mode === "add"
        ? await resourcesApi.create("departments", value)
        : await resourcesApi.update("departments", editingId, value);
      setDepartments(current => mode === "add" ? [saved, ...current] : current.map(item => item.id === saved.id ? saved : item));
      setMode(null);
      setEditingId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(record) {
    if (!window.confirm(`Delete person/department record for "${record.name}"?`)) return;
    try {
      await resourcesApi.remove("departments", record.id);
      setDepartments(current => current.filter(item => item.id !== record.id));
      await loadTrash();
    } catch (e) {
      setError(e.message);
    }
  }

  async function restore(record) {
    try {
      const saved = await resourcesApi.update("departments", record.id, { ...record, isDeleted: false, deletedAt: null });
      setDeletedDepartments(current => current.filter(item => item.id !== record.id));
      setDepartments(current => [saved, ...current]);
    } catch (e) {
      setError(e.message);
    }
  }

  const readOnly = mode === "view";

  return (
    <Layout title="Departments" description="Manage department personnel, designations, and organizational structure." error={error}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
        <button onClick={beginAdd} style={button}><Plus size={15} /> Add Department / Person</button>
        <button
          onClick={() => {
            setShowTrash(current => !current);
            if (!showTrash) loadTrash();
          }}
          style={{ ...button, color: "#315E8A", background: "#EDF5FB" }}
        >
          <Trash2 size={15} /> {showTrash ? "Active Records" : "Deleted Records"}
        </button>
      </div>

      {mode && (
        <div style={panel}>
          <h2 style={h2}>{readOnly ? "View department/person record" : mode === "add" ? "Add department / person" : "Edit department / person"}</h2>
          <form onSubmit={save} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: 10, alignItems: "end" }}>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Person Name
              <input
                value={form.name ?? ""}
                readOnly={readOnly}
                required
                placeholder="e.g. Suresh"
                onChange={e => setForm(c => ({ ...c, name: e.target.value }))}
                style={inputStyle}
              />
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Department
              <input
                list="department-suggestions"
                value={form.department ?? ""}
                readOnly={readOnly}
                required
                placeholder="e.g. Cutting, Planning, Merchandiser..."
                onChange={e => setForm(c => ({ ...c, department: e.target.value }))}
                style={inputStyle}
              />
              <datalist id="department-suggestions">
                <option value="Cutting" />
                <option value="Merchandiser" />
                <option value="Planning" />
                <option value="QC" />
                <option value="Production" />
                <option value="Quality" />
                <option value="Sample" />
                <option value="Finishing" />
                <option value="Purchase – Fabric" />
                <option value="Purchase – Trims" />
                <option value="Logistics & Documentation" />
              </datalist>
            </label>
            <label style={{ color: "#697386", fontSize: 11 }}>
              Level
              <input
                list="level-suggestions"
                value={form.level ?? ""}
                readOnly={readOnly}
                required
                placeholder="e.g. Junior, Senior, Manager..."
                onChange={e => setForm(c => ({ ...c, level: e.target.value }))}
                style={inputStyle}
              />
              <datalist id="level-suggestions">
                <option value="Junior" />
                <option value="Senior" />
                <option value="Manager" />
                <option value="Lead" />
                <option value="DGM" />
                <option value="Executive" />
                <option value="Incharge" />
              </datalist>
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {!readOnly && (
                <button type="submit" disabled={saving} style={button}>
                  <Save size={15} /> {saving ? "Saving..." : mode === "add" ? "Save Record" : "Save Changes"}
                </button>
              )}
              <button type="button" onClick={() => setMode(null)} style={{ ...button, color: "#697386", background: "#F2F4F7" }}>
                <X size={15} /> Close
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={panel}><span style={muted}>Loading live department records...</span></div>
      ) : (
        <DepartmentTable
          records={showTrash ? deletedDepartments : departments}
          deleted={showTrash}
          onView={view}
          onEdit={beginEdit}
          onDelete={remove}
          onRestore={restore}
        />
      )}
    </Layout>
  );
}

function DepartmentTable({ records, deleted, onView, onEdit, onDelete, onRestore }) {
  return (
    <div style={{ ...panel, overflowX: "auto" }}>
      {records.length === 0 ? (
        <div style={muted}>{deleted ? "Trash is empty." : "No department records found."}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
          <thead>
            <tr>
              {["Person Name", "Department", "Level", "Actions"].map(label => (
                <th key={label} style={th}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map(rec => (
              <tr key={rec.id}>
                <td style={td}><strong>{rec.name || "—"}</strong></td>
                <td style={td}>{rec.department || "—"}</td>
                <td style={td}>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    background: rec.level === "Manager" ? "#F3E8FD" : rec.level === "Senior" ? "#EDF5FB" : "#F2F4F7",
                    color: rec.level === "Manager" ? "#6B21A8" : rec.level === "Senior" ? "#1A73E8" : "#4A5568",
                  }}>
                    {rec.level || "—"}
                  </span>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onView(rec)} title="View" style={iconButton}>
                      <Eye size={14} />
                    </button>
                    {deleted ? (
                      <button onClick={() => onRestore(rec)} title="Restore" style={{ ...iconButton, color: "#168A78" }}>
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => onEdit(rec)} title="Edit" style={iconButton}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onDelete(rec)} title="Delete" style={{ ...iconButton, color: "#B53D45" }}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
export function InsightsPage() { return <DerivedPage title="All insights" description="Live risk signals derived from order status." filter={order => order.risk !== "low"} emptyText="No risk insights." />; }
export function SupplierPerformancePage() { return <DerivedPage title="Supplier performance" description="Supplier-related order view from live records." filter={() => true} emptyText="No supplier records." />; }
export function NotificationsPage() { return <DerivedPage title="Notifications" description="Live orders needing attention." filter={order => order.status !== "On Track"} emptyText="No active notifications." />; }
export function ReportsPage() { const { orders, error } = useOrders(); const total = orders.reduce((sum, order) => sum + Number(order.qty || 0), 0); return <Layout title="Reports" description="Live summary metrics calculated from orders." error={error}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}><div style={panel}><span style={muted}>Orders</span><h2 style={metric}>{orders.length}</h2></div><div style={panel}><span style={muted}>Ordered quantity</span><h2 style={metric}>{total.toLocaleString()}</h2></div><div style={panel}><span style={muted}>At risk or delayed</span><h2 style={metric}>{orders.filter(order => order.status !== "On Track").length}</h2></div></div><OrderTable orders={orders} /></Layout>; }
export function DepartmentDetailPage({ name, onBack }) { return <Layout title={name} description="Department detail workspace."><button onClick={onBack} style={button}>Back to departments</button></Layout>; }
export function QualityPage() { return <DerivedPage title="Quality" description="Orders with active risk signals for quality review." filter={order => order.risk === "high" || order.status === "Delayed"} emptyText="No quality exceptions." />; }
export function ExecutiveOverviewPage() { return <ReportsPage />; }
export function MyDepartmentPage() { return <DerivedPage title="My department" description="Your department's live operational view." filter={() => true} emptyText="No department records." />; }
export function SettingsPage() { return <Layout title="Settings" description="Application settings and account preferences."><div style={panel}><p style={muted}>Role and access settings are managed by your administrator.</p></div></Layout>; }

const h2 = { margin: "0 0 14px", color: "#172033", fontSize: 16 };
const metric = { margin: "8px 0 0", color: "#168A78", fontSize: 28 };
const row = { display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 4px", borderBottom: "1px solid #F0F2F5", fontSize: 13 };
const detail = { display: "flex", justifyContent: "space-between", gap: 20, padding: "10px 0", borderBottom: "1px solid #F0F2F5", fontSize: 13 };
const th = { textAlign: "left", color: "#697386", fontSize: 11, padding: "0 10px 10px", borderBottom: "1px solid #E9ECF1" };
const td = { padding: "11px 10px", color: "#273142", fontSize: 13, borderBottom: "1px solid #F0F2F5" };
