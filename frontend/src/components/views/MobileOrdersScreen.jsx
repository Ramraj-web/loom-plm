import React, { useState, useMemo } from "react";
import {
  Package, Search, Filter, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, ArrowUpDown, Calendar, DollarSign, X, ShieldAlert
} from "lucide-react";
import { statusPill, riskDot } from "../common/CommonUI.jsx";
import { MobileBottomNav } from "./MobileBottomNav.jsx";

/**
 * MobileOrdersScreen
 * Clean light mobile Orders list & management screen.
 * Soft blue primary actions, balanced status badges, touch-friendly cards.
 */
export function MobileOrdersScreen({
  orders = [],
  buyers = [],
  onOpenOrder,
  onNavigate,
  isDarkMode = false
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'On Track' | 'At Risk' | 'Delayed' | 'completed'
  const [buyerFilter, setBuyerFilter] = useState("all");

  const safeOrders = useMemo(() => {
    return (Array.isArray(orders) ? orders : []).filter(o => o && !o.isDeleted);
  }, [orders]);

  // Extract unique buyers present in orders
  const availableBuyers = useMemo(() => {
    const set = new Set();
    safeOrders.forEach(o => {
      if (o.buyer) set.add(o.buyer);
    });
    return Array.from(set);
  }, [safeOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return safeOrders.filter(o => {
      // Status filter
      if (statusFilter === "completed" && !o.completed) return false;
      if (statusFilter !== "all" && statusFilter !== "completed") {
        if (o.status !== statusFilter) return false;
      }

      // Buyer filter
      if (buyerFilter !== "all" && o.buyer !== buyerFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = o.id && o.id.toLowerCase().includes(q);
        const matchStyle = o.style && o.style.toLowerCase().includes(q);
        const matchBuyer = o.buyer && o.buyer.toLowerCase().includes(q);
        const matchSeason = o.season && o.season.toLowerCase().includes(q);
        if (!matchId && !matchStyle && !matchBuyer && !matchSeason) return false;
      }

      return true;
    });
  }, [safeOrders, statusFilter, buyerFilter, searchQuery]);

  // Counts
  const onTrackCount = useMemo(() => safeOrders.filter(o => o.status === "On Track" && !o.completed).length, [safeOrders]);
  const atRiskCount = useMemo(() => safeOrders.filter(o => o.status === "At Risk" && !o.completed).length, [safeOrders]);
  const delayedCount = useMemo(() => safeOrders.filter(o => o.status === "Delayed" && !o.completed).length, [safeOrders]);

  return (
    <div
      className="mobile-orders-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        paddingBottom: 76,
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}
    >
      {/* Top Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#FFFFFF",
          color: "#0F172A",
          padding: "12px 16px",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#EFF6FF",
              color: "#2563EB",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16
            }}
          >
            <Package size={19} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>Orders</div>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
              {safeOrders.length} total orders · <span style={{ color: "#2563EB", fontWeight: 700 }}>{filteredOrders.length}</span> shown
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Search Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#FFFFFF",
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)"
          }}
        >
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search PO #, style, buyer..."
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              color: "#0F172A",
              fontSize: 13,
              width: "100%"
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { id: "all", label: `All (${safeOrders.length})` },
            { id: "On Track", label: `On Track (${onTrackCount})` },
            { id: "At Risk", label: `At Risk (${atRiskCount})` },
            { id: "Delayed", label: `Delayed (${delayedCount})` }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              style={{
                padding: "6px 13px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: statusFilter === st.id ? 700 : 500,
                border: "1px solid",
                borderColor: statusFilter === st.id ? "#2563EB" : "#E2E8F0",
                background: statusFilter === st.id ? "#2563EB" : "#FFFFFF",
                color: statusFilter === st.id ? "#FFFFFF" : "#475569",
                whiteSpace: "nowrap",
                cursor: "pointer",
                boxShadow: statusFilter === st.id ? "0 1px 3px rgba(37,99,235,0.2)" : "none"
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Buyer Filters if any */}
        {availableBuyers.length > 0 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            <button
              onClick={() => setBuyerFilter("all")}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: buyerFilter === "all" ? 700 : 500,
                border: `1px solid ${buyerFilter === "all" ? "#BFDBFE" : "transparent"}`,
                background: buyerFilter === "all" ? "#EFF6FF" : "#F1F5F9",
                color: buyerFilter === "all" ? "#1D4ED8" : "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              All Buyers
            </button>
            {availableBuyers.map(b => (
              <button
                key={b}
                onClick={() => setBuyerFilter(b)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: buyerFilter === b ? 700 : 500,
                  border: `1px solid ${buyerFilter === b ? "#BFDBFE" : "transparent"}`,
                  background: buyerFilter === b ? "#EFF6FF" : "#F1F5F9",
                  color: buyerFilter === b ? "#1D4ED8" : "#475569",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        {/* Orders List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          {filteredOrders.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "36px 20px",
                textAlign: "center",
                border: "1px solid #E2E8F0",
                color: "#64748B"
              }}
            >
              <Package size={36} color="#2563EB" style={{ margin: "0 auto 10px", opacity: 0.8 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>No orders found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing search terms or selecting All status.</div>
            </div>
          ) : (
            filteredOrders.map(o => {
              const stages = Array.isArray(o.stages) ? o.stages : [];
              const doneCount = stages.filter(s => s.status === "done").length;
              const progressPct = stages.length > 0 ? Math.round((doneCount / stages.length) * 100) : 0;
              const currentStage = stages.find(s => s.status === "in_progress" || s.status !== "done") || stages[0];

              return (
                <div
                  key={o.primaryId || o.id}
                  onClick={() => onOpenOrder && onOpenOrder(o.primaryId || o.id, o.primaryId)}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    padding: "14px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    WebkitTapHighlightColor: "transparent"
                  }}
                >
                  {/* Top Line: Order ID, Status Pill, Chevron */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>
                        #{o.id}
                      </span>
                      {statusPill(o.status)}
                    </div>
                    <ChevronRight size={17} color="#94A3B8" />
                  </div>

                  {/* Middle Line: Style and Buyer */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>
                      {o.style || "Garment Style"}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                      Buyer: <b style={{ color: "#334155" }}>{o.buyer || "Direct"}</b> · Qty: {Number(o.qty || 0).toLocaleString()} pcs {o.season ? `· ${o.season}` : ""}
                    </div>
                  </div>

                  {/* Progress Bar & Current Stage */}
                  <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px", border: "1px solid #EDF2F7" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 5 }}>
                      <span style={{ color: "#64748B" }}>
                        Stage: <b style={{ color: "#0F172A" }}>{currentStage?.name || "Pipeline"}</b>
                      </span>
                      <span style={{ fontWeight: 700, color: "#2563EB" }}>
                        {progressPct}% ({doneCount}/{stages.length})
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 5, borderRadius: 3, background: "#E2E8F0", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: "100%",
                          background: o.status === "Delayed" ? "#DC2626" : (o.status === "At Risk" ? "#D97706" : "#2563EB"),
                          borderRadius: 3,
                          transition: "width 0.3s ease"
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Line: Target Ship Date & Action */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, paddingTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748B" }}>
                      <Calendar size={13} color="#94A3B8" />
                      <span>Ship: <b style={{ color: "#334155" }}>{o.ship || "—"}</b></span>
                    </div>
                    <span style={{ color: "#2563EB", fontWeight: 700, fontSize: 11.5 }}>
                      Track Details →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Five-Tab Unified Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab="orders"
        onNavigate={onNavigate}
      />
    </div>
  );
}
