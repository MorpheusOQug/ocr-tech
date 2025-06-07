import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// API base URL - update this to match your backend URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [schema, setSchema] = useState(null);
    const { token } = useAuth();
    
    // Caching system for API responses
    const cache = useRef({
        users: new Map(),
        documents: new Map(),
        schema: null,
        timestamp: {
            users: new Map(),
            documents: new Map(),
            schema: 0
        }
    });
    
    // Cancel token source for aborting requests
    const abortControllerRef = useRef(null);

    // Set token in axios headers for admin requests
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        return () => {
            // Clean up any pending requests when component unmounts
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [token]);
    
    // Check if cache is valid for a given key and type
    const isCacheValid = useCallback((type, key) => {
        const timestamp = cache.current.timestamp[type].get(key);
        if (!timestamp) return false;
        
        const now = Date.now();
        return now - timestamp < CACHE_TTL;
    }, []);
    
    // Set cache for a given type and key
    const setCache = useCallback((type, key, data) => {
        cache.current[type].set(key, data);
        cache.current.timestamp[type].set(key, Date.now());
    }, []);
    
    // Get from cache for a given type and key
    const getCache = useCallback((type, key) => {
        if (isCacheValid(type, key)) {
            return cache.current[type].get(key);
        }
        return null;
    }, [isCacheValid]);

    // Fetch users - wrapped in useCallback to prevent unnecessary re-renders
    const fetchUsers = useCallback(async (page = 1, limit = 20) => {
        // Avoid multiple simultaneous requests
        if (loading) return null;
        
        // Create cache key
        const cacheKey = `${page}-${limit}`;
        
        // Check cache first
        const cachedData = getCache('users', cacheKey);
        if (cachedData) {
            setUsers(cachedData.users);
            return cachedData;
        }
        
        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/admin/users`, {
                params: { page, limit },
                timeout: 30000, // Increase timeout to 30 seconds
                signal: abortControllerRef.current.signal
            });
            
            let result;
            
            // Check if response has the expected structure
            if (response.data && Array.isArray(response.data)) {
                setUsers(response.data);
                result = { users: response.data };
            } else if (response.data && Array.isArray(response.data.users)) {
                setUsers(response.data.users);
                result = response.data; // Return full response with pagination info
            } else {
                throw new Error('Unexpected response format');
            }
            
            // Cache result
            setCache('users', cacheKey, result);
            
            return result;
        } catch (error) {
            // Don't handle aborted requests as errors
            if (error.name === 'AbortError' || axios.isCancel(error)) {
                return null;
            }
            
            console.error('Error fetching users:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to fetch users';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [loading, getCache, setCache]); 

    // Fetch documents - wrapped in useCallback to prevent unnecessary re-renders
    const fetchDocuments = useCallback(async (page = 1, limit = 20) => {
        // Avoid multiple simultaneous requests
        if (loading) return null;
        
        // Create cache key
        const cacheKey = `${page}-${limit}`;
        
        // Check cache first
        const cachedData = getCache('documents', cacheKey);
        if (cachedData) {
            setDocuments(cachedData.documents || cachedData);
            return cachedData;
        }
        
        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/admin/documents`, {
                params: { page, limit },
                timeout: 30000, // Increase timeout to 30 seconds
                signal: abortControllerRef.current.signal
            });
            
            let result;
            
            // Check if response has documents field (for paginated response)
            if (response.data && response.data.documents) {
                setDocuments(response.data.documents);
                result = response.data; // Return full response with pagination info
            } else if (Array.isArray(response.data)) {
                // Handle case where response is an array (non-paginated)
                setDocuments(response.data);
                result = { documents: response.data };
            } else {
                throw new Error('Unexpected response format');
            }
            
            // Cache result
            setCache('documents', cacheKey, result);
            
            return result;
        } catch (error) {
            // Don't handle aborted requests as errors
            if (error.name === 'AbortError' || axios.isCancel(error)) {
                return null;
            }
            
            console.error('Error fetching documents:', error);
            const errorMessage = error.response?.data?.message || 
                                error.message || 
                                'Failed to fetch documents';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [loading, getCache, setCache]);

    // Fetch database schema - wrapped in useCallback
    const fetchSchema = useCallback(async () => {
        // Avoid multiple simultaneous requests
        if (loading) return null;
        
        // Check cache first
        if (isCacheValid('schema', 'schema')) {
            const cachedSchema = cache.current.schema;
            setSchema(cachedSchema);
            return cachedSchema;
        }
        
        // Cancel previous request if exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/admin/schema`, {
                timeout: 30000, // Increase timeout to 30 seconds
                signal: abortControllerRef.current.signal
            });
            
            // Cache the schema
            cache.current.schema = response.data;
            cache.current.timestamp.schema = Date.now();
            
            setSchema(response.data);
            return response.data;
        } catch (error) {
            // Don't handle aborted requests as errors
            if (error.name === 'AbortError' || axios.isCancel(error)) {
                return null;
            }
            
            console.error('Error fetching schema:', error);
            setError(error.response?.data?.message || 'Failed to fetch schema');
            return null;
        } finally {
            setLoading(false);
        }
    }, [loading, isCacheValid]);

    // Update user
    const updateUser = useCallback(async (userId, userData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.put(`${API_URL}/admin/users/${userId}`, userData);
            
            // Update users list with the updated user
            setUsers(prevUsers => prevUsers.map(user => user._id === userId ? response.data : user));
            
            // Invalidate cache for users
            cache.current.users = new Map();
            cache.current.timestamp.users = new Map();
            
            return response.data;
        } catch (error) {
            console.error(`Error updating user ${userId}:`, error);
            setError(error.response?.data?.message || 'Failed to update user');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Delete user
    const deleteUser = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        try {
            await axios.delete(`${API_URL}/admin/users/${userId}`);
            
            // Remove user from users list
            setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
            
            // Invalidate cache for users
            cache.current.users = new Map();
            cache.current.timestamp.users = new Map();
            
            return true;
        } catch (error) {
            console.error(`Error deleting user ${userId}:`, error);
            setError(error.response?.data?.message || 'Failed to delete user');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Clear cache (useful when you want to force a refresh)
    const clearCache = useCallback(() => {
        cache.current = {
            users: new Map(),
            documents: new Map(),
            schema: null,
            timestamp: {
                users: new Map(),
                documents: new Map(),
                schema: 0
            }
        };
    }, []);

    return (
        <AdminContext.Provider
            value={{
                users,
                documents,
                loading,
                error,
                schema,
                fetchUsers,
                fetchDocuments,
                updateUser,
                deleteUser,
                fetchSchema,
                clearCache
            }}
        >
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}; 