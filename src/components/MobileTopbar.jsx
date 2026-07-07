import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TITLES = {
  "/sales": "Sales", "/services": "Services", "/expenses": "Expenses",
  "/production": "Production", "/rentals": "Rentals", "/purchases": "Purchases",
  "/inventory": "Inventory", "/products": "Products", "/pricing": "Pricing",
  "/reports": "Reports", "/audit": "Audit Log", "/team": "Team", "/assistant": "Assistant",
};

export default function MobileTopbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDeep = location.pathname.endsWith("/new");
  const base = location.pathname.replace(/\/new$/, "");
  const title = TITLES[base] || TITLES[location.pathname] || "AgroMill";

  const goBack = () => {
    if (isDeep) {
      navigate(base || "/", { replace: true });
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="md:hidden sticky top-0 z-30 bg-[#1A1F2E] text-white flex items-center gap-3 px-3 py-3"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}>
      {isDeep && (
        <button onClick={goBack} aria-label="Back"
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="font-bold flex-1 truncate">{isDeep ? `New ${title}` : "AgroMill IMS"}</h1>
    </div>
  );
}