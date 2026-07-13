function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function findNodeMatch(nodes, query) {
  if (!query) return null
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return null

  const exact = nodes.find(node => normalize(node.id) === normalizedQuery || normalize(node.nodeName || node.node_name) === normalizedQuery)
  if (exact) return exact

  return nodes.find(node => {
    const name = normalize(node.nodeName || node.node_name || node.id)
    return name.includes(normalizedQuery) || normalizedQuery.includes(name)
  }) || null
}

function buildRoutePlan(nodes, edges, startId, endId) {
  const startNode = nodes.find(node => node.id === startId) || findNodeMatch(nodes, startId)
  const endNode = nodes.find(node => node.id === endId) || findNodeMatch(nodes, endId)

  if (!startNode || !endNode) {
    return { path: [], distance: Infinity, fallback: false }
  }

  if (startNode.id === endNode.id) {
    return { path: [startNode.id], distance: 0, fallback: false }
  }

  const path = [startNode.id, endNode.id]
  const distance = Math.hypot((endNode.xCoordinate ?? endNode.x_coordinate ?? 0) - (startNode.xCoordinate ?? startNode.x_coordinate ?? 0), (endNode.yCoordinate ?? endNode.y_coordinate ?? 0) - (startNode.yCoordinate ?? startNode.y_coordinate ?? 0))

  return { path, distance, fallback: true }
}

module.exports = { normalize, findNodeMatch, buildRoutePlan }
