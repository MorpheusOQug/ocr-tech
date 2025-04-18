import React, { useState, useEffect } from "react";
import axios from "axios";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

function DocumentsHistory({ uploadedFiles, setUploadedFiles, setActivePage, handleViewDocument }) {
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const savedItemsPerPage = localStorage.getItem('itemsPerPage');
        return savedItemsPerPage ? parseInt(savedItemsPerPage) : 10;
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // Lưu giá trị itemsPerPage vào localStorage khi thay đổi
    useEffect(() => {
        localStorage.setItem('itemsPerPage', itemsPerPage.toString());
    }, [itemsPerPage]);

    // Lọc và phân trang tài liệu
    useEffect(() => {
        // Lọc tài liệu theo từ khóa tìm kiếm
        const filtered = searchTerm
            ? uploadedFiles.filter(file => 
                file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.mode.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : [...uploadedFiles];
        
        setFilteredFiles(filtered);
        // Reset về trang 1 khi thay đổi bộ lọc hoặc số lượng hiển thị
        setCurrentPage(1);
    }, [uploadedFiles, searchTerm, itemsPerPage]);

    // Tính toán các giá trị phân trang
    const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredFiles.slice(indexOfFirstItem, indexOfLastItem);

    // Xử lý thay đổi trang
    const handlePageChange = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Xử lý thay đổi số lượng hiển thị
    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(parseInt(e.target.value));
    };

    // Xử lý tìm kiếm
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };
    
    // Handle opening the delete confirmation modal
    const handleDeleteClick = (file) => {
        setFileToDelete(file);
        setShowDeleteModal(true);
        setDeleteError(null);
    };
    
    // Handle closing the delete confirmation modal
    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setFileToDelete(null);
        setDeleteError(null);
    };
    
    // Handle confirming the delete operation
    const handleConfirmDelete = async () => {
        if (!fileToDelete) return;
        
        setIsDeleting(true);
        try {
            // Get the token from localStorage
            const token = localStorage.getItem('token');
            
            // Call the API to delete the document
            await axios.delete(`http://localhost:5001/api/documents/${fileToDelete.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Remove the file from local state
            const updatedFiles = uploadedFiles.filter(file => file.id !== fileToDelete.id);
            
            // Update local storage
            const userId = JSON.parse(localStorage.getItem('user'))?.id || 'guest';
            const storageKey = `uploadedFiles_${userId}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedFiles));
            
            // Update parent state
            if (typeof setUploadedFiles === 'function') {
                setUploadedFiles(updatedFiles);
            }
            
            // Close the modal
            setShowDeleteModal(false);
            setFileToDelete(null);
            
            // Potentially update OCR results storage to remove the deleted item
            const resultsKey = `ocrResults_${userId}`;
            const ocrResults = JSON.parse(localStorage.getItem(resultsKey) || '{}');
            if (ocrResults[fileToDelete.id]) {
                delete ocrResults[fileToDelete.id];
                localStorage.setItem(resultsKey, JSON.stringify(ocrResults));
            }
        } catch (error) {
            console.error("Error deleting document:", error);
            setDeleteError(error.response?.data?.error || "Failed to delete the document. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Document History</h2>
                    <div className="flex space-x-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-9 pr-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </button>
                        <button className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {currentItems.map((file) => (
                                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                                                {file.type === 'image' ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {file.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {file.id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {file.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {file.type || "document"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {file.mode || "text"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3">
                                            <button 
                                                onClick={() => handleViewDocument(file.id)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View
                                            </button>
                                            {file.driveUrl ? (
                                                <a 
                                                    href={file.driveUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 flex items-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    Drive
                                                </a>
                                            ) : (
                                                <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4 4V4" />
                                                    </svg>
                                                    Download
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteClick(file)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredFiles.length === 0 && (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No files yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {searchTerm ? "No files match your search criteria" : "Upload your first document to start extracting text using OCR technology"}
                        </p>
                        <button 
                            onClick={() => setActivePage('home')}
                            className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Upload Document
                        </button>
                    </div>
                )}
                
                {filteredFiles.length > 0 && (
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredFiles.length)} of {filteredFiles.length} documents
                            </p>
                            <div className="flex items-center">
                                <label htmlFor="itemsPerPage" className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                                    Show:
                                </label>
                                <select
                                    id="itemsPerPage"
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex space-x-1">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded text-sm ${
                                    currentPage === 1 
                                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                Previous
                            </button>
                            
                            {/* Hiển thị các nút trang */}
                            {[...Array(totalPages)].map((_, index) => {
                                const pageNumber = index + 1;
                                // Hiển thị tối đa 5 nút trang để tránh quá nhiều nút
                                if (
                                    pageNumber === 1 || 
                                    pageNumber === totalPages || 
                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                ) {
                                    return (
                                        <button 
                                            key={pageNumber}
                                            onClick={() => handlePageChange(pageNumber)}
                                            className={`px-3 py-1 rounded text-sm ${
                                                currentPage === pageNumber
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                } else if (
                                    (pageNumber === currentPage - 2 && currentPage > 3) ||
                                    (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                                ) {
                                    // Hiển thị dấu "..." nếu có nhiều trang
                                    return (
                                        <span 
                                            key={pageNumber}
                                            className="px-3 py-1 text-gray-500 dark:text-gray-400"
                                        >
                                            ...
                                        </span>
                                    );
                                }
                                return null;
                            })}
                            
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className={`px-3 py-1 rounded text-sm ${
                                    currentPage === totalPages || totalPages === 0
                                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleConfirmDelete}
                    documentName={fileToDelete?.name || "this document"}
                    isDeleting={isDeleting}
                    error={deleteError}
                />
            )}
        </div>
    );
}

export default DocumentsHistory; 