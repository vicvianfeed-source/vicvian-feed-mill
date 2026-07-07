import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtMoney, todayStr } from "@/lib/format";

const ORDER_TYPES = [
  { value: "feed_mill", label: "Feed Mill" },
  { value: "fish_farm", label: "Fish Farm" },
  { value: "rental_tool", label: "Rental Tool" },
  { value: "service", label: "Service" },
  { value: "general", label: "General" },
];

export default function OrderForm({ onSubmit, onCancel, saving }) {
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [orderType, setOrderType] = useState("general");
  const [itemsDescription, setItemsDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("");
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = customerName.trim() && !saving;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      customer_name: customerName.trim(),
      customer_contact: customerContact.trim(),
      order_type: orderType,
      items_description: itemsDescription.trim(),
      quantity: Number(quantity) || 0,
      unit: unit.trim(),
      amount: Number(amount) || 0,
      due_date: dueDate || undefined,
      assigned_to: assignedTo.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label>Customer Name *</Label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Alhaji Musa" required />
        </div>
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label>Customer Contact</Label>
          <Input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="Phone / email" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Order Type</Label>
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ORDER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={todayStr()} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Items / Description</Label>
        <Textarea value={itemsDescription} onChange={(e) => setItemsDescription(e.target.value)} placeholder="e.g. 10 bags 15kg fish feed + grinding 2 bags maize" rows={3} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Quantity</Label>
          <Input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="bag, kg…" />
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₦)</Label>
          <Input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Assigned To</Label>
        <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Staff member handling this order" />
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes…" rows={2} />
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-sm font-semibold text-slate-900">Order Value: {fmtMoney(amount)}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={!canSubmit}>{saving ? "Saving…" : "Create Order"}</Button>
        </div>
      </div>
    </form>
  );
}