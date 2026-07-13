/**
 * Ground Floor complete navigation graph setup:
 * 1. Removes duplicate/redundant edges
 * 2. Adds all missing connections so every node is reachable
 */
const { query } = require('../src/shared/utils/database');

// Full node ID map (from current DB)
const N = {
  corridorG1:       '073c29d7-0000-0000-0000-000000000000', // placeholder — resolved below
  corridorG2:       null,
  quadrangleCorridor: null,
  stairs:           null,
  helpDesk:         null,
  chapel:           null,
  admisionOffice:   null,
  quadrangle:       null,
  groundfloor:      null,
  ltGroundFloor:    null,
  sces:             null,
  lt34a:            null, // first LT 3,4
  lt34b:            null, // duplicate LT 3,4
  emergencyExitB1:  null,
  emergencyExitB2:  null,
  emergencyExitB4:  null,
  emergencyExitB6:  null,
  emergencyExitB7:  null,
};

// Logical connections for a complete, fully-connected ground floor
// Each pair is undirected (dijkstra handles both directions from one row)
const DESIRED_CONNECTIONS = [
  // Main spine
  ['helpDesk',          'corridorG1'],
  ['corridorG1',        'stairs'],
  ['stairs',            'quadrangleCorridor'],
  ['quadrangleCorridor','quadrangle'],
  // Branches from corridor g1
  ['corridorG1',        'admisionOffice'],
  ['corridorG1',        'emergencyExitB1'],
  // Branches from stairs
  ['stairs',            'lt34a'],
  ['stairs',            'sces'],
  // Branches from quadrangle
  ['quadrangle',        'chapel'],
  ['quadrangle',        'groundfloor'],
  ['quadrangle',        'emergencyExitB6'],
  ['quadrangle',        'emergencyExitB7'],
  // quadrangle corridor branches
  ['quadrangleCorridor','corridorG2'],
  ['quadrangleCorridor','emergencyExitB4'],
  // corridor g2 branches
  ['corridorG2',        'ltGroundFloor'],
  ['corridorG2',        'emergencyExitB2'],
];

async function run() {
  try {
    // Resolve all node IDs
    const nodesRes = await query(
      `SELECT node_id, node_name FROM navigation_nodes 
       WHERE floor_id = (SELECT floor_id FROM floors WHERE floor_number = 1 LIMIT 1)`
    );

    const nameToKey = {
      'corridor g1':        'corridorG1',
      'corridor g2':        'corridorG2',
      'quadrangle corridor':'quadrangleCorridor',
      'stairs':             'stairs',
      'helpdesk':           'helpDesk',
      'chapel':             'chapel',
      'admision office':    'admisionOffice',
      'quadrangle':         'quadrangle',
      'groundfloor':        'groundfloor',
      'lt ground floor':    'ltGroundFloor',
      'sces':               'sces',
      'emergency_exit b1':  'emergencyExitB1',
      'emergency_exitb2':   'emergencyExitB2',
      'emergency_exitb4':   'emergencyExitB4',
      'emergency_exitb6':   'emergencyExitB6',
      'emergency_exitb7':   'emergencyExitB7',
    };

    const lt34Nodes = [];
    for (const row of nodesRes.rows) {
      const key = nameToKey[row.node_name.toLowerCase().trim()];
      if (key) {
        N[key] = row.node_id;
      } else if (row.node_name.toLowerCase().includes('lt 3,4') || row.node_name.toLowerCase() === 'lt 3,4') {
        lt34Nodes.push(row.node_id);
      }
    }

    if (lt34Nodes.length > 0) N['lt34a'] = lt34Nodes[0];
    if (lt34Nodes.length > 1) N['lt34b'] = lt34Nodes[1];

    console.log('Resolved nodes:');
    Object.entries(N).forEach(([k, v]) => console.log('  ', k, '=', v ? v.slice(0, 8) : 'NOT FOUND'));

    // ── Step 1: Delete all existing edges for this floor and start fresh ──
    const floorRes = await query('SELECT floor_id FROM floors WHERE floor_number = 1 LIMIT 1');
    const floorId = floorRes.rows[0]?.floor_id;
    if (!floorId) { console.error('Floor not found'); process.exit(1); }

    const delRes = await query('DELETE FROM navigation_edges WHERE floor_id = $1', [floorId]);
    console.log(`\nDeleted ${delRes.rowCount} existing edges`);

    // ── Step 2: Re-insert clean unique edges ──
    const { v4: uuidv4 } = require('uuid');
    let added = 0, skipped = 0;

    for (const [aKey, bKey] of DESIRED_CONNECTIONS) {
      const aId = N[aKey];
      const bId = N[bKey];
      if (!aId || !bId) {
        console.warn(`  SKIP ${aKey} <-> ${bKey}: node not found`);
        skipped++;
        continue;
      }
      const edgeId = uuidv4();
      await query(
        `INSERT INTO navigation_edges (edge_id, floor_id, start_node_id, end_node_id, weight, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [edgeId, floorId, aId, bId, 1]
      );
      console.log(`  ✓ ${aKey} <-> ${bKey}`);
      added++;
    }

    // Also connect the duplicate LT 3,4 (lt34b) to stairs if it exists
    if (N.lt34b && N.stairs) {
      await query(
        `INSERT INTO navigation_edges (edge_id, floor_id, start_node_id, end_node_id, weight, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [uuidv4(), floorId, N.lt34b, N.stairs, 1]
      );
      console.log('  ✓ lt34b (duplicate LT 3,4) <-> stairs');
      added++;
    }

    console.log(`\nDone. Added ${added} edges, skipped ${skipped}.`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

run();
