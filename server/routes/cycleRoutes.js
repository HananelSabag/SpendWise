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
  saveTransactionOverride,
  deleteTransactionOverride,
  saveCycleSettings,
} = require('../services/cycleService');

/**
 * Every number on screen must be openable: "which purchases actually built this bill".
 * The rows are sent with the cycle rather than fetched per tap — a statement is ~80 rows of
 * three short fields, so the whole breakdown costs a few KB and expands instantly.
 */
function accountLast4(accountNumber) {
  return accountNumber == null ? null : String(accountNumber).slice(-4);
}

function slimTxn(txn) {
  return {
    id: txn.id,
    date: txn.date,
    processedDate: txn.processedDate,
    description: txn.description,
    amount: txn.amount,
    // The UI only groups/displays by masked suffix. Never ship a full account number in this
    // high-volume response, even though the endpoint is authenticated.
    source: txn.source,
    accountNumber: accountLast4(txn.accountNumber),
    pending: Boolean(txn.status && txn.status !== 'completed'),
    currency: txn.originalCurrency && txn.originalCurrency !== 'ILS' ? txn.originalCurrency : null,
    installments: txn.installments || null,
  };
}

function slimEvent(event) {
  const excluded = new Set((event.excludedTransactionIds || []).map(Number));
  const includedTxns = (event.txns || []).filter((txn) => !excluded.has(Number(txn.id)));
  return {
    chargeDate: event.chargeDate,
    total: event.total,
    count: includedTxns.length,
    class: event.class,
    source: event.source,
    accountNumber: accountLast4(event.accountNumber),
    partial: Boolean(event.partial),
    future: Boolean(event.future),
    // A statement still building this cycle — its purchases are counted now, but the bank
    // charges it next month, so the UI labels it "bills on <date>" rather than a past debit.
    accruing: Boolean(event.accruing),
    // The provenance of this exact charge, newest purchase first.
    txns: includedTxns
      .map(slimTxn)
      .sort((a, b) => String(b.date).localeCompare(String(a.date))),
  };
}

function slimDecision(decision) {
  return {
    transactionId: decision.transactionId,
    date: decision.date,
    processedDate: decision.processedDate,
    description: decision.description,
    amount: decision.amount,
    source: decision.source,
    accountNumber: accountLast4(decision.accountNumber),
    classification: decision.classification,
    included: decision.included,
    automatic: decision.automatic,
    override: decision.override,
    editable: decision.editable,
    needsAction: decision.needsAction,
    impactLine: decision.impactLine,
    impactAmount: decision.impactAmount,
    bankEffect: decision.bankEffect,
    reason: decision.reason,
    linkedTo: decision.linkedTo ? {
      ...decision.linkedTo,
      accountNumber: accountLast4(decision.linkedTo.accountNumber),
    } : null,
  };
}

function slimLoan(loan) {
  return {
    ...loan,
    payments: (loan.payments || []).map((payment) => ({
      date: payment.date,
      amount: payment.amount,
    })),
  };
}

function slimSalaryTracking(tracking) {
  if (!tracking) return null;
  const slimEvent = (event) => event ? {
    date: event.date,
    amount: event.amount,
    txn: event.txn ? slimTxn(event.txn) : null,
  } : null;
  return {
    ...tracking,
    last: slimEvent(tracking.last),
    events: (tracking.events || []).map(slimEvent),
  };
}

function slimSignature(signature) {
  return {
    ...signature,
    accountNumber: accountLast4(signature.accountNumber),
  };
}

function slimCycle(cycle, { includeControl = false } = {}) {
  const forecast = cycle.nextCardForecast
    ? {
        ...cycle.nextCardForecast,
        bills: (cycle.nextCardForecast.bills || []).map((bill) => ({
          ...bill,
          accountNumber: accountLast4(bill.accountNumber),
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
      effectiveEnd: cycle.window.effectiveEnd || cycle.window.end,
      running: Boolean(cycle.window.running),
      projectedEnd: Boolean(cycle.window.projectedEnd),
      mode: cycle.window.mode || 'automatic',
      anchorDay: cycle.window.anchorDay || null,
      salary: {
        date: cycle.window.salary.date,
        amount: cycle.window.salary.amount,
        description: cycle.window.salary.txn?.description || null,
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
        refund: Boolean(item.refund),
      })),
    },
    operatingNet: cycle.operatingNet,
    financing: { total: cycle.financing.total, count: cycle.financing.items.length },
    bankMovement: cycle.bankMovement,
    timingAdjustment: cycle.timingAdjustment,
    projection: cycle.projection,
    forwardReset: cycle.forwardReset,
    closedInsights: cycle.closedInsights,
    nextCardForecast: forecast,
    needsReview: cycle.needsReview.map((r) => ({
      transactionId: r.txn.id,
      amount: r.amount,
      date: r.txn.processedDate || r.txn.date,
      description: r.txn.description,
      identifier: r.txn.identifier,
      suggestion: r.suggestion,
      reason: r.reason,
      matchedBill: r.matchedBill ? {
        ...r.matchedBill,
        accountNumber: accountLast4(r.matchedBill.accountNumber),
      } : null,
      daysApart: r.daysApart,
    })),
    reversals: cycle.reversals.map((r) => ({ amount: r.amount, chargeDate: r.event.chargeDate, description: r.creditTxn.description, daysApart: r.daysApart })),
    partials: cycle.partials.map(slimEvent),
    unreconciledCardEvents: cycle.unreconciledCardEvents.map(slimEvent),
    cards: cycle.cards.map((card) => ({
      ...card,
      accountNumber: accountLast4(card.accountNumber),
    })),
    ...(includeControl ? { decisions: (cycle.decisions || []).map(slimDecision) } : {}),
  };
}

