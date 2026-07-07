import React, { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { queryClientInstance } from "@/lib/query-client";

const TRIGGER = 60;

export default function PullToRefresh({ children }) {
  const startY = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e) => {
    startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
  };

  const onTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) setPull(Math.min(delta * 0.4, 90));
  };

  const onTouchEnd = async () => {
    if (refreshing) return;
    if (pull >= TRIGGER) {
      setRefreshing(true);
      setPull(48);
      await Promise.all([
        queryClientInstance.invalidateQueries(),
        new Promise((r) => setTimeout(r, 600)),
      ]);
      window.dispatchEvent(new CustomEvent("app:refresh"));
      setRefreshing(false);
    }
    setPull(0);
    startY.current = null;
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: pull }}>
        <RefreshCw
          className={`w-5 h-5 text-slate-400 ${refreshing ? "animate-spin" : ""}`}
          style={!refreshing ? { transform: `rotate(${pull * 3}deg)` } : undefined}
        />
      </div>
      {children}
    </div>
  );
}