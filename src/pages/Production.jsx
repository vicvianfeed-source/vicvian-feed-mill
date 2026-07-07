import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import BatchForm from "@/components/production/BatchForm";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle } from "lucide-react";

export default function Production() {
  const { user, role } = useOutletContext();
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [b, p] = await Promise.all([
      base44.entities.ProductionBatch.list("-created_date", 100),
      base44.entities.Product.list("-created_date", 500),
    ]);
    setBatches(b);
    setProducts(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async ({ output, quantity_produced, materials, total_material_cost }) => {
    setSaving(true);
    const batch = await base44.entities.ProductionBatch.create({
      output_product_id: output.id, output_product_name: output.name,
      quantity_produced, unit: output.unit, materials, total_material_cost,
      status: "pending", operator_email: user.email,
    });
    for (const m of materials) {
      const prod = products.find((p) => p.id === m.product_id);
      await base44.entities.Product.update(m.product_id, { stock_quantity: prod.stock_quantity - m.quantity });
    }
    await base44.entities.Product.update(output.id, { stock_quantity: output.stock_quantity + quantity_produced });
    await logAudit({
      entityType: "ProductionBatch", entityId: batch.id, action: "create",
      newValue: { output: output.name, quantity_produced, total_material_cost },
      description: `Production batch: ${quantity_produced} ${output.unit} ${output.name}`,
    });
    setSaving(false);
    setOpen(false);
    load();
  };

  const approve = async (batch) => {
    await base44.entities.ProductionBatch.update(batch.id, { status: "approved", approved_by: user.email });
    await logAudit({
      entityType: "ProductionBatch", entityId: batch.id, action: "approve",
      oldValue: { status: "pending" }, newValue: { status: "approved" },
      description: `Approved batch: ${batch.output_product_name}`,
    });
    load();
  };

  const canApprove = ["admin", "manager"].includes(role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Batches</h1>
          <p className="text-sm text-slate-500 mt-1">In-house feed production</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Batch</Button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Output Product</TableHead>
              <TableHead className="text-right">Qty Produced</TableHead>
              <TableHead>Materials</TableHead>
              <TableHead className="text-right">Material Cost</TableHead>
              <TableHead>Status</TableHead>
              {canApprove && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : batches.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No production batches yet.</TableCell></TableRow>
            ) : (
              batches.map((b, i) => (
                <TableRow key={b.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="text-slate-500 text-xs">{new Date(b.created_date).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{b.output_product_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{b.quantity_produced} {b.unit}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {(b.materials || []).map((m) => `${m.quantity} ${m.product_name}`).join(", ")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(b.total_material_cost)}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  {canApprove && (
                    <TableCell>
                      {b.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => approve(b)}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Production Batch</DialogTitle></DialogHeader>
          <BatchForm products={products} onSubmit={handleSubmit} onCancel={() => setOpen(false)} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}