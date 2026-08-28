import React, { useEffect, useState } from "react";
import { Eye, Pencil, Plus, RefreshCw, RotateCcw, Save, Trash2, X } from "lucide-react";
import { resourcesApi } from "../api.js";

const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #DDE1E8", borderRadius: 7, fontSize: 13, boxSizing: "border-box" };

export default function CrudModule({ title, description, resource, fields, idField = "id", singleton = false }) {
  const empty = Object.fromEntries(fields.map(field => [field.key, field.defaultValue ?? ""]));
  const [rows, setRows] = useState([]);
  const [deletedRows, setDeletedRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [mode, setMode] = useState(singleton ? "edit" : null); // "add" | "edit" | "view" | null
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true); setError(""); setSuccess("");
    try {
      const data = await resourcesApi.list(resource);
      setRows(data);
      if (singleton && data.length > 0) {
        setEditingId(data[0][idField]);
        setForm(Object.fromEntries(fields.map(field => [field.key, data[0][field.key] ?? ""])));
        setMode("edit");
      }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function loadTrash() {
    try {
      setDeletedRows(await resourcesApi.list(resource, "?trash=true"));
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, [resource]);

  function change(key, value) { setForm(current => ({ ...current, [key]: value })); }
  function beginAdd() { setEditingId(null); setForm(empty); setMode("add"); setError(""); setSuccess(""); }
  function beginEdit(row) { setEditingId(row[idField]); setForm(Object.fromEntries(fields.map(field => [field.key, row[field.key] ?? ""]))); setMode("edit"); setError(""); setSuccess(""); }
  function view(row) { setForm(row); setEditingId(row[idField]); setMode("view"); setError(""); setSuccess(""); }
  function cancel() {
    if (singleton) {
      if (rows.length > 0) {
        setEditingId(rows[0][idField]);
        setForm(Object.fromEntries(fields.map(field => [field.key, rows[0][field.key] ?? ""])));
      }
      return;
    }
    setEditingId(null); setForm(empty); setMode(null);
  }

  async function submit(event) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try {
      const payload = { ...form };
      fields.forEach(field => {
        if (field.type === "number" && payload[field.key] !== undefined && payload[field.key] !== "") {
          payload[field.key] = Number(payload[field.key]);
        }
      });
      const targetId = editingId || (singleton && rows.length > 0 ? rows[0][idField] : null);
      const saved = targetId
        ? await resourcesApi.update(resource, targetId, payload)
        : await resourcesApi.create(resource, payload);

      setRows(current => {
        if (targetId) return current.map(row => row[idField] === targetId ? saved : row);
        return [saved, ...current];
      });
      setSuccess("Record saved successfully!");
      if (!singleton) cancel();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function remove(row) {
    if (!window.confirm(`Delete ${row[fields[0]?.key] || row[idField]}?`)) return;
    try {
      await resourcesApi.remove(resource, row[idField]);
      setRows(current => current.filter(item => item[idField] !== row[idField]));
      setSuccess("Record deleted!");
      await loadTrash();
    } catch (e) { setError(e.message); }
  }

  async function restore(row) {
    try {
      const saved = await resourcesApi.update(resource, row[idField], { ...row, isDeleted: false, deletedAt: null });
      setDeletedRows(current => current.filter(item => item[idField] !== row[idField]));
      setRows(current => [saved, ...current]);
      setSuccess("Record restored!");
    } catch (e) { setError(e.message); }
  }

  const readOnly = mode === "view";
  const activeRows = showTrash ? deletedRows : rows;

  return (
    <section>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div><h1 style={{ margin: 0, color: "#172033", fontSize: 24 }}>{title}</h1><p style={{ color: "#697386", margin: "6px 0 0", fontSize: 13 }}>{description}</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          {!singleton && <button onClick={beginAdd} style={buttonStyle}><Plus size={15} /> Add Record</button>}
          {!singleton && (
            <button
              onClick={() => {
                setShowTrash(current => !current);
                if (!showTrash) loadTrash();
              }}
              style={{ ...buttonStyle, color: "#315E8A", background: "#EDF5FB" }}
            >
              <Trash2 size={15} /> {showTrash ? "Active Records" : "Deleted Records"}
            </button>
          )}
          <button onClick={load} title="Refresh" style={{ ...buttonStyle, color: "#315E8A", background: "#EDF5FB" }}><RefreshCw size={15} /> Refresh</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {(mode || singleton) && (
        <div style={panelStyle}>
          <h2 style={headingStyle}>{readOnly ? "View details" : mode === "add" ? "Add record" : singleton ? "Update financial figures" : "Edit record"}</h2>
          <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, minmax(0, 1fr)) auto`, gap: 10, alignItems: "end" }}>
            {fields.map(field => (
              <label key={field.key} style={{ color: "#697386", fontSize: 11 }}>
                {field.label}
                <input
                  required={field.required !== false}
                  type={field.type || "text"}
                  value={form[field.key] ?? ""}
                  readOnly={readOnly}
                  onChange={e => change(field.key, e.target.value)}
                  style={inputStyle}
                />
              </label>
            ))}
            <div style={{ display: "flex", gap: 6 }}>
              {!readOnly && (
                <button type="submit" disabled={saving} style={{ ...buttonStyle, color: "#fff", background: "#168A78" }}>
                  <Save size={15} /> {saving ? "Saving..." : "Save"}
                </button>
              )}
              {!singleton && (
                <button type="button" onClick={cancel} style={{ ...buttonStyle, color: "#697386", background: "#F2F4F7" }}>
                  <X size={15} /> Close
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {!singleton && (
        <div style={{ ...panelStyle, overflowX: "auto" }}>
          {loading ? (
            <div style={{ color: "#697386" }}>Loading live data...</div>
          ) : activeRows.length === 0 ? (
            <div style={{ color: "#697386" }}>{showTrash ? "Trash is empty." : "No records yet."}</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr>
                  {fields.map(field => <th key={field.key} style={thStyle}>{field.label}</th>)}
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map(row => (
                  <tr key={row[idField]}>
                    {fields.map(field => (
                      <td key={field.key} style={tdStyle}>{String(row[field.key] ?? "—")}</td>
                    ))}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => view(row)} title="View" style={iconButton}>
                          <Eye size={14} />
                        </button>
                        {showTrash ? (
                          <button onClick={() => restore(row)} title="Restore" style={{ ...iconButton, color: "#168A78" }}>
                            <RotateCcw size={14} />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => beginEdit(row)} title="Edit" style={iconButton}>
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => remove(row)} title="Delete" style={{ ...iconButton, color: "#B53D45" }}>
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
      )}
    </section>
  );
}

const panelStyle = { background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, padding: 18, marginBottom: 16 };
const headingStyle = { margin: "0 0 12px", fontSize: 14, color: "#172033" };
const buttonStyle = { border: "none", borderRadius: 7, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", color: "#fff", background: "#168A78" };
const iconButton = { border: "1px solid #DDE1E8", background: "#fff", color: "#315E8A", borderRadius: 6, padding: 6, cursor: "pointer" };
const errorStyle = { background: "#FCEBEB", color: "#8B2630", border: "1px solid #F0C6CA", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13 };
const successStyle = { background: "#E6F4EA", color: "#137333", border: "1px solid #CEEAD6", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13 };
const thStyle = { textAlign: "left", color: "#697386", fontSize: 11, fontWeight: 600, padding: "0 10px 10px", borderBottom: "1px solid #E9ECF1" };
const tdStyle = { padding: "11px 10px", color: "#273142", fontSize: 13, borderBottom: "1px solid #F0F2F5" };