const { api } = require('./setup');

describe('Authentication', () => {
    test('User can register', async () => {
        const response = await api
            .post('/api/users/register')
            .send({
                email: 'test@test.com',
                username: 'testuser',
                password: 'password123'
            });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
    });

    test('User can login', async () => {
        const response = await api
            .post('/api/users/login')
            .send({
                email: 'test@test.com',
                password: 'password123'
            });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });
});