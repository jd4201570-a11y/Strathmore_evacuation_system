const API_BASE = `${import.meta.env.VITE_API_ROOT || ''}/api`

/**
 * Get all locations for a specific role from backend API
 */
export async function getLocationsForRole(role) {
  try {
    const response = await fetch(`${API_BASE}/locations?role=${role}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch locations')
    }
    
    const data = await response.json()
    return data.locations || []
  } catch (error) {
    console.error('Error getting locations:', error)
    return []
  }
}

/**
 * Search locations by name or description
 */
export async function searchLocations(query, role) {
  try {
    const response = await fetch(`${API_BASE}/locations/search?q=${encodeURIComponent(query)}&role=${role}`)
    
    if (!response.ok) {
      throw new Error('Search failed')
    }
    
    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error searching locations:', error)
    return []
  }
}

/**
 * Get navigation nodes for a specific floor
 */
export async function getFloorNodes(floorId) {
  try {
    const response = await fetch(`${API_BASE}/locations/nodes?floorId=${floorId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch nodes')
    }
    
    const data = await response.json()
    return data.nodes || []
  } catch (error) {
    console.error('Error getting floor nodes:', error)
    return []
  }
}

/**
 * Create a new location
 */
export async function createLocation(location, role) {
  try {
    const response = await fetch(`${API_BASE}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...location, role }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create location')
    }
    
    const data = await response.json()
    return data.location
  } catch (error) {
    console.error('Error creating location:', error)
    throw error
  }
}

/**
 * Delete a location
 */
export async function deleteLocation(locationId) {
  try {
    const response = await fetch(`${API_BASE}/locations/${locationId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete location')
    }
  } catch (error) {
    console.error('Error deleting location:', error)
    throw error
  }
}

/**
 * Get user navigation history
 */
export async function getUserNavigationHistory(userId) {
  try {
    const response = await fetch(`${API_BASE}/locations/history?userId=${userId}`)
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.history || []
  } catch (error) {
    console.error('Error getting navigation history:', error)
    return []
  }
}

/**
 * Save navigation search to history
 */
export async function saveNavigationSearch(userId, search) {
  try {
    await fetch(`${API_BASE}/locations/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, search }),
    })
  } catch (error) {
    console.error('Error saving navigation history:', error)
  }
}

/**
 * Cache locations locally (simple localStorage implementation)
 */
export async function cacheLocations(locations) {
  try {
    localStorage.setItem('cachedLocations', JSON.stringify(locations))
  } catch (error) {
    console.warn('Failed to cache locations:', error)
  }
}
