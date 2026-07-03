import React, { useState } from "react";
import { fmtMoney, todayStr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SaleForm({ products, onSubmit, onCancel, saving }) {
  const sellable = products.filter((p) => p.active !== false && ["finished_good", "raw_material"].includes(p.product_type));
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [customer, setCustomer] = useState("");
  const [saleDate, setSaleDate] = useState(todayStr());
  const [price, setPrice] = useState("");
  const product = sellable.find((p) => p.id === productId);
  const quantity = parseFloat(qty) || 0;
  const unitPrice = parseFloat(price) || 0;
  const total = unitPrice * quantity;
  const overStock = product && quantity > product.stock_quantity;

  const selectProduct = (id) => {
    setProductId(id);
    const p = sellable.find((x) => x.id === id);
    setPrice(p ? String(p.current_price) : "");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!product || quantity <= 0 || unitPrice <= 0 || overStock) return;
    onSubmit({ product, quantity, customer_name: customer, sale_date: saleDate, unit_price: unitPrice });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Product</Label>
        <Select value={productId} onValueChange={selectProduct}>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            {sellable.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} — {fmtMoney(p.current_price)}/{p.unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {product && (
          <p className="text-xs text-slate-500">In stock: {product.stock_quantity} {product.unit}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Quantity {product ? `(${product.unit})` : ""}</Label>
          <Input type="number" step="0.01" min="0" value={qty} onChange={(e) => setQty(e.target.value)} required />
          {overStock && <p className="text-xs text-rose-600">Exceeds available stock</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Unit price (₦)</Label>
          <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
          {product && unitPrice !== product.current_price && (
            <p className="text-xs text-amber-600">List price: {fmtMoney(product.current_price)}</p>
          )}
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Customer (optional)</Label>
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Sale date</Label>
          <Input type="date" value={saleDate} max={todayStr()} onChange={(e) => setSaleDate(e.target.value)} required />
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 flex justify-between text-sm">
        <span className="text-slate-500">Total @ {unitPrice ? fmtMoney(unitPrice) : "—"}</span>
        <span className="font-bold tabular-nums">{fmtMoney(total)}</span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !product || quantity <= 0 || unitPrice <= 0 || overStock}>
          {saving ? "Recording..." : "Record sale"}
        </Button>
      </div>
    </form>
  );
}