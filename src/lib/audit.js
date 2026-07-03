import { base44 } from "@/api/base44Client";

export async function logAudit({ entityType, entityId, action, oldValue, newValue, description }) {
  try {
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      entity_type: entityType,
      entity_id: entityId || "",
      action,
      changed_by: user?.email || "unknown",
      old_value: oldValue ? JSON.stringify(oldValue) : "",
      new_value: newValue ? JSON.stringify(newValue) : "",
      description: description || "",
    });
  } catch (e) {
    console.warn("Audit log failed", e);
  }
}