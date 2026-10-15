import React, { useState, useMemo, useCallback } from "react";
import {
  CheckSquare, Search, Filter, Calendar, Clock, ChevronRight,
  ChevronLeft, AlertTriangle, CheckCircle2, User, Building,
  ArrowUpDown, Layers, Plus, X, RefreshCw, Home, Package,
  ClipboardCheck, Bell, Info
} from "lucide-react";
import { statusPill, collectTasks } from "../common/CommonUI.jsx";
import { formatTimeAgo } from "../../constants/loomData.js";
import { MobileBottomNav } from "./MobileBottomNav.jsx";

/**
 * MobileTasksScreen
 * Clean, light mobile My Tasks screen with soft blue primary actions and balanced category accents.
 * Uses real live data from Loom PLM state and APIs.
 */
export function MobileTasksScreen({
  orders = [],
  customTasks = [],
  role = {},
  activeUser = {},
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateStages,
  onOpenOrder,
  onNavigate,
  isDarkMode = false
}) {
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'custom', 'tna'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'open', 'completed', 'overdue'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null); // When a task card is tapped
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState(null); // { type: 'success'|'error', message: string }
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    orderId: "",
    dept: role?.dept || "Merchandising",
    dueDate: "",
    priority: "medium",
    notes: ""
  });

  // Safe collections
  const safeOrders = useMemo(() => {
    return (Array.isArray(orders) ? orders : []).filter(o => o && !o.isDeleted);
  }, [orders]);

  const safeTasks = useMemo(() => {
    return Array.isArray(customTasks) ? customTasks : [];
  }, [customTasks]);

  // Current user identifiers
  const cleanUser = String(activeUser?.name || role?.label || "").split(" (")[0].trim().toLowerCase();
  const cleanUsername = String(activeUser?.username || "").trim().toLowerCase();
  const userDeptList = useMemo(() => {
    return Array.isArray(role?.departments) && role.departments.length > 0
      ? role.departments.map(d => d.toLowerCase())
      : [(role?.dept || "").toLowerCase()];
  }, [role]);

  // 1. Live Custom / Assigned tasks matching user & permissions
  const userCustomTasks = useMemo(() => {
    return safeTasks.filter(t => {
      if (!t || t.isDeleted) return false;
      // If linked to an order, verify order is not deleted
      if (t.orderId) {
        const linkedOrder = safeOrders.find(o =>
          (o.primaryId && o.primaryId === t.orderId) ||
          (o._id && o._id === t.orderId) ||
          o.id === t.orderId
        );
        if (linkedOrder && linkedOrder.isDeleted) return false;
      }
      if (role?.fullAccess || role?.dept === "Administrators" || role?.dept === "Executive") return true;
      const assignee = String(t.assignee || "").replace(/^@/, "").toLowerCase();
      const directMatch = (cleanUser && (assignee === cleanUser || assignee.includes(cleanUser))) ||
        (cleanUsername && (assignee === cleanUsername || assignee.includes(cleanUsername)));
      if (directMatch) return true;
      return t.dept && (userDeptList.includes(t.dept.toLowerCase()) || t.dept === "All");
    });
  }, [safeTasks, safeOrders, role, cleanUser, cleanUsername, userDeptList]);

  // 2. Live T&A Schedule stage tasks matching user department & permissions
  const userTnaTasks = useMemo(() => {
    return collectTasks(safeOrders, null).filter(r => {
      if (role?.fullAccess || role?.dept === "Administrators" || role?.dept === "Executive") return true;
      return r.dept && userDeptList.includes(r.dept.toLowerCase());
    });
  }, [safeOrders, role, userDeptList]);

  // Normalized list of all tasks for mobile view
  const allNormalizedTasks = useMemo(() => {
    const list = [];

    // Custom Tasks
    userCustomTasks.forEach(t => {
      const isDone = t.status === "done";
      let isOverdue = false;
      if (!isDone && t.dueDate) {
        const parsed = new Date(t.dueDate);
        if (!isNaN(parsed)) isOverdue = parsed < new Date();
      }

      list.push({
        id: t.id,
        rawId: t.id,
        type: "custom",
        title: t.title,
        orderId: t.orderId || null,
        dept: t.dept || "General",
        assignee: t.assignee || "Unassigned",
        dueDate: t.dueDate || "Not set",
        priority: t.priority || "medium",
        notes: t.notes || "",
        status: isDone ? "done" : (t.status || "in_progress"),
        isOverdue,
        createdAt: t.createdAt,
        raw: t
      });
    });

    // T&A Stage Tasks
    userTnaTasks.forEach(r => {
      const stage = r.stage || {};
      const order = r.order || {};
      const isDone = stage.status === "done";
      const isOverdue = Boolean(stage.reason || stage.status === "Delayed" || stage.status === "delayed");

      list.push({
        id: `tna_${order.id || order.primaryId}_${stage.name}_${r.stageIdx}`,
        rawId: stage.name,
        type: "tna",
        title: stage.name,
        orderId: order.id,
        orderPrimaryId: order.primaryId || order.id,
        dept: r.dept || "General",
        assignee: stage.assignee || r.dept || "Department",
        dueDate: stage.planned || "—",
        actualDate: stage.actual || null,
        priority: isOverdue ? "high" : "medium",
        notes: stage.reason || "",
        status: isDone ? "done" : (isOverdue ? "delayed" : "in_progress"),
        isOverdue,
        stageIdx: r.stageIdx,
        orderObj: order,
        raw: r
      });
    });

    return list;
  }, [userCustomTasks, userTnaTasks]);

  // Filtered tasks by tab, status, and search query
  const filteredTasks = useMemo(() => {
    return allNormalizedTasks.filter(item => {
      // Tab filter
      if (activeTab === "custom" && item.type !== "custom") return false;
      if (activeTab === "tna" && item.type !== "tna") return false;

      // Status filter
      if (statusFilter === "open" && item.status === "done") return false;
      if (statusFilter === "completed" && item.status !== "done") return false;
      if (statusFilter === "overdue" && !item.isOverdue) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title && item.title.toLowerCase().includes(q);
        const matchOrder = item.orderId && item.orderId.toLowerCase().includes(q);
        const matchDept = item.dept && item.dept.toLowerCase().includes(q);
        const matchAssignee = item.assignee && item.assignee.toLowerCase().includes(q);
        if (!matchTitle && !matchOrder && !matchDept && !matchAssignee) return false;
      }

      return true;
    });
  }, [allNormalizedTasks, activeTab, statusFilter, searchQuery]);

  // Priority color helper
  const getPriorityBadge = (prio) => {
    switch (prio) {
      case "high":
        return { bg: "#FEF2F2", fg: "#DC2626", border: "#FECACA" };
      case "low":
        return { bg: "#F0FDF4", fg: "#16A34A", border: "#BBF7D0" };
      default:
        return { bg: "#FFFBEB", fg: "#D97706", border: "#FDE68A" };
    }
  };

  // Toggle Custom Task completion
  const handleToggleCustomTask = async (taskItem, e) => {
    if (e) e.stopPropagation();
    if (!onUpdateTask || taskItem.type !== "custom") return;

    const nextStatus = taskItem.status === "done" ? "in_progress" : "done";
    setIsUpdating(true);
    setUpdateFeedback(null);

    try {
      await Promise.resolve(onUpdateTask(taskItem.rawId, { status: nextStatus }));
      setUpdateFeedback({ type: "success", message: `Task marked as ${nextStatus === "done" ? "Completed" : "In Progress"}` });
      if (selectedTaskDetail && selectedTaskDetail.id === taskItem.id) {
        setSelectedTaskDetail(prev => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      console.error("Failed to update task:", err);
      setUpdateFeedback({ type: "error", message: "Failed to update task. Please try again." });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdateFeedback(null), 3500);
    }
  };

  // Toggle T&A Stage Task completion
  const handleToggleTnaStage = async (taskItem, e) => {
    if (e) e.stopPropagation();
    if (!onUpdateStages || taskItem.type !== "tna" || !taskItem.orderObj) return;

    setIsUpdating(true);
    setUpdateFeedback(null);

    try {
      const order = taskItem.orderObj;
      const currentStages = Array.isArray(order.stages) ? [...order.stages] : [];
      const targetIdx = taskItem.stageIdx;

      if (targetIdx !== undefined && currentStages[targetIdx]) {
        const currentStage = currentStages[targetIdx];
        const isDone = currentStage.status === "done";
        const nextStatus = isDone ? "pending" : "done";
        const nextActual = isDone ? null : new Date().toISOString().split("T")[0];

        currentStages[targetIdx] = {
          ...currentStage,
          status: nextStatus,
          actual: nextActual
        };

        await Promise.resolve(onUpdateStages(order.primaryId || order.id, currentStages));
        setUpdateFeedback({
          type: "success",
          message: `Stage '${currentStage.name}' marked as ${nextStatus === "done" ? "Done" : "Pending"}`
        });

        if (selectedTaskDetail && selectedTaskDetail.id === taskItem.id) {
          setSelectedTaskDetail(prev => ({
            ...prev,
            status: nextStatus,
            actualDate: nextActual
          }));
        }
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
      setUpdateFeedback({ type: "error", message: "Failed to update stage task." });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdateFeedback(null), 3500);
    }
  };

  // Add Task submit
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim() || !onAddTask) return;

    const newTask = {
      title: newTaskForm.title.trim(),
      orderId: newTaskForm.orderId ? newTaskForm.orderId.trim().toUpperCase() : null,
      dept: newTaskForm.dept || role?.dept || "Merchandising",
      assignee: role?.label?.split(" (")[0] || activeUser?.name || "Unassigned",
      dueDate: newTaskForm.dueDate.trim() || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      priority: newTaskForm.priority || "medium",
      notes: newTaskForm.notes.trim(),
      status: "in_progress",
      createdAt: new Date().toISOString()
    };

    onAddTask(newTask);
    setShowAddModal(false);
    setNewTaskForm({
      title: "",
      orderId: "",
      dept: role?.dept || "Merchandising",
      dueDate: "",
      priority: "medium",
      notes: ""
    });
    setUpdateFeedback({ type: "success", message: "Task added successfully!" });
    setTimeout(() => setUpdateFeedback(null), 3500);
  };

  // Counts for tabs
  const openCount = useMemo(() => allNormalizedTasks.filter(t => t.status !== "done").length, [allNormalizedTasks]);
  const overdueCount = useMemo(() => allNormalizedTasks.filter(t => t.isOverdue).length, [allNormalizedTasks]);
  const completedCount = useMemo(() => allNormalizedTasks.filter(t => t.status === "done").length, [allNormalizedTasks]);

  return (
    <div
      className="mobile-tasks-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        paddingBottom: 76,
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}
    >
      {/* Clean Light Top Header with Soft Blue Accent */}
      <div
        className="mobile-tasks-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#FFFFFF",
          color: "#0F172A",
          padding: "12px 16px",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#EFF6FF",
              color: "#2563EB",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16
            }}
          >
            <CheckSquare size={19} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: "#0F172A" }}>My Tasks</div>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
              <span style={{ color: "#2563EB", fontWeight: 700 }}>{openCount}</span> open · {overdueCount > 0 ? <span style={{ color: "#DC2626", fontWeight: 700 }}>{overdueCount} overdue</span> : "on track"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(37, 99, 235, 0.2)"
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Add Task
          </button>
        </div>
      </div>

      {/* Live Feedback Toast */}
      {updateFeedback && (
        <div
          style={{
            margin: "10px 14px 0",
            padding: "9px 12px",
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: updateFeedback.type === "success" ? "#EFF6FF" : "#FEF2F2",
            color: updateFeedback.type === "success" ? "#1D4ED8" : "#991B1B",
            border: `1px solid ${updateFeedback.type === "success" ? "#BFDBFE" : "#FECACA"}`
          }}
        >
          {updateFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{updateFeedback.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#FFFFFF",
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)"
          }}
        >
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search task title, order #, or department..."
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              color: "#0F172A",
              fontSize: 13,
              width: "100%"
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Top Type Filter Pills (All / Custom / T&A Stages) */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { id: "all", label: `All (${allNormalizedTasks.length})` },
            { id: "custom", label: `Action Items (${userCustomTasks.length})` },
            { id: "tna", label: `T&A Stages (${userTnaTasks.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 700 : 500,
                border: "1px solid",
                borderColor: activeTab === tab.id ? "#2563EB" : "#E2E8F0",
                background: activeTab === tab.id ? "#2563EB" : "#FFFFFF",
                color: activeTab === tab.id ? "#FFFFFF" : "#475569",
                whiteSpace: "nowrap",
                cursor: "pointer",
                boxShadow: activeTab === tab.id ? "0 1px 3px rgba(37,99,235,0.2)" : "none"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter Sub-Bar */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {[
            { id: "all", label: "All Status" },
            { id: "open", label: `Open (${openCount})` },
            { id: "overdue", label: `⚠️ Overdue (${overdueCount})` },
            { id: "completed", label: `✓ Done (${completedCount})` }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: statusFilter === st.id ? 700 : 500,
                border: `1px solid ${statusFilter === st.id ? "#BFDBFE" : "transparent"}`,
                background: statusFilter === st.id ? "#EFF6FF" : "#F1F5F9",
                color: statusFilter === st.id ? "#1D4ED8" : "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Task List Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {filteredTasks.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "36px 20px",
                textAlign: "center",
                border: "1px solid #E2E8F0",
                color: "#64748B"
              }}
            >
              <CheckCircle2 size={36} color="#2563EB" style={{ margin: "0 auto 10px", opacity: 0.8 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>No tasks found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or status filter."
                  : "All assignments for your role are up to date."}
              </div>
            </div>
          ) : (
            filteredTasks.map(item => {
              const isDone = item.status === "done";
              const prioStyle = getPriorityBadge(item.priority);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedTaskDetail(item)}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    padding: "12px 14px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    cursor: "pointer",
                    position: "relative",
                    opacity: isDone ? 0.7 : 1,
                    WebkitTapHighlightColor: "transparent"
                  }}
                >
                  {/* Touch Checkbox */}
                  <div
                    onClick={(e) => {
                      if (item.type === "custom") {
                        handleToggleCustomTask(item, e);
                      } else {
                        handleToggleTnaStage(item, e);
                      }
                    }}
                    role="checkbox"
                    aria-checked={isDone}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `2px solid ${isDone ? "#2563EB" : "#CBD5E1"}`,
                      background: isDone ? "#2563EB" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {isDone && <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={3} />}
                  </div>

                  {/* Task Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header: Title and Type Tag */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: isDone ? "#64748B" : "#0F172A",
                          textDecoration: isDone ? "line-through" : "none",
                          lineHeight: 1.3
                        }}
                      >
                        {item.title}
                      </div>
                      <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0, marginTop: 2 }} />
                    </div>

                    {/* Meta Row: Order tag & Department */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                      {item.orderId ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenOrder) onOpenOrder(item.orderPrimaryId || item.orderId);
                          }}
                          style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#2563EB",
                            background: "#EFF6FF",
                            padding: "1px 6px",
                            borderRadius: 4,
                            cursor: "pointer"
                          }}
                        >
                          #{item.orderId}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#64748B" }}>General</span>
                      )}

                      <span style={{ fontSize: 11, color: "#64748B" }}>
                        · {item.dept}
                      </span>

                      {/* Type Badge */}
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: item.type === "custom" ? "#F5F3FF" : "#EFF6FF",
                          color: item.type === "custom" ? "#7C3AED" : "#2563EB"
                        }}
                      >
                        {item.type === "custom" ? "Action Item" : "T&A Stage"}
                      </span>
                    </div>

                    {/* Bottom Row: Due date & status */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: item.isOverdue ? "#DC2626" : "#64748B" }}>
                        <Clock size={12} color={item.isOverdue ? "#DC2626" : undefined} />
                        <span style={{ fontWeight: item.isOverdue ? 700 : 500 }}>
                          Due: {item.dueDate}
                        </span>
                        {item.isOverdue && !isDone && (
                          <span style={{ color: "#DC2626", fontWeight: 700 }}>⚠️ Overdue</span>
                        )}
                      </div>

                      <div>
                        {statusPill(item.status)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Task Details Bottom Sheet / Modal */}
      {selectedTaskDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
            backdropFilter: "blur(2px)"
          }}
          onClick={() => setSelectedTaskDetail(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#FFFFFF",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: "20px 18px 30px",
              boxShadow: "0 -8px 25px rgba(15, 23, 42, 0.15)",
              color: "#0F172A"
            }}
          >
            {/* Sheet Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#CBD5E1", margin: "0 auto 14px" }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: selectedTaskDetail.type === "custom" ? "#7C3AED" : "#2563EB"
                  }}
                >
                  {selectedTaskDetail.type === "custom" ? "Custom Action Item" : "T&A Workflow Stage"}
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 0", lineHeight: 1.3 }}>
                  {selectedTaskDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskDetail(null)}
                style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "#64748B" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Details Grid */}
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: 12,
                border: "1px solid #E2E8F0",
                padding: "14px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Related Order</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                  {selectedTaskDetail.orderId ? (
                    <span
                      onClick={() => {
                        setSelectedTaskDetail(null);
                        if (onOpenOrder) onOpenOrder(selectedTaskDetail.orderPrimaryId || selectedTaskDetail.orderId);
                      }}
                      style={{ color: "#2563EB", textDecoration: "underline", cursor: "pointer", fontFamily: "monospace" }}
                    >
                      #{selectedTaskDetail.orderId}
                    </span>
                  ) : "None (General)"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Department</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{selectedTaskDetail.dept}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Due Date</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: selectedTaskDetail.isOverdue ? "#DC2626" : undefined }}>
                  {selectedTaskDetail.dueDate}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Current Status</div>
                <div style={{ marginTop: 2 }}>{statusPill(selectedTaskDetail.status)}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Assignee</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{selectedTaskDetail.assignee || "—"}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Priority</div>
                <div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize", marginTop: 2 }}>{selectedTaskDetail.priority}</div>
              </div>
            </div>

            {/* Notes if present */}
            {selectedTaskDetail.notes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#475569" }}>Notes / Remarks:</div>
                <div
                  style={{
                    fontSize: 12.5,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#F1F5F9",
                    color: "#334155"
                  }}
                >
                  {selectedTaskDetail.notes}
                </div>
              </div>
            )}

            {/* Permitted Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {/* Toggle Status Button */}
              <button
                disabled={isUpdating}
                onClick={e => {
                  if (selectedTaskDetail.type === "custom") {
                    handleToggleCustomTask(selectedTaskDetail, e);
                  } else {
                    handleToggleTnaStage(selectedTaskDetail, e);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: selectedTaskDetail.status === "done" ? "#64748B" : "#2563EB",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: isUpdating ? "wait" : "pointer",
                  boxShadow: "0 2px 6px rgba(37,99,235,0.25)"
                }}
              >
                {isUpdating ? (
                  <RefreshCw size={16} className="spin-animate" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {selectedTaskDetail.status === "done" ? "Mark as Incomplete" : "Mark as Completed"}
              </button>

              {/* View Order Workspace if linked */}
              {selectedTaskDetail.orderId && onOpenOrder && (
                <button
                  onClick={() => {
                    setSelectedTaskDetail(null);
                    onOpenOrder(selectedTaskDetail.orderPrimaryId || selectedTaskDetail.orderId);
                  }}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    fontSize: 13,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer"
                  }}
                >
                  <Package size={15} />
                  Open Order #{selectedTaskDetail.orderId}
                </button>
              )}

              {/* Delete Task if custom and permitted */}
              {selectedTaskDetail.type === "custom" && onDeleteTask && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this task?")) {
                      onDeleteTask(selectedTaskDetail.rawId);
                      setSelectedTaskDetail(null);
                      setUpdateFeedback({ type: "success", message: "Task deleted." });
                      setTimeout(() => setUpdateFeedback(null), 3000);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    color: "#DC2626",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Delete Action Item
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backdropFilter: "blur(2px)"
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#FFFFFF",
              borderRadius: 16,
              padding: "20px",
              boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.2)",
              color: "#0F172A"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Add New Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: "#475569" }}>Task Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab dip approval follow up"
                  value={newTaskForm.title}
                  onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    fontSize: 13,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: "#475569" }}>Related Order (optional)</label>
                <select
                  value={newTaskForm.orderId}
                  onChange={e => setNewTaskForm({ ...newTaskForm, orderId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    fontSize: 13,
                    boxSizing: "border-box"
                  }}
                >
                  <option value="">-- General Task / None --</option>
                  {safeOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      #{o.id} — {o.buyer || "Buyer"} ({o.style || "Style"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: "#475569" }}>Due Date</label>
                  <input
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={e => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      color: "#0F172A",
                      fontSize: 12,
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: "#475569" }}>Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      color: "#0F172A",
                      fontSize: 12,
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: "#475569" }}>Notes (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or remarks..."
                  value={newTaskForm.notes}
                  onChange={e => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    fontSize: 12.5,
                    boxSizing: "border-box",
                    resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    background: "transparent",
                    color: "#64748B",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563EB",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(37,99,235,0.25)"
                  }}
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Five-Tab Unified Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab="tasks"
        onNavigate={onNavigate}
        pendingTasksCount={openCount}
      />
    </div>
  );
}
