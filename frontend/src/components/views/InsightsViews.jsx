import React, { useState, useMemo, useEffect } from "react";
import {
  TriangleAlert, Globe, Gauge, CheckCircle2, ClipboardList, Landmark, Clock, Truck, TrendingUp,
  Bell, Package, Calendar, CheckSquare, ClipboardCheck, Award, ShieldCheck, CheckCircle, Search, Trash2, Check,
  Plus, Edit, X, ChevronLeft, ChevronRight, Building2, Phone, Mail, MapPin, ExternalLink, AlertCircle, Layers, RefreshCw
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import {
  SHIPMENT_PERFORMANCE, computeMonthlyShipmentPerformance, ROLE_OPTIONS, SEASON_OPTIONS, CAPA_STATUS_STYLE,
  NOTIFICATION_PRIORITY_STYLE, formatTimeAgo, SUPPLIER_TYPES, WORK_PURPOSES,
  calculateSupplierMetrics, INITIAL_SUPPLIER_WORK, INITIAL_SUPPLIERS
} from "../../constants/loomData.js";
import {
  Card, CardHeader, PageHeader, DarkCard, DarkCardHeader, MiniDonut, BackLink, statusPill
} from "../common/CommonUI.jsx";

/**
 * Helper function to compute category-level planned vs actual variance breakdown
 * using stored costing rows, template sections, CMT values, and actual order costs.
 */
function computeOrderVarianceBreakdown(order) {
  const qty = Number(order.qty) || 1;
  const plannedCost = Number(order.plannedCost) || 0;
  const actualCost = Number(order.actualCost) || 0;
  const totalVariance = actualCost - plannedCost;
  const totalVariancePct = plannedCost > 0 ? (totalVariance / plannedCost) * 100 : 0;

  // Standard category definitions
  const CATEGORY_MAP = [
    {
      key: "fabric",
      label: "Fabric / Raw Material",
      sections: ["Fabric", "Yarn & Fabrication", "Yarn"],
      defaultRatio: 0.48, // typical garment fabric share if row pricing is unset
    },
    {
      key: "trims",
      label: "Trims & Accessories",
      sections: ["Trims & Accessories", "Trims", "Accessories"],
      defaultRatio: 0.18,
    },
    {
      key: "cmt",
      label: "Production / CMT",
      sections: ["CMT", "Production", "Manufacturing"],
      defaultRatio: 0.20,
    },
    {
      key: "vap",
      label: "VAP / Value Addition",
      sections: ["VAP", "Printing", "Embroidery"],
      defaultRatio: 0.08,
    },
    {
      key: "logistics",
      label: "Logistics & Commercial",
      sections: ["Commercial Costs", "Logistics", "Shipping", "Freight"],
      defaultRatio: 0.03,
    },
    {
      key: "other",
      label: "Other / Overheads & Margin",
      sections: ["Overheads", "Rejection", "Profit", "Other"],
      defaultRatio: 0.03,
    }
  ];

  // Map costingRows if present
  const rows = Array.isArray(order.costingRows) ? order.costingRows : [];

  // Calculate planned amounts per category from costing rows
  const plannedByCategory = {};
  let totalCostingRowsValue = 0;

  rows.forEach(r => {
    if (r && !r.isHeader) {
      const p = Number(r.price) || 0;
      const q = Number(r.qty) || 0;
      const rowVal = p * q;
      totalCostingRowsValue += rowVal;

      const sec = (r.section || r.label || "").trim();
      let matchedCatKey = "other";
      for (const cat of CATEGORY_MAP) {
        if (cat.sections.some(s => sec.toLowerCase().includes(s.toLowerCase()))) {
          matchedCatKey = cat.key;
          break;
        }
      }
      plannedByCategory[matchedCatKey] = (plannedByCategory[matchedCatKey] || 0) + rowVal;
    }
  });

  // If order has CMT rate/total explicitly recorded, reflect or adjust CMT category
  const explicitCmtTotal = order.cmtTotal !== undefined && order.cmtTotal !== ""
    ? Number(order.cmtTotal)
    : (order.cmtRate !== undefined && order.cmtRate !== "" ? qty * Number(order.cmtRate) : null);

  // If order has a custom actualCostBreakdown stored, use it; otherwise compute from real data
  const storedActualBreakdown = order.actualCostBreakdown || null;

  // Build each category's planned and actual values
  let categories = CATEGORY_MAP.map(cat => {
    let planned = 0;
    if (totalCostingRowsValue > 0) {
      // Costing sheet per piece multiplied by qty, or scaled to order.plannedCost
      const perPieceFromRows = plannedByCategory[cat.key] || 0;
      if (plannedCost > 0) {
        // Proportional to entered plannedCost
        planned = Math.round((perPieceFromRows / totalCostingRowsValue) * plannedCost);
      } else {
        planned = Math.round(perPieceFromRows * qty);
      }
    } else {
      // Fall back to standard garment industry cost ratio on plannedCost
      planned = Math.round(plannedCost * cat.defaultRatio);
    }

    return {
      key: cat.key,
      label: cat.label,
      planned,
      actual: 0,
      variance: 0,
      variancePct: 0,
    };
  });

  // Calculate actuals
  if (storedActualBreakdown) {
    categories.forEach(c => {
      c.actual = storedActualBreakdown[c.key] !== undefined ? Number(storedActualBreakdown[c.key]) || 0 : c.planned;
    });
  } else if (explicitCmtTotal !== null && explicitCmtTotal > 0) {
    const cmtCategory = categories.find(c => c.key === "cmt");
    if (cmtCategory) {
      cmtCategory.actual = explicitCmtTotal;
    }
    const nonCmtCategories = categories.filter(c => c.key !== "cmt");
    const nonCmtPlannedSum = nonCmtCategories.reduce((sum, c) => sum + c.planned, 0);
    const remainingActual = Math.max(0, actualCost - explicitCmtTotal);

    nonCmtCategories.forEach(c => {
      if (nonCmtPlannedSum > 0) {
        c.actual = Math.round(remainingActual * (c.planned / nonCmtPlannedSum));
      } else {
        c.actual = Math.round(remainingActual * (1 / nonCmtCategories.length));
      }
    });
  } else {
    categories.forEach(c => {
      if (plannedCost > 0) {
        c.actual = Math.round(actualCost * (c.planned / plannedCost));
      } else {
        const catDef = CATEGORY_MAP.find(m => m.key === c.key);
        c.actual = Math.round(actualCost * (catDef ? catDef.defaultRatio : 1 / categories.length));
      }
    });
  }

  // Adjust rounding differences so sum of category actuals strictly equals actualCost
  const currentActualSum = categories.reduce((sum, c) => sum + c.actual, 0);
  const actualDiff = actualCost - currentActualSum;
  if (actualDiff !== 0 && categories.length > 0) {
    // Apply diff to largest category or fabric
    const targetCat = categories.find(c => c.key === "fabric") || categories[0];
    targetCat.actual += actualDiff;
  }

  // Calculate final variances and percentage for each category
  categories.forEach(c => {
    c.variance = c.actual - c.planned;
    c.variancePct = c.planned > 0 ? (c.variance / c.planned) * 100 : (c.actual > 0 ? 100 : 0);
  });

  // Adjust any rounding so that category actuals sum exactly to actualCost
  // and category planned sums exactly to plannedCost
  const sumPlanned = categories.reduce((sum, c) => sum + c.planned, 0);
  const diffPlanned = plannedCost - sumPlanned;
  if (diffPlanned !== 0 && categories.length > 0) {
    categories[0].planned += diffPlanned;
    categories[0].variance = categories[0].actual - categories[0].planned;
    categories[0].variancePct = categories[0].planned > 0 ? (categories[0].variance / categories[0].planned) * 100 : 0;
  }

  const sumActual = categories.reduce((sum, c) => sum + c.actual, 0);
  const diffActual = actualCost - sumActual;
  if (diffActual !== 0 && categories.length > 0) {
    // Distribute diff to the category with highest actual or first category
    categories[0].actual += diffActual;
    categories[0].variance = categories[0].actual - categories[0].planned;
    categories[0].variancePct = categories[0].planned > 0 ? (categories[0].variance / categories[0].planned) * 100 : 0;
  }

  // Find biggest overrun category (positive variance)
  const overrunCategories = categories.filter(c => c.variance > 0).sort((a, b) => b.variance - a.variance);
  const biggestOverrun = overrunCategories.length > 0 ? overrunCategories[0] : null;

  // Retrieve actual documented reasons/notes stored in project data
  const realReasons = [];
  if (Array.isArray(order.stages)) {
    order.stages.forEach(s => {
      if (s && s.reason && typeof s.reason === "string" && s.reason.trim()) {
        realReasons.push({
          source: `T&A Stage: ${s.name} (${s.dept || "General"})`,
          reason: s.reason.trim(),
          status: s.status || "delayed"
        });
      }
    });
  }
  if (order.riskNotes || order.delayNotes) {
    realReasons.push({
      source: "Order Notes",
      reason: order.riskNotes || order.delayNotes,
      status: order.risk || "medium"
    });
  }

  return {
    order,
    qty,
    plannedCost,
    actualCost,
    totalVariance,
    totalVariancePct,
    categories,
    biggestOverrun,
    realReasons
  };
}

export function FinanceEntryPage({ orders = [], financials, onUpdate, onUpdateOrderCost }) {
  const [selectedOrderForVariance, setSelectedOrderForVariance] = useState(null);
  const activeOrders = useMemo(() => orders.filter(o => o && o.isDeleted !== true && o.isDeleted !== "true" && !o.deletedAt), [orders]);

  const totals = activeOrders.reduce((a, o) => {
    const cmtTotal = o.cmtTotal !== undefined ? (Number(o.cmtTotal) || 0) : ((Number(o.qty) || 0) * (Number(o.cmtRate) || 0));
    return {
      planned: a.planned + (o.plannedCost || 0),
      actual: a.actual + (o.actualCost || 0),
      cmt: a.cmt + cmtTotal,
    };
  }, { planned: 0, actual: 0, cmt: 0 });
  const totalVariance = totals.actual - totals.planned;
  const totalVariancePct = totals.planned > 0 ? (totalVariance / totals.planned) * 100 : 0;

  useEffect(() => {
    if (financials.cogs !== totals.actual) onUpdate("cogs", totals.actual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.actual]);

  const grossProfit = financials.revenue - financials.cogs;
  const grossMargin = financials.revenue > 0 ? Math.round((grossProfit / financials.revenue) * 1000) / 10 : 0;

  // Active breakdown if an order is selected
  const activeBreakdown = useMemo(() => {
    if (!selectedOrderForVariance) return null;
    const currentOrder = orders.find(o => o.id === selectedOrderForVariance.id) || selectedOrderForVariance;
    return computeOrderVarianceBreakdown(currentOrder);
  }, [selectedOrderForVariance, orders]);

  return (
    <div>
      <PageHeader title="Finance data" sub="Cost planned vs. actual cost per order — Total COGS on the Executive Dashboard comes straight from the actual costs below" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total planned cost</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>₹{totals.planned.toLocaleString("en-IN")}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total actual cost</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>₹{totals.actual.toLocaleString("en-IN")}</div></Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Total CMT Value</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>
            ₹{totals.cmt.toLocaleString("en-IN")}
          </div>
        </Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98" }}>Total variance</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: totalVariance > 0 ? "#DC2626" : totalVariance < 0 ? "#059669" : "#4B5563" }}>
            {totalVariance > 0 ? "+" : totalVariance < 0 ? "-" : ""}₹{Math.abs(totalVariance).toLocaleString("en-IN")} <span style={{ fontSize: 13 }}>({totalVariancePct > 0 ? "+" : ""}{totalVariancePct.toFixed(1)}%)</span>
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Cost by order" sub="Planned cost is set when the order is costed; click on any order's Variance to view the complete category breakdown & root causes" />
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.8fr 1fr 1fr 1fr 1fr 1.3fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2", gap: 6 }}>
          <div>Order / Style</div>
          <div>Buyer</div>
          <div>Order Qty</div>
          <div>CMT Rate / pc (₹)</div>
          <div>CMT Total (₹)</div>
          <div>Planned cost (₹)</div>
          <div>Actual cost (₹)</div>
          <div>Variance & Status</div>
        </div>
        {orders.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
            No orders available. Create or import orders to record planned and actual costs.
          </div>
        ) : (
          orders.map(o => {
            const qty = Number(o.qty) || 0;
            const cmtRate = o.cmtRate !== undefined ? o.cmtRate : "";
            const calculatedCmtTotal = qty * (Number(cmtRate) || 0);
            const cmtTotalVal = o.cmtTotal !== undefined ? o.cmtTotal : (cmtRate !== "" ? calculatedCmtTotal : 0);
            const planned = Number(o.plannedCost) || 0;
            const actual = Number(o.actualCost) || 0;
            const variance = actual - planned;
            const variancePct = planned > 0 ? (variance / planned) * 100 : 0;

            // Status category & styling
            const isOverrun = variance > 0;
            const isFavourable = variance < 0;
            const isNoVariance = variance === 0;

            const statusText = isOverrun ? "Cost Overrun" : isFavourable ? "Favourable" : "No variance";
            const statusBg = isOverrun ? "#FEF2F2" : isFavourable ? "#ECFDF5" : "#F3F4F6";
            const statusColor = isOverrun ? "#DC2626" : isFavourable ? "#059669" : "#4B5563";
            const statusBorder = isOverrun ? "#FECACA" : isFavourable ? "#A7F3D0" : "#E5E7EB";

            return (
              <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.8fr 1fr 1fr 1fr 1fr 1.3fr", alignItems: "center", fontSize: 12.5, padding: "8px 4px", borderBottom: "1px solid #F5F5F7", gap: 6 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98" }}>{o.id}</div>
                  <div style={{ fontWeight: 600, color: "#1B2130" }}>{o.style}</div>
                </div>
                <div>{o.buyer}</div>
                <div style={{ fontWeight: 600, color: "#475569" }}>{qty.toLocaleString("en-IN")} pcs</div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={o.cmtRate !== undefined ? o.cmtRate : ""}
                    onChange={e => {
                      const rate = e.target.value === "" ? "" : Number(e.target.value);
                      onUpdateOrderCost(o.id, "cmtRate", rate);
                      if (rate !== "") {
                        onUpdateOrderCost(o.id, "cmtTotal", Math.round(qty * Number(rate) * 100) / 100);
                      }
                    }}
                    style={{ width: 84, fontSize: 12, padding: "5px 7px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={o.cmtTotal !== undefined ? o.cmtTotal : (cmtRate !== "" ? calculatedCmtTotal : "")}
                    onChange={e => onUpdateOrderCost(o.id, "cmtTotal", e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ width: 88, fontSize: 12, padding: "5px 7px", borderRadius: 6, border: "1px solid #E7E8ED", color: "#0F766E", fontWeight: 600 }}
                    title="Auto-calculated from Qty × CMT Rate, or enter manual override"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={o.plannedCost || 0}
                    onChange={e => onUpdateOrderCost(o.id, "plannedCost", Number(e.target.value))}
                    style={{ width: 84, fontSize: 12, padding: "5px 7px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={o.actualCost || 0}
                    onChange={e => onUpdateOrderCost(o.id, "actualCost", Number(e.target.value))}
                    style={{ width: 84, fontSize: 12, padding: "5px 7px", borderRadius: 6, border: "1px solid #E7E8ED" }}
                  />
                </div>

                {/* Clickable Variance Column with Indicator & Status */}
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForVariance(o)}
                    title="Click to view detailed Category Variance Breakdown"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "4px 6px",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 3,
                      transition: "background 0.15s ease",
                      width: "100%",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isOverrun ? "#FEE2E2" : "#F3F4F6"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: isOverrun ? "#DC2626" : isFavourable ? "#059669" : "#4B5563",
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                      }}>
                        {variance > 0 ? "+" : variance < 0 ? "-" : ""}₹{Math.abs(variance).toLocaleString("en-IN")}
                      </span>
                      {planned > 0 && (
                        <span style={{ fontSize: 11, color: isOverrun ? "#B91C1C" : isFavourable ? "#047857" : "#6B7280", fontWeight: 600 }}>
                          ({variancePct > 0 ? "+" : ""}{variancePct.toFixed(1)}%)
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: statusBg,
                      color: statusColor,
                      border: `1px solid ${statusBorder}`,
                      letterSpacing: 0.2
                    }}>
                      {isOverrun && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#DC2626" }} />}
                      {isFavourable && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#059669" }} />}
                      {isNoVariance && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#9CA3AF" }} />}
                      {statusText}
                    </div>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Card>

      <Card style={{ maxWidth: 460 }}>
        <CardHeader title="Computed" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: "#8A8D98" }}>Gross profit</span>
          <span style={{ fontWeight: 700 }}>
            {grossProfit < 0 ? "-₹" : "₹"}{Math.abs(grossProfit).toLocaleString("en-IN")}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "#8A8D98" }}>Gross margin</span><span style={{ fontWeight: 700 }}>{grossMargin}%</span></div>
      </Card>

      {/* DETAILED VARIANCE BREAKDOWN MODAL */}
      {activeBreakdown && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedOrderForVariance(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              width: "100%",
              maxWidth: 780,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
              animation: "fadeIn 0.18s ease-out"
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: "18px 24px",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              background: "#F8FAFC"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#64748B", background: "#E2E8F0", padding: "2px 8px", borderRadius: 4 }}>
                    {activeBreakdown.order.id}
                  </span>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
                    Variance Analysis: {activeBreakdown.order.style}
                  </h2>
                </div>
                <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
                  Buyer: <span style={{ fontWeight: 600, color: "#334155" }}>{activeBreakdown.order.buyer}</span> · Quantity: <span style={{ fontWeight: 600, color: "#334155" }}>{activeBreakdown.qty.toLocaleString()} pcs</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForVariance(null)}
                style={{
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748B"
                }}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {/* Summary Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>Planned Budget</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>
                    ₹{activeBreakdown.plannedCost.toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>Actual Incurred</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>
                    ₹{activeBreakdown.actualCost.toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{
                  background: activeBreakdown.totalVariance > 0 ? "#FEF2F2" : activeBreakdown.totalVariance < 0 ? "#ECFDF5" : "#F8FAFC",
                  border: `1px solid ${activeBreakdown.totalVariance > 0 ? "#FECACA" : activeBreakdown.totalVariance < 0 ? "#A7F3D0" : "#E2E8F0"}`,
                  borderRadius: 10,
                  padding: "12px 16px"
                }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: activeBreakdown.totalVariance > 0 ? "#991B1B" : activeBreakdown.totalVariance < 0 ? "#065F46" : "#475569" }}>
                    Total Variance
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: activeBreakdown.totalVariance > 0 ? "#DC2626" : activeBreakdown.totalVariance < 0 ? "#059669" : "#334155",
                    marginTop: 4
                  }}>
                    {activeBreakdown.totalVariance > 0 ? "+" : activeBreakdown.totalVariance < 0 ? "-" : ""}₹{Math.abs(activeBreakdown.totalVariance).toLocaleString("en-IN")}
                    <span style={{ fontSize: 12.5, fontWeight: 600, marginLeft: 6 }}>
                      ({activeBreakdown.totalVariancePct > 0 ? "+" : ""}{activeBreakdown.totalVariancePct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Biggest Overrun Callout Banner (Requirement 8 & 3) */}
              {activeBreakdown.biggestOverrun ? (
                <div style={{
                  background: "#FEF2F2",
                  border: "1px solid #F87171",
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#FEE2E2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <TriangleAlert size={18} color="#DC2626" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Biggest Cost Overrun Driver
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#7F1D1D", marginTop: 2 }}>
                      <span style={{ fontWeight: 800 }}>{activeBreakdown.biggestOverrun.label}</span> is exceeding budget by{" "}
                      <span style={{ fontWeight: 800 }}>+{activeBreakdown.biggestOverrun.variance > 0 ? "" : "-"}₹{Math.abs(activeBreakdown.biggestOverrun.variance).toLocaleString("en-IN")}</span>{" "}
                      (+{activeBreakdown.biggestOverrun.variancePct.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              ) : activeBreakdown.totalVariance <= 0 ? (
                <div style={{
                  background: "#ECFDF5",
                  border: "1px solid #6EE7B7",
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#D1FAE5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <CheckCircle size={18} color="#059669" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      No Overruns Detected
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#047857", marginTop: 1 }}>
                      All individual cost categories are operating within or below the planned budget limits.
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Category Contribution Table (Requirements 5, 6, 7) */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1fr 1fr 1.2fr 1fr",
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                  padding: "10px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: 0.4
                }}>
                  <div>Cost Category</div>
                  <div style={{ textAlign: "right" }}>Planned (₹)</div>
                  <div style={{ textAlign: "right" }}>Actual (₹)</div>
                  <div style={{ textAlign: "right" }}>Variance (₹)</div>
                  <div style={{ textAlign: "right" }}>Variance (%)</div>
                </div>

                {activeBreakdown.categories.map((cat, idx) => {
                  const isCatOverrun = cat.variance > 0;
                  const isCatFavourable = cat.variance < 0;
                  const isCatZero = cat.variance === 0;

                  return (
                    <div
                      key={cat.key}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2.2fr 1fr 1fr 1.2fr 1fr",
                        alignItems: "center",
                        padding: "11px 14px",
                        fontSize: 12.5,
                        borderBottom: idx === activeBreakdown.categories.length - 1 ? "none" : "1px solid #F1F5F9",
                        background: isCatOverrun ? "#FFFBFB" : "transparent"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: isCatOverrun ? "#DC2626" : isCatFavourable ? "#059669" : "#9CA3AF"
                        }} />
                        <span style={{ fontWeight: 600, color: "#1E293B" }}>{cat.label}</span>
                        {activeBreakdown.biggestOverrun && activeBreakdown.biggestOverrun.key === cat.key && (
                          <span style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "#FEE2E2",
                            color: "#DC2626",
                            border: "1px solid #FECACA"
                          }}>
                            HIGHEST OVERRUN
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: "right", color: "#475569", fontWeight: 500 }}>
                        ₹{cat.planned.toLocaleString("en-IN")}
                      </div>
                      <div style={{ textAlign: "right", color: "#0F172A", fontWeight: 600 }}>
                        ₹{cat.actual.toLocaleString("en-IN")}
                      </div>
                      <div style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: isCatOverrun ? "#DC2626" : isCatFavourable ? "#059669" : "#64748B"
                      }}>
                        {cat.variance > 0 ? "+" : cat.variance < 0 ? "-" : ""}₹{Math.abs(cat.variance).toLocaleString("en-IN")}
                      </div>
                      <div style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: isCatOverrun ? "#DC2626" : isCatFavourable ? "#059669" : "#64748B"
                      }}>
                        {cat.variancePct > 0 ? "+" : ""}{cat.variancePct.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}

                {/* Total Row (Requirement 7) */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1fr 1fr 1.2fr 1fr",
                  alignItems: "center",
                  padding: "12px 14px",
                  fontSize: 13,
                  fontWeight: 800,
                  background: "#F1F5F9",
                  borderTop: "2px solid #CBD5E1",
                  color: "#0F172A"
                }}>
                  <div>Total Order Spend</div>
                  <div style={{ textAlign: "right" }}>₹{activeBreakdown.plannedCost.toLocaleString("en-IN")}</div>
                  <div style={{ textAlign: "right" }}>₹{activeBreakdown.actualCost.toLocaleString("en-IN")}</div>
                  <div style={{
                    textAlign: "right",
                    color: activeBreakdown.totalVariance > 0 ? "#DC2626" : activeBreakdown.totalVariance < 0 ? "#059669" : "#475569"
                  }}>
                    {activeBreakdown.totalVariance > 0 ? "+" : activeBreakdown.totalVariance < 0 ? "-" : ""}₹{Math.abs(activeBreakdown.totalVariance).toLocaleString("en-IN")}
                  </div>
                  <div style={{
                    textAlign: "right",
                    color: activeBreakdown.totalVariance > 0 ? "#DC2626" : activeBreakdown.totalVariance < 0 ? "#059669" : "#475569"
                  }}>
                    {activeBreakdown.totalVariancePct > 0 ? "+" : ""}{activeBreakdown.totalVariancePct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Documented Root Causes / Stage Notes (Requirement 9: Show only when actually exists in stored data) */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <ClipboardList size={14} color="#64748B" />
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.3 }}>
                    Documented Project Records & Stage Flags
                  </div>
                </div>

                {activeBreakdown.realReasons.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activeBreakdown.realReasons.map((r, i) => (
                      <div key={i} style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: 6,
                        padding: "8px 12px",
                        fontSize: 12
                      }}>
                        <div style={{ fontWeight: 700, color: "#991B1B", fontSize: 11.5, marginBottom: 2 }}>
                          {r.source}
                        </div>
                        <div style={{ color: "#334155" }}>
                          "{r.reason}"
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", padding: "4px 0" }}>
                    No delay flags or rework issues recorded in this order's T&A stages. Variance reflects direct operational cost differences between original costing estimates and actual financial inputs.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "14px 24px",
              borderTop: "1px solid #E2E8F0",
              background: "#F8FAFC",
              display: "flex",
              justifyContent: "flex-end"
            }}>
              <button
                type="button"
                onClick={() => setSelectedOrderForVariance(null)}
                style={{
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportsPage({ orders = [] }) {
  const activeOrders = useMemo(() => orders.filter(o => o && o.isDeleted !== true && o.isDeleted !== "true" && !o.deletedAt), [orders]);
  const total = activeOrders.length;
  const onTrack = activeOrders.filter(o => o.status === "On Track").length;
  const totalQty = activeOrders.reduce((a, o) => a + (Number(o.qty) || 0), 0);
  const rows = [
    ["Total orders", total],
    ["On-time rate", total > 0 ? `${Math.round((onTrack / total) * 100)}%` : "0%"],
    ["Total order quantity", totalQty.toLocaleString() + " pcs"],
    ["Avg order lead time", total > 0 ? "87 days" : "0 days"],
    ["Avg sampling time", total > 0 ? "24 days" : "0 days"],
    ["Quality pass rate", total > 0 ? "93.6%" : "0%"],
  ];

  const seasonRows = useMemo(() => {
    const groups = {};
    activeOrders.forEach(o => {
      const key = `${o.buyer}||${o.season || "—"}`;
      if (!groups[key]) groups[key] = { buyer: o.buyer, season: o.season || "—", ordered: 0, shipped: 0 };
      groups[key].ordered += (Number(o.qty) || 0);
      groups[key].shipped += (Number(o.shippedQty) || 0);
    });
    return Object.values(groups).map(g => ({
      ...g,
      diff: g.shipped - g.ordered,
      pctDiff: g.ordered > 0 ? ((g.shipped - g.ordered) / g.ordered) * 100 : 0,
    }));
  }, [activeOrders]);

  return (
    <div>
      <PageHeader title="Reports" sub="Summary metrics — full report builder is next on the roadmap" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {rows.map(([label, val]) => (
          <Card key={label} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8A8D98" }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{val}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Shipped qty per season" sub="Ordered qty (from the PO) vs qty shipped (entered at Final OCR)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 1fr 1fr 0.9fr 0.9fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Buyer</div><div>Season</div><div>Ordered Qty</div><div>Shipped Qty</div><div>Difference</div><div>% Diff</div>
        </div>
        {seasonRows.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
            No orders or seasonal shipments recorded yet.
          </div>
        ) : (
          seasonRows.map(r => (
            <div key={r.buyer + r.season} style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr 1fr 1fr 0.9fr 0.9fr", alignItems: "center", fontSize: 12.5, padding: "9px 4px", borderBottom: "1px solid #F5F5F7" }}>
              <div style={{ fontWeight: 600, color: "#1B2130" }}>{r.buyer}</div>
              <div>{r.season}</div>
              <div>{r.ordered.toLocaleString()}</div>
              <div>{r.shipped.toLocaleString()}</div>
              <div style={{ color: r.diff < 0 ? "#D64545" : "#1F9E8D", fontWeight: 600 }}>{r.diff > 0 ? "+" : ""}{r.diff.toLocaleString()}</div>
              <div style={{ color: r.pctDiff < 0 ? "#D64545" : "#1F9E8D", fontWeight: 600 }}>{r.pctDiff > 0 ? "+" : ""}{r.pctDiff.toFixed(2)}%</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

export function InsightsPage({ orders }) {
  const allStages = orders.flatMap(o => o.stages || []);
  const counts = {};
  allStages.forEach(s => { if (s.reason) counts[s.reason] = (counts[s.reason] || 0) + 1; });
  const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = arr.reduce((a, [, c]) => a + c, 0) || 1;
  return (
    <div>
      <PageHeader title="All insights" sub="Root-cause breakdown across every flagged delay" />
      <Card>
        <CardHeader title="Delay reasons (all orders)" />
        {arr.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No delays flagged yet.</div>
        ) : arr.map(([reason, count]) => (
          <div key={reason} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: "#1B2130" }}>{reason}</span>
              <span style={{ color: "#8A8D98" }}>{count} ({Math.round(count / total * 100)}%)</span>
            </div>
            <div style={{ height: 6, background: "#F0F0F2", borderRadius: 999 }}>
              <div style={{ height: 6, width: `${count / total * 100}%`, background: "#D64545", borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function AssignWorkModal({
  orders = [],
  tasks = [],
  suppliers = [],
  prefillSupplierId = null,
  prefillOrderId = null,
  prefillStageIdx = null,
  prefillDept = null,
  prefillTaskName = null,
  onClose,
  onAssign
}) {
  const activeSuppliers = suppliers.filter(s => !s.isDeleted);
  const [supplierId, setSupplierId] = useState(prefillSupplierId || activeSuppliers[0]?.id || "");
  const [source, setSource] = useState("order"); // "order" | "my_task" | "dept_task"
  const [selectedOrderId, setSelectedOrderId] = useState(prefillOrderId || orders[0]?.id || "");
  const [selectedStageIdx, setSelectedStageIdx] = useState(prefillStageIdx !== null ? prefillStageIdx : 0);
  const [selectedDept, setSelectedDept] = useState(prefillDept || "VAP");
  const [selectedTaskName, setSelectedTaskName] = useState(prefillTaskName || "");
  const [purpose, setPurpose] = useState("Printing");
  const [description, setDescription] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatus] = useState("Pending");

  // Get currently selected order
  const currentOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || orders[0] || null;
  }, [orders, selectedOrderId]);

  // Available stages for selected order
  const availableStages = useMemo(() => {
    if (!currentOrder || !currentOrder.stages) return [];
    return currentOrder.stages;
  }, [currentOrder]);

  // Sync stage/department when order or stage selection changes
  useEffect(() => {
    if (availableStages.length > 0) {
      const stage = availableStages[selectedStageIdx] || availableStages[0];
      if (stage) {
        setSelectedDept(stage.dept || "VAP");
        setSelectedTaskName(stage.name || "Workflow Task");
        if (!expectedDate) {
          setExpectedDate(stage.planned || currentOrder?.ship || "20 May");
        }
      }
    }
  }, [availableStages, selectedStageIdx, currentOrder]);

  // Auto-generate suggested description
  useEffect(() => {
    if (currentOrder) {
      const task = selectedTaskName || (availableStages[selectedStageIdx]?.name) || "Production";
      setDescription(`${purpose} for ${currentOrder.id} (${currentOrder.style}) - ${task}`);
    }
  }, [purpose, selectedOrderId, selectedStageIdx, selectedTaskName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const sup = activeSuppliers.find(s => s.id === supplierId);
    if (!sup) {
      alert("Please select a supplier.");
      return;
    }
    if (!currentOrder) {
      alert("Please select an existing order.");
      return;
    }

    const newAssignment = {
      id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: currentOrder.id,
      style: currentOrder.style,
      buyer: currentOrder.buyer,
      qty: currentOrder.qty,
      supplierId: sup.id,
      supplierName: sup.name,
      source,
      dept: selectedDept,
      taskName: selectedTaskName || availableStages[selectedStageIdx]?.name || "Custom Job",
      stageIdx: selectedStageIdx,
      purpose,
      description: description.trim() || `${purpose} work for ${currentOrder.id}`,
      assignedDate: new Date().toISOString().split("T")[0],
      expectedDate: expectedDate || currentOrder.ship || "20 May",
      completedDate: null,
      status,
      qualityStatus: "Pending",
      qualityIssueDescription: "",
      createdAt: new Date().toISOString(),
      isDeleted: false
    };

    if (onAssign) {
      onAssign(newAssignment);
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
          maxWidth: 660,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0F0F2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#151B2E", margin: 0 }}>Assign Work to Supplier</h3>
            <p style={{ fontSize: 12.5, color: "#8A8D98", margin: "4px 0 0" }}>
              Link specific work from existing orders, tasks, or departments to a vendor
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A8D98", cursor: "pointer", padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

            {/* Supplier Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#374151", marginBottom: 5 }}>
                Select Supplier *
              </label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                required
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, fontWeight: 600, color: "#111827", background: "#F9FAFB" }}
              >
                {activeSuppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code} · {s.type})
                  </option>
                ))}
              </select>
            </div>



            {/* Order / Task Selectors based on source */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Select Existing Order *
                </label>
                <select
                  value={selectedOrderId}
                  onChange={e => {
                    setSelectedOrderId(e.target.value);
                    setSelectedStageIdx(0);
                  }}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                >
                  {Array.from(new Map((orders || []).filter(o => !o.isDeleted).map(o => [o.id, o])).values()).map((o, idx) => (
                    <option key={o.primaryId || `${o.id}-${idx}`} value={o.id}>
                      {o.id} · {o.style} ({o.buyer})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Task / Stage to Assign *
                </label>
                <select
                  value={selectedStageIdx}
                  onChange={e => {
                    const idx = Number(e.target.value);
                    setSelectedStageIdx(idx);
                    const s = availableStages[idx];
                    if (s) {
                      setSelectedDept(s.dept || "VAP");
                      setSelectedTaskName(s.name);
                    }
                  }}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                >
                  {availableStages.map((s, idx) => (
                    <option key={idx} value={idx}>
                      {s.name} ({s.dept})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-Populated Order / Task Summary Card */}
            {currentOrder && (
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 9, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  Linked Order & Task Information (Single Source of Truth)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>PO / Order ID</span>
                    <strong style={{ fontFamily: "monospace", color: "#378ADD" }}>{currentOrder.id}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Style</span>
                    <strong style={{ color: "#1B2130" }}>{currentOrder.style}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Buyer</span>
                    <span style={{ color: "#4B5563" }}>{currentOrder.buyer}</span>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Quantity</span>
                    <span style={{ color: "#4B5563", fontWeight: 600 }}>{Number(currentOrder.qty).toLocaleString()} pcs</span>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Department</span>
                    <span style={{ color: "#534AB7", fontWeight: 600 }}>{selectedDept}</span>
                  </div>
                  <div>
                    <span style={{ color: "#8A8D98", fontSize: 11, display: "block" }}>Current Stage / Task</span>
                    <span style={{ color: "#166534", fontWeight: 600 }}>{selectedTaskName || availableStages[selectedStageIdx]?.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Purpose of Supplier Work & Expected Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Purpose of Supplier Work *
                </label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                >
                  {WORK_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Expected Completion Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. 25 May"
                  value={expectedDate}
                  onChange={e => setExpectedDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
                />
              </div>
            </div>

            {/* Work Description */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                Work Description & Instructions *
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Print front logo for PO GKT-1054 Hoodie"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
              />
            </div>

            {/* Initial Status */}
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                Initial Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 12.5 }}
              >
                <option value="Pending">Pending (Waiting to start)</option>
                <option value="In Progress">In Progress (Work started)</option>
              </select>
            </div>

          </div>

          <div style={{ padding: "14px 24px", borderTop: "1px solid #F0F0F2", background: "#FAFAFB", display: "flex", justifyContent: "flex-end", gap: 10, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, fontWeight: 600, color: "#4B5563", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: "#534AB7", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Layers size={14} />
              Assign Work
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddSupplierModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: SUPPLIER_TYPES[0] || "Printing & Embroidery",
    contactPerson: "",
    mobile: "",
    email: "",
    address: "",
    city: "Tirupur",
    country: "India",
    onTimeTarget: 95,
    qualityTarget: 98,
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Supplier name is required.");
      return;
    }
    const newSup = {
      id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: form.name.trim(),
      code: form.code.trim() || `SUP-${Date.now().toString().slice(-4)}`,
      type: form.type,
      contactPerson: form.contactPerson.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      onTimeTarget: Number(form.onTimeTarget) || 95,
      qualityTarget: Number(form.qualityTarget) || 98,
      notes: form.notes.trim(),
      latestOrderDate: null,
      createdAt: new Date().toISOString(),
      isDeleted: false
    };

    if (onAdd) onAdd(newSup);
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
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0F0F2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#151B2E", margin: 0 }}>Add New Supplier</h3>
            <p style={{ fontSize: 12.5, color: "#8A8D98", margin: "4px 0 0" }}>Register a vendor for printing, dyeing, embroidery, fabric, or accessories</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A8D98", cursor: "pointer", padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1F9E8D", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Supplier Information
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dyeing & Printing"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Code / ID</label>
                <input
                  type="text"
                  placeholder="e.g. SUP-APX-05"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                >
                  {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Mobile / Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98420 12345"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. orders@apexdyeing.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Address</label>
              <input
                type="text"
                placeholder="e.g. 54, Industrial Estate, Angeripalayam Main Road"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>City</label>
                <input
                  type="text"
                  placeholder="e.g. Tirupur"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Country</label>
                <input
                  type="text"
                  placeholder="e.g. India"
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1F9E8D", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, borderTop: "1px solid #F0F0F2", paddingTop: 14 }}>
              Performance & Business Information
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>On-time Delivery Target %</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.onTimeTarget}
                  onChange={e => setForm({ ...form, onTimeTarget: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Quality Target %</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.qualityTarget}
                  onChange={e => setForm({ ...form, qualityTarget: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Notes / Capabilities</label>
              <textarea
                rows={2}
                placeholder="Specializations, machinery specs, certifications, capacity..."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ padding: "14px 24px", borderTop: "1px solid #F0F0F2", background: "#FAFAFB", display: "flex", justifyContent: "flex-end", gap: 10, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, fontWeight: 600, color: "#4B5563", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#1F9E8D", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
            >
              Add Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditSupplierModal({ supplier, onClose, onSave }) {
  const [form, setForm] = useState({
    name: supplier?.name || "",
    code: supplier?.code || "",
    type: supplier?.type || SUPPLIER_TYPES[0] || "Printing & Embroidery",
    contactPerson: supplier?.contactPerson || "",
    mobile: supplier?.mobile || "",
    email: supplier?.email || "",
    address: supplier?.address || "",
    city: supplier?.city || "Tirupur",
    country: supplier?.country || "India",
    onTimeTarget: supplier?.onTimeTarget || 95,
    qualityTarget: supplier?.qualityTarget || 98,
    notes: supplier?.notes || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Supplier name is required.");
      return;
    }
    const updated = {
      ...supplier,
      name: form.name.trim(),
      code: form.code.trim() || supplier.code,
      type: form.type,
      contactPerson: form.contactPerson.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      onTimeTarget: Number(form.onTimeTarget) || 95,
      qualityTarget: Number(form.qualityTarget) || 98,
      notes: form.notes.trim()
    };

    if (onSave) onSave(updated);
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
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0F0F2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#151B2E", margin: 0 }}>Edit Supplier: {supplier?.name}</h3>
            <p style={{ fontSize: 12.5, color: "#8A8D98", margin: "4px 0 0" }}>Update supplier contact, location, and performance targets</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8A8D98", cursor: "pointer", padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Code / ID</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Supplier Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                >
                  {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Contact Person</label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Mobile / Phone</label>
                <input
                  type="text"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>On-time Delivery Target %</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.onTimeTarget}
                  onChange={e => setForm({ ...form, onTimeTarget: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Quality Target %</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.qualityTarget}
                  onChange={e => setForm({ ...form, qualityTarget: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ padding: "14px 24px", borderTop: "1px solid #F0F0F2", background: "#FAFAFB", display: "flex", justifyContent: "flex-end", gap: 10, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: 13, fontWeight: 600, color: "#4B5563", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#1F9E8D", fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function supplierStatusPill(status) {
  const styles = {
    Excellent: { bg: "#E1F5EE", fg: "#085041" },
    Good: { bg: "#EFF6FF", fg: "#1D4ED8" },
    "Needs Attention": { bg: "#FEF3C7", fg: "#92400E" },
    Poor: { bg: "#FEE2E2", fg: "#991B1B" },
    New: { bg: "#F3F4F6", fg: "#4B5563" }
  };
  const s = styles[status] || styles.Good;
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
      {status}
    </span>
  );
}

export function SupplierDetailView({
  supplier,
  orders = [],
  supplierWork = [],
  onBack,
  onOpenOrder,
  onUpdateSupplier,
  onDeleteSupplier,
  onAssignWork,
  onUpdateWorkStatus,
  onUpdateWorkQuality
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const metrics = useMemo(() => calculateSupplierMetrics(supplier, orders, supplierWork), [supplier, orders, supplierWork]);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete supplier "${supplier.name}"? Historical order data will remain preserved.`)) {
      if (onDeleteSupplier) onDeleteSupplier(supplier.id);
      if (onBack) onBack();
    }
  };

  const handleStatusChange = (item, newStatus) => {
    if (onUpdateWorkStatus) {
      const isDone = newStatus === "Completed";
      const completedDate = isDone ? new Date().toISOString().split("T")[0] : null;
      onUpdateWorkStatus(item.id, newStatus, completedDate);
    }
  };

  const handleQualityChange = (item, newQualityStatus) => {
    let issueDesc = item.qualityIssueDescription || "";
    if (newQualityStatus === "Issue") {
      const entered = window.prompt("Enter quality issue description (e.g. Color mismatch, Embroidery thread tension):", issueDesc || "Quality rework required");
      if (entered === null) return;
      issueDesc = entered;
    }
    if (onUpdateWorkQuality) {
      onUpdateWorkQuality(item.id, newQualityStatus, issueDesc);
    }
  };

  return (
    <div>
      <BackLink onClick={onBack} label="Back to Supplier performance" />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1B2130" }}>{supplier.name}</h1>
            {supplierStatusPill(metrics.status)}
          </div>
          <div style={{ fontSize: 13, color: "#8A8D98", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "monospace", color: "#534AB7", fontWeight: 600 }}>{supplier.code}</span>
            <span>·</span>
            <span>{supplier.type}</span>
            <span>·</span>
            <span>{supplier.city}, {supplier.country}</span>
          </div>
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
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <Layers size={14} />
            Assign Work
          </button>
          <button
            onClick={() => setShowEdit(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#FFFFFF",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <Edit size={14} />
            Edit Supplier
          </button>
          <button
            onClick={handleDelete}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#FEE2E2",
              color: "#991B1B",
              border: "1px solid #FCA5A5",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <Trash2 size={14} />
            Delete Supplier
          </button>
        </div>
      </div>

      {/* Overview Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr", gap: 16, marginBottom: 20 }}>
        {/* Supplier Information Card */}
        <Card>
          <CardHeader title="Supplier Information" sub="Contact and facility profile" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 11, color: "#8A8D98" }}>Contact Person</div>
              <div style={{ fontWeight: 600, color: "#1B2130", marginTop: 1 }}>{supplier.contactPerson || "—"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "#8A8D98" }}>Mobile Number</div>
                <div style={{ fontWeight: 600, color: "#1B2130", marginTop: 1 }}>{supplier.mobile || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#8A8D98" }}>Email Address</div>
                <div style={{ fontWeight: 600, color: "#378ADD", marginTop: 1, wordBreak: "break-all" }}>{supplier.email || "—"}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#8A8D98" }}>Full Address</div>
              <div style={{ color: "#4B5563", marginTop: 1 }}>{supplier.address || "—"}, {supplier.city}, {supplier.country}</div>
            </div>
            {supplier.notes && (
              <div>
                <div style={{ fontSize: 11, color: "#8A8D98" }}>Capabilities & Notes</div>
                <div style={{ fontSize: 12, color: "#565A66", marginTop: 2, background: "#F9FAFB", padding: "8px 10px", borderRadius: 6, border: "1px solid #E5E7EB" }}>
                  {supplier.notes}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Performance KPI Cards */}
        <Card>
          <CardHeader title="Performance Summary" sub="Calculated dynamically from actual assigned supplier jobs" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Total Jobs / Orders</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>{metrics.jobs}</div>
              <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>Assigned workflow jobs</div>
            </div>

            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#166534", fontWeight: 600 }}>On-time Rate</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#15803D", marginTop: 4 }}>
                {metrics.onTimeRate !== null ? `${metrics.onTimeRate}%` : "—"}
              </div>
              <div style={{ fontSize: 11, color: "#166534", marginTop: 2 }}>{metrics.onTime} on-time of {metrics.jobs}</div>
            </div>

            <div style={{ background: metrics.delayed > 0 ? "#FEF2F2" : "#F8FAFC", border: metrics.delayed > 0 ? "1px solid #FECACA" : "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: metrics.delayed > 0 ? "#991B1B" : "#64748B", fontWeight: 600 }}>Delayed Orders</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: metrics.delayed > 0 ? "#DC2626" : "#475569", marginTop: 4 }}>{metrics.delayed}</div>
              <div style={{ fontSize: 11, color: metrics.delayed > 0 ? "#991B1B" : "#8A8D98", marginTop: 2 }}>Delayed or past due</div>
            </div>

            <div style={{ background: metrics.qualityIssues > 0 ? "#FEF2F2" : "#F8FAFC", border: metrics.qualityIssues > 0 ? "1px solid #FECACA" : "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: metrics.qualityIssues > 0 ? "#991B1B" : "#64748B", fontWeight: 600 }}>Quality Issues</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: metrics.qualityIssues > 0 ? "#DC2626" : "#475569", marginTop: 4 }}>{metrics.qualityIssues}</div>
              <div style={{ fontSize: 11, color: metrics.qualityIssues > 0 ? "#991B1B" : "#8A8D98", marginTop: 2 }}>Quality rework flags</div>
            </div>

            <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#0369A1", fontWeight: 600 }}>Quality Performance</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0284C7", marginTop: 4 }}>
                {metrics.qualityPerformance !== null ? `${metrics.qualityPerformance}%` : "—"}
              </div>
              <div style={{ fontSize: 11, color: "#0369A1", marginTop: 2 }}>Target: {supplier.qualityTarget || 98}%</div>
            </div>

            <div style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#7E22CE", fontWeight: 600 }}>Delivery Target</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#9333EA", marginTop: 4 }}>{supplier.onTimeTarget || 95}%</div>
              <div style={{ fontSize: 11, color: "#7E22CE", marginTop: 2 }}>Agreed SLA target</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Supplier Work & Orders Table */}
      <Card>
        <div style={{ padding: "0 0 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Supplier Work & Assigned Orders</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#F0EFFB", color: "#534AB7", padding: "2px 8px", borderRadius: 999 }}>
              {metrics.matchingItems.length} jobs
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#8A8D98" }}>All assignments derived from existing orders and department tasks</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.8fr 1fr 1fr 0.9fr 1.3fr 0.8fr 0.8fr 0.9fr 1fr", fontSize: 11, color: "#8A8D98", padding: "0 6px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Order / PO</div>
          <div>Style Number</div>
          <div>Buyer</div>
          <div>Department</div>
          <div>Task / Stage</div>
          <div>Purpose</div>
          <div>Work Description</div>
          <div>Assigned Date</div>
          <div>Expected Date</div>
          <div>Status</div>
          <div>Quality Status</div>
        </div>

        {metrics.matchingItems.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
            No work currently assigned to this supplier. Click <strong>+ Assign Work</strong> above to allocate work from an existing order or task.
          </div>
        ) : (
          metrics.matchingItems.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr 0.8fr 1fr 1fr 0.9fr 1.3fr 0.8fr 0.8fr 0.9fr 1fr",
                alignItems: "center",
                fontSize: 12,
                padding: "12px 6px",
                borderBottom: "1px solid #F5F5F7"
              }}
            >
              <div>
                <span
                  onClick={() => onOpenOrder && onOpenOrder(item.orderId)}
                  style={{ fontFamily: "monospace", fontSize: 12, color: "#378ADD", fontWeight: 700, cursor: "pointer" }}
                >
                  {item.orderId}
                </span>
                <div style={{ fontSize: 10.5, color: "#8A8D98" }}>{Number(item.qty || 0).toLocaleString()} pcs</div>
              </div>

              <div style={{ fontWeight: 600, color: "#1B2130" }}>{item.style}</div>
              <div style={{ color: "#4B5563" }}>{item.buyer}</div>
              <div>
                <span style={{ fontSize: 11, background: "#F0EFFB", color: "#534AB7", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                  {item.dept}
                </span>
              </div>
              <div style={{ color: "#1B2130", fontWeight: 500 }}>{item.taskName}</div>
              <div>
                <span style={{ fontSize: 11, background: "#E0F2FE", color: "#0369A1", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                  {item.purpose}
                </span>
              </div>
              <div style={{ color: "#4B5563", fontSize: 11.5, paddingRight: 8 }} title={item.description}>
                {item.description}
              </div>
              <div style={{ color: "#8A8D98", fontSize: 11 }}>{item.assignedDate}</div>
              <div style={{ color: "#1B2130", fontSize: 11.5, fontWeight: 500 }}>{item.expectedDate}</div>

              <div>
                <select
                  value={item.status}
                  onChange={e => handleStatusChange(item, e.target.value)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 6px",
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    background:
                      item.status === "Completed" ? "#E1F5EE" :
                        item.status === "Delayed" ? "#FEE2E2" :
                          item.status === "In Progress" ? "#FEF3C7" : "#F3F4F6",
                    color:
                      item.status === "Completed" ? "#085041" :
                        item.status === "Delayed" ? "#991B1B" :
                          item.status === "In Progress" ? "#92400E" : "#4B5563",
                    cursor: "pointer"
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              <div>
                <select
                  value={item.qualityStatus}
                  onChange={e => handleQualityChange(item, e.target.value)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 6px",
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    background:
                      item.qualityStatus === "Passed" ? "#E1F5EE" :
                        item.qualityStatus === "Issue" ? "#FEE2E2" : "#F3F4F6",
                    color:
                      item.qualityStatus === "Passed" ? "#085041" :
                        item.qualityStatus === "Issue" ? "#991B1B" : "#4B5563",
                    cursor: "pointer"
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Passed">Passed</option>
                  <option value="Issue">Issue</option>
                </select>
                {item.qualityIssueDescription && (
                  <div style={{ fontSize: 10, color: "#DC2626", marginTop: 2, lineHeight: 1.2 }}>
                    {item.qualityIssueDescription}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Edit Supplier Modal */}
      {showEdit && (
        <EditSupplierModal
          supplier={supplier}
          onClose={() => setShowEdit(false)}
          onSave={onUpdateSupplier}
        />
      )}

      {/* Assign Work Modal */}
      {showAssignModal && (
        <AssignWorkModal
          orders={orders}
          suppliers={[supplier]}
          prefillSupplierId={supplier.id}
          onClose={() => setShowAssignModal(false)}
          onAssign={onAssignWork}
        />
      )}
    </div>
  );
}

export function SupplierPerformancePage({
  orders = [],
  suppliers = INITIAL_SUPPLIERS,
  supplierWork = INITIAL_SUPPLIER_WORK,
  tasks = [],
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAssignWork,
  onUpdateWorkStatus,
  onUpdateWorkQuality,
  onOpenOrder
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  const activeSuppliers = useMemo(() => {
    return suppliers.filter(s => !s.isDeleted);
  }, [suppliers]);

  // Priority sorting: most recent assigned order timestamp DESC
  const sortedSuppliers = useMemo(() => {
    return [...activeSuppliers].sort((a, b) => {
      const metricsA = calculateSupplierMetrics(a, orders, supplierWork);
      const metricsB = calculateSupplierMetrics(b, orders, supplierWork);

      let timeA = 0;
      if (a.latestOrderDate) timeA = new Date(a.latestOrderDate).getTime();
      if (metricsA.matchingItems.length > 0) {
        const itemA = metricsA.matchingItems[0];
        const t = itemA.assignedAt ? new Date(itemA.assignedAt).getTime() : 0;
        if (t > timeA) timeA = t;
      }

      let timeB = 0;
      if (b.latestOrderDate) timeB = new Date(b.latestOrderDate).getTime();
      if (metricsB.matchingItems.length > 0) {
        const itemB = metricsB.matchingItems[0];
        const t = itemB.assignedAt ? new Date(itemB.assignedAt).getTime() : 0;
        if (t > timeB) timeB = t;
      }

      // Suppliers with recent orders appear above suppliers with older or no orders
      if (timeA !== timeB) {
        return timeB - timeA;
      }

      // If neither has orders, sort by createdAt DESC
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdB - createdA;
    });
  }, [activeSuppliers, orders, supplierWork]);

  // Overall aggregate stats
  const overallStats = useMemo(() => {
    let totalJobs = 0;
    let totalOnTime = 0;
    let totalDelayed = 0;
    let totalQualityIssues = 0;

    activeSuppliers.forEach(sup => {
      const m = calculateSupplierMetrics(sup, orders, supplierWork);
      totalJobs += m.jobs;
      totalOnTime += m.onTime;
      totalDelayed += m.delayed;
      totalQualityIssues += m.qualityIssues;
    });

    const avgOnTime = totalJobs > 0 ? Math.round((totalOnTime / totalJobs) * 100) : 100;
    const qualityCompliance = totalJobs > 0 ? Math.round(((totalJobs - totalQualityIssues) / totalJobs) * 100) : 100;

    return {
      activeCount: activeSuppliers.length,
      totalJobs,
      totalOnTime,
      totalDelayed,
      avgOnTime,
      qualityCompliance
    };
  }, [activeSuppliers, orders, supplierWork]);

  const selectedSupplier = useMemo(() => {
    return activeSuppliers.find(s => s.id === selectedSupplierId);
  }, [activeSuppliers, selectedSupplierId]);

  if (selectedSupplier) {
    return (
      <SupplierDetailView
        supplier={selectedSupplier}
        orders={orders}
        supplierWork={supplierWork}
        onBack={() => setSelectedSupplierId(null)}
        onOpenOrder={onOpenOrder}
        onUpdateSupplier={onUpdateSupplier}
        onDeleteSupplier={onDeleteSupplier}
        onAssignWork={onAssignWork}
        onUpdateWorkStatus={onUpdateWorkStatus}
        onUpdateWorkQuality={onUpdateWorkQuality}
      />
    );
  }

  const scoreColor = (pct) => {
    if (pct === null) return "#8A8D98";
    if (pct >= 95) return "#1F9E8D";
    if (pct >= 85) return "#2563EB";
    if (pct >= 70) return "#D97706";
    return "#DC2626";
  };

  return (
    <div>
      {/* Header with Title & Action Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#151B2E", margin: 0 }}>Supplier performance</h1>
          <div style={{ fontSize: 13, color: "#8A8D98", marginTop: 4 }}>
            Vendor management and performance tracking — assign work from existing orders & tasks, track on-time delivery and quality
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
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
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            <Layers size={16} />
            Assign Work
          </button>

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
            Add Supplier
          </button>
        </div>
      </div>

      {/* Top Aggregate Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Active Suppliers</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>{overallStats.activeCount}</div>
          <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>Registered partner vendors</div>
        </Card>

        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Total Supplier Jobs</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#534AB7", marginTop: 4 }}>{overallStats.totalJobs}</div>
          <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2 }}>Work assignments allocated</div>
        </Card>

        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>Avg. On-Time Rate</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor(overallStats.avgOnTime), marginTop: 4 }}>
            {overallStats.avgOnTime}%
          </div>
          <div style={{ fontSize: 11, color: "#166534", marginTop: 2 }}>{overallStats.totalOnTime} on-time of {overallStats.totalJobs}</div>
        </Card>

        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0369A1" }}>Quality Compliance</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#0284C7", marginTop: 4 }}>
            {overallStats.qualityCompliance}%
          </div>
          <div style={{ fontSize: 11, color: "#0369A1", marginTop: 2 }}>Zero quality defect rate</div>
        </Card>
      </div>

      {/* Main Supplier Performance Table */}
      <Card>
        <div style={{ padding: "0 0 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>Suppliers & Vendor Performance</span>
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: "#E1F5EE", color: "#085041", padding: "2px 8px", borderRadius: 999 }}>
              {sortedSuppliers.length} suppliers
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#8A8D98" }}>Sorted by most recently assigned order / work</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr 0.6fr 0.6fr 0.8fr 0.9fr 1.1fr 1.2fr", fontSize: 11.5, color: "#8A8D98", padding: "0 6px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Supplier</div>
          <div>Jobs</div>
          <div>On-time</div>
          <div>Delayed</div>
          <div>Quality Issues</div>
          <div>On-time Rate</div>
          <div>Latest Order</div>
          <div>Orders</div>
        </div>

        {sortedSuppliers.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#8A8D98", fontSize: 13 }}>
            No suppliers registered yet. Click <strong>+ Add Supplier</strong> above to create your first vendor.
          </div>
        ) : (
          sortedSuppliers.map(supplier => {
            const metrics = calculateSupplierMetrics(supplier, orders, supplierWork);
            return (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplierId(supplier.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 0.6fr 0.6fr 0.6fr 0.8fr 0.9fr 1.1fr 1.2fr",
                  alignItems: "center",
                  fontSize: 12.5,
                  padding: "12px 6px",
                  borderBottom: "1px solid #F5F5F7",
                  cursor: "pointer"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#1B2130", display: "flex", alignItems: "center", gap: 6 }}>
                    {supplier.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#8A8D98", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "monospace", color: "#534AB7" }}>{supplier.code}</span>
                    <span>·</span>
                    <span>{supplier.type}</span>
                  </div>
                </div>

                <div style={{ fontWeight: 600, color: "#1B2130" }}>{metrics.jobs}</div>

                <div style={{ color: "#1F9E8D", fontWeight: 700 }}>{metrics.onTime}</div>

                <div style={{ color: metrics.delayed > 0 ? "#DC2626" : "#8A8D98", fontWeight: metrics.delayed > 0 ? 700 : 400 }}>
                  {metrics.delayed}
                </div>

                <div style={{ color: metrics.qualityIssues > 0 ? "#DC2626" : "#8A8D98", fontWeight: metrics.qualityIssues > 0 ? 700 : 400 }}>
                  {metrics.qualityIssues}
                </div>

                <div>
                  {metrics.onTimeRate !== null ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, color: scoreColor(metrics.onTimeRate) }}>{metrics.onTimeRate}%</span>
                      {supplierStatusPill(metrics.status)}
                    </div>
                  ) : (
                    <span style={{ color: "#9CA3AF" }}>—</span>
                  )}
                </div>

                <div>
                  {metrics.latestOrder ? (
                    <div>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenOrder) onOpenOrder(metrics.latestOrder.id);
                        }}
                        style={{ fontFamily: "monospace", fontSize: 11.5, color: "#378ADD", fontWeight: 700, cursor: "pointer" }}
                      >
                        {metrics.latestOrder.id}
                      </span>
                      <div style={{ fontSize: 10.5, color: "#8A8D98" }}>{metrics.latestOrder.ship || "In workflow"}</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>No orders yet</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                  {metrics.associatedOrders.length === 0 ? (
                    <span style={{ fontSize: 11.5, color: "#9CA3AF" }}>No orders yet</span>
                  ) : (
                    <>
                      {metrics.associatedOrders.slice(0, 3).map(o => (
                        <span
                          key={o.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenOrder) onOpenOrder(o.id);
                          }}
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10.5,
                            color: "#378ADD",
                            background: "#F0F7FF",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: "1px solid #D0E1FD",
                            cursor: "pointer"
                          }}
                        >
                          {o.id}
                        </span>
                      ))}
                      {metrics.associatedOrders.length > 3 && (
                        <span style={{ fontSize: 10, color: "#6B7280", background: "#F3F4F6", padding: "2px 5px", borderRadius: 4 }}>
                          +{metrics.associatedOrders.length - 3} more
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <AddSupplierModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddSupplier}
        />
      )}

      {/* Assign Work Modal */}
      {showAssignModal && (
        <AssignWorkModal
          orders={orders}
          tasks={tasks}
          suppliers={activeSuppliers}
          onClose={() => setShowAssignModal(false)}
          onAssign={onAssignWork}
        />
      )}
    </div>
  );
}


export function NotificationsPage({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onOpenOrder,
  onNavigate
}) {
  const [tabFilter, setTabFilter] = useState("all"); // all | unread | order | tna | task | approval | compliance | certification
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead && n.isDeleted !== true).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (n.isDeleted === true) return false;

      // Tab filter
      if (tabFilter === "unread" && n.isRead) return false;
      if (["order", "tna", "task", "approval", "compliance", "certification"].includes(tabFilter) && n.type !== tabFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && n.priority !== priorityFilter) return false;

      // Date filter
      if (dateFilter !== "all") {
        const date = new Date(n.createdAt);
        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);
        if (dateFilter === "today" && diffHours > 24) return false;
        if (dateFilter === "week" && diffHours > 24 * 7) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (n.title || "").toLowerCase().includes(q);
        const msgMatch = (n.message || "").toLowerCase().includes(q);
        const idMatch = (n.relatedId || "").toLowerCase().includes(q);
        if (!titleMatch && !msgMatch && !idMatch) return false;
      }

      return true;
    });
  }, [notifications, tabFilter, priorityFilter, searchQuery, dateFilter]);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead && onMarkAsRead) {
      onMarkAsRead(notif.id);
    }
    if (notif.relatedModule === "orders" || notif.type === "order" || notif.type === "tna") {
      if (notif.relatedId && onOpenOrder) {
        onOpenOrder(notif.relatedId);
      } else if (onNavigate) {
        onNavigate("orders");
      }
    } else if (notif.relatedModule === "tasks" || notif.type === "task") {
      if (onNavigate) onNavigate("tasks");
    } else if (notif.relatedModule === "approvals" || notif.type === "approval") {
      if (onNavigate) onNavigate("approvals");
    } else if (notif.relatedModule === "compliance" || notif.type === "compliance" || notif.type === "certification") {
      if (onNavigate) onNavigate("compliance");
    }
  };

  const getNotificationIcon = (notif) => {
    const priority = notif.priority || "medium";
    const prioColor = NOTIFICATION_PRIORITY_STYLE[priority]?.iconColor || "#3B82F6";
    if (priority === "critical") return <TriangleAlert size={16} color="#DC2626" />;
    if (notif.type === "order") return <Package size={16} color={prioColor} />;
    if (notif.type === "tna") return <Calendar size={16} color={prioColor} />;
    if (notif.type === "task") return <CheckSquare size={16} color={prioColor} />;
    if (notif.type === "approval") return <ClipboardCheck size={16} color={prioColor} />;
    if (notif.type === "certification") return <Award size={16} color={prioColor} />;
    if (notif.type === "compliance") return <ShieldCheck size={16} color={prioColor} />;
    return <Bell size={16} color={prioColor} />;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#151B2E", margin: 0 }}>Notifications</h1>
          <div style={{ fontSize: 13, color: "#8A8D98", marginTop: 4 }}>
            Stay updated on live order delays, T&A stage milestones, assigned tasks, approvals, and buyer compliance deadlines
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {unreadCount > 0 && (
            <button
              onClick={() => onMarkAllAsRead && onMarkAllAsRead()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#F0EFFB",
                color: "#534AB7",
                border: "1px solid #D9D6F5",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <CheckCircle size={14} />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Rail */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { key: "all", label: "All", count: notifications.filter(n => n.isDeleted !== true).length },
          { key: "unread", label: "Unread", count: unreadCount, highlight: unreadCount > 0 },
          { key: "order", label: "Orders", count: notifications.filter(n => n.type === "order" && n.isDeleted !== true).length },
          { key: "tna", label: "T&A", count: notifications.filter(n => n.type === "tna" && n.isDeleted !== true).length },
          { key: "task", label: "My Tasks", count: notifications.filter(n => n.type === "task" && n.isDeleted !== true).length },
          { key: "approval", label: "Approvals", count: notifications.filter(n => n.type === "approval" && n.isDeleted !== true).length },
          { key: "compliance", label: "Compliance", count: notifications.filter(n => n.type === "compliance" && n.isDeleted !== true).length },
          { key: "certification", label: "Certifications", count: notifications.filter(n => n.type === "certification" && n.isDeleted !== true).length },
        ].map(tab => {
          const active = tabFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabFilter(tab.key)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: active ? "1px solid #534AB7" : "1px solid #E5E7EB",
                background: active ? "#534AB7" : "#FFFFFF",
                color: active ? "#FFFFFF" : tab.highlight ? "#DC2626" : "#4B5563",
                fontSize: 12.5,
                fontWeight: active || tab.highlight ? 700 : 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap"
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: active ? "rgba(255,255,255,0.25)" : tab.highlight ? "#FEE2E2" : "#F3F4F6",
                  color: active ? "#FFFFFF" : tab.highlight ? "#991B1B" : "#6B7280"
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Filters Bar */}
      <Card style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search notifications, orders, keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px 6px 30px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                fontSize: 12.5
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: "#6B7280", fontWeight: 600 }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: "#6B7280", fontWeight: 600 }}>Timeframe:</span>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
            >
              <option value="all">All Time</option>
              <option value="today">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>

          {(searchQuery || priorityFilter !== "all" || dateFilter !== "all" || tabFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("all");
                setDateFilter("all");
                setTabFilter("all");
              }}
              style={{ background: "none", border: "none", color: "#534AB7", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Notifications List */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CheckCircle size={22} color="#16A34A" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>No new notifications</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              {searchQuery || priorityFilter !== "all" || dateFilter !== "all" || tabFilter !== "all"
                ? "No notifications matching your filter criteria."
                : "You're all caught up."}
            </div>
          </div>
        ) : (
          filteredNotifications.map((notif, idx) => {
            const prioStyle = NOTIFICATION_PRIORITY_STYLE[notif.priority] || NOTIFICATION_PRIORITY_STYLE.medium;
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif.id || idx}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 20px",
                  borderBottom: idx < filteredNotifications.length - 1 ? "1px solid #F3F4F6" : "none",
                  background: isUnread ? "#FAF8FE" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  position: "relative"
                }}
                onMouseEnter={e => e.currentTarget.style.background = isUnread ? "#F3EFFF" : "#F9FAFB"}
                onMouseLeave={e => e.currentTarget.style.background = isUnread ? "#FAF8FE" : "#FFFFFF"}
              >
                {/* Unread indicator bar */}
                {isUnread && (
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3.5, background: "#534AB7" }} />
                )}

                {/* Icon */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: isUnread ? "#F0EFFB" : "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2
                  }}
                >
                  {getNotificationIcon(notif)}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13.5, fontWeight: isUnread ? 700 : 600, color: "#111827" }}>
                      {notif.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "1.5px 7px",
                        borderRadius: 999,
                        background: prioStyle.bg,
                        color: prioStyle.fg,
                        textTransform: "capitalize"
                      }}
                    >
                      {prioStyle.label}
                    </span>
                    {isUnread && (
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: "#534AB7" }} />
                    )}
                  </div>

                  <div style={{ fontSize: 13, color: isUnread ? "#374151" : "#6B7280", lineHeight: 1.4 }}>
                    {notif.message}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, fontSize: 11.5, color: "#9CA3AF" }}>
                    <span>{formatTimeAgo(notif.createdAt)}</span>
                    <span>·</span>
                    <span style={{ textTransform: "capitalize" }}>{notif.relatedModule || notif.type}</span>
                    {notif.relatedId && (
                      <>
                        <span>·</span>
                        <span style={{ fontFamily: "monospace", color: "#534AB7", fontWeight: 600 }}>{notif.relatedId}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                  {isUnread && (
                    <button
                      onClick={() => onMarkAsRead && onMarkAsRead(notif.id)}
                      title="Mark as read"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#534AB7",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "4px 8px",
                        borderRadius: 6
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F0EFFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteNotification && onDeleteNotification(notif.id)}
                    title="Delete notification"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9CA3AF",
                      cursor: "pointer",
                      padding: 4,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.background = "#FEE2E2"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "none"; }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

export function DebitNotesPage({ orders, notes, onAdd }) {
  const [form, setForm] = useState({ season: SEASON_OPTIONS[0], buyer: "", po: "", amount: "", reason: "", date: "" });
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const total = notes.reduce((a, n) => a + (Number(n.amount) || 0), 0);
  const bySeason = {};
  notes.forEach(n => { bySeason[n.season] = (bySeason[n.season] || 0) + (Number(n.amount) || 0); });

  function submit() {
    if (!form.buyer.trim() || !form.amount) return;
    onAdd({ id: Date.now(), season: form.season, buyer: form.buyer.trim(), po: form.po, amount: Number(form.amount), reason: form.reason.trim() || "—", date: form.date.trim() || "Today" });
    setForm({ season: form.season, buyer: "", po: "", amount: "", reason: "", date: "" });
  }

  return (
    <div>
      <PageHeader title="Debit Notes" sub="Entered by Merchandising each season — buyer deductions and claims against orders" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total debit notes</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>{notes.length}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total value</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#D64545" }}>${total.toLocaleString()}</div></Card>
        <Card style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8D98", marginBottom: 4 }}>By season</div>
          {Object.entries(bySeason).map(([s, v]) => (
            <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span>{s}</span><span style={{ fontWeight: 600 }}>${v.toLocaleString()}</span></div>
          ))}
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Add a debit note" />
        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 1fr 0.8fr 1.4fr 0.8fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Season</label>
            <select value={form.season} onChange={e => set("season", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              {SEASON_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Buyer</label>
            <input value={form.buyer} onChange={e => set("buyer", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>PO (optional)</label>
            <select value={form.po} onChange={e => set("po", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              <option value="">—</option>
              {Array.from(new Map((orders || []).map(o => [o.id, o])).values()).map(o => (
                <option key={o.primaryId || o.id} value={o.id}>{o.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Amount ($)</label>
            <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Reason</label>
            <input value={form.reason} onChange={e => set("reason", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Date</label>
            <input value={form.date} onChange={e => set("date", e.target.value)} placeholder="e.g. 12 Jun" style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <button onClick={submit} style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#D64545", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Add</button>
        </div>
      </Card>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 0.9fr 0.9fr 1.6fr 0.8fr", fontSize: 11, color: "#8A8D98", padding: "0 4px 8px", borderBottom: "1px solid #F0F0F2" }}>
          <div>Season</div><div>Buyer</div><div>PO</div><div>Amount</div><div>Reason</div><div>Date</div>
        </div>
        {notes.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA", padding: "12px 4px" }}>No debit notes recorded yet.</div>
        ) : notes.map(n => (
          <div key={n.id} style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 0.9fr 0.9fr 1.6fr 0.8fr", alignItems: "center", fontSize: 12.5, padding: "10px 4px", borderBottom: "1px solid #F5F5F7" }}>
            <div>{n.season}</div>
            <div style={{ fontWeight: 600, color: "#1B2130" }}>{n.buyer}</div>
            <div style={{ fontFamily: "monospace", fontSize: 11 }}>{n.po || "—"}</div>
            <div style={{ color: "#D64545", fontWeight: 600 }}>${Number(n.amount).toLocaleString()}</div>
            <div style={{ color: "#565A66" }}>{n.reason}</div>
            <div>{n.date}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function CapasPage({ orders, capas, onAdd, onCycleStatus }) {
  const [form, setForm] = useState({ season: SEASON_OPTIONS[0], buyer: "", po: "", issue: "", action: "", date: "" });
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const openCount = capas.filter(c => c.status !== "closed").length;

  function submit() {
    if (!form.buyer.trim() || !form.issue.trim()) return;
    onAdd({ id: Date.now(), season: form.season, buyer: form.buyer.trim(), po: form.po, issue: form.issue.trim(), action: form.action.trim() || "—", status: "open", date: form.date.trim() || "Today" });
    setForm({ season: form.season, buyer: "", po: "", issue: "", action: "", date: "" });
  }

  return (
    <div>
      <PageHeader title="CAPAs Registered" sub="Corrective & Preventive Actions — entered by Merchandising each season, click a status to move it forward" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Total CAPAs</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{capas.length}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Open / in progress</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#E2A83B" }}>{openCount}</div></Card>
        <Card style={{ padding: "16px 18px" }}><div style={{ fontSize: 12, color: "#8A8D98" }}>Closed</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#1F9E8D" }}>{capas.length - openCount}</div></Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Register a CAPA" />
        <div style={{ display: "grid", gridTemplateColumns: "0.7fr 0.9fr 0.8fr 1.4fr 1.4fr 0.7fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Season</label>
            <select value={form.season} onChange={e => set("season", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              {SEASON_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Buyer</label>
            <input value={form.buyer} onChange={e => set("buyer", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>PO (optional)</label>
            <select value={form.po} onChange={e => set("po", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }}>
              <option value="">—</option>
              {Array.from(new Map((orders || []).map(o => [o.id, o])).values()).map(o => (
                <option key={o.primaryId || o.id} value={o.id}>{o.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Issue</label>
            <input value={form.issue} onChange={e => set("issue", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Corrective action</label>
            <input value={form.action} onChange={e => set("action", e.target.value)} style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#8A8D98", display: "block", marginBottom: 4 }}>Date</label>
            <input value={form.date} onChange={e => set("date", e.target.value)} placeholder="e.g. 12 Jun" style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #E7E8ED", fontSize: 12.5 }} />
          </div>
          <button onClick={submit} style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#534AB7", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Register</button>
        </div>
      </Card>

      <Card>
        {capas.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#B0B2BA" }}>No CAPAs registered yet.</div>
        ) : capas.map(c => {
          const st = CAPA_STATUS_STYLE[c.status] || CAPA_STATUS_STYLE.open;
          return (
            <div key={c.id} style={{ padding: "12px 4px", borderBottom: "1px solid #F5F5F7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{c.issue}</div>
                  <div style={{ fontSize: 11.5, color: "#8A8D98", marginTop: 2 }}>{c.season} · {c.buyer}{c.po ? ` · PO #${c.po}` : ""} · {c.date}</div>
                  <div style={{ fontSize: 12, color: "#565A66", marginTop: 4 }}>Action: {c.action}</div>
                </div>
                <span
                  onClick={() => onCycleStatus(c.id)}
                  style={{ cursor: "pointer", background: st.bg, color: st.fg, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}
                >
                  {st.label}
                </span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

export function EmployeePerformancePanel({ orders = [], roster = [], attendance = {}, customTasks = [], leaveRequests = [], users = [], teams = [], complaints = [], onResolveComplaint, isAdmin = false, onNavigate, onBack }) {
  const employeeRows = useMemo(() => {
    const activeOrders = orders.filter(order => order.isDeleted !== true);
    const allStages = activeOrders.flatMap(order => (order.stages || []).map(stage => ({ ...stage, orderId: order.id })));
    const cleanName = value => String(value || "").split("(")[0].trim().toLowerCase();
    const isDone = value => ["done", "completed", "complete", "closed"].includes(String(value || "").toLowerCase());

    const teamMap = new Map((teams || []).map(t => [t.id, t.name]));

    const candidateEmployees = (users && users.length > 0)
      ? users.filter(u => u.active !== false && !u.isMD).map(u => ({
        name: u.name,
        username: u.username,
        dept: teamMap.get(u.teamId) || u.dept || "Merchandising",
        isUser: true,
      }))
      : (roster || []).filter(person => person.name && person.name !== "—");

    return candidateEmployees
      .map(person => {
        const name = cleanName(person.name);
        const username = cleanName(person.username);
        const userDept = cleanName(person.dept);

        const assignedStages = allStages.filter(stage => {
          const assignee = cleanName(stage.assignee);
          const completedBy = cleanName(stage.completedBy || stage.updatedBy);
          const stageDept = cleanName(stage.dept);
          const directMatch = (name && (assignee === name || assignee.includes(name))) ||
            (username && (assignee === username || assignee.includes(username))) ||
            (name && (completedBy === name || completedBy.includes(name))) ||
            (username && (completedBy === username || completedBy.includes(username)));
          if (directMatch) return true;
          return userDept && stageDept && stageDept === userDept;
        });

        const assignedTasks = (customTasks || []).filter(task => {
          const assignee = cleanName(task.assignee);
          const taskDept = cleanName(task.dept);
          const directMatch = (name && (assignee === name || assignee.includes(name))) ||
            (username && (assignee === username || assignee.includes(username)));
          if (directMatch) return true;
          return userDept && taskDept && taskDept === userDept;
        });

        const completedStages = assignedStages.filter(stage => isDone(stage.status)).length;
        const completedTasks = assignedTasks.filter(task => isDone(task.status)).length;
        const workItems = assignedStages.length + assignedTasks.length;
        const completedItems = completedStages + completedTasks;
        const delayedItems = assignedStages.filter(stage => stage.reason || stage.status === "Delayed").length;
        const employeeOrders = new Set(assignedStages.map(stage => stage.orderId));
        const employeeLeave = leaveRequests.filter(leave => cleanName(leave.name) === name || cleanName(leave.username) === username);
        const approvedLeave = employeeLeave.filter(leave => String(leave.status || "").toLowerCase() === "approved").length;
        const openTasks = assignedTasks.filter(task => !isDone(task.status)).length + assignedStages.filter(stage => !isDone(stage.status)).length;

        // Stage completion complaints / false reporting against this user (-10 pts each)
        const userComplaints = (complaints || []).filter(c => {
          const tagged = cleanName(c.taggedUser);
          return (name && (tagged === name || tagged.includes(name))) ||
            (username && (tagged === username || tagged.includes(username)));
        });
        const complaintsCount = userComplaints.length;
        const score = workItems > 0 ? Math.max(0, Math.round((completedItems / workItems) * 100 - delayedItems * 5 - complaintsCount * 10)) : 0;

        return {
          ...person,
          orderCount: employeeOrders.size,
          completed: completedItems,
          delayed: delayedItems,
          taskCount: assignedTasks.length,
          openTasks,
          leaveCount: approvedLeave,
          complaintsCount,
          attendance: attendance[person.name] || "present",
          score,
        };
      })
      .sort((a, b) => b.score - a.score || b.completed - a.completed || b.orderCount - a.orderCount);
  }, [orders, roster, attendance, customTasks, leaveRequests, users, teams, complaints]);

  const totals = employeeRows.reduce((summary, row) => ({
    orders: summary.orders + row.orderCount,
    tasks: summary.tasks + row.taskCount,
    open: summary.open + row.openTasks,
    leave: summary.leave + row.leaveCount,
    complaints: summary.complaints + row.complaintsCount,
  }), { orders: 0, tasks: 0, open: 0, leave: 0, complaints: 0 });

  return (
    <div>
      {onBack && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={onBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer"
            }}
          >
            ← Back to MD Executive Dashboard
          </button>
        </div>
      )}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader
          title="EMPLOYEE PERFORMANCE & WORK BREAKDOWN"
          sub="Order maintenance, daily tasks, attendance, false-stage complaints (-10 pts), and leave tracking"
          action="Open tasks"
          onAction={() => onNavigate && onNavigate("tasks")}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }}>
          {[
            ["Employees tracked", employeeRows.length, "#378ADD"],
            ["Orders maintained", totals.orders, "#1F9E8D"],
            ["Daily tasks", totals.tasks, "#7F77DD"],
            ["Open work items", totals.open, "#D64545"],
            ["Stage disputes / complaints", totals.complaints, "#DC2626"],
          ].map(([label, value, color]) => (
            <div key={label} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10.5, color: "#64748B" }}>{label}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 860, display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.7fr 0.7fr 0.9fr 0.7fr 0.7fr 0.9fr 0.7fr", fontSize: 10.5, color: "#64748B", fontWeight: 700, padding: "0 0 7px", borderBottom: "1px solid #F1F5F9" }}>
            <div>EMPLOYEE</div><div>DEPARTMENT</div><div>ORDERS</div><div>DONE</div><div>DAILY TASKS</div><div>DELAYED</div><div>LEAVE</div><div>COMPLAINTS</div><div>PERFORMANCE</div>
          </div>
          <div style={{ minWidth: 860, maxHeight: 300, overflowY: "auto" }}>
            {employeeRows.length === 0 ? (
              <div style={{ padding: "24px 0", color: "#94A3B8", fontSize: 12 }}>No employee records available.</div>
            ) : employeeRows.map(employee => (
              <div key={employee.name} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.7fr 0.7fr 0.9fr 0.7fr 0.7fr 0.9fr 0.7fr", alignItems: "center", fontSize: 11.5, padding: "9px 0", borderBottom: "1px solid #F8FAFC" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1E293B" }}>{employee.name}</div>
                  <div style={{ fontSize: 10, color: employee.attendance === "present" ? "#059669" : "#DC2626", marginTop: 2 }}>{employee.attendance === "present" ? "Present" : employee.attendance}</div>
                </div>
                <div style={{ color: "#64748B" }}>{employee.dept || "—"}</div>
                <div style={{ color: "#1E293B", fontWeight: 600 }}>{employee.orderCount}</div>
                <div style={{ color: "#059669", fontWeight: 700 }}>{employee.completed}</div>
                <div style={{ color: "#1E293B" }}>{employee.taskCount} <span style={{ color: "#94A3B8" }}>({employee.openTasks} open)</span></div>
                <div style={{ color: employee.delayed > 0 ? "#DC2626" : "#059669", fontWeight: 700 }}>{employee.delayed}</div>
                <div style={{ color: "#7C3AED", fontWeight: 600 }}>{employee.leaveCount}</div>
                <div>
                  {employee.complaintsCount > 0 ? (
                    <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 999, background: "#FEE2E2", color: "#B91C1C", fontWeight: 700, fontSize: 11 }}>
                      {employee.complaintsCount} (-{employee.complaintsCount * 10} pts)
                    </span>
                  ) : (
                    <span style={{ color: "#94A3B8" }}>0</span>
                  )}
                </div>
                <div style={{ color: employee.score >= 75 ? "#059669" : employee.score >= 50 ? "#D97706" : "#DC2626", fontWeight: 800 }}>{employee.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Stage Disputes & False Completion Complaints Card */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader
          title="STAGE DISPUTES & FALSE COMPLETION COMPLAINTS"
          sub="Complaints filed by downstream stage owners against false stage completions (-10 points per complaint)"
        />
        {complaints.length === 0 ? (
          <div style={{ padding: "24px 0", color: "#94A3B8", fontSize: 12, textAlign: "center" }}>
            No stage completion disputes reported. All stages completed cleanly.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>ORDER / STYLE</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>STAGE & DEPT</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>REPORTED BY</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>TAGGED USER (PENALTY)</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>REASON / REMARK</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>DATE</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>STATUS</th>
                  {onResolveComplaint && <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569", textAlign: "right" }}>ACTION</th>}
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => {
                  const isResolved = c.status === "Resolved";
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "9px 10px", fontWeight: 600, color: "#0F172A" }}>
                        <div>{c.orderId}</div>
                        <div style={{ fontSize: 10.5, color: "#64748B" }}>{c.orderStyle || "—"}</div>
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <div style={{ fontWeight: 600, color: "#1E293B" }}>{c.stageName}</div>
                        <div style={{ fontSize: 10.5, color: "#64748B" }}>{c.stageDept}</div>
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{ fontWeight: 600, color: "#3B82F6" }}>@{c.reportedBy}</span>
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700, color: "#DC2626" }}>@{c.taggedUser}</span>
                          <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "1px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 800 }}>-10 pts</span>
                        </div>
                      </td>
                      <td style={{ padding: "9px 10px", color: "#334155", maxWidth: 280, wordBreak: "break-word" }}>
                        {c.reason}
                      </td>
                      <td style={{ padding: "9px 10px", color: "#64748B", fontSize: 11 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: isResolved ? "#DCFCE7" : "#FEF3C7",
                          color: isResolved ? "#166534" : "#92400E"
                        }}>
                          {c.status || "Under Review"}
                        </span>
                      </td>
                      {onResolveComplaint && (
                        <td style={{ padding: "9px 10px", textAlign: "right" }}>
                          {!isResolved ? (
                            <button
                              onClick={() => onResolveComplaint(c.id, "Resolved")}
                              style={{
                                background: "#10B981",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: 5,
                                padding: "4px 8px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              Resolve
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>Resolved</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function ExecutiveOverviewPage({ orders, attendance, financials, roster, customTasks = [], leaveRequests = [], users = [], teams = [], complaints = [], onResolveComplaint, isAdmin = false, onOpenOrder, onNavigate, onApproveCosting, onRejectCosting, onRefresh, isRefreshing = false, lastRefreshedAt = null, onOpenDept }) {
  // Only consider active, non-deleted orders for MD Executive Dashboard metrics
  const activeOrders = useMemo(() => (orders || []).filter(o => o.isDeleted !== true && o.completed !== true), [orders]);
  const allStages = useMemo(() => activeOrders.flatMap(o => (o.stages || []).map(s => ({ ...s, orderId: o.id, style: o.style, buyer: o.buyer }))), [activeOrders]);
  const totalOrders = activeOrders.length;
  const totalQty = activeOrders.reduce((a, o) => a + (Number(o.qty) || 0), 0);

  // 1. Order Health Calculation
  const health = activeOrders.map(o => {
    const flags = (o.stages || []).filter(s => s.reason).length;
    let score = 100 - flags * 15 - (o.status === "Delayed" ? 20 : 0);
    score = Math.max(0, Math.min(100, score));
    return { order: o, score };
  });

  const healthBuckets = [
    { name: "Healthy (80-100)", color: "#1F9E8D", value: health.filter(h => h.score >= 80).length },
    { name: "At Risk (60-79)", color: "#E2A83B", value: health.filter(h => h.score >= 60 && h.score < 80).length },
    { name: "Critical (40-59)", color: "#D85A30", value: health.filter(h => h.score >= 40 && h.score < 60).length },
    { name: "Severe (0-39)", color: "#D64545", value: health.filter(h => h.score < 40).length },
  ].filter(b => b.value > 0);

  const overallHealth = Math.round(health.reduce((a, h) => a + h.score, 0) / (health.length || 1));
  const onTrackCount = activeOrders.filter(o => o.status === "On Track").length;
  const onTimePct = Math.round((onTrackCount / (totalOrders || 1)) * 100);

  // Shipped PCS: only count orders where all stages are 100% completed/done
  const completedOrdersList = (orders || []).filter(o => {
    if (o.isDeleted) return false;
    const stages = o.stages || [];
    if (stages.length === 0) return false;
    return stages.every(s => s.status === "done" || s.status === "completed");
  });
  const shippedPcs = completedOrdersList.reduce((sum, o) => sum + (Number(o.qty) || 0), 0);

  // Dynamic 6-month Shipment Performance Trend computed directly from active orders
  const shipmentTrendData = useMemo(() => computeMonthlyShipmentPerformance(activeOrders), [activeOrders]);

  // Calculate financial overview metrics from orders & finances:
  // 1) Order Value: Total value across orders from scanned PO Sheet / FOB / costing / order revenue
  const totalCalculatedOrderValue = useMemo(() => {
    let sum = 0;
    activeOrders.forEach(o => {
      const qty = Number(o.qty) || Number(o.preProd?.poSheet?.values?.poQty) || 0;

      // 1. First priority: Uploaded / Scanned PO Sheet values
      const poSheetValues = o.preProd?.poSheet?.values || {};
      if (poSheetValues.orderValue && Number(poSheetValues.orderValue) > 0) {
        sum += Number(poSheetValues.orderValue);
        return;
      }
      if (poSheetValues.fobPrice && Number(poSheetValues.fobPrice) > 0) {
        sum += Number(poSheetValues.fobPrice) * (Number(poSheetValues.poQty) || qty || 1);
        return;
      }

      // 2. Direct order FOB or orderValue fields
      if (o.orderValue && Number(o.orderValue) > 0) {
        sum += Number(o.orderValue);
        return;
      }
      if (o.fobPrice || o.fob || o.fobRate) {
        sum += (Number(o.fobPrice || o.fob || o.fobRate) || 0) * (qty || 1);
        return;
      }

      // 3. Approved Costing / Costing Rows
      if (o.costingApproval?.grandTotal) {
        sum += Number(o.costingApproval.grandTotal) * (qty || 1);
        return;
      }
      if (Array.isArray(o.costingRows) && o.costingRows.length > 0) {
        const perPc = o.costingRows.reduce((acc, r) => acc + (r.isHeader ? 0 : (Number(r.price) || 0) * (Number(r.qty) || 0)), 0);
        if (perPc > 0) {
          sum += perPc * (qty || 1);
          return;
        }
      }
    });
    return sum > 0 ? sum : (financials?.revenue || 0);
  }, [activeOrders, financials?.revenue]);

  // 2) Planned Cost & 3) Actual Cost from all active orders
  const financialTotals = useMemo(() => {
    const planned = activeOrders.reduce((sum, o) => sum + (Number(o.plannedCost) || 0), 0);
    const actual = activeOrders.reduce((sum, o) => sum + (Number(o.actualCost) || 0), 0);
    return {
      plannedCost: planned > 0 ? planned : (financials?.cogs || 0),
      actualCost: actual > 0 ? actual : (financials?.cogs || 0),
    };
  }, [activeOrders, financials?.cogs]);

  // 4) Profit: Difference between Order Value and Actual Cost (or Planned Cost if actual is 0)
  const overallProfitVal = totalCalculatedOrderValue - financialTotals.actualCost;

  // 5) & 6) Variances across categories:
  // Overall Variance Raw Material: Fabric / Raw Material + Trims & Accessories
  // Overall Variance in Development: Production / CMT + VAP + Logistics + Other / Overheads & Margin
  const varianceAggregates = useMemo(() => {
    let rawMaterialVariance = 0;
    let devVariance = 0;

    activeOrders.forEach(o => {
      const breakdown = computeOrderVarianceBreakdown(o);
      (breakdown.categories || []).forEach(cat => {
        if (cat.key === "fabric" || cat.key === "trims") {
          rawMaterialVariance += (cat.variance || 0);
        } else {
          devVariance += (cat.variance || 0);
        }
      });
    });

    return { rawMaterialVariance, devVariance };
  }, [activeOrders]);

  const grossProfit = (financials?.revenue || 0) - (financials?.cogs || 0);
  const grossMargin = financials?.revenue > 0 ? Math.round((grossProfit / financials.revenue) * 1000) / 10 : 0;

  // 2. Delay reasons
  const reasonCounts = {};
  allStages.forEach(s => { if (s.reason) reasonCounts[s.reason] = (reasonCounts[s.reason] || 0) + 1; });
  const reasonArr = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const reasonTotal = reasonArr.reduce((a, [, c]) => a + c, 0) || 1;

  // 3. Order & Production Performance
  const inProduction = allStages.filter(s => ["Cutting", "Production"].includes(s.dept) && s.status === "in_progress").length;
  const ordersAtRisk = activeOrders.filter(o => o.status === "At Risk").length;
  const ordersDelayed = activeOrders.filter(o => o.status === "Delayed").length;
  const ordersCompleted = activeOrders.filter(o => o.status === "On Track" && o.stages && o.stages.every(s => s.status === "done")).length;
  const presentCount = roster.filter(s => (attendance[s.name] || "present") === "present").length;
  const capacityUtilization = Math.round((presentCount / (roster.length || 1)) * 100);

  // 4. Department Performance
  const depts = ["Merchandising", "Program", "Planning", "Purchase – Fabric", "Purchase – Trims", "Quality", "Cutting", "Production", "Finishing", "Logistics & Documentation"];
  const deptStats = depts.map(d => {
    const dStages = allStages.filter(s => s.dept === d);
    const total = dStages.length;
    const completed = dStages.filter(s => s.status === "done").length;
    const delayed = dStages.filter(s => s.reason).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { name: d, total, completed, delayed, rate };
  });

  // 5. Demographics & Risk
  const buyerCounts = {};
  activeOrders.forEach(o => { if (o.buyer) buyerCounts[o.buyer] = (buyerCounts[o.buyer] || 0) + 1; });
  const buyerColors = ["#7F77DD", "#378ADD", "#1F9E8D", "#E2A83B", "#D64545", "#8A8D98"];
  const buyerData = Object.entries(buyerCounts).map(([name, value], i) => ({ name, value, color: buyerColors[i % buyerColors.length] }));

  const countryCounts = {};
  activeOrders.forEach(o => { if (o.country) countryCounts[o.country] = (countryCounts[o.country] || 0) + 1; });
  const countryArr = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
  const countryMax = Math.max(...countryArr.map(c => c[1]), 1);

  const riskCounts = {
    high: activeOrders.filter(o => o.risk === "high").length,
    medium: activeOrders.filter(o => o.risk === "medium").length,
    low: activeOrders.filter(o => o.risk === "low").length
  };
  const riskData = [
    { name: "High risk", value: riskCounts.high, color: "#D64545" },
    { name: "Medium risk", value: riskCounts.medium, color: "#E2A83B" },
    { name: "Low risk", value: riskCounts.low, color: "#1F9E8D" },
  ].filter(r => r.value > 0);

  // 6. Top 5 Performing Employees (Overall Performance with Work Breakdown)
  const [selectedPerformer, setSelectedPerformer] = useState(null);

  const topPerformers = useMemo(() => {
    const activeOrders = orders.filter(order => order.isDeleted !== true);
    const activeStages = activeOrders.flatMap(order => (order.stages || []).map(stage => ({ ...stage, orderId: order.id, style: order.style, buyer: order.buyer })));
    const cleanName = value => String(value || "").split("(")[0].trim().toLowerCase();
    const isDone = value => ["done", "completed", "complete", "closed"].includes(String(value || "").toLowerCase());

    const teamMap = new Map((teams || []).map(t => [t.id, t.name]));

    const candidateEmployees = (users && users.length > 0)
      ? users.filter(u => u.active !== false && !u.isMD).map(u => ({
        name: u.name,
        username: u.username,
        dept: teamMap.get(u.teamId) || u.dept || "Merchandising",
        isUser: true,
      }))
      : (roster || []).filter(person => person.name && person.name !== "—");

    return candidateEmployees
      .map(person => {
        const name = cleanName(person.name);
        const username = cleanName(person.username);
        const userDept = cleanName(person.dept);

        const assignedStages = activeStages.filter(stage => {
          const assignee = cleanName(stage.assignee);
          const completedBy = cleanName(stage.completedBy || stage.updatedBy);
          const stageDept = cleanName(stage.dept);
          const directMatch = (name && (assignee === name || assignee.includes(name))) ||
            (username && (assignee === username || assignee.includes(username))) ||
            (name && (completedBy === name || completedBy.includes(name))) ||
            (username && (completedBy === username || completedBy.includes(username)));
          if (directMatch) return true;
          return userDept && stageDept && stageDept === userDept;
        });

        const assignedTasks = (customTasks || []).filter(task => {
          const assignee = cleanName(task.assignee);
          const taskDept = cleanName(task.dept);
          const directMatch = (name && (assignee === name || assignee.includes(name))) ||
            (username && (assignee === username || assignee.includes(username)));
          if (directMatch) return true;
          return userDept && taskDept && taskDept === userDept;
        });

        const completedStages = assignedStages.filter(stage => isDone(stage.status));
        const completedTasks = assignedTasks.filter(task => isDone(task.status));
        const workItems = assignedStages.length + assignedTasks.length;
        const completedItems = completedStages.length + completedTasks.length;
        const delayedStages = assignedStages.filter(stage => stage.reason || stage.status === "Delayed");
        const onTimeStages = completedStages.filter(stage => !stage.reason);
        const employeeOrders = Array.from(new Set(assignedStages.map(stage => stage.orderId)));

        // Stage disputes / complaints against this user (-10 pts each)
        const userComplaints = (complaints || []).filter(c => {
          const tagged = cleanName(c.taggedUser);
          return (name && (tagged === name || tagged.includes(name))) ||
            (username && (tagged === username || tagged.includes(username)));
        });
        const complaintsCount = userComplaints.length;
        const score = workItems > 0 ? Math.max(0, Math.round((completedItems / workItems) * 100 - delayedStages.length * 5 - complaintsCount * 10)) : 0;
        const onTimeRate = completedStages.length > 0 ? Math.round((onTimeStages.length / completedStages.length) * 100) : 100;
        const mistakeFreeRate = workItems > 0 ? Math.round(((workItems - delayedStages.length) / workItems) * 100) : 100;

        return {
          ...person,
          orderCount: employeeOrders.length,
          orderIds: employeeOrders,
          completed: completedItems,
          totalWork: workItems,
          delayed: delayedStages.length,
          delayedStages,
          completedStages,
          completedTasks,
          onTimeRate,
          mistakeFreeRate,
          complaintsCount,
          attendance: attendance[person.name] || "present",
          score,
        };
      })
      .sort((a, b) => b.score - a.score || b.completed - a.completed || b.orderCount - a.orderCount)
      .slice(0, 5);
  }, [orders, roster, attendance, customTasks, users, teams, complaints]);

  const openTasksRows = allStages.filter(s => s.status !== "done");
  const overdueRows = allStages.filter(s => s.status === "in_progress" && s.reason);
  const pendingApprovals = allStages.filter(s => s.name.toLowerCase().includes("approval") && s.status !== "done");
  const openPOStages = allStages.filter(s => (s.name === "Fabric Booking" || s.name === "Trim Booking") && s.status !== "done");
  const latePOStages = openPOStages.filter(s => s.reason);

  const formatInr = (amount) => {
    const val = Number(amount) || 0;
    if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
    if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const kpis = [
    { label: "Total Orders", value: totalOrders, sub: `${totalQty.toLocaleString()} pcs`, icon: ClipboardList, color: "#378ADD" },
    { label: "Total Value (INR)", value: formatInr(financials?.revenue || 0), icon: Landmark, color: "#1F9E8D" },
    { label: "On-Time Shipment %", value: `${onTimePct}%`, icon: Clock, color: "#378ADD" },
    { label: "Total Shipped (PCS)", value: shippedPcs.toLocaleString(), icon: Truck, color: "#7F77DD" },
    { label: "Overall Order Health", value: `${overallHealth} /100`, icon: Gauge, color: "#E2A83B" },
    // { label: "Gross Margin", value: `${grossMargin}%`, icon: TrendingUp, color: "#E2A83B" },
  ];

  return (
    <div style={{ padding: "0 0 40px 0" }}>
      {/* Title & Screen Refresh Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0 }}>MD Executive Dashboard</h1>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 3 }}>Real-time overview of entire organization performance</div>
        </div>

        {/* Right side top - Screen Refresh Button & Live Sync status (positioned right above Gross Margin widget) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Live Auto-Refresh 5 min status badge */}
          <div
            title="Dashboard auto-refreshes automatically every 5 minutes with live changes"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 20,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              fontSize: 11.5,
              fontWeight: 600,
              color: "#166534"
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22C55E",
                boxShadow: "0 0 6px #22C55E",
                display: "inline-block"
              }}
            />
            <span>Auto Sync: 5m</span>
            <span style={{ color: "#86EFAC", margin: "0 1px" }}>•</span>
            <span style={{ color: "#15803D", fontWeight: 500 }}>
              {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live"}
            </span>
          </div>

          {/* Screen Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Click to refresh entire MD Dashboard immediately"
            style={{
              cursor: isRefreshing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 8,
              background: isRefreshing ? "#E2E8F0" : "#534AB7",
              border: "none",
              color: isRefreshing ? "#64748B" : "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 700,
              boxShadow: isRefreshing ? "none" : "0 2px 8px rgba(83, 74, 183, 0.28)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => { if (!isRefreshing) e.currentTarget.style.background = "#4338CA"; }}
            onMouseLeave={e => { if (!isRefreshing) e.currentTarget.style.background = "#534AB7"; }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
                transition: "transform 0.2s ease"
              }}
            />
            <span>{isRefreshing ? "Refreshing Dashboard..." : "Screen Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Top 6 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        {kpis.map(k => (
          <Card key={k.label} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: k.color + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={13} color={k.color} />
              </div>
              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{k.label}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{k.sub}</div>}
          </Card>
        ))}
     
      </div>
         <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12,marginBottom:10 }}>
          {[
            ["Open Tasks", openTasksRows.length, "#378ADD"],
            ["Overdue Tasks", overdueRows.length, "#EF4444"],
            ["Pending Approvals", pendingApprovals.length, "#F59E0B"],
            // ["Open POs", openPOStages.length, "#378ADD"],
            // ["Late POs", latePOStages.length, "#EF4444"],
          ].map(([label, val, color]) => (
            <Card key={label} style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
            </Card>
          ))}
        </div>

      {/* Row 2: Order Health Distribution, Shipment Performance Trend, Top Delay Reasons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.95fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* Order Health Distribution */}
        {/* <Card>
          <CardHeader title="ORDER HEALTH DISTRIBUTION" />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <MiniDonut data={healthBuckets} size={104} centerLabel={totalOrders} centerSub="Orders" labelColor="#0F172A" />
            <div style={{ flex: 1 }}>
              {healthBuckets.map(b => (
                <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: b.color }} />
                  <span style={{ color: "#475569", flex: 1 }}>{b.name}</span>
                  <span style={{ color: "#0F172A", fontWeight: 700 }}>{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card> */}
           <Card>
          <CardHeader title="ORDERS BY BUYER" />
          {buyerData.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "20px 0" }}>No buyers recorded.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <MiniDonut data={buyerData} size={84} centerLabel={totalOrders} labelColor="#0F172A" />
              <div style={{ flex: 1 }}>
                {buyerData.map(b => (
                  <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontSize: 11 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: b.color }} />
                    <span style={{ color: "#475569", flex: 1 }}>{b.name}</span>
                    <span style={{ color: "#0F172A", fontWeight: 700 }}>{b.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Orders by Country */}
        <Card>
          <CardHeader title="ORDERS BY COUNTRY" />
          {countryArr.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "20px 0" }}>No country data.</div>
          ) : (
            countryArr.map(([country, count]) => (
              <div key={country} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, fontSize: 11 }}>
                <Globe size={11} color="#64748B" style={{ flexShrink: 0 }} />
                <span style={{ color: "#475569", width: 70, flexShrink: 0 }}>{country}</span>
                <div style={{ flex: 1, height: 5, background: "#F1F5F9", borderRadius: 999 }}>
                  <div style={{ height: 5, width: `${(count / countryMax) * 100}%`, background: "#378ADD", borderRadius: 999 }} />
                </div>
                <span style={{ color: "#0F172A", fontWeight: 700 }}>{count}</span>
              </div>
            ))
          )}
        </Card>

        {/* Shipment Performance Trend */}
        <Card>
          <CardHeader
            title="SHIPMENT PERFORMANCE TREND"
            sub={shipmentTrendData.rangeLabel ? `${shipmentTrendData.rangeLabel} (Based on Orders)` : "Last 6 months"}
          />
          <div style={{ width: "100%", height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shipmentTrendData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pt = payload[0]?.payload;
                    if (!pt) return null;
                    return (
                      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 11.5 }}>
                        <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{pt.fullLabel || label}</div>
                        {pt.totalOrders > 0 ? (
                          <>
                            <div style={{ color: "#4F46E5", fontWeight: 700 }}>
                              On-time: <span style={{ fontSize: 13 }}>{pt.onTime !== null ? `${pt.onTime}%` : "—"}</span>
                            </div>
                            <div style={{ color: "#475569", marginTop: 2 }}>
                              Orders: {pt.onTimeOrders} on-track / {pt.totalOrders} total {pt.delayedOrders > 0 ? `(${pt.delayedOrders} delayed)` : ""}
                            </div>
                          </>
                        ) : (
                          <div style={{ color: "#94A3B8" }}>No active order activity</div>
                        )}
                        <div style={{ color: "#64748B", marginTop: 4, fontSize: 10.5, borderTop: "1px dashed #E2E8F0", paddingTop: 4 }}>
                          🎯 Target Benchmark: <b>{pt.target}%</b> (Industry KPI Goal)
                        </div>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="onTime" name="Actual On-time %" stroke="#4F46E5" strokeWidth={2.2} dot={{ r: 3, fill: "#4F46E5" }} connectNulls={true} />
                <Line type="monotone" dataKey="target" name="Target Goal % (75% Benchmark)" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Delay Reasons */}
        <Card>
          <CardHeader title="TOP DELAY REASONS" sub="All orders" />
          {reasonArr.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94A3B8" }}>No delays flagged.</div>
          ) : reasonArr.map(([reason, count]) => (
            <div key={reason} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                <span style={{ color: "#334155", fontWeight: 500 }}>{reason}</span>
                <span style={{ color: "#64748B" }}>{Math.round(count / reasonTotal * 100)}%</span>
              </div>
              <div style={{ height: 6, background: "#F1F5F9", borderRadius: 999 }}>
                <div style={{ height: 6, width: `${count / reasonTotal * 100}%`, background: "#EF4444", borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Row: Pending Costing Approvals (MD Sign-off) */}
      {(() => {
        const costingPending = activeOrders.filter(o => o.costingApproval && o.costingApproval.status === "submitted");
        if (costingPending.length === 0) return null;
        return (
          <Card style={{ marginBottom: 16, borderLeft: "4px solid #F59E0B", background: "#FFFDF7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚠️ Costing Approval Sign-off Requests ({costingPending.length})</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#78350F", marginTop: 2 }}>
                  Merchandisers have submitted order costings for DGM / Managing Director sign-off.
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate("approvals")}
                style={{ background: "#F59E0B", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                Go to Approvals →
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
              {costingPending.map(o => (
                <div key={o.id} style={{ background: "#FFFFFF", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: "#1E293B" }}>
                      PO #{o.id} — {o.style}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      Buyer: {o.buyer} · Rate: <b>₹{(o.costingApproval?.grandTotal || 0).toLocaleString()}</b> / pc
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => onOpenOrder && onOpenOrder(o.id)}
                      style={{ background: "#F1F5F9", color: "#334155", border: "none", borderRadius: 6, padding: "5px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      View Sheet
                    </button>
                    {onApproveCosting && (
                      <button
                        onClick={() => onApproveCosting(o.id, "Managing Director (MD)")}
                        style={{ background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 2px rgba(16, 185, 129, 0.2)" }}
                      >
                        ✓ Pass
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* Row 3: Order & Production Performance + Department Performance (substituting Critical Alerts) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.3fr", gap: 12, marginBottom: 16 }}>
        {/* Order & Production Performance */}
        <Card>
          <CardHeader title="ORDER & PRODUCTION PERFORMANCE" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              ["Orders in Production", inProduction, "#4F46E5"],
              // ["Capacity Utilization", `${capacityUtilization}%`, "#0284C7"],
              ["Orders Completed", ordersCompleted, "#10B981"],
              ["Orders At Risk", ordersAtRisk, "#F59E0B"],
              ["Orders Delayed", ordersDelayed, "#EF4444"],
              ["Compliance Score", `${financials?.complianceScore || 96}%`, "#10B981"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Department Performance (substituting Critical Alerts box per user request) */}
        <Card>
          <CardHeader title="DEPARTMENT PERFORMANCE" sub="Stage completion & delay tracking per division" />
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1.2fr 1fr", fontSize: 10.5, color: "#64748B", fontWeight: 700, paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
            <div>DEPARTMENT</div>
            <div style={{ textAlign: "center" }}>STAGES</div>
            <div>ON-TIME RATE</div>
            <div style={{ textAlign: "right" }}>DELAYS</div>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {deptStats.map(d => (
              <div
                key={d.name}
                onClick={() => {
                  if (onOpenDept) {
                    onOpenDept(d.name);
                  } else if (onNavigate) {
                    onNavigate("departmentDetail");
                  }
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1fr 1.2fr 1fr",
                  alignItems: "center",
                  fontSize: 11.5,
                  padding: "7px 6px",
                  borderBottom: "1px solid #F8FAFC",
                  cursor: "pointer",
                  borderRadius: 6,
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                title={`Click to open ${d.name} department page`}
              >
                <div style={{ fontWeight: 600, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{d.name}</span>
                  <span style={{ fontSize: 11, color: "#6366F1", fontWeight: 700 }}>→</span>
                </div>
                <div style={{ textAlign: "center", color: "#64748B", fontSize: 11 }}>
                  {d.completed} / {d.total}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 5, background: "#E2E8F0", borderRadius: 999 }}>
                    <div style={{ height: 5, width: `${d.rate}%`, background: d.rate >= 75 ? "#10B981" : d.rate >= 50 ? "#F59E0B" : "#EF4444", borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0F172A", width: 26, textAlign: "right" }}>{d.rate}%</span>
                </div>
                <div style={{ textAlign: "right", fontWeight: 700, color: d.delayed > 0 ? "#DC2626" : "#10B981" }}>
                  {d.delayed > 0 ? `${d.delayed} delayed` : "0"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 4: Orders by Buyer, Orders by Country, Quality Overview, Predicted Shipment Risk */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* Orders by Buyer */}
        {/* Quality Overview */}
        {/* <Card>
          <CardHeader title="QUALITY OVERVIEW" />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <MiniDonut data={totalOrders > 0 ? [{ name: "Pass", value: 100, color: "#10B981" }] : [{ name: "None", value: 100, color: "#E2E8F0" }]} size={80} centerLabel={totalOrders > 0 ? "100%" : "—"} centerSub="Pass rate" labelColor="#0F172A" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B" }}>
            <span>Defect rate <b style={{ color: "#0F172A" }}>{totalOrders > 0 ? "0.0%" : "—"}</b></span>
            <span>Rework <b style={{ color: "#0F172A" }}>{totalOrders > 0 ? "0.0%" : "—"}</b></span>
          </div>
        </Card> */}

        {/* Predicted Shipment Risk */}
        {/* <Card>
          <CardHeader title="PREDICTED SHIPMENT RISK" sub="Next 30 days" />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MiniDonut data={riskData} size={80} centerLabel={totalOrders} labelColor="#0F172A" />
            <div style={{ flex: 1 }}>
              {riskData.map(r => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, fontSize: 10.5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: r.color }} />
                  <span style={{ color: "#475569", flex: 1 }}>{r.name}</span>
                  <span style={{ color: "#0F172A", fontWeight: 700 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card> */}
      </div>

      {/* Row 5: Financial Overview + Activity Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* Financial Overview */}
        <Card>
          <CardHeader title="FINANCIAL OVERVIEW" sub="YTD (INR) — entered by Finance team" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              ["Order Value", formatInr(totalCalculatedOrderValue), "#0F172A"],
              ["Planned Cost", formatInr(financialTotals.plannedCost), "#0F172A"],
              ["Actual Cost", formatInr(financialTotals.actualCost), "#0F172A"],
              ["Profit", formatInr(overallProfitVal), overallProfitVal >= 0 ? "#10B981" : "#EF4444"],
              [
                "Overall Variance Raw Material",
                `${varianceAggregates.rawMaterialVariance > 0 ? "+" : varianceAggregates.rawMaterialVariance < 0 ? "-" : ""}${formatInr(Math.abs(varianceAggregates.rawMaterialVariance))}`,
                varianceAggregates.rawMaterialVariance > 0 ? "#DC2626" : varianceAggregates.rawMaterialVariance < 0 ? "#059669" : "#0F172A"
              ],
              [
                "Overall Variance in Development",
                `${varianceAggregates.devVariance > 0 ? "+" : varianceAggregates.devVariance < 0 ? "-" : ""}${formatInr(Math.abs(varianceAggregates.devVariance))}`,
                varianceAggregates.devVariance > 0 ? "#DC2626" : varianceAggregates.devVariance < 0 ? "#059669" : "#0F172A"
              ],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10.5, color: "#64748B", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top 5 Performing Employees (Clickable with Detailed Work Breakdown Modal) */}
        <Card>
          <CardHeader
            title="TOP PERFORMING EMPLOYEES"
            sub="Overall top 5 performers based on efficiency & delivery"
            action="View all details"
            onAction={() => onNavigate && onNavigate("employeePerformance")}
          />
          {topPerformers.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94A3B8", padding: "18px 0", textAlign: "center" }}>
              No employee performance data recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topPerformers.map((emp, idx) => {
                const rankColors = ["#F59E0B", "#94A3B8", "#B45309", "#3B82F6", "#6366F1"];
                const rankColor = rankColors[idx] || "#64748B";
                const isPresent = (attendance[emp.name] || "present") === "present";

                return (
                  <div
                    key={emp.name || idx}
                    onClick={() => setSelectedPerformer(emp)}
                    title={`Click to view ${emp.name}'s detailed performance & completed works`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: idx === 0 ? "#F0FDF4" : "#F8FAFC",
                      border: `1px solid ${idx === 0 ? "#BBF7D0" : "#E2E8F0"}`,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.06)";
                      e.currentTarget.style.background = idx === 0 ? "#DCFCE7" : "#F1F5F9";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.background = idx === 0 ? "#F0FDF4" : "#F8FAFC";
                    }}
                  >
                    {/* Rank & Profile */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                      {/* Rank Number / Badge */}
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: rankColor + "22",
                          color: rankColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        #{idx + 1}
                      </div>

                      {/* Employee Details */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {emp.name}
                          </span>
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: isPresent ? "#10B981" : "#EF4444",
                              display: "inline-block",
                              flexShrink: 0
                            }}
                            title={isPresent ? "Present Today" : "Absent / On Leave"}
                          />
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span>{emp.dept || "Merchandising"}</span>
                          <span>•</span>
                          <span style={{ color: "#059669", fontWeight: 600 }}>{emp.completed || 0} completed</span>
                          <span>•</span>
                          <span style={{ color: emp.onTimeRate >= 90 ? "#16A34A" : "#D97706", fontWeight: 600 }}>{emp.onTimeRate}% on-time</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Score Pill & View tag */}
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                      <div
                        style={{
                          display: "inline-block",
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: emp.score >= 80 ? "#DCFCE7" : emp.score >= 60 ? "#FEF3C7" : "#FEE2E2",
                          color: emp.score >= 80 ? "#15803D" : emp.score >= 60 ? "#B45309" : "#B91C1C",
                          fontSize: 12,
                          fontWeight: 800
                        }}
                      >
                        {emp.score}%
                      </div>
                      <div style={{ fontSize: 10, color: "#534AB7", fontWeight: 600, marginTop: 2 }}>
                        View details →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Performer Work Details Modal */}
      {selectedPerformer && (
        <div
          onClick={() => setSelectedPerformer(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              width: "100%",
              maxWidth: 640,
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.24)",
              border: "1px solid #E2E8F0",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                background: "#F8FAFC"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                    {selectedPerformer.name}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#EEF2FF",
                      color: "#4F46E5",
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    {selectedPerformer.dept || "Department"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                  Top Performer Work & Execution Breakdown · Efficiency Score: <b>{selectedPerformer.score}%</b>
                </div>
              </div>
              <button
                onClick={() => setSelectedPerformer(null)}
                style={{
                  background: "#EDE9FE",
                  border: "none",
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#534AB7",
                  fontSize: 16,
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "18px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 4 Performance Metric Badges */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Completed</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#15803D", marginTop: 2 }}>
                    {selectedPerformer.completed || 0} items
                  </div>
                </div>

                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#1E40AF", fontWeight: 700, textTransform: "uppercase" }}>On-Time Rate</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1D4ED8", marginTop: 2 }}>
                    {selectedPerformer.onTimeRate || 100}%
                  </div>
                </div>

                <div style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#6B21A8", fontWeight: 700, textTransform: "uppercase" }}>Mistake-Free</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#7E22CE", marginTop: 2 }}>
                    {selectedPerformer.mistakeFreeRate || 100}%
                  </div>
                </div>

                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#92400E", fontWeight: 700, textTransform: "uppercase" }}>Active Orders</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#B45309", marginTop: 2 }}>
                    {selectedPerformer.orderCount || 0} orders
                  </div>
                </div>
              </div>

              {/* Why Top Performer explanation note */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>
                  ⭐ Why {selectedPerformer.name} is a Top Performer:
                </div>
                <div style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5 }}>
                  {selectedPerformer.delayed === 0
                    ? `100% on-time execution without any delivery flags or errors across ${selectedPerformer.completed || 0} completed tasks and order stages.`
                    : `Completed ${selectedPerformer.completed || 0} critical tasks on-time with an impressive ${selectedPerformer.onTimeRate}% on-time completion rate across ${selectedPerformer.orderCount || 0} active client orders.`}
                </div>
              </div>

              {selectedPerformer.complaintsCount > 0 && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 11.5, color: "#991B1B" }}>
                    <b>{selectedPerformer.complaintsCount} Stage Completion Dispute(s) Filed</b> — penalty of -{selectedPerformer.complaintsCount * 10} points applied to efficiency score.
                  </div>
                </div>
              )}

              {/* Section 1: Completed Order Stages & Work */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Completed Order Stages ({selectedPerformer.completedStages?.length || 0})</span>
                  <span style={{ fontSize: 10.5, color: "#059669", fontWeight: 600 }}>Zero delays reported</span>
                </div>
                {(!selectedPerformer.completedStages || selectedPerformer.completedStages.length === 0) ? (
                  <div style={{ fontSize: 11.5, color: "#94A3B8", fontStyle: "italic", padding: "8px 0" }}>
                    No order stages assigned yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                    {selectedPerformer.completedStages.map((st, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "7px 10px",
                          background: "#F8FAFC",
                          border: "1px solid #F1F5F9",
                          borderRadius: 6,
                          fontSize: 11.5
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CheckCircle2 size={14} color="#10B981" />
                          <span style={{ fontWeight: 600, color: "#1E293B" }}>{st.name}</span>
                          <span style={{ fontSize: 10.5, color: "#64748B" }}>({st.orderId} · {st.buyer || "Buyer"})</span>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#DCFCE7", color: "#166534" }}>
                          On Time
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Completed Daily Tasks */}
              {selectedPerformer.completedTasks && selectedPerformer.completedTasks.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
                    Completed Department Tasks ({selectedPerformer.completedTasks.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 130, overflowY: "auto" }}>
                    {selectedPerformer.completedTasks.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "7px 10px",
                          background: "#F8FAFC",
                          border: "1px solid #F1F5F9",
                          borderRadius: 6,
                          fontSize: 11.5
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CheckCircle size={14} color="#3B82F6" />
                          <span style={{ fontWeight: 600, color: "#1E293B" }}>{t.title || t.name}</span>
                          <span style={{ fontSize: 10.5, color: "#64748B" }}>({t.dept || selectedPerformer.dept})</span>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#EFF6FF", color: "#1E40AF" }}>
                          Completed
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "flex-end",
                background: "#F8FAFC"
              }}
            >
              <button
                onClick={() => setSelectedPerformer(null)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#334155"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Disputes & False Completion Complaints Card */}
      <Card style={{ marginBottom: 16 }}>
        <CardHeader
          title="STAGE DISPUTES & FALSE COMPLETION COMPLAINTS"
          sub="Disputes filed by team members when previous stages were falsified or marked done prematurely (-10 pts per incident)"
        />
        {complaints.length === 0 ? (
          <div style={{ padding: "20px 0", color: "#94A3B8", fontSize: 12, textAlign: "center" }}>
            No stage completion disputes recorded. All order workflows progressing cleanly.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left" }}>
                  <th style={{ padding: "9px 12px", fontWeight: 700, color: "#475569" }}>ORDER / STYLE</th>
                  <th style={{ padding: "9px 12px", fontWeight: 700, color: "#475569" }}>STAGE & DEPT</th>
                  <th style={{ padding: "9px 12px", fontWeight: 700, color: "#475569" }}>FILED BY</th>
                  <th style={{ padding: "9px 12px", fontWeight: 700, color: "#475569" }}>TAGGED USER (PENALTY)</th>
                  <th style={{ padding: "9px 12px", fontWeight: 700, color: "#475569" }}>REASON / REMARK</th>
                  <th style={{ padding: "9px 12px", fontWeight: 700, color: "#475569" }}>DATE</th>
                  <th style={{ padding: "9px 12px", fontWeight: 700, color: "#475569" }}>STATUS</th>
                  {onResolveComplaint && <th style={{ padding: "9px 12px", fontWeight: 700, color: "#475569", textAlign: "right" }}>ACTION</th>}
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => {
                  const isResolved = c.status === "Resolved";
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0F172A" }}>
                        <div>{c.orderId}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{c.orderStyle || "—"}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 600, color: "#1E293B" }}>{c.stageName}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{c.stageDept}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontWeight: 600, color: "#3B82F6" }}>@{c.reportedBy}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 700, color: "#DC2626" }}>@{c.taggedUser}</span>
                          <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "1px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 800 }}>-10 pts</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#334155", maxWidth: 280, wordBreak: "break-word" }}>
                        {c.reason}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748B", fontSize: 11 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 9px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: isResolved ? "#DCFCE7" : "#FEF3C7",
                          color: isResolved ? "#166534" : "#92400E"
                        }}>
                          {c.status || "Under Review"}
                        </span>
                      </td>
                      {onResolveComplaint && (
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          {!isResolved ? (
                            <button
                              onClick={() => onResolveComplaint(c.id, "Resolved")}
                              style={{
                                background: "#10B981",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: 5,
                                padding: "4px 10px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              Resolve
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>Resolved</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function SettingsPage({ role, setRole, orgStructure = {}, onUpdateDepartment }) {
  const [activeTab, setActiveTab] = useState("departments");
  const [newDeptName, setNewDeptName] = useState("");
  const [newHeadName, setNewHeadName] = useState("");
  const [newHeadTitle, setNewHeadTitle] = useState("");

  const deptList = useMemo(() => {
    return Object.entries(orgStructure).map(([deptName, roles]) => {
      const head = Array.isArray(roles) && roles.length > 0 ? roles[0] : null;
      return {
        name: deptName,
        headName: head?.name || "—",
        headTitle: head?.title || "Lead",
      };
    });
  }, [orgStructure]);

  const handleAddDept = (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const name = newDeptName.trim();
    const roles = [];
    if (newHeadName.trim() || newHeadTitle.trim()) {
      roles.push({
        name: newHeadName.trim() || "—",
        title: newHeadTitle.trim() || "Manager",
      });
    }
    if (onUpdateDepartment) {
      onUpdateDepartment(name, { name, roles, description: "" });
    }
    setNewDeptName("");
    setNewHeadName("");
    setNewHeadTitle("");
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader title="Settings" />

      {/* Tabs Header: Account & Departments */}
      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid #E2E8F0", marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("account")}
          style={{
            background: "none",
            border: "none",
            padding: "8px 4px 12px 4px",
            fontSize: 13.5,
            fontWeight: activeTab === "account" ? 700 : 500,
            color: activeTab === "account" ? "#2563EB" : "#64748B",
            borderBottom: activeTab === "account" ? "2px solid #2563EB" : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Account
        </button>
        <button
          onClick={() => setActiveTab("departments")}
          style={{
            background: "none",
            border: "none",
            padding: "8px 4px 12px 4px",
            fontSize: 13.5,
            fontWeight: activeTab === "departments" ? 700 : 500,
            color: activeTab === "departments" ? "#2563EB" : "#64748B",
            borderBottom: activeTab === "departments" ? "2px solid #2563EB" : "2px solid transparent",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Departments
        </button>
      </div>

      {/* Tab 1: Account (Login / Role Switcher) */}
      {activeTab === "account" && (
        <Card style={{ maxWidth: 440 }}>
          <CardHeader title="Signed in as" sub="Select role to view role-specific tasks & modules" />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 6 }}>Role / Persona</label>
            <select
              value={role.label}
              onChange={e => setRole(ROLE_OPTIONS.find(r => r.label === e.target.value))}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, background: "#FFFFFF", color: "#0F172A", fontWeight: 500 }}
            >
              {ROLE_OPTIONS.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>
            Switching your role personalizes the sidebar and navigation tasks to match that department.
          </div>
        </Card>
      )}

      {/* Tab 2: Departments (Add Department form & List) */}
      {activeTab === "departments" && (
        <div>
          {/* Add department Card */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>
              Add department
            </div>
            <form onSubmit={handleAddDept}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, color: "#64748B", display: "block", marginBottom: 6 }}>
                    Department name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IE / Industrial Engg"
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: "#64748B", display: "block", marginBottom: 6 }}>
                    Head name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh"
                    value={newHeadName}
                    onChange={e => setNewHeadName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: "#64748B", display: "block", marginBottom: 6 }}>
                    Head title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IE Manager"
                    value={newHeadTitle}
                    onChange={e => setNewHeadTitle(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12.5 }}
                  />
                </div>
              </div>
              <button
                type="submit"
                style={{
                  background: "#4F46E5",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}
              >
                Add department
              </button>
            </form>
          </Card>

          {/* Departments List Card */}
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>
              Departments ({deptList.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {deptList.map((d, index) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "10px 4px",
                    borderBottom: index < deptList.length - 1 ? "1px solid #F1F5F9" : "none",
                    fontSize: 13
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#0F172A", minWidth: 160 }}>
                    {d.name}
                  </div>
                  <div style={{ color: "#64748B", fontSize: 12.5 }}>
                    {d.headName} <span style={{ color: "#94A3B8" }}>- {d.headTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
