import React from "react";
import { fmtMoney } from "@/lib/format";

export default function ServiceJobCard({ job }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{job.service_name}</p>
          <p className="text-xs text-slate-500">{new Date(job.created_date).toLocaleString()}</p>
        </div>
        <p className="tabular-nums font-semibold text-slate-900">{fmtMoney(job.total)}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div><p className="text-xs text-slate-400">Customer</p><p className="text-slate-900 truncate">{job.customer_name}</p></div>
        <div><p className="text-xs text-slate-400">Grain</p><p className="text-slate-900">{job.grain_type || "—"}</p></div>
        <div><p className="text-xs text-slate-400">Qty (kg)</p><p className="tabular-nums text-slate-900">{job.quantity_kg}</p></div>
      </div>
      <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">Rate: {fmtMoney(job.rate_per_kg)}/kg</p>
    </div>
  );
}