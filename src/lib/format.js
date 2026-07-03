export const fmtMoney = (n) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtNum = (n) => Number(n || 0).toLocaleString();

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const isToday = (isoDate) => (isoDate || "").slice(0, 10) === todayStr();

export const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};