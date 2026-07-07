import React, { useState } from "react";
import { todayStr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MoneyInput from "@/components/common/MoneyInput";
import NativeSelect from "@/components/common/NativeSelect";

export default function ExpenseForm({ onSubmit, onCancel, saving }) {
  const [category, setCategory] = useState("operations");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr());
  const [payMethod, setPayMethod] = useState("cash");

  const submit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return;
    onSubmit({ category, amount: amt, description, date, payment_method: payMethod });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <NativeSelect value={category} onChange={setCategory} placeholder="Select category"
            options={[
              { value: "procurement", label: "Procurement" },
              { value: "operations", label: "Operations" },
              { value: "maintenance", label: "Maintenance" },
              { value: "other", label: "Other" },
            ]} />
        </div>
        <div className="space-y-1.5">
          <Label>Amount (₦)</Label>
          <MoneyInput value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Payment method</Label>
          <NativeSelect value={payMethod} onChange={setPayMethod} placeholder="Select method"
            options={[
              { value: "cash", label: "Cash" },
              { value: "bank_transfer", label: "Bank Transfer" },
              { value: "mobile_money", label: "Mobile Money" },
              { value: "credit", label: "Credit" },
            ]} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !(parseFloat(amount) > 0)}>
          {saving ? "Saving..." : "Record expense"}
        </Button>
      </div>
    </form>
  );
}