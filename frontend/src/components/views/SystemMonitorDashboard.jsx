import React, { useState, useMemo, useEffect } from "react";
import {
  Activity, Laptop, Smartphone, MapPin, RefreshCw, Trash2, CheckCircle2,
  AlertTriangle, Clock, Search, Filter, ShieldAlert, ArrowUpRight,
  UserCheck, Users, Calendar, Eye, Download, LogOut, ChevronRight, Layers,
  Package, ShieldCheck, Flame, Radio, CheckCircle, Info, Sparkles, X,
  RotateCcw, Building2, User
} from "lucide-react";

export function SystemMonitorDashboard({
  userSessions = [],
  auditLogs = [],
  orders = [],
  users = [],
  teams = [],
  activeUser = null,
  isDeveloper = false,
  onRefresh = null,
  onClearAuditLogs = null,
  onNavigateToApp = null,
  onLogout = null
}) {
  const [tick, setTick] = useState(() => Date.now());

  // 1. Date Filter State: Defaults to today ("YYYY-MM-DD") or "ALL" for all history
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  // 2. Department Filter State: "ALL" or specific department name
  const [selectedDept, setSelectedDept] = useState("ALL");

  // 3. User Filter State: "ALL" or specific username
  const [selectedUser, setSelectedUser] = useState("ALL");

  // 4. Stage Filter State: "ALL" or specific stage name
  const [selectedStage, setSelectedStage] = useState("ALL");

  // Search & segment states
  const [userSearch, setUserSearch] = useState("");
  const [userSegment, setUserSegment] = useState("ADMIN_MD"); // "ADMIN_MD" | "ALL" | "STAFF"

  // Live tick every 15s for active online state & durations
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now());
      if (typeof onRefresh === "function") onRefresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const todayStr = useMemo(() => {
    const d = new Date(tick);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [tick]);

  const yesterdayStr = useMemo(() => {
    const d = new Date(tick);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [tick]);

  const currentTimeFormatted = useMemo(() => {
    return new Date(tick).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  }, [tick]);

  // Compute selected day start & end timestamps
  const targetDateRange = useMemo(() => {
    if (selectedDate === "ALL") {
      return { isAll: true, startMs: 0, endMs: tick, dateStr: "ALL" };
    }
    try {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        const start = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
        const end = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59, 999);
        return { isAll: false, startMs: start.getTime(), endMs: end.getTime(), dateStr: selectedDate };
      }
    } catch (e) { }
    const now = new Date(tick);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { isAll: false, startMs: start.getTime(), endMs: end.getTime(), dateStr: todayStr };
  }, [selectedDate, tick, todayStr]);

  // Consolidate all audit logs and order stage completions into one synchronized source
  const effectiveAuditLogs = useMemo(() => {
    const list = Array.isArray(auditLogs) ? [...auditLogs] : [];

    (orders || []).forEach(o => {
      const orderId = o.id || o.orderId || "";
      (o.stages || []).forEach(st => {
        if (st.status === "done" && st.completedAt) {
          const alreadyLogged = list.some(l =>
            l.eventType === "STAGE" &&
            String(l.targetId) === String(orderId) &&
            (l.metadata?.stageName === st.name || (l.action && l.action.includes(`"${st.name}"`)))
          );
          if (!alreadyLogged) {
            const completedByName = st.completedBy || "Managing Director";
            const matchingSession = (userSessions || []).find(us =>
              (us.name && us.name.toLowerCase() === completedByName.toLowerCase()) ||
              (us.username && us.username.toLowerCase() === completedByName.toLowerCase())
            );
            list.push({
              id: `stage_auto_${orderId}_${st.name}_${st.completedAt}`,
              timestamp: st.completedAt,
              eventType: "STAGE",
              action: `Marked stage "${st.name}" as Done on order #${orderId}`,
              userName: completedByName,
              username: matchingSession?.username || completedByName.toLowerCase().replace(/\s+/g, ""),
              userDept: st.dept || matchingSession?.dept || (completedByName.toLowerCase().includes("director") || completedByName.toLowerCase().includes("md") ? "Executive (MD)" : "Operations"),
              device: matchingSession?.device || "Web Browser",
              deviceType: matchingSession?.deviceType || "Browser",
              location: matchingSession?.location || "Office Network",
              targetId: orderId,
              metadata: { orderId, stageName: st.name, dept: st.dept, completedBy: completedByName, source: "order_stage" }
            });
          }
        }
      });
    });

    return list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [auditLogs, orders, userSessions]);

  // Dynamic Departments for filter dropdown
  const availableDepts = useMemo(() => {
    const set = new Set();
    set.add("Executive (MD)");
    set.add("Administrators");
    (teams || []).forEach(t => { if (t.name) set.add(t.name.trim()); });
    (users || []).forEach(u => {
      if (u.dept) set.add(u.dept.trim());
      if (Array.isArray(u.departments)) u.departments.forEach(d => set.add(d.trim()));
    });
    effectiveAuditLogs.forEach(l => {
      if (l.userDept) set.add(l.userDept.trim());
      if (l.metadata?.dept) set.add(l.metadata.dept.trim());
    });
    return Array.from(set).filter(Boolean).sort();
  }, [teams, users, effectiveAuditLogs]);

  // Dynamic Users for filter dropdown
  const availableUsersList = useMemo(() => {
    const map = new Map();
    // Prioritize MD and Admin at the top
    map.set("md", { username: "md", name: "Managing Director", dept: "Executive (MD)" });
    map.set("admin", { username: "admin", name: "Administrator", dept: "Administrators" });

    (users || []).forEach(u => {
      if (u.isDeveloper || u.isSystemMonitor || u.username === "dev" || u.username === "developer" || u.username === "monitor") return;
      const key = (u.username || u.name || u.id).toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          username: u.username || key,
          name: u.name || u.username || "User",
          dept: u.dept || (u.teamId === "team-admin" ? "Administrators" : "General")
        });
      }
    });

    // Also include from user sessions
    (userSessions || []).forEach(s => {
      const key = (s.username || s.name || "").toLowerCase();
      if (key && key !== "dev" && key !== "developer" && key !== "monitor" && !map.has(key)) {
        map.set(key, {
          username: s.username || key,
          name: s.name || s.username || "User",
          dept: s.dept || "General"
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const isA = a.username === "md" || a.username === "admin";
      const isB = b.username === "md" || b.username === "admin";
      if (isA !== isB) return isA ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [users, userSessions]);

  // Dynamic Stages for filter dropdown
  const availableStagesList = useMemo(() => {
    const set = new Set();
    (orders || []).forEach(o => {
      (o.stages || []).forEach(s => {
        if (s.name && s.name.trim()) set.add(s.name.trim());
      });
    });
    effectiveAuditLogs.forEach(l => {
      if (l.metadata?.stageName) set.add(l.metadata.stageName.trim());
      if (l.eventType === "STAGE" && l.action) {
        const match = l.action.match(/"([^"]+)"/);
        if (match && match[1]) set.add(match[1].trim());
      }
    });
    return Array.from(set).filter(Boolean).sort();
  }, [orders, effectiveAuditLogs]);

  // Consolidate per-user sessions & screen time FOR THE SELECTED DATE
  const userDurationStats = useMemo(() => {
    const userMap = new Map();

    (users || []).forEach(u => {
      if (u.isDeveloper || u.isSystemMonitor || u.username === "dev" || u.username === "developer" || u.username === "monitor") return;
      const userTeamIds = Array.isArray(u.teamIds) && u.teamIds.length > 0 ? u.teamIds : (u.teamId ? [u.teamId] : []);
      const userDepts = Array.isArray(teams) ? teams.filter(t => userTeamIds.includes(t.id)).map(t => t.name) : [];
      const primaryDept = userDepts[0] || (u.teamId === "team-admin" ? "Administrators" : (u.dept || "General"));
      const key = (u.username || u.name || u.id).toLowerCase();

      userMap.set(key, {
        id: u.id,
        username: u.username || "",
        name: u.name || u.username || "User",
        dept: primaryDept,
        departments: userDepts.length > 0 ? userDepts : [primaryDept],
        selectedDateIntervals: [],
        overallIntervals: [],
        selectedDateMinutes: 0,
        overallMinutes: 0,
        isOnline: false,
        selectedDateLogins: 0,
        totalLogins: 0,
        lastLoginTime: null,
        lastDevice: null,
        lastLocation: null
      });
    });

    (userSessions || []).forEach(sess => {
      const userKey = (sess.username || sess.name || sess.userId || "").toLowerCase();
      if (!userKey || userKey === "dev" || userKey === "developer" || userKey === "monitor") return;

      let rec = userMap.get(userKey);
      if (!rec) {
        for (const v of userMap.values()) {
          if ((sess.userId && v.id === sess.userId) || (sess.username && v.username && v.username.toLowerCase() === sess.username.toLowerCase())) {
            rec = v;
            break;
          }
        }
      }

      if (!rec) {
        rec = {
          id: sess.userId || userKey,
          username: sess.username || userKey,
          name: sess.name || sess.username || "User",
          dept: sess.dept || "General",
          departments: [sess.dept || "General"],
          selectedDateIntervals: [],
          overallIntervals: [],
          selectedDateMinutes: 0,
          overallMinutes: 0,
          isOnline: false,
          selectedDateLogins: 0,
          totalLogins: 0,
          lastLoginTime: null,
          lastDevice: null,
          lastLocation: null
        };
        userMap.set(userKey, rec);
      }

      const loginMs = sess.loginTime ? new Date(sess.loginTime).getTime() : 0;
      const logoutMs = sess.logoutTime ? new Date(sess.logoutTime).getTime() : 0;
      const lastHeartbeatMs = sess.lastHeartbeat ? new Date(sess.lastHeartbeat).getTime() : loginMs;
      const timeSinceHeartbeatMs = tick - lastHeartbeatMs;

      // Online status: currently active today with recent heartbeat within 5 mins
      const isOnlineSession = sess.active && loginMs > 0 && timeSinceHeartbeatMs < 5 * 60 * 1000;
      if (isOnlineSession) rec.isOnline = true;

      let endMs = isOnlineSession ? tick : (logoutMs >= loginMs ? logoutMs : (lastHeartbeatMs > loginMs ? lastHeartbeatMs : loginMs + 60000));
      endMs = Math.min(tick, Math.max(loginMs, endMs));

      // Check if session falls on selected date range
      if (targetDateRange.isAll) {
        if (loginMs > 0) {
          rec.selectedDateIntervals.push([loginMs, endMs]);
          rec.selectedDateLogins += 1;
        }
      } else {
        const overlapStart = Math.max(loginMs, targetDateRange.startMs);
        const overlapEnd = Math.min(endMs, targetDateRange.endMs);
        if (overlapEnd > overlapStart) {
          rec.selectedDateIntervals.push([overlapStart, overlapEnd]);
          rec.selectedDateLogins += 1;
        }
      }

      if (loginMs > 0) {
        rec.overallIntervals.push([loginMs, endMs]);
        rec.totalLogins += 1;
      }

      if (!rec.lastLoginTime || (sess.loginTime && new Date(sess.loginTime) > new Date(rec.lastLoginTime))) {
        rec.lastLoginTime = sess.loginTime;
        rec.lastDevice = sess.device || (sess.deviceType ? `${sess.deviceType} (${sess.platform || "Browser"})` : null);
        rec.lastLocation = sess.location;
      }
    });

    const mergeIntervalsMinutes = (intervals) => {
      if (!intervals || intervals.length === 0) return 0;
      const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
      let totalMs = 0;
      let cur = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        if (next[0] <= cur[1]) {
          cur[1] = Math.max(cur[1], next[1]);
        } else {
          totalMs += Math.max(0, cur[1] - cur[0]);
          cur = next;
        }
      }
      totalMs += Math.max(0, cur[1] - cur[0]);
      return totalMs / 60000;
    };

    userMap.forEach(rec => {
      rec.selectedDateMinutes = Math.round(mergeIntervalsMinutes(rec.selectedDateIntervals) * 10) / 10;
      rec.overallMinutes = Math.round(mergeIntervalsMinutes(rec.overallIntervals) * 10) / 10;
    });

    return Array.from(userMap.values()).sort((a, b) => {
      const isAExec = a.username === "md" || a.username === "admin";
      const isBExec = b.username === "md" || b.username === "admin";
      if (isAExec !== isBExec) return isAExec ? -1 : 1;
      if (a.isOnline !== b.isOnline) return b.isOnline ? 1 : -1;
      return b.selectedDateMinutes - a.selectedDateMinutes;
    });
  }, [users, teams, userSessions, targetDateRange, tick]);

  // Key user stats
  const mdStats = useMemo(() => {
    return userDurationStats.find(u =>
      u.username === "md" ||
      u.dept.toLowerCase().includes("executive") ||
      u.name.toLowerCase().includes("director")
    ) || null;
  }, [userDurationStats]);

  const adminStats = useMemo(() => {
    return userDurationStats.find(u =>
      u.username === "admin" ||
      u.dept.toLowerCase().includes("admin") ||
      u.name.toLowerCase().includes("admin")
    ) || null;
  }, [userDurationStats]);

  // Filter audit logs specifically by selected date
  const dateFilteredLogs = useMemo(() => {
    if (targetDateRange.isAll) return effectiveAuditLogs;
    return effectiveAuditLogs.filter(log => {
      if (!log.timestamp) return false;
      const rawTs = String(log.timestamp);
      const isoDate = rawTs.slice(0, 10);
      let localDate = "";
      try {
        const d = new Date(log.timestamp);
        if (!isNaN(d.getTime())) {
          localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }
      } catch (e) { }
      return isoDate === targetDateRange.dateStr || localDate === targetDateRange.dateStr || rawTs.startsWith(targetDateRange.dateStr);
    });
  }, [effectiveAuditLogs, targetDateRange]);

  // Fully Filtered Logs (Date + Department + User + Stage)
  const fullyFilteredLogs = useMemo(() => {
    return dateFilteredLogs.filter(log => {
      // 1. Department filter
      if (selectedDept !== "ALL") {
        const logDept = (log.userDept || log.metadata?.dept || "").toLowerCase();
        if (!logDept.includes(selectedDept.toLowerCase())) return false;
      }

      // 2. Particular User filter
      if (selectedUser !== "ALL") {
        const targetU = selectedUser.toLowerCase();
        const matchesUser = (
          (log.username && log.username.toLowerCase() === targetU) ||
          (log.userName && log.userName.toLowerCase() === targetU) ||
          (log.metadata?.completedBy && log.metadata.completedBy.toLowerCase() === targetU)
        );
        if (!matchesUser) return false;
      }

      // 3. Stage filter
      if (selectedStage !== "ALL") {
        const targetS = selectedStage.toLowerCase();
        const stageName = (log.metadata?.stageName || "").toLowerCase();
        const actionStr = (log.action || "").toLowerCase();
        const matchesStage = stageName === targetS || actionStr.includes(`"${targetS}"`) || actionStr.includes(targetS);
        if (!matchesStage) return false;
      }

      return true;
    });
  }, [dateFilteredLogs, selectedDept, selectedUser, selectedStage]);

  // Deletions on selected date (matching filters)
  const deletionsOnDate = useMemo(() => {
    return fullyFilteredLogs.filter(l =>
      l.eventType === "DELETE" ||
      (l.action && l.action.toLowerCase().includes("delet")) ||
      l.metadata?.actionType?.includes("DELETE")
    );
  }, [fullyFilteredLogs]);

  // Stages completed on selected date (matching filters)
  const stagesDoneOnDate = useMemo(() => {
    return fullyFilteredLogs.filter(l =>
      l.eventType === "STAGE" && (l.action && l.action.includes("Done"))
    );
  }, [fullyFilteredLogs]);

  // Orders created on selected date (matching filters)
  const ordersCreatedOnDate = useMemo(() => {
    if (selectedStage !== "ALL") return [];
    return fullyFilteredLogs.filter(l =>
      l.eventType === "ORDER" && (l.action && l.action.includes("Created"))
    );
  }, [fullyFilteredLogs, selectedStage]);

  // Filtered users table based on segment, department, user search, and particular user filter
  const filteredUsers = useMemo(() => {
    return userDurationStats.filter(u => {
      const isMD = (u.username === "md" || u.dept.toLowerCase().includes("executive") || u.name.toLowerCase().includes("director"));
      const isAdmin = (u.username === "admin" || u.dept.toLowerCase().includes("admin") || u.name.toLowerCase().includes("admin"));

      // Segment check
      if (userSegment === "ADMIN_MD" && !isMD && !isAdmin) return false;
      if (userSegment === "STAFF" && (isMD || isAdmin)) return false;

      // Department filter
      if (selectedDept !== "ALL") {
        const matchesDept = (u.dept && u.dept.toLowerCase().includes(selectedDept.toLowerCase())) ||
          (Array.isArray(u.departments) && u.departments.some(d => d.toLowerCase().includes(selectedDept.toLowerCase())));
        if (!matchesDept) return false;
      }

      // Particular User filter
      if (selectedUser !== "ALL") {
        const targetU = selectedUser.toLowerCase();
        const matches = (u.username && u.username.toLowerCase() === targetU) ||
          (u.name && u.name.toLowerCase() === targetU) ||
          (u.id && u.id.toLowerCase() === targetU);
        if (!matches) return false;
      }

      // Search text filter
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        return (u.name && u.name.toLowerCase().includes(q)) || (u.username && u.username.toLowerCase().includes(q)) || (u.dept && u.dept.toLowerCase().includes(q));
      }
      return true;
    });
  }, [userDurationStats, userSegment, userSearch, selectedDept, selectedUser]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedDate !== todayStr) count++;
    if (selectedDept !== "ALL") count++;
    if (selectedUser !== "ALL") count++;
    if (selectedStage !== "ALL") count++;
    return count;
  }, [selectedDate, todayStr, selectedDept, selectedUser, selectedStage]);

  const resetAllFilters = () => {
    setSelectedDate(todayStr);
    setSelectedDept("ALL");
    setSelectedUser("ALL");
    setSelectedStage("ALL");
    setUserSearch("");
  };

  const formatMins = (minutes) => {
    if (!minutes || minutes <= 0) return "0 mins";
    const m = Math.round(minutes);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h === 0) return `${m} mins`;
    return `${h}h ${remM > 0 ? `${remM}m` : ""}`.trim();
  };

  const renderDeviceBadge = (deviceStr, deviceType) => {
    const s = String(deviceStr || deviceType || "").toLowerCase();
    if (s.includes("android")) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EFF6FF", color: "#1D4ED8", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "1px solid #BFDBFE" }}>
          <Smartphone size={13} color="#2563EB" /> Android Mobile
        </span>
      );
    }
    if (s.includes("ios") || s.includes("tablet") || s.includes("safari")) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FAF5FF", color: "#7E22CE", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "1px solid #E9D5FF" }}>
          <Smartphone size={13} color="#9333EA" /> Tablet (iOS Safari)
        </span>
      );
    }
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F0FDF4", color: "#15803D", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "1px solid #BBF7D0" }}>
        <Laptop size={13} color="#16A34A" /> Windows PC Desktop
      </span>
    );
  };

  const selectedDateLabel = useMemo(() => {
    if (selectedDate === "ALL") return "All Time Cumulative History";
    if (selectedDate === todayStr) return `Today (${todayStr})`;
    if (selectedDate === yesterdayStr) return `Yesterday (${yesterdayStr})`;
    return `Date: ${selectedDate}`;
  }, [selectedDate, todayStr, yesterdayStr]);

  return (
    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "16px 20px 48px", fontFamily: "inherit", color: "#0F172A" }}>
      
      {/* 1. TOP COMMAND BAR */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)",
        color: "#FFFFFF",
        padding: "18px 24px",
        borderRadius: 16,
        marginBottom: 18,
        boxShadow: "0 12px 30px -6px rgba(15, 23, 42, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 16px rgba(79, 70, 229, 0.4)"
          }}>
            <Activity size={26} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
                System Activity & Security Monitor
              </h1>
              <span style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#34D399",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: 5
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                REALTIME
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "#94A3B8", marginTop: 3 }}>
              Developer Live Cockpit · Full surveillance of MD, Admin, staff screen time, device platforms, T&A stages, and deletions.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            padding: "6px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            textAlign: "right"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#38BDF8" }}>{currentTimeFormatted}</div>
            <div style={{ fontSize: 10.5, color: "#94A3B8" }}>System Local Time</div>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 9,
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
              title="Refresh telemetry"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          )}

          {onNavigateToApp && (
            <button
              type="button"
              onClick={onNavigateToApp}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 15px",
                borderRadius: 9,
                background: "#4F46E5",
                border: "none",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)"
              }}
            >
              Open Full PLM <ChevronRight size={14} />
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{
                padding: "9px 12px",
                borderRadius: 9,
                background: "rgba(239, 68, 68, 0.18)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#FCA5A5",
                fontSize: 12,
                cursor: "pointer"
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. ADVANCED MULTI-DIMENSIONAL FILTER TOOLBAR */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: 16,
        border: "1.5px solid #CBD5E1",
        padding: "16px 20px",
        marginBottom: 20,
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)"
      }}>
        {/* ROW 1: Date Presets & Date Picker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingBottom: 14, borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#334155", display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
              <Calendar size={16} color="#4F46E5" /> 1. Date Filter:
            </span>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              style={{
                padding: "6px 13px",
                borderRadius: 8,
                border: selectedDate === todayStr ? "1.5px solid #4F46E5" : "1px solid #CBD5E1",
                background: selectedDate === todayStr ? "#EEF2FF" : "#FFFFFF",
                color: selectedDate === todayStr ? "#4F46E5" : "#334155",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Today ({todayStr})
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              style={{
                padding: "6px 13px",
                borderRadius: 8,
                border: selectedDate === yesterdayStr ? "1.5px solid #4F46E5" : "1px solid #CBD5E1",
                background: selectedDate === yesterdayStr ? "#EEF2FF" : "#FFFFFF",
                color: selectedDate === yesterdayStr ? "#4F46E5" : "#334155",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Yesterday ({yesterdayStr})
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate("ALL")}
              style={{
                padding: "6px 13px",
                borderRadius: 8,
                border: selectedDate === "ALL" ? "1.5px solid #0F172A" : "1px solid #CBD5E1",
                background: selectedDate === "ALL" ? "#0F172A" : "#FFFFFF",
                color: selectedDate === "ALL" ? "#FFFFFF" : "#334155",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              All Time History
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Custom Calendar:</span>
            <input
              type="date"
              value={selectedDate === "ALL" ? "" : selectedDate}
              onChange={e => setSelectedDate(e.target.value || todayStr)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1.5px solid #CBD5E1",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#0F172A",
                background: "#F8FAFC",
                cursor: "pointer"
              }}
            />
          </div>
        </div>

        {/* ROW 2: Department + Particular User + T&A Stage Dropdowns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, paddingTop: 14, alignItems: "center" }}>
          
          {/* Department Filter */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
              <Building2 size={14} color="#0891B2" /> 2. Filter Department:
            </label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: selectedDept !== "ALL" ? "2px solid #0891B2" : "1.5px solid #CBD5E1",
                background: selectedDept !== "ALL" ? "#ECFEFF" : "#F8FAFC",
                color: selectedDept !== "ALL" ? "#0E7490" : "#0F172A",
                fontSize: 12.5,
                fontWeight: selectedDept !== "ALL" ? 700 : 500,
                cursor: "pointer"
              }}
            >
              <option value="ALL">All Departments (Show All)</option>
              {availableDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Particular User Filter */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
              <User size={14} color="#4F46E5" /> 3. Filter Particular User:
            </label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: selectedUser !== "ALL" ? "2px solid #4F46E5" : "1.5px solid #CBD5E1",
                background: selectedUser !== "ALL" ? "#EEF2FF" : "#F8FAFC",
                color: selectedUser !== "ALL" ? "#4338CA" : "#0F172A",
                fontSize: 12.5,
                fontWeight: selectedUser !== "ALL" ? 700 : 500,
                cursor: "pointer"
              }}
            >
              <option value="ALL">All Users (MD, Admin & Staff)</option>
              <optgroup label="Leadership & Executives">
                <option value="md">👑 Managing Director (MD)</option>
                <option value="admin">🛡️ Administrator (Admin)</option>
              </optgroup>
              <optgroup label="Staff & Merchandisers">
                {availableUsersList
                  .filter(u => u.username !== "md" && u.username !== "admin")
                  .map(u => (
                    <option key={u.username || u.id} value={u.username}>
                      {u.name} ({u.dept})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* T&A Stage Filter */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 5 }}>
              <Layers size={14} color="#10B981" /> 4. Filter T&A Stage:
            </label>
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: selectedStage !== "ALL" ? "2px solid #10B981" : "1.5px solid #CBD5E1",
                background: selectedStage !== "ALL" ? "#ECFDF5" : "#F8FAFC",
                color: selectedStage !== "ALL" ? "#047857" : "#0F172A",
                fontSize: 12.5,
                fontWeight: selectedStage !== "ALL" ? 700 : 500,
                cursor: "pointer"
              }}
            >
              <option value="ALL">All T&A Stages</option>
              {availableStagesList.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters / Active Summary */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: "100%", paddingTop: 20 }}>
            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: activeFilterCount > 0 ? "1.5px solid #DC2626" : "1px solid #CBD5E1",
                background: activeFilterCount > 0 ? "#FEE2E2" : "#F1F5F9",
                color: activeFilterCount > 0 ? "#B91C1C" : "#64748B",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              <RotateCcw size={13} />
              Reset Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE FILTER SUMMARY CHIPS */}
      <div style={{
        background: activeFilterCount > 0 ? "linear-gradient(90deg, #EEF2FF 0%, #F0FDF4 100%)" : "#F8FAFC",
        border: activeFilterCount > 0 ? "1.5px solid #C7D2FE" : "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "10px 16px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        fontSize: 12.5
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, color: "#1E1B4B", display: "flex", alignItems: "center", gap: 5 }}>
            <Filter size={15} color="#4F46E5" /> Active Scope:
          </span>

          <span style={{ background: "#FFFFFF", padding: "3px 9px", borderRadius: 6, border: "1px solid #CBD5E1", fontWeight: 700, color: "#334155" }}>
            📅 {selectedDateLabel}
          </span>

          {selectedDept !== "ALL" && (
            <span style={{ background: "#CFFAFE", color: "#0E7490", padding: "3px 9px", borderRadius: 6, border: "1px solid #A5F3FC", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
              🏢 Dept: {selectedDept}
              <X size={13} style={{ cursor: "pointer" }} onClick={() => setSelectedDept("ALL")} />
            </span>
          )}

          {selectedUser !== "ALL" && (
            <span style={{ background: "#E0E7FF", color: "#4338CA", padding: "3px 9px", borderRadius: 6, border: "1px solid #C7D2FE", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
              👤 User: {selectedUser}
              <X size={13} style={{ cursor: "pointer" }} onClick={() => setSelectedUser("ALL")} />
            </span>
          )}

          {selectedStage !== "ALL" && (
            <span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 9px", borderRadius: 6, border: "1px solid #A7F3D0", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
              📑 Stage: {selectedStage}
              <X size={13} style={{ cursor: "pointer" }} onClick={() => setSelectedStage("ALL")} />
            </span>
          )}
        </div>

        <div style={{ color: "#475569", fontWeight: 600 }}>
          Telemetry Events Matching: <strong style={{ color: "#4F46E5" }}>{fullyFilteredLogs.length} Records</strong>
        </div>
      </div>

      {/* 3. FOUR PRIMARY SURVEILLANCE KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        
        {/* CARD 1: MANAGING DIRECTOR (MD) */}
        <div style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 100%)",
          borderRadius: 14,
          border: "1.5px solid #C7D2FE",
          padding: "18px 20px",
          boxShadow: "0 4px 12px rgba(79, 70, 229, 0.06)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#4F46E5", textTransform: "uppercase", letterSpacing: 0.6 }}>
              👑 Managing Director (MD)
            </span>
            {mdStats?.isOnline ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#ECFDF5", color: "#059669", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} /> ONLINE NOW
              </span>
            ) : (
              <span style={{ background: "#F1F5F9", color: "#64748B", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>OFFLINE</span>
            )}
          </div>
          
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1E1B4B", marginTop: 10 }}>
            {formatMins(mdStats?.selectedDateMinutes || 0)}
          </div>
          
          <div style={{ fontSize: 12, color: "#6366F1", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Screen Time on Date</span>
            <span style={{ fontWeight: 700 }}>{mdStats?.selectedDateLogins || 0} Logins</span>
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #E0E7FF", fontSize: 11.5, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
            <span>Device:</span>
            <strong>{mdStats?.lastDevice || (mdStats?.isOnline ? "Active Web Session" : "No Activity Today")}</strong>
          </div>
        </div>

        {/* CARD 2: ADMINISTRATOR (ADMIN) */}
        <div style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #ECFEFF 100%)",
          borderRadius: 14,
          border: "1.5px solid #A5F3FC",
          padding: "18px 20px",
          boxShadow: "0 4px 12px rgba(8, 145, 178, 0.06)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#0891B2", textTransform: "uppercase", letterSpacing: 0.6 }}>
              🛡️ Administrator (Admin)
            </span>
            {adminStats?.isOnline ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#ECFDF5", color: "#059669", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} /> ONLINE NOW
              </span>
            ) : (
              <span style={{ background: "#F1F5F9", color: "#64748B", padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>OFFLINE</span>
            )}
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: "#164E63", marginTop: 10 }}>
            {formatMins(adminStats?.selectedDateMinutes || 0)}
          </div>

          <div style={{ fontSize: 12, color: "#0891B2", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Screen Time on Date</span>
            <span style={{ fontWeight: 700 }}>{adminStats?.selectedDateLogins || 0} Logins</span>
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #CFFAFE", fontSize: 11.5, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
            <span>Device:</span>
            <strong>{adminStats?.lastDevice || (adminStats?.isOnline ? "Active Web Session" : "No Activity Today")}</strong>
          </div>
        </div>

        {/* CARD 3: 🔴 CRITICAL DELETIONS LEDGER */}
        <div style={{
          background: deletionsOnDate.length > 0 ? "linear-gradient(180deg, #FFFFFF 0%, #FEF2F2 100%)" : "#FFFFFF",
          borderRadius: 14,
          border: deletionsOnDate.length > 0 ? "2px solid #F87171" : "1.5px solid #E2E8F0",
          padding: "18px 20px",
          boxShadow: deletionsOnDate.length > 0 ? "0 6px 16px rgba(220, 38, 38, 0.12)" : "none"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: 0.6 }}>
              🔴 Deletions Detected
            </span>
            <span style={{
              background: deletionsOnDate.length > 0 ? "#FEE2E2" : "#ECFDF5",
              color: deletionsOnDate.length > 0 ? "#B91C1C" : "#059669",
              padding: "3px 8px",
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 800
            }}>
              {deletionsOnDate.length > 0 ? "DELETION FOUND" : "NO DELETIONS"}
            </span>
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: deletionsOnDate.length > 0 ? "#991B1B" : "#0F172A", marginTop: 10 }}>
            {deletionsOnDate.length} <span style={{ fontSize: 15, fontWeight: 600 }}>Items</span>
          </div>

          <div style={{ fontSize: 12, color: deletionsOnDate.length > 0 ? "#DC2626" : "#64748B", marginTop: 4 }}>
            Orders, T&A Stages & Tasks Removed
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #FECACA", fontSize: 11.5, color: "#991B1B" }}>
            Permanent tamper-proof audit trail
          </div>
        </div>

        {/* CARD 4: PIPELINE ACTIONS */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: "1.5px solid #E2E8F0",
          padding: "18px 20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Pipeline Progress Under Filter
            </span>
            <span style={{ background: "#F1F5F9", color: "#475569", padding: "3px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>
              Live Telemetry
            </span>
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", marginTop: 10 }}>
            {stagesDoneOnDate.length + ordersCreatedOnDate.length} <span style={{ fontSize: 15, fontWeight: 600 }}>Actions</span>
          </div>

          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{stagesDoneOnDate.length} Stages Completed</span>
            <span>{ordersCreatedOnDate.length} Orders Created</span>
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #E2E8F0", fontSize: 11.5, color: "#475569" }}>
            Monitored Accounts: <strong>{filteredUsers.length} Users</strong>
          </div>
        </div>
      </div>

      {/* 4. SECTION: CLIENT SCREEN TIME & SESSIONS TABLE */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: 16,
        border: "1.5px solid #E2E8F0",
        padding: "22px 24px",
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 9 }}>
              <Clock size={19} color="#4F46E5" /> Client Usage & Screen Time Surveillance
            </h2>
            <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 3 }}>
              Exact active time on <strong>{selectedDateLabel}</strong>, device platform, and last detected location.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Segment Filter */}
            <div style={{ display: "inline-flex", alignItems: "center", background: "#F1F5F9", padding: "3px", borderRadius: 9, border: "1px solid #E2E8F0" }}>
              <button
                type="button"
                onClick={() => setUserSegment("ADMIN_MD")}
                style={{
                  padding: "6px 13px",
                  borderRadius: 7,
                  border: "none",
                  background: userSegment === "ADMIN_MD" ? "#4F46E5" : "transparent",
                  color: userSegment === "ADMIN_MD" ? "#FFFFFF" : "#4F46E5",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: userSegment === "ADMIN_MD" ? "0 2px 5px rgba(79, 70, 229, 0.25)" : "none"
                }}
              >
                👑 MD & Admin Focus
              </button>
              <button
                type="button"
                onClick={() => setUserSegment("ALL")}
                style={{
                  padding: "6px 13px",
                  borderRadius: 7,
                  border: "none",
                  background: userSegment === "ALL" ? "#FFFFFF" : "transparent",
                  color: userSegment === "ALL" ? "#0F172A" : "#64748B",
                  fontSize: 12,
                  fontWeight: userSegment === "ALL" ? 700 : 500,
                  cursor: "pointer"
                }}
              >
                All Users ({userDurationStats.length})
              </button>
              <button
                type="button"
                onClick={() => setUserSegment("STAFF")}
                style={{
                  padding: "6px 13px",
                  borderRadius: 7,
                  border: "none",
                  background: userSegment === "STAFF" ? "#FFFFFF" : "transparent",
                  color: userSegment === "STAFF" ? "#0F172A" : "#64748B",
                  fontSize: 12,
                  fontWeight: userSegment === "STAFF" ? 700 : 500,
                  cursor: "pointer"
                }}
              >
                Staff Only
              </button>
            </div>

            {/* Search Box */}
            <div style={{ position: "relative", minWidth: 210 }}>
              <input
                type="text"
                placeholder="Search user name or dept..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 12px 7px 30px",
                  borderRadius: 8,
                  border: "1.5px solid #CBD5E1",
                  fontSize: 12,
                  boxSizing: "border-box"
                }}
              />
              <Search size={14} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2E8F0", background: "#F8FAFC" }}>
                <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>Client Account</th>
                <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>Department</th>
                <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>Live Status</th>
                <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>Time on Selected Date</th>
                <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>Cumulative Total</th>
                <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>Platform & Device</th>
                <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>GPS Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
                    No users matching the department or user filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isMD = (u.username === "md" || u.dept.toLowerCase().includes("executive") || u.name.toLowerCase().includes("director"));
                  const isAdmin = (u.username === "admin" || u.dept.toLowerCase().includes("admin") || u.name.toLowerCase().includes("admin"));

                  return (
                    <tr
                      key={u.id || u.username}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        background: isMD ? "rgba(238, 242, 255, 0.5)" : isAdmin ? "rgba(236, 254, 255, 0.4)" : "#FFFFFF"
                      }}
                    >
                      <td style={{ padding: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: isMD ? "#4F46E5" : isAdmin ? "#0891B2" : "#475569",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {isMD ? "👑" : isAdmin ? "🛡️" : (u.name || "U").charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div style={{ fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                              {u.name}
                              {isMD && <span style={{ fontSize: 10, background: "#EEF2FF", color: "#4F46E5", padding: "1px 6px", borderRadius: 4, fontWeight: 800, border: "1px solid #C7D2FE" }}>MD</span>}
                              {isAdmin && <span style={{ fontSize: 10, background: "#ECFEFF", color: "#0891B2", padding: "1px 6px", borderRadius: 4, fontWeight: 800, border: "1px solid #A5F3FC" }}>ADMIN</span>}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 1 }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px" }}>
                        <span style={{ background: "#F1F5F9", color: "#334155", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                          {u.dept}
                        </span>
                      </td>

                      <td style={{ padding: "14px" }}>
                        {u.isOnline ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#ECFDF5", color: "#059669", padding: "3px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 800 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
                            Online Now
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F8FAFC", color: "#94A3B8", padding: "3px 8px", borderRadius: 999, fontSize: 11.5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1" }} />
                            Offline
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "14px" }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: u.selectedDateMinutes > 0 ? "#047857" : "#94A3B8",
                          background: u.selectedDateMinutes > 0 ? "#ECFDF5" : "#F8FAFC",
                          padding: "3px 10px",
                          borderRadius: 6,
                          border: u.selectedDateMinutes > 0 ? "1px solid #A7F3D0" : "none"
                        }}>
                          {formatMins(u.selectedDateMinutes)}
                        </span>
                      </td>

                      <td style={{ padding: "14px", fontWeight: 700, color: "#334155" }}>
                        {formatMins(u.overallMinutes)}
                      </td>

                      <td style={{ padding: "14px" }}>
                        {renderDeviceBadge(u.lastDevice, null)}
                      </td>

                      <td style={{ padding: "14px", color: "#64748B", fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <MapPin size={13} color="#DC2626" />
                          <span>{u.lastLocation || (u.isOnline ? "Active Network" : "Offline / Pending")}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. SECTION: 🔴 HIGH-ALERT DELETIONS & SECURITY LEDGER (MATCHING ALL FILTERS) */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: 16,
        border: deletionsOnDate.length > 0 ? "2px solid #FCA5A5" : "1.5px solid #E2E8F0",
        padding: "22px 24px",
        marginBottom: 24,
        boxShadow: deletionsOnDate.length > 0 ? "0 8px 24px rgba(220, 38, 38, 0.08)" : "0 2px 8px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={20} color="#DC2626" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#991B1B", display: "flex", alignItems: "center", gap: 8 }}>
                🔴 Deletions Audit Ledger ({deletionsOnDate.length})
              </h2>
              <div style={{ fontSize: 12.5, color: "#7F1D1D", marginTop: 2 }}>
                Records of deleted orders, deleted T&A stages, and removed tasks filtered by your active criteria. Client cannot tamper with or delete this ledger.
              </div>
            </div>
          </div>
        </div>

        {deletionsOnDate.length === 0 ? (
          <div style={{ padding: "36px", textAlign: "center", background: "#FEF2F2", borderRadius: 12, border: "1.5px dashed #FECACA" }}>
            <ShieldCheck size={32} color="#16A34A" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: "#166534" }}>Zero deletions detected for this scope!</div>
            <div style={{ fontSize: 12.5, color: "#15803D", marginTop: 3 }}>
              All client orders, stages, and tasks remained 100% intact under the current filter selection.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #FECACA", background: "#FEF2F2" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#991B1B", width: "160px" }}>Timestamp</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#991B1B", width: "130px" }}>Item Type</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#991B1B" }}>Deleted Action Details</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#991B1B", width: "190px" }}>Deleted By (Client Account)</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#991B1B", width: "200px" }}>Platform & Device</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#991B1B", width: "160px" }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {deletionsOnDate.map((del, idx) => {
                  const dt = del.timestamp ? new Date(del.timestamp) : new Date();
                  const timeFormatted = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
                  const dateFormatted = dt.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });

                  return (
                    <tr key={del.id || idx} style={{ borderBottom: "1px solid #FEE2E2", background: idx % 2 === 0 ? "#FFFDFD" : "#FEF2F2" }}>
                      <td style={{ padding: "14px", color: "#1E293B", fontWeight: 700 }}>
                        <div>{dateFormatted}</div>
                        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>{timeFormatted}</div>
                      </td>

                      <td style={{ padding: "14px" }}>
                        <span style={{
                          background: "#FEE2E2",
                          color: "#DC2626",
                          border: "1px solid #FECACA",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800
                        }}>
                          🔴 {del.metadata?.actionType || "DELETED"}
                        </span>
                      </td>

                      <td style={{ padding: "14px" }}>
                        <div style={{ fontWeight: 800, color: "#991B1B", fontSize: 13.5 }}>{del.action}</div>
                        {del.targetId && (
                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2, fontFamily: "monospace" }}>
                            Ref ID: <strong>{del.targetId}</strong>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "14px" }}>
                        <div style={{ fontWeight: 800, color: "#0F172A" }}>{del.userName || "Admin"}</div>
                        <div style={{ fontSize: 11.5, color: "#64748B" }}>{del.userDept || "Administrators"}</div>
                      </td>

                      <td style={{ padding: "14px" }}>
                        {renderDeviceBadge(del.device, del.deviceType)}
                      </td>

                      <td style={{ padding: "14px", color: "#64748B", fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={13} color="#DC2626" />
                          <span>{del.location || "Office Network"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. SECTION: LIVE PIPELINE STREAM (MATCHING ALL FILTERS) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        
        {/* LEFT COLUMN: T&A STAGES COMPLETED UNDER ACTIVE FILTER */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1.5px solid #E2E8F0",
          padding: "20px 22px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={18} color="#10B981" /> T&A Stages Completed ({stagesDoneOnDate.length})
            </h3>
            <span style={{ fontSize: 11.5, color: "#64748B" }}>
              {selectedStage !== "ALL" ? `Stage: ${selectedStage}` : "All Stages"}
            </span>
          </div>

          {stagesDoneOnDate.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", color: "#94A3B8", fontSize: 12.5, background: "#F8FAFC", borderRadius: 10 }}>
              No T&A stages marked done matching the current filter criteria.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 440, overflowY: "auto" }}>
              {stagesDoneOnDate.map((st, i) => {
                const dt = st.timestamp ? new Date(st.timestamp) : new Date();
                const timePart = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

                return (
                  <div key={st.id || i} style={{
                    padding: "12px 14px",
                    background: "#F8FAFC",
                    borderRadius: 10,
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 13 }}>
                        {st.action}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
                        Done by: <strong style={{ color: "#4F46E5" }}>{st.userName}</strong> ({st.userDept || "Team"})
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>{timePart}</div>
                      <div style={{ marginTop: 2 }}>{renderDeviceBadge(st.device, st.deviceType)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ORDERS CREATED UNDER ACTIVE FILTER */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1.5px solid #E2E8F0",
          padding: "20px 22px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={18} color="#4F46E5" /> Orders Created ({ordersCreatedOnDate.length})
            </h3>
            <span style={{ fontSize: 11.5, color: "#64748B" }}>
              {selectedDept !== "ALL" ? `Dept: ${selectedDept}` : "All Departments"}
            </span>
          </div>

          {ordersCreatedOnDate.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", color: "#94A3B8", fontSize: 12.5, background: "#F8FAFC", borderRadius: 10 }}>
              {selectedStage !== "ALL" ? "Stage filter is active (Order creation events are hidden)." : "No new orders created matching current filters."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 440, overflowY: "auto" }}>
              {ordersCreatedOnDate.map((ord, i) => {
                const dt = ord.timestamp ? new Date(ord.timestamp) : new Date();
                const timePart = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

                return (
                  <div key={ord.id || i} style={{
                    padding: "12px 14px",
                    background: "#F8FAFC",
                    borderRadius: 10,
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 13 }}>
                        {ord.action}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
                        Created by: <strong style={{ color: "#0891B2" }}>{ord.userName}</strong> ({ord.userDept || "Admin"})
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#4F46E5" }}>{timePart}</div>
                      <div style={{ marginTop: 2 }}>{renderDeviceBadge(ord.device, ord.deviceType)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
