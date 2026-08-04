import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { fmtMoney } from "@/lib/format";
import { useUserNameMap } from "@/hooks/use-user-names";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Search, Users, Mail, Phone } from "lucide-react";
import AccessDenied from "@/components/common/AccessDenied";

const TYPE_TABS = ["all", "lead", "customer"];
const TYPE_LABELS = { all: "All", lead: "Leads", customer: "Customers" };

const TYPE_CLS = {
  lead: "bg-amber-100 text-amber-700",
  customer: "bg-teal-100 text-teal-800",
};

export default function CRM() {
  const { user, role } = useOutletContext();
  const { resolveName } = useUserNameMap();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = role === "admin";

  const load = async () => {
    setCustomers(await base44.entities.Customer.list("-created_date", 500));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (role !== "admin" && role !== "manager") return <AccessDenied />;

  const filtered = customers
    .filter((c) => tab === "all" || c.type === tab)
    .filter((c) => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.contact?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()));

  const leadCount = customers.filter((c) => c.type === "lead").length;
  const customerCount = customers.filter((c) => c.type === "customer").length;
  const totalSpent = customers.reduce((s, c) => s + (c.total_spent || 0), 0);

  const handleSave = async (data) => {
    setSaving(true);
    if (editing) {
      await base44.entities.Customer.update(editing.id, data);
      await logAudit({ entityType: "Customer", entityId: editing.id, action: "update", newValue: { name: data.name }, description: `Customer updated: ${data.name}` });
    } else {
      const c = await base44.entities.Customer.create(data);
      await logAudit({ entityType: "Customer", entityId: c.id, action: "create", newValue: { name: data.name }, description: `Customer created: ${data.name}` });
    }
    setSaving(false);
    setOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    const c = deleteTarget;
    if (!c) return;
    setDeleting(true);
    await base44.entities.Customer.delete(c.id);
    await logAudit({ entityType: "Customer", entityId: c.id, action: "delete", oldValue: { name: c.name }, description: `Customer deleted: ${c.name}` });
    setDeleting(false);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 flex-1">CRM</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full h-9 px-4">
          <Plus className="w-4 h-4 mr-1" /> Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm" />
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Contacts</p>
          <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Leads</p>
          <p className="text-2xl font-bold text-amber-600">{leadCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-emerald-600">{fmtMoney(totalSpent)}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users className="w-10 h-10 mb-3 text-slate-300" />
            <p className="font-medium text-slate-600 text-sm">No customers found</p>
            <p className="text-xs mt-1">{search ? "Try a different search." : "Add your first customer or lead above."}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                  {(c.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{c.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.contact && <span className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.contact}</span>}
                    {c.email && <span className="text-xs text-slate-400 flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{c.email}</span>}
                  </div>
                  {c.company && <p className="text-xs text-slate-400 mt-0.5">{c.company}</p>}
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_CLS[c.type] || TYPE_CLS.customer}`}>{c.type}</span>
                  {c.total_spent > 0 && <p className="text-xs font-semibold text-slate-700 mt-1 tabular-nums">{fmtMoney(c.total_spent)}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(c); setOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <button onClick={() => setDeleteTarget(c)} className="p-! rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Customer" : "New Customer"}</DialogTitle></DialogHeader>
          <CustomerForm customer={editing} onSave={handleSave} onCancel={() => { setOpen(false); setEditing(null); }} saving={saving} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget && `"${deleteTarget.name}" will be permanently deleted.`}</AlertDialogDescription>
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

function CustomerForm({ customer, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: customer?.name || "",
    contact: customer?.contact || "",
    email: customer?.email || "",
    company: customer?.company || "",
    type: customer?.type || "customer",
    status: customer?.status || "active",
    notes: customer?.notes || "",
    total_spent: customer?.total_spent || 0,
  });

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="John Doe" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="08012345678" />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Company</Label>
          <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company Ltd" />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => set("type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Any notes about this contact..." />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}