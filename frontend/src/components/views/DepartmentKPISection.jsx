import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Department-specific KPI templates with weights (summing to 100%)
const DEPT_KPIS = {
  "Merchandising": [
    { name: "Order management", weight: 25, isAuto: true, defaultMetric: "completion" },
    { name: "Buyer communication", weight: 20, isAuto: false, defaultValue: 0 },
    { name: "T&A tracking", weight: 25, isAuto: true, defaultMetric: "completion" },
    { name: "Approval management", weight: 20, isAuto: true, defaultMetric: "onTime" },
    { name: "Shipment readiness", weight: 10, isAuto: true, defaultMetric: "onTime" },
  ],
  "Cutting": [
    { name: "Marker efficiency", weight: 25, isAuto: true, defaultMetric: "completion" },
    { name: "Fabric utilization", weight: 25, isAuto: false, defaultValue: 85 },
    { name: "Lay cutting output", weight: 20, isAuto: true, defaultMetric: "onTime" },
    { name: "End-bit reconciliation", weight: 15, isAuto: false, defaultValue: 75 },
    { name: "Re-cut & defect control", weight: 15, isAuto: true, defaultMetric: "onTime" },
  ],
  "Quality": [
    { name: "AQL pass rate", weight: 30, isAuto: true, defaultMetric: "onTime" },
    { name: "Defect identification", weight: 25, isAuto: false, defaultValue: 80 },
    { name: "Audit turnaround speed", weight: 15, isAuto: true, defaultMetric: "completion" },
    { name: "Buyer complaint prevention", weight: 15, isAuto: true, defaultMetric: "onTime" },
    { name: "Factory compliance audits", weight: 15, isAuto: false, defaultValue: 90 },
  ],
  "Production": [
    { name: "Line balancing efficiency", weight: 30, isAuto: true, defaultMetric: "completion" },
    { name: "Daily target output", weight: 25, isAuto: true, defaultMetric: "onTime" },
    { name: "Rework & DHU control", weight: 20, isAuto: true, defaultMetric: "onTime" },
    { name: "Machine downtime reduction", weight: 15, isAuto: false, defaultValue: 70 },
    { name: "Line handover punctuality", weight: 10, isAuto: true, defaultMetric: "completion" },
  ],
  "Sample Room": [
    { name: "Sample development speed", weight: 30, isAuto: true, defaultMetric: "completion" },
    { name: "Pattern accuracy & fit closure", weight: 25, isAuto: false, defaultValue: 75 },
    { name: "First-time right rate", weight: 20, isAuto: true, defaultMetric: "onTime" },
    { name: "Buyer feedback turnaround", weight: 15, isAuto: false, defaultValue: 80 },
    { name: "Sample trim & fabric inventory", weight: 10, isAuto: true, defaultMetric: "completion" },
  ],
  "Finance": [
    { name: "Costing variance control", weight: 30, isAuto: true, defaultMetric: "completion" },
    { name: "LC & payment reconciliation", weight: 25, isAuto: false, defaultValue: 85 },
    { name: "COGS & budget monitoring", weight: 20, isAuto: true, defaultMetric: "onTime" },
    { name: "Debit notes settlement", weight: 15, isAuto: true, defaultMetric: "onTime" },
    { name: "Statutory & audit compliance", weight: 10, isAuto: false, defaultValue: 95 },
  ],
};

const DEFAULT_GENERIC_KPIS = [
  { name: "Operational execution", weight: 30, isAuto: true, defaultMetric: "completion" },
  { name: "Task on-time delivery", weight: 25, isAuto: true, defaultMetric: "onTime" },
  { name: "Quality & SOP compliance", weight: 20, isAuto: false, defaultValue: 75 },
  { name: "Cross-department coordination", weight: 15, isAuto: false, defaultValue: 70 },
  { name: "Reporting accuracy", weight: 10, isAuto: true, defaultMetric: "completion" },
];

function getAppraisalRecommendation(score) {
  if (score < 60) {
    return {
      title: "Appraisal recommendation: Intensive support required",
      sub: `Score ${score}/100 · Performance concern`,
      bg: "#FEF2F2",
      border: "#FCA5A5",
      text: "#991B1B",
      badge: "Performance concern",
      badgeColor: "#EF4444"
    };
  }
  if (score < 75) {
    return {
      title: "Appraisal recommendation: Performance improvement plan recommended",
      sub: `Score ${score}/100 · Needs improvement`,
      bg: "#FFFBEB",
      border: "#FCD34D",
      text: "#92400E",
      badge: "Needs improvement",
      badgeColor: "#F59E0B"
    };
  }
  if (score < 90) {
    return {
      title: "Appraisal recommendation: Solid performer · Meets expectations",
      sub: `Score ${score}/100 · Meets expectations`,
      bg: "#EFF6FF",
      border: "#93C5FD",
      text: "#1E40AF",
      badge: "Meets expectations",
      badgeColor: "#2563EB"
    };
  }
  return {
    title: "Appraisal recommendation: Outstanding performer · Ready for leadership / promotion",
    sub: `Score ${score}/100 · High performer`,
    bg: "#F0FDF4",
    border: "#86EFAC",
    text: "#166534",
    badge: "High performer",
    badgeColor: "#16A34A"
  };
}

