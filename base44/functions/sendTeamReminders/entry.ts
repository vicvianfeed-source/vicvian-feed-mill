import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'manager'].includes(user.role)) {
      return Response.json({ error: 'Only admins and managers can send team reminders' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const target = body.target || 'all'; // 'all' | 'managers' | 'operators'
    const rawMessage = typeof body.custom_message === 'string' ? body.custom_message : '';
    const customMessage = rawMessage.replace(/<[^>]*>/g, '').slice(0, 500);

    const users = await base44.asServiceRole.entities.User.list();

    const managerBody = 'This is your reminder to review and manage the data recorded in AgroMill IMS today — verify sales, service jobs, rentals, purchases and expenses, and keep pricing and inventory up to date.';
    const operatorBody = 'This is your daily reminder to record all sales, services offered, and rentals done today in AgroMill IMS before end of day.';

    const results = [];
    for (const u of users) {
      if (!u.email) continue;
      const isManager = ['admin', 'manager'].includes(u.role);
      if (target === 'managers' && !isManager) continue;
      if (target === 'operators' && isManager) continue;

      const roleBody = isManager ? managerBody : operatorBody;
      const firstName = (u.full_name || '').split(' ')[0] || 'there';
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'AgroMill Team Assistant',
        to: u.email,
        subject: isManager ? 'Reminder: Review today\'s recorded data' : 'Reminder: Record today\'s sales, services and rentals',
        body: `Hi ${firstName},\n\n${roleBody}${customMessage ? `\n\nNote from your team: ${customMessage}` : ''}\n\n— AgroMill Team Assistant`,
      });
      results.push({ email: u.email, role: u.role });
    }

    return Response.json({ success: true, sent_count: results.length, recipients: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});