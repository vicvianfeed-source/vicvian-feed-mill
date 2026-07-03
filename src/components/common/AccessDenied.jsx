import React from "react";
import { ShieldAlert } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldAlert className="w-12 h-12 text-slate-300 mb-4" />
      <h2 className="text-lg font-semibold text-slate-800">Access restricted</h2>
      <p className="text-sm text-slate-500 mt-1">You don't have permission to view this section.</p>
    </div>
  );
}