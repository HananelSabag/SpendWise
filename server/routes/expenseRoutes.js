const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); 

router.get('/', auth, (req, res) => {
    res.json({ message: "Expenses route working" });
});

module.exports = router;