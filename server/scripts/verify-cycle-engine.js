/**
 * verify-cycle-engine — runs the pure cycleEngine against the agent's RAW scraped data
 * and reconciles every card charge against the real bank debits.
 *
 * This is the regression oracle for FINANCIAL_CYCLE_SPEC.md §7: recent (complete)
 * statements must reconcile to zero against the bank. A non-zero delta on a complete
 * statement is a real bug. Read-only — it never touches the DB or the network.
 *
 * Usage:  node server/scripts/verify-cycle-engine.js
 *         RAW_DIR=/path/to/scraped-data node server/scripts/verify-cycle-engine.js
 */

const fs = require('fs');
const path = require('path');
const engine = require('../services/cycleEngine');

const RAW_DIR = process.env.RAW_DIR
  || path.resolve(__dirname, '../../../spendwise-agent/scraped-data');

const nis = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

/** Map israeli-bank-scrapers output onto the engine's normalized shape. */
function loadRaw(file, source) {
  const full = path.join(RAW_DIR, file);
  if (!fs.existsSync(full)) return null;
  const accounts = Object.values(JSON.parse(fs.readFileSync(full, 'utf8')));
  return accounts.map((account) => ({
    source,
    accountNumber: String(account.accountNumber),
    balance: account.balance,
    txns: (account.txns || []).map((t) => ({
      source,
      accountNumber: String(account.accountNumber),
      amount: Number(t.chargedAmount) || 0,
      date: t.date,
      processedDate: t.processedDate,
      status: t.status,
      originalCurrency: t.originalCurrency,
      description: t.description,
      identifier: t.identifier,
    })),
  }));
}

/** SPEC §7 — the proven numbers. [source, card, chargeDate, expectedTotal, mustMatchBank] */
const FIXTURE = [
  ['max', '2254', '2026-07-10', -12805.22, true],
  ['max', '2254', '2026-06-10', -14213.34, true],
  ['max', '2254', '2026-05-10', -9468.19, false], // partial: truncated backfill
  ['visa_cal', '9962', '2026-07-10', -2665.20, true],
  ['visa_cal', '9962', '2026-06-10', -4734.66, true],
  ['visa_cal', '9962', '2026-05-10', -1500.00, false], // partial
];

const EXPECTED_STATEMENT_DAY = [
  ['max', '2254', 10, true],
  ['visa_cal', '9962', 10, true],
  ['max', '8345', null, false], // debit card: no monthly statement, must NOT be guessed
];

/** Settlement mode must be detected from the bank evidence. [source, card, expectedMode] */
const EXPECTED_SETTLEMENT_MODE = [
  ['max', '2254', 'aggregated'], // credit card: same-day charges settle as one bank line
  ['visa_cal', '9962', 'aggregated'],
  ['max', '8345', 'passthrough'], // כרטיס דביט: every charge is its own bank line
];

const failures = [];
const check = (label, ok, detail) => {
  if (!ok) failures.push(`${label} — ${detail}`);
  return ok ? 'PASS' : 'FAIL';
};

