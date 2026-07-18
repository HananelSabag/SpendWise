/**
 * Financial cycle routes — the salary-anchored view the dashboard and the cycle control
 * centre run on.
 *
 *   GET /api/v1/cycles          every cycle for the user, newest last, + loans, salary
 *                               tracking, job-change suspicion and series awaiting a label
 *   GET /api/v1/cycles/current  just the running cycle (dashboard hot path)
 *   PUT /api/v1/cycles/credits/:transactionId/classification
 *                               remember one income/financing answer
 *
 * The maths lives in services/cycleEngine.js (pure) and is fed by services/cycleService.js.
 * See FINANCIAL_CYCLE_SPEC.md for the model; every number here reconciles to the real bank
 * movement (spec §3c invariant).
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');
const {
  getFinancialCycles,
  getCurrentFinancialCycle,
  getYearReview,
  getAvailableCycleYears,
  saveCreditClassification,
} = require('../services/cycleService');

/**
 * Every number on screen must be openable: "which purchases actually built this bill".
 * The rows are sent with the cycle rather than fetched per tap — a statement is ~80 rows of
 * three short fields, so the whole breakdown costs a few KB and expands instantly.
 */
function slimTxn(txn) {
  return {
    id: txn.id,
    date: txn.date,
    processedDate: txn.processedDate,
    description: txn.description,
    amount: txn.amount,
    // Needed by the provenance UI to group direct bank money per real account. These are
    // display-safe fields already exposed elsewhere in authenticated bank-sync responses.
    source: txn.source,
    accountNumber: txn.accountNumber,
    pending: Boolean(txn.status && txn.status !== 'completed'),
    currency: txn.originalCurrency && txn.originalCurrency !== 'ILS' ? txn.originalCurrency : null,
    installments: txn.installments || null,
  };
}

function slimEvent(event) {
  return {
    chargeDate: event.chargeDate,
    total: event.total,
    count: event.count,
    class: event.class,
    source: event.source,
    accountNumber: event.accountNumber,
    partial: Boolean(event.partial),
    future: Boolean(event.future),
    // A statement still building this cycle — its purchases are counted now, but the bank
    // charges it next month, so the UI labels it "bills on <date>" rather than a past debit.
    accruing: Boolean(event.accruing),
    // The provenance of this exact charge, newest purchase first.
    txns: (event.txns || [])
      .map(slimTxn)
      .sort((a, b) => String(b.date).localeCompare(String(a.date))),
  };
}

function slimCycle(cycle) {
  const forecast = cycle.nextCardForecast
    ? {
        ...cycle.nextCardForecast,
        bills: (cycle.nextCardForecast.bills || []).map((bill) => ({
          ...bill,
          knownTxns: (bill.knownTxns || [])
            .map(slimTxn)
            .sort((a, b) => String(b.date).localeCompare(String(a.date))),
        })),
      }
    : null;

  return {
    window: {
      index: cycle.window.index,
      start: cycle.window.start,
      end: cycle.window.end,
      running: Boolean(cycle.window.running),
      projectedEnd: Boolean(cycle.window.projectedEnd),
      salary: {
        date: cycle.window.salary.date,
        amount: cycle.window.salary.amount,
        description: cycle.window.salary.txn.description,
      },
    },
    income: {
      salary: cycle.income.salary.total,
      other: cycle.income.other.total,
      total: cycle.income.total,
      // Openable too: the user should see exactly which credits we counted as income.
      items: [...cycle.income.salary.items, ...cycle.income.other.items].map(slimTxn),
    },
    expenses: {
      cards: cycle.expenses.cards.total,
      direct: cycle.expenses.direct.total,
      total: cycle.expenses.total,
      events: cycle.expenses.cards.events.map(slimEvent),
      // Direct bank debits — loans, standing orders, cash — with their fixed-charge label.
      directItems: cycle.expenses.direct.items.map((item) => ({
        ...slimTxn(item.txn),
        fixedCharge: item.fixedCharge ? item.fixedCharge.label : null,
      })),
    },
    operatingNet: cycle.operatingNet,
    financing: { total: cycle.financing.total, count: cycle.financing.items.length },
    bankMovement: cycle.bankMovement,
    timingAdjustment: cycle.timingAdjustment,
    projection: cycle.projection,
    nextCardForecast: forecast,
    needsReview: cycle.needsReview.map((r) => ({
      transactionId: r.txn.id,
      amount: r.amount,
      date: r.txn.processedDate || r.txn.date,
      description: r.txn.description,
      identifier: r.txn.identifier,
      suggestion: r.suggestion,
      reason: r.reason,
      matchedBill: r.matchedBill,
      daysApart: r.daysApart,
    })),
    reversals: cycle.reversals.map((r) => ({ amount: r.amount, chargeDate: r.event.chargeDate, description: r.creditTxn.description, daysApart: r.daysApart })),
    partials: cycle.partials.map(slimEvent),
    unreconciledCardEvents: cycle.unreconciledCardEvents.map(slimEvent),
    cards: cycle.cards,
  };
}