function slimFundingForecast(forecast) {
  if (!forecast) return null;
  return {
    ...forecast,
    streams: (forecast.streams || []).map(({ accountNumber, ...stream }) => ({
      ...stream,
      accountLast4: accountNumber ? String(accountNumber).slice(-4) : null,
    })),
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
        cycles: result.cycles.map((cycle) => slimCycle(cycle, { includeControl: true })),
        loans: result.loans.map(slimLoan),
        totalOutstanding: result.totalOutstanding || 0,
        recurring: result.recurring,
        salaryTracking: slimSalaryTracking(result.salaryTracking),
        salaryChange: result.salaryChange
          ? { suspected: result.salaryChange.suspected, reason: result.salaryChange.reason, candidates: result.salaryChange.candidates.map((c) => ({ date: c.date, amount: c.amount, description: c.txn.description })) }
          : null,
        signatures: result.signatures.map(slimSignature),
        fundingForecast: slimFundingForecast(result.fundingForecast),
        settings: result.settings,
      },
    });
  } catch (error) {
    logger.error('GET /cycles failed', { userId: req.user && req.user.id, error: error.message });
    next(error);
  }
});

/** Select automatic household-income detection or a fixed monthly reset day. */
router.put('/settings', auth, async (req, res, next) => {
  const engineMode = req.body?.engineMode;
  const manualAnchorDay = Number(req.body?.manualAnchorDay);
  if (!['automatic', 'manual'].includes(engineMode)) {
    return res.status(400).json({ success: false, error: 'engineMode must be automatic or manual' });
  }
  if (engineMode === 'manual' && (!Number.isInteger(manualAnchorDay) || manualAnchorDay < 1 || manualAnchorDay > 31)) {
    return res.status(400).json({ success: false, error: 'manualAnchorDay must be an integer from 1 to 31' });
  }
  try {
    const settings = await saveCycleSettings(req.user.id, { engineMode, manualAnchorDay });
    return res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('PUT /cycles/settings failed', {
      userId: req.user && req.user.id,
      error: error.message,
    });
    return next(error);
  }
});

const TRANSACTION_CLASSIFICATIONS = new Set([
  'salary', 'income', 'financing', 'refund', 'expense', 'transfer', 'exclude',
]);

function parseTransactionId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const transactionId = Number(value);
  return Number.isInteger(transactionId) && transactionId <= 2147483647
    ? transactionId
    : null;
}

/** Override one engine decision without mutating the immutable bank transaction. */
router.put('/transactions/:transactionId/classification', auth, async (req, res, next) => {
  const transactionId = parseTransactionId(req.params.transactionId);
  const classification = req.body && req.body.classification;
  const reason = req.body && req.body.reason;
  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid transaction id' });
  }
  if (!TRANSACTION_CLASSIFICATIONS.has(classification)) {
    return res.status(400).json({ success: false, error: 'Invalid cycle classification' });
  }
  if (reason !== undefined && reason !== null && (typeof reason !== 'string' || reason.length > 160)) {
    return res.status(400).json({ success: false, error: 'reason must be a string of at most 160 characters' });
  }
  try {
    const saved = await saveTransactionOverride(
      req.user.id,
      transactionId,
      classification,
      reason || 'user_control',
    );
    if (!saved) return res.status(404).json({ success: false, error: 'Transaction not found' });
    return res.json({ success: true, data: saved });
  } catch (error) {
    logger.error('PUT /cycles/transactions/:transactionId/classification failed', {
      userId: req.user && req.user.id,
      transactionId,
      error: error.message,
    });
    return next(error);
  }
});

/** Return a decision to automatic engine control. */
router.delete('/transactions/:transactionId/classification', auth, async (req, res, next) => {
  const transactionId = parseTransactionId(req.params.transactionId);
  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid transaction id' });
  }
  try {
    await deleteTransactionOverride(req.user.id, transactionId);
    return res.json({ success: true });
  } catch (error) {
    logger.error('DELETE /cycles/transactions/:transactionId/classification failed', {
      userId: req.user && req.user.id,
      transactionId,
      error: error.message,
    });
    return next(error);
  }
});

/** Remember the user's answer for one ambiguous credit. */
router.put('/credits/:transactionId/classification', auth, async (req, res, next) => {
  const transactionId = parseTransactionId(req.params.transactionId);
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
        salaryTracking: slimSalaryTracking(result.salaryTracking),
        fundingForecast: slimFundingForecast(result.fundingForecast),
        settings: result.settings,
        totalOutstanding: result.totalOutstanding || 0,
      },
    });
  } catch (error) {
    logger.error('GET /cycles/current failed', { userId: req.user && req.user.id, error: error.message });
    next(error);
  }
});

module.exports = router;
