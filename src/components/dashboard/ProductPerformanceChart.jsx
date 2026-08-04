import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fmtMoney } from "@/lib/format";

const COLORS = ["#F59E0B", "#0D9488", "#6366F1", "#EC4899", "#8B5CF6", "#3B82F6", "#10B981", "#F43F5E"];

export default function ProductPerformanceChart({ products }) {
  const top = [...products]
    .map((p) => ({ name: p.product_name, revenue: p.revenue, qty: p.qty }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Products by Revenue</h3>
      {top.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">No product sales recorded in this period yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={top} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoney(v)} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip formatter={(v) => fmtMoney(v)} cursor={{ fill: "#F1F5F9" }} />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {top.map((d, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}