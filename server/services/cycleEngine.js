/**
 * cycleEngine — the single, pure financial-cycle engine.
 *
 * Provider-agnostic and I/O-free: feed it normalized transactions, get back charge
 * events, per-card statements, bank reconciliation and cycle windows. One field decides
 * all cash timing — `processedDate`, the day the money actually hits the bank. Spending-cycle
 * attribution can attach a monthly close-out to the cycle containing most of its purchases;
 * that never changes the provider's bank date.
 *
 * Validated to the agora against real bank debits: see FINANCIAL_CYCLE_SPEC.md §7 and
 * `server/scripts/verify-cycle-engine.js`.
 *
 * Normalized transaction shape (both the scraper output and our DB rows map onto it):
 *   { source, accountNumber, amount (signed: negative = money out), date (purchase),
 *     processedDate (bank-hit day), status?: 'completed'|'pending', description?, ... }
 *
 * @module services/cycleEngine
 */

const IL_TZ = 'Asia/Jerusalem';
const AMOUNT_EPSILON = 0.01;
const MIN_STATEMENT_CONFIDENCE = 0.5;

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Asia/Jerusalem calendar date as 'YYYY-MM-DD'. Raw provider dates are Israel-local
 * midnight serialized to UTC (2026-07-09T21:00Z = Israel 2026-07-10), so bucketing in
 * UTC lands every statement a day off.
 */
function ilDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-CA', { timeZone: IL_TZ });
}

function ilDayOfMonth(value) {
  const s = ilDate(value);
  return s ? Number(s.slice(8, 10)) : null;
}

/** Shift an ISO 'YYYY-MM-DD' by whole months, clamping to end-of-month. */
function addMonths(isoDate, months) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(d, lastDay));
  return base.toISOString().slice(0, 10);
}

/** A not-yet-final authorization: no money has moved, so it must stay out of settled sums. */
function isPending(txn) {
  return Boolean(txn.status && txn.status !== 'completed') || !Number(txn.amount);
}

/**
 * How a card's charges reach the bank. Detected from the data, never assumed:
 *   aggregated  — credit card: every charge sharing a `processedDate` settles as ONE bank
 *                 line (the monthly statement, and same-day immediate charges too).
 *   passthrough — debit card (כרטיס דביט): each charge hits the bank on its own as its own
 *                 line, so there is no monthly bill to aggregate.
 */
const SETTLEMENT_MODES = { AGGREGATED: 'aggregated', PASSTHROUGH: 'passthrough' };

/**
 * Group one card's settled transactions into charge events.
 * PROVEN (§7): in `aggregated` mode an event's total equals exactly one bank settlement
 * line on that date; in `passthrough` mode each transaction is its own event and matches
 * its own bank line 1:1.
 */
function buildChargeEvents(txns, { mode = SETTLEMENT_MODES.AGGREGATED } = {}) {
  const settled = txns.filter((t) => !isPending(t) && ilDate(t.processedDate));

  if (mode === SETTLEMENT_MODES.PASSTHROUGH) {
    return settled
      .map((txn) => ({
        chargeDate: ilDate(txn.processedDate),
        total: round2(txn.amount),
        count: 1,
        txns: [txn],
      }))
      .sort((a, b) => a.chargeDate.localeCompare(b.chargeDate));
  }

  const byDate = new Map();
  for (const txn of settled) {
    const chargeDate = ilDate(txn.processedDate);
    if (!byDate.has(chargeDate)) byDate.set(chargeDate, { chargeDate, total: 0, count: 0, txns: [] });
    const event = byDate.get(chargeDate);
    event.total += Number(txn.amount) || 0;
    event.count += 1;
    event.txns.push(txn);
  }
  return [...byDate.values()]
    .map((e) => ({ ...e, total: round2(e.total) }))
    .sort((a, b) => a.chargeDate.localeCompare(b.chargeDate));
}

/**
 * Decide a card's settlement mode by trying both against the real bank lines and keeping
 * whichever actually reconciles more of the card's transactions. Pure evidence — no brand
 * text, no institution table, so it works for a provider we have never seen.
 */
function detectSettlementMode(cardTxns, bankTxns, { asOf = new Date() } = {}) {
  const today = ilDate(asOf);
  const coverageFor = (mode) => {
    const events = buildChargeEvents(cardTxns, { mode }).filter((e) => e.chargeDate <= today);
    if (!events.length) return { mode, coverage: 0, matchedTxns: 0, totalTxns: 0 };
    const { matched } = reconcile(bankTxns, events);
    const matchedTxns = matched.reduce((sum, m) => sum + m.event.count, 0);
    const totalTxns = events.reduce((sum, e) => sum + e.count, 0);
    return { mode, coverage: totalTxns ? round2(matchedTxns / totalTxns) : 0, matchedTxns, totalTxns };
  };

  const aggregated = coverageFor(SETTLEMENT_MODES.AGGREGATED);
  const passthrough = coverageFor(SETTLEMENT_MODES.PASSTHROUGH);
  const winner = passthrough.coverage > aggregated.coverage ? passthrough : aggregated;
  return { mode: winner.mode, coverage: winner.coverage, aggregated, passthrough };
}

