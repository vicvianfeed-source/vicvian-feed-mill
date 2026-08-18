import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import ServiceJobForm from "@/components/services/ServiceJobForm";
import ServiceJobCard from "@/components/services/ServiceJobCard";
import PelletPriceManager from "@/components/services/PelletPriceManager";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Services() {
  const { user, role } = useOutletContext();
  const recorderName = user.full_name || user.email;
  const [jobs, setJobs] = useState([]);
  const [products, setProducts] = useState([]);
  const [pelletPrices, setPelletPrices] = useState({ "2mm": 0, "4mm": 0, "6mm": 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isMobile = useIsMobile();
  const isAdmin = role === "admin";

  const load = async () => {
    const [j, p, settings] = await Promise.all([
      base44.entities.ServiceJob.list("-created_date", 100),
      base44.entities.Product.list("-created_date", 500),
      base44.entities.AppSetting.filter({ key: "service_pellet_prices" }),
    ]);
    setJobs(j);
    setProducts(p);
    if (settings.length > 0) {
      try {
        const parsed = JSON.parse(settings[0].value);
        setPelletPrices({ "2mm": parsed["2mm"] || 0, "4mm": parsed["4mm"] || 0, "6mm": parsed["6mm"] || 0 });
      } catch {}
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingJob(null); setOpen(true); };
  const openEdit = (job) => { setEditingJob(job); setOpen(true); };
  const closeForm = () => { setOpen(false); setEditingJob(null); };

  const handleSubmit = async ({ service, customer_name, grain_type, pellet_size, quantity_kg, rate_per_kg }) => {
    setSaving(true);
    const total = Math.round(rate_per_kg * quantity_kg * 100) / 100;
    if (editingJob) {
      const updated = await base44.entities.ServiceJob.update(editingJob.id, {
        service_id: service.id, service_name: service.name, customer_name, grain_type,
        pellet_size, quantity_kg, rate_per_kg, total,
      });
      await logAudit({
        entityType: "ServiceJob", entityId: updated.id, action: "update",
        newValue: { service: service.name, customer_name, quantity_kg, total },
        description: `Updated service job: ${service.name} for ${customer_name}`,
      });
    } else {
      const temp = {
        id: `temp-${Date.now()}`, service_id: service.id, service_name: service.name, customer_name, grain_type,
        pellet_size, quantity_kg, rate_per_kg, total,
        operator_email: recorderName, status: "completed", created_date: new Date().toISOString(),
      };
      setJobs((prev) => [temp, ...prev]);
      const job = await base44.entities.ServiceJob.create({
        service_id: service.id, service_name: service.name, customer_name, grain_type,
        pellet_size, quantity_kg, rate_per_kg, total,
        operator_email: recorderName, status: "completed",
      });
      await logAudit({
        entityType: "ServiceJob", entityId: job.id, action: "create",
        newValue: { service: service.name, customer_name, quantity_kg, total },
        description: `Service job: ${service.name} for ${customer_name}`,
      });
    }
    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async () => {
    const j = deleteTarget;
    if (!j) return;
    setDeleting(true);
    await base44.entities.ServiceJob.delete(j.id);
    await logAudit({
      entityType: "ServiceJob", entityId: j.id, action: "delete",
      oldValue: { service: j.service_name, quantity: j.quantity_kg, total: j.total },
      description: `Deleted service job: ${j.service_name} for ${j.customer_name}`,
    });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  };

  const colCount = isAdmin ? 9 : 8;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grinding & Pelleting Services</h1>
          <p className="text-sm text-slate-500 mt-1">Third-party service jobs</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Log Service Job</Button>
      </div>

      {isAdmin && (
        <PelletPriceManager onPricesChange={setPelletPrices} />
      )}

      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center py-8 text-slate-400 text-sm">Loading...</p>
          ) : jobs.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">No service jobs logged yet.</p>
          ) : (
            jobs.map((j) => (
              <ServiceJobCard key={j.id} job={j} isAdmin={isAdmin} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))
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
                <TableHead>Pellet</TableHead>
                <TableHead className="text-right">Qty (kg)</TableHead>
                <TableHead className="text-right">Rate/kg</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={colCount} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              ) : jobs.length === 0 ? (
                <TableRow><TableCell colSpan={colCount} className="text-center py-8 text-slate-400">No service jobs logged yet.</TableCell></TableRow>
              ) : (
                jobs.map((j, i) => (
                  <TableRow key={j.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                    <TableCell className="text-slate-500 text-xs">{new Date(j.created_date).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{j.service_name}</TableCell>
                    <TableCell>{j.customer_name}</TableCell>
                    <TableCell className="text-slate-500">{j.grain_type || "—"}</TableCell>
                    <TableCell className="text-slate-500">{j.pellet_size || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{j.quantity_kg}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(j.rate_per_kg)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(j.total)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(j)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(j)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && closeForm()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingJob ? "Edit Service Job" : "Log Service Job"}</DialogTitle></DialogHeader>
          <ServiceJobForm products={products} pelletPrices={pelletPrices} job={editingJob} onSubmit={handleSubmit} onCancel={closeForm} saving={saving} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this service job?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget && `${deleteTarget.quantity_kg} kg ${deleteTarget.service_name} (${fmtMoney(deleteTarget.total)}) will be permanently deleted.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" disabled={deleting} onClick={handleDelete}>{deleting ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}