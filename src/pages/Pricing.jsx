import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { canAccess } from "@/lib/permissions";
import { fmtMoney } from "@/lib/format";
import AccessDenied from "@/components/common/AccessDenied";
import PriceForm from "@/components/pricing/PriceForm";
import DomainBadge from "@/components/common/DomainBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tag, History, Search } from "lucide-react";

const DOMAIN_TABS = ["all", "feed_mill", "fish_farm", "rental_tool", "service"];
const DOMAIN_LABELS = { all: "All", feed_mill: "Feed Mill", fish_farm: "Fish Farm", rental_tool: "Rentals", service: "Services" };

export default function Pricing() {
  const { user, role } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const load = async () => {
    setProducts(await base44.entities.Product.list("-created_date", 500));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!canAccess(role, "pricing")) return <AccessDenied />;

  const openHistory = async (product) => {
    setHistoryFor(product);
    setHistory(await base44.entities.PriceRecord.filter({ product_id: product.id }, "-effective_date", 50));
  };

  const active = products
    .filter((p) => p.active !== false)
    .filter((p) => tab === "all" || p.domain === tab)
    .filter((p) => !search || p.name?.toLowerCase().includes(search.toLowerCase()));

  const avgPrice = active.length ? active.reduce((s, p) => s + (p.current_price || 0), 0) / active.length : 0;
  const priced = active.filter((p) => p.current_price > 0).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Daily Pricing</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
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
          <p className="text-xs text-slate-500 mb-1">Products Priced</p>
          <p className="text-2xl font-bold text-slate-900">{priced} / {active.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Avg. Unit Price</p>
          <p className="text-2xl font-bold text-slate-900">{fmtMoney(avgPrice)}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Tag className="w-10 h-10 mb-3 text-slate-300" />
            <p className="font-medium text-slate-600 text-sm">No products to price</p>
            <p className="text-xs mt-1">{search ? "Try a different search." : "Add products first in the catalog."}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-[1fr_120px_80px_120px_160px] px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50">
              <span>Product</span>
              <span>Domain</span>
              <span>Unit</span>
              <span className="text-right">Current Price</span>
              <span className="text-right">Actions</span>
            </div>
            {active.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_120px_80px_120px_160px] px-4 py-3 hover:bg-slate-50 transition-colors items-center">
                <p className="font-medium text-slate-900 text-sm">{p.name}</p>
                <DomainBadge domain={p.domain} />
                <p className="text-sm text-slate-500">{p.unit}</p>
                <p className="text-right tabular-nums font-bold text-slate-900">{fmtMoney(p.current_price)}</p>
                <div className="flex justify-end gap-1">
                  <button onClick={() => setPricing(p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <Tag className="w-3 h-3" /> Set Price
                  </button>
                  <button onClick={() => openHistory(p)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                    <History className="w-3 h-3" /> History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!pricing} onOpenChange={(v) => !v && setPricing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Price — {pricing?.name}</DialogTitle></DialogHeader>
          {pricing && <PriceForm product={pricing} user={user} onSaved={() => { setPricing(null); load(); }} onCancel={() => setPricing(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyFor} onOpenChange={(v) => !v && setHistoryFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Price History — {historyFor?.name}</DialogTitle></DialogHeader>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No price history recorded yet.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{h.effective_date}</p>
                    <p className="text-xs text-slate-400">{h.method === "formula" ? `Cost ${fmtMoney(h.cost_basis)} + ${h.markup_percent}%` : "Manual"} · {h.set_by}</p>
                  </div>
                  <span className="font-bold tabular-nums">{fmtMoney(h.price)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}