import React, { useState } from "react";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

export default function BatchForm({ products, onSubmit, onCancel, saving }) {
  const outputs = products.filter((p) => p.active !== false && p.product_type === "finished_good");
  const raws = products.filter((p) => p.active !== false && p.product_type === "raw_material");
  const [outputId, setOutputId] = useState("");
  const [qtyProduced, setQtyProduced] = useState("");
  const [materials, setMaterials] = useState([{ product_id: "", quantity: "" }]);
  const output = outputs.find((p) => p.id === outputId);

  const setMat = (i, k, v) => setMaterials((ms) => ms.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));
  const validMats = materials
    .map((m) => ({ ...m, product: raws.find((r) => r.id === m.product_id), quantity: parseFloat(m.quantity) || 0 }))
    .filter((m) => m.product && m.quantity > 0);
  const totalCost = validMats.reduce((s, m) => s + m.quantity * (m.product.current_price || 0), 0);
  const stockIssue = validMats.some((m) => m.quantity > m.product.stock_quantity);

  const submit = (e) => {
    e.preventDefault();
    const qty = parseFloat(qtyProduced) || 0;
    if (!output || qty <= 0 || validMats.length === 0 || stockIssue) return;
    onSubmit({
      output,
      quantity_produced: qty,
      materials: validMats.map((m) => ({
        product_id: m.product.id, product_name: m.product.name,
        quantity: m.quantity, unit_cost: m.product.current_price || 0,
      })),
      total_material_cost: Math.round(totalCost * 100) / 100,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Output product</Label>
          <Select value={outputId} onValueChange={setOutputId}>
            <SelectTrigger><SelectValue placeholder="Finished feed" /></SelectTrigger>
            <SelectContent>
              {outputs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Quantity produced {output ? `(${output.unit})` : ""}</Label>
          <Input type="number" step="0.01" min="0" value={qtyProduced} onChange={(e) => setQtyProduced(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Raw materials consumed</Label>
        {materials.map((m, i) => {
          const prod = raws.find((r) => r.id === m.product_id);
          const over = prod && parseFloat(m.quantity) > prod.stock_quantity;
          return (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <Select value={m.product_id} onValueChange={(v) => setMat(i, "product_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Raw material" /></SelectTrigger>
                  <SelectContent>
                    {raws.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name} (stock: {r.stock_quantity} {r.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {over && <p className="text-xs text-rose-600 mt-1">Exceeds available stock</p>}
              </div>
              <Input className="w-28" type="number" step="0.01" min="0" placeholder="Qty"
                value={m.quantity} onChange={(e) => setMat(i, "quantity", e.target.value)} />
              <Button type="button" variant="ghost" size="icon" disabled={materials.length === 1}
                onClick={() => setMaterials((ms) => ms.filter((_, idx) => idx !== i))}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm"
          onClick={() => setMaterials((ms) => [...ms, { product_id: "", quantity: "" }])}>
          <Plus className="w-4 h-4 mr-1" /> Add material
        </Button>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 flex justify-between text-sm">
        <span className="text-slate-500">Estimated material cost</span>
        <span className="font-bold tabular-nums">{fmtMoney(totalCost)}</span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !output || validMats.length === 0 || stockIssue}>
          {saving ? "Saving..." : "Save batch"}
        </Button>
      </div>
    </form>
  );
}