router.get('/', auth, async (req, res, next) => {
  try {
    const years = Math.max(1, Math.min(Number(req.query.years) || 2, 5));
    const result = await getFinancialCycles(req.user.id, { years });
    res.json({
      success: true,
      data: {
        status: result.status,
        cycles: result.cycles.map(slimCycle),
        loans: result.loans,
        totalOutstanding: result.totalOutstanding || 0,
        recurring: result.recurring,
        salaryTracking: result.salaryTracking,
        salaryChange: result.salaryChange
          ? { suspected: result.salaryChange.suspected, reason: result.salaryChange.reason, candidates: result.salaryChange.candidates.map((c) => ({ date: c.date, amount: c.amount, description: c.txn.description })) }
          : null,
        signatures: result.signatures,
      },
    });
  } catch (error) {
    logger.error('GET /cycles failed', { userId: req.user && req.user.id, error: error.message });
    next(error);
  }
});

/** Remember the user's answer for one ambiguous credit. */
router.put('/credits/:transactionId/classification', auth, async (req, res, next) => {
  const transactionId = Number.parseInt(req.params.transactionId, 10);
  const klass = req.body && req.body.class;
  const reason = req.body && req.body.reason;

  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid transaction id' });
  }
  if (!['income', 'financing'].includes(klass)) {
    return res.status(400).json({ success: false, error: 'class must be income or financing' });
  }
  if (reason !== undefined && reason !== null && (typeof reason !== 'string' || reason.length > 100)) {
    return res.status(400).json({ success: false, error: 'reason must be a string of at most 100 characters' });
  }

  try {
    const classification = await saveCreditClassification(
      req.user.id,
      transactionId,
      klass,
      reason || null,
    );
    if (!classification) {
      return res.status(404).json({ success: false, error: 'Credit transaction not found' });
    }
    return res.json({ success: true, data: classification });
  } catch (error) {
    logger.error('PUT /cycles/credits/:transactionId/classification failed', {
      userId: req.user && req.user.id,
      transactionId,
      error: error.message,
    });
    return next(error);
  }
});

router.get('/years', auth, async (req, res, next) => {
  try {
    const years = await getAvailableCycleYears(req.user.id);
    return res.json({ success: true, data: { years } });
  } catch (error) {
    logger.error('GET /cycles/years failed', { userId: req.user && req.user.id, error: error.message });
    return next(error);
  }
});

router.get('/yearly/:year', auth, async (req, res, next) => {
  const year = Number(req.params.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ success: false, error: 'Invalid year' });
  }
  try {
    const review = await getYearReview(req.user.id, year);
    return res.json({ success: true, data: review });
  } catch (error) {
    logger.error('GET /cycles/yearly/:year failed', {
      userId: req.user && req.user.id,
      year,
      error: error.message,
    });
    return next(error);
  }
});

router.get('/current', auth, async (req, res, next) => {
  try {
    const result = await getCurrentFinancialCycle(req.user.id);
    res.json({
      success: true,
      data: {
        status: result.status,
        cycle: result.current ? slimCycle(result.current) : null,
        salaryTracking: result.salaryTracking,
        totalOutstanding: result.totalOutstanding || 0,
      },
    });
  } catch (error) {
    logger.error('GET /cycles/current failed', { userId: req.user && req.user.id, error: error.message });
    next(error);
  }
});

module.exports = router;
