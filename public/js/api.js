// API client for MotoMinder
const api = (() => {
    const API_URL = '/api'; // Base API URL
    
    // Default request headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Utility function for making API requests
    const request = async (endpoint, options = {}) => {
      try {
        const url = `${API_URL}${endpoint}`;
        const response = await fetch(url, {
          headers,
          ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'An error occurred');
        }
        
        return data;
      } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
      }
    };
    
    // API methods
    return {
      // Garage endpoints
      getGarages: () => request('/garages'),
      getGarage: (id) => request(`/garages/${id}`),
      createGarage: (data) => request('/garages', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      updateGarage: (id, data) => request(`/garages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      deleteGarage: (id) => request(`/garages/${id}`, {
        method: 'DELETE'
      }),
      
      // Bike endpoints
      getBikes: (garageId = null) => {
        const url = garageId ? `/bikes?garage_id=${garageId}` : '/bikes';
        return request(url);
      },
      getBike: (id) => request(`/bikes/${id}`),
      createBike: (data) => request('/bikes', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      updateBike: (id, data) => request(`/bikes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      deleteBike: (id) => request(`/bikes/${id}`, {
        method: 'DELETE'
      }),
      
      // Section endpoints
      getSections: (bikeId) => request(`/sections?bike_id=${bikeId}`),
      getSection: (id) => request(`/sections/${id}`),
      createSection: (data) => request('/sections', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      updateSection: (id, data) => request(`/sections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      deleteSection: (id) => request(`/sections/${id}`, {
        method: 'DELETE'
      }),
      
      // Part endpoints
      getParts: (sectionId) => request(`/parts?section_id=${sectionId}`),
      getPart: (id) => request(`/parts/${id}`),
      createPart: (data) => request('/parts', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      updatePart: (id, data) => request(`/parts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      deletePart: (id) => request(`/parts/${id}`, {
        method: 'DELETE'
      }),
      
      // Tag endpoints
      getTags: () => request('/tags'),
      getTag: (id) => request(`/tags/${id}`),
      createTag: (data) => request('/tags', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      updateTag: (id, data) => request(`/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      deleteTag: (id) => request(`/tags/${id}`, {
        method: 'DELETE'
      }),
      assignTag: (data) => request('/tags/assign', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      removeTag: (data) => request('/tags/remove', {
        method: 'DELETE',
        body: JSON.stringify(data)
      }),
      getTaggedItems: (tagId) => request(`/tags/${tagId}/items`),
      
      // Maintenance endpoints
      getMaintenance: (bikeId = null) => {
        const url = bikeId ? `/maintenance?bike_id=${bikeId}` : '/maintenance';
        return request(url);
      },
      getMaintenanceById: (id) => request(`/maintenance/${id}`),
      createMaintenance: (data) => request('/maintenance', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      updateMaintenance: (id, data) => request(`/maintenance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
      deleteMaintenance: (id) => request(`/maintenance/${id}`, {
        method: 'DELETE'
      }),
      
      // Search endpoint
      search: (query, tags = [], type = null) => {
        let url = `/search?query=${encodeURIComponent(query || '')}`;
        
        if (tags.length) {
          url += `&tags=${encodeURIComponent(tags.join(','))}`;
        }
        
        if (type) {
          url += `&type=${encodeURIComponent(type)}`;
        }
        
        return request(url);
      }
    };
  })();