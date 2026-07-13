import React from 'react'

export default function Navbar({ user, onLogout, onHome }) {
  return (
    <nav style={{
      padding: '12px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1em' }} onClick={onHome}>
        🗺️ Indoor Navigation
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ fontSize: '0.95em' }}>
            <span>{user.role === 'student' ? '👤' : user.role === 'admin' ? '🛠️' : '👨‍🏫'}</span>
            {' '}
            <strong>{user.name || user.email}</strong>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.9em',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
