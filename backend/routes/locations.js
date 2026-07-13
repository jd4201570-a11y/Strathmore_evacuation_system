const express = require('express')
const { query } = require('express-validator')
const { handleValidation } = require('../middleware/validate')
const { getLocationsForRole } = require('../shared/utils/locationsService')
const { pool } = require('../src/shared/utils/database')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const role = req.query.role || 'visitor'
    const locations = await getLocationsForRole(role)
    return res.json({ ok: true, locations })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load locations' })
  }
})

router.get(
  '/search',
  query('q').isString().notEmpty(),
  handleValidation,
  async (req, res) => {
    try {
      const role = req.query.role || 'visitor'
      const searchTerm = String(req.query.q || '').toLowerCase()
      const locations = await getLocationsForRole(role)
      const results = locations.filter((location) => {
        const name = String(location.locationName || '').toLowerCase()
        const description = String(location.description || '').toLowerCase()
        return name.includes(searchTerm) || description.includes(searchTerm)
      })
      return res.json({ ok: true, results })
    } catch (error) {
      return res.status(500).json({ error: 'Failed to search locations' })
    }
  }
)

router.get('/nodes', async (req, res) => {
  const floorId = req.query.floorId
  if (!floorId) {
    return res.status(400).json({ error: 'floorId is required' })
  }

  try {
    const result = await pool.query(
      `SELECT node_id, floor_id, node_name, node_type, x_coordinate, y_coordinate
       FROM navigation_nodes
       WHERE floor_id = $1
       ORDER BY node_name ASC`,
      [floorId]
    )

    const nodes = result.rows.map((row) => ({
      id: row.node_id,
      floorId: row.floor_id,
      nodeName: row.node_name,
      nodeType: row.node_type,
      xCoordinate: Number(row.x_coordinate),
      yCoordinate: Number(row.y_coordinate),
    }))

    return res.json({ ok: true, nodes })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load nodes' })
  }
})

module.exports = router
