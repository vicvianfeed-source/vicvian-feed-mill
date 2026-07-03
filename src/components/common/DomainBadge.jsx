import React from "react";

const MAP = {
  feed_mill: { label: "Feed Mill", cls: "bg-amber-100 text-amber-800" },
  fish_farm: { label: "Fish Farm", cls: "bg-teal-100 text-teal-800" },
  rental_tool: { label: "Rentals", cls: "bg-indigo-100 text-indigo-700" },
  service: { label: "Service", cls: "bg-orange-100 text-orange-800" },
};

export default function DomainBadge({ domain }) {
  const d = MAP[domain] || { label: domain, cls: "bg-slate-100 text-slate-700" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${d.cls}`}>
      {d.label}
    </span>
  );
}