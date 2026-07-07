import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { fmtMoney, fmtNum } from "@/lib/format";
import AccessDenied from "@/components/common/AccessDenied";
import ProductForm from "@/components/products/ProductForm";
import DomainBadge from "@/components/common/DomainBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Products() {
  const { user, role } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
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
      await logAudit({
        entityType: "Product", entityId: editing.id, action: "update",
        oldValue: { name: editing.name, price: editing.current_price, stock: editing.stock_quantity },
        newValue: { name: data.name, price: data.current_price, stock: data.stock_quantity },
        description: `Product updated: ${data.name}`,
      });
    } else {
      const p = await base44.entities.Product.create(data);
      await logAudit({
        entityType: "Product", entityId: p.id, action: "create",
        newValue: { name: data.name }, description: `Product created: ${data.name}`,
      });
    }
    setSaving(false);
    setOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await base44.entities.Product.delete(p.id);
    await logAudit({
      entityType: "Product", entityId: p.id, action: "delete",
      oldValue: { name: p.name }, description: `Product deleted: ${p.name}`,
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">Products, services, and rental tools</p>
        </div>
        {canAddProduct && (
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Product
          </Button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              {isAdmin && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No products yet. Create your first product.</TableCell></TableRow>
            ) : (
              products.map((p, i) => (
                <TableRow key={p.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="font-medium">
                    {p.name}
                    {p.sku && <span className="block text-xs text-slate-400">{p.sku}</span>}
                  </TableCell>
                  <TableCell><DomainBadge domain={p.domain} /></TableCell>
                  <TableCell className="text-slate-500">{p.unit}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(p.current_price)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.product_type === "service" ? "—" : `${fmtNum(p.stock_quantity)} ${p.unit}`}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-rose-500 hover:text-rose-600" onClick={() => handleDelete(p)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          <ProductForm product={editing} onSave={handleSave} onCancel={() => { setOpen(false); setEditing(null); }} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}