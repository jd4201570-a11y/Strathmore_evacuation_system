jest.mock('../shared/utils/locationsService', () => ({
  getLocationsForRole: jest.fn(),
  DEMO_LOCATIONS: {
    visitor: [{ id: 'help', locationName: 'Help Desk', description: 'Information' }],
    student: [
      { id: 'lib1', locationName: 'Main Library', description: 'Central library' },
      { id: 'cafe', locationName: 'Cafeteria', description: 'Dining area' },
    ],
  },
}))

const { getLocationsForRole } = require('../shared/utils/locationsService')
const locationsRouter = require('../routes/locations')
const { agent, createTestApp } = require('./helpers/httpTest')

describe('locations API', () => {
  let app
  let testAgent

  beforeEach(() => {
    jest.clearAllMocks()
    getLocationsForRole.mockImplementation(async (role) => {
      if (role === 'student') {
        return [
          { id: 'lib1', locationName: 'Main Library', description: 'Central library' },
          { id: 'cafe', locationName: 'Cafeteria', description: 'Dining area' },
        ]
      }
      return [{ id: 'help', locationName: 'Help Desk', description: 'Information' }]
    })

    app = createTestApp()
    app.use('/api/locations', locationsRouter)
    testAgent = agent(app)
  })

  afterEach(async () => {
    await testAgent.close()
  })

  test('GET /api/locations returns role-based locations', async () => {
    const res = await testAgent.get('/api/locations?role=student')

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.locations).toHaveLength(2)
    expect(res.body.locations[0].locationName).toBe('Main Library')
  })

  test('GET /api/locations/search filters by query term', async () => {
    const res = await testAgent.get('/api/locations/search?q=library&role=student')

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.results).toHaveLength(1)
    expect(res.body.results[0].locationName).toBe('Main Library')
  })

  test('GET /api/locations/search returns 400 when q is missing', async () => {
    const res = await testAgent.get('/api/locations/search')

    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })
})
