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
import { Plus, Trash2, Search, ClipboardList } from "lucide-react";
import AccessDenied from "@/components/common/AccessDenied";
import StatusBadge from "@/components/common/StatusBadge";
import { normalizeRole } from "@/lib/permissions";

const STATUS_TABS = ["all", "pending", "in_progress", "ready", "completed", "cancelled"];
const STATUS_FLOW = { pending: "in_progress", in_progress: "ready", ready: "completed", completed: null, cancelled: null };
const NEXT_LABEL = { pending: "Start", in_progress: "Mark Ready", ready: "Complete", completed: null, cancelled: null };

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
  const [search, setSearch] = useState("");
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

  if (role !== "admin" && role !== "manager") return <AccessDenied />;

  const filtered = orders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => !search || o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.items_description?.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      const order = await base44.entities.CustomerOrder.create({ ...data, status: "pending", recorded_by: recorderName });
      setOrders((prev) => [order, ...prev]);
      await logAudit({ entityType: "CustomerOrder", entityId: order.id, action: "create", newValue: { customer_name: data.customer_name, order_type: data.order_type, amount: data.amount }, description: `Order created for ${data.customer_name}` });
      setOpen(false);
    } catch (e) { console.error("Failed to create order", e); }
    setSaving(false);
  };

  const advanceStatus = async (order) => {
    const next = STATUS_FLOW[order.status];
    if (!next) return;
    const updated = await base44.entities.CustomerOrder.update(order.id, { status: next });
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    await logAudit({ entityType: "CustomerOrder", entityId: order.id, action: "update", oldValue: { status: order.status }, newValue: { status: next }, description: `Order for ${order.customer_name} moved to ${next}` });
  };

  const cancelOrder = async (order) => {
    const updated = await base44.entities.CustomerOrder.update(order.id, { status: "cancelled" });
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    await logAudit({ entityType: "CustomerOrder", entityId: order.id, action: "update", oldValue: { status: order.status }, newValue: { status: "cancelled" }, description: `Order for ${order.customer_name} cancelled` });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await base44.entities.CustomerOrder.delete(deleteTarget.id);
    setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    await logAudit({ entityType: "CustomerOrder", entityId: deleteTarget.id, action: "delete", description: `Order for ${deleteTarget.customer_name} deleted` });
    setDeleteTarget(null);
  };

  const counts = STATUS_TABS.reduce((acc, f) => { acc[f] = f === "all" ? orders.length : orders.filter((o) => o.status === f).length; return acc; }, {});
  const totalValue = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">Customer Orders</h1>
        <Button onClick={() => setOpen(true)} className="rounded-full h-9 px-4">
          <Plus className="w-4 h-4 mr-1" /> New Order
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm" />
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border capitalize ${filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {f.replace("_", " ")} <span className={`text-xs ${filter === f ? "opacity-70" : "opacity-50"}`}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Pending</p>
          <p className={`text-2xl font-bold ${pendingCount > 0 ? "text-amber-600" : "text-slate-900"}`}>{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Active Value</p>
          <p className="text-2xl font-bold text-emerald-600">{fmtMoney(totalValue)}</p>
        </div>
      </div>

      {/* List */}
      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center py-16 text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center py-16 text-slate-400">
              <ClipboardList className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No orders found.</p>
            </div>
          ) : (
            filtered.map((o) => (
              <OrderCard key={o.id} order={o} isAdmin={isAdmin} onAdvance={advanceStatus} onCancel={cancelOrder} onDelete={setDeleteTarget} />
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ClipboardList className="w-10 h-10 mb-3 text-slate-300" />
              <p className="font-medium text-slate-600 text-sm">No orders found</p>
              <p className="text-xs mt-1">{search ? "Try a different search." : `No orders ${filter !== "all" ? `with status "${filter.replace("_", " ")}"` : "yet"}.`}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-[90px_1fr_100px_1fr_70px_100px_80px_100px_80px_160px] px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50">
                <span>Created</span>
                <span>Customer</span>
                <span>Type</span>
                <span>Items</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Amount</span>
                <span>Due</span>
                <span>Assigned</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {filtered.map((o) => (
                <div key={o.id} className="grid grid-cols-[90px_1fr_100px_1fr_70px_100px_80px_100px_80px_160px] px-4 py-3 hover:bg-slate-50 transition-colors items-center">
                  <p className="text-xs text-slate-500">{new Date(o.created_date).toLocaleDateString()}</p>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{o.customer_name}</p>
                    <p className="text-xs text-slate-400">{o.customer_contact}</p>
                  </div>
                  <span className="capitalize text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full w-fit">{o.order_type.replace("_", " ")}</span>
                  <p className="text-sm text-slate-600 truncate pr-2">{o.items_description || "—"}</p>
                  <p className="text-right tabular-nums text-sm text-slate-600">{o.quantity} {o.unit || ""}</p>
                  <p className="text-right tabular-nums font-medium text-sm text-slate-900">{o.amount > 0 ? fmtMoney(o.amount) : "—"}</p>
                  <p className="text-xs text-slate-500">{o.due_date || "—"}</p>
                  <p className="text-xs text-slate-600 truncate">{o.assigned_to || "—"}</p>
                  <StatusBadge status={o.status} />
                  <div className="flex items-center justify-end gap-1">
                    {STATUS_FLOW[o.status] && NEXT_LABEL[o.status] && (
                      <button onClick={() => advanceStatus(o)} className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        {NEXT_LABEL[o.status]}
                      </button>
                    )}
                    {o.status !== "completed" && o.status !== "cancelled" && (
                      <button onClick={() => cancelOrder(o)} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                        Cancel
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => setDeleteTarget(o)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <AlertDialogDescription>This will permanently delete the order for "{deleteTarget?.customer_name}". This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}