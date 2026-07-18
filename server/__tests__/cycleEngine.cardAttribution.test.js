const engine = require('../services/cycleEngine');

const bank = (id, amount, date, description = 'bank') => ({
  id, source: 'leumi', accountNumber: '123', amount, date, processedDate: date,
  status: 'completed', description,
});

const card = (id, amount, purchaseDate, processedDate) => ({
  id, source: 'max', accountNumber: '2254', amount, date: purchaseDate, processedDate,
  status: 'completed', description: `purchase ${id}`, originalCurrency: 'ILS',
});

const windowFor = (salary, end, running = false) => ({
  start: salary.processedDate,
  end,
  running,
  salary: { date: salary.processedDate, amount: salary.amount, txn: salary },
});

describe('monthly card close-out attribution', () => {
  test('a statement just after salary closes the previous cycle', () => {
    const event = {
      class: 'statement',
      chargeDate: '2026-07-10',
      txns: [{ date: '2026-07-08', amount: -500 }],
    };

    expect(engine.inCardAttributionWindow(event, { start: '2026-06-09', end: '2026-07-09' })).toBe(true);
    expect(engine.inCardAttributionWindow(event, { start: '2026-07-09', end: '2026-08-09' })).toBe(false);
  });

  test('uses where most of the bill was actually spent, not an arbitrary day gap', () => {
    const mostlyPrevious = {
      class: 'statement',
      chargeDate: '2026-07-10',
      txns: [
        { date: '2026-06-20', amount: -900 },
        { date: '2026-07-05', amount: -100 },
      ],
    };
    const mostlyCurrent = {
      ...mostlyPrevious,
      txns: [
        { date: '2026-06-20', amount: -100 },
        { date: '2026-07-05', amount: -900 },
      ],
    };
    const currentWindow = { start: '2026-07-01', end: '2026-08-01' };

    expect(engine.inCardAttributionWindow(mostlyPrevious, currentWindow)).toBe(false);
    expect(engine.inCardAttributionWindow(mostlyCurrent, currentWindow)).toBe(true);
  });

  test('treats an installment as a current payment rather than reopening its old purchase cycle', () => {
    const installment = {
      class: 'statement',
      chargeDate: '2026-07-10',
      txns: [{ date: '2026-02-01', amount: -500, installments: { number: 6, total: 12 } }],
    };

    expect(engine.statementAttributionDate(installment)).toBe('2026-07-10');
  });

  test('never lets one old purchase push a statement back more than one salary cycle', () => {
    const statement = {
      class: 'statement',
      chargeDate: '2026-07-10',
      txns: [
        { date: '2026-05-02', amount: -900 },
        { date: '2026-07-02', amount: -300 },
      ],
    };

    expect(engine.inCardAttributionWindow(statement, { start: '2026-05-01', end: '2026-06-01' })).toBe(false);
    expect(engine.inCardAttributionWindow(statement, { start: '2026-06-01', end: '2026-07-01' })).toBe(true);
    expect(engine.inCardAttributionWindow(statement, { start: '2026-07-01', end: '2026-08-01' })).toBe(false);
  });

  test('moves the bill and linked spread together, while bank movement stays literal', () => {
    const juneSalary = bank(1, 1000, '2026-06-09', 'salary');
    const julySalary = bank(2, 1000, '2026-07-09', 'salary');
    const bankTxns = [
      juneSalary,
      bank(11, -200, '2026-06-10', 'card settlement'),
      julySalary,
      bank(12, -300, '2026-07-10', 'card settlement'),
      bank(13, 300, '2026-07-12', 'spread credit'),
    ];
    const cards = [{
      source: 'max',
      accountNumber: '2254',
      txns: [
        card(21, -100, '2026-04-20', '2026-05-10'),
        card(22, -200, '2026-05-20', '2026-06-10'),
        card(23, -300, '2026-06-20', '2026-07-10'),
      ],
    }];
    const common = {
      bankTxns,
      cards,
      asOf: new Date('2026-07-17T12:00:00+03:00'),
      salarySignature: { normalizedDescription: 'salary' },
    };

    const previous = engine.buildCycle({
      ...common,
      window: windowFor(juneSalary, '2026-07-09'),
    });
    const current = engine.buildCycle({
      ...common,
      window: windowFor(julySalary, '2026-08-09', true),
    });

    expect(previous.expenses.cards.events.map((event) => event.chargeDate)).toEqual(['2026-07-10']);
    expect(previous.expenses.cards.total).toBe(300);
    expect(previous.financing.total).toBe(300);

    expect(current.expenses.cards.total).toBe(0);
    expect(current.expenses.cards.events).toEqual([]);
    expect(current.financing.total).toBe(0);

    // The attribution changes the spending cycle, never the bank's chronological truth.
    expect(previous.bankMovement).toBe(800);
    expect(current.bankMovement).toBe(1000);
  });

  test('keeps an immediate card movement in the new cycle', () => {
    const immediate = { class: 'immediate', chargeDate: '2026-07-10' };
    expect(engine.inCardAttributionWindow(immediate, { start: '2026-07-09', end: '2026-08-09' })).toBe(true);
  });

  test('a refund inside a statement does not pull the attribution', () => {
    // The refund is huge and dated in the previous cycle, but it is not spending, so it must
    // not drag the bill back — the real charges were all made this cycle.
    const statement = {
      class: 'statement',
      chargeDate: '2026-07-10',
      txns: [
        { date: '2026-06-01', amount: 5000 }, // a refund — must not vote
        { date: '2026-07-05', amount: -400 },
      ],
    };
    expect(engine.inCardAttributionWindow(statement, { start: '2026-07-01', end: '2026-08-01' })).toBe(true);
  });

  test('a dead-even 50/50 split is broken by the charge day', () => {
    // Exactly half the spend before the 09/07 salary and half after it — a true tie at the
    // salary boundary. Old behaviour leaned to the previous cycle; the charge day now decides.
    const evenSplit = {
      class: 'statement',
      chargeDate: '2026-07-10', // the bank charges it inside the current window
      txns: [
        { date: '2026-07-05', amount: -500 }, // before the 09/07 salary
        { date: '2026-07-20', amount: -500 }, // after it — exactly even
      ],
    };
    // The bill charges on 10/07, inside the current window → the tie goes to the current cycle.
    expect(engine.inCardAttributionWindow(evenSplit, { start: '2026-07-09', end: '2026-08-09' })).toBe(true);
    // …and not to the previous cycle it straddles.
    expect(engine.inCardAttributionWindow(evenSplit, { start: '2026-06-09', end: '2026-07-09' })).toBe(false);
  });

  test('a running cycle counts a not-yet-charged statement whose purchases it made', () => {
    const juneSalary = bank(1, 1000, '2026-06-09', 'salary');
    const julySalary = bank(2, 1000, '2026-07-09', 'salary');
    const bankTxns = [
      juneSalary,
      bank(11, -200, '2026-06-10', 'card settlement'), // the June bill actually settled
      julySalary,
    ];
    const cards = [{
      source: 'max',
      accountNumber: '2254',
      txns: [
        card(21, -200, '2026-05-20', '2026-06-10'), // establishes statement day 10 + aggregated mode
        // Purchases made in the running July cycle, billed 2026-08-10 (future — not yet charged):
        card(23, -150, '2026-07-12', '2026-08-10'),
        card(24, -100, '2026-07-20', '2026-08-10'),
      ],
    }];

    const current = engine.buildCycle({
      bankTxns,
      cards,
      window: windowFor(julySalary, '2026-08-09', true),
      asOf: new Date('2026-07-25T12:00:00+03:00'),
      salarySignature: { normalizedDescription: 'salary' },
    });

    // The 08-10 bill is still building, but its purchases were made this cycle → counted now.
    expect(current.expenses.cards.total).toBe(250);
    const accruing = current.expenses.cards.events.find((event) => event.accruing);
    expect(accruing).toBeTruthy();
    expect(accruing.chargeDate).toBe('2026-08-10');
    expect(accruing.total).toBe(-250);
    expect(current.operatingNet).toBe(750);
    // The bank has not charged the 08-10 bill, so it never touches this window's real movement.
    expect(current.bankMovement).toBe(1000);
    expect(current.timingAdjustment).toBe(250);
  });

  test('a closed cycle never accrues a future statement', () => {
    const juneSalary = bank(1, 1000, '2026-06-09', 'salary');
    const julySalary = bank(2, 1000, '2026-07-09', 'salary');
    const bankTxns = [juneSalary, bank(11, -200, '2026-06-10', 'card settlement'), julySalary];
    const cards = [{
      source: 'max',
      accountNumber: '2254',
      txns: [
        card(21, -200, '2026-05-20', '2026-06-10'),
        card(23, -150, '2026-07-12', '2026-08-10'),
      ],
    }];

    const closed = engine.buildCycle({
      bankTxns,
      cards,
      window: windowFor(juneSalary, '2026-07-09'), // running defaults to false
      asOf: new Date('2026-07-25T12:00:00+03:00'),
      salarySignature: { normalizedDescription: 'salary' },
    });

    expect(closed.expenses.cards.events.some((event) => event.accruing)).toBe(false);
  });
});
