const API_ROOT = import.meta.env.VITE_API_ROOT || ''

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

export const floorPlansService = {
  /**
   * Get all floors for a building
   * @param {string} buildingId - Building ID
   * @returns {Promise<Array>} Array of floor plans
   */
  getFloorsByBuilding: async (buildingId) => {
    try {
      const response = await makeRequest(`/api/floor-plans/building/${buildingId}`)
      return response.data || response
    } catch (error) {
      console.error(`Error fetching floors for building ${buildingId}:`, error)
      throw error
    }
  },

  /**
   * Get a specific floor plan by ID
   * @param {string} floorId - Floor ID
   * @returns {Promise<Object>} Floor plan data
   */
  getFloorPlan: async (floorId) => {
    try {
      const response = await makeRequest(`/api/floor-plans/${floorId}`)
      return response.data || response
    } catch (error) {
      console.error(`Error fetching floor plan ${floorId}:`, error)
      throw error
    }
  },

  /**
   * Get rooms for a floor
   * @param {string} floorId - Floor ID
   * @returns {Promise<Array>} Array of rooms
   */
  getRoomsForFloor: async (floorId) => {
    try {
      const response = await makeRequest(`/api/floor-plans/${floorId}/rooms`)
      return response.data || response
    } catch (error) {
      console.error(`Error fetching rooms for floor ${floorId}:`, error)
      throw error
    }
  },

  createRoom: async (floorId, roomData) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/rooms`, {
      method: 'POST',
      body: JSON.stringify(roomData)
    })
    return response.data || response
  },

  updateRoom: async (floorId, roomId, roomData) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(roomData)
    })
    return response.data || response
  },

  deleteRoom: async (floorId, roomId) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/rooms/${roomId}`, {
      method: 'DELETE'
    })
    return response.data || response
  },

  /**
   * Upload a floor plan image
   * @param {File} file - Image file
   * @param {string} buildingId - Building ID
   * @param {number} floorNumber - Floor number
   * @param {string} floorName - Floor name
   * @returns {Promise<Object>} Upload result
   */
  uploadFloorPlan: async (file, buildingId, floorNumber, floorName) => {
    try {
      const formData = new FormData()
      formData.append('floorPlanImage', file)
      formData.append('buildingId', buildingId)
      formData.append('floorNumber', floorNumber)
      formData.append('floorName', floorName)

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

      return await response.json()
    } catch (error) {
      console.error('Error uploading floor plan:', error)
      throw error
    }
  },

  getNodesForFloor: async (floorId) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/nodes`)
    return response.data || response
  },

  createNode: async (floorId, nodeData) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/nodes`, {
      method: 'POST',
      body: JSON.stringify(nodeData)
    })
    return response.data || response
  },

  updateNode: async (floorId, nodeId, nodeData) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(nodeData)
    })
    return response.data || response
  },

  deleteNode: async (floorId, nodeId) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/nodes/${nodeId}`, {
      method: 'DELETE'
    })
    return response.data || response
  },

  getEdgesForFloor: async (floorId) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/edges`)
    return response.data || response
  },

  createEdge: async (floorId, edgeData) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/edges`, {
      method: 'POST',
      body: JSON.stringify(edgeData)
    })
    return response.data || response
  },

  deleteEdge: async (floorId, edgeId) => {
    const response = await makeRequest(`/api/floor-plans/${floorId}/edges/${edgeId}`, {
      method: 'DELETE'
    })
    return response.data || response
  },

  /**
   * Get floor plan image URL
   * @param {string} imagePath - Image path from backend
   * @returns {string} Full image URL
   */
  getImageUrl: (imagePath) => {
    if (!imagePath) return '/floor-plans/placeholder.png'
    if (imagePath.startsWith('http')) return imagePath
    return `${API_ROOT}${imagePath}`
  }
}
