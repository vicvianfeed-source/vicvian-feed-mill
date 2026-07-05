import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";

const parseJson = (v) => {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
};

function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status;
  const running = ["pending", "running", "in_progress"].includes(status);
  const results = parseJson(toolCall.results);
  const failed = ["failed", "error"].includes(status)
    || (typeof toolCall.results === "string" && /error|failed/i.test(toolCall.results))
    || results?.success === false;
  const dp = toolCall.display_projection;

  const label = dp?.hide_details && dp?.details_redacted
    ? (running ? dp.active_label : failed ? dp.error_label : dp.label)
    : toolCall.name?.replace(/_/g, " ");

  const icon = running
    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
    : failed
      ? <XCircle className="w-3.5 h-3.5 text-rose-500" />
      : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;

  if (dp?.hide_details && dp?.details_redacted) {
    return <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</div>;
  }

  return (
    <div className="mt-2 text-xs">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
        {icon}<span className="capitalize">{label}</span>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-1.5 bg-slate-50 rounded-md p-2 border border-slate-100">
          {toolCall.arguments_string && (
            <pre className="whitespace-pre-wrap break-all text-[11px] text-slate-600">{JSON.stringify(parseJson(toolCall.arguments_string), null, 2)}</pre>
          )}
          {toolCall.results && (
            <pre className="whitespace-pre-wrap break-all text-[11px] text-slate-600">{JSON.stringify(results, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${isUser ? "bg-slate-900 text-white" : "bg-white border border-slate-200"}`}>
        {message.content && (isUser
          ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          : <ReactMarkdown className="text-sm prose prose-sm max-w-none">{message.content}</ReactMarkdown>)}
        {message.tool_calls?.map((tc, idx) => <FunctionDisplay key={idx} toolCall={tc} />)}
      </div>
    </div>
  );
}