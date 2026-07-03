import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { canAccess } from "@/lib/permissions";
import AccessDenied from "@/components/common/AccessDenied";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ACTIONS = ["create", "update", "delete", "approve", "return", "price_change", "stock_adjustment", "role_change"];

export default function AuditLogPage() {
  const { role } = useOutletContext();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.AuditLog.list("-created_date", 300).then((l) => { setLogs(l); setLoading(false); });
  }, []);

  if (!canAccess(role, "audit")) return <AccessDenied />;

  const entities = [...new Set(logs.map((l) => l.entity_type))];
  const filtered = logs.filter((l) =>
    (actionFilter === "all" || l.action === actionFilter) &&
    (entityFilter === "all" || l.entity_type === entityFilter) &&
    (!search || l.changed_by.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">Full trail of system changes</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTIONS.map((a) => <SelectItem key={a} value={a} className="capitalize">{a.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input className="w-56" placeholder="Filter by user email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No audit entries found.</TableCell></TableRow>
            ) : (
              filtered.map((l, i) => (
                <TableRow key={l.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{new Date(l.created_date).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{l.changed_by}</TableCell>
                  <TableCell className="text-xs font-medium">{l.entity_type}</TableCell>
                  <TableCell>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                      {l.action.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate">{l.description}</TableCell>
                  <TableCell className="text-xs text-slate-400 max-w-xs truncate font-mono">
                    {l.old_value && `${l.old_value} → `}{l.new_value}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}