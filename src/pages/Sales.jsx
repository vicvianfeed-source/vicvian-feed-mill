import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import SaleForm from "@/components/sales/SaleForm";
import SaleCard from "@/components/sales/SaleCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserNameMap } from "@/hooks/use-user-names";
import DomainBadge from "@/components/common/DomainBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Printer } from "lucide-react";
import { printReceipt } from "@/components/sales/receiptPrint";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Sales() {
  const { user, role } = useOutletContext();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const open = location.pathname.endsWith("/new");
  const openForm = () => navigate("/sales/new");
  const closeForm = () => navigate("/sales", { replace: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = role === "admin";
  const isOperator = role === "operator";
  const isMobile = useIsMobile();
  const { resolveName } = useUserNameMap();
  const recorderName = user.full_name || user.email;

  const load = async () => {
    const [s, p] = await Promise.all([
      base44.entities.Sale.list("-created_date", 100),
      base44.entities.Product.list("-created_date", 500),
    ]);
    const dateOf = (x) => x.sale_date || new Date(x.created_date).toISOString().slice(0, 10);
    setSales([...s].sort((a, b) => dateOf(b).localeCompare(dateOf(a))));
    setProducts(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async ({ product, quantity, customer_name, sale_date, unit_price }) => {
    setSaving(true);
    const total = Math.round(unit_price * quantity * 100) / 100;
    const temp = {
      id: `temp-${Date.now()}`, product_id: product.id, product_name: product.name, domain: product.domain,
      quantity, unit_price, total, customer_name, sale_date,
      operator_email: recorderName, status: "completed", created_date: new Date().toISOString(),
    };
    setSales((prev) => [temp, ...prev]);
    const sale = await base44.entities.Sale.create({
      product_id: product.id, product_name: product.name, domain: product.domain,
      quantity, unit_price, total, customer_name, sale_date,
      operator_email: recorderName, status: "completed",
    });
    await base44.entities.Product.update(product.id, { stock_quantity: product.stock_quantity - quantity });
    await logAudit({
      entityType: "Sale", entityId: sale.id, action: "create",
      newValue: { product: product.name, quantity, total },
      description: `Sale: ${quantity} × ${product.name}`,
    });
    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async () => {
    const s = deleteTarget;
    if (!s) return;
    setDeleting(true);
    await base44.entities.Sale.delete(s.id);
    const product = products.find((p) => p.id === s.product_id);
    if (product) {
      await base44.entities.Product.update(product.id, { stock_quantity: product.stock_quantity + s.quantity });
    }
    await logAudit({
      entityType: "Sale", entityId: s.id, action: "delete",
      oldValue: { product: s.product_name, quantity: s.quantity, total: s.total },
      description: `Deleted sale: ${s.quantity} × ${s.product_name}`,
    });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
          <p className="text-sm text-slate-500 mt-1">Feed mill & fish farm product sales</p>
        </div>
        <Button onClick={openForm}><Plus className="w-4 h-4 mr-1" /> New Sale</Button>
      </div>
      {isOperator ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-400 text-sm">
          Use the "New Sale" button to record a sale. Sales history is only visible to admins and managers.
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center py-8 text-slate-400 text-sm">Loading...</p>
          ) : sales.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">No sales recorded yet.</p>
          ) : (
            sales.map((s) => (
              <SaleCard key={s.id} sale={s} isAdmin={isAdmin} onDelete={() => setDeleteTarget(s)} operatorName={resolveName(s.operator_email)} onPrint={() => printReceipt(s, { operatorName: resolveName(s.operator_email) })} />
            ))
          )}
        </div>
      ) : (
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
              <TableHead className="w-10"></TableHead>
              {isAdmin && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : sales.length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-8 text-slate-400">No sales recorded yet.</TableCell></TableRow>
            ) : (
              sales.map((s, i) => (
                <TableRow key={s.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="text-slate-500 text-xs">{s.sale_date || new Date(s.created_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{s.product_name}</TableCell>
                  <TableCell><DomainBadge domain={s.domain} /></TableCell>
                  <TableCell className="text-right tabular-nums">{s.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(s.unit_price)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(s.total)}</TableCell>
                  <TableCell className="text-xs text-slate-500">{resolveName(s.operator_email)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700" onClick={() => printReceipt(s, { operatorName: resolveName(s.operator_email) })}>
                      <Printer className="w-4 h-4" />
                    </Button>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => setDeleteTarget(s)}>
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
      )}
      <Dialog open={open} onOpenChange={(v) => !v && closeForm()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Sale</DialogTitle></DialogHeader>
          <SaleForm products={products} onSubmit={handleSubmit} onCancel={closeForm} saving={saving} canEditDate={role !== "operator"} />
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${deleteTarget.quantity} × ${deleteTarget.product_name} (${fmtMoney(deleteTarget.total)}) will be permanently deleted and the stock restored.`}
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