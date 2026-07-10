/**
 * Build the SQL scope and audit label for an agent job claim.
 *
 * The shared Default Host may claim only users who do not have an active
 * personal device. A paired device may claim only its own user's jobs.
 * Keeping this policy in a pure helper makes the privacy boundary directly
 * unit-testable instead of burying it inside an Express route.
 */

function auditDeviceLabel(label, userId) {
  return String(label || userId)
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 80);
}

function buildAgentClaimScope(agentScope, limit) {
  if (agentScope?.global === true) {
    return {
      scopeClause: `AND NOT EXISTS (
        SELECT 1 FROM agent_devices d
        WHERE d.user_id = j2.user_id AND d.status = 'active'
      )`,
      params: [limit, 'default-host'],
    };
  }

  const userId = Number(agentScope?.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Paired agent scope requires a valid user id');
  }

  return {
    scopeClause: 'AND j2.user_id = $3',
    params: [limit, `device:${auditDeviceLabel(agentScope.label, userId)}`, userId],
  };
}

module.exports = { buildAgentClaimScope, auditDeviceLabel };

