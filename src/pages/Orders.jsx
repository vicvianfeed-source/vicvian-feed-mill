import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import { useUserNameMap } from "@/hooks/use-user-names";
import OrderForm from "@/components/orders/OrderForm";
import OrderCard from "@/components/orders/OrderCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import AccessDenied from "@/components/common/AccessDenied";
import StatusBadge from "@/components/common/StatusBadge";
import { normalizeRole } from "@/lib/permissions";

const FILTERS = ["all", "pending", "in_progress", "ready", "completed", "cancelled"];

const STATUS_FLOW = {
  pending: "in_progress",
  in_progress: "ready",
  ready: "completed",
  completed: null,
  cancelled: null,
};

const NEXT_LABEL = {
  pending: "Start",
  in_progress: "Mark Ready",
  ready: "Complete",
  completed: null,
  cancelled: null,
};

export default function Orders() {
  const { user } = useOutletContext();
  const role = normalizeRole(user?.role);
  const isAdmin = role === "admin";
  const recorderName = user.full_name || user.email;
  const { resolveName } = useUserNameMap();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const isMobile = useIsMobile();

  const load = async () => {
    try {
      const data = await base44.entities.CustomerOrder.list("-created_date", 200);
      setOrders(data);
    } catch (e) {
      console.error("Failed to load orders", e);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Operator role shouldn't reach here (nav guards), but double-check
  if (role !== "admin" && role !== "manager") {
    return <AccessDenied />;
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      const order = await base44.entities.CustomerOrder.create({
        ...data,
        status: "pending",
        recorded_by: recorderName,
      });
      setOrders((prev) => [order, ...prev]);
      await logAudit({
        entityType: "CustomerOrder", entityId: order.id, action: "create",
        newValue: { customer_name: data.customer_name, order_type: data.order_type, amount: data.amount },
        description: `Order created for ${data.customer_name}`,
      });
      setOpen(false);
    } catch (e) {
      console.error("Failed to create order", e);
    }
    setSaving(false);
  };

  const advanceStatus = async (order) => {
    const next = STATUS_FLOW[order.status];
    if (!next) return;
    const updated = await base44.entities.CustomerOrder.update(order.id, { status: next });
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    await logAudit({
      entityType: "CustomerOrder", entityId: order.id, action: "update",
      oldValue: { status: order.status }, newValue: { status: next },
      description: `Order for ${order.customer_name} moved to ${next}`,
    });
  };

  const cancelOrder = async (order) => {
    const updated = await base44.entities.CustomerOrder.update(order.id, { status: "cancelled" });
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    await logAudit({
      entityType: "CustomerOrder", entityId: order.id, action: "update",
      oldValue: { status: order.status }, newValue: { status: "cancelled" },
      description: `Order for ${order.customer_name} cancelled`,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await base44.entities.CustomerOrder.delete(deleteTarget.id);
    setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    await logAudit({
      entityType: "CustomerOrder", entityId: deleteTarget.id, action: "delete",
      description: `Order for ${deleteTarget.customer_name} deleted`,
    });
    setDeleteTarget(null);
  };

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? orders.length : orders.filter((o) => o.status === f).length;
    return acc;
  }, {});

  const totalValue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-slate-500" /> Customer Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track customer orders & service requests — {orders.length} total · {fmtMoney(totalValue)} active value</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> New Order</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filter === f
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}>
            {f.replace("_", " ")} <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center py-8 text-slate-400 text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">No orders {filter !== "all" ? `with status "${filter.replace("_", " ")}"` : "yet"}.</p>
          ) : (
            filtered.map((o) => (
              <OrderCard key={o.id} order={o} isAdmin={isAdmin} onAdvance={advanceStatus} onCancel={cancelOrder} onDelete={setDeleteTarget} />
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recorded by</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-slate-400">No orders {filter !== "all" ? `with status "${filter.replace("_", " ")}"` : "yet"}.</TableCell></TableRow>
              ) : (
                filtered.map((o, i) => (
                  <TableRow key={o.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{new Date(o.created_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900">{o.customer_name}</p>
                      <p className="text-xs text-slate-400">{o.customer_contact}</p>
                    </TableCell>
                    <TableCell><span className="capitalize text-slate-600">{o.order_type.replace("_", " ")}</span></TableCell>
                    <TableCell className="max-w-[200px]"><p className="text-sm text-slate-600 truncate">{o.items_description || "—"}</p></TableCell>
                    <TableCell className="text-right tabular-nums text-slate-600">{o.quantity} {o.unit || ""}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{o.amount > 0 ? fmtMoney(o.amount) : "—"}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{o.due_date || "—"}</TableCell>
                    <TableCell className="text-slate-600 text-xs">{o.assigned_to || "—"}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-xs text-slate-500">{resolveName(o.recorded_by)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {STATUS_FLOW[o.status] && NEXT_LABEL[o.status] && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => advanceStatus(o)}>
                            {NEXT_LABEL[o.status]}
                          </Button>
                        )}
                        {o.status !== "completed" && o.status !== "cancelled" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => cancelOrder(o)}>
                            Cancel
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600" onClick={() => setDeleteTarget(o)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Customer Order</DialogTitle></DialogHeader>
          <OrderForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} saving={saving} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order for "{deleteTarget?.customer_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}