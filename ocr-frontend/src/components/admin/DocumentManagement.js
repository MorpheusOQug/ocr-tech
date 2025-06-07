import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import debounce from 'lodash.debounce';

function DocumentManagement() {
    const { documents, loading, error, fetchDocuments } = useAdmin();
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [localLoading, setLocalLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Create debounced fetch function that won't trigger warnings
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetchFunction = useCallback(
        debounce((page, limit) => {
            setLocalLoading(true);
            fetchDocuments(page, limit)
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
        [debouncedFetchFunction]
    );

    // Effect to fetch documents when pagination changes
    useEffect(() => {
        debouncedFetch(currentPage, itemsPerPage);
        
        // Cleanup function to cancel debounced fetch on unmount
        return () => {
            if (debouncedFetchFunction.cancel) {
                debouncedFetchFunction.cancel();
            }
        };
    }, [currentPage, itemsPerPage, debouncedFetch, debouncedFetchFunction]);

    const handleView = useCallback((document) => {
        setSelectedDocument(document);
    }, []);

    const formatDate = useCallback((dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }, []);

    // Get user display name from document
    const getUserDisplayName = useCallback((document) => {
        if (document.userId && typeof document.userId === 'object' && document.userId.username) {
            return document.userId.username;
        }
        return 'Unknown User';
    }, []);

    // Get user email from document
    const getUserEmail = useCallback((document) => {
        if (document.userId && typeof document.userId === 'object' && document.userId.email) {
            return document.userId.email;
        }
        return '';
    }, []);

    // Filter documents based on search term
    const filteredDocuments = useMemo(() => {
        if (!searchTerm.trim() || !documents) return documents;
        
        return documents.filter(doc => {
            const name = doc.name || doc.title || '';
            const userDisplayName = getUserDisplayName(doc);
            const userEmail = getUserEmail(doc);
            const type = doc.type || doc.documentType || '';
            
            const lowerSearchTerm = searchTerm.toLowerCase();
            return (
                name.toLowerCase().includes(lowerSearchTerm) ||
                userDisplayName.toLowerCase().includes(lowerSearchTerm) ||
                userEmail.toLowerCase().includes(lowerSearchTerm) ||
                type.toLowerCase().includes(lowerSearchTerm)
            );
        });
    }, [documents, searchTerm, getUserDisplayName, getUserEmail]);

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

    // Handle search input change
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);
    
    // Close modal handler
    const handleCloseModal = useCallback(() => {
        setSelectedDocument(null);
    }, []);

    const isLoading = loading || localLoading;

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Document Management</h2>
            
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md mb-4">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}
            
            {/* Search bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search documents by name, user, or type..."
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
                                    Title
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    User
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredDocuments && filteredDocuments.length > 0 ? filteredDocuments.map(document => (
                                <tr key={document._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {document.name || document.title || 'Untitled Document'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            <div>{getUserDisplayName(document)}</div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                                {getUserEmail(document)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {formatDate(document.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400">
                                            {document.type || document.documentType || 'OCR Document'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button 
                                            onClick={() => handleView(document)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" colSpan="5">
                                        {searchTerm ? 'No matching documents found' : 'No documents found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {filteredDocuments && filteredDocuments.length > 0 && (
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
                    )}
                </div>
            )}
            
            {/* Document View Modal */}
            {selectedDocument && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] shadow-xl p-6 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {selectedDocument.name || selectedDocument.title || 'Document Details'}
                            </h3>
                            <button 
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-grow">
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Created By
                                </h4>
                                <p className="text-gray-900 dark:text-white">
                                    {getUserDisplayName(selectedDocument)}
                                    {getUserEmail(selectedDocument) && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                            ({getUserEmail(selectedDocument)})
                                        </span>
                                    )}
                                </p>
                            </div>
                            
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Created At
                                </h4>
                                <p className="text-gray-900 dark:text-white">
                                    {formatDate(selectedDocument.createdAt)}
                                </p>
                            </div>
                            
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Document Content
                                </h4>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 max-h-80 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 font-mono">
                                        {selectedDocument.ocrResult?.text || selectedDocument.content || 'No content available'}
                                    </pre>
                                </div>
                            </div>
                            
                            {selectedDocument.ocrResult && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        OCR Result
                                    </h4>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                                        <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 font-mono">
                                            {typeof selectedDocument.ocrResult === 'object' 
                                                ? JSON.stringify(selectedDocument.ocrResult, null, 2) 
                                                : selectedDocument.ocrResult || 'No OCR result available'}
                                        </pre>
                                    </div>
                                </div>
                            )}
                            
                            {selectedDocument.metadata && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Metadata
                                    </h4>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                                        <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200 font-mono">
                                            {typeof selectedDocument.metadata === 'object' 
                                                ? JSON.stringify(selectedDocument.metadata, null, 2) 
                                                : selectedDocument.metadata || 'No metadata available'}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default React.memo(DocumentManagement); 