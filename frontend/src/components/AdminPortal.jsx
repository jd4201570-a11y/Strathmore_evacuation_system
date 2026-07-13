import React, { useState } from 'react'
import AdminDashboard from './AdminDashboard'
import { loginAdmin, resetAdminPassword } from '../services/authService'

export default function AdminPortal({ user, onAdminLogin, onLogout }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [needsReset, setNeedsReset] = useState(false)
  const [pendingSessionId, setPendingSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user && user.role === 'admin' && !needsReset) {
    return <AdminDashboard user={user} onLogout={onLogout} />
  }

  const submitLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await loginAdmin(email, password)
      if (response.requiresPasswordReset) {
        setNeedsReset(true)
        setPendingSessionId(response.user.sessionId)
        onAdminLogin(response.user)
        return
      }

      onAdminLogin(response.user)
    } catch (err) {
      setError(err.message || 'Admin login failed')
    } finally {
      setLoading(false)
    }
  }

  const submitReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetAdminPassword(pendingSessionId, newPassword)
      setNeedsReset(false)
      setNewPassword('')
    } catch (err) {
      setError(err.message || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg, #0b1f16 0%, #163828 100%)', color: 'white' }}>
      <div style={{ width: 'min(540px, 92vw)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: 24, backdropFilter: 'blur(6px)' }}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Indoor Navigation Admin Portal</h1>
        <p style={{ marginTop: 0, opacity: 0.9 }}>
          This portal is intentionally separate from the general application UI.
        </p>

        {!needsReset && (
          <form onSubmit={submitLogin}>
            <label style={{ display: 'block', marginBottom: 6 }}>Admin Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type='email' required style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #6c8f7a' }} />

            <label style={{ display: 'block', marginBottom: 6 }}>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type='password' required style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #6c8f7a' }} />

            {error && <div style={{ background: '#7a1f1f', padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

            <button disabled={loading} type='submit' style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#1f7a4a', color: 'white', fontWeight: 700 }}>
              {loading ? 'Signing in...' : 'Sign In as Admin'}
            </button>
          </form>
        )}

        {needsReset && (
          <form onSubmit={submitReset}>
            <h3 style={{ marginTop: 0 }}>Reset Admin Password</h3>
            <p style={{ opacity: 0.9 }}>You signed in with super-admin bootstrap credentials. Set your preferred password now.</p>
            <label style={{ display: 'block', marginBottom: 6 }}>New Password</label>
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type='password' minLength={8} required style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #6c8f7a' }} />

            {error && <div style={{ background: '#7a1f1f', padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

            <button disabled={loading} type='submit' style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#1f7a4a', color: 'white', fontWeight: 700 }}>
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
