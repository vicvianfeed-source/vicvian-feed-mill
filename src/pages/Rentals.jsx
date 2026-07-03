import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney, addDays, todayStr } from "@/lib/format";
import RentalForm from "@/components/rentals/RentalForm";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Undo2 } from "lucide-react";

export default function Rentals() {
  const { user } = useOutletContext();
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [r, p] = await Promise.all([
      base44.entities.Rental.list("-created_date", 100),
      base44.entities.Product.list("-created_date", 500),
    ]);
    setRentals(r);
    setProducts(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async ({ tool, customer_name, customer_contact, start_date, rental_days }) => {
    setSaving(true);
    const total = Math.round(tool.current_price * rental_days * 100) / 100;
    const rental = await base44.entities.Rental.create({
      tool_id: tool.id, tool_name: tool.name, customer_name, customer_contact,
      start_date, rental_days, daily_rate: tool.current_price, total_charge: total,
      status: "active", operator_email: user.email,
    });
    await base44.entities.Product.update(tool.id, { stock_quantity: tool.stock_quantity - 1 });
    await logAudit({
      entityType: "Rental", entityId: rental.id, action: "create",
      newValue: { tool: tool.name, customer_name, rental_days, total },
      description: `Rental: ${tool.name} to ${customer_name}`,
    });
    setSaving(false);
    setOpen(false);
    load();
  };

  const markReturned = async (rental) => {
    await base44.entities.Rental.update(rental.id, { status: "returned", return_date: todayStr() });
    const tool = products.find((p) => p.id === rental.tool_id);
    if (tool) await base44.entities.Product.update(tool.id, { stock_quantity: tool.stock_quantity + 1 });
    await logAudit({
      entityType: "Rental", entityId: rental.id, action: "return",
      oldValue: { status: "active" }, newValue: { status: "returned", return_date: todayStr() },
      description: `Returned: ${rental.tool_name} from ${rental.customer_name}`,
    });
    load();
  };

  const isOverdue = (r) => r.status === "active" && addDays(r.start_date, r.rental_days) < todayStr();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tool Rentals</h1>
          <p className="text-sm text-slate-500 mt-1">Farm equipment rental tracking</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Rental</Button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Due back</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : rentals.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">No rentals yet.</TableCell></TableRow>
            ) : (
              rentals.map((r, i) => (
                <TableRow key={r.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="font-medium">{r.tool_name}</TableCell>
                  <TableCell>
                    {r.customer_name}
                    {r.customer_contact && <span className="block text-xs text-slate-400">{r.customer_contact}</span>}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">{r.start_date}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{addDays(r.start_date, r.rental_days)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.rental_days}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(r.total_charge)}</TableCell>
                  <TableCell>
                    <StatusBadge status={isOverdue(r) ? "overdue" : r.status} />
                  </TableCell>
                  <TableCell>
                    {r.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => markReturned(r)}>
                        <Undo2 className="w-3.5 h-3.5 mr-1" /> Return
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Rental</DialogTitle></DialogHeader>
          <RentalForm products={products} onSubmit={handleSubmit} onCancel={() => setOpen(false)} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}