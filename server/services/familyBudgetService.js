/**
 * familyBudgetService — the household arithmetic, authored on the server.
 *
 * One question drives this whole screen:
 *
 *     income − everything already spoken for = what is left to live on
 *
 * "Already spoken for" is deliberately narrow. It is the money that is committed
 * before the month starts and that they cannot decide against this week:
 * standing charges (`fixed`), loan repayments (`loan`), and money they move to
 * savings on purpose (`savings`). Groceries and fuel (`variable`) are NOT in it —
 * those are what the leftover is FOR, and folding them in would hide the one
 * number the screen exists to show.
 *
 * Two rules that keep the number honest:
 *
 *   1. `family_balances.monthly_contribution` is never subtracted from anything.
 *      A pension or study-fund deposit comes out of the gross salary, so
 *      charging it against a NET salary invents an expense that never happens.
 *      It is displayed as context and nothing more.
 *
 *   2. A loan is counted twice on purpose, in two different places: its monthly
 *      repayment is an outflow this month, and its `outstanding_amount` is a
 *      debt against the household's assets. Those are different questions, and
 *      the totals for them never mix.
 *
 * Everything here is pure — plain arrays in, plain object out — so the tests can
 * pin the arithmetic without a database.
 */

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const JOINT = 'joint';

/** Which bucket a row's owner falls into. NULL owner is "joint", a real answer. */
const ownerKey = (row) => (row.owner_user_id == null ? JOINT : String(row.owner_user_id));

const emptyOwnerBucket = () => ({
  income: 0, fixed: 0, loan: 0, savings: 0, variable: 0,
  committed: 0, available: 0,
});

/**
 * Build the whole picture.
 *
 * @param {Array}  items    rows from family_monthly_items
 * @param {Array}  balances rows from family_balances
 * @param {Array}  members  [{ id, name, email }] — the household allowlist
 */
const summarize = (items = [], balances = [], members = []) => {
  const activeItems = items.filter((row) => row.is_active !== false);
  const activeBalances = balances.filter((row) => row.is_active !== false);

  const sumBy = (rows, kind, field = 'amount') =>
    rows.filter((row) => row.kind === kind)
        .reduce((total, row) => total + (Number(row[field]) || 0), 0);

  const income   = sumBy(activeItems, 'income');
  const fixed    = sumBy(activeItems, 'fixed');
  const loans    = sumBy(activeItems, 'loan');
  const savings  = sumBy(activeItems, 'savings');
  const variable = sumBy(activeItems, 'variable');

  // What is gone before the month starts.
  const committed = fixed + loans + savings;

  // THE number: what is actually left to live on.
  const available = income - committed;

  // And where that lands if the planned variable spend happens as written.
  const projected = available - variable;

  // ── Per person ────────────────────────────────────────────────────────────
  // Answers "how much leaves MY account vs hers" — the reason ownership is on
  // every row. A joint bucket is always present so shared charges are visible
  // rather than silently attributed to someone.
  const byOwner = { [JOINT]: emptyOwnerBucket() };
  for (const member of members) byOwner[String(member.id)] = emptyOwnerBucket();

  for (const row of activeItems) {
    const key = ownerKey(row);
    if (!byOwner[key]) byOwner[key] = emptyOwnerBucket();
    const amount = Number(row.amount) || 0;
    if (row.kind === 'income') byOwner[key].income += amount;
    else if (row.kind === 'fixed') byOwner[key].fixed += amount;
    else if (row.kind === 'loan') byOwner[key].loan += amount;
    else if (row.kind === 'savings') byOwner[key].savings += amount;
    else if (row.kind === 'variable') byOwner[key].variable += amount;
  }

  const people = Object.entries(byOwner).map(([key, bucket]) => {
    const committedForOwner = bucket.fixed + bucket.loan + bucket.savings;
    const member = members.find((m) => String(m.id) === key);
    return {
      key,
      userId: key === JOINT ? null : Number(key),
      name: member ? member.name : null,
      income: round2(bucket.income),
      fixed: round2(bucket.fixed),
      loan: round2(bucket.loan),
      savings: round2(bucket.savings),
      variable: round2(bucket.variable),
      committed: round2(committedForOwner),
      available: round2(bucket.income - committedForOwner),
    };
  });

  // ── What they have, and what they owe ─────────────────────────────────────
  const assetsByKind = {};
  const assetsByOwner = {};
  let assetsTotal = 0;
  let contributionsTotal = 0;

  for (const row of activeBalances) {
    const amount = Number(row.amount) || 0;
    assetsTotal += amount;
    contributionsTotal += Number(row.monthly_contribution) || 0;
    assetsByKind[row.kind] = round2((assetsByKind[row.kind] || 0) + amount);
    const key = ownerKey(row);
    assetsByOwner[key] = round2((assetsByOwner[key] || 0) + amount);
  }

  // Debt is only what they told us is still outstanding. A loan row with a
  // monthly payment but no balance entered contributes to the month and not to
  // the debt total — better an incomplete debt figure than an invented one.
  const debtTotal = activeItems
    .filter((row) => row.kind === 'loan')
    .reduce((total, row) => total + (Number(row.outstanding_amount) || 0), 0);

  const loansMissingBalance = activeItems
    .filter((row) => row.kind === 'loan' && (row.outstanding_amount == null))
    .length;

  return {
    monthly: {
      income: round2(income),
      fixed: round2(fixed),
      loans: round2(loans),
      savings: round2(savings),
      committed: round2(committed),
      available: round2(available),
      variablePlanned: round2(variable),
      projected: round2(projected),
      // Share of income already committed — the "how tight is this?" number.
      committedRatio: income > 0 ? Math.min(1, round2(committed / income)) : null,
    },
    people,
    assets: {
      total: round2(assetsTotal),
      byKind: assetsByKind,
      byOwner: assetsByOwner,
      monthlyContributions: round2(contributionsTotal),
    },
    debt: {
      total: round2(debtTotal),
      loansMissingBalance,
    },
    netWorth: round2(assetsTotal - debtTotal),
    counts: {
      items: items.length,
      activeItems: activeItems.length,
      balances: balances.length,
      activeBalances: activeBalances.length,
    },
  };
};

module.exports = { summarize, round2, JOINT };
