import React from "react";
import { fmtMoney } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-react";

export default function ServiceJobCard({ job, isAdmin, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{job.service_name}</p>
          <p className="text-xs text-slate-500">{new Date(job.created_date).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="tabular-nums font-semibold text-slate-900">{fmtMoney(job.total)}</p>
          {isAdmin && (
            <div className="flex gap-1">
              <button onClick={() => onEdit(job)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(job)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-sm">
        <div><p className="text-xs text-slate-400">Customer</p><p className="text-slate-900 truncate">{job.customer_name}</p></div>
        <div><p className="text-xs text-slate-400">Grain</p><p className="text-slate-900">{job.grain_type || "—"}</p></div>
        <div><p className="text-xs text-slate-400">Pellet</p><p className="text-slate-900">{job.pellet_size || "—"}</p></div>
        <div><p className="text-xs text-slate-400">Qty (kg)</p><p className="tabular-nums text-slate-900">{job.quantity_kg}</p></div>
      </div>
      <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">Rate: {fmtMoney(job.rate_per_kg)}/kg</p>
    </div>
  );
}