import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MoneyInput from "@/components/common/MoneyInput";

export default function ProductForm({ product, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    domain: product?.domain || "feed_mill",
    product_type: product?.product_type || "finished_good",
    unit: product?.unit || "kg",
    current_price: product?.current_price ?? 0,
    stock_quantity: product?.stock_quantity ?? 0,
    low_stock_threshold: product?.low_stock_threshold ?? 0,
    expiry_date: product?.expiry_date || "",
    active: product?.active !== false,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    onSave({
      ...form,
      current_price: parseFloat(form.current_price) || 0,
      stock_quantity: parseFloat(form.stock_quantity) || 0,
      low_stock_threshold: parseFloat(form.low_stock_threshold) || 0,
      expiry_date: form.expiry_date || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Product name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>SKU</Label>
          <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="kg, bag, unit, day" />
        </div>
        <div className="space-y-1.5">
          <Label>Domain</Label>
          <Select value={form.domain} onValueChange={(v) => set("domain", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="feed_mill">Feed Mill</SelectItem>
              <SelectItem value="fish_farm">Fish Farm</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="rental_tool">Rental Tool</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.product_type} onValueChange={(v) => set("product_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="raw_material">Raw Material</SelectItem>
              <SelectItem value="finished_good">Finished Good</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="rental_tool">Rental Tool</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{form.product_type === "rental_tool" ? "Daily rate (₦)" : "Current price (₦)"}</Label>
          <MoneyInput value={form.current_price} onChange={(e) => set("current_price", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Stock quantity</Label>
          <Input type="number" step="0.01" min="0" value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Low-stock threshold</Label>
          <Input type="number" step="0.01" min="0" value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Expiry date (optional)</Label>
          <Input type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save product"}</Button>
      </div>
    </form>
  );
}