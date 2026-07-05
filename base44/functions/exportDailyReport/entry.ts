import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SETTING_KEY = 'daily_report_spreadsheet_id';
const SUMMARY_SHEET = 'Daily Sales Summary';
const PNL_SHEET = 'Profit & Loss';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));

    // Authorization: either a logged-in admin/manager, or the scheduled
    // workflow presenting the shared export secret. Everything else is rejected.
    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { user = null; }
    const isPrivilegedUser = user && ['admin', 'manager'].includes(user.role);
    let isWorkflowCall = false;
    if (!isPrivilegedUser && typeof body.secret === 'string' && body.secret.length > 0) {
      const secretSettings = await base44.asServiceRole.entities.AppSetting.filter({ key: 'daily_report_export_secret' });
      isWorkflowCall = !!secretSettings[0]?.value && secretSettings[0].value === body.secret;
    }
    if (!isPrivilegedUser && !isWorkflowCall) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Default: yesterday (the workflow runs just after midnight)
    let targetDate = body.date;
    if (!targetDate) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      targetDate = d.toISOString().slice(0, 10);
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    const authHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Find or create the spreadsheet
    const settings = await base44.asServiceRole.entities.AppSetting.filter({ key: SETTING_KEY });
    let spreadsheetId = settings[0]?.value;
    let spreadsheetUrl = '';

    if (!spreadsheetId) {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          properties: { title: 'AgroMill Daily Reports' },
          sheets: [
            { properties: { title: SUMMARY_SHEET } },
            { properties: { title: PNL_SHEET } },
          ],
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        return Response.json({ error: 'Failed to create spreadsheet', details: created }, { status: 500 });
      }
      spreadsheetId = created.spreadsheetId;
      spreadsheetUrl = created.spreadsheetUrl;

      // Write header rows
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `'${SUMMARY_SHEET}'!A1`,
              values: [['Date', 'Feed Mill Revenue', 'Fish Farm Revenue', 'Rentals Revenue', 'Total Revenue', 'Sales Count', 'Service Jobs', 'New Rentals']],
            },
            {
              range: `'${PNL_SHEET}'!A1`,
              values: [['Date', 'Total Revenue', 'COGS (Procurement)', 'Operating Expenses', 'Net Profit']],
            },
          ],
        }),
      });

      await base44.asServiceRole.entities.AppSetting.create({ key: SETTING_KEY, value: spreadsheetId });
      await base44.asServiceRole.entities.AppSetting.create({ key: 'daily_report_spreadsheet_url', value: spreadsheetUrl });
    } else {
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    }

    // Gather transactions
    const [sales, jobs, rentals, expenses] = await Promise.all([
      base44.asServiceRole.entities.Sale.list('-created_date', 1000),
      base44.asServiceRole.entities.ServiceJob.list('-created_date', 1000),
      base44.asServiceRole.entities.Rental.list('-created_date', 1000),
      base44.asServiceRole.entities.Expense.list('-date', 1000),
    ]);

    // Dates to report: the target date, plus any backdated sale dates that were
    // entered (created) on the target date but belong to an earlier day.
    const dates = new Set([targetDate]);
    if (!body.date) {
      for (const s of sales) {
        const createdOn = (s.created_date || '').slice(0, 10);
        const saleDay = (s.sale_date || '').slice(0, 10);
        if (createdOn === targetDate && saleDay && saleDay !== targetDate) dates.add(saleDay);
      }
    }

    const computeDay = (date) => {
      const onDate = (iso) => (iso || '').slice(0, 10) === date;
      const daySales = sales.filter((s) => onDate(s.sale_date || s.created_date) && s.status !== 'void');
      const dayJobs = jobs.filter((j) => onDate(j.created_date) && j.status !== 'void');
      const dayRentals = rentals.filter((r) => r.start_date === date);
      const dayExpenses = expenses.filter((e) => e.date === date);

      const sum = (arr, f) => Math.round(arr.reduce((s, x) => s + (f(x) || 0), 0) * 100) / 100;
      const feedMillRev = sum(daySales.filter((s) => s.domain === 'feed_mill'), (s) => s.total) + sum(dayJobs, (j) => j.total);
      const fishFarmRev = sum(daySales.filter((s) => s.domain === 'fish_farm'), (s) => s.total);
      const rentalRev = sum(dayRentals, (r) => r.total_charge);
      const totalRev = Math.round((feedMillRev + fishFarmRev + rentalRev) * 100) / 100;
      const cogs = sum(dayExpenses.filter((e) => e.category === 'procurement'), (e) => e.amount);
      const opex = sum(dayExpenses.filter((e) => e.category !== 'procurement'), (e) => e.amount);
      const net = Math.round((totalRev - cogs - opex) * 100) / 100;
      return { feedMillRev, fishFarmRev, rentalRev, totalRev, cogs, opex, net, salesCount: daySales.length, jobsCount: dayJobs.length, rentalsCount: dayRentals.length };
    };

    // Upsert a row keyed by date: update the existing row for that date, else append.
    const upsertRow = async (sheetName, date, row) => {
      const colRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${sheetName}'!A:A`)}`,
        { headers: authHeaders }
      );
      const colData = await colRes.json();
      if (!colRes.ok) throw new Error(`Read ${sheetName} failed: ${JSON.stringify(colData)}`);
      const rows = colData.values || [];
      const idx = rows.findIndex((r) => (r[0] || '').slice(0, 10) === date);
      if (idx >= 0) {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${sheetName}'!A${idx + 1}`)}?valueInputOption=USER_ENTERED`,
          { method: 'PUT', headers: authHeaders, body: JSON.stringify({ values: [row] }) }
        );
        if (!res.ok) throw new Error(`Update ${sheetName} failed: ${JSON.stringify(await res.json())}`);
      } else {
        const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${sheetName}'!A1`)}:append?valueInputOption=USER_ENTERED`,
          { method: 'POST', headers: authHeaders, body: JSON.stringify({ values: [row] }) }
        );
        if (!res.ok) throw new Error(`Append to ${sheetName} failed: ${JSON.stringify(await res.json())}`);
      }
    };

    const reported = {};
    for (const date of [...dates].sort()) {
      const d = computeDay(date);
      await upsertRow(SUMMARY_SHEET, date, [date, d.feedMillRev, d.fishFarmRev, d.rentalRev, d.totalRev, d.salesCount, d.jobsCount, d.rentalsCount]);
      await upsertRow(PNL_SHEET, date, [date, d.totalRev, d.cogs, d.opex, d.net]);
      reported[date] = { feedMillRev: d.feedMillRev, fishFarmRev: d.fishFarmRev, rentalRev: d.rentalRev, totalRev: d.totalRev, cogs: d.cogs, opex: d.opex, net: d.net };
    }

    return Response.json({
      success: true,
      dates: Object.keys(reported),
      spreadsheet_url: spreadsheetUrl,
      summary: reported,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});