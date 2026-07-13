const express = require('express')
const router = express.Router()
const { dijkstra } = require('../modules/navigation/algorithms/dijkstra')
const { buildRoutePlan, findNodeMatch } = require('../modules/navigation/algorithms/routeResolver')
const { body } = require('express-validator')
const { handleValidation } = require('../middleware/validateMiddleware')
const { pool } = require('../shared/utils/database')

// Fetch nodes and edges from DB for a given floor
async function getNodesAndEdges(floorId) {
  const nodesResult = await pool.query(
    'SELECT * FROM navigation_nodes WHERE floor_id = $1 ORDER BY node_id ASC',
    [floorId]
  )
  const edgesResult = await pool.query(
    'SELECT * FROM navigation_edges WHERE floor_id = $1 ORDER BY edge_id ASC',
    [floorId]
  )
  // Normalize node_id -> id so dijkstra can use them
  const nodes = nodesResult.rows.map(n => ({
    id: n.node_id,
    floorId: n.floor_id,
    nodeName: n.node_name,
    xCoordinate: n.x_coordinate,
    yCoordinate: n.y_coordinate,
  }))
  const edges = edgesResult.rows.map(e => ({
    id: e.edge_id,
    from: e.start_node_id,
    to: e.end_node_id,
    weight: Number(e.weight) || 1,
  }))
  return { nodes, edges }
}

router.post('/route',
  body('startLocationId').isString().notEmpty(),
  body('destinationLocationId').isString().notEmpty(),
  body('floorId').isString().notEmpty(),
  handleValidation,
  async (req, res) => {
    try {
      const { startLocationId, destinationLocationId, floorId } = req.body

      const { nodes, edges } = await getNodesAndEdges(floorId)

      if (nodes.length === 0) {
        return res.status(404).json({ error: 'No navigation nodes found for this floor. Please ask an admin to set up the map.' })
      }

      // Step 1: Try to match location names/IDs to actual node IDs
      let startNodeId = startLocationId
      let endNodeId = destinationLocationId
      
      // If exact ID match not found, try fuzzy matching
      if (!nodes.find(n => n.id === startLocationId)) {
        const matched = findNodeMatch(nodes, startLocationId)
        if (matched) startNodeId = matched.id
      }
      if (!nodes.find(n => n.id === destinationLocationId)) {
        const matched = findNodeMatch(nodes, destinationLocationId)
        if (matched) endNodeId = matched.id
      }

      // Step 2: Try Dijkstra with the resolved node IDs (follows defined corridors)
      const graphResult = dijkstra(nodes, edges, startNodeId, endNodeId)
      
      // Step 3: Use only the graph result (enforce corridor-based routing)
      // If nodes aren't connected by corridors, return 404 instead of a fallback straight line
      const routeResult = graphResult

      if (!routeResult.path || routeResult.path.length === 0) {
        return res.status(404).json({ error: 'No path found between the selected locations.' })
      }

      const idToNode = {}
      nodes.forEach(n => { idToNode[n.id] = n })
      const pathNodes = routeResult.path.map(id => idToNode[id]).filter(Boolean)

      return res.json({ ok: true, path: routeResult.path, distance: routeResult.distance, pathNodes, fallback: Boolean(routeResult.fallback) })
    } catch (e) {
      console.error('Navigation error:', e)
      res.status(500).json({ error: 'Failed to calculate route: ' + (e.message || e) })
    }
  }
)

module.exports = router
