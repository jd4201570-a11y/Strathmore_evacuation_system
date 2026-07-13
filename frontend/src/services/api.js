const API_ROOT = import.meta.env.VITE_API_ROOT || 'http://localhost:4000'

async function makeRequest(endpoint, options = {}) {
  const sessionId = localStorage.getItem('sessionId')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (sessionId) {
    headers['X-Session-Id'] = sessionId
  }

  const response = await fetch(`${API_ROOT}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `API error: ${response.status}`)
  }

  return response.json()
}

// Floor Plans API
export async function getFloors() {
  return makeRequest('/api/floor-plans/floors')
}

export async function createFloor(floorData) {
  return makeRequest('/api/floor-plans/floors', {
    method: 'POST',
    body: JSON.stringify(floorData)
  })
}

export async function uploadFloorPlanImage(file, buildingId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('buildingId', buildingId)

  const sessionId = localStorage.getItem('sessionId')
  const headers = {}
  if (sessionId) {
    headers['X-Session-Id'] = sessionId
  }

  const response = await fetch(`${API_ROOT}/api/floor-plans/upload`, {
    method: 'POST',
    headers,
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }

  return response.json()
}

// Rooms API
export async function createRoom(roomData) {
  return makeRequest('/api/floor-plans/rooms', {
    method: 'POST',
    body: JSON.stringify(roomData)
  })
}

export async function getRoomsForFloor(floorId) {
  return makeRequest(`/api/floor-plans/rooms?floorId=${encodeURIComponent(floorId)}`)
}

export async function updateRoom(roomId, roomData) {
  return makeRequest(`/api/floor-plans/rooms/${roomId}`, {
    method: 'PUT',
    body: JSON.stringify(roomData)
  })
}

export async function deleteRoom(roomId) {
  return makeRequest(`/api/floor-plans/rooms/${roomId}`, {
    method: 'DELETE'
  })
}

// Navigation Nodes API
export async function createNode(nodeData) {
  return makeRequest('/api/floor-plans/nodes', {
    method: 'POST',
    body: JSON.stringify(nodeData)
  })
}

export async function getNodesForFloor(floorId) {
  return makeRequest(`/api/floor-plans/${encodeURIComponent(floorId)}/nodes`)
}

export async function updateNode(nodeId, nodeData) {
  return makeRequest(`/api/floor-plans/nodes/${nodeId}`, {
    method: 'PUT',
    body: JSON.stringify(nodeData)
  })
}

export async function deleteNode(nodeId) {
  return makeRequest(`/api/floor-plans/nodes/${nodeId}`, {
    method: 'DELETE'
  })
}

// Navigation Edges API
export async function createEdge(edgeData) {
  return makeRequest('/api/floor-plans/edges', {
    method: 'POST',
    body: JSON.stringify(edgeData)
  })
}

export async function getEdgesForFloor(floorId) {
  return makeRequest(`/api/floor-plans/${encodeURIComponent(floorId)}/edges`)
}

export async function deleteEdge(edgeId) {
  return makeRequest(`/api/floor-plans/edges/${edgeId}`, {
    method: 'DELETE'
  })
}

// Legacy endpoints
export async function getLocations(floorId) {
  const url = `${API_ROOT}/api/locations${floorId ? '?floorId='+encodeURIComponent(floorId) : ''}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return data
    } else if (data && Array.isArray(data.locations)) {
      return data.locations
    } else if (data && Array.isArray(data.data)) {
      return data.data
    }
    
    return []
  } catch (e) {
    console.warn('Failed to fetch locations from API:', e)
    return []
  }
}

export async function getRoute(sessionId, startLocationId, destinationLocationId, floorId) {
  const headers = { 'Content-Type': 'application/json' }
  if (sessionId) {
    headers['X-Session-Id'] = sessionId
  }
  const res = await fetch(`${API_ROOT}/api/navigation/route`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ startLocationId, destinationLocationId, floorId })
  })
  return res.json()
}
