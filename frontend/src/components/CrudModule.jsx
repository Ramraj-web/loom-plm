import React, { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { resourcesApi } from "../api.js";

const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #DDE1E8", borderRadius: 7, fontSize: 13, boxSizing: "border-box" };

export default function CrudModule({ title, description, resource, fields, idField = "id", singleton = false }) {
  const empty = Object.fromEntries(fields.map(field => [field.key, field.defaultValue ?? ""]));
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setRows(await resourcesApi.list(resource)); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [resource]);

  function change(key, value) { setForm(current => ({ ...current, [key]: value })); }
  function beginEdit(row) { setEditingId(row[idField]); setForm(Object.fromEntries(fields.map(field => [field.key, row[field.key] ?? ""]))); }
  function cancel() { setEditingId(null); setForm(empty); }
  async function submit(event) {
    event.preventDefault(); setError("");
    try {
      const saved = editingId ? await resourcesApi.update(resource, editingId, form) : await resourcesApi.create(resource, form);
      setRows(current => editingId ? current.map(row => row[idField] === editingId ? saved : row) : [saved, ...current]);
      cancel();
    } catch (e) { setError(e.message); }
  }
  async function remove(row) {
    if (!window.confirm(`Delete ${row[fields[0]?.key] || row[idField]}?`)) return;
    try { await resourcesApi.remove(resource, row[idField]); setRows(current => current.filter(item => item[idField] !== row[idField])); } catch (e) { setError(e.message); }
  }

  return (
    <section>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div><h1 style={{ margin: 0, color: "#172033", fontSize: 24 }}>{title}</h1><p style={{ color: "#697386", margin: "6px 0 0", fontSize: 13 }}>{description}</p></div>
        <button onClick={load} title="Refresh" style={{ ...buttonStyle, color: "#315E8A", background: "#EDF5FB" }}><RefreshCw size={15} /> Refresh</button>
      </header>
      {error && <div style={errorStyle}>{error}</div>}
      <div style={panelStyle}>
        {!singleton && <h2 style={headingStyle}>{editingId ? "Edit record" : "Add record"}</h2>}
        <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(fields.length, 4)}, minmax(0, 1fr)) auto`, gap: 10, alignItems: "end" }}>
          {fields.map(field => <label key={field.key} style={{ color: "#697386", fontSize: 11 }}>{field.label}<input required={field.required !== false} type={field.type || "text"} value={form[field.key]} onChange={e => change(field.key, e.target.value)} style={inputStyle} /></label>)}
          <div style={{ display: "flex", gap: 6 }}><button type="submit" style={{ ...buttonStyle, color: "#fff", background: "#168A78" }}>{editingId ? <Save size={15} /> : <Plus size={15} />}{editingId ? "Save" : "Add"}</button>{editingId && <button type="button" onClick={cancel} style={{ ...buttonStyle, color: "#697386", background: "#F2F4F7" }}><X size={15} />Cancel</button>}</div>
        </form>
      </div>
      <div style={{ ...panelStyle, overflowX: "auto" }}>
        {loading ? <div style={{ color: "#697386" }}>Loading live data...</div> : rows.length === 0 ? <div style={{ color: "#697386" }}>No records yet.</div> : <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}><thead><tr>{fields.map(field => <th key={field.key} style={thStyle}>{field.label}</th>)}<th style={thStyle}>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row[idField]}>{fields.map(field => <td key={field.key} style={tdStyle}>{String(row[field.key] ?? "")}</td>)}<td style={tdStyle}><div style={{ display: "flex", gap: 6 }}><button onClick={() => beginEdit(row)} title="Edit" style={iconButton}><Pencil size={14} /></button><button onClick={() => remove(row)} title="Delete" style={{ ...iconButton, color: "#B53D45" }}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table>}
      </div>
    </section>
  );
}

const panelStyle = { background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, padding: 18, marginBottom: 16 };
const headingStyle = { margin: "0 0 12px", fontSize: 14, color: "#172033" };
const buttonStyle = { border: "none", borderRadius: 7, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" };
const iconButton = { border: "1px solid #DDE1E8", background: "#fff", color: "#315E8A", borderRadius: 6, padding: 6, cursor: "pointer" };
const errorStyle = { background: "#FCEBEB", color: "#8B2630", border: "1px solid #F0C6CA", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13 };
const thStyle = { textAlign: "left", color: "#697386", fontSize: 11, fontWeight: 600, padding: "0 10px 10px", borderBottom: "1px solid #E9ECF1" };
const tdStyle = { padding: "11px 10px", color: "#273142", fontSize: 13, borderBottom: "1px solid #F0F2F5" };