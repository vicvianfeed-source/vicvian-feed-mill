import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney, addDays, todayStr } from "@/lib/format";
import RentalForm from "@/components/rentals/RentalForm";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Undo2, Search, Tractor } from "lucide-react";

const STATUS_TABS = ["all", "active", "returned"];

export default function Rentals() {
  const { user } = useOutletContext();
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const load = async () => {
    const [r, p] = await Promise.all([
      base44.entities.Rental.list("-created_date", 100),
      base44.entities.Product.list("-created_date", 500),
    ]);
    setRentals(r);
    setProducts(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async ({ tool, customer_name, customer_contact, start_date, rental_days }) => {
    setSaving(true);
    const total = Math.round(tool.current_price * rental_days * 100) / 100;
    const rental = await base44.entities.Rental.create({ tool_id: tool.id, tool_name: tool.name, customer_name, customer_contact, start_date, rental_days, daily_rate: tool.current_price, total_charge: total, status: "active", operator_email: user.email });
    await base44.entities.Product.update(tool.id, { stock_quantity: tool.stock_quantity - 1 });
    await logAudit({ entityType: "Rental", entityId: rental.id, action: "create", newValue: { tool: tool.name, customer_name, rental_days, total }, description: `Rental: ${tool.name} to ${customer_name}` });
    setSaving(false);
    setOpen(false);
    load();
  };

  const markReturned = async (rental) => {
    await base44.entities.Rental.update(rental.id, { status: "returned", return_date: todayStr() });
    const tool = products.find((p) => p.id === rental.tool_id);
    if (tool) await base44.entities.Product.update(tool.id, { stock_quantity: tool.stock_quantity + 1 });
    await logAudit({ entityType: "Rental", entityId: rental.id, action: "return", oldValue: { status: "active" }, newValue: { status: "returned", return_date: todayStr() }, description: `Returned: ${rental.tool_name} from ${rental.customer_name}` });
    load();
  };

  const isOverdue = (r) => r.status === "active" && addDays(r.start_date, r.rental_days) < todayStr();

  const filtered = rentals
    .filter((r) => tab === "all" || r.status === tab)
    .filter((r) => !search || r.tool_name?.toLowerCase().includes(search.toLowerCase()) || r.customer_name?.toLowerCase().includes(search.toLowerCase()));

  const activeCount = rentals.filter((r) => r.status === "active").length;
  const overdueCount = rentals.filter((r) => isOverdue(r)).length;
  const totalRevenue = rentals.filter((r) => r.status !== "void").reduce((s, r) => s + (r.total_charge || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Tool Rentals</h1>
        <Button onClick={() => setOpen(true)} className="rounded-full h-9 px-4">
          <Plus className="w-4 h-4 mr-1" /> New Rental
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rentals..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm" />
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border capitalize ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {t === "all" ? "All" : t}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Active Rentals</p>
          <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Overdue</p>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-rose-600" : "text-slate-900"}`}>{overdueCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">{fmtMoney(totalRevenue)}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Tractor className="w-10 h-10 mb-3 text-slate-300" />
            <p className="font-medium text-slate-600 text-sm">No rentals found</p>
            <p className="text-xs mt-1">{search ? "Try a different search." : "Create your first rental above."}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-[1fr_120px_90px_90px_70px_100px_100px_100px] px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50">
              <span>Tool / Customer</span>
              <span>Contact</span>
              <span>Start</span>
              <span>Due back</span>
              <span className="text-right">Days</span>
              <span className="text-right">Daily Rate</span>
              <span className="text-right">Total</span>
              <span className="text-right">Status</span>
            </div>
            {filtered.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_120px_90px_90px_70px_100px_100px_100px] px-4 py-3 hover:bg-slate-50 transition-colors items-center">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{r.tool_name}</p>
                  <p className="text-xs text-slate-400">{r.customer_name}</p>
                </div>
                <p className="text-xs text-slate-500 truncate">{r.customer_contact || "—"}</p>
                <p className="text-xs text-slate-500">{r.start_date}</p>
                <p className="text-xs text-slate-500">{addDays(r.start_date, r.rental_days)}</p>
                <p className="text-right tabular-nums text-sm text-slate-600">{r.rental_days}</p>
                <p className="text-right tabular-nums text-sm text-slate-600">{fmtMoney(r.daily_rate)}</p>
                <p className="text-right tabular-nums font-semibold text-sm text-slate-900">{fmtMoney(r.total_charge)}</p>
                <div className="flex items-center justify-end gap-1">
                  <StatusBadge status={isOverdue(r) ? "overdue" : r.status} />
                  {r.status === "active" && (
                    <button onClick={() => markReturned(r)} className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Mark returned">
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Rental</DialogTitle></DialogHeader>
          <RentalForm products={products} onSubmit={handleSubmit} onCancel={() => setOpen(false)} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}