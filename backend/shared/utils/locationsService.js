const { pool } = require('../../src/shared/utils/database')

const DEMO_LOCATIONS = {
  visitor: [
    { id: 'help', locationName: 'Help Desk', description: 'Information desk', floorId: '1' },
    { id: 'exit-b2', locationName: 'Exit B2', description: 'Main exit point', floorId: '1' },
  ],
  student: [
    { id: 'lib1', locationName: 'Main Library', description: 'Central library', floorId: '1' },
    { id: 'cafe', locationName: 'Cafeteria', description: 'Dining area', floorId: '1' },
  ],
  staff: [
    { id: 'admin', locationName: 'Admin Office', description: 'Administration', floorId: '1' },
  ],
}

function normalizeRole(role) {
  return String(role || 'visitor').trim().toLowerCase()
}

async function getLocationsForRole(role = 'visitor') {
  const normalizedRole = normalizeRole(role)
  try {
    const result = await pool.query(
      `SELECT id, location_name, description, floor_id, role
       FROM locations
       WHERE role = $1 OR role IS NULL
       ORDER BY location_name ASC`,
      [normalizedRole]
    )

    if (result.rows.length > 0) {
      return result.rows.map((row) => ({
        id: row.id,
        locationName: row.location_name,
        description: row.description,
        floorId: row.floor_id,
        role: row.role,
      }))
    }
  } catch (error) {
    // Fallback to in-memory demo data when DB is unavailable.
  }

  return DEMO_LOCATIONS[normalizedRole] || DEMO_LOCATIONS.visitor
}

module.exports = {
  getLocationsForRole,
  DEMO_LOCATIONS,
}
