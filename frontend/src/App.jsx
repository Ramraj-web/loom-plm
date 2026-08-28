import React, { useEffect, useState } from "react";
import { BarChart3, ClipboardList, FileCheck2, LayoutDashboard, Menu, Moon, Package, Receipt, RefreshCw, ShieldCheck, Users, Wrench, X } from "lucide-react";
import { resourcesApi } from "./api.js";
import { OrdersModule, StaffModule, LeaveModule, FinanceModule, ComplianceModule, DebitNotesModule, CapasModule } from "./modules/domainModules.jsx";
import { ApprovalsPage, CalendarPage, DepartmentsPage, DepartmentDetailPage, ExecutiveOverviewPage, InsightsPage, MyDepartmentPage, NotificationsPage, OrderDetailPage, OrdersPage, ProductionPage, QualityPage, ReportsPage, SettingsPage, SupplierPerformancePage, TasksPage } from "./modules/operationsPages.jsx";

const routes = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: Package },
  { section: "Workflow", key: "tasks", label: "My tasks", icon: ClipboardList },
  { section: "Workflow", key: "calendar", label: "Timeline / calendar", icon: ClipboardList },
  { section: "Workflow", key: "approvals", label: "Approvals", icon: FileCheck2 },
  { section: "Operations", key: "departments", label: "Departments", icon: Users },
  { section: "Operations", key: "production", label: "Production", icon: Wrench },
  { section: "Operations", key: "quality", label: "Quality", icon: ShieldCheck },
  { section: "Operations", key: "attendance", label: "Attendance & leave", icon: Users },
  { section: "Operations", key: "finance", label: "Finance data", icon: BarChart3 },
  { section: "Operations", key: "compliance", label: "Compliance & certs", icon: ShieldCheck },
  { section: "Insights", key: "reports", label: "Reports", icon: BarChart3 },
  { section: "Insights", key: "insights", label: "All insights", icon: FileCheck2 },
  { section: "Insights", key: "supplierPerformance", label: "Supplier performance", icon: BarChart3 },
  { section: "Insights", key: "notifications", label: "Notifications", icon: FileCheck2 },
  { section: "Insights", key: "debitNotes", label: "Debit notes", icon: Receipt },
  { section: "Insights", key: "capas", label: "CAPAs", icon: Wrench },
  { section: "Insights", key: "executiveOverview", label: "Executive Dashboard (MD)", icon: BarChart3 },
  { section: "Account", key: "staff", label: "Staff", icon: Users },
  { section: "Account", key: "leaveRequests", label: "Leave requests", icon: ClipboardList },
  { section: "Account", key: "settings", label: "Settings", icon: Wrench },
];

function Dashboard() {
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");
  async function load() {
    try {
      const orders = await resourcesApi.list("orders");
      const tasks = await resourcesApi.list("tasks");
      setCounts(current => ({ ...current, orders: orders.filter(order => order.isDeleted !== true).length, tasks: tasks.filter(task => task.isDeleted !== true).length }));
      setError("");
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);
  return <section><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}><div><h1 style={titleStyle}>Operations dashboard</h1><p style={subStyle}>Live counts from the backend resource routes.</p></div><button onClick={load} style={refreshStyle}><RefreshCw size={15} /> Refresh</button></div>{error && <div style={errorStyle}>{error}</div>}<div style={statsGrid}>{routes.slice(1).map((route, index) => { const color = statColors[index % statColors.length]; return <div key={route.key} style={{ ...statStyle, background: color }}><route.icon size={18} color="#fff" /><div style={{ marginTop: 16, color: "rgba(255, 255, 255, 0.82)", fontSize: 12 }}>{route.label}</div><strong style={{ display: "block", marginTop: 4, color: "#fff", fontSize: 28 }}>{counts[route.key] ?? "-"}</strong><span style={{ color: "rgba(255, 255, 255, 0.72)", fontSize: 11 }}>records</span></div>; })}</div><div style={panelStyle}><div style={{ display: "flex", alignItems: "center", gap: 10, color: "#172033", fontWeight: 700 }}><FileCheck2 size={18} color="#168A78" /> All modules use the same live CRUD API</div><p style={{ ...subStyle, marginBottom: 0 }}>Changes made in any form are persisted by the backend and remain available after a refresh or restart.</p></div></section>;
}

