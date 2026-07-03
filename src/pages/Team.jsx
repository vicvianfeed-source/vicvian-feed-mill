import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { logAudit } from "@/lib/audit";
import { canAccess, normalizeRole } from "@/lib/permissions";
import AccessDenied from "@/components/common/AccessDenied";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";

export default function Team() {
  const { user, role } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("operator");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  const load = async () => {
    setUsers(await base44.entities.User.list());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!canAccess(role, "team")) return <AccessDenied />;

  const changeRole = async (u, newRole) => {
    await base44.entities.User.update(u.id, { role: newRole });
    await logAudit({
      entityType: "User", entityId: u.id, action: "role_change",
      oldValue: { role: u.role }, newValue: { role: newRole },
      description: `Role changed for ${u.email}`,
    });
    load();
  };

  const invite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteMsg("");
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole === "admin" ? "admin" : "user");
      await logAudit({
        entityType: "User", action: "invite",
        newValue: { email: inviteEmail, role: inviteRole },
        description: `Invited ${inviteEmail} as ${inviteRole}`,
      });
      setInviteMsg(`Invitation sent to ${inviteEmail}.`);
      setInviteEmail("");
      load();
    } catch (err) {
      setInviteMsg(err?.message || "Failed to send invite.");
    }
    setInviting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500 mt-1">Manage users and their roles</p>
        </div>
        <Button onClick={() => { setInviteMsg(""); setOpen(true); }}>
          <UserPlus className="w-4 h-4 mr-1" /> Invite User
        </Button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
            ) : (
              users.map((u, i) => (
                <TableRow key={u.id} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell className="text-slate-500">{u.email}</TableCell>
                  <TableCell>
                    {u.id === user.id ? (
                      <span className="text-sm capitalize text-slate-500">{normalizeRole(u.role)} (you)</span>
                    ) : (
                      <Select value={normalizeRole(u.role)} onValueChange={(v) => changeRole(u, v)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                        </SelectContent>
                      </Select>
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
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <form onSubmit={invite} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">Managers and operators join as regular users — set their exact role here after they accept.</p>
            </div>
            {inviteMsg && <p className="text-sm text-slate-600">{inviteMsg}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button>
              <Button type="submit" disabled={inviting || !inviteEmail}>{inviting ? "Sending..." : "Send invite"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}