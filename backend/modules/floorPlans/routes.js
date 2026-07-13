const express = require('express')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const { pool } = require('../../src/shared/utils/database')

const router = express.Router()

// In-memory storage keeps uploads serverless-safe (no disk writes on Vercel)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'))
    }
    cb(null, true)
  },
})

router.get('/building/:buildingId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT floor_id, building_id, floor_number, floor_name, map_image_url, map_image_path
       FROM floors
       WHERE building_id = $1
       ORDER BY floor_number ASC`,
      [req.params.buildingId]
    )

    return res.json({
      ok: true,
      data: result.rows,
    })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load floors' })
  }
})

router.get('/:floorId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT floor_id, building_id, floor_number, floor_name, map_image_url, map_image_path
       FROM floors
       WHERE floor_id = $1
       LIMIT 1`,
      [req.params.floorId]
    )

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Floor not found' })
    }

    return res.json({ ok: true, data: result.rows[0] })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load floor' })
  }
})

router.get('/:floorId/rooms', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT room_id, floor_id, room_name, room_type, x_coordinate, y_coordinate, description
       FROM rooms
       WHERE floor_id = $1
       ORDER BY room_name ASC`,
      [req.params.floorId]
    )

    return res.json({ ok: true, data: result.rows })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load rooms' })
  }
})

router.get('/:floorId/nodes', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT node_id, floor_id, node_name, node_type, x_coordinate, y_coordinate
       FROM navigation_nodes
       WHERE floor_id = $1
       ORDER BY node_name ASC`,
      [req.params.floorId]
    )

    return res.json({ ok: true, data: result.rows })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load nodes' })
  }
})

router.get('/:floorId/edges', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT edge_id, floor_id, start_node_id, end_node_id, weight
       FROM navigation_edges
       WHERE floor_id = $1`,
      [req.params.floorId]
    )

    return res.json({ ok: true, data: result.rows })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load edges' })
  }
})

// ── Upload floor plan image and create floor record ──────────────────────────
router.post('/upload', upload.single('floorPlanImage'), async (req, res) => {
  try {
    const { buildingId, floorNumber, floorName } = req.body
    if (!buildingId || !floorNumber) {
      return res.status(400).json({ error: 'buildingId and floorNumber are required' })
    }

    let mapImageUrl = null
    if (req.file) {
      const base64 = req.file.buffer.toString('base64')
      mapImageUrl = `data:${req.file.mimetype};base64,${base64}`
    }

    const floorId = uuidv4()
    await pool.query(
      `INSERT INTO floors (floor_id, building_id, floor_number, floor_name, map_image_url, map_image_path)
       VALUES ($1, $2, $3, $4, $5, NULL)`,
      [floorId, buildingId, parseInt(floorNumber, 10), floorName || `Floor ${floorNumber}`, mapImageUrl]
    )

    const result = await pool.query('SELECT * FROM floors WHERE floor_id = $1', [floorId])
    return res.status(201).json({ ok: true, data: result.rows[0] })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create floor' })
  }
})

// ── Room write operations ─────────────────────────────────────────────────────
router.post('/:floorId/rooms', async (req, res) => {
  try {
    const { roomName, roomType, description, xCoordinate, yCoordinate } = req.body
    if (!roomName) {
      return res.status(400).json({ error: 'roomName is required' })
    }
    const roomId = uuidv4()
    await pool.query(
      `INSERT INTO rooms (room_id, floor_id, room_name, room_type, x_coordinate, y_coordinate, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [roomId, req.params.floorId, roomName, roomType || 'other',
       xCoordinate ?? null, yCoordinate ?? null, description || null]
    )
    const result = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [roomId])
    return res.status(201).json({ ok: true, data: result.rows[0] })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create room' })
  }
})

