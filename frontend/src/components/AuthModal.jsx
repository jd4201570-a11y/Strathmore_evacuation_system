import React, { useState, useEffect } from 'react'
import { registerUser, loginUser } from '../services/authService'

export default function AuthModal({ role, onClose, onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (isRegister && !name) {
      setError('Please enter your name')
      setLoading(false)
      return
    }

    try {
      let user

      if (isRegister) {
        // Register new user
        user = await registerUser(email, password, name, role)
      } else {
        // Login existing user
        user = await loginUser(email, password)
      }

      // Store session ID in localStorage
      localStorage.setItem('sessionId', user.sessionId)

      // Call onLogin with the authenticated user
      onLogin(user)
    } catch (err) {
      setError(err.message || 'Authentication failed')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 12,
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        maxWidth: 400,
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 20, textAlign: 'center', fontSize: '0.9em' }}>
          {role === 'student' ? '👤 Signing in as Student' : role === 'admin' ? '🛠️ Signing in as Admin' : '👨‍🏫 Signing in as Lecturer'}
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: '#333' }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: '1em',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: '#333' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'student' ? 'student@strathmore.ac.ke' : role === 'admin' ? 'admin@strathmore.ac.ke' : 'lecturer@strathmore.ac.ke'}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: '1em',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: '#333' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: '1em',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: 10,
              borderRadius: 6,
              marginBottom: 15,
              fontSize: '0.9em'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              background: loading ? '#ccc' : (role === 'student' ? '#667eea' : role === 'admin' ? '#0f5132' : '#764ba2'),
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '1em',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')}
            onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
          >
            {loading ? 'Loading...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', paddingTop: 20, borderTop: '1px solid #eee' }}>
          <p style={{ margin: 0, color: '#666' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1em'
              }}
            >
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        </div>

        <div style={{ marginTop: 15, padding: 10, background: '#fffbe6', borderRadius: 6, fontSize: '0.85em', color: '#666' }}>
          <strong>ℹ️ Note:</strong> Your credentials are securely saved in PostgreSQL database and your session is tracked.
        </div>
      </div>
    </div>
  )
}
