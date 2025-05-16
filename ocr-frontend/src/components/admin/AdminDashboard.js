import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import UserManagement from './UserManagement';
import DocumentManagement from './DocumentManagement';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear admin flag
        localStorage.removeItem('isAdmin');
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-darkBg">
            {/* Sidebar */}
            <AdminSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onLogout={handleLogout} 
            />
            
            {/* Main content */}
            <div className="flex-1 p-6 md:p-8 pt-20 md:ml-64">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Manage users and documents
                    </p>
                </div>
                
                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'documents' && <DocumentManagement />}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard; 