const express = require('express')
const { body } = require('express-validator')
const { handleValidation, validateEmail, validatePassword } = require('../middleware/validate')
const userService = require('../shared/utils/userService')

const router = express.Router()

function sessionIdFromRequest(req) {
  return req.body.sessionId || req.query.sessionId || req.headers['x-session-id']
}

router.post(
  '/register',
  validateEmail,
  validatePassword,
  body('name').isString().notEmpty(),
  body('role').optional().isString(),
  handleValidation,
  async (req, res) => {
    try {
      const { email, password, name, role = 'visitor' } = req.body
      const existing = await userService.getUserByEmail(email)
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' })
      }

      const user = await userService.saveUser({ email, password, name, role })
      const session = await userService.createSession({ uid: user.uid, email: user.email, role: user.role })

      return res.status(201).json({
        ok: true,
        user: {
          ...user,
          sessionId: session.session_id,
        },
      })
    } catch (error) {
      return res.status(500).json({ error: 'Registration failed' })
    }
  }
)

router.post(
  '/login',
  validateEmail,
  body('password').isString().notEmpty(),
  handleValidation,
  async (req, res) => {
    try {
      const { email, password } = req.body
      const uid = await userService.verifyUserPassword(email, password)
      if (!uid) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      const user = await userService.getUser(uid)
      const session = await userService.createSession({ uid: user.uid, email: user.email, role: user.role })

      return res.json({
        ok: true,
        user: {
          ...user,
          sessionId: session.session_id,
        },
      })
    } catch (error) {
      return res.status(500).json({ error: 'Login failed' })
    }
  }
)

router.post(
  '/admin/login',
  validateEmail,
  body('password').isString().notEmpty(),
  handleValidation,
  async (req, res) => {
    try {
      const { email, password } = req.body
      const allowedEmail = process.env.SUPER_ADMIN_EMAIL
      const allowedPassword = process.env.SUPER_ADMIN_PASSWORD

      if (!allowedEmail || !allowedPassword || email !== allowedEmail || password !== allowedPassword) {
        return res.status(401).json({ error: 'Invalid admin credentials' })
      }

      let adminUser = await userService.getUserByEmail(email)
      if (!adminUser) {
        adminUser = await userService.saveUser({
          email,
          password,
          name: 'Super Admin',
          role: 'admin',
        })
      }

      const session = await userService.createSession({ uid: adminUser.uid, email: adminUser.email, role: adminUser.role })

      return res.json({
        ok: true,
        user: {
          ...adminUser,
          sessionId: session.session_id,
        },
        requiresPasswordReset: true,
      })
    } catch (error) {
      return res.status(500).json({ error: 'Admin login failed' })
    }
  }
)

router.post(
  '/admin/reset-password',
  body('sessionId').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 6 }),
  handleValidation,
  async (req, res) => {
    try {
      const { sessionId, newPassword } = req.body
      const session = await userService.getActiveSession(sessionId)
      if (!session) {
        return res.status(401).json({ error: 'Invalid session' })
      }
      if (session.role !== 'admin') {
        return res.status(403).json({ error: 'Admin role required' })
      }

      await userService.updateUserPassword(session.uid, newPassword)
      return res.json({ ok: true })
    } catch (error) {
      return res.status(500).json({ error: 'Password reset failed' })
    }
  }
)

router.post('/logout', async (req, res) => {
  try {
    const sessionId = sessionIdFromRequest(req)
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' })
    }
    await userService.endSession(sessionId)
    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: 'Logout failed' })
  }
})

router.get('/me', async (req, res) => {
  try {
    const sessionId = sessionIdFromRequest(req)
    if (!sessionId) {
      return res.status(401).json({ error: 'Session ID required' })
    }

    const session = await userService.getActiveSession(sessionId)
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    await userService.updateSessionActivity(sessionId)
    const user = await userService.getUser(session.uid)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({ ok: true, user: { ...user, sessionId } })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
})

router.post('/verify-session', async (req, res) => {
  try {
    const sessionId = sessionIdFromRequest(req)
    if (!sessionId) {
      return res.status(400).json({ ok: false, isActive: false })
    }

    const session = await userService.getActiveSession(sessionId)
    if (!session) {
      return res.json({ ok: true, isActive: false })
    }

    await userService.updateSessionActivity(sessionId)
    return res.json({ ok: true, isActive: true })
  } catch (error) {
    return res.status(500).json({ ok: false, isActive: false })
  }
})

module.exports = router
