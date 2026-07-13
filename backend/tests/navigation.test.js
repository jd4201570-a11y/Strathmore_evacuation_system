jest.mock('../src/shared/utils/database', () => ({
  pool: { query: jest.fn() },
}))

const { pool } = require('../src/shared/utils/database')
const navigationRouter = require('../src/routes/navigation')
const { agent, createTestApp } = require('./helpers/httpTest')

describe('navigation API', () => {
  let app
  let testAgent

  const floorNodes = [
    {
      node_id: 'node-a',
      floor_id: 'floor-1',
      node_name: 'Main Entrance',
      x_coordinate: 10,
      y_coordinate: 20,
    },
    {
      node_id: 'node-b',
      floor_id: 'floor-1',
      node_name: 'Corridor A',
      x_coordinate: 30,
      y_coordinate: 40,
    },
    {
      node_id: 'node-c',
      floor_id: 'floor-1',
      node_name: 'Library',
      x_coordinate: 50,
      y_coordinate: 60,
    },
  ]

  const floorEdges = [
    {
      edge_id: 'edge-1',
      floor_id: 'floor-1',
      start_node_id: 'node-a',
      end_node_id: 'node-b',
      weight: 1,
    },
    {
      edge_id: 'edge-2',
      floor_id: 'floor-1',
      start_node_id: 'node-b',
      end_node_id: 'node-c',
      weight: 1,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    pool.query.mockImplementation((sql) => {
      if (sql.includes('navigation_nodes')) {
        return Promise.resolve({ rows: floorNodes })
      }
      if (sql.includes('navigation_edges')) {
        return Promise.resolve({ rows: floorEdges })
      }
      return Promise.resolve({ rows: [] })
    })

    app = createTestApp()
    app.use('/api/navigation', navigationRouter)
    testAgent = agent(app)
  })

  afterEach(async () => {
    await testAgent.close()
  })

  test('TC-08: POST /route returns shortest path between connected nodes', async () => {
    const res = await testAgent.post('/api/navigation/route', {
      startLocationId: 'node-a',
      destinationLocationId: 'node-c',
      floorId: 'floor-1',
    })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.path).toEqual(['node-a', 'node-b', 'node-c'])
    expect(res.body.distance).toBe(2)
    expect(res.body.pathNodes).toHaveLength(3)
    expect(res.body.pathNodes[0].nodeName).toBe('Main Entrance')
    expect(res.body.pathNodes[2].nodeName).toBe('Library')
  })

  test('TC-09: returns 404 when no path exists between nodes', async () => {
    pool.query.mockImplementation((sql) => {
      if (sql.includes('navigation_nodes')) {
        return Promise.resolve({
          rows: [
            floorNodes[0],
            { ...floorNodes[2], node_id: 'node-isolated', node_name: 'Isolated Room' },
          ],
        })
      }
      if (sql.includes('navigation_edges')) {
        return Promise.resolve({ rows: [] })
      }
      return Promise.resolve({ rows: [] })
    })

    const res = await testAgent.post('/api/navigation/route', {
      startLocationId: 'node-a',
      destinationLocationId: 'node-isolated',
      floorId: 'floor-1',
    })

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('No path found between the selected locations.')
  })

  test('returns 404 when floor has no nodes', async () => {
    pool.query.mockResolvedValue({ rows: [] })

    const res = await testAgent.post('/api/navigation/route', {
      startLocationId: 'node-a',
      destinationLocationId: 'node-c',
      floorId: 'empty-floor',
    })

    expect(res.status).toBe(404)
    expect(res.body.error).toContain('No navigation nodes found')
  })

  test('returns 400 when required fields are missing', async () => {
    const res = await testAgent.post('/api/navigation/route', {
      startLocationId: 'node-a',
    })

    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })
})
