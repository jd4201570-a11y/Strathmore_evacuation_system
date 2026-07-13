const { agent, createTestApp } = require('./helpers/httpTest')

describe('health check', () => {
  let app
  let testAgent

  beforeEach(() => {
    app = createTestApp()
    app.get('/api/ping', (req, res) => {
      res.json({ status: 'ok', time: new Date().toISOString() })
    })
    testAgent = agent(app)
  })

  afterEach(async () => {
    await testAgent.close()
  })

  test('GET /api/ping returns ok status', async () => {
    const res = await testAgent.get('/api/ping')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.time).toBeDefined()
  })
})
