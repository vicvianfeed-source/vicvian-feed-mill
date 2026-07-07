import React, { useState } from "react";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ProductCombobox({ products, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const selected = products.find((p) => p.id === value);

  const trigger = (
    <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal">
      {selected ? `${selected.name} — ${fmtMoney(selected.current_price)}/${selected.unit}` : "Select product"}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const list = (
    <Command>
      <CommandInput placeholder="Search products..." />
      <CommandList>
        <CommandEmpty>No product found.</CommandEmpty>
        <CommandGroup>
          {products.map((p) => (
            <CommandItem key={p.id} value={p.name} onSelect={() => { onSelect(p.id); setOpen(false); }}
              className={isMobile ? "py-3" : ""}>
              <Check className={cn("mr-2 h-4 w-4", value === p.id ? "opacity-100" : "opacity-0")} />
              <span className="flex-1">{p.name}</span>
              <span className="text-xs text-slate-500">{fmtMoney(p.current_price)}/{p.unit}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="pb-0">
            <DrawerTitle>Select product</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pt-2 max-h-[60vh] overflow-y-auto">{list}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {list}
      </PopoverContent>
    </Popover>
  );
}