import { describe, expect, it } from 'vitest';

import { normalizeUserData } from '../userNormalizer';

/**
 * This normaliser REBUILDS the user object field by field, so anything the
 * server sends that is not named here is thrown away. That is how the Family Hub
 * shipped invisible: the API answered `familyHub: true`, the flag was dropped on
 * the way into the store, and the nav entry it gates never rendered.
 *
 * These tests pin the flags the UI actually keys off.
 */

describe('client userNormalizer', () => {
  it('keeps the server-computed Family Hub flag', () => {
    expect(normalizeUserData({ id: 1, familyHub: true }).familyHub).toBe(true);
    expect(normalizeUserData({ id: 2, familyHub: false }).familyHub).toBe(false);
  });

  it('treats a missing flag as "not a member" rather than undefined', () => {
    expect(normalizeUserData({ id: 3 }).familyHub).toBe(false);
  });

  it('never infers membership from anything but the flag', () => {
    // A truthy-looking value from somewhere else must not open the door; the
    // server is the only thing that decides this.
    expect(normalizeUserData({ id: 4, familyHub: 'yes' }).familyHub).toBe(false);
    expect(normalizeUserData({ id: 5, role: 'super_admin' }).familyHub).toBe(false);
  });

  it('still carries the role flags the rest of the app gates on', () => {
    const admin = normalizeUserData({ id: 6, role: 'super_admin' });
    expect(admin.isAdmin).toBe(true);
    expect(admin.isSuperAdmin).toBe(true);
  });
});