/**
 * Detect a card's monthly statement day = the day-of-month carrying the most charges.
 * `certain` is false for cards with no monthly bill at all (debit cards, where every txn
 * settles on its own day) — the caller must then ask the user to link a charge rather
 * than guess (SPEC §5 link 2, §10 "link a charge").
 */
function detectStatementDay(txns, { minConfidence = MIN_STATEMENT_CONFIDENCE } = {}) {
  const settled = txns.filter((t) => !isPending(t) && ilDate(t.processedDate));
  if (!settled.length) return { day: null, confidence: 0, sampleSize: 0, certain: false };

  const tally = new Map();
  for (const txn of settled) {
    const day = ilDayOfMonth(txn.processedDate);
    tally.set(day, (tally.get(day) || 0) + 1);
  }

  let day = null;
  let best = 0;
  for (const [candidate, count] of tally) {
    if (count > best) { best = count; day = candidate; }
  }
  const confidence = best / settled.length;
  return {
    day,
    confidence: round2(confidence),
    sampleSize: settled.length,
    certain: confidence >= minConfidence,
  };
}

/**
 * Label a charge event for presentation. The money mechanics are identical either way
 * (every event is one bank debit); the class only explains WHY it landed when it did.
 *   statement (מחזור חיוב) — lands on the card's monthly statement day
 *   immediate (חיוב מיידי) — lands on its own day, typically a foreign purchase
 * `future` marks charges the provider has already scheduled ahead (deferred purchases and
 * installments): they belong to that future window, never to the current one.
 */
function classifyChargeEvent(event, { statementDay, asOf = new Date() } = {}) {
  const isStatement = Boolean(statementDay) && ilDayOfMonth(event.chargeDate) === statementDay;
  return {
    ...event,
    class: isStatement ? 'statement' : 'immediate',
    future: event.chargeDate > ilDate(asOf),
  };
}

/**
 * SPEC §11 — only whole cycles count. A statement bills roughly the month of purchases
 * before it, so the earliest statement we can see is truncated by the scrape window and
 * under-counts. Mark it `partial` and keep it out of totals instead of showing a number
 * that is quietly wrong.
 */
function markPartialStatements(events, txns) {
  const purchaseDates = txns.map((t) => ilDate(t.date)).filter(Boolean).sort();
  const earliestPurchase = purchaseDates[0] || null;
  return events.map((event) => {
    if (event.class !== 'statement' || !earliestPurchase) return { ...event, partial: false };
    const windowStart = addMonths(event.chargeDate, -1);
    return { ...event, partial: earliestPurchase > windowStart };
  });
}

/**
 * Everything known about one card: how it settles, its statement day, its charge events
 * (classified, partial-flagged) and its settled/pending split. Pass `bankTxns` to let the
 * settlement mode be detected from evidence rather than assumed. A passthrough card has no
 * monthly bill, so it gets no statement day — every charge is its own immediate debit.
 */
function buildCardView(txns, {
  asOf = new Date(),
  minConfidence = MIN_STATEMENT_CONFIDENCE,
  bankTxns = null,
  mode = SETTLEMENT_MODES.AGGREGATED,
} = {}) {
  const settlement = bankTxns
    ? detectSettlementMode(txns, bankTxns, { asOf })
    : { mode, coverage: null };

  const statementDay = settlement.mode === SETTLEMENT_MODES.PASSTHROUGH
    ? { day: null, confidence: 0, sampleSize: txns.length, certain: false }
    : detectStatementDay(txns, { minConfidence });

  const events = buildChargeEvents(txns, { mode: settlement.mode })
    .map((e) => classifyChargeEvent(e, { statementDay: statementDay.certain ? statementDay.day : null, asOf }));

  return {
    settlement,
    statementDay,
    events: markPartialStatements(events, txns),
    pending: txns.filter(isPending),
  };
}

/**
 * Match card charge events to the bank's settlement lines by amount + Asia/Jerusalem date.
 * Never by brand text: it is only a label and it lies ("לאומי ויזה" is a Max card,
 * "כרטיסי אשראי" is CAL). Matched bank lines are the same money as the card's itemized
 * charges, so callers suppress them from cash-flow totals — that is what kills the
 * double-count while keeping the per-card breakdown.
 */
function reconcile(bankTxns, chargeEvents) {
  const candidates = bankTxns.map((txn, index) => ({
    index,
    txn,
    date: ilDate(txn.processedDate || txn.date),
    amount: round2(txn.amount),
  }));
  const used = new Set();
  const matched = [];
  const unmatchedEvents = [];

  for (const event of chargeEvents) {
    const hit = candidates.find(
      (c) => !used.has(c.index) && c.date === event.chargeDate
        && Math.abs(c.amount - event.total) <= AMOUNT_EPSILON,
    );
    if (hit) {
      used.add(hit.index);
      matched.push({ event, bankTxn: hit.txn });
    } else {
      unmatchedEvents.push(event);
    }
  }

  return {
    matched,
    unmatchedEvents,
    unmatchedBank: candidates.filter((c) => !used.has(c.index)).map((c) => c.txn),
  };
}

/** Literal bank-date window: [salaryDate, nextSalaryDate). Card-spend attribution is below. */
function inWindow(hitDate, { start, end }) {
  const date = ilDate(hitDate);
  return Boolean(date) && date >= start && date < end;
}

