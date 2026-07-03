import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import SaleForm from "@/components/sales/SaleForm";
import DomainBadge from "@/components/common/DomainBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default function Sales() {
  const { user } = useOutletContext();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [s, p] = await Promise.all([
      base44.entities.Sale.list("-created_date", 100),
      base44.entities.Product.list("-created_date", 500),
    ]);
    setSales(s);
    setProducts(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async ({ product, quantity, customer_name }) => {
    setSaving(true);
    const total = Math.round(product.current_price * quantity * 100) / 100;
    const sale = await base44.entities.Sale.create({
      product_id: product.id, product_name: product.name, domain: product.domain,
      quantity, unit_price: product.current_price, total, customer_name,
      operator_email: user.email, status: "completed",
    });
    await base44.entities.Product.update(product.id, { stock_quantity: product.stock_quantity - quantity });
    await logAudit({
      entityType: "Sale", entityId: sale.id, action: "create",
      newValue: { product: product.name, quantity, total },
      description: `Sale: ${quantity} × ${product.name}`,
    });
    setSaving(false);
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
          <p className="text-sm text-slate-500 mt-1">Feed mill & fish farm product sales</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Sale</Button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Recorded by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : sales.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No sales recorded yet.</TableCell></TableRow>
            ) : (
              sales.map((s, i) => (
                <TableRow key={s.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="text-slate-500 text-xs">{new Date(s.created_date).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{s.product_name}</TableCell>
                  <TableCell><DomainBadge domain={s.domain} /></TableCell>
                  <TableCell className="text-right tabular-nums">{s.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(s.unit_price)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(s.total)}</TableCell>
                  <TableCell className="text-xs text-slate-500">{s.operator_email}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Sale</DialogTitle></DialogHeader>
          <SaleForm products={products} onSubmit={handleSubmit} onCancel={() => setOpen(false)} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}