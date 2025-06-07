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

// Get all official documents (admin function)
export const getDocuments = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.get('/api/documents', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching official documents:', error);
    throw error;
  }
};

// Get official documents for the current user
export const getUserDocuments = async () => {
  try {
    console.log('Fetching user official documents...');
    const token = getAuthToken();
    if (!token) {
      console.error('Authentication token not found');
      throw new Error('Authentication required');
    }
    
    // Fixed endpoint to match backend API structure
    const response = await axios.get('/api/document', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('User official documents fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user official documents:', error.response || error);
    throw error;
  }
};

// Get specific document data
export const getDocument = async (id) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const url = id ? `/api/document/${id}` : '/api/document';
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching official document:', error);
    throw error;
  }
};

// Save official document data
export const saveDocument = async (formData) => {
  try {
    console.log('saveDocument: Checking authentication...');
    const token = getAuthToken();
    if (!token) {
      console.error('saveDocument: Authentication token not found');
      throw new Error('Authentication required');
    }
    
    // For debugging, check if formData contains the correct content
    console.log('saveDocument: FormData keys:', [...formData.keys()]);
    
    // Output formData ID if exists
    if (formData.get('_id')) {
      console.log('saveDocument: Updating document with ID:', formData.get('_id'));
    } else {
      console.log('saveDocument: Creating new document');
    }
    
    console.log('saveDocument: Sending request to backend...');
    const response = await axios.post('/api/document', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('saveDocument: Response received:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('saveDocument: Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('saveDocument: No response received. Request:', error.request);
    } else {
      console.error('saveDocument: Error setting up request:', error.message);
    }
    throw error;
  }
};

// Delete official document
export const deleteDocument = async (documentId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const url = documentId ? `/api/document/${documentId}` : '/api/document';
    const response = await axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting official document:', error);
    throw error;
  }
};

export { isAuthenticated }; 