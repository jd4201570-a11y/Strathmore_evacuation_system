// User Service - DEPRECATED
// Migration complete: Using authService.js and backend PostgreSQL instead
// This file is no longer used

export async function saveUser(uid, email, name, role = 'student') {
  throw new Error('userService.saveUser is deprecated. Use authService.registerUser instead.')
}

export async function getUser(uid) {
  throw new Error('userService.getUser is deprecated.')
}

export async function getUserByEmail(email) {
  throw new Error('userService.getUserByEmail is deprecated.')
}

export async function createSession(uid, email, role) {
  throw new Error('userService.createSession is deprecated. Use authService.loginUser instead.')
}

export async function storeDemoUser() {
  throw new Error('userService.storeDemoUser is deprecated.')
}

    
    await setDoc(sessionRef, {
      sessionId,
      uid,
      email,
      role,
      loginTime: serverTimestamp(),
      lastActivity: serverTimestamp(),
      isActive: true
    })

    return sessionId
  } catch (error) {
    console.error('Error creating session:', error)
    throw new Error(`Failed to create session: ${error.message}`)
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId) {
  try {
    const sessionRef = doc(db, 'sessions', sessionId)
    await updateDoc(sessionRef, {
      lastActivity: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating session:', error)
  }
}

/**
 * End session when user logs out
 */
export async function endSession(sessionId) {
  try {
    const sessionRef = doc(db, 'sessions', sessionId)
    await updateDoc(sessionRef, {
      isActive: false,
      logoutTime: serverTimestamp()
    })
  } catch (error) {
    console.error('Error ending session:', error)
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(uid) {
  try {
    const sessionsRef = collection(db, 'sessions')
    const q = query(sessionsRef, where('uid', '==', uid), where('isActive', '==', true))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => doc.data())
  } catch (error) {
    console.error('Error getting user sessions:', error)
    return []
  }
}

/**
 * Get current active session
 */
export async function getActiveSession(uid) {
  try {
    const sessions = await getUserSessions(uid)
    if (sessions.length > 0) {
      return sessions[0]
    }
    return null
  } catch (error) {
    console.error('Error getting active session:', error)
    return null
  }
}

/**
 * Store demo user (fallback for demo mode)
 */
export async function storeDemoUser(email, name, role = 'student') {
  try {
    const demoUid = `demo_${Date.now()}`
    const userRef = doc(db, 'users', demoUid)
    
    await setDoc(userRef, {
      uid: demoUid,
      email,
      name,
      role,
      isDemo: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: true
    })

    return {
      uid: demoUid,
      email,
      name,
      role,
      isDemo: true,
      isAuthenticated: true
    }
  } catch (error) {
    console.error('Error storing demo user:', error)
    throw new Error(`Failed to store demo user: ${error.message}`)
  }
}

/**
 * Get all users (for admin)
 */
export async function getAllUsers() {
  try {
    const usersRef = collection(db, 'users')
    const querySnapshot = await getDocs(usersRef)
    
    return querySnapshot.docs.map(doc => doc.data())
  } catch (error) {
    console.error('Error getting all users:', error)
    return []
  }
}

/**
 * Delete user (for cleanup)
 */
export async function deleteUser(uid) {
  try {
    const userRef = doc(db, 'users', uid)
    await deleteDoc(userRef)
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error(`Failed to delete user: ${error.message}`)
  }
}
