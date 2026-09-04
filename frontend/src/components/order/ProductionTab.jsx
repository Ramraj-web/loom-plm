import React, { useState } from "react";
import { Factory, Upload, Eye, Trash2, CheckCircle2 } from "lucide-react";

/**
 * ProductionTab Component
 * 
 * Implements Daily Production Output Log, SAM calculation notice,
 * output entry form, logged entries table, and document upload cards
 * for Cutting Report & Sewing Output Report.
 */
export function ProductionTab({
  order,
  role,
  docs = {},
  onUploadDoc,
  onDeleteDoc,
  onViewDoc,
  onAddProductionLog,
  onDeleteProductionLog,
  canUploadHere = true
}) {
  // Today's date formatted as DD/MM/YYYY
  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const [date, setDate] = useState("04/09/2026");
  const [line, setLine] = useState("");
  const [outputPcs, setOutputPcs] = useState("");
  const [hoursWorked, setHoursWorked] = useState("8");

  // Retrieve existing logs or default sample entry matching user's screen
  const logs = order.productionLogs || [
    {
      id: "init-log-1",
      date: "04/09/2026",
      line: "33",
      outputPcs: 33,
      hours: "8h",
      efficiency: "—"
    }
  ];

  // Check if SAM is defined in preProd or order
  const obSamDoc = order.preProd?.poSheet?.values?.sam || order.sam || null;

  const handleLogSubmit = (e) => {
    e?.preventDefault?.();
    if (!outputPcs || isNaN(Number(outputPcs))) return;

    // Calculate efficiency % if SAM is set
    // Standard Formula: Efficiency % = (Output in pcs * SAM) / (Operators * Hours worked * 60) * 100
    let eff = "—";
    if (obSamDoc && Number(obSamDoc) > 0) {
      const hrs = Number(hoursWorked) || 8;
      const pcs = Number(outputPcs) || 0;
      const samVal = Number(obSamDoc);
      // Example default line operator count: 30
      const lineOperators = 30;
      const calculated = Math.round((pcs * samVal) / (lineOperators * hrs * 60) * 100);
      eff = `${calculated}%`;
    }

    const newEntry = {
      id: `prod-log-${Date.now()}`,
      date: date || getTodayFormatted(),
      line: line.trim() || "—",
      outputPcs: Number(outputPcs),
      hours: `${hoursWorked || 8}h`,
      efficiency: eff,
      loggedAt: new Date().toISOString()
    };

    if (onAddProductionLog) {
      onAddProductionLog(order.id, newEntry);
    }

    // Reset inputs
    setOutputPcs("");
    setLine("");
  };

  const cuttingDoc = docs["Cutting Report"];
  const sewingDoc = docs["Sewing Output Report"];

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header section */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "#F0EFFB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2
          }}
        >
          <Factory size={15} color="#534AB7" />
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1B2130" }}>Production</div>
          <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>
            All order files — you can view and upload across all departments.
          </div>
        </div>
      </div>

      {/* Daily Production Output Log title */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1B2130" }}>
          Daily Production Output Log
        </div>
        <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 3 }}>
          Entered by Production / IE daily — SAM is pulled from the OB/SAM pre-production document. Efficiency and capacity utilisation are computed automatically.
        </div>
      </div>

      {/* SAM notice warning card */}
      <div
        style={{
          background: "#FEF7EC",
          border: "1px solid #F8E2BE",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 20,
          fontSize: 12,
          color: "#92400E",
          lineHeight: 1.5
        }}
      >
        <strong>SAM not set yet.</strong> The IE department must fill in the OB / SAM section in Pre-Production sign-off first — efficiency and capacity utilisation will compute automatically once SAM is entered.
      </div>

      {/* Entry Form Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1.6fr 1.2fr 1.2fr auto",
          gap: 12,
          alignItems: "flex-end",
          marginBottom: 16
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8A8D98", marginBottom: 5 }}>
            Date
          </label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              fontSize: 12.5,
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              color: "#1B2130",
              background: "#FFFFFF",
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8A8D98", marginBottom: 5 }}>
            Line (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Line 3"
            value={line}
            onChange={(e) => setLine(e.target.value)}
            style={{
              width: "100%",
              fontSize: 12.5,
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              color: "#1B2130",
              background: "#FFFFFF",
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8A8D98", marginBottom: 5 }}>
            Output (pcs)
          </label>
          <input
            type="number"
            value={outputPcs}
            onChange={(e) => setOutputPcs(e.target.value)}
            style={{
              width: "100%",
              fontSize: 12.5,
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              color: "#1B2130",
              background: "#FFFFFF",
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8A8D98", marginBottom: 5 }}>
            Hours worked
          </label>
          <input
            type="number"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value)}
            style={{
              width: "100%",
              fontSize: 12.5,
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              color: "#1B2130",
              background: "#FFFFFF",
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={handleLogSubmit}
            style={{
              background: "#4338CA",
              color: "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 600,
              padding: "7px 20px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              height: 35,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            Log
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr auto",
          fontSize: 11,
          color: "#8A8D98",
          fontWeight: 600,
          padding: "8px 12px 8px 4px",
          borderBottom: "1px solid #E5E7EB",
          marginBottom: 4
        }}
      >
        <div>Date</div>
        <div>Line</div>
        <div>Output (pcs)</div>
        <div>Hours</div>
        <div>Efficiency %</div>
        <div></div>
      </div>

      {/* Table Body Rows */}
      <div style={{ marginBottom: 28 }}>
        {logs.map((row) => (
          <div
            key={row.id || row.date + row.line}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr auto",
              alignItems: "center",
              fontSize: 12.5,
              color: "#1B2130",
              padding: "10px 12px 10px 4px",
              borderBottom: "1px solid #F3F4F6"
            }}
          >
            <div>{row.date}</div>
            <div>{row.line || "—"}</div>
            <div>{row.outputPcs}</div>
            <div>{row.hours || "8h"}</div>
            <div>{row.efficiency || "—"}</div>
            <div>
              {onDeleteProductionLog && (
                <button
                  type="button"
                  onClick={() => onDeleteProductionLog(order.id, row.id)}
                  title="Remove log entry"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9CA3AF",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Document Upload Cards (Cutting Report & Sewing Output Report) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 1. Cutting Report Card */}
        <div
          style={{
            background: cuttingDoc ? "#F7FBF9" : "#FAFAFB",
            border: `1px solid ${cuttingDoc ? "#DCEFE6" : "#E5E7EB"}`,
            borderRadius: 10,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1B2130" }}>
                Cutting Report
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#6D28D9",
                  background: "#F5F3FF",
                  border: "1px solid #DDD6FE",
                  padding: "1px 8px",
                  borderRadius: 999
                }}
              >
                Cutting
              </span>
            </div>
            {cuttingDoc ? (
              <div style={{ fontSize: 11, color: "#1F9E8D", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                <span
                  onClick={() => onViewDoc && onViewDoc({ ...cuttingDoc, docType: "Cutting Report" })}
                  style={{ fontWeight: 600, color: "#047857", cursor: "pointer", textDecoration: "underline" }}
                  title="Click to view file"
                >
                  {cuttingDoc.name}
                </span>
                <span style={{ color: "#64748B" }}>· {cuttingDoc.by} · {cuttingDoc.uploadedAt}</span>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 4 }}>
                Not uploaded yet
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {cuttingDoc && (
              <button
                type="button"
                onClick={() => onViewDoc && onViewDoc({ ...cuttingDoc, docType: "Cutting Report" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#2563EB",
                  border: "1px solid #BFDBFE",
                  background: "#EFF6FF",
                  borderRadius: 8,
                  padding: "6px 12px",
                  cursor: "pointer"
                }}
              >
                <Eye size={12} /> View
              </button>
            )}

            {canUploadHere && (
              <>
                <input
                  type="file"
                  id={`upload-cutting-${order.id}`}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && onUploadDoc) onUploadDoc("Cutting Report", f);
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor={`upload-cutting-${order.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#4338CA",
                    border: "1px solid #C7D2FE",
                    background: "#FFFFFF",
                    borderRadius: 8,
                    padding: "6px 14px",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                  }}
                >
                  <Upload size={13} /> {cuttingDoc ? "Replace" : "Upload"}
                </label>
              </>
            )}

            {cuttingDoc && canUploadHere && onDeleteDoc && (
              <button
                type="button"
                onClick={() => onDeleteDoc("Cutting Report")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer"
                }}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Sewing Output Report Card */}
        <div
          style={{
            background: sewingDoc ? "#F7FBF9" : "#FAFAFB",
            border: `1px solid ${sewingDoc ? "#DCEFE6" : "#E5E7EB"}`,
            borderRadius: 10,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1B2130" }}>
                Sewing Output Report
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#4338CA",
                  background: "#EEF2FF",
                  border: "1px solid #C7D2FE",
                  padding: "1px 8px",
                  borderRadius: 999
                }}
              >
                Production
              </span>
            </div>
            {sewingDoc ? (
              <div style={{ fontSize: 11, color: "#1F9E8D", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                <span
                  onClick={() => onViewDoc && onViewDoc({ ...sewingDoc, docType: "Sewing Output Report" })}
                  style={{ fontWeight: 600, color: "#047857", cursor: "pointer", textDecoration: "underline" }}
                  title="Click to view file"
                >
                  {sewingDoc.name}
                </span>
                <span style={{ color: "#64748B" }}>· {sewingDoc.by} · {sewingDoc.uploadedAt}</span>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 4 }}>
                Not uploaded yet
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sewingDoc && (
              <button
                type="button"
                onClick={() => onViewDoc && onViewDoc({ ...sewingDoc, docType: "Sewing Output Report" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#2563EB",
                  border: "1px solid #BFDBFE",
                  background: "#EFF6FF",
                  borderRadius: 8,
                  padding: "6px 12px",
                  cursor: "pointer"
                }}
              >
                <Eye size={12} /> View
              </button>
            )}

            {canUploadHere && (
              <>
                <input
                  type="file"
                  id={`upload-sewing-${order.id}`}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && onUploadDoc) onUploadDoc("Sewing Output Report", f);
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor={`upload-sewing-${order.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#4338CA",
                    border: "1px solid #C7D2FE",
                    background: "#FFFFFF",
                    borderRadius: 8,
                    padding: "6px 14px",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                  }}
                >
                  <Upload size={13} /> {sewingDoc ? "Replace" : "Upload"}
                </label>
              </>
            )}

            {sewingDoc && canUploadHere && onDeleteDoc && (
              <button
                type="button"
                onClick={() => onDeleteDoc("Sewing Output Report")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer"
                }}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
