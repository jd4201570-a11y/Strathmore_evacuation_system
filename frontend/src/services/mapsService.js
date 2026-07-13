import api from './api';

export const mapsService = {
  // Get all available floor maps
  getAllMaps: async () => {
    try {
      const response = await api.get('/maps');
      return response.data;
    } catch (error) {
      console.error('Error fetching maps:', error);
      throw error;
    }
  },

  // Get a specific floor map
  getFloorMap: async (floorId) => {
    try {
      const response = await api.get(`/maps/${floorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching map for floor ${floorId}:`, error);
      throw error;
    }
  },

  // Get map image URL
  getMapImageUrl: (imagePath) => {
    return `${import.meta.env.VITE_API_BASE_URL || ''}${imagePath}`;
  }
};
