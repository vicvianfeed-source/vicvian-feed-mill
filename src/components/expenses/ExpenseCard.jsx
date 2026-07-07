import React from "react";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function ExpenseCard({ expense, catCls, isAdmin, onDelete, recordedBy }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 tabular-nums">{fmtMoney(expense.amount)}</p>
          <p className="text-xs text-slate-500">{expense.date}</p>
        </div>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${catCls}`}>
          {expense.category}
        </span>
      </div>
      {expense.description && <p className="text-sm text-slate-600">{expense.description}</p>}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400 truncate">
          <span className="capitalize">{(expense.payment_method || "").replace("_", " ")}</span> · {recordedBy || expense.recorded_by}
        </p>
        {isAdmin && (
          <Button variant="ghost" size="sm" className="h-9 text-rose-600" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}