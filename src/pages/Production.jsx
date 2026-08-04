import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import BatchForm from "@/components/production/BatchForm";
import BatchCard from "@/components/production/BatchCard";
import { useIsMobile } from "@/hooks/use-mobile";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CheckCircle, Search, Factory } from "lucide-react";

const STATUS_TABS = ["all", "pending", "approved"];

export default function Production() {
  const { user, role } = useOutletContext();
  const recorderName = user.full_name || user.email;
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const isMobile = useIsMobile();

  const load = async () => {
    const [b, p] = await Promise.all([
      base44.entities.ProductionBatch.list("-created_date", 100),
      base44.entities.Product.list("-created_date", 500),
    ]);
    setBatches(b);
    setProducts(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async ({ output, quantity_produced, materials, total_material_cost }) => {
    setSaving(true);
    const temp = { id: `temp-${Date.now()}`, output_product_id: output.id, output_product_name: output.name, quantity_produced, unit: output.unit, materials, total_material_cost, status: "pending", operator_email: recorderName, created_date: new Date().toISOString() };
    setBatches((prev) => [temp, ...prev]);
    const batch = await base44.entities.ProductionBatch.create({ output_product_id: output.id, output_product_name: output.name, quantity_produced, unit: output.unit, materials, total_material_cost, status: "pending", operator_email: recorderName });
    for (const m of materials) {
      const prod = products.find((p) => p.id === m.product_id);
      await base44.entities.Product.update(m.product_id, { stock_quantity: prod.stock_quantity - m.quantity });
    }
    await base44.entities.Product.update(output.id, { stock_quantity: output.stock_quantity + quantity_produced });
    await logAudit({ entityType: "ProductionBatch", entityId: batch.id, action: "create", newValue: { output: output.name, quantity_produced, total_material_cost }, description: `Production batch: ${quantity_produced} ${output.unit} ${output.name}` });
    setSaving(false);
    setOpen(false);
    load();
  };

  const approve = async (batch) => {
    await base44.entities.ProductionBatch.update(batch.id, { status: "approved", approved_by: recorderName });
    await logAudit({ entityType: "ProductionBatch", entityId: batch.id, action: "approve", oldValue: { status: "pending" }, newValue: { status: "approved" }, description: `Approved batch: ${batch.output_product_name}` });
    load();
  };

  const canApprove = ["admin", "manager"].includes(role);

  const filtered = batches
    .filter((b) => tab === "all" || b.status === tab)
    .filter((b) => !search || b.output_product_name?.toLowerCase().includes(search.toLowerCase()));

  const pendingCount = batches.filter((b) => b.status === "pending").length;
  const totalProduced = batches.filter((b) => b.status === "approved").reduce((s, b) => s + (b.quantity_produced || 0), 0);
  const totalCost = batches.reduce((s, b) => s + (b.total_material_cost || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Production Batches</h1>
        <Button onClick={() => setOpen(true)} className="rounded-full h-9 px-4">
          <Plus className="w-4 h-4 mr-1" /> New Batch
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search batches..."
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
          <p className="text-xs text-slate-500 mb-1">Pending Approval</p>
          <p className={`text-2xl font-bold ${pendingCount > 0 ? "text-amber-600" : "text-slate-900"}`}>{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Units Produced</p>
          <p className="text-2xl font-bold text-teal-600">{totalProduced}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Material Cost</p>
          <p className="text-2xl font-bold text-slate-900">{fmtMoney(totalCost)}</p>
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
              <Factory className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No production batches yet.</p>
            </div>
          ) : (
            filtered.map((b) => (
              <BatchCard key={b.id} batch={b} canApprove={canApprove} onApprove={() => approve(b)} />
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
              <Factory className="w-10 h-10 mb-3 text-slate-300" />
              <p className="font-medium text-slate-600 text-sm">No batches found</p>
              <p className="text-xs mt-1">{search ? "Try a different search." : "Log your first production batch above."}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className={`grid ${canApprove ? "grid-cols-[90px_1fr_120px_1fr_130px_100px_120px]" : "grid-cols-[90px_1fr_120px_1fr_130px_100px]"} px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50`}>
                <span>Date</span>
                <span>Output Product</span>
                <span className="text-right">Qty Produced</span>
                <span>Materials</span>
                <span className="text-right">Material Cost</span>
                <span>Status</span>
                {canApprove && <span />}
              </div>
              {filtered.map((b) => (
                <div key={b.id} className={`grid ${canApprove ? "grid-cols-[90px_1fr_120px_1fr_130px_100px_120px]" : "grid-cols-[90px_1fr_120px_1fr_130px_100px]"} px-4 py-3 hover:bg-slate-50 transition-colors items-center`}>
                  <p className="text-xs text-slate-500">{new Date(b.created_date).toLocaleDateString()}</p>
                  <p className="font-medium text-slate-900 text-sm">{b.output_product_name}</p>
                  <p className="text-right tabular-nums text-sm text-slate-700">{b.quantity_produced} {b.unit}</p>
                  <p className="text-xs text-slate-500 truncate pr-2">{(b.materials || []).map((m) => `${m.quantity} ${m.product_name}`).join(", ")}</p>
                  <p className="text-right tabular-nums font-semibold text-sm text-slate-900">{fmtMoney(b.total_material_cost)}</p>
                  <StatusBadge status={b.status} />
                  {canApprove && (
                    <div className="flex justify-end">
                      {b.status === "pending" && (
                        <button onClick={() => approve(b)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Approve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Production Batch</DialogTitle></DialogHeader>
          <BatchForm products={products} onSubmit={handleSubmit} onCancel={() => setOpen(false)} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}