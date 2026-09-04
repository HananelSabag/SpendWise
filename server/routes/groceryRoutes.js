/**
 * Shared grocery list routes — /api/v1/grocery
 *
 * Layering, in order: authenticate → resolve the caller's list membership
 * (`attachList`) → owner check or edit-lease check where the action needs one.
 * A route that mutates list content MUST go through `requireLease`; that is the
 * only thing standing between two shoppers and a lost update.
 */

const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const { attachList, requireOwner, requireLease } = require('../middleware/groceryAccess');
const { uploadGroceryReceipt, uploadGroceryItemImage } = require('../middleware/upload');
const grocery = require('../controllers/groceryController');
const share = require('../controllers/groceryShareController');

router.use(auth);

// ─── Invitations ────────────────────────────────────────────────────────────
// These come before `router.use(attachList)` because they must work for a user
// who has no list of their own yet (a preview, an accept, a decline).
//
// The share-link routes are declared here too, ahead of `/invitations/:token`,
// or that wildcard would swallow the literal "link" segment and try to preview
// an invitation whose token is the word "link". They still run the list and
// owner checks — just explicitly rather than via the router-level `use`.
router.get('/invitations',                                share.getMyInvitations);
router.post('/invitations/link',   attachList, requireOwner, share.createLink);
router.get('/invitations/link',    attachList, requireOwner, share.getLink);
router.delete('/invitations/link', attachList, requireOwner, share.revokeLink);
router.get('/invitations/:token',                         share.preview);
router.post('/invitations/:token/accept',                 share.accept);
router.post('/invitations/:token/decline',                share.decline);

// ─── Everything below operates on the caller's list ─────────────────────────
router.use(attachList);

// State + live polling
router.get('/state',                          grocery.getState);

// Items — all lease-guarded
router.post('/items',                         requireLease, grocery.addItem);
router.patch('/items/:id',                    requireLease, grocery.updateItem);
router.post('/items/:id/purchase',            requireLease, grocery.setPurchased);
router.delete('/items/:id',                   requireLease, grocery.deleteItem);

// Edit lease
router.post('/lock',                          grocery.acquireLock);
router.post('/lock/heartbeat',                grocery.heartbeatLock);
router.delete('/lock',                        grocery.releaseLock);

// Trips + history
router.post('/trips/complete',                requireLease, grocery.completeTrip);
router.get('/trips',                          grocery.getHistory);
router.get('/trips/:id',                      grocery.getTripDetail);
router.post('/trips/:id/receipt',             uploadGroceryReceipt, grocery.uploadReceipt);
router.get('/trips/:id/receipt',              grocery.getReceiptUrl);
router.post('/trips/:id/spendwise',           grocery.linkToSpendWise);

// Product photo + link helpers
router.post('/items/image',                   uploadGroceryItemImage, grocery.uploadItemImage);
router.post('/scrape-url',                    grocery.scrapeUrl);
router.post('/parse-html',                    grocery.parseHtml);

// Sharing / membership (the share-link routes are declared further up, above
// the `/invitations/:token` wildcard).
router.post('/invitations',                   requireOwner, share.invite);
router.delete('/invitations',                 requireOwner, share.cancel);
router.get('/members',                        share.getMembers);
router.delete('/members/:userId',             requireOwner, share.removeMember);
router.delete('/members',                     requireOwner, share.disband);
router.post('/leave',                         share.leave);

module.exports = router;
