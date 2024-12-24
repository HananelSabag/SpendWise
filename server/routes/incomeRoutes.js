const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');  // שינוי הייבוא

router.get('/', auth, (req, res) => {
    res.json({ message: "Income route working" });
});

module.exports = router;