import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { fmtMoney, isToday, addDays, todayStr } from "@/lib/format";
import StatCard from "@/components/common/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import ProductPerformanceChart from "@/components/dashboard/ProductPerformanceChart";
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

const BG_GIF = "https://media.giphy.com/media/uf3jumi0zzUv6/giphy.gif";
const bgStyle = {
  backgroundImage: `url(${BG_GIF})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
};
const overlayCls = "absolute inset-0 bg-white/70 dark:bg-slate-900/70";

export default function Dashboard() {
  const { user, role } = useOutletContext();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("today");

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
      <div className="relative min-h-screen -m-4 sm:-m-6 p-4 sm:p-6" style={bgStyle}>
        <div className={overlayCls} />
        <div className="relative z-10 space-y-6">
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
      </div>
    );
  }

  const isWeek = period === "week";
  const weekStart = addDays(todayStr(), -6);
  const inPeriod = (iso) => {
    const d = (iso || "").slice(0, 10);
    return isWeek ? d >= weekStart && d <= todayStr() : isToday(iso);
  };

  const periodSales = data.sales.filter((s) => inPeriod(s.sale_date || s.created_date) && s.status !== "void");
  const periodJobs = data.jobs.filter((j) => inPeriod(j.created_date) && j.status !== "void");
  const periodRentals = data.rentals.filter((r) => inPeriod(r.created_date));
  const periodExpenses = data.expenses.filter((e) => inPeriod(e.date));

  const feedMillRev = periodSales.filter((s) => s.domain === "feed_mill").reduce((s, x) => s + x.total, 0)
    + periodJobs.reduce((s, x) => s + x.total, 0);
  const fishFarmRev = periodSales.filter((s) => s.domain === "fish_farm").reduce((s, x) => s + x.total, 0);
  const rentalRev = periodRentals.reduce((s, x) => s + (x.total_charge || 0), 0);
  const totalRev = feedMillRev + fishFarmRev + rentalRev;
  const totalExp = periodExpenses.reduce((s, x) => s + x.amount, 0);

  const lowStock = data.products.filter((p) => p.active !== false && p.product_type !== "service"
    && p.low_stock_threshold > 0 && p.stock_quantity <= p.low_stock_threshold);
  const overdueRentals = data.rentals
    .filter((r) => r.status === "active" && addDays(r.start_date, r.rental_days) < todayStr())
    .map((r) => ({ ...r, due_date: addDays(r.start_date, r.rental_days) }));
  const soon = addDays(todayStr(), 30);
  const expiring = data.products.filter((p) => p.active !== false && p.expiry_date
    && p.expiry_date <= soon && p.stock_quantity > 0);

  const recent = [
    ...periodSales.map((s) => ({ id: `s-${s.id}`, type: "Sale", desc: `${s.quantity} × ${s.product_name}`, domain: s.domain, total: s.total, date: (s.sale_date || s.created_date || "").slice(0, 10) })),
    ...periodJobs.map((j) => ({ id: `j-${j.id}`, type: "Service", desc: `${j.service_name} — ${j.customer_name}`, domain: "service", total: j.total, date: (j.created_date || "").slice(0, 10) })),
    ...periodRentals.map((r) => ({ id: `r-${r.id}`, type: "Rental", desc: `${r.tool_name} — ${r.customer_name}`, domain: "rental_tool", total: r.total_charge, date: (r.created_date || "").slice(0, 10) })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const productPerf = periodSales.reduce((acc, s) => {
    const key = s.product_name;
    if (!acc[key]) acc[key] = { product_name: key, revenue: 0, qty: 0 };
    acc[key].revenue += s.total || 0;
    acc[key].qty += s.quantity || 0;
    return acc;
  }, {});
  const productPerfArr = Object.values(productPerf);

  const periodLabel = isWeek ? "This Week's" : "Today's";
  const netLabel = isWeek ? "Net This Week" : "Net Today";

  return (
    <div className="relative min-h-screen -m-4 sm:-m-6 p-4 sm:p-6" style={bgStyle}>
      <div className={overlayCls} />
      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">{isWeek ? "Last 7 days of operations at a glance" : "Today's operations at a glance"}</p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {[["today", "Today"], ["week", "This Week"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setPeriod(val)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === val ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={`${periodLabel} Revenue`} value={fmtMoney(totalRev)} accentClass="text-slate-900" />
          <StatCard label={`${periodLabel} Expenses`} value={fmtMoney(totalExp)} accentClass="text-rose-600" />
          <StatCard label={netLabel} value={fmtMoney(totalRev - totalExp)}
            accentClass={totalRev - totalExp >= 0 ? "text-emerald-600" : "text-rose-600"} />
          <StatCard label="Active Rentals" value={data.rentals.filter((r) => r.status === "active").length}
            sub={`${overdueRentals.length} overdue`} accentClass="text-indigo-600" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <RevenueChart feedMill={feedMillRev} fishFarm={fishFarmRev} rentals={rentalRev} />
          <ProductPerformanceChart products={productPerfArr} />
        </div>
        <AlertsPanel lowStock={lowStock} overdueRentals={overdueRentals} expiring={expiring} />
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">{periodLabel} Transactions</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No transactions recorded {isWeek ? "this week" : "today"} yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-xs font-medium text-slate-500 w-14">{t.type}</span>
                  {isWeek && <span className="text-xs text-slate-400 tabular-nums w-20">{t.date}</span>}
                  <span className="flex-1 text-sm text-slate-800 truncate">{t.desc}</span>
                  <DomainBadge domain={t.domain} />
                  <span className="text-sm font-semibold tabular-nums w-24 text-right">{fmtMoney(t.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}