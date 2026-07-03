import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import PurchaseForm from "@/components/purchases/PurchaseForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default function Purchases() {
  const { user } = useOutletContext();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [pu, p] = await Promise.all([
      base44.entities.Purchase.list("-created_date", 100),
      base44.entities.Product.list("-created_date", 500),
    ]);
    setPurchases(pu);
    setProducts(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async ({ product, supplier, quantity, unit_cost, total_cost, purchase_date, payment_method }) => {
    setSaving(true);
    const purchase = await base44.entities.Purchase.create({
      product_id: product.id, product_name: product.name, supplier,
      quantity, unit_cost, total_cost, purchase_date, payment_method,
      recorded_by: user.email,
    });
    await base44.entities.Product.update(product.id, { stock_quantity: product.stock_quantity + quantity });
    await base44.entities.Expense.create({
      category: "procurement", amount: total_cost,
      description: `Purchase: ${quantity} ${product.unit || ""} ${product.name} from ${supplier}`,
      date: purchase_date, payment_method, recorded_by: user.email,
    });
    await logAudit({
      entityType: "Purchase", entityId: purchase.id, action: "create",
      newValue: { product: product.name, supplier, quantity, total_cost },
      description: `Purchase: ${product.name} from ${supplier}`,
    });
    setSaving(false);
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchases</h1>
          <p className="text-sm text-slate-500 mt-1">Procurement & raw material receipts</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Record Purchase</Button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Recorded by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : purchases.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No purchases recorded yet.</TableCell></TableRow>
            ) : (
              purchases.map((p, i) => (
                <TableRow key={p.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="text-slate-500 text-xs">{p.purchase_date}</TableCell>
                  <TableCell className="font-medium">{p.product_name}</TableCell>
                  <TableCell>{p.supplier}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(p.unit_cost)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(p.total_cost)}</TableCell>
                  <TableCell className="text-xs text-slate-500">{p.recorded_by}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Purchase</DialogTitle></DialogHeader>
          <PurchaseForm products={products} onSubmit={handleSubmit} onCancel={() => setOpen(false)} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}