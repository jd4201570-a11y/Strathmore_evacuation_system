const { query, close } = require('../shared/utils/database')

async function test() {
  try {
    const res = await query('SELECT NOW() as now')
    console.log('Database connected. Server time:', res.rows[0].now)
  } catch (err) {
    console.error('Database connection failed:', err.message || err)
    process.exitCode = 1
  } finally {
    await close()
  }
}

test()
