import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// API base URL - update this to match your backend URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AuthContext = createContext(null);

// Helper function to set auth token in axios headers
const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // Set token in axios headers when token changes
    useEffect(() => {
        setAuthToken(token);
    }, [token]);

    // Restore auth state from localStorage on initial load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setToken(storedToken);
                setIsAuthenticated(true);
                setAuthToken(storedToken);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                // If there's an error parsing the stored data, clear it
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setAuthToken(null);
            }
        }
        setIsLoading(false);
    }, []);

    // Enhanced login function that handles token
    const login = (userData) => {
        if (userData && userData.token) {
            localStorage.setItem('token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(userData.token);
            setUser(userData);
            setIsAuthenticated(true);
            setAuthToken(userData.token);
        }
    };

    // Enhanced logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setAuthToken(null);
    };

    // Function to check if token is still valid
    const checkTokenValidity = async () => {
        if (!token) return false;
        
        try {
            // Make a request to a protected route
            await axios.get(`${API_URL}/auth/profile`);
            return true;
        } catch (error) {
            // If token is invalid or expired, log out
            console.error('Token validation error:', error);
            logout();
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token,
            isAuthenticated, 
            isLoading,
            login, 
            logout,
            checkTokenValidity
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 