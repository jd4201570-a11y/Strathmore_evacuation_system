const crypto = require('crypto')
const { pool } = require('../../src/shared/utils/database')

function toUser(row) {
  if (!row) return null
  return {
    uid: row.uid,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex')
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

async function saveUser({ email, password, name, role = 'visitor' }) {
  const uid = createId('user')
  const passwordHash = hashPassword(password)
  const result = await pool.query(
    `INSERT INTO users (uid, email, password_hash, name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING uid, email, name, role, is_active`,
    [uid, email, passwordHash, name, role]
  )
  return toUser(result.rows[0])
}

async function getUserByEmail(email) {
  const result = await pool.query(
    `SELECT uid, email, name, role, is_active
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email]
  )
  return toUser(result.rows[0])
}

async function getUser(uid) {
  const result = await pool.query(
    `SELECT uid, email, name, role, is_active
     FROM users
     WHERE uid = $1
     LIMIT 1`,
    [uid]
  )
  return toUser(result.rows[0])
}

async function getUserWithPasswordHash(email) {
  const result = await pool.query(
    `SELECT uid, email, name, role, is_active, password_hash
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email]
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    uid: row.uid,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
    passwordHash: row.password_hash,
  }
}

async function verifyUserPassword(email, password) {
  const user = await getUserWithPasswordHash(email)
  if (!user) return null
  return user.passwordHash === hashPassword(password) ? user.uid : null
}

async function createSession({ uid, email, role }) {
  const sessionId = createId('session')
  const result = await pool.query(
    `INSERT INTO sessions (session_id, uid, email, role, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING session_id`,
    [sessionId, uid, email, role]
  )
  return { session_id: result.rows[0].session_id }
}

async function getActiveSession(sessionId) {
  const result = await pool.query(
    `SELECT session_id, uid, email, role, is_active
     FROM sessions
     WHERE session_id = $1 AND is_active = true
     LIMIT 1`,
    [sessionId]
  )
  return result.rows[0] || null
}

async function getSessionById(sessionId) {
  const result = await pool.query(
    `SELECT session_id, uid, email, role, is_active
     FROM sessions
     WHERE session_id = $1
     LIMIT 1`,
    [sessionId]
  )
  return result.rows[0] || null
}

async function updateSessionActivity(sessionId) {
  await pool.query(
    `UPDATE sessions
     SET last_activity = CURRENT_TIMESTAMP
     WHERE session_id = $1`,
    [sessionId]
  )
  return true
}

async function endSession(sessionId) {
  const result = await pool.query(
    `UPDATE sessions
     SET is_active = false,
         logout_time = CURRENT_TIMESTAMP
     WHERE session_id = $1`,
    [sessionId]
  )
  return result.rowCount > 0
}

async function updateUserPassword(uid, newPassword) {
  const passwordHash = hashPassword(newPassword)
  await pool.query(
    `UPDATE users
     SET password_hash = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE uid = $1`,
    [uid, passwordHash]
  )
  return true
}

module.exports = {
  saveUser,
  getUserByEmail,
  verifyUserPassword,
  createSession,
  getActiveSession,
  getSessionById,
  updateSessionActivity,
  endSession,
  getUser,
  getUserWithPasswordHash,
  updateUserPassword,
}
