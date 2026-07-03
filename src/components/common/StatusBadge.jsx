import React from "react";

const MAP = {
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  returned: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-800",
  overdue: "bg-rose-100 text-rose-700",
  low_stock: "bg-amber-100 text-amber-800",
  void: "bg-rose-100 text-rose-700",
  ok: "bg-emerald-100 text-emerald-700",
  expiring: "bg-orange-100 text-orange-800",
};

export default function StatusBadge({ status, label }) {
  const cls = MAP[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {label || String(status).replace("_", " ")}
    </span>
  );
}