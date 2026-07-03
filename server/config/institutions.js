/**
 * Institution registry — the single source of truth for which bank_source
 * values are real bank accounts (balance, direct debits, income) vs credit
 * card companies (billing-cycle charges, no real bank balance).
 *
 * Only 5 institutions exist and the mapping never changes at runtime, so
 * this is a static code map rather than a DB column — no schema needed for
 * a fixed set of constants.
 *
 * @module config/institutions
 */

const INSTITUTIONS = {
  yahav:    { kind: 'bank',        label: 'Bank Yahav' },
  leumi:    { kind: 'bank',        label: 'Bank Leumi' },
  discount: { kind: 'bank',        label: 'Discount Bank' },
  isracard: { kind: 'credit_card', label: 'Isracard' },
  max:      { kind: 'credit_card', label: 'Max' },
};

const VALID_SOURCES = Object.keys(INSTITUTIONS);

function institutionKind(bankSource) {
  return INSTITUTIONS[bankSource]?.kind || null;
}

module.exports = { INSTITUTIONS, VALID_SOURCES, institutionKind };
