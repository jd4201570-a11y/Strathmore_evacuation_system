const API_BASE = 'http://localhost:4000/api'

/**
 * Register a new user with backend API
 */
export async function registerUser(email, password, name, role = 'visitor') {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    throw new Error(error.message)
  }
}

/**
 * Login user with backend API
 */
export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    throw new Error(error.message)
  }
}

/**
 * Logout user
 */
export async function logoutUser(sessionId) {
  try {
    if (!sessionId) return

    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
  } catch (error) {
    console.error('Logout error:', error)
  }
}

/**
 * Get current user info from session
 */
export async function getCurrentUser(sessionId) {
  try {
    if (!sessionId) return null

    const response = await fetch(`${API_BASE}/auth/me?sessionId=${sessionId}`)
    if (!response.ok) return null

    const data = await response.json()
    return data.ok ? data.user : null
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

/**
 * Verify session is still active
 */
export async function verifySession(sessionId) {
  try {
    if (!sessionId) return false

    const response = await fetch(`${API_BASE}/auth/verify-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })

    if (!response.ok) return false

    const data = await response.json()
    return data.ok && data.isActive
  } catch (error) {
    console.error('Verify session error:', error)
    return false
  }
}

/**
 * Admin login via dedicated admin endpoint
 */
export async function loginAdmin(email, password) {
  const response = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Admin login failed')
  }

  return response.json()
}

/**
 * Force-reset admin password after super-admin bootstrap login
 */
export async function resetAdminPassword(sessionId, newPassword) {
  const response = await fetch(`${API_BASE}/auth/admin/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, newPassword }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Password reset failed')
  }

  return response.json()
}

/**
 * Listen to session changes by checking periodically
 */
export function onAuthChange(callback) {
  const sessionId = localStorage.getItem('sessionId')
  
  if (!sessionId) {
    callback(null)
    return () => {}
  }

  // Get initial user
  getCurrentUser(sessionId).then(user => {
    if (user) {
      localStorage.setItem('sessionId', user.sessionId)
      callback(user)
    } else {
      localStorage.removeItem('sessionId')
      callback(null)
    }
  })

  // Check periodically (every 5 minutes)
  const interval = setInterval(() => {
    verifySession(sessionId).then(isActive => {
      if (!isActive) {
        localStorage.removeItem('sessionId')
        callback(null)
      }
    })
  }, 5 * 60 * 1000)

  return () => clearInterval(interval)
}
