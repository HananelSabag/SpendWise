const { buildAgentClaimScope, auditDeviceLabel } = require('../services/agentClaimScope');

describe('agent claim privacy scope', () => {
  test('Default Host excludes every user with an active paired device', () => {
    const scope = buildAgentClaimScope({ global: true }, 5);
    expect(scope.scopeClause).toContain('NOT EXISTS');
    expect(scope.scopeClause).toContain("d.status = 'active'");
    expect(scope.params).toEqual([5, 'default-host']);
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

