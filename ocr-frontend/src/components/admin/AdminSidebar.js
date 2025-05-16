import React from 'react';
import { Link } from 'react-router-dom';

function AdminSidebar({ activeTab, setActiveTab, onLogout }) {
    const navItems = [
        { id: 'users', label: 'User Management', icon: 'fas fa-users' },
        { id: 'documents', label: 'Document Management', icon: 'fas fa-file-alt' }
    ];

    return (
        <div className="fixed z-30 inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 lg:transform-none lg:opacity-100 lg:translate-x-0 md:relative md:translate-x-0 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                    <i className="fas fa-shield-alt mr-2"></i>
                    Admin Panel
                </h2>
            </div>
            
            <nav className="mt-6 px-3">
                <div className="space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full ${
                                activeTab === item.id 
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-800/20 dark:text-blue-300' 
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            <i className={`${item.icon} mr-3 text-gray-500 dark:text-gray-400 ${
                                activeTab === item.id ? 'text-blue-500 dark:text-blue-400' : ''
                            }`}></i>
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>
            
            <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 p-4">
                <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium flex items-center mb-4">
                    <i className="fas fa-home mr-2"></i>
                    Back to Home
                </Link>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center text-sm px-4 py-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Logout
                </button>
            </div>
        </div>
    );
}

export default AdminSidebar; 