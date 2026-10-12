import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "vicvian_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const setConsent = (choice) => {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-4" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div className="max-w-3xl mx-auto bg-[#1A1F2E] text-slate-200 rounded-xl shadow-2xl border border-white/10 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <p className="text-sm flex-1">
            We use essential cookies for authentication, plus optional cookies from Google Fonts and Giphy.
            See our{" "}
            <Link to="/cookie-policy" className="text-emerald-400 underline hover:text-emerald-300">
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" className="text-emerald-400 underline hover:text-emerald-300">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConsent("essential")}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-white/20 text-slate-300 hover:bg-white/10 transition-colors"
            >
              Essential only
            </button>
            <button
              onClick={() => setConsent("all")}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}