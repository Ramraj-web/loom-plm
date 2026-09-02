import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, CheckSquare, BarChart3, Settings as SettingsIcon,
  ChevronDown, Search, Bell, Moon, Sun, ClipboardList,
  Calendar, TriangleAlert, ArrowDownRight, Award,
  Users, ShieldCheck, ClipboardCheck, Lightbulb, UserCheck, TrendingUp, Landmark, Factory, RefreshCw
} from "lucide-react";
import { resourcesApi } from "./api.js";
import {
  ORG_STRUCTURE, ROLE_OPTIONS, STAFF_LIST, seedAttendance, INITIAL_LEAVE_REQUESTS,
  INITIAL_FINANCIALS, INITIAL_CERTIFICATIONS, INITIAL_COMPLIANCES, INITIAL_DEBIT_NOTES, INITIAL_CAPAS,
  INITIAL_ORDERS, INITIAL_NOTIFICATIONS, VAP_SUPPLIERS, buildCostingRows, makeStages, initPreProd,
  NOTIFICATION_PRIORITY_STYLE, formatTimeAgo, DEFAULT_DEPT_DESCRIPTIONS, INITIAL_SUPPLIERS, INITIAL_SUPPLIER_WORK,
  INITIAL_CUSTOM_TASKS
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
  const [deptDescriptions, setDeptDescriptions] = useState(() => ({ ...DEFAULT_DEPT_DESCRIPTIONS }));
  const [suppliers, setSuppliers] = useState(() => JSON.parse(JSON.stringify(INITIAL_SUPPLIERS)));
  const [supplierWork, setSupplierWork] = useState(() => JSON.parse(JSON.stringify(INITIAL_SUPPLIER_WORK)));

  const [financials, setFinancials] = useState(INITIAL_FINANCIALS);
  const [certifications, setCertifications] = useState(INITIAL_CERTIFICATIONS);
  const [compliances, setCompliances] = useState(INITIAL_COMPLIANCES);
  const [debitNotes, setDebitNotes] = useState(INITIAL_DEBIT_NOTES);
  const [capas, setCapas] = useState(INITIAL_CAPAS);
  const [customTasks, setCustomTasks] = useState(() => JSON.parse(JSON.stringify(INITIAL_CUSTOM_TASKS)));
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const [selectedDate, setSelectedDate] = useState("2026-05-12");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("loom_plm_theme") === "dark";
    } catch (e) {
      return false;
    }
  });

  // Global Theme Effect
  useEffect(() => {
    try {
      localStorage.setItem("loom_plm_theme", isDarkMode ? "dark" : "light");
    } catch (e) {}
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("dark-theme");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.body.classList.remove("dark-theme");
    }
  }, [isDarkMode]);

  // Sync data with backend on load if available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const backendOrders = await resourcesApi.list("orders", "?all=true");
        if (!cancelled && Array.isArray(backendOrders) && backendOrders.length > 0) {
          setOrders(prev => {
            const merged = [...backendOrders];
            prev.forEach(p => {
              if (!merged.some(m => m.id === p.id)) {
                merged.push(p);
              }
            });
            return merged.map((bo) => {
              const existing = prev.find(p => p.id === bo.id);
              const isDefaultSeed = ["GKT-1054", "ST-7788", "JKT-2231", "TR-8899", "DR-5566", "PL-3321"].includes(bo.id);
              return {
                ...existing,
                ...bo,
                completed: bo.completed ?? existing?.completed ?? false,
                isDeleted: bo.isDeleted ?? existing?.isDeleted ?? false,
                completedAt: bo.completedAt || existing?.completedAt || null,
                deletedAt: bo.deletedAt || existing?.deletedAt || null,
                template: bo.template || existing?.template || "90",
                costingTemplate: bo.costingTemplate || existing?.costingTemplate || "fabric",
                costingRows: bo.costingRows || existing?.costingRows || buildCostingRows(bo.costingTemplate || existing?.costingTemplate || "fabric"),
                vapCount: bo.vapCount ?? existing?.vapCount ?? 1,
                shippedQty: bo.shippedQty ?? existing?.shippedQty ?? (isDefaultSeed ? Math.round((bo.qty || 5000) * 0.75) : 0),
                plannedCost: bo.plannedCost ?? existing?.plannedCost ?? Math.round((bo.qty || 5000) * 4),
                actualCost: bo.actualCost ?? existing?.actualCost ?? Math.round((bo.qty || 5000) * 4.2),
                stages: bo.stages || existing?.stages || (isDefaultSeed ? makeStages(bo.template || existing?.template || "90", 5, null) : makeStages("90", 0, null)),
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
        const dbTasks = await resourcesApi.list("tasks");
        if (!cancelled && Array.isArray(dbTasks) && dbTasks.length > 0) {
          setCustomTasks(dbTasks.filter(t => t.isDeleted !== true));
        }
      } catch (e) {}

      try {
        const dbCerts = await resourcesApi.list("certifications", "?all=true");
        if (!cancelled && Array.isArray(dbCerts) && dbCerts.length > 0) {
          setCertifications(dbCerts);
        }
      } catch (e) {}

      try {
        const dbCompliances = await resourcesApi.list("compliances", "?all=true");
        if (!cancelled && Array.isArray(dbCompliances) && dbCompliances.length > 0) {
          setCompliances(dbCompliances);
        }
      } catch (e) {}

      try {
        const dbNotifs = await resourcesApi.list("notifications", "?all=true");
        if (!cancelled && Array.isArray(dbNotifs) && dbNotifs.length > 0) {
          setNotifications(prev => {
            const map = new Map();
            dbNotifs.forEach(n => {
              const key = n.id || n.eventKey;
              if (key) map.set(key, n);
            });
            prev.forEach(n => {
              const key = n.id || n.eventKey;
              if (key && !map.has(key)) map.set(key, n);
            });
            return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          });
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

          // Load dept descriptions
          const descRes = await window.storage.get("dept_descriptions", true);
          if (!cancelled && descRes && descRes.value) {
            try {
              const parsed = JSON.parse(descRes.value);
              if (parsed && typeof parsed === "object") {
                setDeptDescriptions(prev => ({ ...prev, ...parsed }));
              }
            } catch (e) {}
          }

          const attRes = await window.storage.get("attendance", true);
          if (!cancelled && attRes && attRes.value) {
            try { setAttendance(JSON.parse(attRes.value)); } catch (e) {}
          }
          const certRes = await window.storage.get("certifications", true);
          if (!cancelled && certRes && certRes.value) {
            try {
              const parsed = JSON.parse(certRes.value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCertifications(prev => {
                  const map = new Map(prev.map(item => [item.id || item.key, item]));
                  parsed.forEach(item => map.set(item.id || item.key, { ...map.get(item.id || item.key), ...item }));
                  return Array.from(map.values());
                });
              }
            } catch (e) {}
          }
          const compRes = await window.storage.get("compliances", true);
          if (!cancelled && compRes && compRes.value) {
            try {
              const parsed = JSON.parse(compRes.value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCompliances(prev => {
                  const map = new Map(prev.map(item => [item.id, item]));
                  parsed.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
                  return Array.from(map.values());
                });
              }
            } catch (e) {}
          }
          const notifRes = await window.storage.get("notifications", true);
          if (!cancelled && notifRes && notifRes.value) {
            try {
              const parsed = JSON.parse(notifRes.value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setNotifications(prev => {
                  const map = new Map(prev.map(item => [item.id || item.eventKey, item]));
                  parsed.forEach(item => {
                    const key = item.id || item.eventKey;
                    if (key) map.set(key, { ...map.get(key), ...item });
                  });
                  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                });
              }
            } catch (e) {}
          }
          const leaveRes = await window.storage.get("leaveRequests", true);
          if (!cancelled && leaveRes && leaveRes.value) {
            try { setLeaveRequests(JSON.parse(leaveRes.value)); } catch (e) {}
          }
          const supRes = await window.storage.get("suppliers", true);
          if (!cancelled && supRes && supRes.value) {
            try {
              const parsed = JSON.parse(supRes.value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSuppliers(prev => {
                  const map = new Map(prev.map(item => [item.id || item.name, item]));
                  parsed.forEach(item => map.set(item.id || item.name, { ...map.get(item.id || item.name), ...item }));
                  return Array.from(map.values());
                });
              }
            } catch (e) {}
          }
          const workRes = await window.storage.get("supplierWork", true);
          if (!cancelled && workRes && workRes.value) {
            try {
              const parsed = JSON.parse(workRes.value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSupplierWork(prev => {
                  const map = new Map(prev.map(item => [item.id, item]));
                  parsed.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
                  return Array.from(map.values());
                });
              }
            } catch (e) {}
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

  // Central Notification Dispatcher with Deduplication
  const pushNotification = (notif) => {
    const id = notif.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const eventKey = notif.eventKey || `${notif.type}-${notif.relatedId || id}`;
    const newNotif = {
      id,
      eventKey,
      type: notif.type || "order",
      title: notif.title || "Notification",
      message: notif.message || "",
      relatedModule: notif.relatedModule || "orders",
      relatedId: notif.relatedId || null,
      priority: notif.priority || "medium",
      isRead: false,
      createdAt: notif.createdAt || new Date().toISOString(),
      isDeleted: false,
      ...notif
    };

    setNotifications(prev => {
      // Prevent duplicate notification by eventKey or id
      if (prev.some(n => (n.eventKey === eventKey || n.id === id) && n.isDeleted !== true)) {
        return prev;
      }
      const updated = [newNotif, ...prev];
      if (window.storage) window.storage.set("notifications", JSON.stringify(updated), true);
      return updated;
    });

    try {
      resourcesApi.create("notifications", newNotif).catch(() => {});
    } catch (e) {}
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      if (window.storage) window.storage.set("notifications", JSON.stringify(updated), true);
      return updated;
    });
    try {
      resourcesApi.patch("notifications", id, { isRead: true }).catch(() => {});
    } catch (e) {}
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      if (window.storage) window.storage.set("notifications", JSON.stringify(updated), true);
      return updated;
    });
    try {
      notifications.forEach(n => {
        if (!n.isRead) {
          resourcesApi.patch("notifications", n.id, { isRead: true }).catch(() => {});
        }
      });
    } catch (e) {}
  };

  const deleteNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (window.storage) window.storage.set("notifications", JSON.stringify(updated), true);
      return updated;
    });
    try {
      resourcesApi.remove("notifications", id).catch(() => {});
    } catch (e) {}
  };

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

  // Certification CRUD Operations
  const addCertification = (cert) => {
    const newCert = {
      id: cert.id || `cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      key: cert.id || `cert-${Date.now()}`,
      status: "Draft",
      issueDate: new Date().toISOString().split("T")[0],
      isDeleted: false,
      createdAt: new Date().toISOString(),
      ...cert
    };
    setCertifications(prev => {
      const updated = [newCert, ...prev];
      if (window.storage) window.storage.set("certifications", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.create("certifications", newCert); } catch (e) {}

    // Check expiry logic for notification
    if (newCert.expiryDate) {
      const exp = new Date(newCert.expiryDate);
      const daysUntil = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        pushNotification({
          eventKey: `cert-expired-${newCert.id}`,
          type: "certification",
          title: "Certification Expired",
          message: `${newCert.name} certification has expired.`,
          relatedModule: "compliance",
          relatedId: newCert.id,
          priority: "critical"
        });
      } else if (daysUntil <= 30) {
        pushNotification({
          eventKey: `cert-expiring-${newCert.id}`,
          type: "certification",
          title: "Certification Expiring Soon",
          message: `${newCert.name} certification expires in ${daysUntil} days.`,
          relatedModule: "compliance",
          relatedId: newCert.id,
          priority: "high"
        });
      }
    }
  };

  const updateCertification = (id, updates) => {
    setCertifications(prev => {
      const updated = prev.map(c => ((c.id === id || c.key === id) ? { ...c, ...updates } : c));
      if (window.storage) window.storage.set("certifications", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.patch("certifications", id, updates); } catch (e) {}

    if (updates.status === "Approved") {
      const target = certifications.find(c => c.id === id || c.key === id);
      pushNotification({
        eventKey: `cert-approved-${id}`,
        type: "certification",
        title: "Certification Approved",
        message: `${target?.name || "Certification"} has been approved.`,
        relatedModule: "compliance",
        relatedId: id,
        priority: "low"
      });
    }
  };

  const deleteCertification = (id) => {
    const deletedAt = new Date().toISOString();
    setCertifications(prev => {
      const updated = prev.map(c => ((c.id === id || c.key === id) ? { ...c, isDeleted: true, deletedAt } : c));
      if (window.storage) window.storage.set("certifications", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.remove("certifications", id); } catch (e) {}
  };

  const restoreCertification = (id) => {
    setCertifications(prev => {
      const updated = prev.map(c => ((c.id === id || c.key === id) ? { ...c, isDeleted: false, deletedAt: null } : c));
      if (window.storage) window.storage.set("certifications", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.patch("certifications", id, { isDeleted: false, deletedAt: null }); } catch (e) {}
  };

  // Compliance CRUD Operations & Task Synchronization
  const addCompliance = (comp) => {
    const newComp = {
      id: comp.id || `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: "Pending",
      priority: "Medium",
      dueDate: "20 May",
      isDeleted: false,
      createdAt: new Date().toISOString(),
      ...comp
    };
    setCompliances(prev => {
      const updated = [newComp, ...prev];
      if (window.storage) window.storage.set("compliances", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.create("compliances", newComp); } catch (e) {}

    // Synchronize to My Tasks if a responsible person is assigned
    if (newComp.responsiblePerson && newComp.responsiblePerson !== "—") {
      const linkedTask = {
        id: `task-comp-${newComp.id}`,
        title: `Compliance Review: ${newComp.name}`,
        orderId: newComp.orderId || null,
        dept: newComp.department || "Compliance & Certification",
        assignee: newComp.responsiblePerson,
        dueDate: newComp.dueDate || "20 May",
        priority: (newComp.priority || "medium").toLowerCase(),
        notes: `Linked compliance requirement for ${newComp.buyer || "All Buyers"}. ${newComp.description || ""}`,
        status: newComp.status === "Passed" ? "done" : "in_progress",
        complianceId: newComp.id,
        createdAt: new Date().toISOString()
      };
      setCustomTasks(prev => {
        if (prev.some(t => t.id === linkedTask.id || t.complianceId === newComp.id)) {
          return prev.map(t => (t.id === linkedTask.id || t.complianceId === newComp.id) ? { ...t, ...linkedTask } : t);
        }
        return [linkedTask, ...prev];
      });
      try { resourcesApi.create("tasks", linkedTask); } catch (e) {}
    }

    // Fire notification for compliance
    pushNotification({
      eventKey: `comp-created-${newComp.id}`,
      type: "compliance",
      title: "Compliance Review Pending",
      message: `${newComp.name} compliance review is pending${newComp.orderId ? ` for ${newComp.orderId}` : ""}.`,
      relatedModule: "compliance",
      relatedId: newComp.id,
      priority: (newComp.priority || "medium").toLowerCase()
    });
  };

  const updateCompliance = (id, updates) => {
    setCompliances(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        const next = { ...c, ...updates };
        if (updates.status === "Passed" && !next.completedAt) {
          next.completedAt = new Date().toISOString();
        }
        return next;
      });
      if (window.storage) window.storage.set("compliances", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.patch("compliances", id, updates); } catch (e) {}

    // Update synced task in My Tasks if status or details changed
    setCustomTasks(prev => prev.map(t => {
      if (t.complianceId === id || t.id === `task-comp-${id}`) {
        const nextStatus = (updates.status === "Passed" || updates.status === "Waived") ? "done" : "in_progress";
        const taskUpdates = {
          status: nextStatus,
          ...(updates.dueDate ? { dueDate: updates.dueDate } : {}),
          ...(updates.priority ? { priority: updates.priority.toLowerCase() } : {}),
          ...(updates.responsiblePerson ? { assignee: updates.responsiblePerson } : {}),
          ...(updates.department ? { dept: updates.department } : {})
        };
        try { resourcesApi.patch("tasks", t.id, taskUpdates); } catch (e) {}
        return { ...t, ...taskUpdates };
      }
      return t;
    }));

    // Fire notifications on status transitions
    const targetComp = compliances.find(c => c.id === id);
    if (updates.status === "Failed") {
      pushNotification({
        eventKey: `comp-failed-${id}-${Date.now()}`,
        type: "compliance",
        title: "Compliance Failed",
        message: `Buyer compliance requirement '${targetComp?.name || id}' has failed. ${updates.notes ? `Reason: ${updates.notes}` : ""}`,
        relatedModule: "compliance",
        relatedId: id,
        priority: "critical"
      });
    } else if (updates.status === "Passed") {
      pushNotification({
        eventKey: `comp-passed-${id}`,
        type: "compliance",
        title: "Compliance Requirement Passed",
        message: `Compliance check '${targetComp?.name || id}' marked passed.`,
        relatedModule: "compliance",
        relatedId: id,
        priority: "low"
      });
    }
  };

  const deleteCompliance = (id) => {
    const deletedAt = new Date().toISOString();
    setCompliances(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, isDeleted: true, deletedAt } : c));
      if (window.storage) window.storage.set("compliances", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.remove("compliances", id); } catch (e) {}

    // Remove or complete related task
    setCustomTasks(prev => prev.filter(t => t.complianceId !== id && t.id !== `task-comp-${id}`));
    try { resourcesApi.remove("tasks", `task-comp-${id}`); } catch (e) {}
  };

  const restoreCompliance = (id) => {
    setCompliances(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, isDeleted: false, deletedAt: null } : c));
      if (window.storage) window.storage.set("compliances", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.patch("compliances", id, { isDeleted: false, deletedAt: null }); } catch (e) {}
  };

  const cycleCert = (key) => {
    setCertifications(prev => {
      const updated = prev.map(c => {
        if (c.key !== key && c.id !== key) return c;
        const next = c.status === "not_applied" || c.status === "Draft" ? "Applied" : c.status === "applied" || c.status === "Applied" ? "Approved" : "Draft";
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

  const addTask = (task) => {
    const newTask = {
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "in_progress",
      ...task
    };
    setCustomTasks(prev => [newTask, ...prev]);
    try { resourcesApi.create("tasks", newTask); } catch (e) {}

    // Fire notification
    pushNotification({
      eventKey: `task-created-${newTask.id}`,
      type: "task",
      title: "New Task Assigned",
      message: `'${newTask.title}' has been assigned to ${newTask.assignee || "you"}.`,
      relatedModule: "tasks",
      relatedId: newTask.id,
      priority: newTask.priority || "medium"
    });
  };

  const updateTask = (id, updates) => {
    setCustomTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      try { resourcesApi.patch("tasks", id, updates); } catch (e) {}

      // If this task was linked to a compliance record, update compliance status
      if (t.complianceId && updates.status) {
        const compStatus = updates.status === "done" ? "Passed" : "In Progress";
        updateCompliance(t.complianceId, { status: compStatus });
      }

      if (updates.status === "done") {
        pushNotification({
          eventKey: `task-completed-${id}`,
          type: "task",
          title: "Task Completed",
          message: `'${t.title}' has been completed.`,
          relatedModule: "tasks",
          relatedId: id,
          priority: "low"
        });
      }
      return updated;
    }));
  };

  const deleteTask = (id) => {
    setCustomTasks(prev => prev.filter(t => t.id !== id));
    try { resourcesApi.remove("tasks", id); } catch (e) {}
  };

  const addOrder = (newOrder) => {
    const fullOrder = {
      template: "90",
      costingTemplate: "fabric",
      costingRows: buildCostingRows("fabric"),
      vapCount: 1,
      shippedQty: 0,
      plannedCost: Math.round((newOrder.qty || 5000) * 4),
      actualCost: Math.round((newOrder.qty || 5000) * 4),
      stages: makeStages("90", 0, null),
      preProd: initPreProd(),
      ...newOrder,
      completed: false,
      isDeleted: false,
      completedAt: null,
      deletedAt: null,
    };
    setOrders(prev => {
      if (prev.some(o => o.id === fullOrder.id)) {
        return prev.map(o => o.id === fullOrder.id ? { ...o, ...fullOrder } : o);
      }
      return [fullOrder, ...prev];
    });
    try {
      resourcesApi.create("orders", fullOrder).catch(err => {
        console.warn("Error creating order:", err.message);
      });
    } catch (e) {}

    // Trigger Notification for New Order
    pushNotification({
      eventKey: `order-created-${fullOrder.id}`,
      type: "order",
      title: "New Order Added",
      message: `Order ${fullOrder.id} (${fullOrder.style}) has been created for ${fullOrder.buyer}.`,
      relatedModule: "orders",
      relatedId: fullOrder.id,
      priority: fullOrder.risk === "high" ? "high" : "medium"
    });
  };

  const completeOrder = (id) => {
    const completedAt = new Date().toISOString();
    setOrders(prev => prev.map(o => o.id === id ? { ...o, completed: true, completedAt } : o));
    try {
      resourcesApi.patch("orders", id, { completed: true, completedAt }).catch(err => {
        console.warn("Error completing order:", err.message);
      });
    } catch (e) {}

    pushNotification({
      eventKey: `order-completed-${id}`,
      type: "order",
      title: "Order Completed",
      message: `Order ${id} has been completed.`,
      relatedModule: "orders",
      relatedId: id,
      priority: "low"
    });
  };

  const uncompleteOrder = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, completed: false, completedAt: null } : o));
    try {
      resourcesApi.patch("orders", id, { completed: false, completedAt: null }).catch(err => {
        console.warn("Error reopening order:", err.message);
      });
    } catch (e) {}
  };

  const deleteOrder = (id) => {
    const deletedAt = new Date().toISOString();
    setOrders(prev => prev.map(o => o.id === id ? { ...o, isDeleted: true, deletedAt } : o));
    try {
      resourcesApi.remove("orders", id).catch(err => {
        console.warn("Error deleting order:", err.message);
      });
    } catch (e) {}

    pushNotification({
      eventKey: `order-deleted-${id}`,
      type: "order",
      title: "Order Deleted",
      message: `Order ${id} was moved to Deleted History.`,
      relatedModule: "orders",
      relatedId: id,
      priority: "medium"
    });
  };

  const restoreOrder = (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, isDeleted: false, deletedAt: null } : o));
    try {
      resourcesApi.patch("orders", id, { isDeleted: false, deletedAt: null }).catch(err => {
        console.warn("Error restoring order:", err.message);
      });
    } catch (e) {}
  };

  const updateStages = (id, stages) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const doneCount = stages.filter(s => s.status === "done").length;
      const allDone = stages.length > 0 && doneCount === stages.length;
      const hasFlag = stages.some(s => s.reason);
      const status = allDone ? "On Track" : hasFlag ? "Delayed" : "At Risk";
      
      const isCompleted = allDone;
      const completedAt = isCompleted ? (o.completedAt || new Date().toISOString()) : null;

      // Detect stage completions / delays and attach timestamps
      const nowIso = new Date().toISOString();
      const updatedStages = stages.map((s, idx) => {
        const prevStage = o.stages?.[idx];
        const res = { ...s };
        if (s.status === "done" && (!prevStage || prevStage.status !== "done")) {
          res.completedAt = s.completedAt || nowIso;
        }
        if (s.reason && (!prevStage || prevStage.reason !== s.reason)) {
          res.flaggedAt = s.flaggedAt || nowIso;
        }
        if (s.status === "in_progress" && (!prevStage || prevStage.status !== "in_progress")) {
          res.updatedAt = s.updatedAt || nowIso;
        }
        return res;
      });

      updatedStages.forEach((s, idx) => {
        const prevStage = o.stages?.[idx];
        if (s.status === "done" && prevStage?.status !== "done") {
          pushNotification({
            eventKey: `tna-stage-done-${id}-${s.name}`,
            type: "tna",
            title: "T&A Stage Completed",
            message: `${s.name} stage completed for ${id}.`,
            relatedModule: "tna",
            relatedId: id,
            priority: "low"
          });
        }
        if (s.reason && (!prevStage?.reason || prevStage.reason !== s.reason)) {
          pushNotification({
            eventKey: `tna-stage-delay-${id}-${s.name}-${s.reason}`,
            type: "tna",
            title: "T&A Stage Flagged",
            message: `${s.name} delayed on order ${id}: ${s.reason}`,
            relatedModule: "tna",
            relatedId: id,
            priority: o.risk === "high" ? "critical" : "high"
          });
        }
      });

      // Detect Order Status change
      if (status !== o.status) {
        if (status === "Delayed") {
          pushNotification({
            eventKey: `order-delayed-${id}`,
            type: "order",
            title: "Order Delayed",
            message: `Order ${id} is delayed.`,
            relatedModule: "orders",
            relatedId: id,
            priority: "critical"
          });
        } else {
          pushNotification({
            eventKey: `order-status-${id}-${status}`,
            type: "order",
            title: "Order Status Updated",
            message: `${id} status changed to ${status}.`,
            relatedModule: "orders",
            relatedId: id,
            priority: status === "At Risk" ? "high" : "medium"
          });
        }
      }

      if (isCompleted && !o.completed) {
        pushNotification({
          eventKey: `order-completed-${id}`,
          type: "order",
          title: "Order Completed",
          message: `Order ${id} has been completed.`,
          relatedModule: "orders",
          relatedId: id,
          priority: "low"
        });
      }

      const updated = {
        ...o,
        stages: updatedStages,
        status,
        completed: isCompleted,
        completedAt
      };

      try {
        resourcesApi.update("orders", o.id, updated).catch(err => {
          console.warn("Error updating order stages:", err.message);
        });
        resourcesApi.patch("orders", o.id, {
          stages,
          status,
          completed: isCompleted,
          completedAt
        }).catch(() => {});
      } catch (e) {}

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

    pushNotification({
      eventKey: `approval-submitted-${id}-${docKey}`,
      type: "approval",
      title: "Approval Required",
      message: `${docKey.toUpperCase()} submitted for order ${id}. Needs review.`,
      relatedModule: "approvals",
      relatedId: id,
      priority: "high"
    });
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

    pushNotification({
      eventKey: `approval-approved-${id}-${docKey}`,
      type: "approval",
      title: "Approval Completed",
      message: `${docKey.toUpperCase()} approved by ${approverName || "Approver"} for order ${id}.`,
      relatedModule: "approvals",
      relatedId: id,
      priority: "low"
    });
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

  const handleUpdateDepartment = async (oldDeptName, updatedData) => {
    const newDeptName = updatedData.name ? updatedData.name.trim() : oldDeptName;
    const newRoles = updatedData.roles || [];
    const newDesc = updatedData.description !== undefined ? updatedData.description : (deptDescriptions[oldDeptName] || "");

    let updatedOrg = { ...orgStructure };
    if (newDeptName !== oldDeptName) {
      const keys = Object.keys(orgStructure);
      const remapped = {};
      keys.forEach(k => {
        if (k === oldDeptName) {
          remapped[newDeptName] = newRoles;
        } else {
          remapped[k] = orgStructure[k];
        }
      });
      if (!remapped[newDeptName]) {
        remapped[newDeptName] = newRoles;
      }
      updatedOrg = remapped;
    } else {
      updatedOrg[newDeptName] = newRoles;
    }
    setOrgStructure(updatedOrg);

    let updatedDescs = { ...deptDescriptions };
    if (newDeptName !== oldDeptName) {
      delete updatedDescs[oldDeptName];
    }
    updatedDescs[newDeptName] = newDesc;
    setDeptDescriptions(updatedDescs);

    if (selectedDept === oldDeptName) {
      setSelectedDept(newDeptName);
    }

    const existingStaffNames = new Set(roster.map(r => r.name));
    const newRoster = [...roster];
    newRoles.forEach(r => {
      if (r.name && r.name !== "—") {
        r.name.split(/&|,/).map(n => n.trim()).forEach(name => {
          if (name && !existingStaffNames.has(name)) {
            existingStaffNames.add(name);
            newRoster.push({ name, title: r.title || "Staff", dept: newDeptName });
          }
        });
      }
    });
    if (newRoster.length !== roster.length) {
      setRoster(newRoster);
      try {
        if (window.storage?.set) {
          window.storage.set("staff_roster", JSON.stringify(newRoster), true);
        }
      } catch (e) {}
    }

    try {
      if (window.storage && window.storage.set) {
        await window.storage.set("org_structure", JSON.stringify(updatedOrg), true);
        await window.storage.set("dept_descriptions", JSON.stringify(updatedDescs), true);
      }
    } catch (err) {
      console.warn("Failed to persist department update:", err);
    }
  };

  const handleAddSupplier = async (newSup) => {
    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    try {
      if (window.storage?.set) {
        await window.storage.set("suppliers", JSON.stringify(updated), true);
      }
      if (resourcesApi?.create) {
        await resourcesApi.create("suppliers", newSup).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to persist new supplier:", err);
    }
  };

  const handleUpdateSupplier = async (updatedSup) => {
    const updated = suppliers.map(s => s.id === updatedSup.id ? updatedSup : s);
    setSuppliers(updated);
    try {
      if (window.storage?.set) {
        await window.storage.set("suppliers", JSON.stringify(updated), true);
      }
      if (resourcesApi?.update) {
        await resourcesApi.update("suppliers", updatedSup.id, updatedSup).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to persist updated supplier:", err);
    }
  };

  const handleDeleteSupplier = async (supId) => {
    const updated = suppliers.map(s => s.id === supId ? { ...s, isDeleted: true } : s);
    setSuppliers(updated);
    try {
      if (window.storage?.set) {
        await window.storage.set("suppliers", JSON.stringify(updated), true);
      }
      if (resourcesApi?.delete) {
        await resourcesApi.delete("suppliers", supId).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to persist deleted supplier:", err);
    }
  };

  const handleAssignSupplier = async (orderId, stageIdx, supplierName) => {
    if (!supplierName) return;
    const now = new Date().toISOString();
    const updated = suppliers.map(s => {
      if (s.name === supplierName || s.id === supplierName) {
        return { ...s, latestOrderDate: now };
      }
      return s;
    });
    setSuppliers(updated);
    try {
      if (window.storage?.set) {
        await window.storage.set("suppliers", JSON.stringify(updated), true);
      }
    } catch (e) {}
  };

  const handleAssignWork = async (newWork) => {
    const updatedWork = [newWork, ...supplierWork];
    setSupplierWork(updatedWork);

    // Update supplier's latestOrderDate to move them to the top
    const now = new Date().toISOString();
    const updatedSuppliers = suppliers.map(s => {
      if (s.id === newWork.supplierId || s.name === newWork.supplierName) {
        return { ...s, latestOrderDate: now };
      }
      return s;
    });
    setSuppliers(updatedSuppliers);

    // If linked to an order stage, update the stage supplier
    if (newWork.orderId && newWork.stageIdx !== undefined) {
      setOrders(prev => prev.map(o => {
        if (o.id === newWork.orderId && o.stages && o.stages[newWork.stageIdx]) {
          const stages = o.stages.map((st, i) => i === newWork.stageIdx ? { ...st, supplier: newWork.supplierName } : st);
          return { ...o, stages };
        }
        return o;
      }));
    }

    try {
      if (window.storage?.set) {
        await window.storage.set("supplierWork", JSON.stringify(updatedWork), true);
        await window.storage.set("suppliers", JSON.stringify(updatedSuppliers), true);
      }
      if (resourcesApi?.create) {
        await resourcesApi.create("supplierWork", newWork).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to persist supplier work:", err);
    }
  };

  const handleUpdateWorkStatus = async (workId, newStatus, completedDate) => {
    const updatedWork = supplierWork.map(w => {
      if (w.id === workId) {
        return {
          ...w,
          status: newStatus,
          completedDate: completedDate !== undefined ? completedDate : w.completedDate
        };
      }
      return w;
    });
    setSupplierWork(updatedWork);
    try {
      if (window.storage?.set) {
        await window.storage.set("supplierWork", JSON.stringify(updatedWork), true);
      }
      if (resourcesApi?.update) {
        const target = updatedWork.find(w => w.id === workId);
        if (target) await resourcesApi.update("supplierWork", workId, target).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to persist work status update:", err);
    }
  };

  const handleUpdateWorkQuality = async (workId, qualityStatus, issueDesc) => {
    const updatedWork = supplierWork.map(w => {
      if (w.id === workId) {
        return {
          ...w,
          qualityStatus,
          qualityIssueDescription: issueDesc || ""
        };
      }
      return w;
    });
    setSupplierWork(updatedWork);
    try {
      if (window.storage?.set) {
        await window.storage.set("supplierWork", JSON.stringify(updatedWork), true);
      }
      if (resourcesApi?.update) {
        const target = updatedWork.find(w => w.id === workId);
        if (target) await resourcesApi.update("supplierWork", workId, target).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to persist work quality update:", err);
    }
  };

  let content;
  if (view === "order" && selectedOrder) {
    content = (
      <OrderWorkspace
        order={selectedOrder}
        onBack={() => setView(previousView)}
        onUpdateStages={updateStages}
        role={role}
        onSetTemplate={setOrderTemplate}
        onSetCostingTemplate={setOrderCostingTemplate}
        onUpdateCostingRow={updateCostingRow}
        onAddCostingRow={addCostingRow}
        onUpdateShippedQty={updateShippedQty}
        onPreProdField={updatePreProdField}
        onPreProdSubmit={submitPreProdDoc}
        onPreProdApprove={approvePreProdDoc}
        certifications={certifications}
        compliances={compliances}
        suppliers={suppliers}
        onAssignSupplier={handleAssignSupplier}
        onAssignWork={handleAssignWork}
        allOrders={orders}
      />
    );
  } else if (view === "departmentDetail" && selectedDept) {
    content = (
      <DepartmentDetail 
        deptName={selectedDept} 
        orders={orders} 
        onBack={() => setView(previousView)} 
        onOpenOrder={openOrder} 
        orgStructure={orgStructure} 
        deptDescriptions={deptDescriptions}
        onUpdateDepartment={handleUpdateDepartment}
        suppliers={suppliers}
        onAssignWork={handleAssignWork}
      />
    );
  } else if (view === "myDepartment") {
    content = (
      <DepartmentDetail 
        deptName={role.dept} 
        orders={orders} 
        onBack={() => setView("dashboard")} 
        onOpenOrder={openOrder} 
        orgStructure={orgStructure} 
        deptDescriptions={deptDescriptions}
        onUpdateDepartment={handleUpdateDepartment}
        suppliers={suppliers}
        onAssignWork={handleAssignWork}
      />
    );
  } else if (view === "orders" && canSeeAll) {
    content = (
      <OrdersPage
        orders={orders}
        onOpenOrder={openOrder}
        onAddOrder={addOrder}
        onCompleteOrder={completeOrder}
        onUncompleteOrder={uncompleteOrder}
        onDeleteOrder={deleteOrder}
        onRestoreOrder={restoreOrder}
      />
    );
  } else if (view === "tasks") {
    content = (
      <MyTasksPage
        orders={orders}
        role={role}
        tasks={customTasks}
        suppliers={suppliers}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onAssignWork={handleAssignWork}
        onOpenOrder={openOrder}
      />
    );
  } else if (view === "calendar" && canSeeAll) {
    content = <CalendarPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "approvals" && canSeeAll) {
    content = <ApprovalsPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "departments" && canSeeAll) {
    content = (
      <DepartmentsPage 
        orders={orders} 
        onOpenDept={openDept} 
        orgStructure={orgStructure} 
        deptDescriptions={deptDescriptions}
      />
    );
  } else if (view === "production" && (canSeeAll || ["Cutting", "Production"].includes(role.dept))) {
    content = <ProductionPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "quality" && (canSeeAll || role.dept === "Quality")) {
    content = <QualityPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "compliance" && (canSeeAll || role.dept === "Compliance & Certification")) {
    content = (
      <CompliancePage
        certifications={certifications}
        compliances={compliances}
        orders={orders}
        roster={roster}
        role={role}
        onAddCertification={addCertification}
        onUpdateCertification={updateCertification}
        onDeleteCertification={deleteCertification}
        onRestoreCertification={restoreCertification}
        onAddCompliance={addCompliance}
        onUpdateCompliance={updateCompliance}
        onDeleteCompliance={deleteCompliance}
        onRestoreCompliance={restoreCompliance}
        onCycleCert={cycleCert}
        onOpenOrder={openOrder}
      />
    );
  } else if (view === "reports" && canSeeAll) {
    content = <ReportsPage orders={orders} />;
  } else if (view === "insights" && canSeeAll) {
    content = <InsightsPage orders={orders} />;
  } else if (view === "supplierPerformance" && canSeeAll) {
    content = (
      <SupplierPerformancePage
        orders={orders}
        suppliers={suppliers}
        supplierWork={supplierWork}
        tasks={customTasks}
        onAddSupplier={handleAddSupplier}
        onUpdateSupplier={handleUpdateSupplier}
        onDeleteSupplier={handleDeleteSupplier}
        onAssignWork={handleAssignWork}
        onUpdateWorkStatus={handleUpdateWorkStatus}
        onUpdateWorkQuality={handleUpdateWorkQuality}
        onOpenOrder={openOrder}
      />
    );
  } else if (view === "notifications" && canSeeAll) {
    content = (
      <NotificationsPage
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onDeleteNotification={deleteNotification}
        onOpenOrder={openOrder}
        onNavigate={navigate}
      />
    );
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
    content = (
      <Dashboard
        orders={orders}
        onOpenOrder={openOrder}
        onNavigate={navigate}
        attendance={attendance}
        roster={roster}
        selectedDate={selectedDate}
        customTasks={customTasks}
        compliances={compliances}
        certifications={certifications}
        supplierWork={supplierWork}
        notifications={notifications}
        leaveRequests={leaveRequests}
        debitNotes={debitNotes}
        capas={capas}
      />
    );
  } else {
    content = (
      <MyDepartmentDashboard
        orders={orders}
        role={role}
        personName={personName}
        onOpenOrder={openOrder}
        onNavigate={navigate}
        selectedDate={selectedDate}
        customTasks={customTasks}
        compliances={compliances}
        certifications={certifications}
        supplierWork={supplierWork}
        notifications={notifications}
        leaveRequests={leaveRequests}
        debitNotes={debitNotes}
        capas={capas}
        attendance={attendance}
      />
    );
  }

  const unreadNotifCount = notifications.filter(n => !n.isRead && n.isDeleted !== true).length;
  const recentNotifications = notifications.filter(n => n.isDeleted !== true).slice(0, 8);

  const handleNotificationClickFromDropdown = (notif) => {
    markNotificationAsRead(notif.id);
    setNotifOpen(false);
    if (notif.relatedModule === "orders" || notif.type === "order" || notif.type === "tna") {
      if (notif.relatedId) {
        openOrder(notif.relatedId);
      } else {
        navigate("orders");
      }
    } else if (notif.relatedModule === "tasks" || notif.type === "task") {
      navigate("tasks");
    } else if (notif.relatedModule === "approvals" || notif.type === "approval") {
      navigate("approvals");
    } else if (notif.relatedModule === "compliance" || notif.type === "compliance" || notif.type === "certification") {
      navigate("compliance");
    }
  };

  const getDropdownIcon = (notif) => {
    const priority = notif.priority || "medium";
    const prioColor = NOTIFICATION_PRIORITY_STYLE[priority]?.iconColor || "#3B82F6";
    if (priority === "critical") return <TriangleAlert size={14} color="#DC2626" />;
    if (notif.type === "order") return <Package size={14} color={prioColor} />;
    if (notif.type === "tna") return <Calendar size={14} color={prioColor} />;
    if (notif.type === "task") return <CheckSquare size={14} color={prioColor} />;
    if (notif.type === "approval") return <ClipboardCheck size={14} color={prioColor} />;
    if (notif.type === "certification") return <Award size={14} color={prioColor} />;
    if (notif.type === "compliance") return <ShieldCheck size={14} color={prioColor} />;
    return <Bell size={14} color={prioColor} />;
  };

  return (
    <div
      className={`app-shell ${isDarkMode ? "dark-theme" : ""}`}
      style={{
        display: "flex",
        height: "100vh",
        maxWidth: 1440,
        margin: "0 auto",
        background: isDarkMode ? "#0B0F19" : "#F5F6F8",
        color: isDarkMode ? "#F8FAFC" : "#1B2130",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Rubik', sans-serif",
        overflow: "hidden",
        boxShadow: isDarkMode ? "0 0 0 1px #1E293B" : "0 0 0 1px #E7E8ED"
      }}
    >
      {/* Sidebar */}
      <div
        className="app-sidebar"
        style={{
          width: 208,
          background: isDarkMode ? "#060911" : "#151B2E",
          borderRight: `1px solid ${isDarkMode ? "#1E293B" : "transparent"}`,
          padding: "20px 14px",
          flexShrink: 0,
          overflowY: "auto",
          height: "100%"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 20px", color: "#fff" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#1F9E8D", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>L</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Loom PLM</span>
        </div>
        {navSections.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 10 }}>
            {group.section && (
              <div style={{ fontSize: 10, fontWeight: 700, color: isDarkMode ? "#64748B" : "#5C6178", textTransform: "uppercase", letterSpacing: 0.5, padding: "10px 10px 4px" }}>{group.section}</div>
            )}
            {group.items.map(item => {
              const active = view === item.key || (item.key === "orders" && (view === "order")) || (item.key === "departments" && view === "departmentDetail");
              return (
                <div
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
                    color: active ? "#fff" : isDarkMode ? "#94A3B8" : "#9498A8", background: active ? (isDarkMode ? "#1F9E8D33" : "#1F9E8D22") : "transparent",
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
        {/* Top Header: Search Box → Date Picker → Notification → Dark Mode → User Profile */}
        <div
          className="app-header"
          style={{
            height: 56,
            background: isDarkMode ? "#0F172A" : "#FFFFFF",
            borderBottom: `1px solid ${isDarkMode ? "#1E293B" : "#ECEDF1"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            flexShrink: 0,
            position: "relative"
          }}
        >
          {/* Left Controls: 1. Search Box → 2. Date Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* 1. Search Box */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: isDarkMode ? "#18233C" : "#F5F6F8",
                  borderRadius: 8,
                  padding: "6px 12px",
                  width: 270,
                  border: `1px solid ${isDarkMode ? "#1E2D4A" : "transparent"}`
                }}
              >
                <Search size={14} color={isDarkMode ? "#94A3B8" : "#8A8D98"} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search orders, styles, PO..."
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    color: isDarkMode ? "#F8FAFC" : "#1B2130",
                    width: "100%",
                    outline: "none"
                  }}
                />
              </div>
              {searchQuery.trim().length > 0 && (
                <div
                  className="dropdown-menu"
                  style={{
                    position: "absolute",
                    top: "110%",
                    left: 0,
                    right: 0,
                    background: isDarkMode ? "#131D31" : "#FFFFFF",
                    border: `1px solid ${isDarkMode ? "#1E2D4A" : "#ECEDF1"}`,
                    borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    zIndex: 30,
                    maxHeight: 260,
                    overflowY: "auto"
                  }}
                >
                  {searchResults.length === 0 ? (
                    <div style={{ padding: "12px 14px", fontSize: 12.5, color: isDarkMode ? "#64748B" : "#B0B2BA" }}>
                      No matching orders.
                    </div>
                  ) : (
                    searchResults.map(o => (
                      <div
                        key={o.id}
                        onClick={() => { openOrder(o.id); setSearchQuery(""); }}
                        style={{
                          padding: "9px 14px",
                          cursor: "pointer",
                          borderBottom: `1px solid ${isDarkMode ? "#1E2D4A" : "#F5F5F7"}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? "#1C2B47" : "#FAFAFB"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div>
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: isDarkMode ? "#94A3B8" : "#8A8D98", marginRight: 8 }}>{o.id}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? "#F8FAFC" : "#1B2130" }}>{o.style}</span>
                          <span style={{ fontSize: 12, color: isDarkMode ? "#94A3B8" : "#8A8D98" }}> · {o.buyer}</span>
                        </div>
                        {statusPill(o.status)}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 2. Date Picker */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: isDarkMode ? "#18233C" : "#F5F6F8",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12.5,
                  color: isDarkMode ? "#CBD5E1" : "#565A66",
                  cursor: "pointer",
                  border: `1px solid ${isDarkMode ? "#1E2D4A" : "#E5E7EB"}`
                }}
                title="Filter Loom PLM activity & history by specific date"
              >
                <Calendar size={13} color={isDarkMode ? "#94A3B8" : "#565A66"} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 12.5,
                    color: isDarkMode ? "#F8FAFC" : "inherit",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    outline: "none"
                  }}
                />
              </label>
              {selectedDate !== "2026-05-12" && (
                <button
                  onClick={() => setSelectedDate("2026-05-12")}
                  title="Reset to 12 May 2026"
                  style={{
                    background: isDarkMode ? "#1E293B" : "#F3F4F6",
                    border: `1px solid ${isDarkMode ? "#334155" : "#E5E7EB"}`,
                    borderRadius: 6,
                    padding: "5px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: isDarkMode ? "#94A3B8" : "#6B7280",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  12 May
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: 3. Notification → 4. Dark Mode (Moon/Sun) → 5. User Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* 3. Notification */}
            <div style={{ position: "relative" }}>
              <div
                style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center" }}
                onClick={() => setNotifOpen(!notifOpen)}
                title="Notifications"
              >
                <Bell size={18} color={isDarkMode ? "#CBD5E1" : "#565A66"} />
                {unreadNotifCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      background: "#DC2626",
                      color: "#FFFFFF",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 999,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }}
                  >
                    {unreadNotifCount}
                  </span>
                )}
              </div>

              {/* Notification Dropdown Panel */}
              {notifOpen && (
                <div
                  className="dropdown-menu"
                  style={{
                    position: "absolute",
                    top: "140%",
                    right: 0,
                    background: isDarkMode ? "#131D31" : "#FFFFFF",
                    border: `1px solid ${isDarkMode ? "#1E2D4A" : "#ECEDF1"}`,
                    borderRadius: 12,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
                    zIndex: 50,
                    width: 360,
                    maxHeight: 460,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                  }}
                >
                  {/* Panel Header */}
                  <div
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: `1px solid ${isDarkMode ? "#1E2D4A" : "#F0F0F2"}`,
                      background: isDarkMode ? "#0F172A" : "#FAF8FE"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: isDarkMode ? "#F8FAFC" : "#111827" }}>Notifications</span>
                      {unreadNotifCount > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: "#FEE2E2", color: "#991B1B", padding: "1px 6px", borderRadius: 999 }}>
                          {unreadNotifCount} unread
                        </span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        style={{ background: "none", border: "none", color: isDarkMode ? "#A5B4FC" : "#534AB7", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0 }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Panel Content */}
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {recentNotifications.length === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: isDarkMode ? "#64748B" : "#8A8D98" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? "#F8FAFC" : "#111827" }}>No new notifications</div>
                        <div style={{ fontSize: 12, color: isDarkMode ? "#64748B" : "#9CA3AF", marginTop: 2 }}>You're all caught up.</div>
                      </div>
                    ) : (
                      recentNotifications.map(notif => {
                        const isUnread = !notif.isRead;
                        const prioStyle = NOTIFICATION_PRIORITY_STYLE[notif.priority] || NOTIFICATION_PRIORITY_STYLE.medium;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClickFromDropdown(notif)}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "flex-start",
                              padding: "11px 14px",
                              cursor: "pointer",
                              borderBottom: `1px solid ${isDarkMode ? "#1E2D4A" : "#F5F5F7"}`,
                              background: isUnread ? (isDarkMode ? "#18233C" : "#FAF8FE") : (isDarkMode ? "#131D31" : "#FFFFFF"),
                              transition: "background 0.12s ease",
                              position: "relative"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = isUnread ? (isDarkMode ? "#1C2B47" : "#F3EFFF") : (isDarkMode ? "#18233C" : "#FAFAFB")}
                            onMouseLeave={e => e.currentTarget.style.background = isUnread ? (isDarkMode ? "#18233C" : "#FAF8FE") : (isDarkMode ? "#131D31" : "#FFFFFF")}
                          >
                            {isUnread && (
                              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#534AB7" }} />
                            )}
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: isUnread ? (isDarkMode ? "#1E2D4A" : "#F0EFFB") : (isDarkMode ? "#0F172A" : "#F3F4F6"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                              {getDropdownIcon(notif)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                                <span style={{ fontSize: 12.5, fontWeight: isUnread ? 700 : 600, color: isDarkMode ? "#F8FAFC" : "#111827" }}>
                                  {notif.title}
                                </span>
                                <span style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 5px", borderRadius: 999, background: prioStyle.bg, color: prioStyle.fg }}>
                                  {prioStyle.label}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: isUnread ? (isDarkMode ? "#CBD5E1" : "#374151") : (isDarkMode ? "#94A3B8" : "#6B7280"), marginTop: 2, lineHeight: 1.35, whiteSpace: "normal" }}>
                                {notif.message}
                              </div>
                              <div style={{ fontSize: 10.5, color: isDarkMode ? "#64748B" : "#9CA3AF", marginTop: 4 }}>
                                {formatTimeAgo(notif.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Footer */}
                  <div
                    onClick={() => { navigate("notifications"); setNotifOpen(false); }}
                    style={{
                      padding: "10px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: isDarkMode ? "#A5B4FC" : "#534AB7",
                      cursor: "pointer",
                      textAlign: "center",
                      borderTop: `1px solid ${isDarkMode ? "#1E2D4A" : "#F0F0F2"}`,
                      background: isDarkMode ? "#0F172A" : "#FAF8FE"
                    }}
                  >
                    View all in Notifications →
                  </div>
                </div>
              )}
            </div>

            {/* 4. Dark Mode Toggle (Moon in Light Mode / Sun in Dark Mode) */}
            <div
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isDarkMode ? "#18233C" : "#F5F6F8",
                border: `1px solid ${isDarkMode ? "#1E2D4A" : "transparent"}`,
                transition: "all 0.15s ease"
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? "#1C2B47" : "#ECEEF2"}
              onMouseLeave={e => e.currentTarget.style.background = isDarkMode ? "#18233C" : "#F5F6F8"}
            >
              {isDarkMode ? (
                <Sun size={16} color="#FBBF24" />
              ) : (
                <Moon size={16} color="#565A66" />
              )}
            </div>

            {/* 5. User Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("settings")}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {role.label.split(" ")[0].slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: isDarkMode ? "#F8FAFC" : "#1B2130" }}>{role.label.split(" (")[0]}</div>
                <div style={{ fontSize: 10.5, color: isDarkMode ? "#94A3B8" : "#8A8D98" }}>{role.dept}</div>
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
