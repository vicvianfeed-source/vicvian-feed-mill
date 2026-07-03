import React, { useState } from "react";
import { fmtMoney, todayStr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RentalForm({ products, onSubmit, onCancel, saving }) {
  const tools = products.filter((p) => p.active !== false && (p.product_type === "rental_tool" || p.domain === "rental_tool"));
  const [toolId, setToolId] = useState("");
  const [customer, setCustomer] = useState("");
  const [contact, setContact] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [days, setDays] = useState("");
  const tool = tools.find((p) => p.id === toolId);
  const nDays = parseInt(days) || 0;
  const total = tool ? tool.current_price * nDays : 0;

  const submit = (e) => {
    e.preventDefault();
    if (!tool || !customer || nDays <= 0) return;
    onSubmit({ tool, customer_name: customer, customer_contact: contact, start_date: startDate, rental_days: nDays });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Tool</Label>
        <Select value={toolId} onValueChange={setToolId}>
          <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
          <SelectContent>
            {tools.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name} — {fmtMoney(p.current_price)}/day ({p.stock_quantity} available)</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Customer name</Label>
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Contact</Label>
          <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone" />
        </div>
        <div className="space-y-1.5">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Number of days</Label>
          <Input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} required />
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 flex justify-between text-sm">
        <span className="text-slate-500">{nDays} day(s) × {tool ? fmtMoney(tool.current_price) : "—"}</span>
        <span className="font-bold tabular-nums">{fmtMoney(total)}</span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !tool || !customer || nDays <= 0}>
          {saving ? "Saving..." : "Create rental"}
        </Button>
      </div>
    </form>
  );
}