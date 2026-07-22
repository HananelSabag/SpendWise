import { describe, expect, it } from 'vitest';

import {
  applyCardSettingsPatch,
  applyCycleSettingsPatch,
  applyRecurringGroupPatch,
} from '../useCycles';

describe('cycle optimistic cache patches', () => {
  it('changes estimate and engine settings without waiting for a refetch', () => {
    const data = { settings: { engineMode: 'automatic', manualAnchorDay: null, useEstimates: true } };
    expect(applyCycleSettingsPatch(data, { useEstimates: false })).toEqual({
      settings: { engineMode: 'automatic', manualAnchorDay: null, useEstimates: false },
    });
    expect(applyCycleSettingsPatch(data, { engineMode: 'manual', manualAnchorDay: 15 }).settings).toEqual({
      engineMode: 'manual', manualAnchorDay: 15, useEstimates: true,
    });
  });

  it('patches both the current and history cache shapes for a card', () => {
    const card = { source: 'max', accountNumber: '2254', included: true, statementDay: { day: 10, certain: true } };
    const result = applyCardSettingsPatch({ cycle: { cards: [card] }, cycles: [{ cards: [card] }] }, {
      source: 'max', accountNumber: '2254', included: false, statementDay: 15,
    });
    expect(result.cycle.cards[0]).toMatchObject({ included: false, statementDay: { day: 15, certain: true, source: 'user' } });
    expect(result.cycles[0].cards[0].included).toBe(false);
  });

  it('renames and toggles a recurring rule immediately', () => {
    const result = applyRecurringGroupPatch({
      recurringGroups: [{ id: 'group-1', label: 'Old', includeInEstimate: true }],
    }, { groupId: 'group-1', label: 'Mortgage', includeInEstimate: false });
    expect(result.recurringGroups[0]).toMatchObject({ label: 'Mortgage', includeInEstimate: false });
  });
});
