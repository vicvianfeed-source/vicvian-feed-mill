import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useUserNameMap() {
  const [nameMap, setNameMap] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    base44.functions.invoke("getUserNames", {})
      .then((res) => setNameMap(res.data?.nameMap || {}))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const resolveName = (value) => {
    if (!value) return "—";
    const key = value.toLowerCase();
    if (nameMap[key]) return nameMap[key];
    if (!value.includes("@")) return value;
    return value;
  };

  return { resolveName, loaded };
}