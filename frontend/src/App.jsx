import { subscribeLiveSync, broadcastLiveUpdate } from "./utils/liveSync.js";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  LayoutDashboard, Package, CheckSquare, BarChart3, Settings as SettingsIcon,
  ChevronDown, Search, Bell, Moon, Sun, ClipboardList,
  Calendar, TriangleAlert, ArrowDownRight, Award,
  Users, ShieldCheck, ClipboardCheck, Lightbulb, UserCheck, TrendingUp, Landmark, Factory, RefreshCw,
  PanelLeftClose, PanelLeftOpen, Activity, Volume2, VolumeX
} from "lucide-react";
import { resourcesApi } from "./api.js";
import { getDeviceInfo, getLocationInfo, sanitizeLocationString } from "./utils/deviceLocation.js";
import { playNotificationSound, isSoundEnabled, setSoundEnabled } from "./utils/soundAlert.js";
import {
  ORG_STRUCTURE, ROLE_OPTIONS, STAFF_LIST, seedAttendance, INITIAL_LEAVE_REQUESTS,
  INITIAL_FINANCIALS, INITIAL_CERTIFICATIONS, INITIAL_COMPLIANCES, INITIAL_DEBIT_NOTES, INITIAL_CAPAS,
  INITIAL_ORDERS, INITIAL_NOTIFICATIONS, VAP_SUPPLIERS, buildCostingRows, makeStages, initPreProd,
  NOTIFICATION_PRIORITY_STYLE, formatTimeAgo, DEFAULT_DEPT_DESCRIPTIONS, INITIAL_SUPPLIERS, INITIAL_SUPPLIER_WORK,
  INITIAL_CUSTOM_TASKS, INITIAL_DEPARTMENT_CHECKLISTS, firstNamedAssignee
} from "./constants/loomData.js";
import { statusPill } from "./components/common/CommonUI.jsx";
import { OrderWorkspace } from "./components/order/OrderWorkspace.jsx";
import { Dashboard, MyDepartmentDashboard } from "./components/views/DashboardView.jsx";
import {
  OrdersPage, MyTasksPage, CalendarPage, ApprovalsPage, ProductionPage,
  QualityPage, CompliancePage, AttendancePage, DepartmentsPage, DepartmentDetail, AuditLoggerPage
} from "./components/views/OperationsViews.jsx";
import {
  FinanceEntryPage, ReportsPage, InsightsPage, SupplierPerformancePage,
  NotificationsPage, DebitNotesPage, CapasPage, ExecutiveOverviewPage, EmployeePerformancePanel, SettingsPage
} from "./components/views/InsightsViews.jsx";
import { MyChecklistPage } from "./components/views/MyChecklistPage.jsx";
import { ProjectChatbot } from "./components/ProjectChatbot.jsx";
import CuttingDelayAlertModal from "./components/CuttingDelayAlertModal.jsx";
import { DEFAULT_TEAMS, DEFAULT_USERS, LoginPage, UserAccessPage } from "./components/UserAccess.jsx";

function roleForUser(user, teams, activeDeptOverride = null) {
  const userTeamIds = Array.isArray(user.teamIds) && user.teamIds.length > 0
    ? user.teamIds
    : (user.teamId ? [user.teamId] : []);
  
  const assignedTeams = teams.filter(t => userTeamIds.includes(t.id));
  const primaryTeam = assignedTeams[0] || teams.find(item => item.id === user.teamId) || teams[0] || { name: "User", permissions: ["dashboard"] };
  
  const isManagingDirector = user.isMD === true
    || [user.username, user.name, user.email].some(value => /(^|[^a-z])md([^a-z]|$)|managing director/i.test(String(value || "")));
  
  // Aggregate all departments assigned to this user
  const userDepartments = isManagingDirector
    ? ["Executive (MD)", ...assignedTeams.map(t => t.name)]
    : assignedTeams.length > 0 ? assignedTeams.map(t => t.name) : [primaryTeam.name];

  const effectiveDept = activeDeptOverride && userDepartments.includes(activeDeptOverride)
    ? activeDeptOverride
    : isManagingDirector ? "Executive (MD)" : primaryTeam.name;

  // Merge permissions across all assigned teams
  const mergedPermissions = Array.from(new Set(
    assignedTeams.flatMap(t => t.permissions || [])
  ));
  if (mergedPermissions.length === 0) {
    mergedPermissions.push(...primaryTeam.permissions);
  }

  const hasSettingsAccess = isManagingDirector || mergedPermissions.includes("settings");

  return {
    label: user.name,
    dept: effectiveDept,
    departments: userDepartments,
    isMD: isManagingDirector,
    fullAccess: isManagingDirector || hasSettingsAccess,
    permissions: isManagingDirector
      ? (ROLE_OPTIONS.find(option => option.dept === "Executive")?.fullAccess
        ? ["dashboard", "orders", "tasks", "approvals", "attendance", "reports", "settings"]
        : mergedPermissions)
      : mergedPermissions,
    userId: user.id,
  };
}

const VALID_MODULE_VIEWS = new Set([
  "dashboard",
  "orders",
  "order",
  "tasks",
  "myChecklist",
  "calendar",
  "approvals",
  "departments",
  "departmentDetail",
  "myDepartment",
  "production",
  "quality",
  "compliance",
  "attendance",
  "finance",
  "reports",
  "insights",
  "supplierPerformance",
  "notifications",
  "debitNotes",
  "capas",
  "settings",
  "executiveOverview",
  "employeePerformance"
]);

