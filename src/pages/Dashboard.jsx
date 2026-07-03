import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { fmtMoney, isToday, addDays, todayStr } from "@/lib/format";
import StatCard from "@/components/common/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import DomainBadge from "@/components/common/DomainBadge";
import { ShoppingCart, Wheat, Factory, Tractor, Receipt } from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Record Sale", path: "/sales", icon: ShoppingCart, cls: "text-amber-600 bg-amber-50" },
  { label: "Log Service Job", path: "/services", icon: Wheat, cls: "text-orange-600 bg-orange-50" },
  { label: "New Production Batch", path: "/production", icon: Factory, cls: "text-teal-600 bg-teal-50" },
  { label: "New Rental", path: "/rentals", icon: Tractor, cls: "text-indigo-600 bg-indigo-50" },
  { label: "Record Expense", path: "/expenses", icon: Receipt, cls: "text-rose-600 bg-rose-50" },
];

export default function Dashboard() {
  const { user, role } = useOutletContext();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const [sales, jobs, rentals, expenses, products] = await Promise.all([
        base44.entities.Sale.list("-created_date", 300),
        base44.entities.ServiceJob.list("-created_date", 300),
        base44.entities.Rental.list("-created_date", 300),
        base44.entities.Expense.list("-created_date", 300),
        base44.entities.Product.list("-created_date", 500),
      ]);
      setData({ sales, jobs, rentals, expenses, products });
    })();
  }, []);

  if (!data) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  if (role === "operator") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.full_name?.split(" ")[0] || "Operator"}</h1>
        <p className="text-sm text-slate-500 mt-1">What would you like to record today?</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.path} to={a.path}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.cls}`}>
                <a.icon className="w-5 h-5" />
              </div>
              <p className="mt-3 font-semibold text-slate-800 text-sm">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const todaySales = data.sales.filter((s) => isToday(s.sale_date || s.created_date) && s.status !== "void");
  const todayJobs = data.jobs.filter((j) => isToday(j.created_date) && j.status !== "void");
  const todayRentals = data.rentals.filter((r) => isToday(r.created_date));
  const todayExpenses = data.expenses.filter((e) => e.date === todayStr());

  const feedMillRev = todaySales.filter((s) => s.domain === "feed_mill").reduce((s, x) => s + x.total, 0)
    + todayJobs.reduce((s, x) => s + x.total, 0);
  const fishFarmRev = todaySales.filter((s) => s.domain === "fish_farm").reduce((s, x) => s + x.total, 0);
  const rentalRev = todayRentals.reduce((s, x) => s + (x.total_charge || 0), 0);
  const totalRev = feedMillRev + fishFarmRev + rentalRev;
  const totalExp = todayExpenses.reduce((s, x) => s + x.amount, 0);

  const lowStock = data.products.filter((p) => p.active !== false && p.product_type !== "service"
    && p.low_stock_threshold > 0 && p.stock_quantity <= p.low_stock_threshold);
  const overdueRentals = data.rentals
    .filter((r) => r.status === "active" && addDays(r.start_date, r.rental_days) < todayStr())
    .map((r) => ({ ...r, due_date: addDays(r.start_date, r.rental_days) }));
  const soon = addDays(todayStr(), 30);
  const expiring = data.products.filter((p) => p.active !== false && p.expiry_date
    && p.expiry_date <= soon && p.stock_quantity > 0);

  const recent = [
    ...todaySales.map((s) => ({ id: `s-${s.id}`, type: "Sale", desc: `${s.quantity} × ${s.product_name}`, domain: s.domain, total: s.total, by: s.operator_email })),
    ...todayJobs.map((j) => ({ id: `j-${j.id}`, type: "Service", desc: `${j.service_name} — ${j.customer_name}`, domain: "service", total: j.total, by: j.operator_email })),
    ...todayRentals.map((r) => ({ id: `r-${r.id}`, type: "Rental", desc: `${r.tool_name} — ${r.customer_name}`, domain: "rental_tool", total: r.total_charge, by: r.operator_email })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Today's operations at a glance</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Revenue" value={fmtMoney(totalRev)} accentClass="text-slate-900" />
        <StatCard label="Today's Expenses" value={fmtMoney(totalExp)} accentClass="text-rose-600" />
        <StatCard label="Net Today" value={fmtMoney(totalRev - totalExp)}
          accentClass={totalRev - totalExp >= 0 ? "text-emerald-600" : "text-rose-600"} />
        <StatCard label="Active Rentals" value={data.rentals.filter((r) => r.status === "active").length}
          sub={`${overdueRentals.length} overdue`} accentClass="text-indigo-600" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueChart feedMill={feedMillRev} fishFarm={fishFarmRev} rentals={rentalRev} />
        <AlertsPanel lowStock={lowStock} overdueRentals={overdueRentals} expiring={expiring} />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Today's Transactions</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No transactions recorded today yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5">
                <span className="text-xs font-medium text-slate-500 w-14">{t.type}</span>
                <span className="flex-1 text-sm text-slate-800 truncate">{t.desc}</span>
                <DomainBadge domain={t.domain} />
                <span className="text-sm font-semibold tabular-nums w-24 text-right">{fmtMoney(t.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}