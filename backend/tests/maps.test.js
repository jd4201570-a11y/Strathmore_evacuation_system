const mapsRouter = require('../routes/maps')
const { agent, createTestApp } = require('./helpers/httpTest')

describe('maps API', () => {
  let app
  let testAgent

  beforeEach(() => {
    app = createTestApp()
    app.use('/api/maps', mapsRouter)
    testAgent = agent(app)
  })

  afterEach(async () => {
    await testAgent.close()
  })

  test('GET /api/maps returns floor list', async () => {
    const res = await testAgent.get('/api/maps')

    expect(res.status).toBe(200)
    expect(res.body.floors).toBeDefined()
    expect(Array.isArray(res.body.floors)).toBe(true)
    expect(res.body.floors.length).toBeGreaterThan(0)
  })

  test('GET /api/maps/:floorId returns a specific floor', async () => {
    const res = await testAgent.get('/api/maps/1')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(1)
    expect(res.body.name).toBeDefined()
    expect(res.body.imageUrl).toBeDefined()
  })

  test('GET /api/maps/:floorId returns 404 for unknown floor', async () => {
    const res = await testAgent.get('/api/maps/9999')

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Floor map not found')
  })
})