function parseRouteFromHash(rawHash) {
  const hash = String(rawHash || "").replace(/^#\/?/, "").trim();
  if (!hash) return null;

  const parts = hash.split("/").map(decodeURIComponent).filter(Boolean);
  if (!parts.length) return null;

  const [segment1, ...rest] = parts;

  if (segment1 === "orders" || segment1 === "order") {
    if (rest.length > 0 && rest[0]) {
      return { view: "order", selectedId: rest[0], selectedDept: null };
    }
    return { view: "orders", selectedId: null, selectedDept: null };
  }

  if (segment1 === "departments" || segment1 === "departmentDetail") {
    if (rest.length > 0 && rest[0]) {
      return { view: "departmentDetail", selectedId: null, selectedDept: rest.join("/") };
    }
    return { view: "departments", selectedId: null, selectedDept: null };
  }

  if (VALID_MODULE_VIEWS.has(segment1)) {
    return { view: segment1, selectedId: null, selectedDept: null };
  }

  return null;
}

function getRouteHash(view, selectedId = null, selectedDept = null) {
  if (view === "order" && selectedId) {
    return `#/orders/${encodeURIComponent(selectedId)}`;
  }
  if (view === "departmentDetail" && selectedDept) {
    return `#/departments/${encodeURIComponent(selectedDept)}`;
  }
  if (view === "orders") {
    return `#/orders`;
  }
  if (view === "departments") {
    return `#/departments`;
  }
  return `#/${view || "dashboard"}`;
}

// Persistent read notification tracker: ensures notifications marked read stay read across refreshes and syncs
export function getReadNotificationIds() {
  try {
    const raw = localStorage.getItem("loom_read_notification_ids");
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

export function markIdsAsReadLocally(ids = []) {
  try {
    const set = getReadNotificationIds();
    ids.forEach(id => { if (id) set.add(String(id)); });
    localStorage.setItem("loom_read_notification_ids", JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export function applyReadStatusAndDedupe(notifs = []) {
  if (!Array.isArray(notifs)) return [];
  const readSet = getReadNotificationIds();
  const map = new Map();

  notifs.forEach(n => {
    if (!n) return;
    const key = n.eventKey || n.id;
    if (!key) return;

    const isExplicitlyRead = n.isRead === true || readSet.has(String(n.id)) || (n.eventKey && readSet.has(String(n.eventKey)));
    const normalized = { ...n, isRead: isExplicitlyRead };

    if (!map.has(key)) {
      map.set(key, normalized);
    } else {
      const existing = map.get(key);
      if (normalized.isRead && !existing.isRead) {
        map.set(key, { ...existing, isRead: true });
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export default function LoomPLM() {
  const [orders, setOrders] = useState(() => {
    try {
      const cached = localStorage.getItem("loom_orders_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const initialRoute = useMemo(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      return parseRouteFromHash(window.location.hash);
    }
    return null;
  }, []);

  const [view, setView] = useState(() => initialRoute?.view || "dashboard");
  const [previousView, setPreviousView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(() => initialRoute?.selectedId || null);
  const [selectedDept, setSelectedDept] = useState(() => initialRoute?.selectedDept || null);
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [attendance, setAttendance] = useState(seedAttendance);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const [roster, setRoster] = useState(STAFF_LIST);
  const [orgStructure, setOrgStructure] = useState(() => JSON.parse(JSON.stringify(ORG_STRUCTURE)));
  const [deptDescriptions, setDeptDescriptions] = useState(() => ({ ...DEFAULT_DEPT_DESCRIPTIONS }));
  const [suppliers, setSuppliers] = useState(() => JSON.parse(JSON.stringify(INITIAL_SUPPLIERS)));
  const [supplierWork, setSupplierWork] = useState(() => JSON.parse(JSON.stringify(INITIAL_SUPPLIER_WORK)));

  const [financials, setFinancials] = useState(() => {
    try {
      const cached = localStorage.getItem("loom_financials_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {}
    return INITIAL_FINANCIALS;
  });
  const [certifications, setCertifications] = useState(() => {
    try {
      const cached = localStorage.getItem("loom_certifications_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CERTIFICATIONS;
  });
  const [compliances, setCompliances] = useState(() => {
    try {
      const cached = localStorage.getItem("loom_compliances_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_COMPLIANCES;
  });
  const [debitNotes, setDebitNotes] = useState(() => {
    try {
      const cached = localStorage.getItem("loom_debit_notes_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_DEBIT_NOTES;
  });
  const [capas, setCapas] = useState(() => {
    try {
      const cached = localStorage.getItem("loom_capas_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CAPAS;
  });
  const [customTasks, setCustomTasks] = useState(() => {
    try {
      const cached = localStorage.getItem("loom_custom_tasks_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(INITIAL_CUSTOM_TASKS));
  });
  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem("loom_notifications_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return applyReadStatusAndDedupe(parsed);
      }
    } catch (e) {}
    return applyReadStatusAndDedupe(INITIAL_NOTIFICATIONS);
  });
  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const toggleSound = () => {
    setSoundEnabledState(prev => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) playNotificationSound("medium", true);
      return next;
    });
  };

  const [departmentChecklists, setDepartmentChecklists] = useState(() => {
    try {
      const saved = localStorage.getItem("loom_department_checklists");
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return INITIAL_DEPARTMENT_CHECKLISTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("loom_department_checklists", JSON.stringify(departmentChecklists));
    } catch (e) { }
  }, [departmentChecklists]);

  // Instant local persistence for fast rendering without 0-flash on page refresh
  useEffect(() => {
    try {
      if (Array.isArray(orders) && orders.length > 0) {
        localStorage.setItem("loom_orders_cache", JSON.stringify(orders));
      }
    } catch (e) { }
  }, [orders]);

  useEffect(() => {
    try {
      if (financials) localStorage.setItem("loom_financials_cache", JSON.stringify(financials));
    } catch (e) { }
  }, [financials]);

  useEffect(() => {
    try {
      if (Array.isArray(customTasks)) localStorage.setItem("loom_custom_tasks_cache", JSON.stringify(customTasks));
    } catch (e) { }
  }, [customTasks]);

  useEffect(() => {
    try {
      if (Array.isArray(debitNotes)) localStorage.setItem("loom_debit_notes_cache", JSON.stringify(debitNotes));
    } catch (e) { }
  }, [debitNotes]);

  useEffect(() => {
    try {
      if (Array.isArray(capas)) localStorage.setItem("loom_capas_cache", JSON.stringify(capas));
    } catch (e) { }
  }, [capas]);

  useEffect(() => {
    try {
      if (Array.isArray(certifications)) localStorage.setItem("loom_certifications_cache", JSON.stringify(certifications));
    } catch (e) { }
  }, [certifications]);

  useEffect(() => {
    try {
      if (Array.isArray(compliances)) localStorage.setItem("loom_compliances_cache", JSON.stringify(compliances));
    } catch (e) { }
  }, [compliances]);

  useEffect(() => {
    try {
      if (Array.isArray(notifications)) localStorage.setItem("loom_notifications_cache", JSON.stringify(notifications));
    } catch (e) { }
  }, [notifications]);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notification panel when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [notifOpen]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("loom_sidebar_collapsed") === "true";
    } catch (e) {
      return false;
    }
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("loom_plm_theme") === "dark";
    } catch (e) {
      return false;
    }
  });
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem("loom_audit_logs");
      if (saved) {
        const parsed = JSON.parse(saved);
        return (parsed || []).map(l => ({ ...l, location: sanitizeLocationString(l.location) }));
      }
    } catch (e) {}
    return [];
  });
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [teams, setTeams] = useState(DEFAULT_TEAMS);
  const [accessLoaded, setAccessLoaded] = useState(false);
  const initialViewLoadRef = useRef(false);
  const lastViewFetchRef = useRef({});
  const isSyncingNotifsRef = useRef(false);
  const hasEnsuredTodayLoginRef = useRef(false);
  const [activeUser, setActiveUser] = useState(() => {
    try {
      const saved = localStorage.getItem("loom_active_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
  const [rotation, setRotation] = useState({ enabled: false, intervalMinutes: 2 });
  const [stageComplaints, setStageComplaints] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    try {
      return sessionStorage.getItem("loom_active_session_id") || null;
    } catch (e) {
      return null;
    }
  });

  const isAdmin = Boolean(
    activeUser?.username?.toLowerCase() === "admin" ||
    role?.dept === "Administrators" ||
    activeUser?.teamId === "team-admin"
  );

  const uniqueUsersById = usersList => {
    const seen = new Set();
    return (usersList || []).filter(user => {
      if (!user?.id || seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    });
  };

  const syncUsersToBackend = useCallback(async (nextUsers) => {
    try {
      const existing = await resourcesApi.list("users");
      const nextIds = new Set((nextUsers || []).map(user => user.id));

      await Promise.all(
        (existing || []).filter(user => !nextIds.has(user.id)).map(user => resourcesApi.remove("users", user.id))
      );

      await Promise.all(
        (nextUsers || []).map(user => {
          const existingUser = (existing || []).find(item => item.id === user.id);
          return existingUser
            ? resourcesApi.update("users", user.id, user)
            : resourcesApi.create("users", user);
        })
      );
    } catch (e) {
      console.warn("Failed to sync users to backend:", e.message);
    }
  }, []);

  const syncTeamsToBackend = useCallback(async (nextTeams) => {
    try {
      const existing = await resourcesApi.list("teams");
      const nextIds = new Set((nextTeams || []).map(team => team.id));

      await Promise.all(
        (existing || []).filter(team => !nextIds.has(team.id)).map(team => resourcesApi.remove("teams", team.id))
      );

      await Promise.all(
        (nextTeams || []).map(team => resourcesApi.create("teams", team))
      );
    } catch (e) {
      console.warn("Failed to sync teams to backend:", e.message);
    }
  }, []);

  const syncRotationToBackend = useCallback(async (nextRotation) => {
    try {
      const existing = await resourcesApi.list("dashboard_rotation");
      await Promise.all(
        (existing || []).map(record => resourcesApi.remove("dashboard_rotation", record.id || record.key))
      );
      await resourcesApi.create("dashboard_rotation", { id: "dashboard_rotation", ...nextRotation });
    } catch (e) {
      console.warn("Failed to sync dashboard rotation to backend:", e.message);
    }
  }, []);

  const loadAccessState = useCallback(async () => {
    try {
      const [userRes, teamRes, rotationRes] = await Promise.all([
        resourcesApi.list("users"),
        resourcesApi.list("teams"),
        resourcesApi.list("dashboard_rotation")
      ]);

      if (Array.isArray(userRes) && userRes.length) {
        const loadedUsers = uniqueUsersById(userRes);
        const existingIds = new Set(loadedUsers.map(user => user.id));
        setUsers(prev => {
          const next = [...loadedUsers, ...DEFAULT_USERS.filter(user => !existingIds.has(user.id))];
          return uniqueUsersById(next);
        });
      }

      if (Array.isArray(teamRes) && teamRes.length) {
        const existingNames = new Set(teamRes.map(team => team.name.toLowerCase()));
        const missingDefaults = DEFAULT_TEAMS.filter(team => !existingNames.has(team.name.toLowerCase()));
        setTeams([...teamRes, ...missingDefaults]);
      }

      if (Array.isArray(rotationRes) && rotationRes.length) {
        const rotationRecord = rotationRes[0];
        setRotation(prev => ({ ...prev, ...rotationRecord }));
      }
    } catch (e) {
      console.warn("Failed to load access state from backend:", e.message);
    }
  }, []);

  // Global Theme Effect
  useEffect(() => {
    try {
      localStorage.setItem("loom_plm_theme", isDarkMode ? "dark" : "light");
    } catch (e) { }
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("dark-theme");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.body.classList.remove("dark-theme");
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
      localStorage.setItem("loom_sidebar_collapsed", String(isSidebarCollapsed));
    } catch (e) { }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadAccessState();
      if (!cancelled) {
        setAccessLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [loadAccessState]);

  useEffect(() => {
    if (activeUser) {
      setRole(roleForUser(activeUser, teams));
    }
  }, [teams, activeUser]);

  // Ensure returning logged-in users have an active tab session and today's login audit log registered
  useEffect(() => {
    if (!activeUser?.name || hasEnsuredTodayLoginRef.current) return;
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);
    const existingSessionId = sessionStorage.getItem("loom_active_session_id");

    const dev = getDeviceInfo();
    const currentRole = roleForUser(activeUser, teams);

    // 1. Ensure user has an active session ID for this browser tab
    let sessId = existingSessionId;
    if (sessId) {
      setCurrentSessionId(sessId);
      setUserSessions(prev => {
        const existing = prev.find(s => s.id === sessId);
        const resumedSession = existing && existing.userId === activeUser.id
          ? {
              ...existing,
              active: true,
              logoutTime: null,
              lastHeartbeat: nowIso,
              date: todayStr
            }
          : {
              id: sessId,
              userId: activeUser.id,
              username: activeUser.username,
              name: activeUser.name,
              dept: currentRole.dept,
              loginTime: nowIso,
              logoutTime: null,
              lastHeartbeat: nowIso,
              hoursUsed: 0.01,
              active: true,
              date: todayStr,
              device: dev.deviceSummary,
              deviceType: dev.deviceType,
              location: "Detecting..."
            };
        const updated = existing && existing.userId === activeUser.id
          ? prev.map(s => s.id === sessId ? resumedSession : s)
          : [resumedSession, ...prev.filter(s => s.id !== sessId)];
        if (window.storage) window.storage.set("user_sessions", JSON.stringify(updated), true);
        broadcastLiveUpdate({ type: "USER_SESSION_UPDATE", session: resumedSession });
        return updated;
      });
    }
    if (!sessId) {
      sessId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setCurrentSessionId(sessId);
      try { sessionStorage.setItem("loom_active_session_id", sessId); } catch (e) {}

      const newSession = {
        id: sessId,
        userId: activeUser.id,
        username: activeUser.username,
        name: activeUser.name,
        dept: currentRole.dept,
        loginTime: nowIso,
        logoutTime: null,
        lastHeartbeat: nowIso,
        hoursUsed: 0.01,
        active: true,
        date: todayStr,
        device: dev.deviceSummary,
        deviceType: dev.deviceType,
        location: "Detecting..."
      };

      setUserSessions(prev => {
        const updated = [newSession, ...prev.filter(s => s.id !== sessId)];
        if (window.storage) window.storage.set("user_sessions", JSON.stringify(updated), true);
        return updated;
      });

      broadcastLiveUpdate({
        type: "USER_SESSION_UPDATE",
        session: newSession
      });
    }

    // 2. Ensure a LOGIN audit event exists for this user today so "Logins Today" is never 0
    const hasLoginToday = auditLogs.some(l =>
      l.eventType === "LOGIN" &&
      (l.username === activeUser.username || l.userName === activeUser.name) &&
      (l.timestamp || "").startsWith(todayStr)
    );

    if (!hasLoginToday) {
      hasEnsuredTodayLoginRef.current = true;
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const logEntry = {
        id: logId,
        timestamp: nowIso,
        eventType: "LOGIN",
        action: `${activeUser.name} logged into the application from ${dev.deviceType} (${dev.os} · ${dev.browser})`,
        userName: activeUser.name,
        username: activeUser.username,
        userDept: currentRole.dept,
        device: dev.deviceSummary,
        deviceType: dev.deviceType,
        location: "Detecting...",
        targetId: activeUser.id
      };

      setAuditLogs(prevLogs => {
        const updatedLogs = [logEntry, ...prevLogs.slice(0, 499)];
        try {
          localStorage.setItem("loom_audit_logs", JSON.stringify(updatedLogs));
          if (window.storage?.set) window.storage.set("audit_logs", JSON.stringify(updatedLogs), true);
        } catch (e) {}
        return updatedLogs;
      });

      getLocationInfo().then(loc => {
        const resolvedLocation = sanitizeLocationString(loc.location);
        setUserSessions(prev => {
          const updated = prev.map(s => s.id === sessId ? { ...s, location: resolvedLocation } : s);
          if (window.storage) window.storage.set("user_sessions", JSON.stringify(updated), true);
          return updated;
        });
        setAuditLogs(prevLogs => {
          const updatedLogs = prevLogs.map(l => l.id === logId ? { ...l, location: resolvedLocation } : l);
          try {
            localStorage.setItem("loom_audit_logs", JSON.stringify(updatedLogs));
            if (window.storage?.set) window.storage.set("audit_logs", JSON.stringify(updatedLogs), true);
          } catch (e) {}
          return updatedLogs;
        });
      });
    } else {
      hasEnsuredTodayLoginRef.current = true;
    }
  }, [activeUser, teams, auditLogs]);

  useEffect(() => {
    if (!rotation.enabled || !activeUser || users.length < 2) return undefined;
    const timer = window.setInterval(() => {
      const currentIndex = users.findIndex(user => user.id === activeUser.id);
      const nextUser = users[(currentIndex + 1) % users.length];
      if (!nextUser) return;
      setActiveUser(nextUser);
      setRole(roleForUser(nextUser, teams));
      navigate("dashboard");
      try { localStorage.setItem("loom_active_user", JSON.stringify(nextUser)); } catch (e) { }
    }, rotation.intervalMinutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [rotation, activeUser, users, teams]);

  // Deduplicate and normalize orders, merging any phantom duplicates (ord_<baseId>_<hash>) into their real parent orders
  // Deduplicate and normalize orders, merging any phantom duplicates (ord_<baseId>_<hash>) into their real parent orders
  const normalizeAndDeduplicateOrders = (rawOrders, prev = []) => {
    if (!Array.isArray(rawOrders)) return [];
    const realOrders = rawOrders.filter(bo => !["GKT-1054", "ST-7788", "JKT-2231", "TR-8899", "DR-5566", "PL-3321"].includes(bo.id));

    // Extract underlying base ID from any order ID string
    const cleanBaseId = (idStr) => {
      let str = String(idStr || "").trim();
      while (str.startsWith("ord_")) {
        str = str.replace(/^ord_/, "");
      }
      str = str.replace(/_[a-z0-9]{4,12}$/i, "");
      return str.trim();
    };

    // Group raw orders by their canonical uppercase base ID
    const groups = new Map();
    const phantomIdsToDelete = [];

    realOrders.forEach(bo => {
      const rawId = String(bo.id || bo.orderId || bo.primaryId || "");
      const baseKey = cleanBaseId(rawId).toUpperCase();
      if (!baseKey) return;

      if (!groups.has(baseKey)) {
        groups.set(baseKey, []);
      }
      groups.get(baseKey).push(bo);

      if (rawId.startsWith("ord_") || /_[a-z0-9]{4,12}$/i.test(rawId)) {
        phantomIdsToDelete.push(rawId);
      }
    });

    // Permanently clean phantom duplicate documents from backend asynchronously
    if (phantomIdsToDelete.length > 0) {
      phantomIdsToDelete.forEach(dId => {
        resourcesApi.delete("orders", dId, "?permanent=true").catch(() => {});
      });
    }

    const mergedList = [];
    groups.forEach((orderList, baseKey) => {
      // Pick best canonical base
      const sorted = [...orderList].sort((a, b) => {
        const aIsClean = !String(a.id || "").startsWith("ord_") && !/_[a-z0-9]{4,12}$/i.test(String(a.id || ""));
        const bIsClean = !String(b.id || "").startsWith("ord_") && !/_[a-z0-9]{4,12}$/i.test(String(b.id || ""));
        if (aIsClean && !bIsClean) return -1;
        if (!aIsClean && bIsClean) return 1;
        return 0;
      });

      const canonicalBase = sorted[0];
      const existing = prev.find(p => cleanBaseId(p.id).toUpperCase() === baseKey || cleanBaseId(p.primaryId).toUpperCase() === baseKey);

      // Merge attributes across any duplicates
      const mergedOrder = { ...canonicalBase };
      mergedOrder.id = cleanBaseId(canonicalBase.id) || baseKey;
      mergedOrder.primaryId = mergedOrder.id;
      mergedOrder.orderId = mergedOrder.id;

      for (let i = 1; i < sorted.length; i++) {
        const other = sorted[i];
        if (Array.isArray(other.stages) && Array.isArray(mergedOrder.stages)) {
          other.stages.forEach((dStage, idx) => {
            const mStage = mergedOrder.stages[idx];
            if (dStage.status === "done" && mStage && mStage.status !== "done") {
              mergedOrder.stages[idx] = { ...dStage };
            }
          });
        }
        if (other.status && other.status !== "On Track") mergedOrder.status = other.status;
        if (other.completed && !mergedOrder.completed) {
          mergedOrder.completed = true;
          mergedOrder.completedAt = other.completedAt || new Date().toISOString();
        }
        if (other.isDeleted && !mergedOrder.isDeleted) {
          mergedOrder.isDeleted = true;
          mergedOrder.deletedAt = other.deletedAt || new Date().toISOString();
        }
      }

      const resolvedTemplate = mergedOrder.template || existing?.template || "90";
      const expectedStageCount = makeStages(resolvedTemplate, 0, null).length;

      mergedList.push({
        ...existing,
        ...mergedOrder,
        id: mergedOrder.id,
        primaryId: mergedOrder.id,
        orderId: mergedOrder.id,
        completed: mergedOrder.completed ?? existing?.completed ?? false,
        isDeleted: mergedOrder.isDeleted ?? existing?.isDeleted ?? false,
        completedAt: mergedOrder.completedAt || existing?.completedAt || null,
        deletedAt: mergedOrder.deletedAt || existing?.deletedAt || null,
        template: resolvedTemplate,
        costingTemplate: mergedOrder.costingTemplate || existing?.costingTemplate || "fabric",
        costingRows: mergedOrder.costingRows || existing?.costingRows || buildCostingRows(mergedOrder.costingTemplate || existing?.costingTemplate || "fabric"),
        vapCount: mergedOrder.vapCount ?? existing?.vapCount ?? 1,
        shippedQty: mergedOrder.shippedQty ?? existing?.shippedQty ?? 0,
        plannedCost: mergedOrder.plannedCost ?? existing?.plannedCost ?? 0,
        actualCost: mergedOrder.actualCost ?? existing?.actualCost ?? 0,
        stages: ((mergedOrder.stages && mergedOrder.stages.length === expectedStageCount)
          ? mergedOrder.stages
          : (existing?.stages && existing.stages.length === expectedStageCount)
            ? existing.stages
            : makeStages(resolvedTemplate, 0, null)).map((s, sIdx) => {
              const existingStage = existing?.stages?.[sIdx];
              return {
                ...s,
                status: s.status || existingStage?.status || "pending",
                reason: s.reason !== undefined ? s.reason : (existingStage?.reason || null),
                completedAt: s.completedAt || existingStage?.completedAt || (s.status === "done" ? (existingStage?.completedAt || new Date().toISOString()) : undefined),
                completedBy: s.completedBy || existingStage?.completedBy || undefined,
                updatedAt: s.updatedAt || existingStage?.updatedAt || undefined,
                updatedBy: s.updatedBy || existingStage?.updatedBy || undefined,
                flaggedAt: s.flaggedAt || existingStage?.flaggedAt || undefined,
                delayedDate: s.delayedDate || existingStage?.delayedDate || undefined,
                revisedDateStr: s.revisedDateStr || existingStage?.revisedDateStr || undefined,
                colourways: Array.isArray(s.colourways) && s.colourways.length > 0 ? s.colourways : (existingStage?.colourways || s.colourways)
              };
            }),
        preProd: mergedOrder.preProd || existing?.preProd || initPreProd(),
      });
    });

    // Strictly one single item per uppercase base order ID
    const resultMap = new Map();
    mergedList.forEach(item => {
      const key = cleanBaseId(item.id).toUpperCase();
      if (key) resultMap.set(key, item);
    });

    return Array.from(resultMap.values());
  };

  // Master refresh function to pull fresh data from backend and storage
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());

  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Concurrently fetch access state, orders, debit notes, capas, tasks, certs, compliances, notifs, financials, and staff
      const [
        accessRes,
        ordersRes,
        debitRes,
        capasRes,
        tasksRes,
        certsRes,
        compliancesRes,
        notifsRes,
        financialsRes,
        staffRes,
      ] = await Promise.allSettled([
        loadAccessState(),
        resourcesApi.list("orders", "?all=true"),
        resourcesApi.list("debitNotes"),
        resourcesApi.list("capas"),
        resourcesApi.list("tasks"),
        resourcesApi.list("certifications", "?all=true"),
        resourcesApi.list("compliances", "?all=true"),
        resourcesApi.list("notifications", "?all=true"),
        resourcesApi.list("financials"),
        resourcesApi.list("staff"),
      ]);

      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)) {
        setOrders(prev => normalizeAndDeduplicateOrders(ordersRes.value, prev));
      }

      if (debitRes.status === "fulfilled" && Array.isArray(debitRes.value) && debitRes.value.length > 0) {
        setDebitNotes(debitRes.value.filter(d => d.isDeleted !== true));
      }

      if (capasRes.status === "fulfilled" && Array.isArray(capasRes.value) && capasRes.value.length > 0) {
        setCapas(capasRes.value.filter(c => c.isDeleted !== true));
      }

      if (tasksRes.status === "fulfilled" && Array.isArray(tasksRes.value) && tasksRes.value.length > 0) {
        setCustomTasks(tasksRes.value.filter(t => t.isDeleted !== true));
      }

      if (certsRes.status === "fulfilled" && Array.isArray(certsRes.value) && certsRes.value.length > 0) {
        setCertifications(certsRes.value);
      }

      if (compliancesRes.status === "fulfilled" && Array.isArray(compliancesRes.value) && compliancesRes.value.length > 0) {
        setCompliances(compliancesRes.value.filter(c => c.id !== "comp-2" && !c.name?.toLowerCase().includes("buyer chemical restriction")));
      }

      if (notifsRes.status === "fulfilled" && Array.isArray(notifsRes.value) && notifsRes.value.length > 0) {
        setNotifications(prev => applyReadStatusAndDedupe([...notifsRes.value, ...prev]));
      }

      if (financialsRes.status === "fulfilled" && Array.isArray(financialsRes.value) && financialsRes.value.length > 0) {
        const fin = financialsRes.value[0];
        if (fin) setFinancials(prev => ({ ...prev, ...fin }));
      }

      // 2. Concurrently load all storage items if available
      if (window.storage && window.storage.get) {
        const storageKeys = [
          "staff_roster", "org_structure", "dept_descriptions", "attendance",
          "certifications", "compliances", "notifications", "leaveRequests",
          "suppliers", "supplierWork", "stage_complaints", "user_sessions", "audit_logs"
        ];
        const storageResults = await Promise.allSettled(storageKeys.map(k => window.storage.get(k, true)));
        const storageMap = {};
        storageKeys.forEach((key, idx) => {
          if (storageResults[idx].status === "fulfilled" && storageResults[idx].value?.value) {
            try {
              storageMap[key] = JSON.parse(storageResults[idx].value.value);
            } catch (e) {}
          }
        });

        let baseRoster = storageMap.staff_roster || null;
        if (staffRes.status === "fulfilled" && Array.isArray(staffRes.value) && staffRes.value.length > 0) {
          const active = staffRes.value.filter(s => s.isDeleted !== true);
          const merged = [...(baseRoster || STAFF_LIST)];
          active.forEach(as => {
            if (!merged.some(m => m.name === as.name)) {
              merged.push({ name: as.name, title: as.title || "Staff", dept: as.dept || "Merchandising" });
            }
          });
          baseRoster = merged;
        }
        const DEMO_NAMES = new Set(["Arasinth Raja", "Suresh", "Durai", "Praveen Kumar", "Gopal", "Sezhiyan", "Murugan", "Karthik", "Ravi", "Kavitha", "Selva Kumar", "Ramesh", "Priya", "Anand", "Rajesh"]);
        if (Array.isArray(baseRoster)) {
          const cleanRoster = baseRoster.filter(s => s.name && s.name !== "—" && !DEMO_NAMES.has(s.name));
          setRoster(cleanRoster);
        }

        if (storageMap.org_structure) setOrgStructure(storageMap.org_structure);
        if (storageMap.dept_descriptions && typeof storageMap.dept_descriptions === "object") {
          setDeptDescriptions(prev => ({ ...prev, ...storageMap.dept_descriptions }));
        }
        if (storageMap.attendance && typeof storageMap.attendance === "object") {
          const cleanAtt = {};
          Object.keys(storageMap.attendance).forEach(k => {
            if (!DEMO_NAMES.has(k) && k !== "—") cleanAtt[k] = storageMap.attendance[k];
          });
          setAttendance(cleanAtt);
        }
        if (Array.isArray(storageMap.certifications) && storageMap.certifications.length > 0) {
          setCertifications(prev => {
            const map = new Map(prev.map(item => [item.id || item.key, item]));
            storageMap.certifications.forEach(item => map.set(item.id || item.key, { ...map.get(item.id || item.key), ...item }));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(storageMap.compliances) && storageMap.compliances.length > 0) {
          setCompliances(prev => {
            const map = new Map(prev.map(item => [item.id, item]));
            storageMap.compliances.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(storageMap.notifications) && storageMap.notifications.length > 0) {
          setNotifications(prev => applyReadStatusAndDedupe([...storageMap.notifications, ...prev]));
        }
        if (Array.isArray(storageMap.leaveRequests)) {
          setLeaveRequests(storageMap.leaveRequests.filter(l => !DEMO_NAMES.has(l.name)));
        }
        if (Array.isArray(storageMap.suppliers) && storageMap.suppliers.length > 0) {
          setSuppliers(prev => {
            const map = new Map(prev.map(item => [item.id || item.name, item]));
            storageMap.suppliers.forEach(item => map.set(item.id || item.name, { ...map.get(item.id || item.name), ...item }));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(storageMap.supplierWork) && storageMap.supplierWork.length > 0) {
          setSupplierWork(prev => {
            const map = new Map(prev.map(item => [item.id, item]));
            storageMap.supplierWork.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
            return Array.from(map.values());
          });
        }
        if (Array.isArray(storageMap.stage_complaints)) {
          setStageComplaints(storageMap.stage_complaints);
        }
        if (Array.isArray(storageMap.user_sessions)) {
          const browserSessionId = currentSessionId || sessionStorage.getItem("loom_active_session_id");
          const cleaned = storageMap.user_sessions.map(s => {
            const isCurrentBrowserSession = browserSessionId && s.id === browserSessionId && s.userId === activeUser?.id;
            return {
              ...s,
              ...(isCurrentBrowserSession ? { active: true, logoutTime: null, lastHeartbeat: new Date().toISOString() } : {}),
              location: sanitizeLocationString(s.location)
            };
          });
          if (browserSessionId) {
            const currentSession = cleaned.find(s => s.id === browserSessionId);
            if (currentSession && window.storage) window.storage.set("user_sessions", JSON.stringify(cleaned), true);
          }
          setUserSessions(cleaned);
        }
        if (Array.isArray(storageMap.audit_logs)) {
          const cleaned = storageMap.audit_logs.map(l => ({ ...l, location: sanitizeLocationString(l.location) }));
          setAuditLogs(cleaned);
        }
      }
    } catch (e) {
      console.warn("refreshAllData error:", e);
    } finally {
      setLastRefreshedAt(new Date());
      setIsRefreshing(false);
    }
  }, [loadAccessState, activeUser, currentSessionId]);

  // Heartbeat to accurately track session hours used. A page refresh must not be treated as logout;
  // explicit sign-out below is the only action that closes the session.
  useEffect(() => {
    if (!currentSessionId || !activeUser) return undefined;

    const interval = setInterval(() => {
      const nowIso = new Date().toISOString();
      let updatedHeartbeatSession = null;
      setUserSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === currentSessionId && s.active) {
            const loginMs = new Date(s.loginTime).getTime();
            const nowMs = new Date(nowIso).getTime();
            const hours = Math.max(0.01, Number(((nowMs - loginMs) / (1000 * 60 * 60)).toFixed(2)));
            updatedHeartbeatSession = { ...s, lastHeartbeat: nowIso, hoursUsed: hours };
            return updatedHeartbeatSession;
          }
          return s;
        });
        if (window.storage) window.storage.set("user_sessions", JSON.stringify(updated), true);
        return updated;
      });
      if (updatedHeartbeatSession) {
        broadcastLiveUpdate({
          type: "USER_SESSION_UPDATE",
          session: updatedHeartbeatSession
        });
      }
    }, 25000);

    return () => {
      clearInterval(interval);
    };
  }, [currentSessionId, activeUser]);

  // Live WebSocket & BroadcastChannel subscription across tabs and users
  useEffect(() => {
    const unsubscribe = subscribeLiveSync((event) => {
      if (!event) return;

      // 1. Handle storage changes broadcast from server or peer tabs
      if (event.type === "STORAGE_CHANGE") {
        if (event.key === "user_sessions" && event.value) {
          try {
            const parsed = typeof event.value === "string" ? JSON.parse(event.value) : event.value;
            if (Array.isArray(parsed)) {
              let storedUser = null;
              try {
                storedUser = JSON.parse(localStorage.getItem("loom_active_user") || "null");
              } catch (e) {}
              const browserSessionId = sessionStorage.getItem("loom_active_session_id");
              const nowIso = new Date().toISOString();
              setUserSessions(parsed.map(s => ({
                ...s,
                ...(browserSessionId && s.id === browserSessionId && s.userId === storedUser?.id
                  ? { active: true, logoutTime: null, lastHeartbeat: nowIso }
                  : {}),
                location: sanitizeLocationString(s.location)
              })));
            }
          } catch (e) {}
        } else if (event.key === "audit_logs" && event.value) {
          try {
            const parsed = typeof event.value === "string" ? JSON.parse(event.value) : event.value;
            if (Array.isArray(parsed)) {
              setAuditLogs(parsed.map(l => ({ ...l, location: sanitizeLocationString(l.location) })));
            }
          } catch (e) {}
        } else if (event.key === "notifications" && event.value) {
          try {
            const parsed = typeof event.value === "string" ? JSON.parse(event.value) : event.value;
            if (Array.isArray(parsed)) setNotifications(prev => applyReadStatusAndDedupe([...parsed, ...prev]));
          } catch (e) {}
        } else if (event.key === "attendance" && event.value) {
          try {
            const parsed = typeof event.value === "string" ? JSON.parse(event.value) : event.value;
            if (parsed && typeof parsed === "object") setAttendance(parsed);
          } catch (e) {}
        }
      }

      // 2. Handle direct user session updates (login, heartbeat, logout)
      if (event.type === "USER_SESSION_UPDATE" && event.session?.id) {
        setUserSessions(prev => {
          const map = new Map(prev.map(s => [s.id, s]));
          const prevSess = map.get(event.session.id) || {};
          map.set(event.session.id, { ...prevSess, ...event.session, location: sanitizeLocationString(event.session.location || prevSess.location) });
          return Array.from(map.values()).sort((a, b) => new Date(b.loginTime || 0) - new Date(a.loginTime || 0));
        });
      }

      // 3. Handle live order stage updates
      if (event.type === "ORDER_STAGE_UPDATE" && event.orderId) {
        setOrders(prev => prev.map(o => {
          if (o.id === event.orderId || o.primaryId === event.orderId) {
            return {
              ...o,
              stages: event.stages || o.stages,
              status: event.status || o.status,
              completed: event.completed !== undefined ? event.completed : o.completed
            };
          }
          return o;
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshUserSessions = useCallback(async () => {
    if (!window.storage?.get) return;
    try {
      const [sessRes, logsRes] = await Promise.allSettled([
        window.storage.get("user_sessions", true),
        window.storage.get("audit_logs", true)
      ]);
      if (sessRes.status === "fulfilled" && sessRes.value?.value) {
        try {
          const parsed = typeof sessRes.value.value === "string" ? JSON.parse(sessRes.value.value) : sessRes.value.value;
          if (Array.isArray(parsed)) {
            const browserSessionId = currentSessionId || sessionStorage.getItem("loom_active_session_id");
            const resumedAt = new Date().toISOString();
            setUserSessions(parsed.map(s => ({
              ...s,
              ...(browserSessionId && s.id === browserSessionId && s.userId === activeUser?.id ? { active: true, logoutTime: null, lastHeartbeat: resumedAt } : {}),
              location: sanitizeLocationString(s.location)
            })));
          }
        } catch (e) {}
      }
      if (logsRes.status === "fulfilled" && logsRes.value?.value) {
        try {
          const parsed = typeof logsRes.value.value === "string" ? JSON.parse(logsRes.value.value) : logsRes.value.value;
          if (Array.isArray(parsed)) {
            setAuditLogs(parsed.map(l => ({ ...l, location: sanitizeLocationString(l.location) })));
          }
        } catch (e) {}
      }
    } catch (e) {}
  }, [activeUser, currentSessionId]);

  // Periodic full refresh only for authenticated users; module-specific live data is loaded on navigation.
  useEffect(() => {
    if (!activeUser) return undefined;

    // 5 minutes = 5 * 60 * 1000 = 300,000 ms
    const autoRefreshInterval = setInterval(() => {
      refreshAllData();
    }, 5 * 60 * 1000);

    return () => clearInterval(autoRefreshInterval);
  }, [refreshAllData, activeUser]);

  useEffect(() => {
    if (!activeUser) return undefined;

    let cancelled = false;

    const syncNotifications = async () => {
      // Don't poll if browser tab is hidden or a sync is already running
      if (typeof document !== "undefined" && document.hidden) return;
      if (isSyncingNotifsRef.current) return;
      isSyncingNotifsRef.current = true;

      try {
        const dbNotifs = await resourcesApi.list("notifications", "?all=true");
        if (!Array.isArray(dbNotifs) || cancelled) return;

        setNotifications(prev => applyReadStatusAndDedupe([...dbNotifs, ...prev]));
      } catch (e) {
        if (!cancelled) {
          console.warn("Notification polling failed:", e.message);
        }
      } finally {
        isSyncingNotifsRef.current = false;
      }
    };

    syncNotifications();
    const pollInterval = setInterval(syncNotifications, 25000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [activeUser]);

  const loadViewData = useCallback(async (targetView) => {
    if (!activeUser || !targetView) return;

    // Throttle: don't reload the same view data if loaded in the last 30 seconds
    const now = Date.now();
    const lastFetch = lastViewFetchRef.current[targetView] || 0;
    if (now - lastFetch < 30000) {
      return;
    }
    lastViewFetchRef.current[targetView] = now;

    try {
      if (["dashboard", "orders", "tasks", "approvals", "departments", "calendar", "reports", "compliance", "supplierPerformance", "finance", "myDepartment", "executiveOverview"].includes(targetView)) {
        const backendOrders = await resourcesApi.list("orders", "?all=true");
        if (Array.isArray(backendOrders)) {
          setOrders(prev => normalizeAndDeduplicateOrders(backendOrders, prev));
        }
      }

      if (["tasks", "supplierPerformance"].includes(targetView)) {
        const dbTasks = await resourcesApi.list("tasks");
        if (Array.isArray(dbTasks)) {
          setCustomTasks(dbTasks.filter(t => t.isDeleted !== true));
        }
      }

      if (targetView === "notifications") {
        const dbNotifs = await resourcesApi.list("notifications", "?all=true");
        if (Array.isArray(dbNotifs)) {
          setNotifications(prev => applyReadStatusAndDedupe([...dbNotifs, ...prev]));
        }
      }

      if (targetView === "compliance") {
        const [dbCerts, dbCompliances] = await Promise.all([
          resourcesApi.list("certifications", "?all=true"),
          resourcesApi.list("compliances", "?all=true")
        ]);

        if (Array.isArray(dbCerts) && dbCerts.length > 0) {
          setCertifications(dbCerts);
        }

        if (Array.isArray(dbCompliances) && dbCompliances.length > 0) {
          setCompliances(dbCompliances.filter(c => c.id !== "comp-2" && !c.name?.toLowerCase().includes("buyer chemical restriction")));
        }
      }

      if (targetView === "debitNotes") {
        const dbDebit = await resourcesApi.list("debitNotes");
        if (Array.isArray(dbDebit) && dbDebit.length > 0) {
          setDebitNotes(dbDebit.filter(d => d.isDeleted !== true));
        }
      }

      if (targetView === "capas") {
        const dbCapas = await resourcesApi.list("capas");
        if (Array.isArray(dbCapas) && dbCapas.length > 0) {
          setCapas(dbCapas.filter(c => c.isDeleted !== true));
        }
      }

      if (targetView === "attendance") {
        const [dbStaff, dbLeave] = await Promise.all([
          resourcesApi.list("staff"),
          resourcesApi.list("leaveRequests")
        ]);

        if (Array.isArray(dbStaff) && dbStaff.length > 0) {
          const active = dbStaff.filter(s => s.isDeleted !== true);
          const merged = [...STAFF_LIST];
          active.forEach(as => {
            if (!merged.some(m => m.name === as.name)) {
              merged.push({ name: as.name, title: as.title || "Staff", dept: as.dept || "Merchandising" });
            }
          });
          setRoster(merged.filter(s => s.name && s.name !== "—"));
        }

        if (Array.isArray(dbLeave) && dbLeave.length > 0) {
          setLeaveRequests(dbLeave.filter(l => l.isDeleted !== true));
        }
      }

      if (targetView === "supplierPerformance") {
        const [dbSuppliers, dbSupplierWork] = await Promise.all([
          resourcesApi.list("suppliers"),
          resourcesApi.list("supplierWork")
        ]);

        if (Array.isArray(dbSuppliers) && dbSuppliers.length > 0) {
          setSuppliers(dbSuppliers.filter(s => s.isDeleted !== true));
        }

        if (Array.isArray(dbSupplierWork) && dbSupplierWork.length > 0) {
          setSupplierWork(dbSupplierWork.filter(w => w.isDeleted !== true));
        }
      }

      if (targetView === "auditLogs" || targetView === "attendance") {
        await refreshUserSessions();
      }
    } catch (e) {
      console.warn("Failed to load module data:", e.message);
    }
  }, [activeUser, refreshUserSessions]);

  useEffect(() => {
    if (!activeUser) {
      initialViewLoadRef.current = false;
      return;
    }

    if (accessLoaded && !initialViewLoadRef.current) {
      refreshAllData();
      initialViewLoadRef.current = true;
    }
  }, [accessLoaded, activeUser, refreshAllData]);

  // Route Synchronization: listen to window.location.hash changes (browser back/forward or manual hash change)
  useEffect(() => {
    if (!activeUser) return;

    const handleHashChange = () => {
      const parsed = parseRouteFromHash(window.location.hash);
      if (parsed && parsed.view) {
        setView(prevView => {
          if (prevView !== parsed.view) {
            setPreviousView(prevView);
          }
          return parsed.view;
        });
        setSelectedId(parsed.selectedId);
        setSelectedDept(parsed.selectedDept);
        loadViewData(parsed.view);
      } else if (!window.location.hash || window.location.hash === "#" || window.location.hash === "#/") {
        const defaultView = (role?.dept === "Executive" || role?.dept === "Executive (MD)") ? "executiveOverview" : "dashboard";
        setView(defaultView);
        setSelectedId(null);
        setSelectedDept(null);
        const targetHash = getRouteHash(defaultView);
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
        loadViewData(defaultView);
      }
    };

    // On initial mount with active user, ensure hash is aligned with current view
    if (!window.location.hash || window.location.hash === "#" || window.location.hash === "#/") {
      const defaultView = (role?.dept === "Executive" || role?.dept === "Executive (MD)") ? "executiveOverview" : "dashboard";
      const targetHash = getRouteHash(view || defaultView, selectedId, selectedDept);
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    } else {
      handleHashChange();
    }

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [activeUser, loadViewData, role?.dept]);

  // Central Notification Dispatcher with Deduplication
  const pushNotification = (notif) => {
    // RESTRICTION: Only assigned tasks or mentioned names should trigger notifications/alerts!
    // All other operational events (order creation, deletion, completion, etc.) are captured in eventlogger only.
    const isTaskAssignment = notif.type === "task" ||
      notif.type === "assigned" ||
      notif.type === "assignment" ||
      notif.isTask === true ||
      (notif.title && (
        notif.title.toLowerCase().includes("task assigned") ||
        notif.title.toLowerCase().includes("assigned") ||
        notif.title.toLowerCase().includes("work assigned")
      )) ||
      Boolean(notif.assignee || notif.targetUser);

    const isMention = notif.type === "mention" ||
      notif.isMention === true ||
      (notif.title && notif.title.toLowerCase().includes("mention")) ||
      (notif.message && notif.message.includes("@"));

    if (!isTaskAssignment && !isMention) {
      return;
    }

    const id = notif.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const eventKey = notif.eventKey || `${notif.type}-${notif.relatedId || id}`;
    const newNotif = {
      id,
      eventKey,
      type: notif.type || "task",
      title: notif.title || "Notification",
      message: notif.message || "",
      relatedModule: notif.relatedModule || "tasks",
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
      playNotificationSound(newNotif.priority);
      const updated = applyReadStatusAndDedupe([newNotif, ...prev]);
      if (window.storage) window.storage.set("notifications", JSON.stringify(updated.slice(0, 300)), true);
      return updated;
    });

    try {
      resourcesApi.create("notifications", newNotif).catch(() => { });
    } catch (e) { }
  };

  const markNotificationAsRead = (id) => {
    markIdsAsReadLocally([id]);
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id || n.eventKey === id) ? { ...n, isRead: true } : n);
      if (window.storage) window.storage.set("notifications", JSON.stringify(updated.slice(0, 300)), true);
      return updated;
    });
    try {
      resourcesApi.patch("notifications", id, { isRead: true }).catch(() => { });
    } catch (e) { }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const allIds = [];
      const updated = prev.map(n => {
        if (n.id) allIds.push(n.id);
        if (n.eventKey) allIds.push(n.eventKey);
        return { ...n, isRead: true };
      });
      markIdsAsReadLocally(allIds);
      if (window.storage) window.storage.set("notifications", JSON.stringify(updated.slice(0, 300)), true);
      return updated;
    });
    try {
      resourcesApi.post("notifications/mark-all-read", {}).catch(() => {
        notifications.slice(0, 20).forEach(n => {
          if (!n.isRead) {
            resourcesApi.patch("notifications", n.id, { isRead: true }).catch(() => { });
          }
        });
      });
    } catch (e) { }
  };

  const deleteNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (window.storage) window.storage.set("notifications", JSON.stringify(updated), true);
      return updated;
    });
    try {
      resourcesApi.remove("notifications", id).catch(() => { });
    } catch (e) { }
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

    try { resourcesApi.create("staff", person); } catch (e) { }
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

    try { resourcesApi.create("staff", updatedPerson); } catch (e) { }
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

    try { resourcesApi.delete("staff", name); } catch (e) { }
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
    try { resourcesApi.create("leaveRequests", leave); } catch (e) { }
  };

  const handleSetRole = (newRole) => {
    setRole(newRole);
    const targetView = (newRole && (newRole.dept === "Executive" || newRole.dept === "Executive (MD)"))
      ? "executiveOverview"
      : "dashboard";
    setView(targetView);
    const targetHash = getRouteHash(targetView);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    if (window.storage) window.storage.set("currentRole", JSON.stringify(newRole), true);
  };

    const logEvent = useCallback(async ({ eventType, action, targetId = null, metadata = {} }) => {
    const dev = getDeviceInfo();
    const loc = await getLocationInfo();
    const resolvedLocation = sanitizeLocationString(loc.location);
    const newEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      eventType: eventType || "SYSTEM",
      action: action || "Action performed",
      userName: activeUser?.name || role?.label?.split(" (")[0] || "System User",
      username: activeUser?.username || "user",
      userDept: role?.dept || "General",
      device: dev.deviceSummary,
      deviceType: dev.deviceType,
      location: resolvedLocation,
      targetId: targetId || null,
      metadata
    };

    setAuditLogs(prev => {
      const updated = [newEntry, ...prev.slice(0, 499)];
      try {
        localStorage.setItem("loom_audit_logs", JSON.stringify(updated));
        if (window.storage?.set) window.storage.set("audit_logs", JSON.stringify(updated), true);
      } catch (e) {}
      return updated;
    });
  }, [activeUser, role]);

  const handleLogin = (user) => {
    const nextRole = roleForUser(user, teams);
    setActiveUser(user);
    setRole(nextRole);
    const defaultLandingView = (nextRole.dept === "Executive" || nextRole.dept === "Executive (MD)") ? "executiveOverview" : "dashboard";
    const currentRoute = parseRouteFromHash(window.location.hash);
    const targetView = currentRoute?.view || defaultLandingView;
    const targetId = currentRoute?.selectedId || null;
    const targetDept = currentRoute?.selectedDept || null;

    setView(targetView);
    if (targetId) setSelectedId(targetId);
    if (targetDept) setSelectedDept(targetDept);

    const targetHash = getRouteHash(targetView, targetId, targetDept);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }

    try { localStorage.setItem("loom_active_user", JSON.stringify(user)); } catch (e) { }

    // 1. Automatically mark attendance as present for today upon login
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);
    const dev = getDeviceInfo();

    setAttendance(prev => {
      const updated = {
        ...prev,
        [user.name]: "present",
        ...(user.username ? { [user.username]: "present" } : {})
      };
      if (window.storage) window.storage.set("attendance", JSON.stringify(updated), true);
      return updated;
    });

    // 2. Start a new user login session record for usage tracking with device & location
    const sessId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newSession = {
      id: sessId,
      userId: user.id,
      username: user.username,
      name: user.name,
      dept: nextRole.dept,
      loginTime: nowIso,
      logoutTime: null,
        lastHeartbeat: nowIso,
      hoursUsed: 0.01,
      active: true,
      date: todayStr,
      device: dev.deviceSummary,
      deviceType: dev.deviceType,
      location: "Detecting..."
    };
    setCurrentSessionId(sessId);
    try { sessionStorage.setItem("loom_active_session_id", sessId); } catch (e) {}

    // Broadcast session immediately across all connected clients/tabs
    broadcastLiveUpdate({
      type: "USER_SESSION_UPDATE",
      session: newSession
    });

    setUserSessions(prev => {
      const updated = [newSession, ...prev];
      if (window.storage) window.storage.set("user_sessions", JSON.stringify(updated), true);
      return updated;
    });

    // If logging in from a fresh/incognito tab where prior sessions weren't in memory,
    // fetch existing sessions from backend storage and merge to avoid wiping other active users
    if (window.storage?.get) {
      window.storage.get("user_sessions", true).then(storageRes => {
        if (storageRes?.value) {
          try {
            const existing = typeof storageRes.value === "string" ? JSON.parse(storageRes.value) : storageRes.value;
            if (Array.isArray(existing) && existing.length > 0) {
              setUserSessions(cur => {
                const map = new Map();
                existing.forEach(s => { if (s && s.id) map.set(s.id, s); });
                cur.forEach(s => { if (s && s.id) map.set(s.id, s); });
                map.set(sessId, newSession);
                return Array.from(map.values()).sort((a, b) => new Date(b.loginTime || 0) - new Date(a.loginTime || 0));
              });
            }
          } catch (e) {}
        }
      });
    }

    // Synchronously record login audit log so it appears immediately without waiting for geolocation
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const initialLogEntry = {
      id: logId,
      timestamp: nowIso,
      eventType: "LOGIN",
      action: `${user.name} logged into the application from ${dev.deviceType} (${dev.os} · ${dev.browser})`,
      userName: user.name,
      username: user.username,
      userDept: nextRole.dept,
      device: dev.deviceSummary,
      deviceType: dev.deviceType,
      location: "Detecting...",
      targetId: user.id
    };

    setAuditLogs(prevLogs => {
      const updatedLogs = [initialLogEntry, ...prevLogs.slice(0, 499)];
      try {
        localStorage.setItem("loom_audit_logs", JSON.stringify(updatedLogs));
        if (window.storage?.set) window.storage.set("audit_logs", JSON.stringify(updatedLogs), true);
      } catch (e) {}
      return updatedLogs;
    });

    // Asynchronously resolve location and enrich session & audit log
    getLocationInfo().then(loc => {
      const resolvedLocation = sanitizeLocationString(loc.location);
      const enrichedSession = { ...newSession, location: resolvedLocation };
      setUserSessions(prev => {
        const enriched = prev.map(s => s.id === sessId ? enrichedSession : s);
        if (window.storage) window.storage.set("user_sessions", JSON.stringify(enriched), true);
        return enriched;
      });
      broadcastLiveUpdate({
        type: "USER_SESSION_UPDATE",
        session: enrichedSession
      });

      setAuditLogs(prevLogs => {
        const updatedLogs = prevLogs.map(l => l.id === logId ? { ...l, location: resolvedLocation } : l);
        try {
          localStorage.setItem("loom_audit_logs", JSON.stringify(updatedLogs));
          if (window.storage?.set) window.storage.set("audit_logs", JSON.stringify(updatedLogs), true);
        } catch (e) {}
        return updatedLogs;
      });
    });
  };

  const handleUsersChange = useCallback((nextUsers) => {
    setUsers(nextUsers);
    syncUsersToBackend(nextUsers);
  }, [syncUsersToBackend]);

  const handleTeamsChange = useCallback((nextTeams) => {
    setTeams(nextTeams);
    syncTeamsToBackend(nextTeams);
  }, [syncTeamsToBackend]);

  const handleRotationChange = useCallback((nextRotation) => {
    setRotation(nextRotation);
    syncRotationToBackend(nextRotation);
  }, [syncRotationToBackend]);

  const handleLogout = () => {
    const sessId = currentSessionId || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("loom_active_session_id") : null);
    const nowIso = new Date().toISOString();
    const dev = getDeviceInfo();
    if (sessId) {
      let loggedOutSessionObj = null;
      setUserSessions(prev => {
        let loggedOutSess = null;
        const updated = prev.map(s => {
          if (s.id === sessId && s.active) {
            const loginMs = new Date(s.loginTime).getTime();
            const logoutMs = new Date(nowIso).getTime();
            const hours = Math.max(0.01, Number(((logoutMs - loginMs) / (1000 * 60 * 60)).toFixed(2)));
            loggedOutSess = { ...s, logoutTime: nowIso, hoursUsed: hours, active: false };
            return loggedOutSess;
          }
          return s;
        });
        loggedOutSessionObj = loggedOutSess;
        if (window.storage) window.storage.set("user_sessions", JSON.stringify(updated), true);

        const durationText = loggedOutSess ? ` (Session duration: ${loggedOutSess.hoursUsed} hrs)` : "";
        const logEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          timestamp: nowIso,
          eventType: "LOGOUT",
          action: `${activeUser?.name || "User"} logged out of application${durationText}`,
          userName: activeUser?.name || "User",
          username: activeUser?.username || "user",
          userDept: role?.dept || "General",
          device: dev.deviceSummary,
          deviceType: dev.deviceType,
          location: loggedOutSess?.location || "Local Office",
          targetId: activeUser?.id || null
        };

        setAuditLogs(prevLogs => {
          const updatedLogs = [logEntry, ...prevLogs.slice(0, 499)];
          try {
            localStorage.setItem("loom_audit_logs", JSON.stringify(updatedLogs));
            if (window.storage?.set) window.storage.set("audit_logs", JSON.stringify(updatedLogs), true);
          } catch (e) {}
          return updatedLogs;
        });

        return updated;
      });
      if (loggedOutSessionObj) {
        broadcastLiveUpdate({
          type: "USER_SESSION_UPDATE",
          session: loggedOutSessionObj
        });
      }
      try { sessionStorage.removeItem("loom_active_session_id"); } catch (e) {}
      setCurrentSessionId(null);
    }
    setActiveUser(null);
    try { localStorage.removeItem("loom_active_user"); } catch (e) { }
    if (window.location.hash && window.location.hash !== "#/login") {
      window.location.hash = "#/login";
    }
  };

  const updateFinancials = (field, value) => {
    setFinancials(prev => {
      const next = { ...prev, [field]: value };
      try { resourcesApi.update("financials", "current", next); } catch (e) { }
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
    try { resourcesApi.create("certifications", newCert); } catch (e) { }

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
    try { resourcesApi.patch("certifications", id, updates); } catch (e) { }

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
    try { resourcesApi.remove("certifications", id); } catch (e) { }
  };

  const restoreCertification = (id) => {
    setCertifications(prev => {
      const updated = prev.map(c => ((c.id === id || c.key === id) ? { ...c, isDeleted: false, deletedAt: null } : c));
      if (window.storage) window.storage.set("certifications", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.patch("certifications", id, { isDeleted: false, deletedAt: null }); } catch (e) { }
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
    try { resourcesApi.create("compliances", newComp); } catch (e) { }

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
      try { resourcesApi.create("tasks", linkedTask); } catch (e) { }
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
    try { resourcesApi.patch("compliances", id, updates); } catch (e) { }

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
        try { resourcesApi.patch("tasks", t.id, taskUpdates); } catch (e) { }
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
    try { resourcesApi.remove("compliances", id); } catch (e) { }

    // Remove or complete related task
    setCustomTasks(prev => prev.filter(t => t.complianceId !== id && t.id !== `task-comp-${id}`));
    try { resourcesApi.remove("tasks", `task-comp-${id}`); } catch (e) { }
  };

  const restoreCompliance = (id) => {
    setCompliances(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, isDeleted: false, deletedAt: null } : c));
      if (window.storage) window.storage.set("compliances", JSON.stringify(updated), true);
      return updated;
    });
    try { resourcesApi.patch("compliances", id, { isDeleted: false, deletedAt: null }); } catch (e) { }
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
    try { resourcesApi.create("debitNotes", note); } catch (e) { }
  };

  const addCapa = (capa) => {
    setCapas(prev => [capa, ...prev]);
    try { resourcesApi.create("capas", capa); } catch (e) { }
  };

  const cycleCapaStatus = (id) => {
    setCapas(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = c.status === "open" ? "in_progress" : c.status === "in_progress" ? "closed" : "open";
      const updated = { ...c, status: next };
      try { resourcesApi.update("capas", c.id, updated); } catch (e) { }
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
    try { resourcesApi.create("tasks", newTask); } catch (e) { }

    // Fire notification
    pushNotification({
      eventKey: `task-created-${newTask.id}`,
      type: "task",
      title: "New Task Assigned",
      message: `'${newTask.title}' has been assigned to ${newTask.assignee || "you"}.`,
      relatedModule: "tasks",
      relatedId: newTask.id,
      targetUser: newTask.assignee && newTask.assignee !== "Unassigned" ? newTask.assignee : undefined,
      targetDept: newTask.dept,
      priority: newTask.priority || "medium"
    });

    logEvent({
      eventType: "TASK",
      action: `Created task "${newTask.title}" assigned to ${newTask.assignee || "Unassigned"}`,
      targetId: newTask.id,
      metadata: { taskId: newTask.id, dept: newTask.dept }
    });
  };

  const updateTask = (id, updates) => {
    setCustomTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      try { resourcesApi.patch("tasks", id, updates); } catch (e) { }

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

        logEvent({
          eventType: "TASK",
          action: `Completed task "${t.title}"`,
          targetId: id,
          metadata: { taskId: id }
        });
      }
      return updated;
    }));
  };

  const deleteTask = (id) => {
    setCustomTasks(prev => prev.filter(t => t.id !== id));
    try { resourcesApi.remove("tasks", id); } catch (e) { }
    logEvent({
      eventType: "TASK",
      action: `Deleted task #${id}`,
      targetId: id,
      metadata: { taskId: id }
    });
  };

  const handleAddChecklistItem = (dept, item) => {
    setDepartmentChecklists(prev => {
      const list = prev[dept] || [];
      const newItem = {
        id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: item.title,
        dueDate: item.dueDate || "Today",
        done: false,
      };
      return { ...prev, [dept]: [newItem, ...list] };
    });
  };

  const handleToggleChecklistItem = (dept, itemId) => {
    setDepartmentChecklists(prev => {
      const list = prev[dept] || [];
      const updated = list.map(item => item.id === itemId ? { ...item, done: !item.done } : item);
      return { ...prev, [dept]: updated };
    });
  };

  const handleDeleteChecklistItem = (dept, itemId) => {
    setDepartmentChecklists(prev => {
      const list = prev[dept] || [];
      const updated = list.filter(item => item.id !== itemId);
      return { ...prev, [dept]: updated };
    });
  };

  const addOrder = (newOrder) => {
    const primaryId = newOrder.id || newOrder.primaryId;
    const fullOrder = {
      template: "90",
      costingTemplate: "fabric",
      costingRows: buildCostingRows("fabric"),
      vapCount: 1,
      shippedQty: 0,
      plannedCost:0,
      actualCost:0,
      stages: makeStages("90", 0, null),
      preProd: initPreProd(),
      ...newOrder,
      primaryId,
      orderId: newOrder.id,
      completed: false,
      isDeleted: false,
      completedAt: null,
      deletedAt: null,
    };
    setOrders(prev => [fullOrder, ...prev]);
    try {
      resourcesApi.create("orders", fullOrder).catch(err => {
        console.warn("Error creating order:", err.message);
      });
    } catch (e) { }

    // Trigger Notification for New Order
    pushNotification({
      eventKey: `order-created-${fullOrder.primaryId || fullOrder.id}`,
      type: "order",
      title: "New Order Added",
      message: `Order #${fullOrder.id} (${fullOrder.style}) has been created for ${fullOrder.buyer}.`,
      relatedModule: "orders",
      relatedId: fullOrder.id,
      priority: fullOrder.risk === "high" ? "high" : "medium"
    });

    // Notify all assigned users with tasks in this new order!
    const stageAssignees = {};
    (fullOrder.stages || []).forEach(stage => {
      const assignee = stage.assignee;
      if (assignee && assignee !== "Unassigned" && assignee !== "Assigned") {
        if (!stageAssignees[assignee]) {
          stageAssignees[assignee] = { stages: [], depts: new Set() };
        }
        stageAssignees[assignee].stages.push(stage.name);
        if (stage.dept) stageAssignees[assignee].depts.add(stage.dept);
      }
    });

    Object.entries(stageAssignees).forEach(([assignee, data]) => {
      const stageList = data.stages.slice(0, 3).join(", ") + (data.stages.length > 3 ? ` +${data.stages.length - 3} more` : "");
      const dept = Array.from(data.depts)[0] || "";
      pushNotification({
        eventKey: `order-task-assigned-${fullOrder.id}-${assignee}`,
        type: "task",
        title: `Task Assigned: Order #${fullOrder.id}`,
        message: `You have been assigned ${data.stages.length} task${data.stages.length > 1 ? "s" : ""} (${stageList}) on new Order #${fullOrder.id} (${fullOrder.style || "Order"}).`,
        relatedModule: "orders",
        relatedId: fullOrder.id,
        targetUser: assignee,
        targetDept: dept,
        priority: "high"
      });
    });

    // Notify the department of the initial stage (Stage 0)
    const firstStage = (fullOrder.stages || [])[0];
    if (firstStage && firstStage.dept) {
      pushNotification({
        eventKey: `order-first-stage-${fullOrder.id}-${firstStage.name}-${firstStage.dept}`,
        type: "task",
        title: `Initial Task Ready: ${firstStage.name}`,
        message: `New Order #${fullOrder.id} (${fullOrder.style || "Order"}) initiated. Stage "${firstStage.name}" is pending action for ${firstStage.dept}.`,
        relatedModule: "orders",
        relatedId: fullOrder.id,
        targetDept: firstStage.dept,
        targetUser: firstStage.assignee && firstStage.assignee !== "Unassigned" ? firstStage.assignee : undefined,
        priority: "high"
      });
    }

    logEvent({
      eventType: "ORDER",
      action: `Created new order #${fullOrder.id} (${fullOrder.style || "Style"}) for ${fullOrder.buyer || "Buyer"} (Qty: ${fullOrder.qty || 0})`,
      targetId: fullOrder.id,
      metadata: { orderId: fullOrder.id, buyer: fullOrder.buyer, style: fullOrder.style, qty: fullOrder.qty }
    });
  };

  const completeOrder = (primaryKey) => {
    const completedAt = new Date().toISOString();
    const targetOrder = orders.find(o => o.primaryId === primaryKey || o.id === primaryKey || o._id === primaryKey);
    const primId = targetOrder?.primaryId || primaryKey;
    const orderNum = targetOrder?.id || primaryKey;

    setOrders(prev => prev.map(o => (o.primaryId === primId || o.id === primId || o._id === primId) ? { ...o, completed: true, completedAt } : o));
    try {
      resourcesApi.patch("orders", primId, { completed: true, completedAt }).catch(err => {
        console.warn("Error completing order:", err.message);
      });
    } catch (e) { }
    logEvent({
      eventType: "ORDER",
      action: `Marked order #${orderNum} as Completed`,
      targetId: orderNum,
      metadata: { orderId: orderNum, primaryId: primId }
    });
  };

  const uncompleteOrder = (primaryKey) => {
    const targetOrder = orders.find(o => o.primaryId === primaryKey || o.id === primaryKey || o._id === primaryKey);
    const primId = targetOrder?.primaryId || primaryKey;

    setOrders(prev => prev.map(o => (o.primaryId === primId || o.id === primId || o._id === primId) ? { ...o, completed: false, completedAt: null } : o));
    try {
      resourcesApi.patch("orders", primId, { completed: false, completedAt: null }).catch(err => {
        console.warn("Error reopening order:", err.message);
      });
    } catch (e) { }

    logEvent({
      eventType: "ORDER",
      action: `Reopened order #${targetOrder?.id || primaryKey}`,
      targetId: targetOrder?.id || primaryKey,
      metadata: { orderId: targetOrder?.id || primaryKey }
    });
  };

  const deleteOrder = (primaryKey) => {
    if (!isAdmin) {
      alert("Permission denied: Only Administrators can delete orders.");
      return;
    }
    const deletedAt = new Date().toISOString();
    // Match target order by primaryId, _id, or id
    const targetOrder = orders.find(o => (o.primaryId && o.primaryId === primaryKey) || (o._id && o._id === primaryKey) || o.id === primaryKey || o.orderId === primaryKey);
    const primId = targetOrder?.primaryId || targetOrder?._id || primaryKey;
    const orderNum = targetOrder?.id || targetOrder?.orderId || primaryKey;

    // 1. Soft-delete ALL orders matching this order name or primaryId so NO order in that name is displayed in the app!
    setOrders(prev => {
      const updated = prev.map(o => {
        const isTarget = Boolean(
          (primId && (o.primaryId === primId || o._id === primId)) ||
          (orderNum && (o.id === orderNum || o.orderId === orderNum))
        );
        return isTarget ? { ...o, isDeleted: true, deletedAt } : o;
      });
      if (window.storage) window.storage.set("orders", JSON.stringify(updated), true);
      return updated;
    });

    // 2. Automatically delete/cleanup all tasks related to this order!
    setCustomTasks(prev => {
      const remainingTasks = prev.filter(t =>
        t.orderId !== primId &&
        t.orderId !== orderNum &&
        t.order !== primId &&
        t.order !== orderNum &&
        t.relatedOrderId !== primId &&
        t.relatedOrderId !== orderNum
      );
      if (window.storage) window.storage.set("custom_tasks", JSON.stringify(remainingTasks), true);
      return remainingTasks;
    });

    // 3. Cascade remove any notifications related to this order
    setNotifications(prev => {
      const remainingNotifs = prev.filter(n =>
        n.relatedId !== primId &&
        n.relatedId !== orderNum &&
        n.orderId !== primId &&
        n.orderId !== orderNum &&
        (!n.eventKey || (!n.eventKey.includes(primId) && !n.eventKey.includes(orderNum)))
      );
      if (window.storage) window.storage.set("notifications", JSON.stringify(remainingNotifs), true);
      return remainingNotifs;
    });

    // 4. If user is currently inside this deleted order view, navigate back to orders list
    if (selectedId === primId || selectedId === orderNum) {
      setSelectedId(null);
      setView("orders");
      window.location.hash = getRouteHash("orders");
    }

    try {
      if (primId) {
        resourcesApi.remove("orders", primId).catch(err => {
          console.warn("Error deleting order:", err.message);
        });
      }
      if (orderNum && orderNum !== primId) {
        resourcesApi.remove("orders", orderNum).catch(() => {});
      }
    } catch (e) { }

    logEvent({
      eventType: "ORDER",
      action: `Deleted order #${orderNum}`,
      targetId: orderNum,
      metadata: { orderId: orderNum, primaryId: primId }
    });
  };

  const permanentDeleteOrder = async (primaryKey) => {
    if (!isAdmin) {
      alert("Permission denied: Only Administrators can permanently delete orders.");
      return;
    }
    const targetOrder = orders.find(o => (o.primaryId && o.primaryId === primaryKey) || (o._id && o._id === primaryKey) || o.id === primaryKey || o.orderId === primaryKey);
    const primId = targetOrder?.primaryId || targetOrder?._id || primaryKey;
    const orderNum = targetOrder?.id || targetOrder?.orderId || primaryKey;

    // 1. Completely purge ALL orders matching this name/ID or primaryKey
    setOrders(prev => {
      const remaining = prev.filter(o => {
        const isMatch = Boolean(
          (primId && (o.primaryId === primId || o._id === primId)) ||
          (orderNum && (o.id === orderNum || o.orderId === orderNum))
        );
        return !isMatch;
      });
      if (window.storage) window.storage.set("orders", JSON.stringify(remaining), true);
      return remaining;
    });

    // 2. Cascade clean all tasks related to this order from state & storage
    setCustomTasks(prev => {
      const remainingTasks = prev.filter(t =>
        t.orderId !== primId &&
        t.orderId !== orderNum &&
        t.order !== primId &&
        t.order !== orderNum &&
        t.relatedOrderId !== primId &&
        t.relatedOrderId !== orderNum
      );
      if (window.storage) window.storage.set("custom_tasks", JSON.stringify(remainingTasks), true);
      return remainingTasks;
    });

    // 3. Cascade clean notifications related to this order from state & storage
    setNotifications(prev => {
      const remainingNotifs = prev.filter(n => n.relatedId !== primId && n.relatedId !== orderNum && n.orderId !== primId && n.orderId !== orderNum && (!n.eventKey || (!n.eventKey.includes(primId) && !n.eventKey.includes(orderNum))));
      if (window.storage) window.storage.set("notifications", JSON.stringify(remainingNotifs), true);
      return remainingNotifs;
    });

    // 4. Cascade clean supplier work related to this order
    setSupplierWork(prev => {
      const remainingWork = prev.filter(w => w.orderId !== primId && w.orderId !== orderNum && w.order !== primId && w.order !== orderNum);
      if (window.storage) window.storage.set("supplierWork", JSON.stringify(remainingWork), true);
      return remainingWork;
    });

    // 5. Cascade clean certifications & compliances linked to this order
    setCertifications(prev => {
      const remaining = prev.filter(c => c.orderId !== primId && c.orderId !== orderNum);
      if (window.storage) window.storage.set("certifications", JSON.stringify(remaining), true);
      return remaining;
    });
    setCompliances(prev => {
      const remaining = prev.filter(c => c.orderId !== primId && c.orderId !== orderNum);
      if (window.storage) window.storage.set("compliances", JSON.stringify(remaining), true);
      return remaining;
    });

    // 6. Cascade clean debit notes & CAPAs linked to this order
    setDebitNotes(prev => prev.filter(d => d.po !== primId && d.po !== orderNum && d.orderId !== primId && d.orderId !== orderNum));
    setCapas(prev => prev.filter(c => c.po !== primId && c.po !== orderNum && c.orderId !== primId && c.orderId !== orderNum));

    // 7. Clean order-specific keys from window.storage and localStorage
    if (window.storage && window.storage.delete) {
      try {
        window.storage.delete(`docs:${primId}`, true);
        window.storage.delete(`docs:${orderNum}`, true);
        window.storage.delete(`highlights:${primId}`, true);
        window.storage.delete(`chat:${primId}`, true);
        window.storage.delete(`chat:${orderNum}`, true);
      } catch (e) { }
    }
    try {
      localStorage.removeItem(`docs:${primId}`);
      localStorage.removeItem(`docs:${orderNum}`);
      localStorage.removeItem(`highlights:${primId}`);
      localStorage.removeItem(`chat:${primId}`);
      localStorage.removeItem(`chat:${orderNum}`);
    } catch (e) { }

    if (selectedId === primId || selectedId === orderNum) {
      setSelectedId(null);
      setView("orders");
      window.location.hash = getRouteHash("orders");
    }

    // 8. Send PERMANENT delete request to backend & MongoDB with primaryId and orderNum
    try {
      await resourcesApi.remove("orders", primId, "?permanent=true");
      if (orderNum && orderNum !== primId) {
        await resourcesApi.remove("orders", orderNum, "?permanent=true").catch(() => {});
      }
    } catch (err) {
      console.error("Failed to permanently delete order from backend:", err);
    }

    logEvent({
      eventType: "ORDER",
      action: `Permanently deleted order #${orderNum}`,
      targetId: orderNum,
      metadata: { orderId: orderNum, primaryId: primId }
    });
  };

  const restoreOrder = (primaryKey) => {
    if (!isAdmin) {
      alert("Permission denied: Only Administrators can restore orders.");
      return;
    }
    const targetOrder = orders.find(o => o.primaryId === primaryKey || o.id === primaryKey || o._id === primaryKey);
    const primId = targetOrder?.primaryId || primaryKey;

    setOrders(prev => prev.map(o => (o.primaryId === primId || o.id === primId || o._id === primId) ? { ...o, isDeleted: false, deletedAt: null } : o));
    try {
      resourcesApi.patch("orders", primId, { isDeleted: false, deletedAt: null }).catch(err => {
        console.warn("Error restoring order:", err.message);
      });
    } catch (e) { }
  };

  const handleReportComplaint = (complaint) => {
    const complaintId = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newComplaint = {
      id: complaintId,
      ...complaint,
      status: "Under Review",
      createdAt: new Date().toISOString()
    };
    setStageComplaints(prev => {
      const next = [newComplaint, ...prev];
      if (window.storage) window.storage.set("stage_complaints", JSON.stringify(next), true);
      return next;
    });

    // Mark stage in orders as disputed and flag delay reason
    setOrders(prev => prev.map(o => {
      if (o.id !== complaint.orderId && o.primaryId !== complaint.orderId) return o;
      const updatedStages = (o.stages || []).map((s, idx) => {
        if (idx === complaint.stageIdx) {
          return {
            ...s,
            disputed: true,
            disputeId: complaintId,
            reason: `Disputed: False completion reported by @${complaint.reportedBy}: ${complaint.reason}`
          };
        }
        return s;
      });
      return { ...o, stages: updatedStages, status: "Delayed" };
    }));

    // Post dispute message into order activity chat
    const chatKey = `chat:${complaint.orderId}`;
    const disputeMsg = {
      id: Date.now(),
      author: complaint.reportedBy || "System",
      text: `🚨 [Dispute / False Stage Completion Reported]\nStage: ${complaint.stageName} (${complaint.stageDept})\nTagged User: @${complaint.taggedUser}\nReason: ${complaint.reason}`,
      ts: new Date().toLocaleString(),
      stage: complaint.stageName || null
    };
    try {
      const existingChat = JSON.parse(localStorage.getItem(chatKey) || "[]");
      const updatedChat = [...existingChat, disputeMsg];
      localStorage.setItem(chatKey, JSON.stringify(updatedChat));
      if (window.storage) window.storage.set(chatKey, JSON.stringify(updatedChat), true);
    } catch (e) {}

    pushNotification({
      eventKey: `complaint-${complaintId}`,
      type: "tna",
      title: "Stage Dispute / False Completion Filed",
      message: `@${complaint.reportedBy} reported false completion on Order #${complaint.orderId} (${complaint.stageName}) against @${complaint.taggedUser}: "${complaint.reason}"`,
      relatedModule: "orders",
      relatedId: complaint.orderId,
      targetUser: complaint.taggedUser,
      priority: "critical"
    });
  };

  const handleResolveComplaint = (complaintId, resolutionStatus = "Resolved") => {
    let targetComp = null;
    setStageComplaints(prev => {
      const updated = prev.map(c => {
        if (c.id === complaintId) {
          targetComp = c;
          return { ...c, status: resolutionStatus, resolvedAt: new Date().toISOString() };
        }
        return c;
      });
      if (window.storage) window.storage.set("stage_complaints", JSON.stringify(updated), true);
      return updated;
    });

    // When MD resolves or reverts the complaint, unlock the order's disputed stage flag
    setOrders(prev => prev.map(o => {
      const hasMatchingStage = (o.stages || []).some(s => s.disputeId === complaintId || (targetComp && (o.id === targetComp.orderId || o.primaryId === targetComp.orderId) && s.name === targetComp.stageName));
      if (!hasMatchingStage) return o;
      const updatedStages = (o.stages || []).map(s => {
        if (s.disputeId === complaintId || (targetComp && (o.id === targetComp.orderId || o.primaryId === targetComp.orderId) && s.name === targetComp.stageName)) {
          const cleanReason = String(s.reason || "").startsWith("Disputed:") ? "" : s.reason;
          return { ...s, disputed: false, disputeId: null, reason: cleanReason };
        }
        return s;
      });
      const hasAnyDelayed = updatedStages.some(s => s.reason || s.status === "Delayed");
      return { ...o, stages: updatedStages, status: hasAnyDelayed ? "Delayed" : "On Track" };
    }));
  };

  const updateStages = (id, stages) => {
    setOrders(prev => prev.map(o => {
      const match = String(id).match(/^ord_(.+)_[a-z0-9]{4,8}$/);
      const baseId = match ? match[1] : null;
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id || (baseId && (o.id === baseId || o.primaryId === baseId));
      if (!isTarget) return o;
      const doneCount = stages.filter(s => s.status === "done").length;
      const allDone = stages.length > 0 && doneCount === stages.length;
      const hasFlag = stages.some(s => s.reason);
      const status = allDone ? "On Track" : hasFlag ? "Delayed" : "At Risk";

      const isCompleted = allDone;
      const completedAt = isCompleted ? (o.completedAt || new Date().toISOString()) : null;

      const prevOrder = (o.stages || []).map(s => s.name).join(",");
      const newOrder = stages.map(s => s.name).join(",");
      if (prevOrder && newOrder && prevOrder !== newOrder) {
        logEvent({
          eventType: "STAGE",
          action: `Realigned T&A workflow stages for order #${o.id}`,
          targetId: o.id,
          metadata: { orderId: o.id }
        });
      }

      // Detect stage completions / delays and attach timestamps
      const nowIso = new Date().toISOString();
      const currentUserName = role?.label || activeUser?.name || "User";
      const updatedStages = stages.map((s, idx) => {
        const prevStage = o.stages?.[idx];
        const res = { ...s };
        if (s.status === "done") {
          res.completedAt = s.completedAt || prevStage?.completedAt || nowIso;
          res.completedBy = res.completedBy || prevStage?.completedBy || currentUserName;
        }
        if (s.reason && (!prevStage || prevStage.reason !== s.reason)) {
          res.flaggedAt = s.flaggedAt || nowIso;
        }
        if (s.status === "in_progress" && (!prevStage || prevStage.status !== "in_progress")) {
          res.updatedAt = s.updatedAt || nowIso;
          res.updatedBy = res.updatedBy || currentUserName;
        }
        return res;
      });

      // Auto handover: When a stage is marked done, find the next pending stage and assign it to its department
      let nextStageToActivate = null;
      let nextStageIdx = -1;

      updatedStages.forEach((s, idx) => {
        const prevStage = o.stages?.[idx];
        if (s.status === "done" && prevStage?.status !== "done") {
          logEvent({
            eventType: "STAGE",
            action: `Marked stage "${s.name}" as Done on order #${id}`,
            targetId: id,
            metadata: { orderId: id, stageName: s.name, dept: s.dept }
          });
          // Find next pending stage after this completed stage
          for (let j = idx + 1; j < updatedStages.length; j++) {
            if (updatedStages[j].status === "pending") {
              nextStageToActivate = updatedStages[j];
              nextStageIdx = j;
              break;
            }
          }

          // General stage done notification
          pushNotification({
            eventKey: `tna-stage-done-${id}-${s.name}`,
            type: "tna",
            title: "T&A Stage Completed",
            message: `${s.name} stage completed for ${id} by ${s.dept}.`,
            relatedModule: "tna",
            relatedId: id,
            priority: "low"
          });
        }
        if (s.reason && (!prevStage?.reason || prevStage.reason !== s.reason)) {
          logEvent({
            eventType: "STAGE",
            action: `Flagged delay on stage "${s.name}" for order #${id}: "${s.reason}"`,
            targetId: id,
            metadata: { orderId: id, stageName: s.name, reason: s.reason }
          });
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

      // If next stage found, advance it to in_progress and send Targeted Department Notification
      if (nextStageToActivate && nextStageIdx !== -1) {
        const nextDeptAssignee = nextStageToActivate.assignee && nextStageToActivate.assignee !== "Unassigned"
          ? nextStageToActivate.assignee
          : (firstNamedAssignee(nextStageToActivate.dept) !== "Unassigned" ? firstNamedAssignee(nextStageToActivate.dept) : "Assigned");

        updatedStages[nextStageIdx] = {
          ...nextStageToActivate,
          status: "in_progress",
          assignee: nextDeptAssignee,
          updatedAt: nowIso
        };

        // TARGETED NOTIFICATION: Goes to this specific department and assigned user!
        pushNotification({
          eventKey: `dept-task-assigned-${id}-${nextStageToActivate.name}-${nextStageToActivate.dept}`,
          type: "task",
          title: `New Task: ${nextStageToActivate.name}`,
          message: `Order ${id} has moved to your department (${nextStageToActivate.dept}). Stage "${nextStageToActivate.name}" is now assigned to you!`,
          relatedModule: "tasks",
          relatedId: id,
          targetDept: nextStageToActivate.dept, // Strict department targeting
          targetUser: nextDeptAssignee && nextDeptAssignee !== "Unassigned" && nextDeptAssignee !== "Assigned" ? nextDeptAssignee : undefined,
          priority: "high"
        });
      }

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
        id: o.id,
        primaryId: o.id,
        stages: updatedStages,
        status,
        completed: isCompleted,
        completedAt
      };

      const primId = o.id || o.primaryId || o._id;
      try {
        resourcesApi.update("orders", primId, updated).catch(err => {
          console.warn("Error updating order stages:", err.message);
        });
      } catch (e) { }

      // Broadcast stage update to all other connected users in real time
      try {
        broadcastLiveUpdate({
          type: "ORDER_STAGE_UPDATE",
          orderId: id,
          stages: updatedStages,
          status,
          completed: isCompleted,
          completedAt,
          updatedBy: currentUserName
        });
      } catch (err) {}

      return updated;
    }));
  };

  const setOrderTemplate = (id, tmpl) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const updated = { ...o, template: tmpl, stages: makeStages(tmpl, 0, null), status: "On Track" };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const setOrderCostingTemplate = (id, tmpl) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const updated = { ...o, costingTemplate: tmpl, costingRows: buildCostingRows(tmpl) };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const updateCostingRow = (id, idx, field, value) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const rows = [...(o.costingRows || [])];
      rows[idx] = { ...rows[idx], [field]: value };
      const orderQty = Number(o.qty) || 0;
      const grandTotal = rows.reduce((a, r) => a + (r.isHeader ? 0 : (Number(r.price) || 0) * (Number(r.qty) || 0)), 0);
      const computedPlanned = Math.round(grandTotal * orderQty);
      const updated = {
        ...o,
        costingRows: rows,
        plannedCost: computedPlanned > 0 ? computedPlanned : (o.plannedCost || 0)
      };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const addCostingRow = (id) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
    const rows = [...(o.costingRows || []), { label: "", section: "Other", isHeader: false, price: 0, qty: 1, custom: true }];
      const orderQty = Number(o.qty) || 0;
      const grandTotal = rows.reduce((a, r) => a + (r.isHeader ? 0 : (Number(r.price) || 0) * (Number(r.qty) || 0)), 0);
      const computedPlanned = Math.round(grandTotal * orderQty);
      const updated = {
        ...o,
        costingRows: rows,
        plannedCost: computedPlanned > 0 ? computedPlanned : (o.plannedCost || 0)
      };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const updateShippedQty = (id, qty) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const updated = { ...o, shippedQty: qty };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const updateOrderCost = (id, field, value) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const updated = { ...o, [field]: value };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const updatePreProdField = (id, docKey, fieldKey, value) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const doc = (o.preProd && o.preProd[docKey]) || { values: {}, status: "draft" };
      const updated = { ...o, preProd: { ...(o.preProd || {}), [docKey]: { ...doc, values: { ...doc.values, [fieldKey]: value } } } };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const submitPreProdDoc = (id, docKey) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, preProd: { ...(o.preProd || {}), [docKey]: { ...(o.preProd[docKey]), status: "submitted" } } };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
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
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
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

  const addOrderProductionLog = (id, logEntry) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const currentLogs = o.productionLogs || [];
      const updatedLogs = [logEntry, ...currentLogs];
      const updated = { ...o, productionLogs: updatedLogs };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const deleteOrderProductionLog = (id, logId) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const currentLogs = o.productionLogs || [];
      const updatedLogs = currentLogs.filter(l => l.id !== logId);
      const updated = { ...o, productionLogs: updatedLogs };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const updateOrderInspectionData = (id, inspectionData) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const updated = { ...o, inspectionData: { ...(o.inspectionData || {}), ...inspectionData } };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const updateOrderCertificates = (id, certificatesData) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, certificatesData: { ...(o.certificatesData || {}), ...certificatesData } };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const updateOrderQuotation = (id, quotationData) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = { ...o, quotation: { ...(o.quotation || {}), ...quotationData } };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const submitOrderQuotation = (id, quotationData) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const updated = {
        ...o,
        quotation: {
          ...(o.quotation || {}),
          ...quotationData,
          status: "pending",
          submittedAt: new Date().toISOString()
        }
      };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));

    pushNotification({
      eventKey: `quotation-submitted-${id}`,
      type: "approval",
      title: "Quotation Approval Required",
      message: `Outsourcing quotation (₹${Math.round(quotationData.totalValue || 0).toLocaleString()}) submitted for order ${id}. Needs review.`,
      relatedModule: "approvals",
      relatedId: id,
      priority: "high"
    });
  };

  const approveOrderQuotation = (id, approverName) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = {
        ...o,
        quotation: {
          ...(o.quotation || {}),
          status: "approved",
          approvedBy: approverName,
          approvedAt: new Date().toISOString()
        }
      };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));

    pushNotification({
      eventKey: `quotation-approved-${id}`,
      type: "approval",
      title: "Quotation Approved",
      message: `Outsourcing quotation approved by ${approverName || "MD"} for order ${id}.`,
      relatedModule: "orders",
      relatedId: id,
      priority: "low"
    });
  };

  const rejectOrderQuotation = (id) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const updated = {
        ...o,
        quotation: {
          ...(o.quotation || {}),
          status: "draft"
        }
      };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));
  };

  const submitOrderCosting = (id, costingData = {}) => {
    const timestamp = new Date().toLocaleDateString();
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const orderQty = Number(o.qty) || 1;
      const grandTotal = Number(costingData.grandTotal) || 0;
      const totalOrderPlannedCost = Math.round(grandTotal * orderQty);

      const updated = {
        ...o,
        plannedCost: totalOrderPlannedCost > 0 ? totalOrderPlannedCost : o.plannedCost,
        costingApproval: {
          status: "submitted",
          submittedAt: new Date().toISOString(),
          submittedDate: timestamp,
          grandTotal: grandTotal,
          totalPlannedCost: totalOrderPlannedCost,
          currency: costingData.currency || "INR",
          submittedBy: role.label || "Merchandiser"
        }
      };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));

    pushNotification({
      eventKey: `costing-submitted-${id}`,
      type: "approval",
      title: "Costing Sign-off Required",
      message: `Costing approval requested for order ${id}. Requires sign-off from DGM / Managing Director.`,
      relatedModule: "executiveOverview",
      relatedId: id,
      priority: "high"
    });
  };

  const approveOrderCosting = (id, approverName) => {
    const approver = approverName || "Managing Director (MD)";
    const timestamp = new Date().toLocaleDateString();
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const orderQty = Number(o.qty) || 1;
      const costingRows = o.costingRows || [];
      const grandTotal = costingRows.length > 0
        ? costingRows.reduce((a, r) => a + (r.isHeader ? 0 : (Number(r.price) || 0) * (Number(r.qty) || 0)), 0)
        : (o.costingApproval?.grandTotal || 0);
      const totalOrderPlannedCost = Math.round(grandTotal * orderQty);

      const updated = {
        ...o,
        plannedCost: totalOrderPlannedCost > 0 ? totalOrderPlannedCost : o.plannedCost,
        costingApproval: {
          ...(o.costingApproval || {}),
          status: "approved",
          grandTotal: grandTotal || o.costingApproval?.grandTotal || 0,
          totalPlannedCost: totalOrderPlannedCost || o.costingApproval?.totalPlannedCost,
          approvedBy: approver,
          approvedAt: new Date().toISOString(),
          approvedDate: timestamp
        }
      };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));

    pushNotification({
      eventKey: `costing-approved-${id}`,
      type: "approval",
      title: "Costing Approved",
      message: `Costing sign-off approved by ${approver} for order ${id}. Status: Pass.`,
      relatedModule: "orders",
      relatedId: id,
      priority: "low"
    });
  };

  const rejectOrderCosting = (id, reason) => {
    setOrders(prev => prev.map(o => {
      const isTarget = (o.primaryId && o.primaryId === id) || (o._id && o._id === id) || o.id === id;
      if (!isTarget) return o;
      const updated = {
        ...o,
        costingApproval: {
          ...(o.costingApproval || {}),
          status: "rejected",
          rejectedBy: role.label || "Managing Director (MD)",
          rejectedAt: new Date().toISOString(),
          reason: reason || "Costing revisions required"
        }
      };
      try { resourcesApi.update("orders", o.primaryId || o._id || o.id, updated); } catch (e) { }
      return updated;
    }));

    pushNotification({
      eventKey: `costing-rejected-${id}`,
      type: "approval",
      title: "Costing Rejected",
      message: `Costing rejected for order ${id} by MD. Please revise and resubmit.`,
      relatedModule: "orders",
      relatedId: id,
      priority: "high"
    });
  };

  const navigate = (key) => {
    setView(key);
    setSelectedId(null);
    setSelectedDept(null);
    const targetHash = getRouteHash(key);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    if (activeUser) {
      loadViewData(key);
    }
  };

  const openOrder = (id, primaryId) => {
    let target = id;
    if (typeof id === "object" && id !== null) {
      target = id.primaryId || id._id || id.id;
    } else if (primaryId) {
      target = primaryId;
    }
    setSelectedId(target);
    setPreviousView(view === "order" ? previousView : view);
    setView("order");
    const targetHash = getRouteHash("order", target);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  };

  const openDept = (name) => {
    setSelectedDept(name);
    setPreviousView(view);
    setView("departmentDetail");
    const targetHash = getRouteHash("departmentDetail", null, name);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  };

  const selectedOrder = orders.find(o =>
    selectedId && ((o.primaryId && o.primaryId === selectedId) || (o._id && o._id === selectedId))
  ) || orders.find(o => o.id === selectedId);
  const canSeeAll = !!role.fullAccess;
  const canAccess = permission => canSeeAll || role.permissions?.includes(permission);
  const personName = (role.label.match(/\(([^)]+)\)/) || [])[1] || role.label;

  const searchResults = searchQuery.trim().length === 0 ? [] : orders
    .filter(o => o && !o.isDeleted && o.isDeleted !== "true" && !o.deletedAt)
    .filter(o => canSeeAll || (o.stages && o.stages.some(s => s.dept === role.dept)))
    .filter(o => {
      const q = searchQuery.toLowerCase();
      return (o.id || "").toLowerCase().includes(q) || (o.style || "").toLowerCase().includes(q) || (o.buyer || "").toLowerCase().includes(q) || (o.country || "").toLowerCase().includes(q);
    })
    .slice(0, 6);

  const bellAlerts = (() => {
    const items = [];
    orders.forEach(o => {
      if (!o || o.isDeleted === true || o.isDeleted === "true" || o.deletedAt) return;
      if (!o.stages) return;
      o.stages.forEach(s => {
        if (s.reason && (canSeeAll || s.dept === role.dept)) {
          items.push({ text: `${s.reason} — ${o.style} PO #${o.id}`, sev: o.risk, orderId: o.primaryId || o.id });
        }
      });
    });
    return items;
  })();

  const isExecutive = role.isMD === true;

  const navSections = isExecutive ? [
    {
      section: "Executive Suite",
      items: [
        { key: "executiveOverview", label: "MD Executive Dashboard", icon: TrendingUp },
        { key: "departments", label: "Departments", icon: Users },
        { key: "orders", label: "Orders", icon: Package },
        { key: "approvals", label: "Approvals", icon: ClipboardCheck },
        { key: "myChecklist", label: "My checklist", icon: ClipboardList },
      ]
    },
    {
      section: "Management",
      items: [
        { key: "attendance", label: "Attendance & leave", icon: UserCheck },
        { key: "auditLogs", label: "Event Logger", icon: Activity },
        { key: "debitNotes", label: "Debit notes", icon: ArrowDownRight },
        { key: "finance", label: "Finance", icon: Landmark },
        { key: "reports", label: "Reports", icon: BarChart3 },
        { key: "settings", label: "Settings", icon: SettingsIcon },
      ]
    }
  ] : [
    {
      section: null, items: [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        ...(canAccess("orders") ? [{ key: "orders", label: "Orders", icon: Package }] : []),
        { key: "tasks", label: "My tasks", icon: CheckSquare },
        { key: "myChecklist", label: "My checklist", icon: ClipboardList },
        ...(canSeeAll ? [{ key: "calendar", label: "Timeline / calendar", icon: Calendar }] : []),
        ...(canAccess("approvals") ? [{ key: "approvals", label: "Approvals", icon: ClipboardCheck }] : []),
      ]
    },
    {
      section: "Operations", items: [
        ...(canSeeAll
          ? [{ key: "departments", label: "Departments", icon: Users }]
          : [{ key: "myDepartment", label: "My department", icon: Users }]),
        // ...(canSeeAll || ["Cutting", "Production"].includes(role.dept) ? [{ key: "production", label: "Production", icon: Factory }] : []),
        // ...(canSeeAll || role.dept === "Quality" ? [{ key: "quality", label: "Quality", icon: ShieldCheck }] : []),
        ...(canSeeAll || role.dept === "Compliance & Certification" ? [{ key: "compliance", label: "Certificates", icon: ShieldCheck }] : []),
        { key: "attendance", label: "Attendance & leave", icon: UserCheck },
        ...(canSeeAll || role.dept === "Finance" ? [{ key: "finance", label: "Finance data", icon: Landmark }] : []),
      ]
    },
    {
      section: "Insights", items: [
        ...(canAccess("reports") ? [{ key: "reports", label: "Reports", icon: BarChart3 }] : []),
        // ...(canSeeAll ? [{ key: "insights", label: "All insights", icon: Lightbulb }] : []),
        ...(canSeeAll ? [{ key: "supplierPerformance", label: "Supplier performance", icon: TrendingUp }] : []),
        ...(canSeeAll ? [{ key: "notifications", label: "Notifications", icon: Bell }] : []),
        ...(canSeeAll ? [{ key: "debitNotes", label: "Debit notes", icon: ArrowDownRight }] : []),
        ...(canSeeAll ? [{ key: "capas", label: "CAPAs", icon: RefreshCw }] : []),
      ]
    },
    {
      section: null, items: [
        ...(isAdmin || role?.dept === "Administrators" ? [{ key: "auditLogs", label: "Event Logger", icon: Activity }] : []),
        ...(canAccess("settings") ? [{ key: "settings", label: "Settings", icon: SettingsIcon }] : []),
      ]
    },
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
      } catch (e) { }
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
        await resourcesApi.create("suppliers", newSup).catch(() => { });
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
        await resourcesApi.update("suppliers", updatedSup.id, updatedSup).catch(() => { });
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
        await resourcesApi.delete("suppliers", supId).catch(() => { });
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
    } catch (e) { }
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
        await resourcesApi.create("supplierWork", newWork).catch(() => { });
      }
    } catch (err) {
      console.warn("Failed to persist supplier work:", err);
    }
  };

  const handleUpdateWorkStatus = async (workId, newStatus, completedDate) => {
    let updatedWork;
    const exists = supplierWork.some(w => w.id === workId);

    if (exists) {
      updatedWork = supplierWork.map(w => {
        if (w.id === workId) {
          return {
            ...w,
            status: newStatus,
            completedDate: completedDate !== undefined ? completedDate : w.completedDate
          };
        }
        return w;
      });
    } else if (workId.startsWith("stage-")) {
      // Derived stage item id format: stage-${orderId}-${idx}
      const parts = workId.split("-");
      const stageIdxStr = parts.pop();
      const stageIdx = parseInt(stageIdxStr, 10);
      const orderId = parts.slice(1).join("-");

      const parentOrder = orders.find(o => o.id === orderId);
      const stage = parentOrder?.stages?.[stageIdx];

      const newEntry = {
        id: workId,
        orderId,
        supplierName: stage?.supplier || parentOrder?.supplier || "",
        stageIdx,
        dept: stage?.dept || "VAP",
        taskName: stage?.name || "Stage Task",
        purpose: stage?.dept === "VAP" ? "Printing & Embroidery" : "Fabric Processing",
        description: `${stage?.name || 'Task'} for ${orderId} ${parentOrder?.style || ''}`,
        assignedDate: parentOrder?.createdAt ? new Date(parentOrder.createdAt).toISOString().split("T")[0] : "2026-05-01",
        expectedDate: stage?.planned || parentOrder?.ship || "—",
        completedDate: newStatus === "Completed" ? (completedDate || new Date().toISOString().split("T")[0]) : null,
        status: newStatus,
        qualityStatus: "Pending",
        qualityIssueDescription: "",
        createdAt: parentOrder?.createdAt || new Date().toISOString(),
        isDeleted: false
      };

      updatedWork = [newEntry, ...supplierWork];

      // Also sync order stage status
      setOrders(prev => prev.map(o => {
        if (o.id === orderId && o.stages && o.stages[stageIdx]) {
          const stages = o.stages.map((st, i) => {
            if (i === stageIdx) {
              return {
                ...st,
                status: newStatus === "Completed" ? "done" : newStatus === "In Progress" ? "in_progress" : "pending",
                reason: newStatus === "Delayed" ? (st.reason || "Delayed past due") : (st.reason === "Delayed past due" ? null : st.reason)
              };
            }
            return st;
          });
          return { ...o, stages };
        }
        return o;
      }));
    } else {
      updatedWork = supplierWork;
    }

    setSupplierWork(updatedWork);
    try {
      if (window.storage?.set) {
        await window.storage.set("supplierWork", JSON.stringify(updatedWork), true);
      }
      if (resourcesApi?.update) {
        const target = updatedWork.find(w => w.id === workId);
        if (target) {
          if (exists) {
            await resourcesApi.update("supplierWork", workId, target).catch(() => { });
          } else {
            await resourcesApi.create("supplierWork", target).catch(() => { });
          }
        }
      }
    } catch (err) {
      console.warn("Failed to persist work status update:", err);
    }
  };

  const handleUpdateWorkQuality = async (workId, qualityStatus, issueDesc) => {
    let updatedWork;
    const exists = supplierWork.some(w => w.id === workId);

    if (exists) {
      updatedWork = supplierWork.map(w => {
        if (w.id === workId) {
          return {
            ...w,
            qualityStatus,
            qualityIssueDescription: issueDesc || ""
          };
        }
        return w;
      });
    } else if (workId.startsWith("stage-")) {
      const parts = workId.split("-");
      const stageIdxStr = parts.pop();
      const stageIdx = parseInt(stageIdxStr, 10);
      const orderId = parts.slice(1).join("-");

      const parentOrder = orders.find(o => o.id === orderId);
      const stage = parentOrder?.stages?.[stageIdx];

      const newEntry = {
        id: workId,
        orderId,
        supplierName: stage?.supplier || parentOrder?.supplier || "",
        stageIdx,
        dept: stage?.dept || "VAP",
        taskName: stage?.name || "Stage Task",
        purpose: stage?.dept === "VAP" ? "Printing & Embroidery" : "Fabric Processing",
        description: `${stage?.name || 'Task'} for ${orderId} ${parentOrder?.style || ''}`,
        assignedDate: parentOrder?.createdAt ? new Date(parentOrder.createdAt).toISOString().split("T")[0] : "2026-05-01",
        expectedDate: stage?.planned || parentOrder?.ship || "—",
        completedDate: stage?.status === "done" ? parentOrder?.ship : null,
        status: stage?.status === "done" ? "Completed" : "Pending",
        qualityStatus,
        qualityIssueDescription: issueDesc || "",
        createdAt: parentOrder?.createdAt || new Date().toISOString(),
        isDeleted: false
      };

      updatedWork = [newEntry, ...supplierWork];

      // Also sync order stage reason for quality issues
      setOrders(prev => prev.map(o => {
        if (o.id === orderId && o.stages && o.stages[stageIdx]) {
          const stages = o.stages.map((st, i) => {
            if (i === stageIdx) {
              return {
                ...st,
                reason: qualityStatus === "Issue" ? (issueDesc || "Quality rework") : (st.reason === "Quality rework" ? null : st.reason)
              };
            }
            return st;
          });
          return { ...o, stages };
        }
        return o;
      }));
    } else {
      updatedWork = supplierWork;
    }

    setSupplierWork(updatedWork);
    try {
      if (window.storage?.set) {
        await window.storage.set("supplierWork", JSON.stringify(updatedWork), true);
      }
      if (resourcesApi?.update) {
        const target = updatedWork.find(w => w.id === workId);
        if (target) {
          if (exists) {
            await resourcesApi.update("supplierWork", workId, target).catch(() => { });
          } else {
            await resourcesApi.create("supplierWork", target).catch(() => { });
          }
        }
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
        onBack={() => navigate(previousView === "order" ? "orders" : previousView || "orders")}
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
        onUpdateQuotation={updateOrderQuotation}
        onSubmitQuotation={submitOrderQuotation}
        onApproveQuotation={approveOrderQuotation}
        onRejectQuotation={rejectOrderQuotation}
        onSubmitCosting={submitOrderCosting}
        onApproveCosting={approveOrderCosting}
        onRejectCosting={rejectOrderCosting}
        certifications={certifications}
        compliances={compliances}
        suppliers={suppliers}
        onAssignSupplier={handleAssignSupplier}
        onAssignWork={handleAssignWork}
        onAddProductionLog={addOrderProductionLog}
        onDeleteProductionLog={deleteOrderProductionLog}
        onUpdateInspectionData={updateOrderInspectionData}
        onUpdateCertificates={updateOrderCertificates}
        allOrders={orders}
        people={users}
        onReportComplaint={handleReportComplaint}
        onPushNotification={pushNotification}
      />
    );
  } else if (view === "departmentDetail" && selectedDept) {
    if (selectedDept === "Executive (MD)" || selectedDept === "Executive") {
      content = (
        <div>
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => navigate(previousView === "departmentDetail" ? "departments" : previousView || "departments")}
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
                cursor: "pointer",
                marginBottom: 10
              }}
            >
              ← Back to departments
            </button>
          </div>
          <ExecutiveOverviewPage
            orders={orders}
            attendance={attendance}
            financials={financials}
            roster={roster}
            customTasks={customTasks}
            leaveRequests={leaveRequests}
            users={users}
            teams={teams}
            complaints={stageComplaints}
            onResolveComplaint={handleResolveComplaint}
            onOpenOrder={openOrder}
            onNavigate={navigate}
            onApproveCosting={approveOrderCosting}
            onRejectCosting={rejectOrderCosting}
            onRefresh={refreshAllData}
            isRefreshing={isRefreshing}
            lastRefreshedAt={lastRefreshedAt}
            onOpenDept={openDept}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </div>
      );
    } else {
      content = (
        <DepartmentDetail
          deptName={selectedDept}
          orders={orders}
          customTasks={customTasks}
          complaints={stageComplaints}
          onBack={() => navigate(previousView === "departmentDetail" ? "departments" : previousView || "departments")}
          onOpenOrder={openOrder}
          orgStructure={orgStructure}
          deptDescriptions={deptDescriptions}
          onUpdateDepartment={handleUpdateDepartment}
          suppliers={suppliers}
          onAssignWork={handleAssignWork}
          users={users}
          teams={teams}
          attendance={attendance}
          userSessions={userSessions}
        />
      );
    }
  } else if (view === "myDepartment") {
    if (role.dept === "Executive (MD)" || role.dept === "Executive") {
      content = (
        <ExecutiveOverviewPage
          orders={orders}
          attendance={attendance}
          financials={financials}
          roster={roster}
          customTasks={customTasks}
          leaveRequests={leaveRequests}
          users={users}
          teams={teams}
          complaints={stageComplaints}
          onResolveComplaint={handleResolveComplaint}
          onOpenOrder={openOrder}
          onNavigate={navigate}
          onApproveCosting={approveOrderCosting}
          onRejectCosting={rejectOrderCosting}
          onRefresh={refreshAllData}
          isRefreshing={isRefreshing}
          lastRefreshedAt={lastRefreshedAt}
          onOpenDept={openDept}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      );
    } else {
      content = (
        <DepartmentDetail
          deptName={role.dept}
          orders={orders}
          customTasks={customTasks}
          complaints={stageComplaints}
          onBack={() => navigate("dashboard")}
          onOpenOrder={openOrder}
          orgStructure={orgStructure}
          deptDescriptions={deptDescriptions}
          onUpdateDepartment={handleUpdateDepartment}
          suppliers={suppliers}
          onAssignWork={handleAssignWork}
          users={users}
          teams={teams}
          attendance={attendance}
          userSessions={userSessions}
        />
      );
    }
  } else if (view === "orders" && canAccess("orders")) {
    content = (
      <OrdersPage
        orders={orders}
        isAdmin={isAdmin}
        onOpenOrder={openOrder}
        onAddOrder={addOrder}
        onUpdateStages={updateStages}
        onCompleteOrder={completeOrder}
        onUncompleteOrder={uncompleteOrder}
        onDeleteOrder={deleteOrder}
        onRestoreOrder={restoreOrder}
        onPermanentDeleteOrder={permanentDeleteOrder}
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
  } else if (view === "myChecklist") {
    content = (
      <MyChecklistPage
        role={role}
        checklists={departmentChecklists}
        onAddChecklistItem={handleAddChecklistItem}
        onToggleChecklistItem={handleToggleChecklistItem}
        onDeleteChecklistItem={handleDeleteChecklistItem}
      />
    );
  } else if (view === "calendar" && canSeeAll) {
    content = <CalendarPage orders={orders} onOpenOrder={openOrder} />;
  } else if (view === "approvals" && canAccess("approvals")) {
    content = (
      <ApprovalsPage
        orders={orders}
        onOpenOrder={openOrder}
        onApproveCosting={approveOrderCosting}
        onRejectCosting={rejectOrderCosting}
        role={role}
      />
    );
  } else if (view === "departments" && canSeeAll) {
    content = (
      <DepartmentsPage
        orders={orders}
        onOpenDept={openDept}
        orgStructure={orgStructure}
        deptDescriptions={deptDescriptions}
        users={users}
        teams={teams}
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
  } else if (view === "reports" && canAccess("reports")) {
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
  } else if (view === "auditLogs" && (isAdmin || isExecutive || role?.dept === "Administrators")) {
    content = (
      <AuditLoggerPage
        auditLogs={auditLogs}
        userSessions={userSessions}
        onRefresh={refreshUserSessions}
        onClearAuditLogs={() => {
          setAuditLogs([]);
          try {
            localStorage.removeItem("loom_audit_logs");
            if (window.storage?.set) window.storage.set("audit_logs", JSON.stringify([]), true);
          } catch (e) {}
        }}
        users={users}
        teams={teams}
      />
    );
  } else if (view === "attendance") {
    content = (
      <AttendancePage
        roster={roster}
        attendance={attendance}
        onCycle={(staffName) => {
          cycleAttendance(staffName);
          const next = attendance[staffName] === "present" ? "leave" : attendance[staffName] === "leave" ? "absent" : "present";
          logEvent({ eventType: "ATTENDANCE", action: `Updated attendance status for ${staffName} to ${next}`, targetId: staffName });
        }}
        leaveRequests={leaveRequests}
        onApprove={(id) => {
          approveLeave(id);
          const found = leaveRequests.find(l => l.id === id);
          logEvent({ eventType: "LEAVE", action: `Approved leave request for ${found?.name || id}`, targetId: id });
        }}
        onReject={(id) => {
          rejectLeave(id);
          const found = leaveRequests.find(l => l.id === id);
          logEvent({ eventType: "LEAVE", action: `Rejected leave request for ${found?.name || id}`, targetId: id });
        }}
        onAddStaff={addStaff}
        onEditStaff={editStaff}
        onRemoveStaff={removeStaff}
        onAddLeaveRequest={(req) => {
          addLeaveRequest(req);
          logEvent({ eventType: "LEAVE", action: `Submitted leave request for ${req.name} (${req.from} to ${req.to})`, targetId: req.name });
        }}
        userSessions={userSessions}
        isAdmin={isAdmin}
        isMD={role?.isMD || role?.dept === "Executive" || role?.dept === "Executive (MD)"}
        users={users}
        teams={teams}
      />
    );
  } else if (view === "finance" && (canSeeAll || role.dept === "Finance")) {
    content = <FinanceEntryPage orders={orders} financials={financials} onUpdate={updateFinancials} onUpdateOrderCost={updateOrderCost} />;
  } else if (view === "employeePerformance") {
    content = (
      <EmployeePerformancePanel
        orders={orders}
        roster={roster}
        attendance={attendance}
        customTasks={customTasks}
        leaveRequests={leaveRequests}
        users={users}
        teams={teams}
        complaints={stageComplaints}
        onResolveComplaint={handleResolveComplaint}
        isAdmin={isAdmin}
        onNavigate={navigate}
        onBack={() => navigate("executiveOverview")}
      />
    );
  } else if (view === "executiveOverview" && isExecutive) {
    content = (
      <ExecutiveOverviewPage
        orders={orders}
        attendance={attendance}
        financials={financials}
        roster={roster}
        customTasks={customTasks}
        leaveRequests={leaveRequests}
        users={users}
        teams={teams}
        complaints={stageComplaints}
        onResolveComplaint={handleResolveComplaint}
        isAdmin={isAdmin}
        onOpenOrder={openOrder}
        onNavigate={navigate}
        onApproveCosting={approveOrderCosting}
        onRejectCosting={rejectOrderCosting}
        onRefresh={refreshAllData}
        isRefreshing={isRefreshing}
        lastRefreshedAt={lastRefreshedAt}
        onOpenDept={openDept}
        isSidebarCollapsed={isSidebarCollapsed}
      />
    );
  } else if (view === "settings") {
    content = (
      <UserAccessPage users={users} teams={teams} onChangeUsers={handleUsersChange} onChangeTeams={handleTeamsChange} rotation={rotation} onChangeRotation={handleRotationChange} />
    );
  } else if (isExecutive) {
    content = (
      <ExecutiveOverviewPage
        orders={orders}
        attendance={attendance}
        financials={financials}
        roster={roster}
        customTasks={customTasks}
        leaveRequests={leaveRequests}
        users={users}
        teams={teams}
        complaints={stageComplaints}
        onResolveComplaint={handleResolveComplaint}
        isAdmin={isAdmin}
        onOpenOrder={openOrder}
        onNavigate={navigate}
        onApproveCosting={approveOrderCosting}
        onRejectCosting={rejectOrderCosting}
        onRefresh={refreshAllData}
        isRefreshing={isRefreshing}
        lastRefreshedAt={lastRefreshedAt}
        onOpenDept={openDept}
        isSidebarCollapsed={isSidebarCollapsed}
      />
    );
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
        onApproveCosting={approveOrderCosting}
        onRejectCosting={rejectOrderCosting}
        role={role}
        onOpenDept={openDept}
        userSessions={userSessions}
        users={users}
        teams={teams}
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

  // Filter notifications: ONLY assigned tasks and mentioned names hit the notification tray! Other events are in event logger.
  const userNotifications = notifications.filter(n => {
    if (!n || n.isDeleted === true) return false;

    // Strict filter: only assigned tasks or mentioned names
    const isTaskAssignment = n.type === "task" ||
      n.type === "assigned" ||
      n.type === "assignment" ||
      n.isTask === true ||
      (n.title && (
        n.title.toLowerCase().includes("task assigned") ||
        n.title.toLowerCase().includes("assigned") ||
        n.title.toLowerCase().includes("work assigned")
      )) ||
      Boolean(n.assignee || n.targetUser);

    const isMention = n.type === "mention" ||
      n.isMention === true ||
      (n.title && n.title.toLowerCase().includes("mention")) ||
      (n.message && n.message.includes("@"));

    if (!isTaskAssignment && !isMention) return false;

    const isSuper = Boolean(
      role.fullAccess ||
      role.dept === "Executive" ||
      role.dept === "Administrators" ||
      isAdmin ||
      activeUser?.username?.toLowerCase() === "admin" ||
      activeUser?.isMD
    );

    const userDeptList = Array.isArray(role?.departments) && role.departments.length > 0
      ? role.departments.map(d => d.toLowerCase())
      : [(role?.dept || "").toLowerCase()];

    // If notification is explicitly targeted to a person/username
    if (n.targetUser || n.assignee) {
      const target = String(n.targetUser || n.assignee).replace(/^@/, "").trim().toLowerCase();
      const uName = String(activeUser?.username || "").trim().toLowerCase();
      const pName = String(personName || activeUser?.name || "").trim().toLowerCase();
      const isTarget = Boolean(
        (uName && (uName === target || uName.includes(target) || target.includes(uName))) ||
        (pName && (pName === target || pName.includes(target) || target.includes(pName)))
      );
      if (isTarget) return true;
      if (n.targetDept && userDeptList.includes(n.targetDept.toLowerCase())) return true;
      if (isSuper) return true;
      return false;
    }

    if (isSuper) return true;
    if (n.targetDept) {
      return userDeptList.includes(n.targetDept.toLowerCase());
    }
    return true;
  });

  const unreadNotifCount = userNotifications.filter(n => !n.isRead).length;
  const recentNotifications = userNotifications.slice(0, 8);

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

  if (!accessLoaded) return null;
  if (!activeUser) return <LoginPage users={users} onLogin={handleLogin} />;

  return (
    <div
      className={`app-shell ${isDarkMode ? "dark-theme" : ""}`}
      style={{
        display: "flex",
        height: "100vh",
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
          width: isSidebarCollapsed ? 64 : 208,
          background: isDarkMode ? "#060911" : "#151B2E",
          borderRight: `1px solid ${isDarkMode ? "#1E293B" : "transparent"}`,
          padding: "20px 14px",
          flexShrink: 0,
          overflowY: "auto",
          height: "100%",
          transition: "width 0.2s ease"
        }}
      >
        <div style={{ display: "flex", flexDirection: isSidebarCollapsed ? "column" : "row", alignItems: "center", justifyContent: isSidebarCollapsed ? "center" : "space-between", gap: 8, padding: "0 8px 20px", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#1F9E8D", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>G</div>
            {!isSidebarCollapsed && <span style={{ fontWeight: 700, fontSize: 15 }}>GarmaX</span>}
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            data-tooltip={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26,
              padding: 0, border: "none", borderRadius: 6, background: "transparent", color: "#94A3B8", cursor: "pointer"
            }}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        {navSections.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 10 }}>
            {group.section && (
              !isSidebarCollapsed && <div style={{ fontSize: 10, fontWeight: 700, color: isDarkMode ? "#64748B" : "#5C6178", textTransform: "uppercase", letterSpacing: 0.5, padding: "10px 10px 4px" }}>{group.section}</div>
            )}
            {group.items.map(item => {
              const active = view === item.key || (item.key === "orders" && (view === "order")) || (item.key === "departments" && view === "departmentDetail");
              const itemHref = getRouteHash(item.key);
              return (
                <React.Fragment key={item.key}>
                  <a
                    href={itemHref}
                    onClick={(e) => {
                      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        navigate(item.key);
                      }
                    }}
                    className={`sidebar-nav-item ${active ? "active" : ""}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: isSidebarCollapsed ? "center" : "flex-start", gap: isSidebarCollapsed ? 0 : 10, padding: "9px 10px", borderRadius: 8,
                      color: active ? "#fff" : isDarkMode ? "#94A3B8" : "#9498A8", background: active ? (isDarkMode ? "#1F9E8D33" : "#1F9E8D22") : "transparent",
                      fontSize: 13.5, fontWeight: active ? 600 : 500, cursor: "pointer", marginBottom: 2, textDecoration: "none"
                    }}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon size={16} />
                    {!isSidebarCollapsed && item.label}
                  </a>
                </React.Fragment>
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
              {selectedDate !== new Date().toISOString().split("T")[0] && (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  title="Reset to Today"
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
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: 3. Notification → 4. Dark Mode (Moon/Sun) → 5. User Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* 3. Notification */}
            <div ref={notifRef} style={{ position: "relative" }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={toggleSound}
                        title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 1px",
                          borderRadius: 6,
                          border: `1px solid ${soundEnabled ? "#BBF7D0" : (isDarkMode ? "#334155" : "#E2E8F0")}`,
                          background: soundEnabled ? (isDarkMode ? "#064E3B" : "#ECFDF5") : (isDarkMode ? "#1E293B" : "#F8FAFC"),
                          color: soundEnabled ? "#059669" : (isDarkMode ? "#94A3B8" : "#64748B"),
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        <span>{soundEnabled ? "Sound ON" : "Muted"}</span>
                      </button>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          style={{ background: "none", border: "none", color: isDarkMode ? "#A5B4FC" : "#534AB7", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0 }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
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

            {/* Refresh Button */}
            <button
              type="button"
              onClick={refreshAllData}
              disabled={isRefreshing}
              title={`Refresh Dashboard & Orders (Auto-refreshes every 5 mins) · Last synced: ${lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}`}
              style={{
                cursor: isRefreshing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                background: isRefreshing ? (isDarkMode ? "#1E293B" : "#F1F5F9") : (isDarkMode ? "#18233C" : "#F5F6F8"),
                border: `1px solid ${isDarkMode ? "#1E2D4A" : "#E2E8F0"}`,
                color: isRefreshing ? "#94A3B8" : (isDarkMode ? "#CBD5E1" : "#475569"),
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.15s ease"
              }}
              onMouseEnter={e => { if (!isRefreshing) e.currentTarget.style.background = isDarkMode ? "#1C2B47" : "#ECEEF2"; }}
              onMouseLeave={e => { if (!isRefreshing) e.currentTarget.style.background = isDarkMode ? "#18233C" : "#F5F6F8"; }}
            >
              <RefreshCw size={14} className={isRefreshing ? "spin-animate" : ""} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
              <span className="refresh-label">Refresh</span>
            </button>

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
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => navigate("settings")} title="Open account settings">
              <div style={{ width: 30, height: 30, borderRadius: 999, background: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                {role.label.split(" ")[0].slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: isDarkMode ? "#F8FAFC" : "#1B2130" }}>{role.label.split(" (")[0]}</div>
                <div style={{ fontSize: 10.5, color: isDarkMode ? "#94A3B8" : "#8A8D98" }}>{role.dept}</div>
              </div>
              <button onClick={event => { event.stopPropagation(); handleLogout(); }} style={{ border: "1px solid #D1D5DB", background: "transparent", borderRadius: 6, padding: "5px 8px", color: isDarkMode ? "#CBD5E1" : "#565A66", fontSize: 11, cursor: "pointer" }}>Sign out</button>
            </div>
          </div>
        </div>

        {/* Scrollable Viewport */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {content}
        </div>
      </div>
      <ProjectChatbot orders={orders} onOpenOrder={openOrder} userId={activeUser.id} />
      <CuttingDelayAlertModal
        orders={orders}
        role={role}
        activeUser={activeUser}
        onOpenOrder={openOrder}
      />
    </div>
  );
}