/**
 * Representative spending date for one indivisible monthly statement. Use the amount-weighted
 * median purchase date, so the cycle containing most of the bill owns its total and breakdown.
 * Installments are current-period payments even when the original purchase is old, so their
 * effective date remains the provider's processed/statement date.
 */
function statementAttributionDate(event) {
  const points = (event?.txns || [])
    .map((txn) => ({
      date: txn.installments ? event.chargeDate : ilDate(txn.date),
      weight: Math.abs(Number(txn.amount) || 0),
    }))
    .filter((point) => point.date && point.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!points.length) return event?.chargeDate || null;

  const midpoint = points.reduce((sum, point) => sum + point.weight, 0) / 2;
  let cumulative = 0;
  for (const point of points) {
    cumulative += point.weight;
    if (cumulative >= midpoint) return point.date;
  }
  return points[points.length - 1].date;
}

/**
 * Monthly statements follow the spending they close; immediate/debit movements follow the exact
 * day they hit the bank. Bank movement itself always remains chronological.
 */
function inCardAttributionWindow(event, window) {
  if (!event?.chargeDate) return false;
  if (event.class !== 'statement') return inWindow(event.chargeDate, window);

  const chargeDate = ilDate(event.chargeDate);
  const attributionDate = statementAttributionDate(event);
  if (!chargeDate || !attributionDate || chargeDate < window.start) return false;

  // A statement can close the window it hits in or the immediately preceding salary window.
  // Never let an old original purchase reopen a cycle from two months ago.
  if (chargeDate >= addMonths(window.end, 1)) return false;

  if (inWindow(chargeDate, window)) {
    return attributionDate >= window.start;
  }
  return chargeDate >= window.end && attributionDate < window.end;
}

