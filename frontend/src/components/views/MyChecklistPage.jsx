import React, { useState, useMemo } from "react";
import { Check, X, Plus, Calendar, CheckSquare, Clock } from "lucide-react";

export function MyChecklistPage({
  role,
  checklists = {},
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
}) {
  const deptName = role?.dept || "Merchandising";
  const roleLabel = role?.label ? role.label.split(" (")[0] : (role?.title || deptName);

  const [tab, setTab] = useState("all"); // "all" | "pending" | "done"
  const [taskText, setTaskText] = useState("");
  const [dueDateText, setDueDateText] = useState("");

  const currentList = checklists[deptName] || [];

  const totalCount = currentList.length;
  const completedCount = currentList.filter(item => item.done).length;
  const pendingCount = totalCount - completedCount;

  const filteredTasks = useMemo(() => {
    if (tab === "pending") return currentList.filter(item => !item.done);
    if (tab === "done") return currentList.filter(item => item.done);
    return currentList;
  }, [currentList, tab]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    onAddChecklistItem(deptName, {
      title: taskText.trim(),
      dueDate: dueDateText.trim() || "Today",
    });

    setTaskText("");
    setDueDateText("");
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
          My Checklist
        </h1>
        <div style={{ fontSize: 13, color: "#6B7280" }}>
          Personal task list for <span style={{ fontWeight: 600, color: "#374151" }}>{roleLabel}</span> · visible only to you
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {/* Total Tasks */}
        <div
          style={{
            background: "#EFF6FF",
            border: "1px solid #DBEAFE",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 500, color: "#6B7280", marginBottom: 6 }}>
            Total tasks
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#2563EB" }}>
            {totalCount}
          </div>
        </div>

        {/* Pending */}
        <div
          style={{
            background: "#FEF3C7",
            border: "1px solid #FDE68A",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 500, color: "#92400E", marginBottom: 6 }}>
            Pending
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#D97706" }}>
            {pendingCount}
          </div>
        </div>

        {/* Completed */}
        <div
          style={{
            background: "#DCFCE7",
            border: "1px solid #BBF7D0",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 500, color: "#166534", marginBottom: 6 }}>
            Completed
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#16A34A" }}>
            {completedCount}
          </div>
        </div>
      </div>

      {/* Add New Task Form */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 20,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
        }}
      >
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
          {/* New Task Input */}
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6B7280", marginBottom: 6 }}>
              New task
            </label>
            <input
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="e.g. Follow up with buyer on colour approval..."
              style={{
                width: "100%",
                padding: "9px 13px",
                fontSize: 13,
                border: "1px solid #D1D5DB",
                borderRadius: 8,
                outline: "none",
                background: "#FFFFFF",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Due Date Input */}
          <div style={{ width: 170 }}>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: "#6B7280", marginBottom: 6 }}>
              Due date
            </label>
            <input
              type="text"
              value={dueDateText}
              onChange={(e) => setDueDateText(e.target.value)}
              placeholder="e.g. 20 May"
              style={{
                width: "100%",
                padding: "9px 13px",
                fontSize: 13,
                border: "1px solid #D1D5DB",
                borderRadius: 8,
                outline: "none",
                background: "#FFFFFF",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Add Button */}
          <div>
            <button
              type="submit"
              disabled={!taskText.trim()}
              style={{
                background: taskText.trim() ? "#4F46E5" : "#9CA3AF",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "10px 22px",
                fontSize: 13,
                fontWeight: 600,
                cursor: taskText.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.15s ease",
                height: 38
              }}
            >
              <Plus size={15} /> Add
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "done", label: "Done" },
        ].map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                border: "none",
                background: isActive ? "#EDE9FE" : "transparent",
                color: isActive ? "#6D28D9" : "#6B7280",
                fontWeight: isActive ? 600 : 500,
                fontSize: 12.5,
                padding: "6px 14px",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Task List Card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "8px 12px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)"
        }}
      >
        {filteredTasks.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
            No {tab === "all" ? "" : tab} tasks found for {deptName}.
          </div>
        ) : (
          filteredTasks.map((item, idx) => {
            const isLast = idx === filteredTasks.length - 1;
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 10px",
                  borderBottom: isLast ? "none" : "1px solid #F3F4F6",
                  transition: "background 0.1s ease"
                }}
              >
                {/* Left side: Checkbox & Text */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                  {/* Custom Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleChecklistItem(deptName, item.id)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: item.done ? "2px solid #4F46E5" : "2px solid #CBD5E1",
                      background: item.done ? "#4F46E5" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                      transition: "all 0.15s ease"
                    }}
                  >
                    {item.done && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                  </button>

                  {/* Task details */}
                  <div
                    onClick={() => onToggleChecklistItem(deptName, item.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: item.done ? "#94A3B8" : "#1F2937",
                        textDecoration: item.done ? "line-through" : "none",
                        marginBottom: 2
                      }}
                    >
                      {item.title}
                    </div>
                    {item.dueDate && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: item.done ? "#CBD5E1" : "#EF4444"
                        }}
                      >
                        {item.dueDate}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Delete X icon */}
                <button
                  type="button"
                  onClick={() => onDeleteChecklistItem(deptName, item.id)}
                  title="Delete task"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9CA3AF",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    lineHeight: 1,
                    transition: "color 0.15s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                >
                  <X size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
