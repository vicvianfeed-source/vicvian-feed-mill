import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import PurchaseForm from "@/components/purchases/PurchaseForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useUserNameMap } from "@/hooks/use-user-names";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Purchases() {
  const { user, role } = useOutletContext();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = role === "admin";
  const { resolveName } = useUserNameMap();
  const recorderName = user.full_name || user.email;

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

  const handleSubmit = async ({ product, supplier, quantity, unit, unit_cost, total_cost, purchase_date, payment_method }) => {
    setSaving(true);
    const purchase = await base44.entities.Purchase.create({
      product_id: product.id, product_name: product.name, supplier,
      quantity, unit, unit_cost, total_cost, purchase_date, payment_method,
      recorded_by: recorderName,
    });
    await base44.entities.Product.update(product.id, { stock_quantity: product.stock_quantity + quantity });
    await base44.entities.Expense.create({
      category: "procurement", amount: total_cost,
      description: `Purchase: ${quantity} ${unit || product.unit || ""} ${product.name} from ${supplier}`,
      date: purchase_date, payment_method, recorded_by: recorderName,
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

  const handleDelete = async () => {
    const p = deleteTarget;
    if (!p) return;
    setDeleting(true);
    await base44.entities.Purchase.delete(p.id);
    const product = products.find((x) => x.id === p.product_id);
    if (product) {
      await base44.entities.Product.update(product.id, { stock_quantity: product.stock_quantity - p.quantity });
    }
    const linkedExpenses = await base44.entities.Expense.filter({
      category: "procurement", amount: p.total_cost, date: p.purchase_date,
      description: `Purchase: ${p.quantity} ${p.unit || product?.unit || ""} ${p.product_name} from ${p.supplier}`,
    });
    if (linkedExpenses.length > 0) {
      await base44.entities.Expense.delete(linkedExpenses[0].id);
    }
    await logAudit({
      entityType: "Purchase", entityId: p.id, action: "delete",
      oldValue: { product: p.product_name, supplier: p.supplier, quantity: p.quantity, total_cost: p.total_cost },
      description: `Deleted purchase: ${p.quantity} × ${p.product_name} from ${p.supplier}`,
    });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
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
              {isAdmin && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : purchases.length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-slate-400">No purchases recorded yet.</TableCell></TableRow>
            ) : (
              purchases.map((p, i) => (
                <TableRow key={p.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="text-slate-500 text-xs">{p.purchase_date}</TableCell>
                  <TableCell className="font-medium">{p.product_name}</TableCell>
                  <TableCell>{p.supplier}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.quantity} {p.unit || ""}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(p.unit_cost)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(p.total_cost)}</TableCell>
                  <TableCell className="text-xs text-slate-500">{resolveName(p.recorded_by)}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
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
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this purchase?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${deleteTarget.quantity} × ${deleteTarget.product_name} from ${deleteTarget.supplier} (${fmtMoney(deleteTarget.total_cost)}) will be permanently deleted. Stock will be reduced and the linked procurement expense removed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}