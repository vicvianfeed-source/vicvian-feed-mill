import React from "react";
import { fmtNum } from "@/lib/format";
import DomainBadge from "@/components/common/DomainBadge";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";

export default function InventoryCard({ product, typeLabel, status, canAdjust, onAdjust }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{product.name}</p>
          <p className="text-xs text-slate-500">{product.sku ? `${product.sku} · ` : ""}{typeLabel}</p>
        </div>
        <DomainBadge domain={product.domain} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm items-end">
        <div><p className="text-xs text-slate-400">Stock</p><p className="tabular-nums font-semibold text-slate-900">{fmtNum(product.stock_quantity)} {product.unit}</p></div>
        <div><p className="text-xs text-slate-400">Threshold</p><p className="tabular-nums text-slate-900">{fmtNum(product.low_stock_threshold)}</p></div>
        <div><StatusBadge status={status} label={status === "ok" ? "OK" : undefined} /></div>
      </div>
      {canAdjust && (
        <div className="pt-2 border-t border-slate-100">
          <Button size="sm" variant="outline" className="w-full h-9" onClick={onAdjust}>Adjust Stock</Button>
        </div>
      )}
    </div>
  );
}