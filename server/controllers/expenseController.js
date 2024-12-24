const Expense = require('../models/Expense');

const expenseController = {
    // Create new expense
    create: async (req, res) => {
        try {
            const data = { ...req.body, user_id: req.user.userId };
            const expense = await Expense.create(data);
            res.status(201).json(expense);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Get all expenses with filters
    getAll: async (req, res) => {
        try {
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                category_id: req.query.category_id
            };
            const expenses = await Expense.findAll(req.user.userId, filters);
            res.json(expenses);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Get expense by ID
    getById: async (req, res) => {
        try {
            const expense = await Expense.findById(req.params.id, req.user.userId);
            if (!expense) {
                return res.status(404).json({ error: 'Expense not found' });
            }
            res.json(expense);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Update expense
    update: async (req, res) => {
        try {
            const expense = await Expense.update(req.params.id, req.user.userId, req.body);
            if (!expense) {
                return res.status(404).json({ error: 'Expense not found' });
            }
            res.json(expense);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Delete expense
    delete: async (req, res) => {
        try {
            const success = await Expense.delete(req.params.id, req.user.userId);
            if (!success) {
                return res.status(404).json({ error: 'Expense not found' });
            }
            res.json({ message: 'Expense deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Get monthly analytics
    getMonthlyAnalytics: async (req, res) => {
        try {
            const { year, month } = req.query;
            const total = await Expense.getMonthlyTotal(req.user.userId, year, month);
            res.json({ total });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Get category analytics
    getCategoryAnalytics: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const totals = await Expense.getCategoryTotals(req.user.userId, startDate, endDate);
            res.json(totals);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Export expenses
    exportExpenses: async (req, res) => {
        try {
            const expenses = await Expense.findAll(req.user.userId, req.query);
            // TODO: Format for export (CSV/Excel)
            res.json(expenses);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = expenseController;