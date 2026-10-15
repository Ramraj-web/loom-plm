import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Edit, Plus, Trash2, X } from "lucide-react";

export const MERCHANDISING_DEPT = "Merchandising";
export const FABRIC_DEPT = "Purchase – Fabric";
export const TRIMS_DEPT = "Purchase – Trims";
export const ARTWORK_DEPT = "Artwork";

// Active users belonging to the team (department) with the given name
export function usersInDept(users = [], teams = [], deptName) {
  const teamIds = new Set(teams.filter(t => t?.name === deptName).map(t => t.id));
  return users
    .filter(u => {
      if (!u || u.active === false) return false;
      const ids = Array.isArray(u.teamIds) && u.teamIds.length > 0 ? u.teamIds : [u.teamId];
      return ids.some(id => teamIds.has(id));
    })
    .map(u => ({ id: u.id, name: u.name || u.username }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function userNames(ids = [], users = []) {
  return ids.map(id => {
    const u = users.find(x => x.id === id);
    return u ? (u.name || u.username) : "Removed user";
  });
}

const EMPTY_FORM = { id: null, name: "", merchandiserIds: [], fabricManagerIds: [], trimsManagerIds: [], artworkManagerIds: [] };

const labelStyle = { display: "block", fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 6 };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: 7, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", background: "#FFFFFF" };
const thStyle = { padding: "10px 14px", fontWeight: 600, color: "#475569" };
const chipStyle = { background: "#F1F5F9", color: "#334155", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, border: "1px solid #E2E8F0" };

function MultiSelect({ label, options, selectedIds, onChange, emptyText }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = id => onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  const selected = options.filter(o => selectedIds.includes(o.id));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label style={labelStyle}>{label}</label>
      <div
        onClick={() => setOpen(prev => !prev)}
        style={{ ...inputStyle, minHeight: 36, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
          {selected.length === 0 ? (
            <span style={{ color: "#94A3B8", fontSize: 12.5 }}>Select...</span>
          ) : selected.map(o => (
            <span
              key={o.id}
              onClick={e => { e.stopPropagation(); toggle(o.id); }}
              style={{ background: "#E0F2FE", color: "#0369A1", fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {o.name} <span style={{ cursor: "pointer" }}>×</span>
            </span>
          ))}
        </div>
        <ChevronDown size={14} color="#64748B" />
      </div>

      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, marginTop: 4, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", maxHeight: 210, overflowY: "auto", padding: 6 }}>
          {options.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94A3B8", padding: "6px 8px" }}>{emptyText}</div>
          ) : options.map(o => {
            const isSelected = selectedIds.includes(o.id);
            return (
              <div
                key={o.id}
                onClick={() => toggle(o.id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: 6, fontSize: 12, cursor: "pointer", background: isSelected ? "#F0FDF4" : "transparent" }}
              >
                <span style={{ fontWeight: isSelected ? 600 : 500, color: isSelected ? "#15803D" : "#1E293B" }}>{o.name}</span>
                <input type="checkbox" checked={isSelected} readOnly style={{ cursor: "pointer", accentColor: "#1F9E8D" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BuyerManagerModal({ buyers = [], users = [], teams = [], onAdd, onUpdate, onDelete, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const isEditing = Boolean(form.id);

  const merchandisers = useMemo(() => usersInDept(users, teams, MERCHANDISING_DEPT), [users, teams]);
  const fabricManagers = useMemo(() => usersInDept(users, teams, FABRIC_DEPT), [users, teams]);
  const trimsManagers = useMemo(() => usersInDept(users, teams, TRIMS_DEPT), [users, teams]);
  const artworkManagers = useMemo(() => usersInDept(users, teams, ARTWORK_DEPT), [users, teams]);

  const resetForm = () => { setForm(EMPTY_FORM); setError(""); };

  const handleSubmit = e => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const duplicate = buyers.some(b => b.id !== form.id && String(b.name || "").trim().toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setError(`Buyer "${name}" already exists.`);
      return;
    }
    const payload = {
      name,
      merchandiserIds: form.merchandiserIds,
      fabricManagerIds: form.fabricManagerIds,
      trimsManagerIds: form.trimsManagerIds,
      artworkManagerIds: form.artworkManagerIds
    };
    if (isEditing) onUpdate?.(form.id, payload);
    else onAdd?.(payload);
    resetForm();
  };

  const handleDelete = buyer => {
    if (!window.confirm(`Delete buyer "${buyer.name}"?`)) return;
    onDelete?.(buyer.id);
    if (form.id === buyer.id) resetForm();
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#FFFFFF", borderRadius: 14, width: "100%", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", padding: 24, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#151B2E", margin: 0 }}>Buyers</h3>
            <p style={{ fontSize: 12.5, color: "#8A8D98", margin: "4px 0 0" }}>
              Orders and tasks of a buyer are shown only to its assigned users from Merchandising, Purchase – Fabric, Purchase – Trims, and Artwork.
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#8A8D98", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "16px 18px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            {isEditing ? <Edit size={15} color="#2563EB" /> : <Plus size={15} color="#1F9E8D" />}
            {isEditing ? "Edit Buyer" : "Add Buyer"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Buyer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Zara"
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); setError(""); }}
                style={inputStyle}
              />
            </div>
            <MultiSelect
              label="Merchandisers"
              options={merchandisers}
              selectedIds={form.merchandiserIds}
              onChange={ids => setForm(prev => ({ ...prev, merchandiserIds: ids }))}
              emptyText={`No users in the ${MERCHANDISING_DEPT} department.`}
            />
            <MultiSelect
              label="Fabric Managers"
              options={fabricManagers}
              selectedIds={form.fabricManagerIds}
              onChange={ids => setForm(prev => ({ ...prev, fabricManagerIds: ids }))}
              emptyText={`No users in the ${FABRIC_DEPT} department.`}
            />
            <MultiSelect
              label="Purchase – Trims"
              options={trimsManagers}
              selectedIds={form.trimsManagerIds}
              onChange={ids => setForm(prev => ({ ...prev, trimsManagerIds: ids }))}
              emptyText={`No users in the ${TRIMS_DEPT} department.`}
            />
            <MultiSelect
              label="Artwork"
              options={artworkManagers}
              selectedIds={form.artworkManagerIds}
              onChange={ids => setForm(prev => ({ ...prev, artworkManagerIds: ids }))}
              emptyText={`No users in the ${ARTWORK_DEPT} department.`}
            />
          </div>

          {error && <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {isEditing && (
              <button type="button" onClick={resetForm} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#FFFFFF", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                Cancel
              </button>
            )}
            <button type="submit" style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: isEditing ? "#2563EB" : "#1F9E8D", fontSize: 12, fontWeight: 600, color: "#FFFFFF", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {isEditing ? <Check size={14} /> : <Plus size={14} />}
              {isEditing ? "Update Buyer" : "Add Buyer"}
            </button>
          </div>
        </form>

        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12 }}>Added Buyers ({buyers.length})</div>
        <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={thStyle}>Buyer</th>
                <th style={thStyle}>Merchandisers</th>
                <th style={thStyle}>Fabric Managers</th>
                <th style={thStyle}>Purchase – Trims</th>
                <th style={thStyle}>Artwork</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buyers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "18px 14px", textAlign: "center", color: "#94A3B8" }}>No buyers added yet.</td>
                </tr>
              )}
              {buyers.map(buyer => (
                <tr key={buyer.id} style={{ borderBottom: "1px solid #F1F5F9", background: form.id === buyer.id ? "#F0F9FF" : "#FFFFFF" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0F172A" }}>{buyer.name}</td>
                  {[buyer.merchandiserIds, buyer.fabricManagerIds, buyer.trimsManagerIds, buyer.artworkManagerIds].map((ids, i) => (
                    <td key={i} style={{ padding: "10px 14px" }}>
                      {Array.isArray(ids) && ids.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {userNames(ids, users).map((n, idx) => <span key={idx} style={chipStyle}>{n}</span>)}
                        </div>
                      ) : (
                        <span style={{ color: "#94A3B8", fontStyle: "italic", fontSize: 11.5 }}>Not assigned</span>
                      )}
                    </td>
                  ))}
                  <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      title="Edit buyer"
                      onClick={() => {
                        setForm({
                          id: buyer.id,
                          name: buyer.name,
                          merchandiserIds: [...(buyer.merchandiserIds || [])],
                          fabricManagerIds: [...(buyer.fabricManagerIds || [])],
                          trimsManagerIds: [...(buyer.trimsManagerIds || [])],
                          artworkManagerIds: [...(buyer.artworkManagerIds || [])]
                        });
                        setError("");
                      }}
                      style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 5, color: "#2563EB", cursor: "pointer", padding: "4px 8px", marginRight: 6, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600 }}
                    >
                      <Edit size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      title="Delete buyer"
                      onClick={() => handleDelete(buyer)}
                      style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 5, color: "#DC2626", cursor: "pointer", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600 }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
