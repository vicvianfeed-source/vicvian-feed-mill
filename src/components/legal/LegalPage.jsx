import React from "react";
import { Link } from "react-router-dom";

export default function LegalPage({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
          ← Back to app
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">{title}</h1>
        {lastUpdated && <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>}
        <div className="prose prose-slate dark:prose-invert max-w-none text-foreground space-y-4 text-sm md:text-base leading-relaxed">
          {children}
        </div>
        <div className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground space-y-1">
          <p><strong>Vicvian IMS</strong> — Feed Mill · Fish Farm · Equipment Rental</p>
          <p>Email: vicvianfeed@gmail.com</p>
          <p>Operating in accordance with applicable EU GDPR and local data protection regulations.</p>
          <div className="flex gap-3 mt-3">
            <Link to="/privacy-policy" className="hover:text-foreground underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground underline">Terms</Link>
            <Link to="/cookie-policy" className="hover:text-foreground underline">Cookie Policy</Link>
            <Link to="/refund-policy" className="hover:text-foreground underline">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}