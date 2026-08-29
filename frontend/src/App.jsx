import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, CheckSquare, BarChart3, Settings as SettingsIcon,
  ChevronDown, Search, Bell, Moon, ClipboardList,
  Calendar, TriangleAlert, ArrowDownRight,
  Users, ShieldCheck, ClipboardCheck, Lightbulb, UserCheck, TrendingUp, Landmark, Factory, RefreshCw
} from "lucide-react";
import { resourcesApi } from "./api.js";
import {
  ORG_STRUCTURE, ROLE_OPTIONS, STAFF_LIST, seedAttendance, INITIAL_LEAVE_REQUESTS,
  INITIAL_FINANCIALS, INITIAL_CERTIFICATIONS, INITIAL_DEBIT_NOTES, INITIAL_CAPAS,
  INITIAL_ORDERS, VAP_SUPPLIERS, buildCostingRows, makeStages, initPreProd
} from "./constants/loomData.js";
import { statusPill } from "./components/common/CommonUI.jsx";
import { OrderWorkspace } from "./components/order/OrderWorkspace.jsx";
import { Dashboard, MyDepartmentDashboard } from "./components/views/DashboardView.jsx";
import {
  OrdersPage, MyTasksPage, CalendarPage, ApprovalsPage, ProductionPage,
  QualityPage, CompliancePage, AttendancePage, DepartmentsPage, DepartmentDetail
} from "./components/views/OperationsViews.jsx";
import {
  FinanceEntryPage, ReportsPage, InsightsPage, SupplierPerformancePage,
  NotificationsPage, DebitNotesPage, CapasPage, ExecutiveOverviewPage, SettingsPage
} from "./components/views/InsightsViews.jsx";

