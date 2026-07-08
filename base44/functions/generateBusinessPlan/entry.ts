import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'manager'].includes(user.role)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const [sales, expenses, products, purchases, rentals, services, production, orders] = await Promise.all([
      base44.entities.Sale.list('-created_date', 500),
      base44.entities.Expense.list('-created_date', 500),
      base44.entities.Product.list('-created_date', 500),
      base44.entities.Purchase.list('-created_date', 500),
      base44.entities.Rental.list('-created_date', 500),
      base44.entities.ServiceJob.list('-created_date', 500),
      base44.entities.ProductionBatch.list('-created_date', 500),
      base44.entities.CustomerOrder.list('-created_date', 200),
    ]);

    const totalRevenue = sales.filter(s => s.status !== 'void').reduce((sum, s) => sum + Number(s.total || 0), 0)
      + services.filter(s => s.status !== 'void').reduce((sum, s) => sum + Number(s.total || 0), 0)
      + rentals.reduce((sum, r) => sum + Number(r.total_charge || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const purchaseCosts = purchases.reduce((sum, p) => sum + Number(p.total_cost || 0), 0);

    const productsByDomain = {};
    products.forEach(p => {
      const d = p.domain || 'unknown';
      if (!productsByDomain[d]) productsByDomain[d] = { count: 0, totalStock: 0, lowStock: 0, avgPrice: 0, totalPrice: 0 };
      productsByDomain[d].count++;
      productsByDomain[d].totalStock += Number(p.stock_quantity || 0);
      productsByDomain[d].totalPrice += Number(p.current_price || 0);
      if (p.stock_quantity <= (p.low_stock_threshold || 0)) productsByDomain[d].lowStock++;
    });
    Object.keys(productsByDomain).forEach(d => {
      productsByDomain[d].avgPrice = productsByDomain[d].count > 0 ? productsByDomain[d].totalPrice / productsByDomain[d].count : 0;
    });

    const expensesByCategory = {};
    expenses.forEach(e => {
      const c = e.category || 'other';
      expensesByCategory[c] = (expensesByCategory[c] || 0) + Number(e.amount || 0);
    });

    const salesByProduct = {};
    sales.filter(s => s.status !== 'void').forEach(s => {
      const name = s.product_name || 'Unknown';
      if (!salesByProduct[name]) salesByProduct[name] = { qty: 0, revenue: 0 };
      salesByProduct[name].qty += Number(s.quantity || 0);
      salesByProduct[name].revenue += Number(s.total || 0);
    });

    const customerStats = {};
    [...sales.filter(s => s.status !== 'void'), ...services.filter(s => s.status !== 'void')].forEach(r => {
      const name = r.customer_name || 'Walk-in';
      if (!customerStats[name]) customerStats[name] = { revenue: 0, orders: 0 };
      customerStats[name].revenue += Number(r.total || 0);
      customerStats[name].orders++;
    });
    const topCustomers = Object.entries(customerStats).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);

    const walkInPct = totalRevenue > 0
      ? ((customerStats['Walk-in']?.revenue || customerStats['walk-in']?.revenue || 0) / totalRevenue * 100).toFixed(1)
      : '0';

    const businessData = {
      businessName: "Vicvian Feed Mill",
      currency: "Nigerian Naira (₦)",
      summary: {
        totalRevenue, totalExpenses, purchaseCosts,
        netProfit: totalRevenue - totalExpenses - purchaseCosts,
        totalSales: sales.length, totalServiceJobs: services.length,
        totalRentals: rentals.length, totalProducts: products.length,
        totalPurchases: purchases.length, totalProductionBatches: production.length,
        totalOrders: orders.length,
      },
      productsByDomain, expensesByCategory,
      topSellingProducts: Object.entries(salesByProduct).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10),
      topCustomers,
      walkInDependency: walkInPct + '% of revenue comes from walk-in customers',
    };

    const prompt = `You are a senior Business Development Executive and Business Intelligence Agent. Using the operational data below, prepare a COMPLETE and THOROUGHLY DESIGNED BUSINESS PLAN for Vicvian Feed Mill, an agricultural business in Nigeria with three segments: Feed Mill, Fish Farm, and Equipment Rental.

CRITICAL REQUIREMENT: The business plan MUST have SUSTAINABILITY entrenched into its foundation — not as an add-on. The three segments must be designed to SUPPORT EACH OTHER in a circular economy model:
- Feed mill produces feed for the fish farm (internal supply chain)
- Fish farm waste/byproducts feed back into feed mill ingredients (fish meal, bone meal)
- Rental equipment supports both feed mill and fish farm operations
- Revenue from one segment funds expansion of others
- Resource sharing (labor, transport, storage, energy)

Address the CURRENT FINANCIAL SITUATION using the actual numbers. Include a clear TURNAROUND STRATEGY if the business is loss-making.

OPERATIONAL DATA:
${JSON.stringify(businessData, null, 2)}

Structure the business plan with these sections:
1. Executive Summary
2. Business Description & Vision
3. Market Analysis (use web context for Nigerian feed mill, aquaculture, and agricultural equipment rental market data)
4. Organizational Structure & Management
5. The Three Business Segments (detailed analysis of each: Feed Mill, Fish Farm, Rental)
6. Cross-Segment Synergy & Circular Economy Model (DETAILED — this is the core of the plan)
7. Sustainability Framework (environmental, economic, social sustainability)
8. Products & Services Strategy
9. Marketing & Customer Strategy
10. Operations Plan
11. Financial Plan & Turnaround Strategy (12-month and 3-year projections)
12. Risk Management
13. Implementation Roadmap (90-day, 6-month, 12-month milestones)
14. Key Performance Indicators (KPIs)

Be extremely detailed, specific, and actionable. Use actual numbers from the data. Provide specific naira figures, percentages, and timelines. Reference actual top products and real operational gaps.

Format the output as clean Markdown with proper headers (##, ###), bullet points, tables where appropriate, and bold text for emphasis.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          business_plan: { type: "string" },
          title: { type: "string" },
        },
        required: ["business_plan", "title"],
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});