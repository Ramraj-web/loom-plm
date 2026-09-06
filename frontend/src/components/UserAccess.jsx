import React, { useMemo, useState } from "react";

const PERMISSIONS = [
  ["dashboard", "Dashboard"], ["orders", "Orders"], ["tasks", "Tasks"],
  ["approvals", "Approvals"], ["attendance", "Attendance & leave"],
  ["reports", "Reports"], ["settings", "Settings"],
];
const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const DEFAULT_TEAMS = [
  { id: "team-admin", name: "Administrators", permissions: PERMISSIONS.map(([key]) => key) },
  { id: "team-operations", name: "Operations", permissions: ["dashboard", "orders", "tasks", "attendance"] },
];
export const DEFAULT_USERS = [
  { id: "user-admin", employeeId: "EMP001", name: "Admin", email: "admin@loom.local", username: "admin", password: "admin123", teamId: "team-admin", active: true },
];

export function LoginPage({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = event => {
    event.preventDefault();
    const user = users.find(item => item.active !== false && item.username.toLowerCase() === username.trim().toLowerCase() && item.password === password);
    if (!user) return setError("Invalid username or password");
    onLogin(user);
  };
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F5F6F8" }}>
    <form onSubmit={submit} style={{ width: "min(390px, calc(100% - 32px))", background: "#fff", border: "1px solid #ECEDF1", borderRadius: 14, padding: 28, boxShadow: "0 16px 40px rgba(21,27,46,.08)" }}>
      <div style={{ color: "#1F9E8D", fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>GarmaX</div>
      <h1 style={{ margin: "0 0 6px", color: "#151B2E", fontSize: 26 }}>Welcome back</h1>
      <p style={{ margin: "0 0 22px", color: "#8A8D98", fontSize: 13 }}>Sign in to your workspace</p>
      <label style={labelStyle}>Username<input value={username} onChange={e => setUsername(e.target.value)} autoFocus required style={inputStyle} /></label>
      <label style={{ ...labelStyle, marginTop: 14 }}>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} /></label>
      {error && <div style={{ color: "#B42318", fontSize: 12, marginTop: 12 }}>{error}</div>}
      <button type="submit" style={primaryButtonStyle}>Sign in</button>
      <div style={{ color: "#8A8D98", fontSize: 11, marginTop: 16 }}>Initial administrator: admin / admin123</div>
    </form>
  </div>;
}

export function UserAccessPage({ users, teams, onChangeUsers, onChangeTeams, rotation, onChangeRotation }) {
  const [tab, setTab] = useState("users");
  const [editing, setEditing] = useState(null);
  const [userForm, setUserForm] = useState({ name: "", employeeId: "", email: "", username: "", password: "", teamId: teams[0]?.id || "" });
  const [teamName, setTeamName] = useState("");
  const teamMap = useMemo(() => Object.fromEntries(teams.map(team => [team.id, team])), [teams]);
  const resetUser = () => { setEditing(null); setUserForm({ name: "", employeeId: "", email: "", username: "", password: "", teamId: teams[0]?.id || "" }); };
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
  const togglePermission = (teamId, permission) => onChangeTeams(teams.map(team => team.id === teamId ? { ...team, permissions: team.permissions.includes(permission) ? team.permissions.filter(item => item !== permission) : [...team.permissions, permission] } : team));
  return <div style={{ paddingBottom: 40 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22 }}><div><h1 style={{ margin: 0, fontSize: 22, color: "#1B2130" }}>User management</h1><div style={{ color: "#8A8D98", fontSize: 13.5, marginTop: 4 }}>Create users, assign teams, and control access</div></div>{tab === "users" && <button onClick={resetUser} style={primaryButtonStyle}>Add new user</button>}</div>
    <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>{[["users", `Users (${users.length})`], ["teams", `Teams (${teams.length})`], ["display", "Big-screen display"]].map(([key, label]) => <button key={key} onClick={() => setTab(key)} style={{ ...tabButtonStyle, ...(tab === key ? activeTabStyle : {}) }}>{label}</button>)}</div>
    {tab === "users" && <><form onSubmit={submitUser} style={panelStyle}><div style={panelTitle}>{editing ? "Edit user" : "Add user"}</div><div style={formGrid}>{[["name", "Full name"], ["employeeId", "Employee ID"], ["email", "Email"], ["username", "Username"], ["password", "Password"]].map(([key, label]) => <label key={key} style={labelStyle}>{label}<input required={key !== "email"} type={key === "password" ? "password" : "text"} value={userForm[key]} onChange={e => setUserForm({ ...userForm, [key]: e.target.value })} style={inputStyle} /></label>)}<label style={labelStyle}>Team<select value={userForm.teamId} onChange={e => setUserForm({ ...userForm, teamId: e.target.value })} style={inputStyle}>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label></div><button type="submit" style={primaryButtonStyle}>{editing ? "Save user" : "Create user"}</button>{editing && <button type="button" onClick={resetUser} style={secondaryButtonStyle}>Cancel</button>}</form><div style={panelStyle}><div style={panelTitle}>Users</div>{users.map(user => <div key={user.id} style={rowStyle}><div style={avatarStyle}>{user.name.slice(0, 1).toUpperCase()}</div><div style={{ flex: 1 }}><b>{user.name}</b><div style={{ color: "#8A8D98", fontSize: 12 }}>{user.email || user.username} · {teamMap[user.teamId]?.name || "No team"}</div></div><button onClick={() => { setEditing(user); setUserForm(user); }} style={secondaryButtonStyle}>Edit</button><button onClick={() => onChangeUsers(users.filter(item => item.id !== user.id))} style={dangerButtonStyle}>Delete</button></div>)}</div></>}
    {tab === "teams" && <><form onSubmit={addTeam} style={{ ...panelStyle, display: "flex", gap: 10 }}><input placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} required style={{ ...inputStyle, flex: 1 }} /><button type="submit" style={primaryButtonStyle}>Add team</button></form>{teams.map(team => <div key={team.id} style={panelStyle}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><b>{team.name}</b>{team.id !== "team-admin" && <button onClick={() => onChangeTeams(teams.filter(item => item.id !== team.id))} style={dangerButtonStyle}>Delete</button>}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{PERMISSIONS.map(([permission, label]) => <label key={permission} style={{ fontSize: 12, color: "#4B5563" }}><input type="checkbox" checked={team.permissions.includes(permission)} onChange={() => togglePermission(team.id, permission)} /> {label}</label>)}</div></div>)}</>}
    {tab === "display" && <div style={panelStyle}><div style={panelTitle}>Performance rotation</div><label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, marginBottom: 18 }}><input type="checkbox" checked={rotation.enabled} onChange={e => onChangeRotation({ ...rotation, enabled: e.target.checked })} /> Rotate employee dashboards automatically</label><label style={labelStyle}>Interval (minutes)<input type="number" min="2" max="3" value={rotation.intervalMinutes} onChange={e => onChangeRotation({ ...rotation, intervalMinutes: Math.min(3, Math.max(2, Number(e.target.value) || 2)) })} style={{ ...inputStyle, maxWidth: 120 }} /></label><div style={{ color: "#8A8D98", fontSize: 12, marginTop: 14 }}>When enabled, the screen changes employee dashboard every 2 to 3 minutes.</div></div>}
  </div>;
}

const inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #D1D5DB", borderRadius: 7, padding: "10px 11px", fontSize: 13, color: "#151B2E" };
const primaryButtonStyle = { border: 0, borderRadius: 7, padding: "10px 14px", marginTop: 16, background: "#151B2E", color: "#fff", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { border: "1px solid #D1D5DB", background: "#fff", borderRadius: 6, padding: "7px 11px", color: "#4B5563", cursor: "pointer" };
const dangerButtonStyle = { ...secondaryButtonStyle, color: "#B42318", borderColor: "#FECACA" };
const labelStyle = { display: "flex", flexDirection: "column", gap: 6, color: "#64748B", fontSize: 11.5, fontWeight: 600 };
const panelStyle = { background: "#fff", border: "1px solid #ECEDF1", borderRadius: 12, padding: 18, marginBottom: 16 };
const panelTitle = { fontSize: 14, fontWeight: 700, color: "#1B2130", marginBottom: 14 };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 };
const rowStyle = { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid #F0F0F2", fontSize: 13 };
const avatarStyle = { width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", background: "#334E87", color: "#fff", fontWeight: 700 };
const tabButtonStyle = { border: "1px solid #E2E8F0", background: "#fff", padding: "9px 14px", color: "#4B5563", cursor: "pointer" };
const activeTabStyle = { background: "#151B2E", color: "#fff" };