/** Collapse a provider description so the same payer matches across months. */
function normalizeDescription(text) {
  return String(text || '')
    .replace(/[‎‏]/g, '')
    .replace(/["'`.,\-*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Find the user's salary payments using their confirmed signature (SPEC §5 link 1). We
 * never guess salary from text patterns — the user linked one transaction, and that
 * identity is what we match. Returns oldest-first.
 */
function findSalaryEvents(bankTxns, signature) {
  if (!signature || !signature.normalizedDescription) return [];
  const target = normalizeDescription(signature.normalizedDescription);
  return bankTxns
    .filter((t) => Number(t.amount) > 0 && !isPending(t))
    .filter((t) => normalizeDescription(t.description).includes(target))
    .map((t) => ({ date: ilDate(t.processedDate || t.date), amount: round2(t.amount), txn: t }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Turn salary payments into cycle windows: [salary N, salary N+1). The final window runs
 * to the *projected* next salary (same day-of-month next month), because the running cycle
 * has not closed yet.
 */
function buildWindows(salaryEvents, { asOf = new Date() } = {}) {
  if (!salaryEvents.length) return [];
  return salaryEvents.map((salary, i) => {
    const next = salaryEvents[i + 1];
    const end = next ? next.date : addMonths(salary.date, 1);
    return {
      index: i,
      start: salary.date,
      end,
      salary,
      projectedEnd: !next,
      running: !next && ilDate(asOf) < end,
    };
  });
}

/** Whole days between two 'YYYY-MM-DD' dates (b − a). */
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/**
 * Is the salary in? Salary is the anchor of the whole cycle, so the user must never be left
 * wondering. Pay days drift: a salary due on a Friday or Saturday lands a day or two off and
 * that is normal, so `toleranceDays` absorbs the weekend rather than crying wolf.
 *
 * status: scheduled — not due yet
 *         due       — due now / within tolerance, still fine
 *         late      — past tolerance ⇒ tell the user "your salary hasn't come in yet"
 *         unknown   — nothing linked yet, so we cannot track anything
 */
function trackSalary(bankTxns, signature, { asOf = new Date(), toleranceDays = 3 } = {}) {
  const events = findSalaryEvents(bankTxns, signature);
  if (!events.length) return { status: 'unknown', events: [] };

  const last = events[events.length - 1];
  const expectedNext = addMonths(last.date, 1);
  const today = ilDate(asOf);
  const drift = daysBetween(expectedNext, today);
  const typicalAmount = round2(events.reduce((s, e) => s + e.amount, 0) / events.length);

  let status = 'scheduled';
  if (drift > toleranceDays) status = 'late';
  else if (drift >= 0) status = 'due';

  return {
    status,
    events,
    last,
    expectedNext,
    expectedDay: ilDayOfMonth(last.date),
    typicalAmount,
    daysLate: status === 'late' ? drift : 0,
    daysUntil: drift < 0 ? -drift : 0,
    toleranceDays,
  };
}

/**
 * The salary stopped — but did the job change, or did something break?
 *
 * When the linked salary is late and a *new* credit of comparable size showed up on roughly
 * the same day of the month, the likeliest story is a new employer. We never switch the
 * anchor on our own: this is a suggestion the user confirms, exactly like every other credit
 * call (§3e). Real case in the data: "גלש\"ן שווקים" ends 09/06, "הורייזן טכנו" starts 09/07.
 */
function detectSalaryChange(bankTxns, signature, {
  asOf = new Date(),
  toleranceDays = 3,
  dayWindow = 5,
  minRatio = 0.5,
  maxRatio = 2.5,
  cards = [],
  excludeTxns = [],
} = {}) {
  const tracked = trackSalary(bankTxns, signature, { asOf, toleranceDays });
  if (tracked.status !== 'late') return { suspected: false, tracked, candidates: [] };

  const target = normalizeDescription(signature && signature.normalizedDescription);
  // Borrowed money is never a new job. Pass `cards` so spread credits are ruled out too: a
  // spread lands near pay day and is in the same ballpark as a salary, so without this it
  // masquerades as a new employer (real false positive: ₪12,805.22 "פריסה לתשלומים").
  const skip = new Set(excludeTxns);
  deriveLoans(bankTxns).forEach((l) => bankTxns
    .filter((t) => String(t.identifier) === l.identifier && Number(t.amount) > 0)
    .forEach((t) => skip.add(t)));
  if (cards.length) {
    const events = cards
      .filter((c) => (c.txns || []).length)
      .flatMap((c) => buildCardView(c.txns, { bankTxns, asOf }).events)
      .filter((e) => !e.future);
    findSettlementReversals(bankTxns.filter((t) => Number(t.amount) > 0 && !isPending(t)), events)
      .forEach((r) => skip.add(r.creditTxn));
  }

  const candidates = bankTxns
    .filter((t) => Number(t.amount) > 0 && !isPending(t) && !skip.has(t))
    .filter((t) => !target || !normalizeDescription(t.description).includes(target))
    .filter((t) => ilDate(t.processedDate || t.date) > tracked.last.date)
    .map((t) => ({ txn: t, date: ilDate(t.processedDate || t.date), amount: round2(t.amount) }))
    .filter((c) => {
      const ratio = c.amount / tracked.typicalAmount;
      if (ratio < minRatio || ratio > maxRatio) return false;
      const dayGap = Math.abs(ilDayOfMonth(c.date) - tracked.expectedDay);
      return Math.min(dayGap, 31 - dayGap) <= dayWindow;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    suspected: candidates.length > 0,
    tracked,
    candidates,
    reason: candidates.length ? 'salary_late_but_similar_income_arrived' : 'salary_late_no_replacement',
  };
}

/**
 * A bank credit that exactly reverses a card bill — e.g. "פריסה לתשלומים", where the user
 * spreads a bill into installments and the bank credits the whole thing back. The pair nets
 * to zero for the cycle: the bill did not cost money this window; the installments land in
 * future windows on their own dates.
 *
 * Matched on exact amount and proximity, never on description text. `creditPool` must
 * already exclude credits that reconcile to a card (a debit-card refund is the card's own
 * money coming back, not a reversal of some other bill), otherwise a refund "cancels"
 * itself. `maxDaysApart` is deliberately tight: a real spread lands within a day or two,
 * and a wider window starts matching coincidences (a ₪1,500 Bit transfer nine days after a
 * ₪1,500 statement is not a reversal).
 */
function findSettlementReversals(creditPool, chargeEvents, { maxDaysApart = 3 } = {}) {
  const bills = chargeEvents.filter((e) => Number(e.total) < 0);
  const reversals = [];
  for (const event of bills) {
    const hit = creditPool.find((c) => {
      if (isPending(c) || Number(c.amount) <= 0) return false;
      if (reversals.some((r) => r.creditTxn === c)) return false;
      if (Math.abs(round2(c.amount) - Math.abs(event.total)) > AMOUNT_EPSILON) return false;
      const creditDate = ilDate(c.processedDate || c.date);
      if (!creditDate || creditDate < event.chargeDate) return false;
      return (new Date(creditDate) - new Date(event.chargeDate)) / 86400000 <= maxDaysApart;
    });
    if (hit) {
      reversals.push({
        event,
        creditTxn: hit,
        amount: Math.abs(event.total),
        daysApart: Math.round((new Date(ilDate(hit.processedDate || hit.date)) - new Date(event.chargeDate)) / 86400000),
      });
    }
  }
  return reversals;
}

const sumAmounts = (items, pick = (x) => x.amount) => round2(items.reduce((s, x) => s + (Number(pick(x)) || 0), 0));

/** The next calendar date landing on `dayOfMonth` strictly after `afterDate`, clamped to short months. */
function nextOccurrence(dayOfMonth, afterDate) {
  const [y, m] = afterDate.split('-').map(Number);
  for (let bump = 0; bump <= 2; bump += 1) {
    const probe = new Date(Date.UTC(y, m - 1 + bump, 1));
    const lastDay = new Date(Date.UTC(probe.getUTCFullYear(), probe.getUTCMonth() + 1, 0)).getUTCDate();
    probe.setUTCDate(Math.min(dayOfMonth, lastDay));
    const iso = probe.toISOString().slice(0, 10);
    if (iso > afterDate) return iso;
  }
  return null;
}

/**
 * What is still coming before the next salary — the whole point of a cycle view: "the loan
 * hits on the 26th, insurance on the 1st, and all of it lands before you get paid again".
 *
 * Only projects series we have already proven exist. A family can hold more than one rhythm
 * (insurance `42209` bills on BOTH the 1st and the 10th), so each recurring day-of-month is
 * projected separately — projecting only "last date + 1 month" silently loses the other half.
 * Card charges inside the current salary window are not projected: the provider already told us
 * their real future dates (§2), so we use those rather than invent them. The separately labelled
 * post-salary forecast is built by `estimateNextCardBills` and never enters this settled total.
 */
function projectUpcoming({
  window,
  asOf = new Date(),
  loans = [],
  recurring = [],
  futureCardEvents = [],
  salaryTracking = null,
} = {}) {
  const today = ilDate(asOf);
  const items = [];

  for (const loan of loans) {
    const date = nextOccurrence(loan.paymentDay, today);
    if (date && inWindow(date, window)) {
      items.push({ kind: 'loan', date, amount: -Math.abs(loan.lastPaymentAmount), label: loan.description || 'loan', identifier: loan.identifier, certainty: 'proven' });
    }
  }

  for (const series of recurring) {
    // Each distinct day this series recurs on is its own rhythm.
    const dayCounts = new Map();
    for (const d of series.dates) {
      const day = Number(d.slice(8, 10));
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }
    for (const [day, count] of dayCounts) {
      if (count < 2) continue;
      const date = nextOccurrence(day, today);
      if (date && inWindow(date, window)) {
        items.push({ kind: 'recurring', date, amount: -Math.abs(series.typicalAmount), label: series.description, identifier: series.identifier, certainty: 'estimated' });
      }
    }
  }

  for (const event of futureCardEvents) {
    if (inWindow(event.chargeDate, window)) {
      items.push({ kind: 'card', date: event.chargeDate, amount: event.total, label: `${event.source} ${event.accountNumber}`, certainty: 'proven' });
    }
  }

  if (salaryTracking && salaryTracking.expectedNext && salaryTracking.status !== 'unknown'
      && inWindow(salaryTracking.expectedNext, window) && salaryTracking.expectedNext > today) {
    items.push({ kind: 'salary', date: salaryTracking.expectedNext, amount: salaryTracking.typicalAmount, label: 'salary', certainty: 'estimated' });
  }

  items.sort((a, b) => a.date.localeCompare(b.date));
  return { items, total: sumAmounts(items) };
}

/** Calendar date for a statement day on or after an ISO boundary. */
function statementDateOnOrAfter(day, boundary) {
  if (!Number.isInteger(Number(day)) || !boundary) return null;
  const [year, month] = String(boundary).slice(0, 10).split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const candidate = `${year}-${String(month).padStart(2, '0')}-${String(Math.min(Number(day), lastDay)).padStart(2, '0')}`;
  return candidate >= boundary ? candidate : addMonths(candidate, 1);
}

/**
 * Forecast the first aggregated card bills after the next salary boundary.
 *
 * The provider gives us the amount already assigned to that future statement, but more
 * purchases can still join it. Until the bank actually charges the bill, use the larger of
 * (a) the amount already known and (b) the average of up to three recent complete statements.
 * Debit/passthrough cards are excluded because they have no monthly bill.
 */
function estimateNextCardBills(cardViews, { afterDate, asOf = new Date(), historySize = 3 } = {}) {
  const today = ilDate(asOf);
  const bills = [];

  for (const card of cardViews || []) {
    const view = card.view || card;
    if (view.settlement?.mode === SETTLEMENT_MODES.PASSTHROUGH) continue;
    if (!view.statementDay?.certain || !view.statementDay.day) continue;

    const chargeDate = statementDateOnOrAfter(view.statementDay.day, afterDate);
    if (!chargeDate) continue;
    const statements = (view.events || []).filter((event) => event.class === 'statement');
    const knownEvent = statements.find((event) => event.chargeDate === chargeDate);
    const knownAmount = round2(Math.abs(Number(knownEvent?.total || 0)));
    const history = statements
      .filter((event) => !event.partial && event.chargeDate < chargeDate && event.chargeDate <= today)
      .sort((a, b) => b.chargeDate.localeCompare(a.chargeDate))
      .slice(0, historySize);
    const historicalAverage = history.length
      ? round2(history.reduce((sum, event) => sum + Math.abs(Number(event.total || 0)), 0) / history.length)
      : 0;
    const estimatedAmount = round2(Math.max(knownAmount, historicalAverage));

    if (!estimatedAmount && !knownAmount) continue;
    bills.push({
      source: card.source,
      accountNumber: card.accountNumber,
      chargeDate,
      knownAmount,
      knownCount: Number(knownEvent?.count || 0),
      historicalAverage,
      historyCount: history.length,
      estimatedAmount,
      certainty: knownEvent && knownAmount >= historicalAverage ? 'known' : 'estimated',
    });
  }

  bills.sort((a, b) => a.chargeDate.localeCompare(b.chargeDate));
  return {
    bills,
    knownTotal: round2(bills.reduce((sum, bill) => sum + bill.knownAmount, 0)),
    estimatedTotal: round2(bills.reduce((sum, bill) => sum + bill.estimatedAmount, 0)),
  };
}

/**
 * Group bank transactions by the provider's `identifier`. Leumi reuses one identifier across
 * a whole related series — a loan and every repayment of it, a salary from one employer, a
 * standing order, a card's settlements. That makes it a far stronger key than description
 * text, and it is the provider's own truth rather than our guess.
 * Families of one are dropped: a lone identifier says nothing.
 */
function buildIdentifierFamilies(txns) {
  const families = new Map();
  for (const txn of txns) {
    if (isPending(txn) || txn.identifier === undefined || txn.identifier === null) continue;
    const key = String(txn.identifier);
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(txn);
  }
  for (const [key, list] of families) {
    if (list.length < 2) families.delete(key);
    else list.sort((a, b) => ilDate(a.processedDate || a.date).localeCompare(ilDate(b.processedDate || b.date)));
  }
  return families;
}

/**
 * Derive real loans straight from the scraped data — no manual entry, no scraper changes.
 * A loan is an identifier family holding a disbursement (money in) plus repayments (money
 * out) of the same series, so principal, amount repaid and what is still outstanding are all
 * arithmetic. Proven: identifier 2158001 = ₪25,000 drawn 21/04 with 3 repayments ⇒ ~₪21,914.65
 * outstanding; 3926001 = ₪16,000 drawn 10/06.
 *
 * Leumi's "פריסה לתשלומים" (spreading a card bill) is the same shape: the credit that cancels
 * the bill opens a series, and next month's repayments arrive under that identifier — so the
 * spread turns into a tracked loan on its own, without asking the user anything.
 */
function deriveLoans(bankTxns) {
  const loans = [];
  for (const [identifier, family] of buildIdentifierFamilies(bankTxns)) {
    const disbursements = family.filter((t) => Number(t.amount) > 0);
    const payments = family.filter((t) => Number(t.amount) < 0);
    if (!disbursements.length || !payments.length) continue;

    const principal = sumAmounts(disbursements);
    const repaid = Math.abs(sumAmounts(payments));
    loans.push({
      identifier,
      principal,
      disbursedOn: ilDate(disbursements[0].processedDate || disbursements[0].date),
      payments: payments.map((t) => ({ date: ilDate(t.processedDate || t.date), amount: round2(t.amount), txn: t })),
      paymentCount: payments.length,
      repaid: round2(repaid),
      outstanding: round2(principal - repaid),
      paymentDay: ilDayOfMonth(payments[payments.length - 1].processedDate || payments[payments.length - 1].date),
      lastPaymentAmount: round2(payments[payments.length - 1].amount),
      description: (disbursements[0].description || '').trim(),
    });
  }
  return loans.sort((a, b) => b.principal - a.principal);
}

/**
 * Identifier families that only ever take money out on a monthly rhythm: a loan whose
 * disbursement predates our history, an insurance standing order, a subscription. We can
 * prove the series exists and predict its next hit, but NOT what it is or what is left to
 * pay — so these are exactly the candidates to hand the user for a fixed-charge link
 * (SPEC §5 link 3): confirm what it is, and for a loan, how many payments remain.
 */
function deriveRecurringCharges(bankTxns, { knownLoanIds = [], excludeTxns = [] } = {}) {
  const known = new Set(knownLoanIds.map(String));
  const skip = excludeTxns instanceof Set ? excludeTxns : new Set(excludeTxns);
  const recurring = [];
  for (const [identifier, family] of buildIdentifierFamilies(bankTxns)) {
    if (known.has(identifier)) continue;
    if (family.some((t) => Number(t.amount) > 0)) continue;
    if (family.length < 2) continue;
    // Never ask the user to label money the engine already explains — a card settlement or a
    // debit-card line is the card's own charges wearing the bank's label.
    if (family.some((t) => skip.has(t))) continue;

    const amounts = family.map((t) => Math.abs(Number(t.amount)));
    const dates = family.map((t) => ilDate(t.processedDate || t.date));
    recurring.push({
      identifier,
      description: (family[0].description || '').trim(),
      occurrences: family.length,
      dates,
      typicalAmount: round2(amounts.reduce((s, a) => s + a, 0) / amounts.length),
      lastAmount: round2(amounts[amounts.length - 1]),
      lastDate: dates[dates.length - 1],
      // The day it lands each month — what lets us project it into the running cycle.
      paymentDay: ilDayOfMonth(family[family.length - 1].processedDate || family[family.length - 1].date),
      needsUserLabel: true,
    });
  }
  return recurring.sort((a, b) => b.typicalAmount - a.typicalAmount);
}

/**
 * Build one financial cycle — the only number the user actually feels.
 *
 * Money is counted exactly once. The card's itemized charges ARE the expense; every bank
 * line they settle as (the monthly bill, an immediate charge, a debit-card line) is
 * suppressed, because it is the same money wearing the bank's label. What survives is
 * genuine direct bank activity: salary, loans, standing orders, cash, transfers.
 *
 * Anything we cannot prove is NOT guessed — it lands in `unclassified` for the user to
 * label (SPEC §5, §10). Income counts only what the user confirmed (their salary
 * signature); loan disbursements and settlement reversals never masquerade as income.
 *
 * @param {Object}   input
 * @param {Array}    input.bankTxns  normalized bank-account transactions
 * @param {Array}    input.cards     [{ source, accountNumber, txns }]
 * @param {Object}   input.window    { start, end } from buildWindows()
 * @param {Object}   [input.salarySignature] { normalizedDescription }
 * @param {Array}    [input.fixedCharges]    [{ normalizedDescription, label }] loans / הוראות קבע
 * @param {Array}    [input.creditClassifications] the user's stored answers about what a credit
 *   is — [{ transactionId?, identifier?, txn?, class: 'income'|'financing' }]. Answered once, remembered
 *   forever: this is how a provider whose behaviour we have never seen gets handled correctly
 *   without guessing on its behalf.
 */
function buildCycle({
  bankTxns = [],
  cards = [],
  window,
  asOf = new Date(),
  salarySignature = null,
  fixedCharges = [],
  creditClassifications = [],
} = {}) {
  const cardViews = cards
    .filter((c) => (c.txns || []).length)
    .map((c) => ({ ...c, view: buildCardView(c.txns, { bankTxns, asOf }) }));

  const allEvents = cardViews.flatMap((cv) => cv.view.events.map((e) => ({
    ...e, source: cv.source, accountNumber: cv.accountNumber,
  })));
  const settledEvents = allEvents.filter((e) => !e.future);

  // Card money already accounted for → suppress the bank's copy of it.
  const { matched, unmatchedEvents } = reconcile(bankTxns, settledEvents);
  const suppressed = new Set(matched.map((m) => m.bankTxn));
  const reconciledEvents = new Set(matched.map((m) => m.event));

  // A spread bill is NOT cancelled out of existence. The bill genuinely came due (real
  // spending, now owed), and the credit is genuinely borrowed money. Netting the pair away
  // would hide a ₪12,805 bill from the user entirely; showing both tells the true story —
  // "your bill came due, you borrowed to cover it, your account didn't move, you owe more".
  // Only credits that are not already a card's own money are eligible to be a reversal.
  const reversalPool = bankTxns.filter((t) => !suppressed.has(t) && Number(t.amount) > 0);
  const reversals = findSettlementReversals(reversalPool, settledEvents);

  const direct = bankTxns.filter((t) => !suppressed.has(t) && !isPending(t));
  const hitDate = (t) => ilDate(t.processedDate || t.date);
  const within = (t) => inWindow(hitDate(t), window);
  const cardEventWithin = (event) => inCardAttributionWindow(event, window);

  const salaryTarget = salarySignature && normalizeDescription(salarySignature.normalizedDescription);
  const isSalary = (t) => Boolean(salaryTarget) && normalizeDescription(t.description).includes(salaryTarget);
  const fixedFor = (t) => fixedCharges.find(
    (f) => normalizeDescription(t.description).includes(normalizeDescription(f.normalizedDescription)),
  );

  /**
   * Borrowed money is never income — but deciding what a credit *is* runs on three levels,
   * because a provider's own linkage is not something we can count on (Leumi does NOT share
   * an identifier between a card bill and its "פריסה לתשלומים" credit, and identifier
   * semantics differ per instrument even inside one bank).
   *
   *   proven    — a loan-family disbursement: repayments exist under the same identifier,
   *               so it is arithmetic, not opinion. Never ask.
   *   suggested — a credit that exactly reverses a recent bill. A strong hint from ONE
   *               observed case, so it is a pre-filled question, not a verdict.
   *   asked     — anything else unusual: the user tags it once and we remember, which is how
   *               a provider we have never seen gets handled without us guessing.
   * Default for a suggestion is the suggestion itself (usually right, and flagged), so the
   * headline is sane while it awaits one tap.
   */
  const loans = deriveLoans(bankTxns);
  const provenFinancing = new Set(loans.flatMap((l) => bankTxns.filter(
    (t) => String(t.identifier) === l.identifier && Number(t.amount) > 0,
  )));
  const classOf = (txn) => {
    const hit = creditClassifications.find((c) => (
      (c.transactionId !== undefined && Number(c.transactionId) === Number(txn.id))
      || (c.identifier !== undefined && String(c.identifier) === String(txn.identifier))
      || (c.txn && c.txn === txn)
    ));
    return hit ? hit.class : null;
  };
  const suggestedFinancing = new Map(reversals.map((r) => [r.creditTxn, r]));

  const financingTxns = new Set();
  const review = [];
  for (const txn of bankTxns) {
    if (Number(txn.amount) <= 0 || isPending(txn) || suppressed.has(txn)) continue;
    const confirmed = classOf(txn);
    if (confirmed) {
      if (confirmed === 'financing') financingTxns.add(txn);
      continue;
    }
    if (provenFinancing.has(txn)) { financingTxns.add(txn); continue; }
    const hint = suggestedFinancing.get(txn);
    if (hint) {
      financingTxns.add(txn);
      review.push({
        txn,
        amount: round2(txn.amount),
        suggestion: 'financing',
        reason: 'matches_recent_bill',
        matchedBill: { chargeDate: hint.event.chargeDate, total: hint.event.total, source: hint.event.source, accountNumber: hint.event.accountNumber },
        daysApart: hint.daysApart,
        confirmed: false,
        matchedEvent: hint.event,
      });
    }
  }

  const cardCharges = settledEvents.filter(
    (e) => reconciledEvents.has(e) && !e.partial && cardEventWithin(e),
  );
  const credits = direct.filter((t) => Number(t.amount) > 0 && within(t));
  const debits = direct.filter((t) => Number(t.amount) < 0 && within(t));

  // Money in is income (Bit, Paybox, grants, interest are ordinary transactions) — everything
  // except borrowing.
  const salary = credits.filter(isSalary);
  const otherIncome = credits.filter((t) => !isSalary(t) && !financingTxns.has(t));
  const financingIn = bankTxns.filter((t) => {
    if (!financingTxns.has(t)) return false;
    const linkedBill = suggestedFinancing.get(t)?.event;
    return linkedBill ? cardEventWithin(linkedBill) : within(t);
  });
  const taggedDebits = debits.map((t) => ({ txn: t, amount: round2(t.amount), fixedCharge: fixedFor(t) || null }));

  const incomeTotal = round2(sumAmounts(salary) + sumAmounts(otherIncome));
  const cardTotal = Math.abs(sumAmounts(cardCharges, (e) => e.total));
  const directTotal = Math.abs(sumAmounts(debits));
  const expensesTotal = round2(cardTotal + directTotal);
  const operatingNet = round2(incomeTotal - expensesTotal);
  const financingTotal = sumAmounts(financingIn);
  // Literal account movement by bank-hit date. Close-out attribution can move a statement
  // (and its linked spread credit) to the previous spending cycle, but never rewrites the bank.
  const bankMovement = sumAmounts(bankTxns.filter((txn) => !isPending(txn) && within(txn)));
  const timingAdjustment = round2(bankMovement - operatingNet - financingTotal);
  const salaryTracking = salarySignature ? trackSalary(bankTxns, salarySignature, { asOf }) : null;
  const nextCardForecast = window.running
    ? {
        salaryDate: salaryTracking?.expectedNext || window.end,
        salaryAmount: round2(salaryTracking?.typicalAmount || window.salary.amount || 0),
        ...estimateNextCardBills(cardViews, { afterDate: window.end, asOf }),
      }
    : null;

  return {
    window,
    income: {
      salary: { total: sumAmounts(salary), items: salary },
      other: { total: sumAmounts(otherIncome), items: otherIncome },
      total: incomeTotal,
    },
    expenses: {
      cards: { total: cardTotal, events: cardCharges },
      direct: { total: directTotal, items: taggedDebits },
      total: expensesTotal,
    },
    /**
     * Three lines that are all true at once:
     *   operatingNet  — attributed salary-cycle income vs spending.
     *   financing     — borrowing attributed to the spending it funded.
     *   bankMovement  — literal bank movement inside [salary date, next salary date).
     * A close-out statement just after salary belongs to the previous spending cycle, while
     * bankMovement keeps its real hit date. `timingAdjustment` is that bridge, not another fee.
     */
    operatingNet,
    financing: { total: financingTotal, items: financingIn, loans },
    bankMovement,
    timingAdjustment,
    net: operatingNet,
    /**
     * Credits the engine cannot prove — each carries a pre-filled `suggestion` so the user
     * answers with one tap instead of being interrogated. Answer once; it is remembered, and
     * a spread whose repayments later appear becomes a proven loan family and stops asking.
     */
    needsReview: review.filter((r) => (
      r.matchedEvent
        ? cardEventWithin(r.matchedEvent)
        : inWindow(ilDate(r.txn.processedDate || r.txn.date), window)
    )),
    /**
     * For a running cycle: what is still expected before the next salary, and where the cycle
     * is heading. Labelled an estimate (שערוך) — never mixed into the settled numbers.
     */
    projection: (() => {
      if (!window.running) return null;
      const upcoming = projectUpcoming({
        window,
        asOf,
        loans,
        recurring: deriveRecurringCharges(bankTxns, {
          knownLoanIds: loans.map((l) => l.identifier),
          excludeTxns: suppressed,
        }),
        futureCardEvents: allEvents.filter((e) => e.future),
        salaryTracking,
      });
      return {
        upcoming: upcoming.items,
        upcomingTotal: upcoming.total,
        projectedOperatingNet: round2(operatingNet + upcoming.total),
        estimate: true,
      };
    })(),
    // Forward-looking cash point: today's balance can be projected through the next salary
    // and the first card statements after it without counting a bill that already left.
    nextCardForecast,
    // Transparency: what the engine deliberately did not count in THIS window, and why.
    reversals: reversals.filter((r) => cardEventWithin(r.event)),
    partials: settledEvents.filter((e) => e.partial && cardEventWithin(e)),
    upcoming: allEvents.filter((e) => e.future),
    // A completed card event without a matching bank movement is evidence, not spend. Counting
    // it would violate the strongest invariant: bankMovement must equal the real account delta.
    // Keep it visible for review and count it only after the bank confirms it.
    unreconciledCardEvents: unmatchedEvents.filter(
      (event) => !event.partial && cardEventWithin(event),
    ),
    cards: cardViews.map((cv) => ({
      source: cv.source,
      accountNumber: cv.accountNumber,
      settlement: cv.view.settlement,
      statementDay: cv.view.statementDay,
    })),
  };
}

module.exports = {
  ilDate,
  ilDayOfMonth,
  addMonths,
  isPending,
  normalizeDescription,
  buildChargeEvents,
  detectSettlementMode,
  detectStatementDay,
  classifyChargeEvent,
  markPartialStatements,
  buildCardView,
  reconcile,
  daysBetween,
  findSalaryEvents,
  trackSalary,
  detectSalaryChange,
  buildWindows,
  findSettlementReversals,
  buildIdentifierFamilies,
  deriveLoans,
  deriveRecurringCharges,
  nextOccurrence,
  projectUpcoming,
  estimateNextCardBills,
  buildCycle,
  inWindow,
  statementAttributionDate,
  inCardAttributionWindow,
  SETTLEMENT_MODES,
  MIN_STATEMENT_CONFIDENCE,
};
