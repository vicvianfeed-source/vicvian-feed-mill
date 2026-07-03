import React from "react";
import { AlertTriangle, Clock, CalendarX } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";

function AlertRow({ icon: Icon, iconCls, title, sub, badge, badgeLabel }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <Icon className={`w-4 h-4 shrink-0 ${iconCls}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{sub}</p>
      </div>
      <StatusBadge status={badge} label={badgeLabel} />
    </div>
  );
}

export default function AlertsPanel({ lowStock, overdueRentals, expiring }) {
  const empty = lowStock.length === 0 && overdueRentals.length === 0 && expiring.length === 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Inventory Alerts</h3>
      {empty && <p className="text-sm text-slate-400 py-4">No alerts — everything looks good.</p>}
      {lowStock.map((p) => (
        <AlertRow key={`ls-${p.id}`} icon={AlertTriangle} iconCls="text-amber-500"
          title={p.name} sub={`${p.stock_quantity} ${p.unit} left (threshold ${p.low_stock_threshold})`}
          badge="low_stock" badgeLabel="Low stock" />
      ))}
      {overdueRentals.map((r) => (
        <AlertRow key={`od-${r.id}`} icon={Clock} iconCls="text-rose-500"
          title={r.tool_name} sub={`${r.customer_name} — due back ${r.due_date}`}
          badge="overdue" badgeLabel="Overdue" />
      ))}
      {expiring.map((p) => (
        <AlertRow key={`ex-${p.id}`} icon={CalendarX} iconCls="text-orange-500"
          title={p.name} sub={`Expires ${p.expiry_date}`} badge="expiring" badgeLabel="Expiring" />
      ))}
    </div>
  );
}