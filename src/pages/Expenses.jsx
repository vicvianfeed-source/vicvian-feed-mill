import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpenseCard from "@/components/expenses/ExpenseCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserNameMap } from "@/hooks/use-user-names";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Search, Receipt } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const CAT_CLS = {
  procurement: "bg-indigo-100 text-indigo-700",
  operations: "bg-teal-100 text-teal-800",
  maintenance: "bg-amber-100 text-amber-800",
  other: "bg-slate-100 text-slate-600",
};
const CATEGORIES = ["all", "procurement", "operations", "maintenance", "other"];

export default function Expenses() {
  const { user, role } = useOutletContext();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const open = location.pathname.endsWith("/new");
  const openForm = () => navigate("/expenses/new");
  const closeForm = () => navigate("/expenses", { replace: true });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = role === "admin";
  const isOperator = role === "operator";
  const isMobile = useIsMobile();
  const { resolveName } = useUserNameMap();
  const recorderName = user.full_name || user.email;

  const load = async () => {
    setExpenses(await base44.entities.Expense.list("-date", 200));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (data) => {
    setSaving(true);
    const temp = { id: `temp-${Date.now()}`, ...data, recorded_by: recorderName, created_date: new Date().toISOString() };
    setExpenses((prev) => [temp, ...prev]);
    const exp = await base44.entities.Expense.create({ ...data, recorded_by: recorderName });
    await logAudit({ entityType: "Expense", entityId: exp.id, action: "create", newValue: { category: data.category, amount: data.amount }, description: `Expense: ${data.category} — ${fmtMoney(data.amount)}` });
    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async () => {
    const e = deleteTarget;
    if (!e) return;
    setDeleting(true);
    await base44.entities.Expense.delete(e.id);
    await logAudit({ entityType: "Expense", entityId: e.id, action: "delete", oldValue: { category: e.category, amount: e.amount }, description: `Deleted expense: ${e.category} — ${fmtMoney(e.amount)}` });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  };

  const filtered = expenses
    .filter((e) => filter === "all" || e.category === filter)
    .filter((e) => !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Expenses</h1>
        <Button onClick={openForm} className="rounded-full h-9 px-4">
          <Plus className="w-4 h-4 mr-1" /> Record Expense
        </Button>
      </div>

      {isOperator ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-16 text-slate-400">
          <Receipt className="w-10 h-10 mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Use the "Record Expense" button to log an expense.</p>
          <p className="text-xs mt-1">Expense history is only visible to admins and managers.</p>
        </div>
      ) : (
        <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm" />
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border capitalize ${filter === c ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Records</p>
          <p className="text-2xl font-bold text-slate-900">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-rose-600">{fmtMoney(total)}</p>
        </div>
      </div>

      {/* List */}
      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center py-16 text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center py-16 text-slate-400">
              <Receipt className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No expenses recorded.</p>
            </div>
          ) : (
            filtered.map((e) => (
              <ExpenseCard key={e.id} expense={e} catCls={CAT_CLS[e.category] || CAT_CLS.other} isAdmin={isAdmin} onDelete={() => setDeleteTarget(e)} recordedBy={resolveName(e.recorded_by)} />
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
              <Receipt className="w-10 h-10 mb-3 text-slate-300" />
              <p className="font-medium text-slate-600 text-sm">No expenses found</p>
              <p className="text-xs mt-1">{search ? "Try a different search." : "Record your first expense above."}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-[90px_130px_1fr_110px_110px_120px_40px] px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50">
                <span>Date</span>
                <span>Category</span>
                <span>Description</span>
                <span>Payment</span>
                <span className="text-right">Amount</span>
                <span>Recorded by</span>
                {isAdmin && <span />}
              </div>
              {filtered.map((e) => (
                <div key={e.id} className="grid grid-cols-[90px_130px_1fr_110px_110px_120px_40px] px-4 py-3 hover:bg-slate-50 transition-colors items-center">
                  <p className="text-xs text-slate-500">{e.date}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize w-fit ${CAT_CLS[e.category] || CAT_CLS.other}`}>{e.category}</span>
                  <p className="text-sm text-slate-700 truncate pr-2">{e.description || "—"}</p>
                  <p className="text-xs text-slate-500 capitalize">{(e.payment_method || "").replace("_", " ")}</p>
                  <p className="text-right tabular-nums font-semibold text-sm text-slate-900">{fmtMoney(e.amount)}</p>
                  <p className="text-xs text-slate-500 truncate">{resolveName(e.recorded_by)}</p>
                  {isAdmin && (
                    <button onClick={() => setDeleteTarget(e)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        </>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && closeForm()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <ExpenseForm onSubmit={handleSubmit} onCancel={closeForm} saving={saving} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget && `${deleteTarget.category} expense of ${fmtMoney(deleteTarget.amount)} (${deleteTarget.date}) will be permanently deleted.`}</AlertDialogDescription>
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