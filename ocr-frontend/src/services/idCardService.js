import axios from 'axios';

// Get auth token from localStorage with validation
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  
  // Make sure token exists and is not "null" or "undefined" string
  if (!token || token === 'null' || token === 'undefined') {
    console.warn('No valid auth token found in localStorage');
    return null;
  }
  
  return token;
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!getAuthToken();
};

// Get all ID cards (admin function)
export const getIdCards = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.get('/api/idcards', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching ID cards:', error);
    throw error;
  }
};

// Get ID cards for the current user
export const getUserIdCards = async () => {
  try {
    console.log('Fetching user ID cards...');
    const token = getAuthToken();
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication required');
    }
    
    // Đường dẫn API endpoint cần phù hợp với route định nghĩa trong backend
    const response = await axios.get('/api/user/idcards', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('User ID cards fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user ID cards:', error.response || error);
    throw error;
  }
};

// Get specific ID card data
export const getIdCard = async (id) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const url = id ? `/api/idcard/${id}` : '/api/idcard';
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching ID card:', error);
    throw error;
  }
};

// Save ID card data
export const saveIdCard = async (formData) => {
  try {
    console.log('saveIdCard: Checking authentication...');
    const token = getAuthToken();
    if (!token) {
      console.error('saveIdCard: Authentication token not found');
      throw new Error('Authentication required');
    }
    
    // For debugging, check if formData contains the correct content
    console.log('saveIdCard: FormData keys:', [...formData.keys()]);
    
    // Output formData ID if exists
    if (formData.get('_id')) {
      console.log('saveIdCard: Updating card with ID:', formData.get('_id'));
    } else {
      console.log('saveIdCard: Creating new card');
    }
    
    console.log('saveIdCard: Sending request to backend...');
    const response = await axios.post('/api/idcard', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('saveIdCard: Response received:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('saveIdCard: Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('saveIdCard: No response received. Request:', error.request);
    } else {
      console.error('saveIdCard: Error setting up request:', error.message);
    }
    throw error;
  }
};

// Delete ID card
export const deleteIdCard = async (idCardId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const url = idCardId ? `/api/idcard/${idCardId}` : '/api/idcard';
    const response = await axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting ID card:', error);
    throw error;
  }
};

export { isAuthenticated }; 