import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/format";
import StatusBadge from "@/components/common/StatusBadge";
import DomainBadge from "@/components/common/DomainBadge";

const NEXT_STATUS = {
  pending: "in_progress",
  in_progress: "ready",
  ready: "completed",
  completed: null,
  cancelled: null,
};

const STATUS_LABEL = {
  pending: "Start",
  in_progress: "Mark Ready",
  ready: "Complete",
  completed: null,
  cancelled: null,
};

export default function OrderCard({ order, isAdmin, onAdvance, onCancel, onDelete }) {
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = STATUS_LABEL[order.status];
  const canCancel = order.status !== "cancelled" && order.status !== "completed";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{order.customer_name}</p>
          <p className="text-xs text-slate-500">{new Date(order.created_date).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <DomainBadge domain={order.order_type} />
          <StatusBadge status={order.status} />
        </div>
      </div>
      {order.items_description && (
        <p className="text-sm text-slate-600">{order.items_description}</p>
      )}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div><p className="text-xs text-slate-400">Qty</p><p className="text-slate-900">{order.quantity} {order.unit || ""}</p></div>
        <div><p className="text-xs text-slate-400">Assigned</p><p className="text-slate-900 truncate">{order.assigned_to || "—"}</p></div>
        <div><p className="text-xs text-slate-400">Due</p><p className="text-slate-900">{order.due_date || "—"}</p></div>
      </div>
      {(order.amount > 0 || order.customer_contact) && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400">{order.customer_contact || ""}</p>
          {order.amount > 0 && <p className="tabular-nums font-semibold text-slate-900">{fmtMoney(order.amount)}</p>}
        </div>
      )}
      {order.notes && <p className="text-xs text-slate-400 italic">{order.notes}</p>}
      <div className="flex items-center justify-end gap-1 pt-1">
        {canCancel && (
          <Button variant="ghost" size="sm" className="h-8 text-slate-500" onClick={() => onCancel(order)}>
            Cancel
          </Button>
        )}
        {nextStatus && nextLabel && (
          <Button variant="default" size="sm" className="h-8" onClick={() => onAdvance(order)}>
            {nextLabel}
          </Button>
        )}
        {isAdmin && order.status === "cancelled" && (
          <Button variant="ghost" size="sm" className="h-8 text-rose-600" onClick={() => onDelete(order)}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}