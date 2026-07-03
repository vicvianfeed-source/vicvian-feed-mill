import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { canAccess } from "@/lib/permissions";
import { fmtMoney } from "@/lib/format";
import AccessDenied from "@/components/common/AccessDenied";
import PriceForm from "@/components/pricing/PriceForm";
import DomainBadge from "@/components/common/DomainBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag, History } from "lucide-react";

export default function Pricing() {
  const { user, role } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);

  const load = async () => {
    setProducts(await base44.entities.Product.list("-created_date", 500));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!canAccess(role, "pricing")) return <AccessDenied />;

  const openHistory = async (product) => {
    setHistoryFor(product);
    setHistory(await base44.entities.PriceRecord.filter({ product_id: product.id }, "-effective_date", 50));
  };

  const active = products.filter((p) => p.active !== false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Daily Pricing</h1>
        <p className="text-sm text-slate-500 mt-1">Set today's prices — manual or cost-based with markup</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : active.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No products to price yet.</TableCell></TableRow>
            ) : (
              active.map((p, i) => (
                <TableRow key={p.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><DomainBadge domain={p.domain} /></TableCell>
                  <TableCell className="text-slate-500">{p.unit}</TableCell>
                  <TableCell className="text-right tabular-nums font-bold">{fmtMoney(p.current_price)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setPricing(p)}>
                        <Tag className="w-3.5 h-3.5 mr-1" /> Set price
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openHistory(p)}>
                        <History className="w-3.5 h-3.5 mr-1" /> History
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!pricing} onOpenChange={(v) => !v && setPricing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Price — {pricing?.name}</DialogTitle></DialogHeader>
          {pricing && (
            <PriceForm product={pricing} user={user}
              onSaved={() => { setPricing(null); load(); }} onCancel={() => setPricing(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyFor} onOpenChange={(v) => !v && setHistoryFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Price History — {historyFor?.name}</DialogTitle></DialogHeader>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No price history recorded yet.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{h.effective_date}</p>
                    <p className="text-xs text-slate-400">
                      {h.method === "formula" ? `Cost ${fmtMoney(h.cost_basis)} + ${h.markup_percent}%` : "Manual"} · {h.set_by}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums">{fmtMoney(h.price)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}