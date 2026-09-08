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

function localReply(message, orders) {
  const text = message.toLowerCase();
  const mentioned = orders.find(order => text.includes(String(order.id).toLowerCase()));
  const activeOrders = orders.filter(order => order.isDeleted !== true);
  if (/at risk|risk orders|which.*risk/.test(text)) {
    const atRiskOrders = activeOrders.filter(order => order.status === "At Risk");
    if (atRiskOrders.length === 0) return "There are no active orders currently marked At Risk.";
    return `${atRiskOrders.length} active order${atRiskOrders.length === 1 ? " is" : "s are"} marked At Risk: ${atRiskOrders.map(order => `${order.id} (${order.style || "order"})`).join(", ")}. Click an order number to open its workspace.`;
  }
  if (/delayed|delay orders|which.*delay/.test(text)) {
    const delayedOrders = activeOrders.filter(order => order.status === "Delayed");
    if (delayedOrders.length === 0) return "There are no active orders currently marked Delayed.";
    return `${delayedOrders.length} active order${delayedOrders.length === 1 ? " is" : "s are"} marked Delayed: ${delayedOrders.map(order => `${order.id} (${order.style || "order"})`).join(", ")}. Click an order number to open its workspace.`;
  }
  if (mentioned && /process|stage|progress|status|where|what/.test(text)) {
    const done = (mentioned.stages || []).filter(stage => stage.status === "done").length;
    const total = mentioned.stages?.length || 0;
    return `${mentioned.id} is ${mentioned.status || "active"} for ${mentioned.buyer || "the buyer"}. It has ${done} of ${total || "the planned"} production stages completed. Click the order number to open its workspace.`;
  }
  if (/process|workflow|steps|how.*order|order.*process/.test(text)) {
    return "The order process runs through order confirmation, fabric and trims booking, costing, approvals, production, quality inspection, and shipment. Ask about a specific order number for its current stage.";
  }
  if (mentioned) {
    return `${mentioned.id} is a ${mentioned.style || "production"} order for ${mentioned.buyer || "a buyer"}, quantity ${Number(mentioned.qty || 0).toLocaleString()} pieces, currently ${mentioned.status || "active"}. Click the order number to open it.`;
  }
  return "I can help with orders, production stages, costing, approvals, quality, suppliers, and project workflows. Mention an order number such as GKT-1054 to get its details.";
}

const INITIAL_CHAT_MESSAGES = [
  { role: "assistant", text: "Hi. Ask me about this project or mention an order number." }
];

const COMMON_QUESTIONS = [
  "What is the order process?",
  "Which orders are delayed?",
  "Which orders are at risk?",
  "What can you tell me about GKT-1054?"
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
    if (/at risk|risk orders|which.*risk|delayed|delay orders|which.*delay/.test(question.toLowerCase())) {
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
          orders: orders.filter(order => order.isDeleted !== true).map(order => ({
            id: order.id, style: order.style, buyer: order.buyer, qty: order.qty,
            status: order.status, risk: order.risk, ship: order.ship,
            completedStages: (order.stages || []).filter(stage => stage.status === "done").length,
            totalStages: order.stages?.length || 0
          }))
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
        <div style={{ width: "min(360px, calc(100vw - 40px))", height: 460, marginBottom: 12, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #ECEDF1)", borderRadius: 14, boxShadow: "0 16px 40px rgba(15, 23, 42, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#151B2E", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Bot size={18} /><strong style={{ fontSize: 14 }}>Project assistant</strong></div>
            <button type="button" aria-label="Close project assistant" onClick={() => setOpen(false)} style={{ display: "grid", placeItems: "center", border: 0, background: "transparent", color: "#fff", cursor: "pointer" }}><X size={17} /></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((item, index) => (
              <div key={index} style={{ alignSelf: item.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", padding: "9px 11px", borderRadius: item.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px", background: item.role === "user" ? "#DDF4EF" : "var(--bg-card-subtle, #F5F6F8)", color: "var(--text-main, #1B2130)", fontSize: 12.5, lineHeight: 1.45 }}>
                {item.role === "assistant" ? orderMentions(item.text, orders, onOpenOrder) : item.text}
              </div>
            ))}
            {(
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 2 }}>
                <span style={{ color: "var(--text-muted, #8A8D98)", fontSize: 11.5, fontWeight: 600 }}>Common questions</span>
                {COMMON_QUESTIONS.map(question => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendMessage(null, question)}
                    style={{ width: "100%", padding: "8px 10px", textAlign: "left", border: "1px solid var(--border-color, #ECEDF1)", borderRadius: 8, background: "var(--bg-card, #fff)", color: "var(--text-body, #4B5563)", cursor: "pointer", fontSize: 12 }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
            {loading && <div style={{ color: "#8A8D98", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}><LoaderCircle size={14} className="project-chatbot-spin" /> Thinking...</div>}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
          <form onSubmit={sendMessage} style={{ display: "flex", gap: 7, padding: 10, borderTop: "1px solid var(--border-color, #ECEDF1)" }}>
            <input value={message} onChange={event => setMessage(event.target.value)} placeholder="Ask about the project..." aria-label="Ask project assistant" style={{ flex: 1, minWidth: 0, border: "1px solid var(--border-input, #D1D5DB)", borderRadius: 8, padding: "9px 10px", background: "var(--bg-input, #fff)", color: "var(--text-main, #1B2130)", fontSize: 12.5, outline: "none" }} />
            <button type="submit" aria-label="Send message" disabled={loading || !message.trim()} style={{ width: 36, border: 0, borderRadius: 8, background: "#1F9E8D", color: "#fff", display: "grid", placeItems: "center", cursor: loading ? "wait" : "pointer", opacity: loading || !message.trim() ? 0.55 : 1 }}><Send size={16} /></button>
          </form>
        </div>
      )}
      {!open && <button type="button" aria-label="Open project assistant" onClick={() => setOpen(true)} style={{ width: 52, height: 52, border: 0, borderRadius: 999, background: "#1F9E8D", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 8px 22px rgba(31, 158, 141, 0.35)" }}><MessageCircle size={23} /></button>}
      <style>{".project-chatbot-spin{animation:project-chatbot-spin 1s linear infinite}@keyframes project-chatbot-spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}