router.put('/:floorId/rooms/:roomId', async (req, res) => {
  try {
    const { roomName, roomType, description, xCoordinate, yCoordinate } = req.body
    await pool.query(
      `UPDATE rooms
       SET room_name = COALESCE($1, room_name),
           room_type = COALESCE($2, room_type),
           description = COALESCE($3, description),
           x_coordinate = COALESCE($4, x_coordinate),
           y_coordinate = COALESCE($5, y_coordinate),
           updated_at = CURRENT_TIMESTAMP
       WHERE room_id = $6 AND floor_id = $7`,
      [roomName ?? null, roomType ?? null, description ?? null,
       xCoordinate ?? null, yCoordinate ?? null,
       req.params.roomId, req.params.floorId]
    )
    const result = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [req.params.roomId])
    if (!result.rows[0]) return res.status(404).json({ error: 'Room not found' })
    return res.json({ ok: true, data: result.rows[0] })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update room' })
  }
})

router.delete('/:floorId/rooms/:roomId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM rooms WHERE room_id = $1 AND floor_id = $2',
      [req.params.roomId, req.params.floorId]
    )
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete room' })
  }
})

// ── Navigation node write operations ─────────────────────────────────────────
router.post('/:floorId/nodes', async (req, res) => {
  try {
    const { nodeName, nodeType, xCoordinate, yCoordinate } = req.body
    if (xCoordinate == null || yCoordinate == null) {
      return res.status(400).json({ error: 'xCoordinate and yCoordinate are required' })
    }
    const nodeId = uuidv4()
    await pool.query(
      `INSERT INTO navigation_nodes (node_id, floor_id, node_name, node_type, x_coordinate, y_coordinate)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nodeId, req.params.floorId, nodeName || null, nodeType || 'corridor',
       xCoordinate, yCoordinate]
    )
    const result = await pool.query('SELECT * FROM navigation_nodes WHERE node_id = $1', [nodeId])
    return res.status(201).json({ ok: true, data: result.rows[0] })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create node' })
  }
})

router.put('/:floorId/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeName, nodeType, xCoordinate, yCoordinate } = req.body
    await pool.query(
      `UPDATE navigation_nodes
       SET node_name = COALESCE($1, node_name),
           node_type = COALESCE($2, node_type),
           x_coordinate = COALESCE($3, x_coordinate),
           y_coordinate = COALESCE($4, y_coordinate),
           updated_at = CURRENT_TIMESTAMP
       WHERE node_id = $5 AND floor_id = $6`,
      [nodeName ?? null, nodeType ?? null,
       xCoordinate ?? null, yCoordinate ?? null,
       req.params.nodeId, req.params.floorId]
    )
    const result = await pool.query(
      'SELECT * FROM navigation_nodes WHERE node_id = $1', [req.params.nodeId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Node not found' })
    return res.json({ ok: true, data: result.rows[0] })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update node' })
  }
})

router.delete('/:floorId/nodes/:nodeId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM navigation_nodes WHERE node_id = $1 AND floor_id = $2',
      [req.params.nodeId, req.params.floorId]
    )
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete node' })
  }
})

// ── Navigation edge write operations ─────────────────────────────────────────
router.post('/:floorId/edges', async (req, res) => {
  try {
    const { startNodeId, endNodeId, weight } = req.body
    if (!startNodeId || !endNodeId) {
      return res.status(400).json({ error: 'startNodeId and endNodeId are required' })
    }
    const edgeId = uuidv4()
    await pool.query(
      `INSERT INTO navigation_edges (edge_id, floor_id, start_node_id, end_node_id, weight)
       VALUES ($1, $2, $3, $4, $5)`,
      [edgeId, req.params.floorId, startNodeId, endNodeId, weight ?? 1]
    )
    const result = await pool.query(
      'SELECT * FROM navigation_edges WHERE edge_id = $1', [edgeId]
    )
    return res.status(201).json({ ok: true, data: result.rows[0] })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create edge' })
  }
})

router.delete('/:floorId/edges/:edgeId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM navigation_edges WHERE edge_id = $1 AND floor_id = $2',
      [req.params.edgeId, req.params.floorId]
    )
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete edge' })
  }
})

module.exports = router
