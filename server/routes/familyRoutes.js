/**
 * Family Hub routes — /api/v1/family
 *
 * Layering: authenticate → `requireFamilyAccess` (the household allowlist) →
 * handler. Every route below is behind both, including the reads: the whole
 * dataset is one household's private finances.
 *
 * Each mutation answers with the freshly recomputed overview, so a phone and a
 * laptop typing into this together never disagree about the totals.
 */

const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const { requireFamilyAccess } = require('../middleware/familyAccess');
const family = require('../controllers/familyController');

router.use(auth);
router.use(requireFamilyAccess);

// Members, rows and the computed picture — everything the page needs, one call.
router.get('/overview', family.getOverview);

// Monthly flow: income, fixed, variable, loans, savings
router.post('/items', family.createItem);
router.patch('/items/:id', family.updateItem);
router.delete('/items/:id', family.deleteItem);

// Balances: savings, pension, study funds, investments
router.post('/balances', family.createBalance);
router.patch('/balances/:id', family.updateBalance);
router.delete('/balances/:id', family.deleteBalance);

module.exports = router;
