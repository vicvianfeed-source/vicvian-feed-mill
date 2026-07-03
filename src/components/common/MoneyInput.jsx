import React from "react";
import { Input } from "@/components/ui/input";

export default function MoneyInput(props) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₦</span>
      <Input type="number" step="0.01" min="0" className="pl-7" {...props} />
    </div>
  );
}