import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fmtMoney } from "@/lib/format";

export default function RevenueChart({ feedMill, fishFarm, rentals }) {
  const data = [
    { name: "Feed Mill", revenue: feedMill, color: "#F59E0B" },
    { name: "Fish Farm", revenue: fishFarm, color: "#0D9488" },
    { name: "Rentals", revenue: rentals, color: "#6366F1" },
  ];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Today's Revenue by Domain</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => fmtMoney(v)} cursor={{ fill: "#F1F5F9" }} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}