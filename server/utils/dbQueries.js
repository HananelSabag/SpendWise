// 🪦 DEAD CODE — scheduled for deletion.
// The DBQueries class with getDashboardData / DashboardCache is never imported
// by production code (only by its now-stubbed unit test). The real dashboard
// route uses Transaction model methods directly. The get_dashboard_summary SQL
// function it wraps DOES exist in your DB but no app code calls it.
// Safe to delete with: git rm server/utils/dbQueries.js
// See DEAD_CODE_TO_DELETE.md.
module.exports = {};
