import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney, todayStr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MoneyInput from "@/components/common/MoneyInput";

export default function PriceForm({ product, user, onSaved, onCancel }) {
  const [method, setMethod] = useState("manual");
  const [price, setPrice] = useState(product.current_price || "");
  const [cost, setCost] = useState("");
  const [markup, setMarkup] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const formulaPrice = cost && markup !== "" ? parseFloat(cost) * (1 + parseFloat(markup) / 100) : 0;
  const finalPrice = method === "manual" ? parseFloat(price) || 0 : Math.round(formulaPrice * 100) / 100;

  const submit = async (e) => {
    e.preventDefault();
    if (!finalPrice || finalPrice <= 0) return;
    setSaving(true);
    await base44.entities.PriceRecord.create({
      product_id: product.id,
      product_name: product.name,
      price: finalPrice,
      method,
      cost_basis: method === "formula" ? parseFloat(cost) : undefined,
      markup_percent: method === "formula" ? parseFloat(markup) : undefined,
      effective_date: effectiveDate,
      set_by: user.email,
    });
    await base44.entities.Product.update(product.id, { current_price: finalPrice });
    await logAudit({
      entityType: "Product", entityId: product.id, action: "price_change",
      oldValue: { price: product.current_price }, newValue: { price: finalPrice },
      description: `Price update: ${product.name}`,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Tabs value={method} onValueChange={setMethod}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual price</TabsTrigger>
          <TabsTrigger value="formula">Cost + markup</TabsTrigger>
        </TabsList>
      </Tabs>
      {method === "manual" ? (
        <div className="space-y-1.5">
          <Label>New price — ₦ per {product.unit || "unit"}</Label>
          <MoneyInput value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Cost basis (₦)</Label>
            <MoneyInput value={cost} onChange={(e) => setCost(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Markup %</Label>
            <Input type="number" step="0.1" value={markup} onChange={(e) => setMarkup(e.target.value)} required />
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Effective date</Label>
        <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
      </div>
      <div className="bg-slate-50 rounded-lg p-3 flex justify-between text-sm">
        <span className="text-slate-500">New price</span>
        <span className="font-bold tabular-nums">{fmtMoney(finalPrice)}</span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !finalPrice}>{saving ? "Saving..." : "Set price"}</Button>
      </div>
    </form>
  );
}