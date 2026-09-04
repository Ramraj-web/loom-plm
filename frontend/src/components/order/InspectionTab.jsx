import React, { useState } from "react";
import { ShieldCheck, Upload, Eye, Trash2, CheckCircle2 } from "lucide-react";

/**
 * Defect categories displayed in a 3-column grid for each inspection stage
 */
const DEFECT_KEYS = [
  { key: "stitchingDefect", label: "Stitching defect" },
  { key: "measurementIssue", label: "Measurement issue" },
  { key: "printMisalignment", label: "Print misalignment" },
  { key: "embroideryIssue", label: "Embroidery issue" },
  { key: "trimLabelMissing", label: "Trim/label missing" },
  { key: "pressingIssue", label: "Pressing issue" },
  { key: "fabricDefect", label: "Fabric defect" },
  { key: "packingError", label: "Packing error" },
  { key: "others", label: "Others" },
];

/**
 * InspectionSectionCard Component
 * Reusable card for Inline, Endline, and Final Inspection sections
 */
function InspectionSectionCard({
  title,
  subtext,
  data = {},
  onChange,
  canEdit = true
}) {
  const unitsInspected = data.unitsInspected ?? "";
  const unitsPassed = data.unitsPassed ?? "";

  // Auto-calculated Units failed / rework = Inspected - Passed (or "—" if not both numbers)
  let unitsFailed = "—";
  if (unitsInspected !== "" && unitsPassed !== "" && !isNaN(Number(unitsInspected)) && !isNaN(Number(unitsPassed))) {
    const diff = Number(unitsInspected) - Number(unitsPassed);
    unitsFailed = diff >= 0 ? diff : 0;
  }

  const defects = data.defects || {};

  const handleDefectChange = (k, val) => {
    const num = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
    onChange({
      ...data,
      defects: {
        ...defects,
        [k]: num
      }
    });
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: "16px 18px",
        marginBottom: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
      }}
    >
      {/* Title */}
      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1B2130", marginBottom: 14 }}>
        {title}
      </div>

      {/* Top 3 Metric Inputs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
          marginBottom: 16
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#8A8D98", marginBottom: 5 }}>
            Units inspected
          </label>
          <input
            type="number"
            min="0"
            disabled={!canEdit}
            value={unitsInspected}
            onChange={(e) => onChange({ ...data, unitsInspected: e.target.value })}
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
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#8A8D98", marginBottom: 5 }}>
            Units passed first time
          </label>
          <input
            type="number"
            min="0"
            disabled={!canEdit}
            value={unitsPassed}
            onChange={(e) => onChange({ ...data, unitsPassed: e.target.value })}
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
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#8A8D98", marginBottom: 5 }}>
            Units failed / rework
          </label>
          <div
            style={{
              width: "100%",
              fontSize: 12.5,
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid #E5E7EB",
              color: unitsFailed === "—" ? "#9CA3AF" : unitsFailed > 0 ? "#DC2626" : "#16A34A",
              background: "#F9FAFB",
              boxSizing: "border-box",
              minHeight: 34,
              display: "flex",
              alignItems: "center"
            }}
          >
            {unitsFailed}
          </div>
        </div>
      </div>

      {/* Defect Breakdown Header */}
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8A8D98", letterSpacing: 0.3, marginBottom: 10 }}>
        DEFECT BREAKDOWN
      </div>

      {/* Defect Breakdown 3-column Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          columnGap: 24,
          rowGap: 10
        }}
      >
        {DEFECT_KEYS.map((item) => {
          const val = defects[item.key] ?? 0;
          return (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8
              }}
            >
              <span style={{ fontSize: 12, color: "#4B5563" }}>{item.label}</span>
              <input
                type="number"
                min="0"
                disabled={!canEdit}
                value={val}
                onChange={(e) => handleDefectChange(item.key, e.target.value)}
                style={{
                  width: 54,
                  fontSize: 12,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  color: "#1B2130",
                  background: "#FFFFFF",
                  textAlign: "center",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * InspectionTab Component
 * 
 * Implements:
 * 1. Inline Inspection (during sewing)
 * 2. Endline Inspection (end of sewing line)
 * 3. Final Inspection (before packing)
 * 4. Document upload cards for Inline Inspection Report & Final Inspection Report
 */
export function InspectionTab({
  order,
  role,
  docs = {},
  onUploadDoc,
  onDeleteDoc,
  onViewDoc,
  onUpdateInspectionData,
  canUploadHere = true
}) {
  const inspectionData = order.inspectionData || {};

  const handleStageChange = (stageKey, stageValues) => {
    if (onUpdateInspectionData) {
      onUpdateInspectionData(order.id, {
        ...inspectionData,
        [stageKey]: stageValues
      });
    }
  };

  const inlineDoc = docs["Inline Inspection Report"];
  const finalDoc = docs["Final Inspection Report"];

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header section */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
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
          <ShieldCheck size={15} color="#534AB7" />
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1B2130" }}>Inspection</div>
          <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>
            All order files — you can view and upload across all departments.
          </div>
        </div>
      </div>

      {/* 1. Inline Inspection Card */}
      <InspectionSectionCard
        title="Inline Inspection (during sewing)"
        data={inspectionData.inline || {}}
        onChange={(val) => handleStageChange("inline", val)}
        canEdit={canUploadHere}
      />

      {/* 2. Endline Inspection Card */}
      <InspectionSectionCard
        title="Endline Inspection (end of sewing line)"
        data={inspectionData.endline || {}}
        onChange={(val) => handleStageChange("endline", val)}
        canEdit={canUploadHere}
      />

      {/* 3. Final Inspection Card */}
      <InspectionSectionCard
        title="Final Inspection (before packing)"
        data={inspectionData.final || {}}
        onChange={(val) => handleStageChange("final", val)}
        canEdit={canUploadHere}
      />

      {/* Document Upload Cards (Inline Inspection Report & Final Inspection Report) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {/* 1. Inline Inspection Report */}
        <div
          style={{
            background: inlineDoc ? "#F7FBF9" : "#FAFAFB",
            border: `1px solid ${inlineDoc ? "#DCEFE6" : "#E5E7EB"}`,
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
                Inline Inspection Report
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
                Quality
              </span>
            </div>
            {inlineDoc ? (
              <div style={{ fontSize: 11, color: "#1F9E8D", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                <span
                  onClick={() => onViewDoc && onViewDoc({ ...inlineDoc, docType: "Inline Inspection Report" })}
                  style={{ fontWeight: 600, color: "#047857", cursor: "pointer", textDecoration: "underline" }}
                  title="Click to view file"
                >
                  {inlineDoc.name}
                </span>
                <span style={{ color: "#64748B" }}>· {inlineDoc.by} · {inlineDoc.uploadedAt}</span>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 4 }}>
                Not uploaded yet
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {inlineDoc && (
              <button
                type="button"
                onClick={() => onViewDoc && onViewDoc({ ...inlineDoc, docType: "Inline Inspection Report" })}
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
                  id={`upload-inline-insp-${order.id}`}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && onUploadDoc) onUploadDoc("Inline Inspection Report", f);
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor={`upload-inline-insp-${order.id}`}
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
                  <Upload size={13} /> {inlineDoc ? "Replace" : "Upload"}
                </label>
              </>
            )}

            {inlineDoc && canUploadHere && onDeleteDoc && (
              <button
                type="button"
                onClick={() => onDeleteDoc("Inline Inspection Report")}
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

        {/* 2. Final Inspection Report */}
        <div
          style={{
            background: finalDoc ? "#F7FBF9" : "#FAFAFB",
            border: `1px solid ${finalDoc ? "#DCEFE6" : "#E5E7EB"}`,
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
                Final Inspection Report
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
                Quality
              </span>
            </div>
            {finalDoc ? (
              <div style={{ fontSize: 11, color: "#1F9E8D", marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                <span
                  onClick={() => onViewDoc && onViewDoc({ ...finalDoc, docType: "Final Inspection Report" })}
                  style={{ fontWeight: 600, color: "#047857", cursor: "pointer", textDecoration: "underline" }}
                  title="Click to view file"
                >
                  {finalDoc.name}
                </span>
                <span style={{ color: "#64748B" }}>· {finalDoc.by} · {finalDoc.uploadedAt}</span>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 4 }}>
                Not uploaded yet
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {finalDoc && (
              <button
                type="button"
                onClick={() => onViewDoc && onViewDoc({ ...finalDoc, docType: "Final Inspection Report" })}
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
                  id={`upload-final-insp-${order.id}`}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && onUploadDoc) onUploadDoc("Final Inspection Report", f);
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor={`upload-final-insp-${order.id}`}
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
                  <Upload size={13} /> {finalDoc ? "Replace" : "Upload"}
                </label>
              </>
            )}

            {finalDoc && canUploadHere && onDeleteDoc && (
              <button
                type="button"
                onClick={() => onDeleteDoc("Final Inspection Report")}
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
