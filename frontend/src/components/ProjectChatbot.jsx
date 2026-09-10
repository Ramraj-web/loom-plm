import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, X, MessageCircle, LoaderCircle } from "lucide-react";

function orderMentions(text, orders, onOpenOrder) {
  const parts = String(text || "").split(/(\b[A-Z]{2,}[A-Z0-9-]*\d[A-Z0-9-]*\b)/g);
  return parts.map((part, index) => {
    const order = orders.find(item => String(item.id).toLowerCase() === part.toLowerCase());
    if (!order) return <React.Fragment key={index}>{part}</React.Fragment>;
    return (
      <button
        key={`${part}-${index}`}
        type="button"
        onClick={() => onOpenOrder(order.id)}
        style={{ border: 0, padding: 0, background: "none", color: "#167A70", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
      >
        {part}
      </button>
    );
  });
}

function getOrderDetailedStatus(order) {
  const stages = order.stages || [];
  const completedStages = stages.filter(s => s.status === "done");
  const inProgressStages = stages.filter(s => s.status === "in_progress" || s.status === "running");
  const delayedStages = stages.filter(s => s.reason || s.status === "delayed" || s.status === "Delayed");
  const nextPendingStage = stages.find(s => s.status !== "done");

  let currentProcessText = "";
  if (inProgressStages.length > 0) {
    const stageNames = inProgressStages.map(s => `"${s.name}" (${s.dept || "General"})`).join(", ");
    currentProcessText = `Current Active Process / Stage: ${stageNames}.`;
  } else if (nextPendingStage) {
    currentProcessText = `Next Stage to be started: "${nextPendingStage.name}" (${nextPendingStage.dept || "General"}).`;
  } else if (stages.length > 0 && completedStages.length === stages.length) {
    currentProcessText = `All ${stages.length} production stages are 100% completed! Order is ready / shipped.`;
  } else {
    currentProcessText = `Current Stage: Initial Order Setup / Confirmation.`;
  }

  const delayText = delayedStages.length > 0
    ? ` ⚠️ Delay Alerts: ${delayedStages.length} stage(s) flagged (${delayedStages.map(d => `${d.name}: "${d.reason || "Delayed"}"`).join("; ")}).`
    : " No active bottlenecks or delay reasons reported.";

  return `${order.id} (${order.style || "Order"} | Buyer: ${order.buyer || "N/A"} | Qty: ${Number(order.qty || 0).toLocaleString()} pcs):
- Status: ${order.status || "Active"} (${order.risk ? `${order.risk} Risk` : "On Track"})
- ${currentProcessText}
- Progress: ${completedStages.length} of ${stages.length} stages done (${Math.round((completedStages.length / (stages.length || 1)) * 100)}%).
- Delivery / Target: ${order.ship || "N/A"}.
${delayText}
Click ${order.id} to view its full TNA & production timeline.`;
}

function localReply(message, orders) {
  const text = message.toLowerCase().trim();
  const activeOrders = orders.filter(order => order.isDeleted !== true);
  
  // Find if a specific order is mentioned by exact ID or pattern
  const mentioned = activeOrders.find(order => {
    const id = String(order.id).toLowerCase();
    const style = String(order.style || "").toLowerCase();
    return text.includes(id) || (style && text.includes(style));
  });

  // 1. Process / Stage / Status of a specific mentioned order
  if (mentioned) {
    return getOrderDetailedStatus(mentioned);
  }

  // 2. Questions asking which stage or process ANY order is in
  if (/(what|which|current).*(process|stage|running|doing)/.test(text) || /(process|stage|where).*(order|standing)/.test(text)) {
    if (activeOrders.length === 0) return "No active orders found in the system.";
    const summaries = activeOrders.slice(0, 5).map(o => {
      const current = (o.stages || []).find(s => s.status === "in_progress" || s.status !== "done");
      return `• ${o.id} (${o.style || "Style"}): currently in "${current?.name || "Order Setup"}" [${current?.dept || "General"}] - ${o.status}`;
    });
    return `Here is the current process/stage breakdown for active orders:\n\n${summaries.join("\n")}\n\nAsk about any specific order number (e.g., "${activeOrders[0]?.id}") for full stage details!`;
  }

  // 3. At Risk Orders
  if (/at risk|risk orders|which.*risk|high risk/.test(text)) {
    const atRiskOrders = activeOrders.filter(order => order.status === "At Risk" || order.risk === "High");
    if (atRiskOrders.length === 0) return "✅ Good news! There are no active orders currently marked At Risk.";
    return `⚠️ ${atRiskOrders.length} active order(s) marked At Risk:\n` +
      atRiskOrders.map(o => {
        const stuckStage = (o.stages || []).find(s => s.reason || s.status !== "done");
        return `• ${o.id} (${o.buyer} - ${o.style}): Stage "${stuckStage?.name || "Production"}" (${stuckStage?.reason || "Pending review"})`;
      }).join("\n") +
      "\n\nClick any order number to open its tracking sheet.";
  }

  // 4. Delayed Orders
  if (/delayed|delay orders|which.*delay|bottleneck|late/.test(text)) {
    const delayedOrders = activeOrders.filter(order => 
      order.status === "Delayed" || 
      (order.stages || []).some(s => s.reason || s.status === "Delayed")
    );
    if (delayedOrders.length === 0) return "✅ All active orders are currently running on-time with zero reported stage delays.";
    return `🚨 ${delayedOrders.length} active order(s) have delay flags:\n` +
      delayedOrders.map(o => {
        const delays = (o.stages || []).filter(s => s.reason);
        const reasonStr = delays.length > 0 ? delays.map(d => `${d.name}: ${d.reason}`).join(", ") : "Schedule delayed";
        return `• ${o.id} (${o.buyer}): ${reasonStr}`;
      }).join("\n") +
      "\n\nClick an order number to inspect delays.";
  }

  // 5. Completed Orders
  if (/completed orders|finished orders|ready to ship|shipped/.test(text)) {
    const completed = activeOrders.filter(o => 
      o.status === "Completed" || 
      ((o.stages || []).length > 0 && o.stages.every(s => s.status === "done"))
    );
    if (completed.length === 0) return "No orders are 100% completed yet. All orders are actively in progress.";
    return `📦 ${completed.length} order(s) completed all production milestones: ${completed.map(o => o.id).join(", ")}.`;
  }

  // 6. General Order process / TNA explanation
  if (/process|workflow|steps|how.*order|standard stages|tna/.test(text)) {
    return "Standard LOOM PLM Order Process Flow:\n1. Order Confirmation & Enquiry (Program)\n2. Fabric & Trims Booking (Purchase)\n3. Costing & CAD Pattern Release\n4. Lab Dip, Fit & Pre-Production Approvals\n5. Fabric Inspection & Cutting\n6. Sewing / Production & In-line Quality Checks\n7. Finishing, Packing & Final Audit\n8. Logistics & Vessel Booking\n\nMention any order number (e.g. GKT-1054) to see its exact current process!";
  }

  // Default fallback with helpful dynamic guidance
  const sampleId = activeOrders[0]?.id || "your order ID";
  return `I can give you exact real-time answers about your orders. You can ask:\n• "Which process is ${sampleId} in?"\n• "Which orders are delayed?"\n• "Which orders are at risk?"\n• "Show completed orders"`;
}

const INITIAL_CHAT_MESSAGES = [
  { role: "assistant", text: "Hello! I am your real-time PLM Assistant. Ask me which process or stage any order is currently in, or click a quick filter below." }
];

const COMMON_QUESTIONS = [
  "Current process of all active orders",
  "Which orders are delayed?",
  "Which orders are at risk?",
  "What is the standard order workflow?",
  "Show completed orders"
];

export function ProjectChatbot({ orders = [], onOpenOrder, userId }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(INITIAL_CHAT_MESSAGES);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const loadedChatKeyRef = useRef(null);
  const chatStorageKey = `loom_project_chat_${userId || "anonymous"}`;

  useEffect(() => {
    let savedMessages = null;
    try {
      const saved = localStorage.getItem(chatStorageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) savedMessages = parsed;
    } catch (error) {}
    setMessages(savedMessages || INITIAL_CHAT_MESSAGES);
    loadedChatKeyRef.current = chatStorageKey;
  }, [chatStorageKey]);

  useEffect(() => {
    if (loadedChatKeyRef.current !== chatStorageKey) return;
    try {
      localStorage.setItem(chatStorageKey, JSON.stringify(messages));
    } catch (error) {}
  }, [messages, chatStorageKey]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  const sendMessage = async (event, presetQuestion = "") => {
    event?.preventDefault();
    const question = (presetQuestion || message).trim();
    if (!question || loading) return;
    setMessage("");
    setMessages(previous => [...previous, { role: "user", text: question }]);
    setLoading(true);

    const activeOrders = orders.filter(order => order.isDeleted !== true);

    // If it's a specific order query or quick rule-matched inquiry, provide instant detailed answer
    const isDirectMatch = activeOrders.some(o => 
      question.toLowerCase().includes(String(o.id).toLowerCase()) || 
      (o.style && question.toLowerCase().includes(String(o.style).toLowerCase()))
    );

    if (isDirectMatch || /at risk|delayed|bottleneck|completed orders|current process of all/.test(question.toLowerCase())) {
      setMessages(previous => [...previous, { role: "assistant", text: localReply(question, orders) }]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          orders: activeOrders.map(order => {
            const stages = order.stages || [];
            const activeStage = stages.find(s => s.status === "in_progress" || s.status !== "done");
            const delayedStages = stages.filter(s => s.reason || s.status === "Delayed");
            return {
              id: order.id,
              style: order.style,
              buyer: order.buyer,
              qty: order.qty,
              status: order.status,
              risk: order.risk,
              ship: order.ship,
              currentStage: activeStage ? `${activeStage.name} (${activeStage.dept || "Production"})` : "Completed",
              completedStages: stages.filter(s => s.status === "done").length,
              totalStages: stages.length,
              delays: delayedStages.map(d => `${d.name}: ${d.reason || "Delayed"}`).join(", ")
            };
          })
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Chat request failed");
      setMessages(previous => [...previous, { role: "assistant", text: data.reply || localReply(question, orders) }]);
    } catch (error) {
      setMessages(previous => [...previous, { role: "assistant", text: localReply(question, orders) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1000, fontFamily: "inherit" }}>
      {open && (
        <div style={{ width: "min(390px, calc(100vw - 32px))", height: 500, marginBottom: 12, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #ECEDF1)", borderRadius: 14, boxShadow: "0 16px 40px rgba(15, 23, 42, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#151B2E", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Bot size={18} color="#2DD4BF" />
              <div>
                <strong style={{ fontSize: 13.5, display: "block", lineHeight: 1.2 }}>PLM Production Assistant</strong>
                <span style={{ fontSize: 10.5, color: "#94A3B8" }}>Live Order Process & TNA Tracking</span>
              </div>
            </div>
            <button type="button" aria-label="Close project assistant" onClick={() => setOpen(false)} style={{ display: "grid", placeItems: "center", border: 0, background: "transparent", color: "#fff", cursor: "pointer" }}><X size={17} /></button>
          </div>

          {/* Quick Filter Bar */}
          <div style={{ display: "flex", gap: 6, padding: "8px 12px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", overflowX: "auto", whiteSpace: "nowrap" }}>
            <button
              type="button"
              onClick={() => sendMessage(null, "Which process are active orders in?")}
              style={{ fontSize: 11, padding: "4px 9px", borderRadius: 12, border: "1px solid #CBD5E1", background: "#fff", color: "#334155", cursor: "pointer", fontWeight: 600 }}
            >
              🔄 Active Processes
            </button>
            <button
              type="button"
              onClick={() => sendMessage(null, "Which orders are delayed?")}
              style={{ fontSize: 11, padding: "4px 9px", borderRadius: 12, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontWeight: 600 }}
            >
              🚨 Delays
            </button>
            <button
              type="button"
              onClick={() => sendMessage(null, "Which orders are at risk?")}
              style={{ fontSize: 11, padding: "4px 9px", borderRadius: 12, border: "1px solid #FED7AA", background: "#FFF7ED", color: "#EA580C", cursor: "pointer", fontWeight: 600 }}
            >
              ⚠️ At Risk
            </button>
            <button
              type="button"
              onClick={() => sendMessage(null, "Show completed orders")}
              style={{ fontSize: 11, padding: "4px 9px", borderRadius: 12, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#16A34A", cursor: "pointer", fontWeight: 600 }}
            >
              ✅ Completed
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((item, index) => (
              <div key={index} style={{ alignSelf: item.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", padding: "9px 12px", borderRadius: item.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px", background: item.role === "user" ? "#0D9488" : "var(--bg-card-subtle, #F1F5F9)", color: item.role === "user" ? "#FFFFFF" : "var(--text-main, #1E293B)", fontSize: 12.5, lineHeight: 1.45, whiteSpace: "pre-line" }}>
                {item.role === "assistant" ? orderMentions(item.text, orders, onOpenOrder) : item.text}
              </div>
            ))}
            {loading && <div style={{ color: "#64748B", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}><LoaderCircle size={14} className="project-chatbot-spin" /> Fetching live process data...</div>}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          <form onSubmit={sendMessage} style={{ display: "flex", gap: 7, padding: 10, borderTop: "1px solid var(--border-color, #ECEDF1)", background: "#fff" }}>
            <input
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="Ask: 'Which process is GKT-1054 in?'..."
              aria-label="Ask project assistant"
              style={{ flex: 1, minWidth: 0, border: "1px solid var(--border-input, #CBD5E1)", borderRadius: 8, padding: "9px 11px", background: "var(--bg-input, #fff)", color: "var(--text-main, #0F172A)", fontSize: 12.5, outline: "none" }}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={loading || !message.trim()}
              style={{ width: 38, border: 0, borderRadius: 8, background: "#0D9488", color: "#fff", display: "grid", placeItems: "center", cursor: loading ? "wait" : "pointer", opacity: loading || !message.trim() ? 0.55 : 1 }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
      {!open && <button type="button" aria-label="Open project assistant" onClick={() => setOpen(true)} style={{ width: 52, height: 52, border: 0, borderRadius: 999, background: "#0D9488", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 8px 22px rgba(13, 148, 136, 0.35)" }}><MessageCircle size={23} /></button>}
      <style>{".project-chatbot-spin{animation:project-chatbot-spin 1s linear infinite}@keyframes project-chatbot-spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}
