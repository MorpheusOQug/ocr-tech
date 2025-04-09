import React, { createContext, useContext } from 'react';

const ValidationContext = createContext(null);

export const ValidationProvider = ({ children }) => {
    // File validation functions
    const validateFile = (file) => {
        if (!file) return { isValid: false, error: 'No file selected' };

        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'application/pdf'];
        if (!validImageTypes.includes(file.type)) {
            return { 
                isValid: false, 
                error: 'Please upload a valid image (JPG, PNG, GIF, BMP) or PDF file.' 
            };
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return { 
                isValid: false, 
                error: 'File size exceeds 10MB limit. Please upload a smaller file.' 
            };
        }
        
        return { isValid: true, error: null };
    };

    // Form validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return { isValid: false, error: 'Email is required' };
        if (!emailRegex.test(email)) return { isValid: false, error: 'Please enter a valid email address' };
        return { isValid: true, error: null };
    };

    const validatePassword = (password) => {
        if (!password) return { isValid: false, error: 'Password is required' };
        if (password.length < 8) return { isValid: false, error: 'Password must be at least 8 characters' };
        
        // Check for strong password (at least one uppercase, one lowercase, one number)
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        if (!hasUppercase || !hasLowercase || !hasNumber) {
            return { 
                isValid: false, 
                error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
            };
        }
        
        return { isValid: true, error: null };
    };

    const validateRequired = (value, fieldName) => {
        if (!value || value.trim() === '') {
            return { isValid: false, error: `${fieldName} is required` };
        }
        return { isValid: true, error: null };
    };

    // URL validation
    const validateUrl = (url) => {
        if (!url) return { isValid: false, error: 'URL is required' };
        
        try {
            new URL(url);
            return { isValid: true, error: null };
        } catch (e) {
            return { isValid: false, error: 'Please enter a valid URL' };
        }
    };

    // Server API Endpoint validation
    const validateServerEndpoint = (url) => {
        const result = validateUrl(url);
        if (!result.isValid) return result;
        
        // Additional checks for server endpoint
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return { isValid: false, error: 'Server URL must start with http:// or https://' };
        }
        
        return { isValid: true, error: null };
    };

    return (
        <ValidationContext.Provider value={{
            validateFile,
            validateEmail,
            validatePassword,
            validateRequired,
            validateUrl,
            validateServerEndpoint
        }}>
            {children}
        </ValidationContext.Provider>
    );
};

export const useValidation = () => {
    const context = useContext(ValidationContext);
    if (!context) {
        throw new Error('useValidation must be used within a ValidationProvider');
    }
    return context;
};

export default ValidationContext; 