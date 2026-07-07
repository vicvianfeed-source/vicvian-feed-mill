import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Renders a native select on desktop and a bottom-sheet drawer on mobile,
 * mirroring the UX of ProductCombobox. Options: [{ value, label }].
 */
export default function NativeSelect({ value, onChange, options, placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const selected = options.find((o) => o.value === value);
  const label = selected ? selected.label : placeholder;

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className={cn(!selected && "text-muted-foreground")}>{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle>{placeholder}</DrawerTitle>
        </DrawerHeader>
        <div className="p-2 pt-0 max-h-[60vh] overflow-y-auto">
          {options.map((o) => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value === value ? "" : o.value); setOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm hover:bg-accent transition-colors text-left">
              <span>{o.label}</span>
              <Check className={cn("h-4 w-4", value === o.value ? "opacity-100" : "opacity-0")} />
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}