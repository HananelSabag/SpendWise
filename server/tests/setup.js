const supertest = require('supertest');
const app = require('../index');
const db = require('../config/db');

beforeAll(async () => {
    // Setup test database
});

afterAll(async () => {
    await db.end();
});

module.exports = {
    api: supertest(app)
};