function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`RAW_DIR not found: ${RAW_DIR}\nSet RAW_DIR to the agent's scraped-data folder.`);
    process.exit(2);
  }

  const bankAccounts = loadRaw('raw-leumi-user-1.json', 'leumi') || [];
  const bankTxns = bankAccounts.flatMap((a) => a.txns);
  const cards = [
    ...(loadRaw('raw-max-user-1.json', 'max') || []),
    ...(loadRaw('raw-visa_cal-user-1.json', 'visa_cal') || []),
  ];

  const views = new Map();
  console.log('=== per-card view (settlement mode + statement day + charge events) ===');
  for (const card of cards) {
    if (!card.txns.length) continue;
    const view = engine.buildCardView(card.txns, { bankTxns });
    views.set(`${card.source}:${card.accountNumber}`, { card, view });
    const sd = view.statementDay;
    const st = view.settlement;
    console.log(`\n${card.source} ${card.accountNumber} — settles: ${st.mode} (coverage ${st.coverage}; aggregated ${st.aggregated.coverage} vs passthrough ${st.passthrough.coverage})`);
    console.log(`   statement day: ${sd.certain ? sd.day : 'none / UNCERTAIN (ask user to link)'} (confidence ${sd.confidence}, n=${sd.sampleSize})`);
    for (const e of view.events.slice(0, 24)) {
      const tags = [e.class, e.future ? 'future' : null, e.partial ? 'PARTIAL' : null].filter(Boolean).join('/');
      console.log(`   ${e.chargeDate}  ${String(e.count).padStart(3)} txns  ${nis(e.total).padStart(11)}   [${tags}]`);
    }
    if (view.events.length > 24) console.log(`   … ${view.events.length - 24} more events`);
  }

  console.log('\n=== reconciliation vs real bank debits (Leumi) ===');
  for (const [key, { view }] of views) {
    const { matched, unmatchedEvents } = engine.reconcile(bankTxns, view.events.filter((e) => !e.future));
    console.log(`\n${key}: matched ${matched.length} / ${matched.length + unmatchedEvents.length} charge events against the bank`);
    for (const e of unmatchedEvents) {
      console.log(`   UNMATCHED  ${e.chargeDate}  ${nis(e.total)}  [${e.class}${e.partial ? '/PARTIAL — expected, truncated backfill' : ''}]`);
    }
  }

  console.log('\n=== FIXTURE CHECKS (SPEC §7) ===');
  for (const [source, card, chargeDate, expected, mustMatchBank] of FIXTURE) {
    const entry = views.get(`${source}:${card}`);
    const event = entry && entry.view.events.find((e) => e.chargeDate === chargeDate);
    const gotTotal = event ? event.total : null;
    const okTotal = event && Math.abs(gotTotal - expected) <= 0.01;
    console.log(`${check(`${source} ${card} ${chargeDate} total`, okTotal, `expected ${nis(expected)}, got ${nis(gotTotal)}`)}  ${source} ${card} ${chargeDate}  engine=${nis(gotTotal)}  expected=${nis(expected)}`);

    if (event) {
      const { matched } = engine.reconcile(bankTxns, [event]);
      const didMatch = matched.length === 1;
      const label = `${source} ${card} ${chargeDate} bank-match`;
      if (mustMatchBank) {
        console.log(`${check(label, didMatch, 'complete statement must reconcile to the bank')}  └─ bank reconciliation: ${didMatch ? 'exact match ✓' : 'NO MATCH'}`);
      } else {
        console.log(`      └─ bank reconciliation: ${didMatch ? 'matched' : 'no match (expected — partial/truncated backfill)'}  partial=${event.partial}`);
      }
    }
  }

  console.log('\n=== SETTLEMENT-MODE DETECTION (from bank evidence) ===');
  for (const [source, card, expectedMode] of EXPECTED_SETTLEMENT_MODE) {
    const entry = views.get(`${source}:${card}`);
    if (!entry) { console.log(`SKIP ${source} ${card} (no raw data)`); continue; }
    const got = entry.view.settlement.mode;
    console.log(`${check(`${source} ${card} settlement mode`, got === expectedMode, `expected ${expectedMode}, got ${got}`)}  ${source} ${card}: ${got} (coverage ${entry.view.settlement.coverage})`);
  }

  console.log('\n=== STATEMENT-DAY DETECTION ===');
  for (const [source, card, expectedDay, expectedCertain] of EXPECTED_STATEMENT_DAY) {
    const entry = views.get(`${source}:${card}`);
    if (!entry) { console.log(`SKIP ${source} ${card} (no raw data)`); continue; }
    const sd = entry.view.statementDay;
    const ok = sd.certain === expectedCertain && (!expectedCertain || sd.day === expectedDay);
    console.log(`${check(`${source} ${card} statement day`, ok, `expected day=${expectedDay} certain=${expectedCertain}, got day=${sd.day} certain=${sd.certain}`)}  ${source} ${card}: day=${sd.day} certain=${sd.certain} confidence=${sd.confidence}`);
  }

  // ---- Phase 2: salary-anchored cycles -------------------------------------------------
  console.log('\n=== FINANCIAL CYCLES (salary-anchored) ===');
  const asOf = new Date('2026-07-16T12:00:00Z');
  const salaryEvents = [
    ...engine.findSalaryEvents(bankTxns, { normalizedDescription: 'גלשן שווקים' }),
    ...engine.findSalaryEvents(bankTxns, { normalizedDescription: 'הורייזן טכנו' }),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const windows = engine.buildWindows(salaryEvents, { asOf });
  const fixedCharges = [
    { normalizedDescription: 'פרעון הלוואה', label: 'loan' },
    { normalizedDescription: 'טפחות ס.ביטו', label: 'insurance' },
  ];

  const cycles = windows.map((w) => engine.buildCycle({
    bankTxns,
    cards,
    window: w,
    asOf,
    salarySignature: { normalizedDescription: w.salary.txn.description },
    fixedCharges,
  }));

  for (const c of cycles) {
    console.log(`\n  ${c.window.start} → ${c.window.end}${c.window.running ? '  [RUNNING]' : ''}`);
    console.log(`    income ${nis(c.income.total).padStart(11)}   expenses ${nis(-c.expenses.total).padStart(11)}`);
    console.log(`    operating net ${nis(c.operatingNet).padStart(11)}   financing ${nis(c.financing.total).padStart(11)}   → bank movement ${nis(c.bankMovement).padStart(11)}`);
    c.reversals.forEach((r) => console.log(`    ↩ bill ${nis(r.amount)} spread into a loan ("${r.creditTxn.description}", ${r.daysApart}d later)`));
    c.partials.forEach((p) => console.log(`    ⚠ partial excluded ${p.chargeDate} ${nis(p.total)}`));
  }

  /**
   * The strongest invariant we have: whatever the model says moved through the account must
   * equal what actually moved. Computed independently here — just sum every settled bank
   * transaction in the window. If these ever diverge, the engine is lying about money.
   * (The oldest window is exempt: its card statement is truncated by the scrape boundary.)
   */
  console.log('\n  --- invariant: model bank movement == real bank movement ---');
  for (const c of cycles) {
    if (c.partials.length) {
      console.log(`      SKIP ${c.window.start} (partial statement in window — see §11)`);
      continue;
    }
    const real = bankTxns
      .filter((t) => engine.inWindow(t.processedDate || t.date, c.window) && !engine.isPending(t))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const ok = Math.abs(c.bankMovement - real) <= 0.02;
    console.log(`${check(`bank movement ${c.window.start}`, ok, `model ${nis(c.bankMovement)} vs real ${nis(real)}`)}  ${c.window.start}: model ${nis(c.bankMovement)} == real ${nis(real)}`);
  }

  const running = cycles.find((c) => c.window.running);
  check('running cycle exists', Boolean(running), 'no running cycle built from salary events');
  if (running) {
    console.log('\n  --- running-cycle checks ---');
    console.log(`${check('running cycle salary', Math.abs(running.income.salary.total - 13327.75) <= 0.01, `expected 13,327.75, got ${nis(running.income.salary.total)}`)}  salary = ${nis(running.income.salary.total)}`);
    // The July Max bill was spread into installments: the bank credited it straight back,
    // so it must NOT be charged to this cycle.
    const spread = running.reversals.find((r) => Math.abs(r.amount - 12805.22) <= 0.01);
    console.log(`${check('spread bill reversed', Boolean(spread), 'the 12,805.22 bill + its "פריסה לתשלומים" credit must net to zero')}  reversal detected = ${Boolean(spread)}`);
    // Guard the false positives that a loose matcher produced: a Bit transfer must never
    // "reverse" a statement, and a debit-card refund must never cancel itself.
    const bogus = cycles.flatMap((c) => c.reversals).filter((r) => r.daysApart > 3 || Math.abs(r.amount) < 100);
    console.log(`${check('no bogus reversals', bogus.length === 0, `found ${bogus.length}: ${bogus.map((b) => nis(b.amount)).join(', ')}`)}  bogus reversals = ${bogus.length}`);
    // A loan disbursement is cash, not income — it must never inflate the headline.
    const loanAsIncome = cycles.some((c) => c.income.items && c.income.items.some((t) => String(t.description).includes('הלואה')));
    console.log(`${check('loan not counted as income', !loanAsIncome, 'a loan disbursement leaked into income')}  loan-as-income = ${loanAsIncome}`);
  }

  // ---- Loans derived from the provider's identifier ------------------------------------
  // ---- Salary tracking, job change, projection -----------------------------------------
  console.log('\n=== SALARY TRACKING & JOB CHANGE ===');
  const current = engine.trackSalary(bankTxns, { normalizedDescription: 'הורייזן טכנו' }, { asOf });
  console.log(`${check('current salary tracked', current.status === 'scheduled' && current.expectedNext === '2026-08-09', `expected scheduled/2026-08-09, got ${current.status}/${current.expectedNext}`)}  current: ${current.status}, next ${current.expectedNext} (in ${current.daysUntil}d)`);

  const oldSalary = engine.trackSalary(bankTxns, { normalizedDescription: 'גלשן שווקים' }, { asOf });
  console.log(`${check('stopped salary flagged late', oldSalary.status === 'late' && oldSalary.daysLate === 7, `expected late/7d, got ${oldSalary.status}/${oldSalary.daysLate}d`)}  previous employer: ${oldSalary.status}, ${oldSalary.daysLate}d late`);

  // The real job change in this data: גלש"ן שווקים ends 09/06, הורייזן טכנו starts 09/07.
  const change = engine.detectSalaryChange(bankTxns, { normalizedDescription: 'גלשן שווקים' }, { asOf, cards });
  const onlyNewEmployer = change.candidates.length === 1 && change.candidates[0].txn.description.includes('הורייזן');
  console.log(`${check('job change detected, financing excluded', change.suspected && onlyNewEmployer, `expected exactly 1 candidate (הורייזן), got ${change.candidates.length}: ${change.candidates.map((c) => c.txn.description.trim()).join(', ')}`)}  suspected=${change.suspected}, candidates=${change.candidates.map((c) => `${c.txn.description.trim()} ${nis(c.amount)}`).join(' | ')}`);

  // Salary gone with nothing to replace it ⇒ warn, never invent a new employer.
  const noReplacement = engine.detectSalaryChange(
    bankTxns.filter((t) => !String(t.description).includes('הורייזן')),
    { normalizedDescription: 'גלשן שווקים' }, { asOf, cards },
  );
  console.log(`${check('missing salary warns without inventing a job', !noReplacement.suspected && noReplacement.reason === 'salary_late_no_replacement', `got suspected=${noReplacement.suspected}, reason=${noReplacement.reason}`)}  no-replacement case → ${noReplacement.reason}`);
  console.log(`${check('healthy salary raises no alarm', !engine.detectSalaryChange(bankTxns, { normalizedDescription: 'הורייזן טכנו' }, { asOf, cards }).suspected, 'a current salary must never look like a job change')}  healthy salary → no alarm`);

  console.log('\n=== PROJECTION (running cycle) ===');
  const proj = running && running.projection;
  if (proj) {
    proj.upcoming.forEach((i) => console.log(`  ${i.date}  ${nis(i.amount).padStart(11)}  ${i.label}  [${i.kind}/${i.certainty}]`));
    console.log(`  upcoming total ${nis(proj.upcomingTotal)}  →  projected end-of-cycle ${nis(proj.projectedOperatingNet)} (from ${nis(running.operatingNet)} today)`);
    const loanDue = proj.upcoming.find((i) => i.date === '2026-07-26');
    // Insurance bills on BOTH the 1st and the 10th under one identifier; projecting only
    // "last + 1 month" would jump to 10/08 (outside the window) and lose the 01/08 hit.
    const insuranceFirst = proj.upcoming.find((i) => i.date === '2026-08-01');
    console.log(`${check('projects the loan due on the 26th', Boolean(loanDue), 'the ~1,098 loan payment on 26/07 must be projected')}  loan on 26/07 projected`);
    console.log(`${check('projects each rhythm in a series', Boolean(insuranceFirst), 'insurance hits the 1st AND the 10th — the 01/08 occurrence must not be lost')}  insurance on 01/08 projected`);
  }

  // ---- Classification is the user's, reconciliation is not negotiable --------------------
  console.log('\n=== CREDIT CLASSIFICATION (suggest → user decides) ===');
  const julyWindow = windows[windows.length - 1];
  const asked = engine.buildCycle({
    bankTxns, cards, window: julyWindow, asOf,
    salarySignature: { normalizedDescription: 'הורייזן טכנו' },
  });
  const ask = asked.needsReview.find((r) => Math.abs(r.amount - 12805.22) <= 0.01);
  console.log(`${check('spread is asked, not assumed', Boolean(ask) && ask.suggestion === 'financing' && ask.confirmed === false, 'the spread credit must be surfaced with a pre-filled suggestion')}  asks about ${ask ? nis(ask.amount) : '—'} with suggestion "${ask ? ask.suggestion : '—'}" (${ask ? ask.reason : '—'})`);

  // Whatever the user answers, the bottom line must still equal reality — an answer may move
  // money between the income and financing lines, never break the reconciliation.
  const realJuly = bankTxns
    .filter((t) => engine.inWindow(t.processedDate || t.date, julyWindow) && !engine.isPending(t))
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  for (const answer of ['financing', 'income']) {
    const c = engine.buildCycle({
      bankTxns, cards, window: julyWindow, asOf,
      salarySignature: { normalizedDescription: 'הורייזן טכנו' },
      creditClassifications: [{ identifier: 3111001, class: answer }],
    });
    const ok = Math.abs(c.bankMovement - realJuly) <= 0.02;
    console.log(`${check(`bank movement holds when user answers "${answer}"`, ok, `model ${nis(c.bankMovement)} vs real ${nis(realJuly)}`)}  answer="${answer}" → income ${nis(c.income.total)}, operating ${nis(c.operatingNet)}, financing ${nis(c.financing.total)}, bank ${nis(c.bankMovement)}`);
  }

  console.log('\n=== LOANS derived from identifier families (no manual entry) ===');
  const loans = engine.deriveLoans(bankTxns);
  for (const l of loans) {
    console.log(`  #${l.identifier}  principal ${nis(l.principal)} drawn ${l.disbursedOn}  |  repaid ${nis(l.repaid)} (${l.paymentCount} payments, ~day ${l.paymentDay})  |  outstanding ${nis(l.outstanding)}`);
  }
  const loan2158 = loans.find((l) => l.identifier === '2158001');
  const loan3926 = loans.find((l) => l.identifier === '3926001');
  console.log(`${check('loan 2158001 derived', Boolean(loan2158) && Math.abs(loan2158.principal - 25000) <= 0.01 && Math.abs(loan2158.outstanding - 21914.65) <= 0.01, `expected principal 25,000 / outstanding 21,914.65, got ${loan2158 ? `${nis(loan2158.principal)} / ${nis(loan2158.outstanding)}` : 'none'}`)}  loan 2158001`);
  console.log(`${check('loan 3926001 derived', Boolean(loan3926) && Math.abs(loan3926.principal - 16000) <= 0.01 && Math.abs(loan3926.outstanding - 14913.56) <= 0.01, `expected principal 16,000 / outstanding 14,913.56, got ${loan3926 ? `${nis(loan3926.principal)} / ${nis(loan3926.outstanding)}` : 'none'}`)}  loan 3926001`);

  console.log('\n=== RECURRING CHARGES needing a user label (series with no captured principal) ===');
  // Card settlements are already explained by the card itself — never offer them for labelling.
  const cardSettlementLines = engine.reconcile(
    bankTxns,
    cards.flatMap((c) => engine.buildCardView(c.txns, { bankTxns, asOf }).events).filter((e) => !e.future),
  ).matched.map((m) => m.bankTxn);
  const recurring = engine.deriveRecurringCharges(bankTxns, {
    knownLoanIds: loans.map((l) => l.identifier),
    excludeTxns: cardSettlementLines,
  });
  for (const r of recurring) {
    console.log(`  #${r.identifier}  "${r.description}"  x${r.occurrences}  ~${nis(r.typicalAmount)}  day ${r.paymentDay}  (last ${r.lastDate})`);
  }
  const oldLoan = recurring.find((r) => r.identifier === '2529001');
  console.log(`${check('old loan surfaced for labelling', Boolean(oldLoan), 'the ~1,100/月 series with no captured disbursement must be offered to the user')}  2529001 surfaced = ${Boolean(oldLoan)}`);

  console.log('\n' + '='.repeat(60));
  if (failures.length) {
    console.log(`FAILED (${failures.length}):`);
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('ALL CHECKS PASSED — engine reconciles to the bank to the agora.');
}

main();
