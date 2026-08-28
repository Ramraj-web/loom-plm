import React, { useEffect, useState } from "react";
import { resourcesApi } from "../api.js";

const panel = { background: "#fff", border: "1px solid #E4E7EC", borderRadius: 10, padding: 18, marginBottom: 16 };
const muted = { color: "#697386", fontSize: 13 };
const button = { border: 0, borderRadius: 7, padding: "8px 12px", cursor: "pointer", fontWeight: 600, color: "#fff", background: "#168A78" };

function useOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { resourcesApi.list("orders").then(setOrders).catch(e => setError(e.message)); }, []);
  return { orders, error };
}

function Layout({ title, description, children, error }) {
  return <section><div style={{ marginBottom: 22 }}><h1 style={{ margin: 0, color: "#172033", fontSize: 26 }}>{title}</h1><p style={{ ...muted, margin: "7px 0 0" }}>{description}</p></div>{error && <div style={{ ...panel, color: "#8B2630", background: "#FCEBEB" }}>{error}</div>}{children}</section>;
}

function OrderTable({ orders, onOpen }) {
  return <div style={{ ...panel, overflowX: "auto" }}>{orders.length === 0 ? <div style={muted}>No live orders found.</div> : <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}><thead><tr>{["PO / Style", "Buyer", "Country", "Quantity", "Ship date", "Risk", "Status"].map(label => <th key={label} style={th}>{label}</th>)}</tr></thead><tbody>{orders.map(order => <tr key={order.id} onClick={() => onOpen?.(order)} style={{ cursor: onOpen ? "pointer" : "default" }}><td style={td}><strong>{order.id}</strong><br /><span style={muted}>{order.style}</span></td><td style={td}>{order.buyer}</td><td style={td}>{order.country}</td><td style={td}>{Number(order.qty || 0).toLocaleString()}</td><td style={td}>{order.ship}</td><td style={td}>{order.risk}</td><td style={td}>{order.status}</td></tr>)}</tbody></table>}</div>;
}

export function OrdersPage({ onOpenOrder }) { const { orders, error } = useOrders(); return <Layout title="Orders" description="Live purchase orders across buyers and factories." error={error}><OrderTable orders={orders} onOpen={onOpenOrder} /></Layout>; }

export function OrderDetailPage({ order, onBack }) { return <Layout title={order.style || order.id} description={`PO ${order.id} · ${order.buyer} · ${order.country}`}><button onClick={onBack} style={{ ...button, marginBottom: 16 }}>Back to orders</button><div style={panel}><h2 style={h2}>Order details</h2>{Object.entries(order).filter(([key]) => !["id", "_id"].includes(key)).map(([key, value]) => <div key={key} style={detail}><span>{key}</span><strong>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}</strong></div>)}</div></Layout>; }

function DerivedPage({ title, description, filter, emptyText }) { const { orders, error } = useOrders(); const rows = orders.filter(filter); return <Layout title={title} description={description} error={error}><div style={panel}>{rows.length ? rows.map(order => <div key={order.id} style={row}><strong>{order.id} · {order.style}</strong><span style={muted}>{order.buyer} · {order.status}</span></div>) : <span style={muted}>{emptyText}</span>}</div></Layout>; }
export function TasksPage() { return <DerivedPage title="My tasks" description="Open operational tasks from live orders." filter={order => order.status !== "On Track"} emptyText="No open tasks." />; }
export function CalendarPage() { return <DerivedPage title="Timeline / calendar" description="Shipment schedule from live order records." filter={() => true} emptyText="No scheduled orders." />; }
export function ApprovalsPage() { return <DerivedPage title="Approvals" description="Orders requiring operational attention or approval." filter={order => order.status !== "On Track"} emptyText="No pending approvals." />; }
export function ProductionPage() { return <DerivedPage title="Production" description="Production status across live orders." filter={order => ["At Risk", "Delayed"].includes(order.status)} emptyText="No production exceptions." />; }
export function InsightsPage() { return <DerivedPage title="All insights" description="Live risk signals derived from order status." filter={order => order.risk !== "low"} emptyText="No risk insights." />; }
export function SupplierPerformancePage() { return <DerivedPage title="Supplier performance" description="Supplier-related order view from live records." filter={() => true} emptyText="No supplier records." />; }
export function NotificationsPage() { return <DerivedPage title="Notifications" description="Live orders needing attention." filter={order => order.status !== "On Track"} emptyText="No active notifications." />; }
export function ReportsPage() { const { orders, error } = useOrders(); const total = orders.reduce((sum, order) => sum + Number(order.qty || 0), 0); return <Layout title="Reports" description="Live summary metrics calculated from orders." error={error}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}><div style={panel}><span style={muted}>Orders</span><h2 style={metric}>{orders.length}</h2></div><div style={panel}><span style={muted}>Ordered quantity</span><h2 style={metric}>{total.toLocaleString()}</h2></div><div style={panel}><span style={muted}>At risk or delayed</span><h2 style={metric}>{orders.filter(order => order.status !== "On Track").length}</h2></div></div><OrderTable orders={orders} /></Layout>; }
export function DepartmentsPage() { return <Layout title="Departments" description="Department workspace is available from the navigation."><div style={panel}><p style={muted}>Department records can now be managed through the Staff and task modules.</p></div></Layout>; }
export function DepartmentDetailPage({ name, onBack }) { return <Layout title={name} description="Department detail workspace."><button onClick={onBack} style={button}>Back to departments</button></Layout>; }
export function QualityPage() { return <DerivedPage title="Quality" description="Orders with active risk signals for quality review." filter={order => order.risk === "high" || order.status === "Delayed"} emptyText="No quality exceptions." />; }
export function ExecutiveOverviewPage() { return <ReportsPage />; }
export function MyDepartmentPage() { return <DerivedPage title="My department" description="Your department's live operational view." filter={() => true} emptyText="No department records." />; }
export function SettingsPage() { return <Layout title="Settings" description="Application settings and account preferences."><div style={panel}><p style={muted}>Role and access settings are managed by your administrator.</p></div></Layout>; }

const h2 = { margin: "0 0 14px", color: "#172033", fontSize: 16 };
const metric = { margin: "8px 0 0", color: "#168A78", fontSize: 28 };
const row = { display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 4px", borderBottom: "1px solid #F0F2F5", fontSize: 13 };
const detail = { display: "flex", justifyContent: "space-between", gap: 20, padding: "10px 0", borderBottom: "1px solid #F0F2F5", fontSize: 13 };
const th = { textAlign: "left", color: "#697386", fontSize: 11, padding: "0 10px 10px", borderBottom: "1px solid #E9ECF1" };
const td = { padding: "11px 10px", color: "#273142", fontSize: 13, borderBottom: "1px solid #F0F2F5" };
