import React from "react";
import { fmtMoney } from "@/lib/format";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function BatchCard({ batch, canApprove, onApprove }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{batch.output_product_name}</p>
          <p className="text-xs text-slate-500">{new Date(batch.created_date).toLocaleString()}</p>
        </div>
        <StatusBadge status={batch.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><p className="text-xs text-slate-400">Qty Produced</p><p className="tabular-nums text-slate-900">{batch.quantity_produced} {batch.unit}</p></div>
        <div><p className="text-xs text-slate-400">Material Cost</p><p className="tabular-nums text-slate-900">{fmtMoney(batch.total_material_cost)}</p></div>
      </div>
      {(batch.materials || []).length > 0 && (
        <p className="text-xs text-slate-500">
          {(batch.materials || []).map((m) => `${m.quantity} ${m.product_name}`).join(", ")}
        </p>
      )}
      {canApprove && batch.status === "pending" && (
        <div className="pt-2 border-t border-slate-100">
          <Button size="sm" variant="outline" className="w-full h-9" onClick={onApprove}>
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
        </div>
      )}
    </div>
  );
}