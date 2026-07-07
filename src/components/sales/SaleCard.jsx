import React from "react";
import { fmtMoney } from "@/lib/format";
import DomainBadge from "@/components/common/DomainBadge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function SaleCard({ sale, isAdmin, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{sale.product_name}</p>
          <p className="text-xs text-slate-500">{sale.sale_date || new Date(sale.created_date).toLocaleDateString()}</p>
        </div>
        <DomainBadge domain={sale.domain} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div><p className="text-xs text-slate-400">Qty</p><p className="tabular-nums text-slate-900">{sale.quantity}</p></div>
        <div><p className="text-xs text-slate-400">Unit Price</p><p className="tabular-nums text-slate-900">{fmtMoney(sale.unit_price)}</p></div>
        <div><p className="text-xs text-slate-400">Total</p><p className="tabular-nums font-semibold text-slate-900">{fmtMoney(sale.total)}</p></div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400 truncate">{sale.operator_email}</p>
        {isAdmin && (
          <Button variant="ghost" size="sm" className="h-9 text-rose-600" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}