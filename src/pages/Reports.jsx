import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { canAccess } from "@/lib/permissions";
import { fmtMoney, todayStr } from "@/lib/format";
import AccessDenied from "@/components/common/AccessDenied";
import StatCard from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

const monthStart = () => todayStr().slice(0, 8) + "01";

export default function Reports() {
  const { role } = useOutletContext();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayStr());
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const [sales, jobs, rentals, expenses] = await Promise.all([
        base44.entities.Sale.list("-created_date", 1000),
        base44.entities.ServiceJob.list("-created_date", 1000),
        base44.entities.Rental.list("-created_date", 1000),
        base44.entities.Expense.list("-date", 1000),
      ]);
      setData({ sales, jobs, rentals, expenses });
    })();
  }, []);

  if (!canAccess(role, "reports")) return <AccessDenied />;
  if (!data) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  const inRange = (d) => { const x = (d || "").slice(0, 10); return x >= from && x <= to; };
  const sales = data.sales.filter((s) => s.status !== "void" && inRange(s.sale_date || s.created_date));
  const jobs = data.jobs.filter((j) => j.status !== "void" && inRange(j.created_date));
  const rentals = data.rentals.filter((r) => inRange(r.start_date));
  const expenses = data.expenses.filter((e) => inRange(e.date));

  const feedMillRev = sales.filter((s) => s.domain === "feed_mill").reduce((s, x) => s + x.total, 0)
    + jobs.reduce((s, x) => s + x.total, 0);
  const fishFarmRev = sales.filter((s) => s.domain === "fish_farm").reduce((s, x) => s + x.total, 0);
  const rentalRev = rentals.reduce((s, x) => s + (x.total_charge || 0), 0);
  const revenue = feedMillRev + fishFarmRev + rentalRev;
  const cogs = expenses.filter((e) => e.category === "procurement").reduce((s, x) => s + x.amount, 0);
  const opex = expenses.filter((e) => e.category !== "procurement").reduce((s, x) => s + x.amount, 0);
  const totalCosts = cogs + opex;
  const net = revenue - totalCosts;
  const isProfit = net >= 0;

  const incomeRows = [
    ["Feed Mill revenue (sales + services)", feedMillRev],
    ["Fish Farm revenue", fishFarmRev],
    ["Rentals revenue", rentalRev],
  ];
  const costRows = [
    ["Cost of goods (procurement)", cogs],
    ["Operating expenses", opex],
  ];

  const exportCsv = () => {
    const lines = [
      "Section,Line item,Amount",
      ...incomeRows.map(([l, v]) => `Income,"${l}",${v.toFixed(2)}`),
      `Income,"Total income",${revenue.toFixed(2)}`,
      ...costRows.map(([l, v]) => `Costs,"${l}",${(-v).toFixed(2)}`),
      `Costs,"Total costs",${(-totalCosts).toFixed(2)}`,
      `Result,"${isProfit ? "Net profit" : "Net loss"}",${net.toFixed(2)}`,
    ];
    const csv = lines.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `pnl_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profit & Loss</h1>
          <p className="text-sm text-slate-500 mt-1">Revenue vs. cost of goods vs. expenses</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
      </div>
      <div className="flex items-end gap-4 flex-wrap">
        <div className="space-y-1.5">
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={fmtMoney(revenue)} accentClass="text-emerald-600" />
        <StatCard label="Total Costs" value={fmtMoney(totalCosts)} accentClass="text-rose-600" />
        <StatCard label={isProfit ? "Net Profit" : "Net Loss"} value={fmtMoney(Math.abs(net))}
          sub={isProfit ? "Income exceeds costs" : "Costs exceed income"}
          accentClass={isProfit ? "text-emerald-600" : "text-rose-600"} />
        <StatCard label="Profit Margin" value={revenue > 0 ? `${((net / revenue) * 100).toFixed(1)}%` : "—"}
          accentClass={isProfit ? "text-emerald-600" : "text-rose-600"} />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Line Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-emerald-50/60 hover:bg-emerald-50/60">
              <TableCell className="font-semibold text-emerald-800" colSpan={2}>Income</TableCell>
            </TableRow>
            {incomeRows.map(([label, value]) => (
              <TableRow key={label}>
                <TableCell className="pl-8">{label}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtMoney(value)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-slate-50 font-semibold">
              <TableCell>Total income</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-600">{fmtMoney(revenue)}</TableCell>
            </TableRow>
            <TableRow className="bg-rose-50/60 hover:bg-rose-50/60">
              <TableCell className="font-semibold text-rose-800" colSpan={2}>Costs & Expenses</TableCell>
            </TableRow>
            {costRows.map(([label, value]) => (
              <TableRow key={label}>
                <TableCell className="pl-8">{label}</TableCell>
                <TableCell className="text-right tabular-nums text-rose-600">-{fmtMoney(value)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-slate-50 font-semibold">
              <TableCell>Total costs</TableCell>
              <TableCell className="text-right tabular-nums text-rose-600">-{fmtMoney(totalCosts)}</TableCell>
            </TableRow>
            <TableRow className={`font-bold ${isProfit ? "bg-emerald-50" : "bg-rose-50"}`}>
              <TableCell>{isProfit ? "Net Profit" : "Net Loss"}</TableCell>
              <TableCell className={`text-right tabular-nums ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>
                {fmtMoney(Math.abs(net))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-slate-400">
        Transactions in range: {sales.length} sales · {jobs.length} service jobs · {rentals.length} rentals · {expenses.length} expenses
      </p>
    </div>
  );
}