import React from 'react'

export default function SearchBar({ onSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (onSearch) onSearch(q);
  }

  return (
    <form onSubmit={handleSubmit} style={{ margin: '12px 0' }}>
      <input name="q" placeholder="Search destination (room, lab, office)..." style={{ padding: 8, width: 300 }} />
      <button type="submit" style={{ marginLeft: 8 }}>Search</button>
    </form>
  )
}
