/**
 * Institution registry — the single source of truth for which bank_source
 * values are real bank accounts (balance, direct debits, income) vs credit
 * card companies (billing-cycle charges, no real bank balance).
 *
 * The mapping is static code rather than a DB column: these are product-level
 * source ids that must match the client and spendwise-agent registries.
 * this is a static code map rather than a DB column — no schema needed for
 * a fixed set of constants.
 *
 * @module config/institutions
 */

const INSTITUTIONS = {
  yahav:          { kind: 'bank',        label: 'Bank Yahav' },
  hapoalim:       { kind: 'bank',        label: 'Bank Hapoalim' },
  leumi:          { kind: 'bank',        label: 'Bank Leumi' },
  mizrahi:        { kind: 'bank',        label: 'Mizrahi Bank' },
  discount:       { kind: 'bank',        label: 'Discount Bank' },
  mercantile:     { kind: 'bank',        label: 'Mercantile Bank' },
  otsar_hahayal:  { kind: 'bank',        label: 'Bank Otsar Hahayal' },
  beinleumi:      { kind: 'bank',        label: 'Beinleumi' },
  massad:         { kind: 'bank',        label: 'Massad' },
  pagi:           { kind: 'bank',        label: 'Pagi' },
  isracard:       { kind: 'credit_card', label: 'Isracard' },
  amex:           { kind: 'credit_card', label: 'Amex' },
  visa_cal:       { kind: 'credit_card', label: 'Visa Cal' },
  max:            { kind: 'credit_card', label: 'Max' },
};

const VALID_SOURCES = Object.keys(INSTITUTIONS);

function institutionKind(bankSource) {
  return INSTITUTIONS[bankSource]?.kind || null;
}

module.exports = { INSTITUTIONS, VALID_SOURCES, institutionKind };
