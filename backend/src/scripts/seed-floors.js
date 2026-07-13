const { query } = require('../shared/utils/database')
const { v4: uuidv4 } = require('uuid')

async function seedFloorPlans() {
  try {
    console.log('Seeding floor plans data...')

    // Create a test building ID
    const buildingId = 'building-1'

    // Insert or reuse Floor 1 - Ground Floor with realistic layout
    let floor1Id = null
    const existingFloor = await query(
      'SELECT floor_id FROM floors WHERE building_id = $1 AND floor_number = $2 LIMIT 1',
      [buildingId, 0]
    )
    if (existingFloor.rows && existingFloor.rows[0]) {
      floor1Id = existingFloor.rows[0].floor_id
      console.log('Reusing existing floor id', floor1Id)
    } else {
      floor1Id = uuidv4()
      await query(
        `INSERT INTO floors (floor_id, building_id, floor_number, floor_name, map_image_url, map_image_path, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [floor1Id, buildingId, 0, 'Ground Floor', '/floor-plans/ground-floor.png', 'floor-plans/ground-floor.png']
      )
    }

    // Define navigation nodes - key locations on the floor plan
    // Based on the floor layout: helpdesk, exits, classrooms, restrooms
    const nodes = {
      helpdesk: { name: 'St HelpDesk', type: 'office', x: 150, y: 420 },
      exitB2: { name: 'Exit B2', type: 'emergency_exit', x: 80, y: 240 },
      exitB1: { name: 'Exit B1', type: 'emergency_exit', x: 80, y: 120 },
      lt2: { name: 'LT2 Classroom', type: 'entrance', x: 280, y: 100 },
      restroom: { name: 'Washroom Ladies', type: 'restroom', x: 410, y: 240 },
      corridorCenter: { name: 'Main Corridor', type: 'regular', x: 260, y: 240 },
      corridorTop: { name: 'North Corridor', type: 'regular', x: 260, y: 140 },
      corridorBottom: { name: 'South Corridor', type: 'regular', x: 260, y: 340 },
    }

    // Create node records and store IDs (reuse if node with same name exists on this floor)
    const nodeIds = {}
    for (const [key, node] of Object.entries(nodes)) {
      // try find existing node by name for this floor
      const existing = await query(
        'SELECT node_id FROM navigation_nodes WHERE floor_id = $1 AND LOWER(node_name) = LOWER($2) LIMIT 1',
        [floor1Id, node.name]
      )
      let nodeId
      if (existing.rows && existing.rows[0]) {
        nodeId = existing.rows[0].node_id
      } else {
        nodeId = uuidv4()
        await query(
          `INSERT INTO navigation_nodes (node_id, floor_id, node_name, node_type, x_coordinate, y_coordinate, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [nodeId, floor1Id, node.name, node.type, node.x, node.y]
        )
      }
      nodeIds[key] = nodeId
    }

    // Define edges to connect the nodes - create a connected graph
    const edges = [
      // Helpdesk to corridors
      [nodeIds.helpdesk, nodeIds.corridorBottom],
      [nodeIds.corridorBottom, nodeIds.corridorCenter],
      
      // Exit B2 connections
      [nodeIds.exitB2, nodeIds.corridorCenter],
      [nodeIds.exitB2, nodeIds.exitB1],
      
      // North connections
      [nodeIds.exitB1, nodeIds.corridorTop],
      [nodeIds.corridorTop, nodeIds.lt2],
      [nodeIds.corridorTop, nodeIds.corridorCenter],
      
      // Restroom connections
      [nodeIds.corridorCenter, nodeIds.restroom],
    ]

    // Insert edges (bidirectional - add reverse direction too). Reuse existing edges if present.
    for (const [start, end] of edges) {
      // forward edge
      const existsFwd = await query(
        'SELECT edge_id FROM navigation_edges WHERE floor_id = $1 AND start_node_id = $2 AND end_node_id = $3 LIMIT 1',
        [floor1Id, start, end]
      )
      if (!(existsFwd.rows && existsFwd.rows[0])) {
        const edgeId = uuidv4()
        await query(
          `INSERT INTO navigation_edges (edge_id, floor_id, start_node_id, end_node_id, weight, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [edgeId, floor1Id, start, end, 1]
        )
      }

      // reverse edge
      const existsRev = await query(
        'SELECT edge_id FROM navigation_edges WHERE floor_id = $1 AND start_node_id = $2 AND end_node_id = $3 LIMIT 1',
        [floor1Id, end, start]
      )
      if (!(existsRev.rows && existsRev.rows[0])) {
        const reverseEdgeId = uuidv4()
        await query(
          `INSERT INTO navigation_edges (edge_id, floor_id, start_node_id, end_node_id, weight, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [reverseEdgeId, floor1Id, end, start, 1]
        )
      }
    }

    console.log('Floor plans data seeded successfully!')
    console.log(`Building ID: ${buildingId}`)
    console.log(`Floor 1 ID: ${floor1Id}`)
    console.log(`✓ Created ${Object.keys(nodes).length} navigation nodes`)
    console.log(`✓ Created ${edges.length * 2} directional edges (bidirectional)`)
    console.log(`\nKey locations:`)
    Object.entries(nodes).forEach(([key, node]) => {
      console.log(`  • ${node.name} (${key})`)
    })
  } catch (err) {
    console.error('Error seeding floor plans:', err.message || err)
    process.exitCode = 1
  }
}

seedFloorPlans().then(() => process.exit(0))
