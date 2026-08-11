const {
  buildAgentClaimScope,
  auditDeviceLabel,
  DEVICE_STALE_HOURS,
} = require('../services/agentClaimScope');

describe('agent claim privacy scope', () => {
  test('Default Host skips users whose paired device is still reporting', () => {
    const scope = buildAgentClaimScope({ global: true }, 5);
    expect(scope.scopeClause).toContain('NOT EXISTS');
    expect(scope.scopeClause).toContain("d.status = 'active'");
    expect(scope.scopeClause).toContain('last_seen_at');
    expect(scope.params).toEqual([5, 'default-host', String(DEVICE_STALE_HOURS)]);
  });

  test('Default Host may take over an unreachable device ONLY for envelopes it can open', () => {
    // The privacy line: failover is allowed exactly when the ciphertext is
    // already sealed to the shared host's key. A device-sealed connection is
    // never claimed by the shared host, however long that device stays dark.
    const { scopeClause } = buildAgentClaimScope({ global: true }, 5);
    expect(scopeClause).toContain("c2.credentials_sealed_to = 'default-host'");
    const failoverBranch = scopeClause.split('OR (')[1];
    expect(failoverBranch).toContain('credentials_sealed_to');
    expect(failoverBranch).toContain('last_seen_at >');
  });

  test('personal device claims only its own user jobs', () => {
    const scope = buildAgentClaimScope({ userId: 41, label: 'Hananel-PC' }, 3);
    expect(scope.scopeClause).toBe('AND j2.user_id = $3');
    expect(scope.params).toEqual([3, 'device:Hananel-PC', 41]);
  });

  test('rejects an unscoped personal device and sanitizes audit labels', () => {
    expect(() => buildAgentClaimScope({}, 5)).toThrow('valid user id');
    expect(auditDeviceLabel('PC\nfor\tuser', 41)).toBe('PC for user');
  });
});
