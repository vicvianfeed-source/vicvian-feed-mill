import React from "react";
import { Link } from "react-router-dom";

export default function LegalFooter() {
  return (
    <div className="text-center text-xs text-muted-foreground mt-8 space-y-2">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Link to="/privacy-policy" className="hover:text-foreground underline">Privacy Policy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms" className="hover:text-foreground underline">Terms &amp; Conditions</Link>
        <span aria-hidden="true">·</span>
        <Link to="/cookie-policy" className="hover:text-foreground underline">Cookie Policy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/refund-policy" className="hover:text-foreground underline">Refund Policy</Link>
      </div>
      <p>© {new Date().getFullYear()} Vicvian IMS. All rights reserved.</p>
    </div>
  );
}