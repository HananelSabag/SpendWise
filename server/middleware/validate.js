// Update server/middleware/validate.js
const validateUser = (req, res, next) => {
    const { email, password, username } = req.body;
    
    if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password?.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (username && username.length < 2) {
        return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }

    next();
};

const validateExpense = (req, res, next) => {
    const { amount, date, description } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount required' });
    }

    if (!date || isNaN(new Date(date).getTime())) {
        return res.status(400).json({ error: 'Valid date required' });
    }

    if (!description?.trim()) {
        return res.status(400).json({ error: 'Description required' });
    }

    next();
};

module.exports = { validateUser, validateExpense };