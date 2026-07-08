import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, Printer } from "lucide-react";
import AccessDenied from "@/components/common/AccessDenied";
import { normalizeRole } from "@/lib/permissions";

export default function BusinessPlan() {
  const { user } = useOutletContext();
  const role = normalizeRole(user?.role);
  const [plan, setPlan] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("generateBusinessPlan", {});
      setPlan(res.data?.business_plan || "");
      setTitle(res.data?.title || "Business Plan");
    } catch (e) {
      setError(e.message || "Failed to generate business plan");
    }
    setLoading(false);
  };

  useEffect(() => { generate(); }, []);

  if (role !== "admin" && role !== "manager") {
    return <AccessDenied />;
  }

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-slate-500" /> Business Plan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-generated strategic plan with cross-segment sustainability & circular economy model
          </p>
        </div>
        <div className="flex gap-2">
          {plan && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Print / PDF
            </Button>
          )}
          <Button variant="outline" onClick={generate} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Regenerate
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-4">
          <div className="h-8 bg-slate-200 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6" />
          <p className="text-sm text-slate-500 pt-4">
            Analyzing operational data and generating a comprehensive business plan with sustainability framework...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-8 text-center">
          <p className="text-rose-600 font-medium">Failed to generate business plan</p>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
          <Button className="mt-4" onClick={generate}>Try Again</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-10 print:border-0 print:shadow-none print:p-0">
          <div className="max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-6 first:mt-0 border-b border-slate-200 pb-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-900 mb-3 mt-6" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-4" {...props} />,
                p: ({ node, ...props }) => <p className="text-sm text-slate-700 leading-relaxed mb-3" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 mb-3" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1 mb-3" {...props} />,
                li: ({ node, ...props }) => <li className="text-sm text-slate-700" {...props} />,
                table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="w-full text-sm border border-slate-200" {...props} /></div>,
                th: ({ node, ...props }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-800" {...props} />,
                td: ({ node, ...props }) => <td className="border border-slate-200 px-3 py-2 text-slate-700" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-3" {...props} />,
              }}
            >
              {plan}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}