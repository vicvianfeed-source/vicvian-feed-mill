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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CAT_CLS = {
  procurement: "bg-indigo-100 text-indigo-700",
  operations: "bg-teal-100 text-teal-800",
  maintenance: "bg-amber-100 text-amber-800",
  other: "bg-slate-100 text-slate-600",
};

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isAdmin = role === "admin";
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
    await logAudit({
      entityType: "Expense", entityId: exp.id, action: "create",
      newValue: { category: data.category, amount: data.amount },
      description: `Expense: ${data.category} — ${fmtMoney(data.amount)}`,
    });
    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async () => {
    const e = deleteTarget;
    if (!e) return;
    setDeleting(true);
    await base44.entities.Expense.delete(e.id);
    await logAudit({
      entityType: "Expense", entityId: e.id, action: "delete",
      oldValue: { category: e.category, amount: e.amount },
      description: `Deleted expense: ${e.category} — ${fmtMoney(e.amount)}`,
    });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  };

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.category === filter);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">Business expense tracking</p>
        </div>
        <Button onClick={openForm}><Plus className="w-4 h-4 mr-1" /> Record Expense</Button>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="procurement">Procurement</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-slate-500">Total: <span className="font-semibold text-slate-900 tabular-nums">{fmtMoney(total)}</span></p>
      </div>
      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center py-8 text-slate-400 text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">No expenses recorded.</p>
          ) : (
            filtered.map((e) => (
              <ExpenseCard key={e.id} expense={e} catCls={CAT_CLS[e.category] || CAT_CLS.other} isAdmin={isAdmin} onDelete={() => setDeleteTarget(e)} recordedBy={resolveName(e.recorded_by)} />
            ))
          )}
        </div>
      ) : (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Recorded by</TableHead>
              {isAdmin && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-slate-400">No expenses recorded.</TableCell></TableRow>
            ) : (
              filtered.map((e, i) => (
                <TableRow key={e.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="text-slate-500 text-xs">{e.date}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CAT_CLS[e.category] || CAT_CLS.other}`}>
                      {e.category}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{e.description || "—"}</TableCell>
                  <TableCell className="text-xs text-slate-500 capitalize">{(e.payment_method || "").replace("_", " ")}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(e.amount)}</TableCell>
                  <TableCell className="text-xs text-slate-500">{resolveName(e.recorded_by)}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => setDeleteTarget(e)}>
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
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <ExpenseForm onSubmit={handleSubmit} onCancel={closeForm} saving={saving} />
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${deleteTarget.category} expense of ${fmtMoney(deleteTarget.amount)} (${deleteTarget.date}) will be permanently deleted.`}
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