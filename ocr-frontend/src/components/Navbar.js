import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import UserDropdown from './UserDropdown';
import logo from '../logo.svg';

const Navbar = () => {
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);
    const { isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    
    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    
    return (
        <nav className={`fixed top-0 left-0 w-full z-50 shadow-md transition-colors duration-300 ${darkMode ? 'bg-darkBg text-white' : 'bg-white text-gray-800'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Column 1: Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center">
                            <img src={logo} alt="OCR Logo" className="h-8 w-auto mr-2" />
                            <span className={`font-bold text-xl ${darkMode ? 'text-accent' : 'text-primary'}`}>OCR Tech</span>
                        </Link>
                    </div>
                    
                    {/* Column 2: Navigation Links - Desktop */}
                    <div className="hidden md:flex items-center justify-center space-x-8 flex-grow">
                        <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium relative hover:bg-primary-light/10 transition-all duration-300
                            ${darkMode ? 'text-white hover:text-accent' : 'text-gray-700 hover:text-primary'}`}>
                            Home
                            <div className="absolute h-0.5 bg-primary w-0 left-1/2 -bottom-0.5 transform -translate-x-1/2 group-hover:w-4/5 transition-all duration-300"></div>
                        </Link>
                        <Link to="/blog" className={`px-3 py-2 rounded-md text-sm font-medium relative hover:bg-primary-light/10 transition-all duration-300
                            ${darkMode ? 'text-white hover:text-accent' : 'text-gray-700 hover:text-primary'}`}>
                            Blog
                            <div className="absolute h-0.5 bg-primary w-0 left-1/2 -bottom-0.5 transform -translate-x-1/2 group-hover:w-4/5 transition-all duration-300"></div>
                        </Link>
                        <Link to="/solutions" className={`px-3 py-2 rounded-md text-sm font-medium relative hover:bg-primary-light/10 transition-all duration-300
                            ${darkMode ? 'text-white hover:text-accent' : 'text-gray-700 hover:text-primary'}`}>
                            Solutions
                            <div className="absolute h-0.5 bg-primary w-0 left-1/2 -bottom-0.5 transform -translate-x-1/2 group-hover:w-4/5 transition-all duration-300"></div>
                        </Link>
                    </div>
                    
                    {/* Column 3 & 4: Dark Mode Toggle & User Avatar - Desktop */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Dark Mode Toggle */}
                        <button 
                            onClick={toggleDarkMode} 
                            className={`p-2 rounded-full transition-colors duration-300 hover:rotate-12 ${
                                darkMode 
                                    ? 'bg-accent/20 text-accent' 
                                    : 'bg-primary-light/10 text-primary'
                            }`}
                            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {darkMode ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                        
                        {/* User Avatar or Login Button */}
                        {isAuthenticated ? (
                            <UserDropdown darkMode={darkMode} />
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                    darkMode
                                        ? 'bg-accent text-white hover:bg-accent/80'
                                        : 'bg-primary text-white hover:bg-primary-dark'
                                }`}
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                    
                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center space-x-4">
                        {/* Dark Mode Toggle - Mobile */}
                        <button 
                            onClick={toggleDarkMode} 
                            className={`p-2 rounded-full transition-colors duration-300 hover:rotate-12 ${
                                darkMode 
                                    ? 'bg-accent/20 text-accent' 
                                    : 'bg-primary-light/10 text-primary'
                            }`}
                            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {darkMode ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                        
                        {/* User Avatar or Login Button - Mobile */}
                        {isAuthenticated ? (
                            <UserDropdown darkMode={darkMode} />
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-300 ${
                                    darkMode
                                        ? 'bg-accent text-white hover:bg-accent/80'
                                        : 'bg-primary text-white hover:bg-primary-dark'
                                }`}
                            >
                                Sign In
                            </button>
                        )}
                        
                        {/* Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className={`inline-flex items-center justify-center p-2 rounded-md ${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary`}
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMobileMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile menu, show/hide based on menu state */}
            <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} ${darkMode ? 'bg-darkBg' : 'bg-white'} shadow-md`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <Link 
                        to="/" 
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                            darkMode 
                                ? 'text-white hover:bg-gray-800' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Home
                    </Link>
                    <Link 
                        to="/blog" 
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                            darkMode 
                                ? 'text-white hover:bg-gray-800' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Blog
                    </Link>
                    <Link 
                        to="/solutions" 
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                            darkMode 
                                ? 'text-white hover:bg-gray-800' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Solutions
                    </Link>
                    {!isAuthenticated && (
                        <Link 
                            to="/login" 
                            className={`block px-3 py-2 rounded-md text-base font-medium ${
                                darkMode 
                                    ? 'text-white hover:bg-gray-800' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 