import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = `Hello ${user.full_name || user.email},\n\nWe received your request to delete your AgroMill IMS account (${user.email}). Your account and associated personal data will be reviewed and removed by an administrator.\n\nIf you did not make this request, please contact your administrator immediately.`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: 'AgroMill IMS — Account Deletion Request Received',
      body,
    });

    return Response.json({ status: 'sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});