export default function LoomPLM() {
  const [view, setView] = useState("dashboard");
  const [darkHeader, setDarkHeader] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const current = routes.find(route => route.key === view) || routes[0];
  const moduleMap = { orders: OrdersModule, staff: StaffModule, leaveRequests: LeaveModule, finance: FinanceModule, certifications: ComplianceModule, debitNotes: DebitNotesModule, capas: CapasModule };
  const ActiveModule = moduleMap[view];
  let content = ActiveModule ? <ActiveModule /> : <Dashboard />;
  if (view === "orders") content = <OrdersPage onOpenOrder={order => { setSelectedOrder(order); setView("order"); }} />;
  if (view === "order" && selectedOrder) content = <OrderDetailPage order={selectedOrder} onBack={() => setView("orders")} />;
  if (view === "tasks") content = <TasksPage />;
  if (view === "calendar") content = <CalendarPage />;
  if (view === "approvals") content = <ApprovalsPage />;
  if (view === "departments") content = <DepartmentsPage />;
  if (view === "departmentDetail") content = <DepartmentDetailPage name={selectedDept} onBack={() => setView("departments")} />;
  if (view === "myDepartment") content = <MyDepartmentPage />;
  if (view === "production") content = <ProductionPage />;
  if (view === "quality") content = <QualityPage />;
  if (view === "attendance") content = <StaffModule />;
  if (view === "compliance") content = <ComplianceModule />;
  if (view === "reports") content = <ReportsPage />;
  if (view === "insights") content = <InsightsPage />;
  if (view === "supplierPerformance") content = <SupplierPerformancePage />;
  if (view === "notifications") content = <NotificationsPage />;
  if (view === "executiveOverview") content = <ExecutiveOverviewPage />;
  if (view === "settings") content = <SettingsPage />;
  return <div style={appStyle}>
    <aside style={{ ...sidebarStyle, transform: mobileNav ? "translateX(0)" : undefined }}><div style={brandStyle}><span style={brandMark}>L</span><strong>Loom PLM</strong><button onClick={() => setMobileNav(false)} style={closeStyle}><X size={18} /></button></div>{routes.map((route, index) => <React.Fragment key={route.key}>{route.section && (index === 0 || routes[index - 1].section !== route.section) && <div style={sectionStyle}>{route.section}</div>}<button onClick={() => { setView(route.key); setMobileNav(false); }} style={{ ...navStyle, ...(current.key === route.key ? activeNavStyle : {}) }}><route.icon size={16} />{route.label}</button></React.Fragment>)}</aside>
    {mobileNav && <div onClick={() => setMobileNav(false)} style={scrimStyle} />}
    <main style={mainStyle}><header style={{ ...headerStyle, background: darkHeader ? "#1B2340" : "#fff" }}><button onClick={() => setMobileNav(true)} style={menuStyle}><Menu size={19} /></button><span style={{ color: darkHeader ? "#fff" : "#172033", fontWeight: 700 }}>{current.label}</span><div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}><span style={{ color: darkHeader ? "#B9C1D6" : "#697386", fontSize: 12 }}>API connected</span><Moon size={17} color={darkHeader ? "#fff" : "#697386"} style={{ cursor: "pointer" }} onClick={() => setDarkHeader(value => !value)} /></div></header><div style={contentStyle}>{content}</div></main>
  </div>;
}

const appStyle = { display: "flex", minHeight: "100vh", background: "#F5F7FA", color: "#273142", fontFamily: "'Rubik', sans-serif" };
const sidebarStyle = { width: 220, background: "#172033", padding: "20px 12px", boxSizing: "border-box", flexShrink: 0, zIndex: 3 };
const brandStyle = { display: "flex", alignItems: "center", gap: 9, color: "#fff", padding: "0 8px 24px", fontSize: 16 };
const brandMark = { width: 28, height: 28, borderRadius: 7, background: "#168A78", display: "grid", placeItems: "center", fontWeight: 700 };
const navStyle = { width: "100%", border: 0, background: "transparent", color: "#AAB2C4", display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "10px 11px", borderRadius: 7, marginBottom: 3, cursor: "pointer", font: "inherit", fontSize: 13 };
const activeNavStyle = { color: "#fff", background: "#168A7833" };
const sectionStyle = { color: "#6F7A91", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "16px 11px 6px" };
const mainStyle = { flex: 1, minWidth: 0 };
const headerStyle = { height: 58, borderBottom: "1px solid #E4E7EC", display: "flex", alignItems: "center", padding: "0 28px", gap: 12, boxSizing: "border-box" };
const contentStyle = { maxWidth: 1400, margin: "0 auto", padding: "30px", boxSizing: "border-box" };
const titleStyle = { margin: 0, color: "#172033", fontSize: 26, fontWeight: 700 };
const subStyle = { color: "#697386", fontSize: 13, margin: "7px 0 0" };
const panelStyle = { background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, padding: 20, marginTop: 18 };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 };
const statStyle = { background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, padding: 18 };
const statColors = ["#168A78", "#315E8A", "#B06A22", "#7B4B94", "#2E7D5B", "#C24B5A", "#4D6FAE", "#9A6B1F", "#287D8A", "#A04C78", "#56733B", "#C05A2B", "#3F6C9B", "#82613D", "#2A8A70", "#A23D58", "#5B5BA6", "#647A38", "#B26A3C"];
const refreshStyle = { border: 0, borderRadius: 7, padding: "8px 12px", display: "flex", gap: 6, alignItems: "center", cursor: "pointer", color: "#315E8A", background: "#EDF5FB", fontWeight: 600 };
const errorStyle = { background: "#FCEBEB", color: "#8B2630", border: "1px solid #F0C6CA", borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 13 };
const menuStyle = { display: "none", border: 0, background: "transparent", cursor: "pointer", color: "inherit" };
const closeStyle = { display: "none", marginLeft: "auto", border: 0, color: "#fff", background: "transparent" };
const scrimStyle = { display: "none" };
