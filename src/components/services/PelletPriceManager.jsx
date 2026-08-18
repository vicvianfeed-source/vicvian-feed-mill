import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PELLET_SIZES = ["2mm", "4mm", "6mm"];
const SETTING_KEY = "service_pellet_prices";

export default function PelletPriceManager({ onPricesChange }) {
  const [prices, setPrices] = useState({ "2mm": 0, "4mm": 0, "6mm": 0 });
  const [settingId, setSettingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const settings = await base44.entities.AppSetting.filter({ key: SETTING_KEY });
    if (settings.length > 0) {
      setSettingId(settings[0].id);
      try {
        const parsed = JSON.parse(settings[0].value);
        setPrices({ "2mm": parsed["2mm"] || 0, "4mm": parsed["4mm"] || 0, "6mm": parsed["6mm"] || 0 });
      } catch {}
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const value = JSON.stringify(prices);
    if (settingId) {
      await base44.entities.AppSetting.update(settingId, { value });
    } else {
      const created = await base44.entities.AppSetting.create({ key: SETTING_KEY, value });
      setSettingId(created.id);
    }
    setSaving(false);
    if (onPricesChange) onPricesChange(prices);
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Pellet Prices</h3>
      <p className="text-xs text-slate-500 mb-3">Set the per-kg rate for each pellet size</p>
      <div className="grid grid-cols-3 gap-3">
        {PELLET_SIZES.map((size) => (
          <div key={size} className="space-y-1">
            <Label className="text-xs">{size}</Label>
            <Input type="number" step="0.01" min="0" value={prices[size] || 0}
              onChange={(e) => setPrices((prev) => ({ ...prev, [size]: parseFloat(e.target.value) || 0 }))} />
            <p className="text-xs text-slate-400">{fmtMoney(prices[size] || 0)}/kg</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-3">
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Prices"}</Button>
      </div>
    </div>
  );
}