import React, { useMemo, useState, useEffect } from "react";
import {
  Eye, EyeOff, Search, X, Briefcase, Filter, Plus, Trash2, Edit2,
  Layers, ArrowUp, ArrowDown, GripVertical, CheckCircle, Factory, MapPin, Check
} from "lucide-react";

import { ORG_STRUCTURE, TA_STAGES_90, TA_STAGES_120 } from "../constants/loomData.js";

const PERMISSIONS = [
  ["dashboard", "Dashboard"], ["orders", "Orders"], ["tasks", "Tasks"],
  ["approvals", "Approvals"], ["attendance", "Attendance & leave"],
  ["reports", "Reports"], ["settings", "Settings"],
];
const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Generate teams for each department in GarmaX
const ALL_DEPARTMENTS = Object.keys(ORG_STRUCTURE);

export const DEFAULT_TEAMS = [
  { id: "team-admin", name: "Administrators", permissions: PERMISSIONS.map(([key]) => key) },
  { id: "team-md", name: "Executive (MD)", permissions: PERMISSIONS.map(([key]) => key) },
  ...ALL_DEPARTMENTS.filter(dept => dept !== "Executive (MD)").map(dept => {
    // Determine permissions per department
    let perms = ["dashboard", "tasks", "attendance"];
    if (["Merchandising", "Planning", "Program", "Sample", "Costing"].includes(dept)) {
      perms.push("orders", "approvals", "reports");
    } else if (["Purchase – Fabric", "Purchase – Trims", "Quality", "Finishing", "Production", "Cutting"].includes(dept)) {
      perms.push("orders", "approvals");
    } else {
      perms.push("orders");
    }
    return {
      id: `team-${dept.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: dept,
      permissions: perms,
    };
  })
];

export const DEFAULT_USERS = [
  { id: "user-admin", employeeId: "EMP001", name: "Admin", email: "admin@loom.local", username: "admin", password: "admin123", teamId: "team-admin", active: true },
  { id: "user-md", employeeId: "EMP002", name: "Managing Director", email: "md@loom.local", username: "md", password: "md123", teamId: "team-md", active: true },
];

export function LoginPage({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const submit = event => {
    event.preventDefault();
    const user = users.find(item => item.active !== false && item.username.toLowerCase() === username.trim().toLowerCase() && item.password === password);
    if (!user) return setError("Invalid username or password");
    onLogin(user);
  };
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, boxSizing: "border-box", backgroundImage: "linear-gradient(rgb(245 246 248 / 54%), rgba(245, 246, 248, 0.92)), url(/login-bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
    <form onSubmit={submit} style={{ width: "min(390px, 100%)", background: "rgba(255, 255, 255, 0.94)", backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.72)", borderRadius: 14, padding: 28, boxShadow: "0 20px 60px rgba(21,27,46,.16)" }}>
      <div style={{ color: "#1F9E8D", fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>GarmaX</div>
      <h1 style={{ margin: "0 0 6px", color: "#151B2E", fontSize: 26 }}>Welcome back</h1>
      <p style={{ margin: "0 0 22px", color: "#8A8D98", fontSize: 13 }}>Sign in to your workspace</p>
      <label style={labelStyle}>Username<input value={username} onChange={e => setUsername(e.target.value)} autoFocus required style={inputStyle} /></label>
      <label style={{ ...labelStyle, marginTop: 14 }}>
        Password
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ ...inputStyle, paddingRight: 38 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 10,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>
      {error && <div style={{ color: "#B42318", fontSize: 12, marginTop: 12 }}>{error}</div>}
      <button type="submit" style={primaryButtonStyle}>Sign in</button>
      {/* <div style={{ color: "#8A8D98", fontSize: 11, marginTop: 16 }}>Initial administrator: admin / admin123 · MD: md / md123</div> */}
    </form>
  </div>;
}

export function UserAccessPage({
  users = [],
  teams = [],
  buyers = [],
  onChangeUsers,
  onChangeTeams,
  rotation,
  onChangeRotation,
  globalAlignedStages = null,
  onSaveGlobalMasterStages = null,
  units = [],
  onChangeUnits = null
}) {
  const [tab, setTab] = useState("users");
  const [editing, setEditing] = useState(null);
  const [showUserFormPassword, setShowUserFormPassword] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", employeeId: "", email: "", username: "", password: "", teamId: teams[0]?.id || "", teamIds: [teams[0]?.id || ""] });
  const [teamName, setTeamName] = useState("");
  const [showNewDeptInput, setShowNewDeptInput] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // ===== Master T&A Stages State =====
  const [masterStages, setMasterStages] = useState(() => {
    try {
      const explicit = localStorage.getItem("loom_master_ta_stages_explicit");
      if (explicit) {
        const parsed = JSON.parse(explicit);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return []; // Fresh, completely empty page by default!
  });

  useEffect(() => {
    if (window.storage && window.storage.get) {
      window.storage.get("global_master_ta_stages_explicit", true).then(res => {
        if (res?.value) {
          try {
            const parsed = typeof res.value === "string" ? JSON.parse(res.value) : res.value;
            if (Array.isArray(parsed)) setMasterStages(parsed);
          } catch (e) {}
        }
      }).catch(() => {});
    }
  }, []);

  const [newStageName, setNewStageName] = useState("");
  const [newStageDept, setNewStageDept] = useState("Merchandising");
  const [newStageStartDay, setNewStageStartDay] = useState(0);
  const [newStageEndDay, setNewStageEndDay] = useState(2);
  const [newStageIsParallel, setNewStageIsParallel] = useState(true);
  const [newStagePosition, setNewStagePosition] = useState(-1);
  const [stageEditingIdx, setStageEditingIdx] = useState(null);
  const [stageEditData, setStageEditData] = useState({ name: "", dept: "Merchandising", startDay: 0, endDay: 2, isParallel: true });
  const [stageSuccessMsg, setStageSuccessMsg] = useState("");

  const handleAddMasterStage = (e) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    const start = Math.max(0, Number(newStageStartDay) || 0);
    const end = Math.max(start, Number(newStageEndDay) || start);
    const daysNum = Math.max(1, end - start);
    const newStage = {
      id: `mstg-${Date.now()}`,
      name: newStageName.trim(),
      dept: newStageDept,
      startDay: start,
      endDay: end,
      days: daysNum,
      planned: `Day ${start}-${end}`,
      isParallel: newStageIsParallel !== false
    };
    const pos = Number(newStagePosition);
    let nextList;
    if (pos === -1) {
      nextList = [...masterStages, newStage];
    } else if (pos === 0) {
      nextList = [newStage, ...masterStages];
    } else {
      const at = Math.min(Math.max(pos, 0), masterStages.length);
      nextList = [...masterStages.slice(0, at), newStage, ...masterStages.slice(at)];
    }
    setMasterStages(nextList);
    setNewStageName("");
    setNewStageStartDay(0);
    setNewStageEndDay(2);
    setNewStageIsParallel(true);
    setNewStagePosition(-1);
  };

  const moveMasterStage = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= masterStages.length) return;
    const copy = [...masterStages];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setMasterStages(copy);
  };

  const deleteMasterStage = (index) => {
    setMasterStages(masterStages.filter((_, i) => i !== index));
  };

  const startEditMasterStage = (idx) => {
    const stg = masterStages[idx];
    setStageEditingIdx(idx);
    const sDay = typeof stg.startDay === "number" ? stg.startDay : 0;
    const eDay = typeof stg.endDay === "number" ? stg.endDay : (sDay + (stg.days || 2));
    setStageEditData({
      name: stg.name,
      dept: stg.dept || "Merchandising",
      startDay: sDay,
      endDay: eDay,
      isParallel: stg.isParallel !== false
    });
  };

  const saveEditMasterStage = (idx) => {
    if (!stageEditData.name.trim()) return;
    const start = Math.max(0, Number(stageEditData.startDay) || 0);
    const end = Math.max(start, Number(stageEditData.endDay) || start);
    const daysNum = Math.max(1, end - start);
    const updated = [...masterStages];
    updated[idx] = {
      ...updated[idx],
      name: stageEditData.name.trim(),
      dept: stageEditData.dept,
      startDay: start,
      endDay: end,
      days: daysNum,
      planned: `Day ${start}-${end}`,
      isParallel: stageEditData.isParallel !== false
    };
    setMasterStages(updated);
    setStageEditingIdx(null);
  };

  const saveAllMasterStages = () => {
    try {
      localStorage.setItem("loom_master_ta_stages_explicit", JSON.stringify(masterStages));
      localStorage.setItem("loom_last_aligned_stages", JSON.stringify(masterStages));
    } catch (e) {}
    if (onSaveGlobalMasterStages) {
      onSaveGlobalMasterStages(masterStages);
    }
    if (window.storage && window.storage.set) {
      window.storage.set("global_master_ta_stages_explicit", JSON.stringify(masterStages), true);
      window.storage.set("global_last_aligned_stages", JSON.stringify(masterStages), true);
    }
    setStageSuccessMsg("✓ Master T&A Stages saved successfully! All newly created orders will replicate this workflow pipeline.");
    setTimeout(() => setStageSuccessMsg(""), 4000);
  };

  // ===== Units State =====
  const [unitList, setUnitList] = useState(units || []);
  useEffect(() => {
    setUnitList(units || []);
  }, [units]);

  const [unitEditingId, setUnitEditingId] = useState(null);
  const [unitForm, setUnitForm] = useState({
    name: "",
    code: "",
    location: "",
    lines: 4,
    contactPerson: "",
    mobile: "",
    status: "Active"
  });

  const handleSaveUnit = (e) => {
    e.preventDefault();
    if (!unitForm.name.trim() || !unitForm.code.trim()) return;
    const unitObj = {
      id: unitEditingId || `unit-${Date.now()}`,
      name: unitForm.name.trim(),
      code: unitForm.code.trim().toUpperCase(),
      location: unitForm.location.trim(),
      lines: Number(unitForm.lines) || 1,
      contactPerson: unitForm.contactPerson.trim(),
      mobile: unitForm.mobile.trim(),
      status: unitForm.status || "Active",
      isDeleted: false
    };

    let updated;
    if (unitEditingId) {
      updated = unitList.map(u => u.id === unitEditingId ? unitObj : u);
    } else {
      updated = [...unitList, unitObj];
    }
    setUnitList(updated);
    if (onChangeUnits) {
      onChangeUnits(updated);
    }
    setUnitEditingId(null);
    setUnitForm({ name: "", code: "", location: "", lines: 4, contactPerson: "", mobile: "", status: "Active" });
  };

  const startEditUnit = (u) => {
    setUnitEditingId(u.id);
    setUnitForm({
      name: u.name || "",
      code: u.code || "",
      location: u.location || "",
      lines: u.lines || 4,
      contactPerson: u.contactPerson || "",
      mobile: u.mobile || "",
      status: u.status || "Active"
    });
  };

  const handleDeleteUnit = (id) => {
    if (!window.confirm("Are you sure you want to delete this Unit?")) return;
    const updated = unitList.filter(u => u.id !== id);
    setUnitList(updated);
    if (onChangeUnits) {
      onChangeUnits(updated);
    }
  };

  const teamMap = useMemo(() => Object.fromEntries(teams.map(team => [team.id, team])), [teams]);

  // Combine standard departments with all active teams/departments so newly added teams appear dynamically
  const availableDepartments = useMemo(() => {
    const list = [...ALL_DEPARTMENTS];
    (teams || []).forEach(t => {
      const name = (t.name || "").trim();
      if (name && !["Administrators", "Executive (MD)"].includes(name)) {
        if (!list.some(existing => existing.toLowerCase() === name.toLowerCase())) {
          list.push(name);
        }
      }
    });
    return list;
  }, [teams]);

  // Map each user ID to the list of buyers they are assigned to (merchandiser, fabric, trims, or artwork)
  const userBuyerMap = useMemo(() => {
    const map = {};
    (buyers || []).forEach(b => {
      const bName = b.name;
      (b.merchandiserIds || []).forEach(uId => {
        if (!map[uId]) map[uId] = [];
        if (!map[uId].some(item => item.buyerName === bName)) {
          map[uId].push({ buyerName: bName, role: "merchandiser" });
        }
      });
      (b.fabricManagerIds || []).forEach(uId => {
        if (!map[uId]) map[uId] = [];
        if (!map[uId].some(item => item.buyerName === bName)) {
          map[uId].push({ buyerName: bName, role: "fabric" });
        }
      });
      (b.trimsManagerIds || []).forEach(uId => {
        if (!map[uId]) map[uId] = [];
        if (!map[uId].some(item => item.buyerName === bName)) {
          map[uId].push({ buyerName: bName, role: "trims" });
        }
      });
      (b.artworkManagerIds || []).forEach(uId => {
        if (!map[uId]) map[uId] = [];
        if (!map[uId].some(item => item.buyerName === bName)) {
          map[uId].push({ buyerName: bName, role: "artwork" });
        }
      });
    });
    return map;
  }, [buyers]);

  const allBuyersList = useMemo(() => {
    return (buyers || []).map(b => ({ id: b.id, name: b.name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [buyers]);

  // Filtered users by search string (matches name, username, employeeId, email, department/teams, or assigned buyer)
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users || [];

    return (users || []).filter(u => {
      const nameMatch = String(u.name || "").toLowerCase().includes(q);
      const usernameMatch = String(u.username || "").toLowerCase().includes(q);
      const empIdMatch = String(u.employeeId || "").toLowerCase().includes(q);
      const emailMatch = String(u.email || "").toLowerCase().includes(q);

      // Check if user's teams/departments match query
      const uTeamIds = Array.isArray(u.teamIds) && u.teamIds.length > 0 ? u.teamIds : (u.teamId ? [u.teamId] : []);
      const teamMatch = uTeamIds.some(tid => String(teamMap[tid]?.name || "").toLowerCase().includes(q));

      // Check if assigned buyers match query
      const uBuyers = userBuyerMap[u.id] || [];
      const buyerNameMatch = uBuyers.some(ub => ub.buyerName.toLowerCase().includes(q));

      return nameMatch || usernameMatch || empIdMatch || emailMatch || teamMatch || buyerNameMatch;
    });
  }, [users, userSearch, userBuyerMap, teamMap]);

  const resetUser = () => { setEditing(null); setShowUserFormPassword(false); setUserForm({ name: "", employeeId: "", email: "", username: "", password: "", teamId: teams[0]?.id || "", teamIds: [teams[0]?.id || ""] }); };
  const submitUser = event => {
    event.preventDefault();
    const next = { ...userForm, id: editing?.id || makeId("user"), active: editing?.active !== false };
    onChangeUsers(editing ? users.map(user => user.id === editing.id ? next : user) : [...users, next]);
    resetUser();
  };
  const addTeam = event => {
    event.preventDefault();
    if (!teamName.trim()) return;
    onChangeTeams([...teams, { id: makeId("team"), name: teamName.trim(), permissions: ["dashboard"] }]);
    setTeamName("");
  };
  const [selectedDeptToAdd, setSelectedDeptToAdd] = useState(ALL_DEPARTMENTS[0] || "");

  const addDepartmentAsTeam = event => {
    event.preventDefault();
    if (!selectedDeptToAdd) return;
    const existing = teams.find(t => t.name.toLowerCase() === selectedDeptToAdd.toLowerCase());
    if (existing) {
      alert(`Team for "${selectedDeptToAdd}" already exists!`);
      return;
    }
    const newTeam = {
      id: `team-${selectedDeptToAdd.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
      name: selectedDeptToAdd,
      permissions: ["dashboard", "orders", "tasks", "attendance"]
    };
    onChangeTeams([...teams, newTeam]);
  };

  const togglePermission = (teamId, permission) => {
    onChangeTeams(
      teams.map(team => {
        if (team.id !== teamId) return team;
        const exists = team.permissions.includes(permission);
        const updatedPerms = exists
          ? team.permissions.filter(p => p !== permission)
          : [...team.permissions, permission];
        return { ...team, permissions: updatedPerms };
      })
    );
  };

  return <div style={{ paddingBottom: 40 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, color: "#1B2130" }}>Settings & System Setup</h1>
        <div style={{ color: "#8A8D98", fontSize: 13.5, marginTop: 4 }}>
          Manage user access, department teams, Master T&A Stages, and Manufacturing Units
        </div>
      </div>
      {tab === "users" && <button onClick={resetUser} style={primaryButtonStyle}>Add new user</button>}
      {tab === "ta_stages" && (
        <button onClick={saveAllMasterStages} style={{ ...primaryButtonStyle, marginTop: 0, background: "#4F46E5", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <CheckCircle size={16} /> Save Master T&A Pipeline
        </button>
      )}
    </div>

    <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
      {[
        ["users", `Users (${users.length})`],
        ["teams", `Teams / Departments (${teams.length})`],
        ["ta_stages", `T&A Stages (Master setup)`],
        ["units", `Units (${unitList.length})`],
        ["display", "Big-screen display"]
      ].map(([key, label]) => (
        <button key={key} onClick={() => setTab(key)} style={{ ...tabButtonStyle, borderRadius: 8, fontWeight: 600, fontSize: 13, ...(tab === key ? activeTabStyle : {}) }}>
          {label}
        </button>
      ))}
    </div>

    {tab === "users" && (
      <>
        <form onSubmit={submitUser} style={panelStyle}>
          <div style={panelTitle}>{editing ? "Edit user" : "Add user"}</div>
          <div style={formGrid}>
            {[
              ["name", "Full name"],
              ["employeeId", "Employee ID"],
              ["email", "Email"],
              ["username", "Username"],
              ["password", "Password"]
            ].map(([key, label]) => (
              <label key={key} style={labelStyle}>
                {label}
                {key === "password" ? (
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      required
                      type={showUserFormPassword ? "text" : "password"}
                      value={userForm[key]}
                      onChange={e => setUserForm({ ...userForm, [key]: e.target.value })}
                      style={{ ...inputStyle, paddingRight: 38 }}
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserFormPassword(!showUserFormPassword)}
                      style={{
                        position: "absolute",
                        right: 10,
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        color: "#64748B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      title={showUserFormPassword ? "Hide password" : "Show password"}
                    >
                      {showUserFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                ) : (
                  <input
                    required={key !== "email"}
                    type="text"
                    value={userForm[key]}
                    onChange={e => setUserForm({ ...userForm, [key]: e.target.value })}
                    style={inputStyle}
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                )}
              </label>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Assigned Departments / Teams (Select one or more)
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, padding: "10px 12px", background: "#F9FAFB", border: "1px solid #D1D5DB", borderRadius: 8, maxHeight: 150, overflowY: "auto" }}>
                  {teams.map(team => {
                    const selectedTeams = Array.isArray(userForm.teamIds) && userForm.teamIds.length > 0
                      ? userForm.teamIds
                      : (userForm.teamId ? [userForm.teamId] : []);
                    const isChecked = selectedTeams.includes(team.id);
                    return (
                      <label
                        key={team.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: isChecked ? "#EDE9FE" : "#FFFFFF",
                          color: isChecked ? "#534AB7" : "#374151",
                          border: `1px solid ${isChecked ? "#C4B5FD" : "#D1D5DB"}`,
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: isChecked ? 600 : 500,
                          cursor: "pointer",
                          userSelect: "none"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let next = [...selectedTeams];
                            if (e.target.checked) {
                              if (!next.includes(team.id)) next.push(team.id);
                            } else {
                              next = next.filter(id => id !== team.id);
                            }
                            if (next.length === 0) next = [team.id];
                            setUserForm({
                              ...userForm,
                              teamId: next[0] || "",
                              teamIds: next
                            });
                          }}
                        />
                        {team.name}
                      </label>
                    );
                  })}

                  {/* Inline Add Department */}
                  {showNewDeptInput ? (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 6, padding: "3px 8px" }}>
                      <input
                        autoFocus
                        type="text"
                        value={newDeptName}
                        onChange={e => setNewDeptName(e.target.value)}
                        placeholder="Department name…"
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const name = newDeptName.trim();
                            if (!name) return;
                            const exists = teams.find(t => t.name.toLowerCase() === name.toLowerCase());
                            if (exists) { alert(`"${name}" already exists!`); return; }
                            const newTeam = { id: makeId("team"), name, permissions: ["dashboard", "orders", "tasks", "attendance"] };
                            onChangeTeams([...teams, newTeam]);
                            setUserForm(prev => ({ ...prev, teamIds: [...(prev.teamIds || []), newTeam.id], teamId: prev.teamId || newTeam.id }));
                            setNewDeptName("");
                            setShowNewDeptInput(false);
                          }
                          if (e.key === "Escape") { setNewDeptName(""); setShowNewDeptInput(false); }
                        }}
                        style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, width: 140, color: "#166534" }}
                      />
                      <button
                        type="button"
                        title="Create department"
                        onClick={() => {
                          const name = newDeptName.trim();
                          if (!name) return;
                          const exists = teams.find(t => t.name.toLowerCase() === name.toLowerCase());
                          if (exists) { alert(`"${name}" already exists!`); return; }
                          const newTeam = { id: makeId("team"), name, permissions: ["dashboard", "orders", "tasks", "attendance"] };
                          onChangeTeams([...teams, newTeam]);
                          setUserForm(prev => ({ ...prev, teamIds: [...(prev.teamIds || []), newTeam.id], teamId: prev.teamId || newTeam.id }));
                          setNewDeptName("");
                          setShowNewDeptInput(false);
                        }}
                        style={{ background: "#16A34A", border: "none", borderRadius: 4, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "1px 7px", lineHeight: 1.4 }}
                      >✓</button>
                      <button
                        type="button"
                        title="Cancel"
                        onClick={() => { setNewDeptName(""); setShowNewDeptInput(false); }}
                        style={{ background: "none", border: "none", color: "#6B7280", fontSize: 15, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}
                      >✕</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowNewDeptInput(true)}
                      title="Add a new department"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "#F9FAFB", border: "1.5px dashed #9CA3AF",
                        borderRadius: 6, padding: "5px 10px", fontSize: 12,
                        fontWeight: 600, color: "#6B7280", cursor: "pointer"
                      }}
                    >+ Add</button>
                  )}
                </div>
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
            <button type="submit" style={primaryButtonStyle}>{editing ? "Save user" : "Create user"}</button>
            {editing && <button type="button" onClick={resetUser} style={secondaryButtonStyle}>Cancel</button>}
          </div>
        </form>

        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={panelTitle}>Users</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1F9E8D", background: "#E1F5EE", padding: "2px 8px", borderRadius: 12 }}>
                {filteredUsers.length} of {users.length}
              </span>
            </div>

            {/* User Search Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 340px", maxWidth: 440, justifyContent: "flex-end" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: 9,
                padding: "8px 14px",
                width: "100%",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                transition: "border-color 0.2s, box-shadow 0.2s"
              }}>
                <Search size={16} color="#64748B" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search user name, ID, email, team..."
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 13.5,
                    width: "100%",
                    color: "#0F172A",
                    letterSpacing: "0.2px"
                  }}
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => setUserSearch("")}
                    title="Clear search"
                    style={{ background: "none", border: "none", padding: "0 2px", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center" }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch("")}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 7,
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", color: "#64748B", fontSize: 13, background: "#F8FAFC", borderRadius: 8 }}>
              No users match your search "{userSearch}".
            </div>
          ) : (
            filteredUsers.map(user => {
              const userTeamIds = Array.isArray(user.teamIds) && user.teamIds.length > 0
                ? user.teamIds
                : (user.teamId ? [user.teamId] : []);
              const userTeams = userTeamIds.map(id => teamMap[id]?.name).filter(Boolean);

              return (
                <div key={user.id} style={rowStyle}>
                  <div style={avatarStyle}>{user.name.slice(0, 1).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <b>{user.name}</b>
                      {user.employeeId && (
                        <span style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>
                          {user.employeeId}
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#8A8D98", fontSize: 12, marginTop: 2 }}>
                      {user.email || user.username}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                      {userTeams.length > 0 ? (
                        userTeams.map(tName => (
                          <span key={tName} style={{ fontWeight: 600, color: "#1F9E8D", background: "#E1F5EE", padding: "1px 7px", borderRadius: 4, fontSize: 11 }}>
                            {tName}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#9CA3AF", fontSize: 11 }}>No team</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const uTeams = Array.isArray(user.teamIds) && user.teamIds.length > 0
                        ? user.teamIds
                        : (user.teamId ? [user.teamId] : [teams[0]?.id || ""]);
                      setEditing(user);
                      setUserForm({
                        ...user,
                        teamId: uTeams[0] || "",
                        teamIds: uTeams
                      });
                    }}
                    style={secondaryButtonStyle}
                  >
                    Edit
                  </button>
                  <button onClick={() => onChangeUsers(users.filter(item => item.id !== user.id))} style={dangerButtonStyle}>Delete</button>
                </div>
              );
            })
          )}
        </div>
      </>
    )}

    {tab === "teams" && (
      <>
        {/* Quick add from existing GarmaX Departments */}
        <div style={{ ...panelStyle, marginBottom: 16 }}>
          <div style={panelTitle}>Quick Add Team from GarmaX Departments</div>
          <form onSubmit={addDepartmentAsTeam} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedDeptToAdd}
              onChange={e => setSelectedDeptToAdd(e.target.value)}
              style={{ ...inputStyle, flex: "1 1 240px", maxWidth: 360 }}
            >
              {ALL_DEPARTMENTS.map(d => {
                const alreadyExists = teams.some(t => t.name.toLowerCase() === d.toLowerCase());
                return (
                  <option key={d} value={d}>
                    {d} {alreadyExists ? "(Already in Teams)" : ""}
                  </option>
                );
              })}
            </select>
            <button type="submit" style={primaryButtonStyle}>+ Add Department to Teams</button>
          </form>
        </div>

        {/* Custom Team Name */}
        <form onSubmit={addTeam} style={{ ...panelStyle, display: "flex", gap: 10, alignItems: "center" }}>
          <input
            placeholder="Or type custom team name..."
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" style={primaryButtonStyle}>Add Custom Team</button>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {teams.map(team => (
            <div key={team.id} style={{ ...panelStyle, marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <b style={{ fontSize: 14, color: "#151B2E" }}>{team.name}</b>
                {team.id !== "team-admin" && (
                  <button onClick={() => onChangeTeams(teams.filter(item => item.id !== team.id))} style={dangerButtonStyle}>
                    Delete
                  </button>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 8, fontWeight: 600 }}>Permissions:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PERMISSIONS.map(([permission, label]) => (
                  <label key={permission} style={{ fontSize: 12, color: "#4B5563", display: "flex", alignItems: "center", gap: 4, background: "#F8FAFC", padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                    <input
                      type="checkbox"
                      checked={team.permissions.includes(permission)}
                      onChange={() => togglePermission(team.id, permission)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    {/* TAB 3: Master T&A Stages Setup */}
    {tab === "ta_stages" && (
      <div>
        {stageSuccessMsg && (
          <div style={{ padding: "12px 16px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, color: "#065F46", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            {stageSuccessMsg}
          </div>
        )}

        {/* Master T&A Explanation Header */}
        <div style={{ ...panelStyle, background: "linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)", border: "1px solid #DDD6FE" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: "#4338CA", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Layers size={18} color="#4F46E5" /> Master T&A Workflow Pipeline Setup
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#475569" }}>
                Add manual entries for each stage, assign department, and enter how many days in that stage.
                Newly created orders automatically replicate these master stages.
              </p>
            </div>
          </div>
        </div>

        {/* Add Manual Stage Entry Form */}
        <div style={panelStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130", marginBottom: 12 }}>
            ＋ Add Manual Entry T&A Stage
          </div>
          <form onSubmit={handleAddMasterStage}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 0.8fr 0.8fr 1.4fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>
                  Stage Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lab Dip Approval / Fabric Booking"
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Select Department *
                  <select
                    value={newStageDept}
                    onChange={e => setNewStageDept(e.target.value)}
                    style={{ ...inputStyle, background: "#fff" }}
                  >
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Start Day *
                  <input
                    type="number"
                    min="0"
                    max="300"
                    required
                    value={newStageStartDay}
                    onChange={e => setNewStageStartDay(e.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  End Day *
                  <input
                    type="number"
                    min="0"
                    max="300"
                    required
                    value={newStageEndDay}
                    onChange={e => setNewStageEndDay(e.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Execution Mode
                  <select
                    value={newStageIsParallel ? "parallel" : "sequential"}
                    onChange={e => setNewStageIsParallel(e.target.value === "parallel")}
                    style={{ ...inputStyle, background: "#fff" }}
                  >
                    <option value="parallel">⚡ Parallel (Always Opened)</option>
                    <option value="sequential">🔒 Sequential (Opens when prev completes)</option>
                  </select>
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Position
                  <select
                    value={newStagePosition}
                    onChange={e => setNewStagePosition(e.target.value)}
                    style={{ ...inputStyle, background: "#fff" }}
                  >
                    <option value={-1}>At End (Default)</option>
                    <option value={0}>At Beginning (Priority 1)</option>
                    {masterStages.map((stg, i) => (
                      <option key={i} value={i + 1}>After #{i + 1}: {stg.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <button type="submit" style={{ ...primaryButtonStyle, marginTop: 4, background: "#4F46E5", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Plus size={15} /> Add Stage to Master List
            </button>
          </form>
        </div>

        {/* Master Stages Table / Cards List */}
        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130" }}>
              Master T&A Stages ({masterStages.length} total steps)
            </div>
            <button
              onClick={saveAllMasterStages}
              style={{ ...primaryButtonStyle, marginTop: 0, background: "#4F46E5", padding: "8px 14px", fontSize: 12.5 }}
            >
              ✓ Save Master T&A Pipeline
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {masterStages.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", background: "#F8FAFC", border: "1.5px dashed #CBD5E1", borderRadius: 10, color: "#64748B" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#334155", marginBottom: 6 }}>No T&A Stages Added Yet</div>
                <div style={{ fontSize: 12.5, maxWidth: 460, margin: "0 auto" }}>
                  Use the manual entry form above to enter each stage name, select the department, specify start/end day offsets (e.g. 0-2 days), and set parallel or sequential execution mode.
                </div>
              </div>
            ) : (
              masterStages.map((stage, idx) => {
              const isEditing = stageEditingIdx === idx;
              const sDay = typeof stage.startDay === "number" ? stage.startDay : 0;
              const eDay = typeof stage.endDay === "number" ? stage.endDay : (sDay + (stage.days || 2));
              const isParallel = stage.isParallel !== false;

              return (
                <div
                  key={stage.id || `${stage.name}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: idx % 2 === 0 ? "#F9FAFB" : "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    gap: 12
                  }}
                >
                  {/* Sequence Badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        background: "#4F46E5",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {idx + 1}
                    </div>

                    {isEditing ? (
                      <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          type="text"
                          value={stageEditData.name}
                          onChange={e => setStageEditData({ ...stageEditData, name: e.target.value })}
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, flex: 2, minWidth: 140 }}
                        />
                        <select
                          value={stageEditData.dept}
                          onChange={e => setStageEditData({ ...stageEditData, dept: e.target.value })}
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, flex: 1.5, minWidth: 120 }}
                        >
                          {availableDepartments.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: 11, color: "#6B7280" }}>Start Day:</span>
                        <input
                          type="number"
                          min="0"
                          value={stageEditData.startDay}
                          onChange={e => setStageEditData({ ...stageEditData, startDay: e.target.value })}
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, width: 60 }}
                        />
                        <span style={{ fontSize: 11, color: "#6B7280" }}>End Day:</span>
                        <input
                          type="number"
                          min="0"
                          value={stageEditData.endDay}
                          onChange={e => setStageEditData({ ...stageEditData, endDay: e.target.value })}
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, width: 60 }}
                        />
                        <select
                          value={stageEditData.isParallel ? "parallel" : "sequential"}
                          onChange={e => setStageEditData({ ...stageEditData, isParallel: e.target.value === "parallel" })}
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, width: 150 }}
                        >
                          <option value="parallel">⚡ Parallel (Always Opened)</option>
                          <option value="sequential">🔒 Sequential (Opens when prev completes)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => saveEditMasterStage(idx)}
                          style={{ padding: "5px 10px", borderRadius: 6, background: "#10B981", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{stage.name}</span>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: "1px 7px",
                            borderRadius: 12,
                            background: isParallel ? "#ECFDF5" : "#EFF6FF",
                            color: isParallel ? "#047857" : "#1D4ED8",
                            border: `1px solid ${isParallel ? "#A7F3D0" : "#BFDBFE"}`
                          }}>
                            {isParallel ? "⚡ Parallel (Always Opened)" : "🔒 Sequential (Opens when prev completes)"}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 3, display: "flex", gap: 14 }}>
                          <span>Department: <b style={{ color: "#4F46E5" }}>{stage.dept}</b></span>
                          <span>Days Offset: <b style={{ color: "#111827" }}>{sDay}-{eDay} Days</b></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveMasterStage(idx, -1)}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #D1D5DB", background: idx === 0 ? "#F3F4F6" : "#FFF", color: idx === 0 ? "#9CA3AF" : "#374151", cursor: idx === 0 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 2 }}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === masterStages.length - 1}
                        onClick={() => moveMasterStage(idx, 1)}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #D1D5DB", background: idx === masterStages.length - 1 ? "#F3F4F6" : "#FFF", color: idx === masterStages.length - 1 ? "#9CA3AF" : "#374151", cursor: idx === masterStages.length - 1 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 2 }}
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditMasterStage(idx)}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#475569", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMasterStage(idx)}
                        style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            }))}
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={saveAllMasterStages}
              style={{ ...primaryButtonStyle, marginTop: 0, background: "#4F46E5", padding: "10px 18px", fontSize: 13 }}
            >
              ✓ Save Master T&A Pipeline
            </button>
          </div>
        </div>
      </div>
    )}

    {/* TAB 4: Manufacturing Units Setup */}
    {tab === "units" && (
      <div>
        {/* Add / Edit Unit Form */}
        <div style={panelStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130", marginBottom: 12 }}>
            {unitEditingId ? "Edit Manufacturing Unit" : "Add Manufacturing UNIT"}
          </div>
          <form onSubmit={handleSaveUnit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>
                  Unit Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 1 - Main Factory"
                    value={unitForm.name}
                    onChange={e => setUnitForm({ ...unitForm, name: e.target.value })}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Unit Code / ID *
                  <input
                    type="text"
                    required
                    placeholder="e.g. UNT-01"
                    value={unitForm.code}
                    onChange={e => setUnitForm({ ...unitForm, code: e.target.value })}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Location / City
                  <input
                    type="text"
                    placeholder="e.g. Tirupur Main Road"
                    value={unitForm.location}
                    onChange={e => setUnitForm({ ...unitForm, location: e.target.value })}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Sewing Lines / Capacity
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={unitForm.lines}
                    onChange={e => setUnitForm({ ...unitForm, lines: e.target.value })}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Contact Person
                  <input
                    type="text"
                    placeholder="e.g. S. Murugan"
                    value={unitForm.contactPerson}
                    onChange={e => setUnitForm({ ...unitForm, contactPerson: e.target.value })}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Mobile Number
                  <input
                    type="text"
                    placeholder="e.g. +91 98421 11001"
                    value={unitForm.mobile}
                    onChange={e => setUnitForm({ ...unitForm, mobile: e.target.value })}
                    style={inputStyle}
                  />
                </label>
              </div>
              <div>
                <label style={labelStyle}>
                  Status
                  <select
                    value={unitForm.status}
                    onChange={e => setUnitForm({ ...unitForm, status: e.target.value })}
                    style={{ ...inputStyle, background: "#fff" }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
              <button type="submit" style={{ ...primaryButtonStyle, marginTop: 0, background: "#151B2E" }}>
                {unitEditingId ? "Update Unit" : "+ Add Unit"}
              </button>
              {unitEditingId && (
                <button
                  type="button"
                  onClick={() => {
                    setUnitEditingId(null);
                    setUnitForm({ name: "", code: "", location: "", lines: 4, contactPerson: "", mobile: "", status: "Active" });
                  }}
                  style={{ ...secondaryButtonStyle, marginTop: 0 }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Units Table */}
        <div style={panelStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2130", marginBottom: 14 }}>
            Registered Manufacturing Units ({unitList.length})
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>Code</th>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>Unit Name</th>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>Location</th>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>Lines</th>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>Contact</th>
                  <th style={{ padding: "10px 12px", color: "#475569" }}>Status</th>
                  <th style={{ padding: "10px 12px", color: "#475569", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unitList.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#4F46E5" }}>{u.code}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1E293B" }}>{u.name}</td>
                    <td style={{ padding: "10px 12px", color: "#64748B" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={13} color="#94A3B8" /> {u.location || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#334155" }}>{u.lines || 1} Lines</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>
                      {u.contactPerson ? `${u.contactPerson} (${u.mobile || ""})` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                        background: u.status === "Active" ? "#DCFCE7" : "#F1F5F9",
                        color: u.status === "Active" ? "#15803D" : "#64748B"
                      }}>
                        {u.status || "Active"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => startEditUnit(u)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#334155", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(u.id)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

    {tab === "display" && (
      <div style={panelStyle}>
        <div style={panelTitle}>Performance rotation</div>
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, marginBottom: 18 }}>
          <input type="checkbox" checked={rotation.enabled} onChange={e => onChangeRotation({ ...rotation, enabled: e.target.checked })} />
          Rotate employee dashboards automatically
        </label>
        <label style={labelStyle}>
          Interval (minutes)
          <input
            type="number"
            min="2"
            max="3"
            value={rotation.intervalMinutes}
            onChange={e => onChangeRotation({ ...rotation, intervalMinutes: Math.min(3, Math.max(2, Number(e.target.value) || 2)) })}
            style={{ ...inputStyle, maxWidth: 120 }}
          />
        </label>
        <div style={{ color: "#8A8D98", fontSize: 12, marginTop: 14 }}>
          When enabled, the screen changes employee dashboard every 2 to 3 minutes.
        </div>
      </div>
    )}
  </div>;
}

const inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #D1D5DB", borderRadius: 7, padding: "10px 11px", fontSize: 13, color: "#151B2E" };
const primaryButtonStyle = { border: 0, borderRadius: 7, padding: "10px 14px", marginTop: 16, background: "#151B2E", color: "#fff", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { height: "fit-content", marginTop: 16,   border: "1px solid #D1D5DB", background: "#fff", borderRadius: 6, padding: "7px 11px", color: "#4B5563", cursor: "pointer" };
const dangerButtonStyle = { ...secondaryButtonStyle, color: "#B42318", borderColor: "#FECACA" };
const labelStyle = { display: "flex", flexDirection: "column", gap: 6, color: "#64748B", fontSize: 11.5, fontWeight: 600 };
const panelStyle = { background: "#fff", border: "1px solid #ECEDF1", borderRadius: 12, padding: 18, marginBottom: 16 };
const panelTitle = { fontSize: 14, fontWeight: 700, color: "#1B2130", marginBottom: 14 };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 };
const rowStyle = { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid #F0F0F2", fontSize: 13 };
const avatarStyle = { width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", background: "#334E87", color: "#fff", fontWeight: 700 };
const tabButtonStyle = { border: "1px solid #E2E8F0", background: "#fff", padding: "9px 14px", color: "#4B5563", cursor: "pointer" };
const activeTabStyle = { background: "#151B2E", color: "#fff" };