const { dijkstra } = require('../src/modules/navigation/algorithms/dijkstra')

describe('dijkstra algorithm', () => {
  test('TC-11: finds shortest path A to E in documented graph', () => {
    const nodes = [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
      { id: 'D' },
      { id: 'E' },
    ]
    const edges = [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'C', weight: 1 },
      { from: 'C', to: 'D', weight: 1 },
      { from: 'D', to: 'E', weight: 1 },
      { from: 'B', to: 'D', weight: 1.5 },
    ]

    const result = dijkstra(nodes, edges, 'A', 'E')

    // B→D shortcut (1.5) beats going through C (total 4 via A→B→C→D→E)
    expect(result.path).toEqual(['A', 'B', 'D', 'E'])
    expect(result.distance).toBe(3.5)
  })

  test('follows linear chain when no shorter shortcut exists', () => {
    const nodes = [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
      { id: 'D' },
      { id: 'E' },
    ]
    const edges = [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'C', weight: 1 },
      { from: 'C', to: 'D', weight: 1 },
      { from: 'D', to: 'E', weight: 1 },
    ]

    const result = dijkstra(nodes, edges, 'A', 'E')

    expect(result.path).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(result.distance).toBe(4)
  })

  test('prefers lower-weight route over direct high-weight edge', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    const edges = [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'C', weight: 2 },
      { from: 'A', to: 'C', weight: 5 },
    ]

    const result = dijkstra(nodes, edges, 'A', 'C')

    expect(result.path).toEqual(['A', 'B', 'C'])
    expect(result.distance).toBe(3)
  })

  test('returns same node when start equals end', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }]
    const edges = [{ from: 'A', to: 'B', weight: 1 }]

    const result = dijkstra(nodes, edges, 'A', 'A')

    expect(result.path).toEqual(['A'])
    expect(result.distance).toBe(0)
  })

  test('returns empty path when nodes are disconnected', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    const edges = [{ from: 'A', to: 'B', weight: 1 }]

    const result = dijkstra(nodes, edges, 'A', 'C')

    expect(result.path).toEqual([])
    expect(result.distance).toBe(Infinity)
  })

  test('returns empty path when start or end node is unknown', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }]
    const edges = [{ from: 'A', to: 'B', weight: 1 }]

    const result = dijkstra(nodes, edges, 'A', 'Z')

    expect(result.path).toEqual([])
    expect(result.distance).toBe(Infinity)
  })

  test('supports startNodeId/endNodeId and distance edge fields', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }]
    const edges = [
      { startNodeId: 'A', endNodeId: 'B', distance: 2 },
      { startNodeId: 'B', endNodeId: 'C', distance: 3 },
    ]

    const result = dijkstra(nodes, edges, 'A', 'C')

    expect(result.path).toEqual(['A', 'B', 'C'])
    expect(result.distance).toBe(5)
  })

  test('treats edges as undirected', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }]
    const edges = [{ from: 'B', to: 'A', weight: 4 }]

    const result = dijkstra(nodes, edges, 'A', 'B')

    expect(result.path).toEqual(['A', 'B'])
    expect(result.distance).toBe(4)
  })
})
