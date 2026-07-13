// Session-based authentication middleware
// Lightweight compatibility wrapper for refactor
async function verifySession(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || (req.body && req.body.sessionId)
  if (!sessionId) {
    req.user = null
    return next()
  }
  req.sessionId = sessionId
  req.user = { sessionId }
  next()
}

module.exports = { verifySession, verifyFirebaseToken: verifySession }
