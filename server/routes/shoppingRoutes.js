/**
 * Shopping Wishlist Routes — /api/v1/shopping
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const shoppingController = require('../controllers/shoppingController');
const shareController   = require('../controllers/shoppingShareController');

router.use(auth);

// Items
router.get('/',        shoppingController.getAll);
router.post('/',       shoppingController.create);
router.patch('/:id',   shoppingController.update);
router.delete('/:id',  shoppingController.remove);

// Sharing
router.post('/invite',                          shareController.invite);
router.get('/invitations',                      shareController.getInvitations);
router.post('/invitations/:token/respond',      shareController.respondToInvitation);
router.get('/members',                          shareController.getMembers);
router.delete('/members/:userId',               shareController.removeMember);
router.delete('/invitations/:email',            shareController.cancelInvitation);

module.exports = router;
