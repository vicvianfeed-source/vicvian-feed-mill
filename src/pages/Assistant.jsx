import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import MessageBubble from "@/components/assistant/MessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Plus, Send, MessageCircle, Loader2 } from "lucide-react";

const AGENT = "team_assistant";

export default function Assistant() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.agents.listConversations({ agent_name: AGENT }).then(setConversations);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    base44.agents.getConversation(activeId).then((c) => {
      setConversation(c);
      setMessages(c.messages || []);
    });
    const unsubscribe = base44.agents.subscribeToConversation(activeId, (data) => {
      setMessages(data.messages);
    });
    return () => unsubscribe();
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const newConversation = async () => {
    const c = await base44.agents.createConversation({
      agent_name: AGENT,
      metadata: { name: `Chat ${new Date().toLocaleDateString()}` },
    });
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
  };

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !conversation) return;
    setSending(true);
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: text });
    setSending(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5" style={{ height: "calc(100vh - 8rem)" }}>
      <div className="lg:w-64 shrink-0 flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Assistant</h1>
          <p className="text-sm text-slate-500 mt-1">Reminders & app data help</p>
        </div>
        <Button onClick={newConversation} className="justify-start gap-2">
          <Plus className="w-4 h-4" /> New conversation
        </Button>
        <a href={base44.agents.getWhatsAppConnectURL(AGENT)} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 hover:bg-emerald-100 transition-colors">
          <MessageCircle className="w-4 h-4" /> Connect on WhatsApp
        </a>
        <div className="flex-1 overflow-y-auto space-y-1 min-h-[80px]">
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate ${
                activeId === c.id ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              {c.metadata?.name || "Conversation"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <p className="mt-4 font-semibold text-slate-800">Chat with your team assistant</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Ask about sales, services, rentals and stock — or ask it to send email reminders to managers and operators.
            </p>
            <Button onClick={newConversation} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Start a conversation</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question or request reminders…" disabled={sending} />
              <Button type="submit" disabled={sending || !input.trim()} size="icon">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}