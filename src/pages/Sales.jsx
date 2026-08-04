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
import { Plus, Trash2, Printer, Search, ShoppingCart } from "lucide-react";
import { printReceipt } from "@/components/sales/receiptPrint";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const DOMAIN_TABS = ["all", "feed_mill", "fish_farm"];
const DOMAIN_LABELS = { all: "All", feed_mill: "Feed Mill", fish_farm: "Fish Farm" };

export default function Sales() {
  const { user, role } = useOutletContext();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
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
    const temp = { id: `temp-${Date.now()}`, product_id: product.id, product_name: product.name, domain: product.domain, quantity, unit_price, total, customer_name, sale_date, operator_email: recorderName, status: "completed", created_date: new Date().toISOString() };
    setSales((prev) => [temp, ...prev]);
    const sale = await base44.entities.Sale.create({ product_id: product.id, product_name: product.name, domain: product.domain, quantity, unit_price, total, customer_name, sale_date, operator_email: recorderName, status: "completed" });
    await base44.entities.Product.update(product.id, { stock_quantity: product.stock_quantity - quantity });
    await logAudit({ entityType: "Sale", entityId: sale.id, action: "create", newValue: { product: product.name, quantity, total }, description: `Sale: ${quantity} × ${product.name}` });
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
    if (product) await base44.entities.Product.update(product.id, { stock_quantity: product.stock_quantity + s.quantity });
    await logAudit({ entityType: "Sale", entityId: s.id, action: "delete", oldValue: { product: s.product_name, quantity: s.quantity, total: s.total }, description: `Deleted sale: ${s.quantity} × ${s.product_name}` });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  };

  const filtered = sales
    .filter((s) => tab === "all" || s.domain === tab)
    .filter((s) => !search || s.product_name?.toLowerCase().includes(search.toLowerCase()) || s.customer_name?.toLowerCase().includes(search.toLowerCase()));

  const totalRevenue = filtered.filter((s) => s.status !== "void").reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Sales</h1>
        <Button onClick={openForm} className="rounded-full h-9 px-4">
          <Plus className="w-4 h-4 mr-1" /> New Sale
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sales..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm" />
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 flex-wrap">
        {DOMAIN_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {DOMAIN_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-slate-900">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">{fmtMoney(totalRevenue)}</p>
        </div>
      </div>

      {/* List */}
      {isOperator ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-16 text-slate-400">
          <ShoppingCart className="w-10 h-10 mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Use the "New Sale" button to record a sale.</p>
          <p className="text-xs mt-1">Sales history is only visible to admins and managers.</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center py-16 text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center py-16 text-slate-400">
              <ShoppingCart className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No sales recorded yet.</p>
            </div>
          ) : (
            filtered.map((s) => (
              <SaleCard key={s.id} sale={s} isAdmin={isAdmin} onDelete={() => setDeleteTarget(s)} operatorName={resolveName(s.operator_email)} onPrint={() => printReceipt(s, { operatorName: resolveName(s.operator_email) })} />
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ShoppingCart className="w-10 h-10 mb-3 text-slate-300" />
              <p className="font-medium text-slate-600 text-sm">No sales found</p>
              <p className="text-xs mt-1">{search ? "Try a different search." : "Record your first sale above."}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_120px_100px_80px_100px_80px] px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50">
                <span>Product / Customer</span>
                <span>Domain</span>
                <span className="text-right">Unit Price</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Total</span>
                <span className="text-right">Actions</span>
              </div>
              {filtered.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_120px_100px_80px_100px_80px] px-4 py-3 hover:bg-slate-50 transition-colors items-center">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{s.product_name}</p>
                    <p className="text-xs text-slate-400">{s.customer_name || "—"} · {s.sale_date || new Date(s.created_date).toLocaleDateString()}</p>
                  </div>
                  <div><DomainBadge domain={s.domain} /></div>
                  <p className="text-right tabular-nums text-sm text-slate-600">{fmtMoney(s.unit_price)}</p>
                  <p className="text-right tabular-nums text-sm text-slate-600">{s.quantity}</p>
                  <p className="text-right tabular-nums font-semibold text-sm text-slate-900">{fmtMoney(s.total)}</p>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => printReceipt(s, { operatorName: resolveName(s.operator_email) })} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <AlertDialogDescription>{deleteTarget && `${deleteTarget.quantity} × ${deleteTarget.product_name} (${fmtMoney(deleteTarget.total)}) will be permanently deleted and the stock restored.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" disabled={deleting} onClick={handleDelete}>{deleting ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}