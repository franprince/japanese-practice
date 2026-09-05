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

test.describe('Removed Ollama routes', () => {
    test('practice page is not available', async ({ request }) => {
        const response = await request.get('/practice/ollama')

        expect(response.status()).toBe(404)
    })

    test('quiz generation endpoint is not available', async ({ request }) => {
        const response = await request.post('/api/generate-quiz', { data: {} })

        expect(response.status()).toBe(404)
    })

    test('buffered quiz endpoint is not available', async ({ request }) => {
        const response = await request.post('/api/quizzes', { data: {} })

        expect(response.status()).toBe(404)
    })
})
