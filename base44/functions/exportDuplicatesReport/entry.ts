import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SETTING_KEY = 'duplicates_report_spreadsheet_id';
const SUMMARY_SHEET = 'Summary';
const PAIRS_SHEET = 'Purchase-Expense Pairs';
const DUP_EXPENSES_SHEET = 'Near-Duplicate Expenses';
const DUP_PURCHASES_SHEET = 'Near-Duplicate Purchases';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all purchases and expenses
    const [purchases, expenses] = await Promise.all([
      base44.asServiceRole.entities.Purchase.list('-created_date', 10000),
      base44.asServiceRole.entities.Expense.list('-created_date', 10000),
    ]);

    const procurementExpenses = expenses.filter((e) => e.category === 'procurement');

    // 1) Purchase-Expense pairs: each purchase that auto-generated a matching procurement expense
    const pairs = [];
    for (const p of purchases) {
      const match = procurementExpenses.find((e) =>
        e.amount === p.total_cost &&
        e.date === p.purchase_date &&
        e.description && e.description.includes(p.product_name) &&
        e.description.includes(p.supplier)
      );
      if (match) {
        pairs.push({
          purchase_id: p.id, expense_id: match.id,
          product: p.product_name, supplier: p.supplier,
          quantity: p.quantity, unit: p.unit,
          total_cost: p.total_cost, date: p.purchase_date,
          purchase_created: p.created_date, expense_created: match.created_date,
          recorded_by: p.recorded_by,
        });
      }
    }

    // 2) Near-duplicate expenses: same amount + date (potential double entries)
    const expGroupMap = {};
    for (const e of expenses) {
      const k = e.amount + '||' + e.date;
      if (!expGroupMap[k]) expGroupMap[k] = [];
      expGroupMap[k].push(e);
    }
    const dupExpenseGroups = Object.entries(expGroupMap).filter(([, arr]) => arr.length > 1);
    const dupExpenses = dupExpenseGroups.flatMap(([, arr]) => arr.map((e) => ({
      id: e.id, category: e.category, amount: e.amount, date: e.date,
      description: e.description, payment_method: e.payment_method,
      recorded_by: e.recorded_by, created_date: e.created_date,
      group_size: arr.length,
    })));

    // 3) Near-duplicate purchases: same product + supplier + date
    const purGroupMap = {};
    for (const p of purchases) {
      const k = p.product_name + '||' + p.supplier + '||' + p.purchase_date;
      if (!purGroupMap[k]) purGroupMap[k] = [];
      purGroupMap[k].push(p);
    }
    const dupPurchaseGroups = Object.entries(purGroupMap).filter(([, arr]) => arr.length > 1);
    const dupPurchases = dupPurchaseGroups.flatMap(([, arr]) => arr.map((p) => ({
      id: p.id, product: p.product_name, supplier: p.supplier,
      quantity: p.quantity, unit_cost: p.unit_cost, total_cost: p.total_cost,
      date: p.purchase_date, recorded_by: p.recorded_by, created_date: p.created_date,
      group_size: arr.length,
    })));

    // Build the Google Sheet
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    const authHeaders = { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' };

    const settings = await base44.asServiceRole.entities.AppSetting.filter({ key: SETTING_KEY });
    let spreadsheetId = settings[0] ? settings[0].value : null;
    let spreadsheetUrl = '';

    if (!spreadsheetId) {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          properties: { title: 'Vicvian IMS - Duplicates Report' },
          sheets: [
            { properties: { title: SUMMARY_SHEET } },
            { properties: { title: PAIRS_SHEET } },
            { properties: { title: DUP_EXPENSES_SHEET } },
            { properties: { title: DUP_PURCHASES_SHEET } },
          ],
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) return Response.json({ error: 'Failed to create spreadsheet', details: created }, { status: 500 });
      spreadsheetId = created.spreadsheetId;
      spreadsheetUrl = created.spreadsheetUrl;
      await base44.asServiceRole.entities.AppSetting.create({ key: SETTING_KEY, value: spreadsheetId });
      await base44.asServiceRole.entities.AppSetting.create({ key: 'duplicates_report_spreadsheet_url', value: spreadsheetUrl });
    } else {
      spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId;
    }

    const buildRange = (sheetName) => encodeURIComponent("'" + sheetName + "'!A1:Z10000");

    const clearSheet = async (sheetName) => {
      const range = encodeURIComponent("'" + sheetName + "'!A1:Z10000");
      await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + range + ':clear', {
        method: 'POST', headers: authHeaders,
      });
    };

    const writeSheet = async (sheetName, headerRow, dataRows) => {
      await clearSheet(sheetName);
      const values = [headerRow, ...dataRows];
      const range = encodeURIComponent("'" + sheetName + "'!A1");
      const res = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + range + ':append?valueInputOption=USER_ENTERED',
        { method: 'POST', headers: authHeaders, body: JSON.stringify({ values }) }
      );
      if (!res.ok) {
        const errBody = await res.json();
        throw new Error('Write ' + sheetName + ' failed: ' + JSON.stringify(errBody));
      }
    };

    // Summary sheet
    await writeSheet(SUMMARY_SHEET, ['Metric', 'Count'], [
      ['Total Purchases', purchases.length],
      ['Total Expenses', expenses.length],
      ['Procurement Expenses', procurementExpenses.length],
      ['Purchases with Matching Expense (auto-generated)', pairs.length],
      ['Near-Duplicate Expense Groups', dupExpenseGroups.length],
      ['Near-Duplicate Expense Records', dupExpenses.length],
      ['Near-Duplicate Purchase Groups', dupPurchaseGroups.length],
      ['Near-Duplicate Purchase Records', dupPurchases.length],
      ['Report generated', new Date().toISOString()],
    ]);

    // Purchase-Expense pairs
    await writeSheet(PAIRS_SHEET,
      ['Purchase ID', 'Expense ID', 'Product', 'Supplier', 'Quantity', 'Unit', 'Total Cost', 'Date', 'Purchase Created', 'Expense Created', 'Recorded By'],
      pairs.map((r) => [r.purchase_id, r.expense_id, r.product, r.supplier, r.quantity, r.unit, r.total_cost, r.date, r.purchase_created, r.expense_created, r.recorded_by])
    );

    // Near-duplicate expenses
    await writeSheet(DUP_EXPENSES_SHEET,
      ['ID', 'Category', 'Amount', 'Date', 'Description', 'Payment Method', 'Recorded By', 'Created Date', 'Group Size'],
      dupExpenses.map((r) => [r.id, r.category, r.amount, r.date, r.description, r.payment_method, r.recorded_by, r.created_date, r.group_size])
    );

    // Near-duplicate purchases
    await writeSheet(DUP_PURCHASES_SHEET,
      ['ID', 'Product', 'Supplier', 'Quantity', 'Unit Cost', 'Total Cost', 'Date', 'Recorded By', 'Created Date', 'Group Size'],
      dupPurchases.map((r) => [r.id, r.product, r.supplier, r.quantity, r.unit_cost, r.total_cost, r.date, r.recorded_by, r.created_date, r.group_size])
    );

    // Send email with the spreadsheet link
    const emailBody = 'Hello ' + (user.full_name || user.email) + ',\n\n' +
      'Your Vicvian IMS duplicates report has been generated. Below is a summary:\n\n' +
      '• Total Purchases: ' + purchases.length + '\n' +
      '• Total Expenses: ' + expenses.length + '\n' +
      '• Procurement Expenses: ' + procurementExpenses.length + '\n' +
      '• Purchases with a matching auto-generated expense: ' + pairs.length + '\n' +
      '• Near-duplicate expense groups (same amount + date): ' + dupExpenseGroups.length + ' (' + dupExpenses.length + ' records)\n' +
      '• Near-duplicate purchase groups (same product + supplier + date): ' + dupPurchaseGroups.length + ' (' + dupPurchases.length + ' records)\n\n' +
      'The main duplication pattern: each purchase automatically creates a linked procurement expense, so the same transaction appears in both the Purchases and Expenses sections.\n\n' +
      'Full report (Google Sheet):\n' + spreadsheetUrl + '\n\n— Vicvian IMS';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Vicvian IMS — Duplicates Report',
      body: emailBody,
    });

    return Response.json({
      success: true,
      spreadsheet_url: spreadsheetUrl,
      summary: {
        totalPurchases: purchases.length,
        totalExpenses: expenses.length,
        procurementExpenses: procurementExpenses.length,
        pairs: pairs.length,
        dupExpenseGroups: dupExpenseGroups.length,
        dupExpenses: dupExpenses.length,
        dupPurchaseGroups: dupPurchaseGroups.length,
        dupPurchases: dupPurchases.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}