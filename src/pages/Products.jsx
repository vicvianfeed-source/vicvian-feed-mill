import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { fmtMoney, fmtNum } from "@/lib/format";
import AccessDenied from "@/components/common/AccessDenied";
import ProductForm from "@/components/products/ProductForm";
import DomainBadge from "@/components/common/DomainBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Tag, Package } from "lucide-react";

const DOMAIN_TABS = ["all", "feed_mill", "fish_farm", "rental_tool", "service"];
const DOMAIN_LABELS = { all: "All", feed_mill: "Feed Mill", fish_farm: "Fish Farm", rental_tool: "Rentals", service: "Services" };

export default function Products() {
  const { user, role } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = location.pathname.endsWith("/new");
  const open = isNew || !!editing;
  const closeForm = () => { if (isNew) navigate("/products", { replace: true }); setEditing(null); };
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setProducts(await base44.entities.Product.list("-created_date", 500));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!canAccess(role, "products")) return <AccessDenied />;
  const isAdmin = role === "admin";
  const canAddProduct = isAdmin || (role === "manager" && user.email === "olajumade7@gmail.com");

  const handleSave = async (data) => {
    setSaving(true);
    if (editing) {
      await base44.entities.Product.update(editing.id, data);
      await logAudit({ entityType: "Product", entityId: editing.id, action: "update", oldValue: { name: editing.name, price: editing.current_price, stock: editing.stock_quantity }, newValue: { name: data.name, price: data.current_price, stock: data.stock_quantity }, description: `Product updated: ${data.name}` });
    } else {
      const p = await base44.entities.Product.create(data);
      await logAudit({ entityType: "Product", entityId: p.id, action: "create", newValue: { name: data.name }, description: `Product created: ${data.name}` });
    }
    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await base44.entities.Product.delete(p.id);
    await logAudit({ entityType: "Product", entityId: p.id, action: "delete", oldValue: { name: p.name }, description: `Product deleted: ${p.name}` });
    load();
  };

  const filtered = products
    .filter((p) => tab === "all" || p.domain === tab)
    .filter((p) => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));

  const totalValue = filtered.reduce((s, p) => s + (p.current_price || 0) * (p.stock_quantity || 0), 0);
  const activeCount = filtered.filter((p) => p.active !== false).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Product Catalog</h1>
        {canAddProduct && (
          <Button onClick={() => navigate("/products/new")} className="rounded-full h-9 px-4">
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm"
        />
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
          <p className="text-xs text-slate-500 mb-1">Active Products</p>
          <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Stock Value</p>
          <p className="text-2xl font-bold text-slate-900">{fmtMoney(totalValue)}</p>
        </div>
      </div>

      {/* Product list card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Tag className="w-10 h-10 mb-3 text-slate-300" />
            <p className="font-medium text-slate-600 text-sm">No products found</p>
            <p className="text-xs mt-1">{search ? "Try a different search term." : "Get started by adding your first product."}</p>
            {canAddProduct && !search && (
              <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate("/products/new")}>
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{p.name}</p>
                  {p.sku && <p className="text-xs text-slate-400">{p.sku}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <DomainBadge domain={p.domain} />
                    {p.unit && <span className="text-xs text-slate-400">{p.unit}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-slate-900 tabular-nums text-sm">{fmtMoney(p.current_price)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {p.product_type === "service" ? "—" : `${fmtNum(p.stock_quantity)} ${p.unit || ""} stock`}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && closeForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          <ProductForm product={editing} onSave={handleSave} onCancel={closeForm} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}