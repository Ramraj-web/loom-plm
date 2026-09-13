import React, { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { ORG_STRUCTURE } from "../constants/loomData.js";

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

export function UserAccessPage({ users, teams, onChangeUsers, onChangeTeams, rotation, onChangeRotation }) {
  const [tab, setTab] = useState("users");
  const [editing, setEditing] = useState(null);
  const [showUserFormPassword, setShowUserFormPassword] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", employeeId: "", email: "", username: "", password: "", teamId: teams[0]?.id || "", teamIds: [teams[0]?.id || ""] });
  const [teamName, setTeamName] = useState("");
  const teamMap = useMemo(() => Object.fromEntries(teams.map(team => [team.id, team])), [teams]);
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
        <h1 style={{ margin: 0, fontSize: 22, color: "#1B2130" }}>User & Team Management</h1>
        <div style={{ color: "#8A8D98", fontSize: 13.5, marginTop: 4 }}>
          Create users, assign department teams, and control access permissions
        </div>
      </div>
      {tab === "users" && <button onClick={resetUser} style={primaryButtonStyle}>Add new user</button>}
    </div>

    <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
      {[
        ["users", `Users (${users.length})`],
        ["teams", `Teams / Departments (${teams.length})`],
        ["display", "Big-screen display"]
      ].map(([key, label]) => (
        <button key={key} onClick={() => setTab(key)} style={{ ...tabButtonStyle, ...(tab === key ? activeTabStyle : {}) }}>
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
          <div style={panelTitle}>Users</div>
          {users.map(user => {
            const userTeamIds = Array.isArray(user.teamIds) && user.teamIds.length > 0
              ? user.teamIds
              : (user.teamId ? [user.teamId] : []);
            const userTeams = userTeamIds.map(id => teamMap[id]?.name).filter(Boolean);
            return (
              <div key={user.id} style={rowStyle}>
                <div style={avatarStyle}>{user.name.slice(0, 1).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <b>{user.name}</b>
                  <div style={{ color: "#8A8D98", fontSize: 12, marginTop: 3 }}>
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
          })}
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