import React, { useState, useEffect } from 'react'
import EvacuationPage from './components/EvacuationPage'
import AdminPortal from './components/AdminPortal'
import { onAuthChange, logoutUser } from './services/authService'

export default function App() {
  const pathname = (typeof window !== 'undefined' ? window.location.pathname : '').toLowerCase()
  const isAdminPortal = /(\/admin\/?$)|(\/indoor_navigation(?:\/|%20|\s)admin\/?$)/.test(pathname)

  const [adminUser, setAdminUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(isAdminPortal)

  useEffect(() => {
    if (!isAdminPortal) return

    const unsubscribe = onAuthChange((authUser) => {
      if (authUser && authUser.role === 'admin') {
        setAdminUser(authUser)
      } else {
        setAdminUser(null)
      }
      setAuthLoading(false)
    })
    return unsubscribe
  }, [isAdminPortal])

  const handleAdminLogin = (user) => {
    localStorage.setItem('sessionId', user.sessionId)
    setAdminUser(user)
  }

  const handleAdminLogout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId')
      if (sessionId) {
        await logoutUser(sessionId)
        localStorage.removeItem('sessionId')
      }
    } catch (e) {
      console.error('Logout error:', e)
      localStorage.removeItem('sessionId')
    }
    setAdminUser(null)
  }

  if (isAdminPortal) {
    if (authLoading) {
      return (
        <div className="app-loading">
          <h2>Loading Admin Portal…</h2>
        </div>
      )
    }
    return (
      <AdminPortal
        user={adminUser}
        onAdminLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
      />
    )
  }

  return <EvacuationPage />
}
