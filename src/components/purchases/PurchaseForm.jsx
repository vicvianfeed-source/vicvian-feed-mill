import React, { useState } from "react";
import { fmtMoney, todayStr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MoneyInput from "@/components/common/MoneyInput";

export default function PurchaseForm({ products, onSubmit, onCancel, saving }) {
  const purchasable = products.filter((p) => p.active !== false && ["raw_material", "finished_good"].includes(p.product_type));
  const [productId, setProductId] = useState("");
  const [supplier, setSupplier] = useState("");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [date, setDate] = useState(todayStr());
  const product = purchasable.find((p) => p.id === productId);
  const total = (parseFloat(qty) || 0) * (parseFloat(unitCost) || 0);

  const submit = (e) => {
    e.preventDefault();
    if (!product || !supplier || total <= 0) return;
    onSubmit({
      product, supplier, quantity: parseFloat(qty), unit_cost: parseFloat(unitCost),
      total_cost: Math.round(total * 100) / 100, purchase_date: date, payment_method: payMethod,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Item</Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
          <SelectContent>
            {purchasable.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Supplier</Label>
          <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Quantity {product ? `(${product.unit})` : ""}</Label>
          <Input type="number" step="0.01" min="0" value={qty} onChange={(e) => setQty(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Unit cost (₦)</Label>
          <MoneyInput value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Payment method</Label>
          <Select value={payMethod} onValueChange={setPayMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 flex justify-between text-sm">
        <span className="text-slate-500">Total cost</span>
        <span className="font-bold tabular-nums">{fmtMoney(total)}</span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !product || !supplier || total <= 0}>
          {saving ? "Saving..." : "Record purchase"}
        </Button>
      </div>
    </form>
  );
}