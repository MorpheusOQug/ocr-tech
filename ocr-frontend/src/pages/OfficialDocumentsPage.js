import React, { useState, useEffect } from 'react';
import { getUserDocuments, deleteDocument } from '../services/officialDocumentService';
import OfficialDocumentForm from '../components/OfficialDocumentForm';

function OfficialDocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [documentError, setDocumentError] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [currentDocument, setCurrentDocument] = useState(null);
    const [currentDocumentData, setCurrentDocumentData] = useState({});

    // Fetch documents on component mount
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoadingDocuments(true);
        setDocumentError(null);
        
        try {
            // Check if token exists
            const token = localStorage.getItem('token');
            if (!token) {
                setDocumentError('Authentication required. Please log in.');
                setLoadingDocuments(false);
                return;
            }
            
            const response = await getUserDocuments();
            if (response.success && response.data) {
                setDocuments(response.data);
            } else {
                setDocumentError('Failed to fetch official documents');
            }
        } catch (error) {
            console.error('Error fetching official documents:', error);
            setDocumentError(error.response?.data?.message || 'Failed to fetch official documents');
        } finally {
            setLoadingDocuments(false);
        }
    };

    // Handle Edit button click
    const handleEditDocument = async (document) => {
        setCurrentDocument(document);
        setCurrentDocumentData({
            _id: document._id,
            officialNumber: document.officialNumber,
            cardNumber: document.cardNumber,
            fullName: document.fullName,
            content: document.content,
            address: document.address,
            recipientName: document.recipientName,
            documentImage: document.documentImage?.driveUrl || null
        });
        setEditMode(true);
    };
    
    // Handle Delete button click
    const handleDeleteDocument = async (documentId) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await deleteDocument(documentId);
                // Refresh the list after deletion
                fetchDocuments();
                setSelectedDocument(null);
            } catch (error) {
                console.error('Error deleting document:', error);
                setDocumentError('Failed to delete document');
            }
        }
    };

    // Handle document preview
    const handlePreviewDocument = (document) => {
        setSelectedDocument(document);
    };

    if (editMode && currentDocument) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <div className="mb-4 flex items-center">
                    <button 
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to List
                    </button>
                    <h2 className="ml-4 text-xl font-semibold text-gray-800 dark:text-white">
                        Editing Document: {currentDocument.fullName}
                    </h2>
                </div>
                
                <OfficialDocumentForm 
                    documentData={currentDocumentData}
                    setDocumentData={setCurrentDocumentData}
                    isFormSubmitted={true}
                    setIsFormSubmitted={(value) => {
                        if (!value) {
                            setEditMode(false);
                            fetchDocuments();
                        }
                    }}
                    handleDocumentChange={(e) => {
                        const { name, value } = e.target;
                        setCurrentDocumentData(prev => ({
                            ...prev,
                            [name]: value
                        }));
                    }}
                    handleImageUpload={(e, field) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                setCurrentDocumentData(prev => ({
                                    ...prev,
                                    [field]: reader.result,
                                    [`${field}File`]: file
                                }));
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                />
            </div>
        );
    }

    if (selectedDocument) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <div className="mb-4 flex items-center">
                    <button 
                        onClick={() => setSelectedDocument(null)}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to List
                    </button>
                    <h2 className="ml-4 text-xl font-semibold text-gray-800 dark:text-white">
                        Document Details
                    </h2>
                </div>
                
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                    <div className="bg-gray-800 p-4 text-white">
                        <div className="text-center">
                            <div className="text-sm mb-1">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                            <div className="text-xs mb-2">Độc lập - Tự do - Hạnh phúc</div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p><span className="font-medium">Document Number:</span> {selectedDocument.officialNumber}</p>
                                <p><span className="font-medium">ID Card Number:</span> {selectedDocument.cardNumber}</p>
                                <p><span className="font-medium">Name:</span> {selectedDocument.fullName}</p>
                            </div>
                            <div className="space-y-2">
                                <p><span className="font-medium">Recipient:</span> {selectedDocument.recipientName}</p>
                                <p><span className="font-medium">Address:</span> {selectedDocument.address}</p>
                                <p><span className="font-medium">Created:</span> {new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-2">Document Content:</h3>
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md whitespace-pre-wrap">
                                {selectedDocument.content}
                            </div>
                        </div>
                        
                        {selectedDocument.documentImage?.driveUrl && (
                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Document Image:</h3>
                                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                    <img 
                                        src={selectedDocument.documentImage.driveUrl} 
                                        alt="Document" 
                                        className="max-h-60 mx-auto object-contain"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 flex justify-end space-x-3">
                        <button 
                            onClick={() => handleEditDocument(selectedDocument)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => handleDeleteDocument(selectedDocument._id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Official Documents</h2>
                <div className="flex gap-3">
                    <button 
                        onClick={() => {
                            setEditMode(true);
                            setCurrentDocument(null);
                            setCurrentDocumentData({
                                officialNumber: '',
                                cardNumber: '',
                                fullName: '',
                                content: '',
                                address: '',
                                recipientName: '',
                                documentImage: null
                            });
                        }} 
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Document
                    </button>
                    <button 
                        onClick={fetchDocuments} 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {loadingDocuments ? (
                <div className="flex justify-center py-20">
                    <div className="flex flex-col items-center">
                        <div className="text-blue-600 dark:text-blue-400 mb-4">
                            <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">Loading documents...</p>
                    </div>
                </div>
            ) : documentError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 dark:text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300 text-lg mb-4">{documentError}</p>
                    <button 
                        onClick={fetchDocuments} 
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : documents.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-10 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Documents Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        You haven't saved any official documents yet. Use the OCR Scanner to extract and save document information.
                    </p>
                    <button 
                        onClick={() => {
                            setEditMode(true);
                            setCurrentDocument(null);
                            setCurrentDocumentData({
                                officialNumber: '',
                                cardNumber: '',
                                fullName: '',
                                content: '',
                                address: '',
                                recipientName: '',
                                documentImage: null
                            });
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Create New Document
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {documents.map((document) => (
                        <div 
                            key={document._id} 
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handlePreviewDocument(document)}
                        >
                            <div className="bg-gray-800 text-white p-3">
                                <div className="text-center">
                                    <div className="text-sm mb-1 font-medium">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                                    <div className="text-xs font-light">Độc lập - Tự do - Hạnh phúc</div>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-lg mb-2 truncate">{document.officialNumber}</h3>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                    <p><span className="font-medium">Name:</span> {document.fullName}</p>
                                    <p className="line-clamp-2"><span className="font-medium">Content:</span> {document.content}</p>
                                </div>
                                <div className="mt-4 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditDocument(document);
                                            }}
                                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteDocument(document._id);
                                            }}
                                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OfficialDocumentsPage; 