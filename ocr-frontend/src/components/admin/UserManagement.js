import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import debounce from 'lodash.debounce';

function UserManagement() {
    const { users, loading, error, fetchUsers, updateUser, deleteUser } = useAdmin();
    const [editingUser, setEditingUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [localLoading, setLocalLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        isVerified: false,
        isAdmin: false
    });

    // Create debounced fetch function that won't trigger warnings
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetchFunction = useCallback(
        debounce((page, limit) => {
            setLocalLoading(true);
            fetchUsers(page, limit)
                .then(response => {
                    // If the API returns pagination info, update totalPages
                    if (response && response.pagination) {
                        setTotalPages(response.pagination.pages || 1);
                    }
                    setLocalLoading(false);
                })
                .catch(() => setLocalLoading(false));
        }, 300),
        [/* Empty dependency array with ESLint disable comment above */]
    );

    // Re-create the debounced function when its dependencies change
    const debouncedFetch = useCallback(
        (page, limit) => {
            debouncedFetchFunction(page, limit);
        },
        [debouncedFetchFunction, fetchUsers]
    );

    // Effect to fetch users when pagination changes
    useEffect(() => {
        debouncedFetch(currentPage, itemsPerPage);
        
        // Cleanup function to cancel debounced fetch on unmount
        return () => {
            if (debouncedFetchFunction.cancel) {
                debouncedFetchFunction.cancel();
            }
        };
    }, [currentPage, itemsPerPage, debouncedFetch, debouncedFetchFunction]);

    // Filter users based on search term (client-side filtering)
    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim() || !users) return users;
        
        return users.filter(user => 
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handleEdit = useCallback((user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            isVerified: user.isVerified || false,
            isAdmin: user.isAdmin || false
        });
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        try {
            await updateUser(editingUser._id, formData);
            debouncedFetch(currentPage, itemsPerPage); // Refetch after update
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }, [updateUser, editingUser, formData, currentPage, itemsPerPage, debouncedFetch]);

    const handleDelete = useCallback(async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(userId);
                debouncedFetch(currentPage, itemsPerPage); // Refetch after delete
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    }, [deleteUser, currentPage, itemsPerPage, debouncedFetch]);

    // Handle page change with pagination limits
    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    }, [totalPages]);

    // Handle items per page change
    const handleItemsPerPageChange = useCallback((e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when changing items per page
    }, []);

    // Handle search input change with debouncing
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    // Close modal handler
    const handleCloseModal = useCallback(() => {
        setEditingUser(null);
    }, []);

    const isLoading = loading || localLoading;

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">User Management</h2>
            
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md mb-4">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}
            
            {/* Search bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Username
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Role
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredUsers && filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <tr key={user._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user.username}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            user.isVerified 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                                        }`}>
                                            {user.isVerified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            user.isAdmin 
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-400' 
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400'
                                        }`}>
                                            {user.isAdmin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button 
                                            onClick={() => handleEdit(user)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user._id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" colSpan="5">
                                        {searchTerm ? 'No matching users found' : 'No users found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    
                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 border rounded ${
                                currentPage === 1 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-white text-blue-600 hover:bg-blue-50'
                            } dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300`}
                        >
                            Previous
                        </button>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">
                                Page {currentPage} of {totalPages}
                            </span>
                            <select 
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="border border-gray-300 dark:border-gray-600 rounded p-1 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                                <option value={10}>10 per page</option>
                                <option value={20}>20 per page</option>
                                <option value={50}>50 per page</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className={`px-3 py-1 border rounded ${
                                currentPage >= totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-blue-600 hover:bg-blue-50'
                            } dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
            
            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Edit User
                            </h3>
                            <button 
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email (Read-only)
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                                />
                            </div>
                            
                            <div className="mb-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isVerified"
                                        name="isVerified"
                                        checked={formData.isVerified}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isVerified" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Verified
                                    </label>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isAdmin"
                                        name="isAdmin"
                                        checked={formData.isAdmin}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                        Admin
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default React.memo(UserManagement); 