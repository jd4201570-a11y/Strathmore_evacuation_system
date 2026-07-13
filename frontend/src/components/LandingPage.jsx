import React, { useState } from 'react'

export default function LandingPage({ onNavigateClick, onLoginClick }) {
  const visitorLocations = [
    { id: 'adm', name: 'Admissions Office', icon: '📋', color: '#e8f5e9' },
    { id: 'shop', name: 'Bookshop', icon: '📚', color: '#e3f2fd' },
    { id: 'chapel', name: 'Chapel', icon: '⛪', color: '#fce4ec' },
    { id: 'help', name: 'Help Desk', icon: '❓', color: '#fff9c4' }
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Hero Section */}
      <section style={{ padding: '60px 20px', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '3em', marginBottom: 10 }}>Strathmore University</h1>
        <p style={{ fontSize: '1.2em', marginBottom: 30, opacity: 0.95 }}>Indoor Navigation System</p>
        <p style={{ fontSize: '1em', marginBottom: 40, maxWidth: '600px', margin: '0 auto 40px' }}>
          Find your way around campus with our interactive navigation system. 
          Explore student facilities or visit as a guest.
        </p>
      </section>

      {/* Main Content */}
      <section style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Visitor Quick Access */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ color: 'white', textAlign: 'center', marginBottom: 30 }}>Welcome! Quick Access</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {visitorLocations.map(loc => (
              <div
                key={loc.id}
                onClick={onNavigateClick}
                style={{
                  background: loc.color,
                  padding: 30,
                  borderRadius: 12,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  ':hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 12px rgba(0,0,0,0.2)'
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ fontSize: '3em', marginBottom: 15 }}>{loc.icon}</div>
                <h3 style={{ margin: 0, color: '#333' }}>{loc.name}</h3>
                <p style={{ margin: '10px 0 0', fontSize: '0.9em', color: '#666' }}>Click to navigate</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div style={{
          background: 'white',
          padding: 50,
          borderRadius: 12,
          textAlign: 'center',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#333', marginBottom: 15 }}>More Facilities Available</h2>
          <p style={{ color: '#666', marginBottom: 30, fontSize: '1.1em' }}>
            Students and staff can access all university facilities including classrooms, 
            laboratories, libraries, dining areas, sports complexes, and more.
          </p>
          
          <div style={{ display: 'flex', gap: 15, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => onLoginClick('student')}
              style={{
                padding: '14px 32px',
                fontSize: '1em',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#5568d3'}
              onMouseLeave={(e) => e.target.style.background = '#667eea'}
            >
              👤 Sign In as Student
            </button>
            
            <button
              onClick={() => onLoginClick('lecturer')}
              style={{
                padding: '14px 32px',
                fontSize: '1em',
                background: '#764ba2',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#653a8c'}
              onMouseLeave={(e) => e.target.style.background = '#764ba2'}
            >
              👨‍🏫 Sign In as Lecturer
            </button>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'rgba(0,0,0,0.1)',
        color: 'white',
        padding: 20,
        textAlign: 'center',
        marginTop: 60,
        fontSize: '0.9em'
      }}>
        <p>© 2026 Strathmore University. All rights reserved.</p>
      </footer>
    </div>
  )
}
