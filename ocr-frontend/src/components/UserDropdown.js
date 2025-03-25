import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserDropdown = ({ darkMode }) => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-primary to-primary-light text-white font-bold shadow-md hover:scale-105 transition-transform duration-300 cursor-pointer`}
            >
                <span>{user?.name?.[0] || 'U'}</span>
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                    <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user?.name || 'User'}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user?.email || 'user@example.com'}
                        </p>
                    </div>
                    
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            navigate('/account/settings');
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                            darkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Account Settings
                    </button>
                    
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            navigate('/account/api-keys');
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                            darkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        API Keys
                    </button>
                    
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            navigate('/account/usage');
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                            darkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Usage Statistics
                    </button>
                    
                    <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                    
                    <button
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                            darkMode 
                                ? 'text-red-400 hover:bg-gray-700' 
                                : 'text-red-600 hover:bg-gray-100'
                        }`}
                    >
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserDropdown; 