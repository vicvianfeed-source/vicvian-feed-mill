const ALL = ["admin", "manager", "operator"];

export const PAGE_ROLES = {
  dashboard: ALL,
  sales: ALL,
  services: ALL,
  production: ALL,
  rentals: ALL,
  purchases: ALL,
  expenses: ALL,
  inventory: ALL,
  products: ["admin", "manager"],
  pricing: ["admin", "manager"],
  reports: ["admin", "manager"],
  audit: ["admin"],
  team: ["admin"],
  orders: ["admin", "manager"],
  business_plan: ["admin", "manager"],
  assistant: ALL,
};

export const normalizeRole = (role) =>
  ["admin", "manager", "operator"].includes(role) ? role : "operator";

export const canAccess = (role, page) => (PAGE_ROLES[page] || []).includes(role);