export default function LoomPLM() {
  const [orders, setOrders] = useState(() =>
    INITIAL_ORDERS.map((o, i) => ({
      ...o,
      template: "90",
      costingTemplate: "fabric",
      costingRows: buildCostingRows("fabric"),
      vapCount: 1,
      shippedQty: Math.round(o.qty * [0.72, 0.4, 0.55, 0.9, 0.6, 0.98][i % 6]),
      plannedCost: Math.round(o.qty * [4.2, 2.1, 7.8, 3.6, 5.4, 2.8][i % 6]),
      actualCost: Math.round(o.qty * [4.2, 2.1, 7.8, 3.6, 5.4, 2.8][i % 6] * [1.044, 1.077, 0.976, 0.991, 1.052, 0.977][i % 6]),
      stages: makeStages("90", o.activeUpto, o.delayedAt).map(s => s.dept === "VAP" ? { ...s, supplier: VAP_SUPPLIERS[i % VAP_SUPPLIERS.length] } : s),
      preProd: initPreProd(),
    }))
  );

  const [view, setView] = useState("dashboard");
  const [previousView, setPreviousView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [attendance, setAttendance] = useState(seedAttendance);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const [roster, setRoster] = useState(STAFF_LIST);
  const [orgStructure, setOrgStructure] = useState(() => JSON.parse(JSON.stringify(ORG_STRUCTURE)));

  const [financials, setFinancials] = useState(INITIAL_FINANCIALS);
  const [certifications, setCertifications] = useState(INITIAL_CERTIFICATIONS);
  const [debitNotes, setDebitNotes] = useState(INITIAL_DEBIT_NOTES);
  const [capas, setCapas] = useState(INITIAL_CAPAS);

  const [factoryMenuOpen, setFactoryMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2026-05-12");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [headerDark, setHeaderDark] = useState(false);

  // Sync data with backend on load if available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const backendOrders = await resourcesApi.list("orders");
        if (!cancelled && Array.isArray(backendOrders) && backendOrders.length > 0) {
          const activeOrders = backendOrders.filter(o => o.isDeleted !== true);
          setOrders(prev => {
            const merged = [...activeOrders];
            prev.forEach(p => {
              if (!merged.some(m => m.id === p.id)) {
                merged.push(p);
              }
            });
            return merged.map((bo, i) => {
              const existing = prev.find(p => p.id === bo.id);
              return {
                ...existing,
                ...bo,
                template: bo.template || existing?.template || "90",
                costingTemplate: bo.costingTemplate || existing?.costingTemplate || "fabric",
                costingRows: bo.costingRows || existing?.costingRows || buildCostingRows(bo.costingTemplate || existing?.costingTemplate || "fabric"),
                vapCount: bo.vapCount ?? existing?.vapCount ?? 1,
                shippedQty: bo.shippedQty ?? existing?.shippedQty ?? Math.round((bo.qty || 5000) * 0.75),
                plannedCost: bo.plannedCost ?? existing?.plannedCost ?? Math.round((bo.qty || 5000) * 4),
                actualCost: bo.actualCost ?? existing?.actualCost ?? Math.round((bo.qty || 5000) * 4.2),
                stages: bo.stages || existing?.stages || makeStages(bo.template || existing?.template || "90", 5, null),
                preProd: bo.preProd || existing?.preProd || initPreProd(),
              };
            });
          });
        }
      } catch (e) {}

      try {
        const dbDebit = await resourcesApi.list("debitNotes");
        if (!cancelled && Array.isArray(dbDebit) && dbDebit.length > 0) {
          setDebitNotes(dbDebit.filter(d => d.isDeleted !== true));
        }
      } catch (e) {}

      try {
        const dbCapas = await resourcesApi.list("capas");
        if (!cancelled && Array.isArray(dbCapas) && dbCapas.length > 0) {
          setCapas(dbCapas.filter(c => c.isDeleted !== true));
        }
      } catch (e) {}

      try {
        const dbFinancials = await resourcesApi.list("financials");
        if (!cancelled && Array.isArray(dbFinancials) && dbFinancials.length > 0) {
          setFinancials(prev => ({ ...prev, ...dbFinancials[0] }));
        }
      } catch (e) {}

      try {
        if (window.storage && window.storage.get) {
          // Load staff roster from storage or backend
          let baseRoster = null;
          try {
            const rosterRes = await window.storage.get("staff_roster", true);
            if (rosterRes && rosterRes.value) {
              baseRoster = JSON.parse(rosterRes.value);
            }
          } catch (e) {}

          try {
            const dbStaff = await resourcesApi.list("staff");
            if (Array.isArray(dbStaff) && dbStaff.length > 0) {
              const active = dbStaff.filter(s => s.isDeleted !== true);
              const merged = [...(baseRoster || STAFF_LIST)];
              active.forEach(as => {
                if (!merged.some(m => m.name === as.name)) {
                  merged.push({ name: as.name, title: as.title || "Staff", dept: as.dept || "Merchandising" });
                }
              });
              baseRoster = merged;
            }
          } catch (e) {}

          if (!cancelled && Array.isArray(baseRoster) && baseRoster.length > 0) {
            setRoster(baseRoster);
          }

          // Load org structure
          const orgRes = await window.storage.get("org_structure", true);
          if (!cancelled && orgRes && orgRes.value) {
            try { setOrgStructure(JSON.parse(orgRes.value)); } catch (e) {}
          }

          const attRes = await window.storage.get("attendance", true);
          if (!cancelled && attRes && attRes.value) {
            try { setAttendance(JSON.parse(attRes.value)); } catch (e) {}
          }
          const certRes = await window.storage.get("certifications", true);
          if (!cancelled && certRes && certRes.value) {
            try { setCertifications(JSON.parse(certRes.value)); } catch (e) {}
          }
          const leaveRes = await window.storage.get("leaveRequests", true);
          if (!cancelled && leaveRes && leaveRes.value) {
            try { setLeaveRequests(JSON.parse(leaveRes.value)); } catch (e) {}
          }
          const roleRes = await window.storage.get("currentRole", true);
          if (!cancelled && roleRes && roleRes.value) {
            try {
              const parsed = JSON.parse(roleRes.value);
              const foundRole = ROLE_OPTIONS.find(r => r.label === parsed.label || r.dept === parsed.dept);
              if (foundRole) setRole(foundRole);
            } catch (e) {}
          }
        }
      } catch (e) {}
    })();

    return () => { cancelled = true; };
  }, []);

  const addStaff = (person) => {
    let nextRoster;
    setRoster(prev => {
      if (prev.some(p => p.name === person.name)) {
        nextRoster = prev.map(p => p.name === person.name ? { ...p, ...person } : p);
      } else {
        nextRoster = [...prev, person];
      }
      if (window.storage) window.storage.set("staff_roster", JSON.stringify(nextRoster), true);
      return nextRoster;
    });

    setAttendance(prev => {
      const updated = { ...prev, [person.name]: prev[person.name] || "present" };
      if (window.storage) window.storage.set("attendance", JSON.stringify(updated), true);
      return updated;
    });

    setOrgStructure(prev => {
      const currentList = prev[person.dept] || [];
      let nextList;
      if (currentList.some(r => r.name === person.name)) {
        nextList = currentList.map(r => r.name === person.name ? { ...r, title: person.title } : r);
      } else {
        nextList = [...currentList, { title: person.title, name: person.name, bullets: [] }];
      }
      const updatedOrg = { ...prev, [person.dept]: nextList };
      if (window.storage) window.storage.set("org_structure", JSON.stringify(updatedOrg), true);
      return updatedOrg;
    });

    try { resourcesApi.create("staff", person); } catch (e) {}
  };

  const editStaff = (oldName, updatedPerson) => {
    let nextRoster;
    setRoster(prev => {
      nextRoster = prev.map(s => (s.name === oldName ? updatedPerson : s));
      if (window.storage) window.storage.set("staff_roster", JSON.stringify(nextRoster), true);
      return nextRoster;
    });

    setAttendance(prev => {
      const updated = { ...prev };
      const currentStatus = updated[oldName] || "present";
      if (oldName !== updatedPerson.name) {
        delete updated[oldName];
      }
      updated[updatedPerson.name] = currentStatus;
      if (window.storage) window.storage.set("attendance", JSON.stringify(updated), true);
      return updated;
    });

    setLeaveRequests(prev => {
      const updated = prev.map(l => l.name === oldName ? { ...l, name: updatedPerson.name, dept: updatedPerson.dept } : l);
      if (window.storage) window.storage.set("leaveRequests", JSON.stringify(updated), true);
      return updated;
    });

    setOrgStructure(prev => {
      const nextOrg = {};
      Object.entries(prev).forEach(([dept, roles]) => {
        if (dept === updatedPerson.dept) {
          const found = roles.some(r => r.name === oldName);
          if (found) {
            nextOrg[dept] = roles.map(r => r.name === oldName ? { ...r, name: updatedPerson.name, title: updatedPerson.title } : r);
          } else {
            nextOrg[dept] = [...roles, { title: updatedPerson.title, name: updatedPerson.name, bullets: [] }];
          }
        } else {
          nextOrg[dept] = roles.map(r => r.name === oldName ? { ...r, name: "—" } : r);
        }
      });
      if (window.storage) window.storage.set("org_structure", JSON.stringify(nextOrg), true);
      return nextOrg;
    });

    try { resourcesApi.create("staff", updatedPerson); } catch (e) {}
  };

  const removeStaff = (name) => {
    let nextRoster;
    setRoster(prev => {
      nextRoster = prev.filter(s => s.name !== name);
      if (window.storage) window.storage.set("staff_roster", JSON.stringify(nextRoster), true);
      return nextRoster;
    });

    setAttendance(prev => {
      const updated = { ...prev };
      delete updated[name];
      if (window.storage) window.storage.set("attendance", JSON.stringify(updated), true);
      return updated;
    });

    setOrgStructure(prev => {
      const nextOrg = {};
      Object.entries(prev).forEach(([dept, roles]) => {
        nextOrg[dept] = roles.map(r => (r.name === name ? { ...r, name: "—" } : r));
      });
      if (window.storage) window.storage.set("org_structure", JSON.stringify(nextOrg), true);
      return nextOrg;
    });

    try { resourcesApi.delete("staff", name); } catch (e) {}
  };

  const cycleAttendance = (name) => {
    setAttendance(prev => {
      const current = prev[name] || "present";
      const next = current === "present" ? "absent" : current === "absent" ? "leave" : "present";
      const updated = { ...prev, [name]: next };
      if (window.storage) window.storage.set("attendance", JSON.stringify(updated), true);
      return updated;
    });
  };

  const approveLeave = (id) => setLeaveRequests(prev => {
    const updated = prev.map(l => l.id === id ? { ...l, status: "approved" } : l);
    if (window.storage) window.storage.set("leaveRequests", JSON.stringify(updated), true);
    return updated;
  });

  const rejectLeave = (id) => setLeaveRequests(prev => {
    const updated = prev.map(l => l.id === id ? { ...l, status: "rejected" } : l);
    if (window.storage) window.storage.set("leaveRequests", JSON.stringify(updated), true);
    return updated;
  });

  const addLeaveRequest = (leave) => {
    setLeaveRequests(prev => {
      const updated = [leave, ...prev];
      if (window.storage) window.storage.set("leaveRequests", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.create("leaveRequests", leave); } catch (e) {}
  };

  const handleSetRole = (newRole) => {
    setRole(newRole);
    if (window.storage) window.storage.set("currentRole", JSON.stringify(newRole), true);
  };

  const updateFinancials = (field, value) => {
    setFinancials(prev => {
      const next = { ...prev, [field]: value };
      try { resourcesApi.update("financials", "current", next); } catch (e) {}
      return next;
    });
  };

  const cycleCert = (key) => {
    setCertifications(prev => {
      const updated = prev.map(c => {
        if (c.key !== key) return c;
        const next = c.status === "not_applied" ? "applied" : c.status === "applied" ? "approved" : "not_applied";
        return { ...c, status: next };
      });
      if (window.storage) window.storage.set("certifications", JSON.stringify(updated), true);
      return updated;
    });
  };

  const addDebitNote = (note) => {
    setDebitNotes(prev => [note, ...prev]);
    try { resourcesApi.create("debitNotes", note); } catch (e) {}
  };

  const addCapa = (capa) => {
    setCapas(prev => [capa, ...prev]);
    try { resourcesApi.create("capas", capa); } catch (e) {}
  };

  const cycleCapaStatus = (id) => {
    setCapas(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = c.status === "open" ? "in_progress" : c.status === "in_progress" ? "closed" : "open";
      const updated = { ...c, status: next };
      try { resourcesApi.update("capas", c.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const updateStages = (id, stages) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const doneCount = stages.filter(s => s.status === "done").length;
      const hasFlag = stages.some(s => s.reason);
      const status = doneCount === stages.length ? "On Track" : hasFlag ? "Delayed" : "At Risk";
      const updated = { ...o, stages, status };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const setOrderTemplate = (id, tmpl) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, template: tmpl, stages: makeStages(tmpl, 0, null), status: "On Track" };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const setOrderCostingTemplate = (id, tmpl) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, costingTemplate: tmpl, costingRows: buildCostingRows(tmpl) };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const updateCostingRow = (id, idx, field, value) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const rows = [...(o.costingRows || [])];
      rows[idx] = { ...rows[idx], [field]: value };
      const updated = { ...o, costingRows: rows };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const addCostingRow = (id) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, costingRows: [...(o.costingRows || []), { label: "", section: "Other", isHeader: false, price: 0, qty: 1, custom: true }] };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const updateShippedQty = (id, qty) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, shippedQty: qty };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const updateOrderCost = (id, field, value) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, [field]: value };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const updatePreProdField = (id, docKey, fieldKey, value) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const doc = (o.preProd && o.preProd[docKey]) || { values: {}, status: "draft" };
      const updated = { ...o, preProd: { ...(o.preProd || {}), [docKey]: { ...doc, values: { ...doc.values, [fieldKey]: value } } } };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const submitPreProdDoc = (id, docKey) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, preProd: { ...(o.preProd || {}), [docKey]: { ...(o.preProd[docKey]), status: "submitted" } } };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const approvePreProdDoc = (id, docKey, approverName) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = {
        ...o,
        preProd: {
          ...(o.preProd || {}),
          [docKey]: {
            ...(o.preProd[docKey]),
            status: "approved",
            approvedBy: approverName,
            approvedAt: new Date().toLocaleDateString(),
          },
        },
      };
      try { resourcesApi.update("orders", o.id, updated); } catch (e) {}
      return updated;
    }));
  };

  const navigate = (key) => { setView(key); };

  const openOrder = (id) => {
    setSelectedId(id);
    setPreviousView(view === "order" ? previousView : view);
    setView("order");
  };

  const openDept = (name) => {
    setSelectedDept(name);
    setPreviousView(view);
    setView("departmentDetail");
  };

  const selectedOrder = orders.find(o => o.id === selectedId);
  const canSeeAll = !!role.fullAccess;
  const personName = (role.label.match(/\(([^)]+)\)/) || [])[1] || role.label;

  const searchResults = searchQuery.trim().length === 0 ? [] : orders
    .filter(o => canSeeAll || (o.stages && o.stages.some(s => s.dept === role.dept)))
    .filter(o => {
      const q = searchQuery.toLowerCase();
      return (o.id || "").toLowerCase().includes(q) || (o.style || "").toLowerCase().includes(q) || (o.buyer || "").toLowerCase().includes(q) || (o.country || "").toLowerCase().includes(q);
    })
    .slice(0, 6);

  const bellAlerts = (() => {
    const items = [];
    orders.forEach(o => {
      if (!o.stages) return;
      o.stages.forEach(s => {
        if (s.reason && (canSeeAll || s.dept === role.dept)) {
          items.push({ text: `${s.reason} — ${o.style} PO #${o.id}`, sev: o.risk, orderId: o.id });
        }
      });
    });
    return items;
  })();

  const navSections = [
    { section: null, items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ...(canSeeAll ? [{ key: "orders", label: "Orders", icon: Package }] : []),
      { key: "tasks", label: "My tasks", icon: CheckSquare },
      ...(canSeeAll ? [{ key: "calendar", label: "Timeline / calendar", icon: Calendar }] : []),
      ...(canSeeAll ? [{ key: "approvals", label: "Approvals", icon: ClipboardCheck }] : []),
    ]},
    { section: "Operations", items: [
      ...(canSeeAll
        ? [{ key: "departments", label: "Departments", icon: Users }]
        : [{ key: "myDepartment", label: "My department", icon: Users }]),
      ...(canSeeAll || ["Cutting", "Production"].includes(role.dept) ? [{ key: "production", label: "Production", icon: Factory }] : []),
      ...(canSeeAll || role.dept === "Quality" ? [{ key: "quality", label: "Quality", icon: ShieldCheck }] : []),
      ...(canSeeAll || role.dept === "Compliance & Certification" ? [{ key: "compliance", label: "Compliance & certs", icon: ShieldCheck }] : []),
      { key: "attendance", label: "Attendance & leave", icon: UserCheck },
      ...(canSeeAll || role.dept === "Finance" ? [{ key: "finance", label: "Finance data", icon: Landmark }] : []),
    ]},
    { section: "Insights", items: [
      ...(canSeeAll ? [{ key: "reports", label: "Reports", icon: BarChart3 }] : []),
      ...(canSeeAll ? [{ key: "insights", label: "All insights", icon: Lightbulb }] : []),
      ...(canSeeAll ? [{ key: "supplierPerformance", label: "Supplier performance", icon: TrendingUp }] : []),
      ...(canSeeAll ? [{ key: "notifications", label: "Notifications", icon: Bell }] : []),
      ...(canSeeAll ? [{ key: "debitNotes", label: "Debit notes", icon: ArrowDownRight }] : []),
      ...(canSeeAll ? [{ key: "capas", label: "CAPAs", icon: RefreshCw }] : []),
      ...(role.dept === "Executive" ? [{ key: "executiveOverview", label: "Executive Dashboard (MD)", icon: TrendingUp }] : []),
    ]},
    { section: null, items: [
      { key: "settings", label: "Settings", icon: SettingsIcon },
    ]},
  ];

  let content;
  if (view === "order" && selectedOrder) {
    content = <OrderWorkspace order={selectedOrder} onBack={() => setView(previousView)} onUpdateStages={updateStages} role={role} onSetTemplate={setOrderTemplate} onSetCostingTemplate={setOrderCostingTemplate} onUpdateCostingRow={updateCostingRow} onAddCostingRow={addCostingRow} onUpdateShippedQty={updateShippedQty} onPreProdField={updatePreProdField} onPreProdSubmit={submitPreProdDoc} onPreProdApprove={approvePreProdDoc} />;
  } else if (view === "departmentDetail" && selectedDept) {
    content = <DepartmentDetail deptName={selectedDept} orders={orders} onBack={() => setView(previousView)} onOpenOrder={openOrder} orgStructure={orgStructure} />;
  } else if (view === "myDepartment") {
    content = <DepartmentDetail deptName={role.dept} orders={orders} onBack={() => setView("dashboard")} onOpenOrder={openOrder} orgStructure={orgStructure} />;
  } else if (view === "orders" && canSeeAll) {
    content = <OrdersPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "tasks") {
    content = <MyTasksPage orders={orders} role={role} onOpenOrder={openOrder} />;
  } else if (view === "calendar" && canSeeAll) {
    content = <CalendarPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "approvals" && canSeeAll) {
    content = <ApprovalsPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "departments" && canSeeAll) {
    content = <DepartmentsPage orders={orders} onOpenDept={openDept} orgStructure={orgStructure} />;
  } else if (view === "production" && (canSeeAll || ["Cutting", "Production"].includes(role.dept))) {
    content = <ProductionPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "quality" && (canSeeAll || role.dept === "Quality")) {
    content = <QualityPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "compliance" && (canSeeAll || role.dept === "Compliance & Certification")) {
    content = <CompliancePage certifications={certifications} onCycle={cycleCert} />;
  } else if (view === "reports" && canSeeAll) {
    content = <ReportsPage orders={orders} />;
  } else if (view === "insights" && canSeeAll) {
    content = <InsightsPage orders={orders} />;
  } else if (view === "supplierPerformance" && canSeeAll) {
    content = <SupplierPerformancePage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "notifications" && canSeeAll) {
    content = <NotificationsPage orders={orders} />;
  } else if (view === "debitNotes" && canSeeAll) {
    content = <DebitNotesPage orders={orders} notes={debitNotes} onAdd={addDebitNote} />;
  } else if (view === "capas" && canSeeAll) {
    content = <CapasPage orders={orders} capas={capas} onAdd={addCapa} onCycleStatus={cycleCapaStatus} />;
  } else if (view === "attendance") {
    content = <AttendancePage roster={roster} attendance={attendance} onCycle={cycleAttendance} leaveRequests={leaveRequests} onApprove={approveLeave} onReject={rejectLeave} onAddStaff={addStaff} onEditStaff={editStaff} onRemoveStaff={removeStaff} onAddLeaveRequest={addLeaveRequest} />;
  } else if (view === "finance" && (canSeeAll || role.dept === "Finance")) {
    content = <FinanceEntryPage orders={orders} financials={financials} onUpdate={updateFinancials} onUpdateOrderCost={updateOrderCost} />;
  } else if (view === "executiveOverview" && role.dept === "Executive") {
    content = <ExecutiveOverviewPage orders={orders} attendance={attendance} financials={financials} roster={roster} />;
  } else if (view === "settings") {
    content = <SettingsPage role={role} setRole={handleSetRole} />;
  } else if (canSeeAll) {
    content = <Dashboard orders={orders} onOpenOrder={openOrder} onNavigate={navigate} attendance={attendance} roster={roster} />;
  } else {
    content = <MyDepartmentDashboard orders={orders} role={role} personName={personName} onOpenOrder={openOrder} onNavigate={navigate} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", maxWidth: 1440, margin: "0 auto", background: "#F5F6F8", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Rubik', sans-serif", overflow: "hidden", boxShadow: "0 0 0 1px #E7E8ED" }}>
      {/* Sidebar */}
      <div style={{ width: 208, background: "#151B2E", padding: "20px 14px", flexShrink: 0, overflowY: "auto", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px", color: "#fff" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#1F9E8D", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>L</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Loom PLM</span>
        </div>
        {navSections.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 10 }}>
            {group.section && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "#5C6178", textTransform: "uppercase", letterSpacing: 0.5, padding: "10px 10px 4px" }}>{group.section}</div>
            )}
            {group.items.map(item => {
              const active = view === item.key || (item.key === "orders" && (view === "order")) || (item.key === "departments" && view === "departmentDetail");
              return (
                <div
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
                    color: active ? "#fff" : "#9498A8", background: active ? "#1F9E8D22" : "transparent",
                    fontSize: 13.5, fontWeight: active ? 600 : 500, cursor: "pointer", marginBottom: 2
                  }}
                >
                  <item.icon size={16} />
                  {item.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header */}
        <div style={{ height: 56, background: headerDark ? "#1B2340" : "#fff", borderBottom: `1px solid ${headerDark ? "#2A3358" : "#ECEDF1"}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setFactoryMenuOpen(!factoryMenuOpen)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: headerDark ? "#2A3358" : "#F5F6F8", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, color: headerDark ? "#D6D9E8" : "#565A66", cursor: "pointer" }}
              >
                All factories <ChevronDown size={12} />
              </div>
              {factoryMenuOpen && (
                <div style={{ position: "absolute", top: "110%", left: 0, background: "#fff", border: "1px solid #ECEDF1", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 30, minWidth: 160, padding: 6 }}>
                  <div
                    onClick={() => setFactoryMenuOpen(false)}
                    style={{ padding: "7px 10px", fontSize: 12.5, borderRadius: 6, background: "#F0EFFB", color: "#534AB7", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                  >
                    <CheckCircle2 size={13} /> All factories
                  </div>
                </div>
              )}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, background: headerDark ? "#2A3358" : "#F5F6F8", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, color: headerDark ? "#D6D9E8" : "#565A66", cursor: "pointer" }}>
              <Calendar size={13} />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ border: "none", background: "transparent", fontSize: 12.5, color: "inherit", cursor: "pointer", fontFamily: "inherit" }}
              />
            </label>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: headerDark ? "#2A3358" : "#F5F6F8", borderRadius: 8, padding: "6px 12px", width: 240 }}>
              <Search size={14} color={headerDark ? "#9AA0C0" : "#8A8D98"} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search orders, styles, PO..."
                style={{ border: "none", background: "transparent", fontSize: 13, color: headerDark ? "#E4E6F2" : "#1B2130", width: "100%", outline: "none" }}
              />
            </div>
            {searchQuery.trim().length > 0 && (
              <div style={{ position: "absolute", top: "110%", left: 0, right: 0, background: "#fff", border: "1px solid #ECEDF1", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 30, maxHeight: 260, overflowY: "auto" }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: "12px 14px", fontSize: 12.5, color: "#B0B2BA" }}>No matching orders.</div>
                ) : searchResults.map(o => (
                  <div
                    key={o.id}
                    onClick={() => { openOrder(o.id); setSearchQuery(""); }}
                    style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid #F5F5F7", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#8A8D98", marginRight: 8 }}>{o.id}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1B2130" }}>{o.style}</span>
                      <span style={{ fontSize: 12, color: "#8A8D98" }}> · {o.buyer}</span>
                    </div>
                    {statusPill(o.status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={17} color={headerDark ? "#D6D9E8" : "#565A66"} />
                {bellAlerts.length > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6, background: "#D64545", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 999, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {bellAlerts.length}
                  </span>
                )}
              </div>
              {notifOpen && (
                <div style={{ position: "absolute", top: "140%", right: 0, background: "#fff", border: "1px solid #ECEDF1", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 30, width: 300, maxHeight: 320, overflowY: "auto" }}>
                  <div style={{ padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: "#1B2130", borderBottom: "1px solid #F0F0F2" }}>Alerts</div>
                  {bellAlerts.length === 0 ? (
                    <div style={{ padding: "14px", fontSize: 12.5, color: "#B0B2BA" }}>Nothing to flag right now.</div>
                  ) : bellAlerts.slice(0, 8).map((a, i) => (
                    <div
                      key={i}
                      onClick={() => { openOrder(a.orderId); setNotifOpen(false); }}
                      style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #F5F5F7" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FAFAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <TriangleAlert size={13} color={a.sev === "high" ? "#D64545" : "#E2A83B"} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ fontSize: 12, color: "#1B2130" }}>{a.text}</div>
                    </div>
                  ))}
                  {canSeeAll && (
                    <div onClick={() => { navigate("notifications"); setNotifOpen(false); }} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#378ADD", cursor: "pointer" }}>
                      View all in Notifications →
                    </div>
                  )}
                </div>
              )}
            </div>
            <Moon size={16} color={headerDark ? "#D6D9E8" : "#565A66"} style={{ cursor: "pointer" }} onClick={() => setHeaderDark(!headerDark)} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("settings")}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {role.label.split(" ")[0].slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: headerDark ? "#fff" : "#1B2130" }}>{role.label.split(" (")[0]}</div>
                <div style={{ fontSize: 10.5, color: headerDark ? "#9AA0C0" : "#8A8D98" }}>{role.dept}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Viewport */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {content}
        </div>
      </div>
    </div>
  );
}
