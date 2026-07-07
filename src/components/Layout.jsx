import React, { useEffect, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { normalizeRole } from "@/lib/permissions";
import ThemeToggle from "@/components/ThemeToggle";
import BottomTabBar from "@/components/BottomTabBar";
import AccountSettings from "@/components/AccountSettings";
import {
  LayoutDashboard, ShoppingCart, Wheat, Factory, Tractor, PackagePlus,
  Receipt, Boxes, Package, Tags, BarChart3, ScrollText, Users, LogOut, Menu, X, Bot,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "manager", "operator"] },
  { label: "Sales", path: "/sales", icon: ShoppingCart, roles: ["admin", "manager", "operator"] },
  { label: "Services", path: "/services", icon: Wheat, roles: ["admin", "manager", "operator"] },
  { label: "Production", path: "/production", icon: Factory, roles: ["admin", "manager", "operator"] },
  { label: "Rentals", path: "/rentals", icon: Tractor, roles: ["admin", "manager", "operator"] },
  { label: "Purchases", path: "/purchases", icon: PackagePlus, roles: ["admin", "manager", "operator"] },
  { label: "Expenses", path: "/expenses", icon: Receipt, roles: ["admin", "manager", "operator"] },
  { label: "Inventory", path: "/inventory", icon: Boxes, roles: ["admin", "manager", "operator"] },
  { label: "Products", path: "/products", icon: Package, roles: ["admin", "manager"] },
  { label: "Pricing", path: "/pricing", icon: Tags, roles: ["admin", "manager"] },
  { label: "Reports", path: "/reports", icon: BarChart3, roles: ["admin", "manager"] },
  { label: "Audit Log", path: "/audit", icon: ScrollText, roles: ["admin"] },
  { label: "Team", path: "/team", icon: Users, roles: ["admin"] },
  { label: "Assistant", path: "/assistant", icon: Bot, roles: ["admin", "manager", "operator"] },
];

export default function Layout() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const role = normalizeRole(user.role);
  const items = NAV.filter((n) => n.roles.includes(role));

  const sidebar = (
    <div className="flex flex-col h-full bg-[#1A1F2E] text-slate-300">
      <div className="px-5 py-6 border-b border-white/10">
        <h1 className="text-lg font-bold text-white tracking-tight">AgroMill IMS</h1>
        <p className="text-xs text-slate-400 mt-0.5">Feed · Fish · Rentals</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === "/"} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"
              }`
            }>
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-sm text-white font-medium truncate">{user.full_name || user.email}</p>
        <p className="text-xs text-slate-400 capitalize">{role}</p>
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <button onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
          <AccountSettings user={user} />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: "url('https://media.base44.com/images/public/6a47e78a9afaebf80383e337/6e7005f6a_generated_image.png')" }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#F8FAFC]/85 dark:bg-[#12161F]/90" />
      <aside className="hidden md:block fixed inset-y-0 left-0 w-60 z-30">{sidebar}</aside>
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60">{sidebar}</aside>
        </div>
      )}
      <div className="md:hidden sticky top-0 z-30 bg-[#1A1F2E] text-white flex items-center justify-between px-4 py-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}>
        <h1 className="font-bold">AgroMill IMS</h1>
        <button onClick={() => setOpen(!open)}>{open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
      </div>
      <main className="md:pl-60 relative z-10 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <Outlet context={{ user, role }} />
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}