import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

const CAT_CLS = {
  procurement: "bg-indigo-100 text-indigo-700",
  operations: "bg-teal-100 text-teal-800",
  maintenance: "bg-amber-100 text-amber-800",
  other: "bg-slate-100 text-slate-600",
};

export default function Expenses() {
  const { user } = useOutletContext();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setExpenses(await base44.entities.Expense.list("-date", 200));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (data) => {
    setSaving(true);
    const exp = await base44.entities.Expense.create({ ...data, recorded_by: user.email });
    await logAudit({
      entityType: "Expense", entityId: exp.id, action: "create",
      newValue: { category: data.category, amount: data.amount },
      description: `Expense: ${data.category} — ${fmtMoney(data.amount)}`,
    });
    setSaving(false);
    setOpen(false);
    load();
  };

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.category === filter);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">Business expense tracking</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Record Expense</Button>
      </div>
      <div className="flex items-center gap-3">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No expenses recorded.</TableCell></TableRow>
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
                  <TableCell className="text-xs text-slate-500">{e.recorded_by}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <ExpenseForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}