const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'indoor_navigation',
  max: parseInt(process.env.DB_POOL_SIZE) || 10,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

async function initializeDatabase() {
  const client = await pool.connect()
  try {
    console.log('Initializing database schema...')

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'visitor',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        uid VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        logout_time TIMESTAMP,
        FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR(255) PRIMARY KEY,
        location_name VARCHAR(255) NOT NULL,
        location_type VARCHAR(100),
        description TEXT,
        floor_id VARCHAR(100),
        x_coordinate DECIMAL(10, 2),
        y_coordinate DECIMAL(10, 2),
        role VARCHAR(50),
        visible_to TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS navigation_requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        search VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
      )
    `)

    // Floor Plans Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS floors (
        floor_id VARCHAR(255) PRIMARY KEY,
        building_id VARCHAR(255) NOT NULL,
        floor_number INT NOT NULL,
        floor_name VARCHAR(255),
        map_image_url VARCHAR(500),
        map_image_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        room_id VARCHAR(255) PRIMARY KEY,
        floor_id VARCHAR(255) NOT NULL,
        room_name VARCHAR(255) NOT NULL,
        room_type VARCHAR(100),
        x_coordinate DECIMAL(10, 2),
        y_coordinate DECIMAL(10, 2),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES floors(floor_id) ON DELETE CASCADE
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS navigation_nodes (
        node_id VARCHAR(255) PRIMARY KEY,
        floor_id VARCHAR(255) NOT NULL,
        node_name VARCHAR(255),
        node_type VARCHAR(50) DEFAULT 'corridor',
        x_coordinate DECIMAL(10, 2) NOT NULL,
        y_coordinate DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES floors(floor_id) ON DELETE CASCADE
      )
    `)

    // Add node_type column to existing tables (safe to run on existing DBs)
    await client.query(`ALTER TABLE navigation_nodes ADD COLUMN IF NOT EXISTS node_type VARCHAR(50) DEFAULT 'corridor'`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS navigation_edges (
        edge_id VARCHAR(255) PRIMARY KEY,
        floor_id VARCHAR(255) NOT NULL,
        start_node_id VARCHAR(255) NOT NULL,
        end_node_id VARCHAR(255) NOT NULL,
        weight DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES floors(floor_id) ON DELETE CASCADE,
        FOREIGN KEY (start_node_id) REFERENCES navigation_nodes(node_id) ON DELETE CASCADE,
        FOREIGN KEY (end_node_id) REFERENCES navigation_nodes(node_id) ON DELETE CASCADE
      )
    `)

    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_uid ON sessions(uid)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_locations_role ON locations(role)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_navigation_requests_user ON navigation_requests(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_floors_building ON floors(building_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nodes_floor ON navigation_nodes(floor_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_edges_floor ON navigation_edges(floor_id)`)

    console.log('Database schema initialized successfully')
  } catch (err) {
    console.error('Error initializing database schema:', err)
    throw err
  } finally {
    client.release()
  }
}

async function getConnection() {
  return pool.connect()
}

async function query(text, params) {
  const client = await pool.connect()
  try {
    return await client.query(text, params)
  } finally {
    client.release()
  }
}

async function close() {
  await pool.end()
}

module.exports = {
  pool,
  initializeDatabase,
  getConnection,
  query,
  close,
}
