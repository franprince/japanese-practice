import { test, expect } from '../fixtures'

test.describe('Health Endpoint', () => {
    test('GET /api/health returns 200 with ok status', async ({ request }) => {
        const response = await request.get('/api/health')

        expect(response.status()).toBe(200)

        const body = await response.json()
        expect(body.status).toBe('ok')
        expect(typeof body.timestamp).toBe('string')
    })
})
