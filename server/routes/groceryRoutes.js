/**
 * Shared grocery list routes — /api/v1/grocery
 *
 * Layering, in order: authenticate → resolve WHICH list the request is about
 * (`attachList`) → owner check where the action needs one.
 *
 * A user can be on several lists (migration 44). A request names one with the
 * `X-Grocery-List` header; `attachList` resolves it through membership and
 * falls back to their current list, so the header is a hint and never a grant.
 *
 * There is no list-level lock: two shoppers adding or checking off different
 * items cannot conflict. A lost update on the SAME item is prevented by
 * `grocery_items.version` (409 on stale), and the claim endpoints below stop
 * two people typing into one item at the same time.
 */

const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const { attachList, requireOwner } = require('../middleware/groceryAccess');
const { uploadGroceryReceipt, uploadGroceryItemImage } = require('../middleware/upload');
const grocery = require('../controllers/groceryController');
const share = require('../controllers/groceryShareController');

router.use(auth);

// ─── The user's lists ───────────────────────────────────────────────────────
// About the person, not about one list, so they run before `attachList`: a
// switch has to work while the list you are switching AWAY from is still the
// one the resolver would pick.
router.get('/lists',                                      share.getLists);
router.post('/lists/:id/open',                            share.openList);

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

// Items
router.post('/items',                         grocery.addItem);
router.patch('/items/:id',                    grocery.updateItem);
router.post('/items/:id/purchase',            grocery.setPurchased);
router.delete('/items/:id',                   grocery.deleteItem);

// Per-item edit claim — advisory, so two people don't type into one item
router.post('/items/:id/claim',               grocery.claimItem);
router.delete('/items/:id/claim',             grocery.releaseItem);

// Trips + history
router.post('/trips/complete',                grocery.completeTrip);
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