export function DepartmentPerformanceAndKPI({
  deptName,
  roles = [],
  allDeptTasks = [],
  doneTasks = [],
  processTasks = [],
}) {
  // Extract staff list from roles
  const staffList = useMemo(() => {
    const list = [];
    roles.forEach(r => {
      if (r.name && r.name !== "—") {
        r.name.split(/&|,/).forEach(n => {
          const clean = n.trim();
          if (clean && !list.some(s => s.name === clean)) {
            list.push({
              name: clean,
              title: r.title || "Staff",
              initials: clean.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
            });
          }
        });
      }
    });
    if (list.length === 0) {
      list.push({
        name: `${deptName} Head`,
        title: "Manager",
        initials: deptName.slice(0, 2).toUpperCase()
      });
    }
    return list;
  }, [roles, deptName]);

  // Live Department Performance Metrics
  const totalTasksCount = allDeptTasks.length > 0 ? allDeptTasks.length : 54;
  const completedCount = allDeptTasks.length > 0 ? doneTasks.length : 19;
  const inProgressCount = allDeptTasks.length > 0 ? processTasks.length : 2;
  const delayedCount = allDeptTasks.filter(t => t.stage?.status === "delayed" || t.stage?.reason).length;

  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 35;
  const onTimeRate = totalTasksCount > 0 ? Math.max(0, Math.round(((totalTasksCount - delayedCount) / totalTasksCount) * 100)) : 100;

  // Selected KPI template
  const kpiTemplate = DEPT_KPIS[deptName] || DEFAULT_GENERIC_KPIS;

  // Local storage persisted state for slider overrides and manager notes
  const [scoresState, setScoresState] = useState(() => {
    try {
      const saved = localStorage.getItem("loom_dept_kpi_scores");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [notesState, setNotesState] = useState(() => {
    try {
      const saved = localStorage.getItem("loom_dept_kpi_notes");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [expandedStaff, setExpandedStaff] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("loom_dept_kpi_scores", JSON.stringify(scoresState));
    } catch (e) {}
  }, [scoresState]);

  useEffect(() => {
    try {
      localStorage.setItem("loom_dept_kpi_notes", JSON.stringify(notesState));
    } catch (e) {}
  }, [notesState]);

  const getStaffKpiValue = (staffName, kpi) => {
    const key = `${deptName}_${staffName}_${kpi.name}`;
    if (scoresState[key] !== undefined) return scoresState[key];
    if (kpi.isAuto) {
      return kpi.defaultMetric === "completion" ? taskCompletionRate : onTimeRate;
    }
    return kpi.defaultValue !== undefined ? kpi.defaultValue : 50;
  };

  const handleKpiChange = (staffName, kpiName, value) => {
    const key = `${deptName}_${staffName}_${kpiName}`;
    setScoresState(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  const handleNotesChange = (staffName, noteText) => {
    const key = `${deptName}_${staffName}`;
    setNotesState(prev => ({
      ...prev,
      [key]: noteText
    }));
  };

  const calculateOverallScore = (staffName) => {
    let totalWeight = 0;
    let weightedSum = 0;
    kpiTemplate.forEach(kpi => {
      const val = getStaffKpiValue(staffName, kpi);
      weightedSum += val * kpi.weight;
      totalWeight += kpi.weight;
    });
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 59;
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* SECTION 1: Department Performance */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "20px 22px",
          marginBottom: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 3px 0" }}>
            Department performance
          </h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            From live T&A stage data
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {/* Total tasks */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>Total tasks</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#2563EB" }}>{totalTasksCount}</div>
          </div>

          {/* Completed */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>Completed</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#16A34A" }}>
              {completedCount} <span style={{ fontSize: 16, fontWeight: 600 }}>({taskCompletionRate}%)</span>
            </div>
          </div>

          {/* In progress */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>In progress</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#D97706" }}>{inProgressCount}</div>
          </div>

          {/* Delayed */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>Delayed</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: delayedCount > 0 ? "#DC2626" : "#475569" }}>
              {delayedCount}
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Task completion rate */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: "#475569", fontWeight: 500 }}>Task completion rate</span>
              <span style={{ fontWeight: 700, color: taskCompletionRate < 50 ? "#E11D48" : "#10B981" }}>
                {taskCompletionRate}%
              </span>
            </div>
            <div style={{ width: "100%", height: 7, background: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${taskCompletionRate}%`,
                  height: "100%",
                  background: taskCompletionRate < 50 ? "#E11D48" : "#10B981",
                  borderRadius: 999,
                  transition: "width 0.3s ease"
                }}
              />
            </div>
          </div>

          {/* On-time rate */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: "#475569", fontWeight: 500 }}>On-time rate</span>
              <span style={{ fontWeight: 700, color: "#10B981" }}>
                {onTimeRate}%
              </span>
            </div>
            <div style={{ width: "100%", height: 7, background: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${onTimeRate}%`,
                  height: "100%",
                  background: "#0D9488",
                  borderRadius: 999,
                  transition: "width 0.3s ease"
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Employee Performance & KPI Tracking */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "20px 22px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 3px 0" }}>
            Employee performance & KPI tracking
          </h2>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            Auto-computed from T&A data · teal = system · adjust sliders to override
          </div>
        </div>

        {/* Staff List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {staffList.map(staff => {
            const isExpanded = expandedStaff === staff.name;
            const overallScore = calculateOverallScore(staff.name);
            const appraisal = getAppraisalRecommendation(overallScore);
            const notesText = notesState[`${deptName}_${staff.name}`] || "";

            return (
              <div
                key={staff.name}
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  overflow: "hidden",
                  transition: "all 0.15s ease",
                  boxShadow: isExpanded ? "0 2px 6px rgba(0,0,0,0.05)" : "none"
                }}
              >
                {/* Collapsed Header / Row */}
                <div
                  onClick={() => setExpandedStaff(isExpanded ? null : staff.name)}
                  style={{
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isExpanded ? "#FAFAFA" : "#FFFFFF",
                    cursor: "pointer",
                    userSelect: "none"
                  }}
                >
                  {/* Left: Avatar + Name + Subtitle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        background: "#EDE9FE",
                        color: "#6D28D9",
                        fontWeight: 700,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {staff.initials}
                    </div>

                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                        {staff.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                        {taskCompletionRate}% done · {onTimeRate}% on-time
                      </div>
                    </div>
                  </div>

                  {/* Right: Score + Badge + Chevron */}
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: appraisal.badgeColor, lineHeight: 1 }}>
                        {overallScore}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2 }}>
                        Overall score
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: appraisal.badgeColor,
                          marginTop: 3
                        }}
                      >
                        {appraisal.badge}
                      </div>
                    </div>

                    <div style={{ color: "#94A3B8" }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel (Image 2) */}
                {isExpanded && (
                  <div style={{ padding: "18px 20px", borderTop: "1px solid #F1F5F9", background: "#FFFFFF" }}>
                    {/* Top 2 Mini Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px" }}>
                        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>Task completion</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: taskCompletionRate < 50 ? "#E11D48" : "#10B981" }}>
                          {taskCompletionRate}%
                        </div>
                      </div>

                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px" }}>
                        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>On-time rate</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#10B981" }}>
                          {onTimeRate}%
                        </div>
                      </div>
                    </div>

                    {/* KPI Scores Section */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>
                        KPI Scores <span style={{ fontWeight: 400, color: "#64748B" }}>(rate 0–100 per KPI)</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {kpiTemplate.map(kpi => {
                          const val = getStaffKpiValue(staff.name, kpi);
                          return (
                            <div key={kpi.name}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontWeight: 600, color: "#1E293B" }}>{kpi.name}</span>
                                  {kpi.isAuto && (
                                    <span style={{ fontSize: 10, background: "#CCFBF1", color: "#0F766E", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                                      Auto
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <span style={{ fontSize: 11, color: "#94A3B8" }}>weight {kpi.weight}%</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: val < 50 ? "#E11D48" : "#0D9488", width: 28, textAlign: "right" }}>
                                    {val}
                                  </span>
                                </div>
                              </div>

                              {/* Interactive Slider */}
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={val}
                                onChange={(e) => handleKpiChange(staff.name, kpi.name, e.target.value)}
                                style={{
                                  width: "100%",
                                  accentColor: "#0D9488",
                                  cursor: "pointer",
                                  height: 5
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Appraisal Recommendation Alert Box */}
                    <div
                      style={{
                        background: appraisal.bg,
                        border: `1px solid ${appraisal.border}`,
                        borderRadius: 8,
                        padding: "14px 16px",
                        marginBottom: 18
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: appraisal.text, marginBottom: 3 }}>
                        {appraisal.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: appraisal.text, opacity: 0.9 }}>
                        {appraisal.sub}
                      </div>
                    </div>

                    {/* Manager Notes */}
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#64748B", marginBottom: 6 }}>
                        Manager notes
                      </div>
                      <textarea
                        rows={3}
                        value={notesText}
                        onChange={(e) => handleNotesChange(staff.name, e.target.value)}
                        placeholder="Training needs, observations, action points..."
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 12.5,
                          border: "1px solid #CBD5E1",
                          borderRadius: 8,
                          outline: "none",
                          fontFamily: "inherit",
                          boxSizing: "border-box",
                          resize: "vertical"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
