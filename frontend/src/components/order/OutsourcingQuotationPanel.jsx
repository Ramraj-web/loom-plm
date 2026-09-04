import React, { useState, useEffect, useMemo } from "react";
import { Plus, X, Check, Clock, CheckCircle2 } from "lucide-react";
import { VAP_SUPPLIERS } from "../../constants/loomData.js";

const PROCESS_TYPES = [
  "Printing",
  "Embroidery",
  "Dyeing",
  "Washing",
  "Sewing Job Order",
  "Pleating",
  "Heat Transfer",
  "Fabric Lamination",
  "Other Outsourcing"
];

const UNITS = ["pcs", "meters", "kg", "sets", "dozens"];

export function OutsourcingQuotationPanel({
  order,
  role = {},
  suppliers = [],
  onUpdateQuotation,
  onSubmitQuotation,
  onApproveQuotation,
  onRejectQuotation
}) {
  const isMD = role?.dept === "Executive" || role?.fullAccess;
  const uploaderName = role?.label ? role.label.split(" (")[0] : "Merchandiser";

  const initialRows = useMemo(() => {
    if (order?.quotation?.rows && order.quotation.rows.length > 0) {
      return order.quotation.rows;
    }
    return [
      {
        id: "qrow-1",
        processType: "Printing",
        supplier: order?.stages?.find(s => s.dept === "VAP")?.supplier || "",
        qty: order?.qty || 5000,
        unit: "pcs",
        unitRate: 0,
      }
    ];
  }, [order]);

  const [rows, setRows] = useState(initialRows);
  const [status, setStatus] = useState(order?.quotation?.status || "draft");

  useEffect(() => {
    if (order?.quotation?.rows && order.quotation.rows.length > 0) {
      setRows(order.quotation.rows);
    }
    if (order?.quotation?.status) {
      setStatus(order.quotation.status);
    }
  }, [order?.quotation]);

  const supplierSuggestions = useMemo(() => {
    const set = new Set(VAP_SUPPLIERS);
    suppliers.forEach(s => {
      if (s.name) set.add(s.name);
    });
    return Array.from(set);
  }, [suppliers]);

  const totalValue = useMemo(() => {
    return rows.reduce((sum, r) => sum + ((Number(r.qty) || 0) * (Number(r.unitRate) || 0)), 0);
  }, [rows]);

  const handleRowChange = (id, field, value) => {
    setRows(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, [field]: value } : r);
      if (onUpdateQuotation) {
        onUpdateQuotation(order.id, { rows: updated, totalValue });
      }
      return updated;
    });
  };

  const handleAddRow = () => {
    const newRow = {
      id: `qrow-${Date.now()}`,
      processType: "Embroidery",
      supplier: "",
      qty: order?.qty || 5000,
      unit: "pcs",
      unitRate: 0,
    };
    setRows(prev => {
      const updated = [...prev, newRow];
      if (onUpdateQuotation) {
        onUpdateQuotation(order.id, { rows: updated, totalValue });
      }
      return updated;
    });
  };

  const handleDeleteRow = (id) => {
    if (rows.length <= 1) return;
    setRows(prev => {
      const updated = prev.filter(r => r.id !== id);
      if (onUpdateQuotation) {
        onUpdateQuotation(order.id, { rows: updated, totalValue });
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    setStatus("pending");
    if (onSubmitQuotation) {
      onSubmitQuotation(order.id, {
        rows,
        totalValue,
        status: "pending",
        submittedBy: uploaderName,
        submittedAt: new Date().toISOString()
      });
    }
  };

  const handleApprove = () => {
    setStatus("approved");
    if (onApproveQuotation) {
      onApproveQuotation(order.id, uploaderName);
    }
  };

  const handleReject = () => {
    setStatus("draft");
    if (onRejectQuotation) {
      onRejectQuotation(order.id);
    }
  };

  return (
    <div style={{ maxWidth: 950, margin: "0 auto", paddingBottom: 24 }}>
      {/* Header with Title & Status Pill */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.01em" }}>
            Outsourcing Quotation & Approval
          </h2>
          <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 4, lineHeight: 1.5, maxWidth: 740 }}>
            VAP Merch enters the quotation details received from each outsource supplier (printing, embroidery, dye, sewing job order, etc.) before bulk production can proceed. The manager or MD gives approval here — no paper needed.
          </div>
        </div>

        <div>
          {status === "draft" && (
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 12px", borderRadius: 999, background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
              Draft
            </span>
          )}
          {status === "pending" && (
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 12px", borderRadius: 999, background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Clock size={12} /> Pending Approval
            </span>
          )}
          {status === "approved" && (
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 12px", borderRadius: 999, background: "#DCFCE7", color: "#15803D", border: "1px solid #BBF7D0", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Check size={12} strokeWidth={3} /> Approved
            </span>
          )}
        </div>
      </div>

      {/* Quotation Table Container */}
      <div style={{ marginTop: 22, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
        {/* Table Column Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 0.9fr 0.8fr 1fr 0.9fr 32px", gap: 10, fontSize: 11.5, color: "#6B7280", fontWeight: 500, paddingBottom: 8, borderBottom: "1px solid #F3F4F6" }}>
          <div>Process type</div>
          <div>Supplier</div>
          <div>Qty</div>
          <div>Unit</div>
          <div>Unit rate (₹)</div>
          <div style={{ textAlign: "right" }}>Total</div>
          <div></div>
        </div>

        {/* Table Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {rows.map((row) => {
            const rowTotal = (Number(row.qty) || 0) * (Number(row.unitRate) || 0);
            return (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1.6fr 0.9fr 0.8fr 1fr 0.9fr 32px",
                  gap: 10,
                  alignItems: "center"
                }}
              >
                {/* Process Type Dropdown */}
                <select
                  value={row.processType}
                  disabled={status === "approved"}
                  onChange={(e) => handleRowChange(row.id, "processType", e.target.value)}
                  style={{
                    padding: "7px 10px",
                    fontSize: 12.5,
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    background: status === "approved" ? "#F9FAFB" : "#FFFFFF",
                    color: "#1F2937",
                    outline: "none"
                  }}
                >
                  {PROCESS_TYPES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                {/* Supplier Input */}
                <div>
                  <input
                    type="text"
                    list={`suppliers-list-${row.id}`}
                    value={row.supplier}
                    disabled={status === "approved"}
                    placeholder="Supplier name"
                    onChange={(e) => handleRowChange(row.id, "supplier", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      fontSize: 12.5,
                      borderRadius: 6,
                      border: "1px solid #D1D5DB",
                      background: status === "approved" ? "#F9FAFB" : "#FFFFFF",
                      color: "#1F2937",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                  <datalist id={`suppliers-list-${row.id}`}>
                    {supplierSuggestions.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                {/* Qty Input */}
                <input
                  type="number"
                  value={row.qty}
                  disabled={status === "approved"}
                  onChange={(e) => handleRowChange(row.id, "qty", Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "7px 8px",
                    fontSize: 12.5,
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    background: status === "approved" ? "#F9FAFB" : "#FFFFFF",
                    color: "#1F2937",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />

                {/* Unit Dropdown */}
                <select
                  value={row.unit}
                  disabled={status === "approved"}
                  onChange={(e) => handleRowChange(row.id, "unit", e.target.value)}
                  style={{
                    padding: "7px 8px",
                    fontSize: 12.5,
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    background: status === "approved" ? "#F9FAFB" : "#FFFFFF",
                    color: "#1F2937",
                    outline: "none"
                  }}
                >
                  {UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>

                {/* Unit rate (₹) */}
                <input
                  type="number"
                  step="0.01"
                  value={row.unitRate}
                  disabled={status === "approved"}
                  placeholder="0.00"
                  onChange={(e) => handleRowChange(row.id, "unitRate", Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    fontSize: 12.5,
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    background: status === "approved" ? "#F9FAFB" : "#FFFFFF",
                    color: "#1F2937",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />

                {/* Total */}
                <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "#1F2937" }}>
                  ₹{Math.round(rowTotal).toLocaleString()}
                </div>

                {/* Delete button */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {status !== "approved" && rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      title="Remove row"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#9CA3AF",
                        cursor: "pointer",
                        padding: 2,
                        lineHeight: 1,
                        fontSize: 16
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "#9CA3AF"}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add process / supplier button */}
        {status !== "approved" && (
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={handleAddRow}
              style={{
                background: "#F5F3FF",
                border: "1px dashed #C4B5FD",
                borderRadius: 8,
                color: "#6D28D9",
                fontSize: 12.5,
                fontWeight: 600,
                padding: "8px 16px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#EDE9FE"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#F5F3FF"}
            >
              + Add process / supplier
            </button>
          </div>
        )}

        {/* Total quotation value */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid #F3F4F6" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>
            Total quotation value
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>
            ₹{Math.round(totalValue).toLocaleString()}
          </div>
        </div>

        {/* Action Button Strip */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
          {status === "draft" && (
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              Submit for approval
            </button>
          )}

          {status === "pending" && (
            <>
              {isMD ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={handleApprove}
                    style={{
                      background: "#16A34A",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 22px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                  >
                    <Check size={14} strokeWidth={3} /> Approve Quotation
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    style={{
                      background: "#FFFFFF",
                      color: "#DC2626",
                      border: "1px solid #FCA5A5",
                      borderRadius: 8,
                      padding: "9px 18px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Request Revision
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#B45309", background: "#FEF3C7", padding: "8px 14px", borderRadius: 8, border: "1px solid #FDE68A" }}>
                  <Clock size={15} /> Submitted for MD Approval · Awaiting sign-off
                </div>
              )}
            </>
          )}

          {status === "approved" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#15803D", background: "#DCFCE7", padding: "8px 16px", borderRadius: 8, border: "1px solid #BBF7D0", fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Approved by {order?.quotation?.approvedBy || "MD"} {order?.quotation?.approvedAt ? `on ${new Date(order.quotation.approvedAt).toLocaleDateString()}` : ""}
              </div>
              <button
                type="button"
                onClick={handleReject}
                style={{
                  background: "transparent",
                  border: "1px solid #CBD5E1",
                  borderRadius: 6,
                  color: "#64748B",
                  fontSize: 11.5,
                  padding: "5px 12px",
                  cursor: "pointer"
                }}
              >
                Re-quote / Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
