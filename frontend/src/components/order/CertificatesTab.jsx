import React, { useState } from "react";
import { ChevronDown, ChevronUp, Upload, Eye, Trash2, CheckCircle2 } from "lucide-react";

/**
 * Standard certificate types requested by user:
 * - GOTS: Global Organic Textile Standard
 * - OCS: Organic Content Standard
 * - GRS: Global Recycled Standard
 * Note: TC (bottom) excluded as explicitly instructed: "athula enaku last ah erukura TC mattum namma site la add pannatha ok va"
 */
const DEFAULT_CERTIFICATE_CARDS = [
  {
    key: "gots",
    code: "GOTS",
    name: "Global Organic Textile Standard",
    agency: "Control Union / OneCert",
  },
  {
    key: "ocs",
    code: "OCS",
    name: "Organic Content Standard",
    agency: "Control Union / Peterson Projects",
  },
  {
    key: "grs",
    code: "GRS",
    name: "Global Recycled Standard",
    agency: "IDFL / Control Union",
  },
];

export function CertificatesTab({
  order,
  role,
  docs = {},
  onUploadDoc,
  onDeleteDoc,
  onViewDoc,
  onUpdateCertificates,
  canUploadHere = true,
}) {
  // Retrieve saved certificates status or initialize default
  // Each certificate can have status: 'Applicable' | 'N/A' | 'TBD' (default 'TBD' for GOTS as in user screenshot)
  const certState = order.certificatesData || {
    tcTop: {
      expanded: false,
    },
    gots: {
      status: "TBD",
      expanded: true,
    },
    ocs: {
      status: "TBD",
      expanded: false,
    },
    grs: {
      status: "TBD",
      expanded: false,
    },
  };

  // tcOpen controls whether the 3 certificate options (GOTS, OCS, GRS) are revealed
  const [tcOpen, setTcOpen] = useState(
    order.certificatesData?.tcOpen !== undefined ? order.certificatesData.tcOpen : true
  );

  const [expandedCards, setExpandedCards] = useState({
    gots: true,
    ocs: false,
    grs: false,
  });

  const toggleTc = () => {
    const next = !tcOpen;
    setTcOpen(next);
    if (onUpdateCertificates) {
      onUpdateCertificates(order.id, {
        ...certState,
        tcOpen: next,
      });
    }
  };

  const toggleExpand = (key) => {
    setExpandedCards((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setStatus = (certKey, statusVal) => {
    const updated = {
      ...certState,
      tcOpen,
      [certKey]: {
        ...(certState[certKey] || {}),
        status: statusVal,
      },
    };
    if (onUpdateCertificates) {
      onUpdateCertificates(order.id, updated);
    }
  };

  // Check how many are marked applicable
  const applicableCount = DEFAULT_CERTIFICATE_CARDS.filter(
    (c) => (certState[c.key]?.status || "TBD") === "Applicable"
  ).length;

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#1B2130" }}>Certificates</div>
        <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 3 }}>
          Select which certificates apply, then upload the PDF from the agency.
        </div>
      </div>

      {/* Top Banner Card: Transaction Certificates (TC) */}
      <div
        onClick={toggleTc}
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          padding: "16px 18px",
          marginBottom: tcOpen ? 16 : 0,
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "all 0.15s ease",
        }}
      >
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1B2130" }}>
            Transaction Certificates (TC)
          </div>
          <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>
            {applicableCount === 0
              ? "No certificates marked applicable yet"
              : `${applicableCount} certificate${applicableCount > 1 ? "s" : ""} marked applicable`}
          </div>
        </div>
        <div style={{ color: "#9CA3AF" }}>
          {tcOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Certificate Cards: GOTS, OCS, GRS — only rendered when TC card is clicked / open */}
      {tcOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {DEFAULT_CERTIFICATE_CARDS.map((cert) => {
          const isExpanded = expandedCards[cert.key];
          const currentStatus = certState[cert.key]?.status || "TBD";
          const docType = `${cert.code} Certificate`;
          const entry = docs[docType];
          const inputId = `upload-cert-${order.id}-${cert.key}`;

          return (
            <div
              key={cert.key}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: "16px 18px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              {/* Header row with Title & Chevron */}
              <div
                onClick={() => toggleExpand(cert.key)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1B2130" }}>
                    {cert.code}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>
                    {cert.name}
                  </div>
                </div>
                <div style={{ color: "#9CA3AF" }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expandable Content Area */}
              {isExpanded && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
                  {/* Status Pills: Applicable | N/A | TBD */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    {/* Applicable Button */}
                    <button
                      type="button"
                      onClick={() => setStatus(cert.key, "Applicable")}
                      disabled={!canUploadHere}
                      style={{
                        padding: "6px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        cursor: "pointer",
                        border:
                          currentStatus === "Applicable"
                            ? "1px solid #10B981"
                            : "1px solid #E5E7EB",
                        background:
                          currentStatus === "Applicable" ? "#ECFDF5" : "#FFFFFF",
                        color:
                          currentStatus === "Applicable" ? "#065F46" : "#4B5563",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Applicable
                    </button>

                    {/* N/A Button */}
                    <button
                      type="button"
                      onClick={() => setStatus(cert.key, "N/A")}
                      disabled={!canUploadHere}
                      style={{
                        padding: "6px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        cursor: "pointer",
                        border:
                          currentStatus === "N/A"
                            ? "1px solid #94A3B8"
                            : "1px solid #E5E7EB",
                        background:
                          currentStatus === "N/A" ? "#F1F5F9" : "#FFFFFF",
                        color:
                          currentStatus === "N/A" ? "#334155" : "#4B5563",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      N/A
                    </button>

                    {/* TBD Button */}
                    <button
                      type="button"
                      onClick={() => setStatus(cert.key, "TBD")}
                      disabled={!canUploadHere}
                      style={{
                        padding: "6px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        cursor: "pointer",
                        border:
                          currentStatus === "TBD"
                            ? "1px solid #FCD34D"
                            : "1px solid #E5E7EB",
                        background:
                          currentStatus === "TBD" ? "#FEF3C7" : "#FFFFFF",
                        color:
                          currentStatus === "TBD" ? "#92400E" : "#4B5563",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      TBD
                    </button>
                  </div>

                  {/* Upload / Document section when marked Applicable or TBD */}
                  {currentStatus === "Applicable" && (
                    <div
                      style={{
                        background: entry ? "#F7FBF9" : "#F9FAFB",
                        border: `1px solid ${entry ? "#DCEFE6" : "#E5E7EB"}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1E293B" }}>
                          {cert.code} PDF Certificate
                        </div>
                        {entry ? (
                          <div style={{ fontSize: 11, color: "#1F9E8D", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={12} />
                            <span
                              onClick={() => onViewDoc && onViewDoc({ ...entry, docType })}
                              style={{ fontWeight: 600, color: "#047857", cursor: "pointer", textDecoration: "underline" }}
                            >
                              {entry.name}
                            </span>
                            <span style={{ color: "#64748B" }}>· {entry.uploadedAt}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                            Upload the official scope / transaction certificate PDF
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {entry && (
                          <button
                            type="button"
                            onClick={() => onViewDoc && onViewDoc({ ...entry, docType })}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: "#2563EB",
                              border: "1px solid #BFDBFE",
                              background: "#EFF6FF",
                              borderRadius: 6,
                              padding: "5px 10px",
                              cursor: "pointer",
                            }}
                          >
                            <Eye size={12} /> View
                          </button>
                        )}

                        {canUploadHere && (
                          <>
                            <input
                              type="file"
                              id={inputId}
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f && onUploadDoc) onUploadDoc(docType, f);
                                e.target.value = "";
                              }}
                            />
                            <label
                              htmlFor={inputId}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11.5,
                                fontWeight: 600,
                                color: "#4338CA",
                                border: "1px solid #C7D2FE",
                                background: "#FFFFFF",
                                borderRadius: 6,
                                padding: "5px 12px",
                                cursor: "pointer",
                              }}
                            >
                              <Upload size={12} /> {entry ? "Replace" : "Upload"}
                            </label>
                          </>
                        )}

                        {entry && canUploadHere && onDeleteDoc && (
                          <button
                            type="button"
                            onClick={() => onDeleteDoc(docType)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              color: "#DC2626",
                              border: "1px solid #FECACA",
                              background: "#FEF2F2",
                              borderRadius: 6,
                              padding: "5px 8px",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
