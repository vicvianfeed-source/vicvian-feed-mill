import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export default function AccountSettings({ user }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null); // null | "sending" | "sent"

  const requestDeletion = async () => {
    setStatus("sending");
    await base44.functions.invoke("requestAccountDeletion", {});
    setStatus("sent");
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
        <Settings className="w-3.5 h-3.5" /> Account
      </button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStatus(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Signed in as {user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You can request permanent deletion of your account and associated personal data.
              A deletion request will be submitted for processing.
            </p>
            {status === "sent" ? (
              <p className="text-sm font-medium text-emerald-600">
                Your deletion request has been submitted. You will receive a confirmation email.
              </p>
            ) : (
              <Button variant="destructive" className="w-full" disabled={status === "sending"}
                onClick={requestDeletion}>
                <Trash2 className="w-4 h-4" />
                {status === "sending" ? "Submitting..." : "Delete Account"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}