import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtNum, addDays, todayStr } from "@/lib/format";
import DomainBadge from "@/components/common/DomainBadge";
import StatusBadge from "@/components/common/StatusBadge";
import InventoryCard from "@/components/inventory/InventoryCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPE_LABEL = { raw_material: "Raw Material", finished_good: "Finished Good", service: "Service", rental_tool: "Rental Tool" };

export default function Inventory() {
  const { user, role } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [adjusting, setAdjusting] = useState(null);
  const [newQty, setNewQty] = useState("");
  const [reason, setReason] = useState("");
  const isMobile = useIsMobile();

  const load = async () => {
    setProducts(await base44.entities.Product.list("-created_date", 500));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stockStatus = (p) => {
    if (p.expiry_date && p.expiry_date <= addDays(todayStr(), 30) && p.stock_quantity > 0) return "expiring";
    if (p.low_stock_threshold > 0 && p.stock_quantity <= p.low_stock_threshold) return "low_stock";
    return "ok";
  };

  const saveAdjustment = async (e) => {
    e.preventDefault();
    const qty = parseFloat(newQty);
    if (isNaN(qty) || qty < 0) return;
    await base44.entities.Product.update(adjusting.id, { stock_quantity: qty });
    await logAudit({
      entityType: "Product", entityId: adjusting.id, action: "stock_adjustment",
      oldValue: { stock_quantity: adjusting.stock_quantity }, newValue: { stock_quantity: qty },
      description: `Stock adjusted for ${adjusting.name}${reason ? `: ${reason}` : ""}`,
    });
    setAdjusting(null);
    setNewQty("");
    setReason("");
    load();
  };

  const canAdjust = ["admin", "manager"].includes(role);
  const tracked = products.filter((p) => p.product_type !== "service");
  const filtered = typeFilter === "all" ? tracked : tracked.filter((p) => p.product_type === typeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500 mt-1">Stock levels across raw materials, finished goods, and tools</p>
      </div>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="raw_material">Raw Materials</SelectItem>
          <SelectItem value="finished_good">Finished Goods</SelectItem>
          <SelectItem value="rental_tool">Rental Tools</SelectItem>
        </SelectContent>
      </Select>
      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center py-8 text-slate-400 text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">No products found.</p>
          ) : (
            filtered.map((p) => (
              <InventoryCard key={p.id} product={p} typeLabel={TYPE_LABEL[p.product_type]} status={stockStatus(p)}
                canAdjust={canAdjust} onAdjust={() => { setAdjusting(p); setNewQty(String(p.stock_quantity)); }} />
            ))
          )}
        </div>
      ) : (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead>Status</TableHead>
              {canAdjust && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No products found.</TableCell></TableRow>
            ) : (
              filtered.map((p, i) => (
                <TableRow key={p.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="font-medium">
                    {p.name}
                    {p.sku && <span className="block text-xs text-slate-400">{p.sku}</span>}
                  </TableCell>
                  <TableCell><DomainBadge domain={p.domain} /></TableCell>
                  <TableCell className="text-xs text-slate-500">{TYPE_LABEL[p.product_type]}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtNum(p.stock_quantity)} {p.unit}</TableCell>
                  <TableCell className="text-right tabular-nums text-slate-500">{fmtNum(p.low_stock_threshold)}</TableCell>
                  <TableCell><StatusBadge status={stockStatus(p)} label={stockStatus(p) === "ok" ? "OK" : undefined} /></TableCell>
                  {canAdjust && (
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setAdjusting(p); setNewQty(String(p.stock_quantity)); }}>
                        Adjust
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}
      <Dialog open={!!adjusting} onOpenChange={(v) => !v && setAdjusting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stock — {adjusting?.name}</DialogTitle></DialogHeader>
          <form onSubmit={saveAdjustment} className="space-y-4">
            <div className="space-y-1.5">
              <Label>New stock quantity ({adjusting?.unit})</Label>
              <Input type="number" step="0.01" min="0" value={newQty} onChange={(e) => setNewQty(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Stock count correction, damage..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAdjusting(null)}>Cancel</Button>
              <Button type="submit">Save adjustment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}