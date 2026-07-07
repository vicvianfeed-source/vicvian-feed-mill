import React, { useState } from "react";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NativeSelect from "@/components/common/NativeSelect";

export default function ServiceJobForm({ products, onSubmit, onCancel, saving }) {
  const services = products.filter((p) => p.active !== false && p.product_type === "service");
  const [serviceId, setServiceId] = useState("");
  const [customer, setCustomer] = useState("");
  const [grain, setGrain] = useState("");
  const [qtyKg, setQtyKg] = useState("");
  const service = services.find((p) => p.id === serviceId);
  const quantity = parseFloat(qtyKg) || 0;
  const total = service ? service.current_price * quantity : 0;

  const submit = (e) => {
    e.preventDefault();
    if (!service || !customer || quantity <= 0) return;
    onSubmit({ service, customer_name: customer, grain_type: grain, quantity_kg: quantity });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Service</Label>
        <NativeSelect value={serviceId} onChange={setServiceId} placeholder="Select service"
          options={services.map((p) => ({ value: p.id, label: `${p.name} — ${fmtMoney(p.current_price)}/kg` }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Customer name</Label>
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Grain type</Label>
          <Input value={grain} onChange={(e) => setGrain(e.target.value)} placeholder="Maize, sorghum..." />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Quantity (kg)</Label>
        <Input type="number" step="0.01" min="0" value={qtyKg} onChange={(e) => setQtyKg(e.target.value)} required />
      </div>
      <div className="bg-slate-50 rounded-lg p-3 flex justify-between text-sm">
        <span className="text-slate-500">Service charge</span>
        <span className="font-bold tabular-nums">{fmtMoney(total)}</span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !service || !customer || quantity <= 0}>
          {saving ? "Saving..." : "Log service job"}
        </Button>
      </div>
    </form>
  );
}