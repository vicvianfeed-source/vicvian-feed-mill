import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Wheat, Bot } from "lucide-react";

const TABS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Sales", path: "/sales", icon: ShoppingCart },
  { label: "Services", path: "/services", icon: Wheat },
  { label: "Assistant", path: "/assistant", icon: Bot },
];

export default function BottomTabBar() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#1A1F2E] border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex">
        {TABS.map((tab) => (
          <NavLink key={tab.path} to={tab.path} end={tab.path === "/"}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? "text-white" : "text-slate-400"
              }`
            }>
            {({ isActive }) => (
              <>
                <tab.icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : ""}`} />
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}