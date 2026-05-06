/**
 * Shopping Wishlist Routes — /api/v1/shopping
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const shoppingController = require('../controllers/shoppingController');

router.use(auth);

router.get('/', shoppingController.getAll);
router.post('/', shoppingController.create);
router.patch('/:id', shoppingController.update);
router.delete('/:id', shoppingController.remove);

module.exports = router;
