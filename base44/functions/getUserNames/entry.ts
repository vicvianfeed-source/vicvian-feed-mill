import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const users = await base44.asServiceRole.entities.User.list();
    const nameMap = {};
    for (const u of users) {
      if (u.email) nameMap[u.email.toLowerCase()] = u.full_name || u.email;
    }
    return Response.json({ nameMap });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});