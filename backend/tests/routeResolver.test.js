const { findNodeMatch, buildRoutePlan } = require('../src/modules/navigation/algorithms/routeResolver')

describe('route resolver', () => {
  test('matches common location aliases by name', () => {
    const nodes = [
      { id: 'helpdesk-node', nodeName: 'Help Desk', xCoordinate: 10, yCoordinate: 20 },
      { id: 'exit-b2', nodeName: 'Exit B2', xCoordinate: 50, yCoordinate: 20 },
    ]

    expect(findNodeMatch(nodes, 'helpdesk').id).toBe('helpdesk-node')
    expect(findNodeMatch(nodes, 'exit b2').id).toBe('exit-b2')
  })

  test('builds a fallback route when the graph has no connected path', () => {
    const nodes = [
      { id: 'helpdesk-node', nodeName: 'Help Desk', xCoordinate: 0, yCoordinate: 0 },
      { id: 'exit-b2', nodeName: 'Exit B2', xCoordinate: 10, yCoordinate: 0 },
    ]

    const result = buildRoutePlan(nodes, [], 'helpdesk-node', 'exit-b2')

    expect(result.path).toEqual(['helpdesk-node', 'exit-b2'])
    expect(result.distance).toBe(10)
    expect(result.fallback).toBe(true)
  })
})
