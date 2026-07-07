import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import ServiceJobForm from "@/components/services/ServiceJobForm";
import ServiceJobCard from "@/components/services/ServiceJobCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default function Services() {
  const { user } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();

  const load = async () => {
    const [j, p] = await Promise.all([
      base44.entities.ServiceJob.list("-created_date", 100),
      base44.entities.Product.list("-created_date", 500),
    ]);
    setJobs(j);
    setProducts(p);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async ({ service, customer_name, grain_type, quantity_kg }) => {
    setSaving(true);
    const total = Math.round(service.current_price * quantity_kg * 100) / 100;
    const job = await base44.entities.ServiceJob.create({
      service_id: service.id, service_name: service.name, customer_name, grain_type,
      quantity_kg, rate_per_kg: service.current_price, total,
      operator_email: user.email, status: "completed",
    });
    await logAudit({
      entityType: "ServiceJob", entityId: job.id, action: "create",
      newValue: { service: service.name, customer_name, quantity_kg, total },
      description: `Service job: ${service.name} for ${customer_name}`,
    });
    setSaving(false);
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grinding & Pelleting Services</h1>
          <p className="text-sm text-slate-500 mt-1">Third-party service jobs</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Log Service Job</Button>
      </div>
      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center py-8 text-slate-400 text-sm">Loading...</p>
          ) : jobs.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">No service jobs logged yet.</p>
          ) : (
            jobs.map((j) => <ServiceJobCard key={j.id} job={j} />)
          )}
        </div>
      ) : (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Grain</TableHead>
              <TableHead className="text-right">Qty (kg)</TableHead>
              <TableHead className="text-right">Rate/kg</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : jobs.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No service jobs logged yet.</TableCell></TableRow>
            ) : (
              jobs.map((j, i) => (
                <TableRow key={j.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="text-slate-500 text-xs">{new Date(j.created_date).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{j.service_name}</TableCell>
                  <TableCell>{j.customer_name}</TableCell>
                  <TableCell className="text-slate-500">{j.grain_type || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{j.quantity_kg}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(j.rate_per_kg)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(j.total)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Service Job</DialogTitle></DialogHeader>
          <ServiceJobForm products={products} onSubmit={handleSubmit} onCancel={() => setOpen(false)} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}