import React, { useState, useEffect } from 'react';
import { saveDocument, getUserDocuments, getDocument } from '../services/officialDocumentService';

// Sync with document selection
export const selectDocumentById = async (documentId, setDocumentData) => {
    try {
        // Get the document data from API
        const response = await getDocument(documentId);
        if (response && response.data) {
            setDocumentData({
                _id: response.data._id,
                officialNumber: response.data.officialNumber,
                documentDate: response.data.documentDate ? new Date(response.data.documentDate).toISOString().split('T')[0] : '',
                fullName: response.data.fullName,
                content: response.data.content,
                address: response.data.address,
                recipientName: response.data.recipientName
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error fetching document by ID:', error);
        return false;
    }
};

function OfficialDocumentForm({ 
    documentData, 
    setDocumentData, 
    isFormSubmitted, 
    setIsFormSubmitted, 
    handleDocumentChange
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [userDocuments, setUserDocuments] = useState([]);
    const [showDocumentList, setShowDocumentList] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch user's official documents when component mounts
    useEffect(() => {
        const fetchUserDocuments = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            try {
                setIsLoading(true);
                const response = await getUserDocuments();
                console.log('Received documents data:', response);
                if (response && response.data) {
                    setUserDocuments(response.data || []);
                } else {
                    console.error('Invalid response format:', response);
                    setSaveError('Failed to load documents. Invalid response format.');
                }
            } catch (error) {
                console.error('Error fetching user documents:', error);
                setSaveError(`Failed to load documents: ${error.message || 'Unknown error'}`);
                setUserDocuments([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserDocuments();
    }, [saveSuccess]);
    
    // Handle date input changes
    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDocumentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveDocument = async () => {
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                setSaveError('You need to be logged in to save the document.');
                return;
            }
            
            // Validate required fields
            if (!documentData.officialNumber || !documentData.fullName) {
                setSaveError('Official document number and full name are required.');
                return;
            }
            
            console.log('Saving document with data:', { 
                officialNumber: documentData.officialNumber,
                fullName: documentData.fullName,
                hasId: !!documentData._id
            });
            
            // Create a FormData object to handle file uploads
            const formData = new FormData();
            
            // Add text fields to the form data
            formData.append('officialNumber', documentData.officialNumber || '');
            formData.append('documentDate', documentData.documentDate || '');
            formData.append('fullName', documentData.fullName || '');
            formData.append('content', documentData.content || '');
            formData.append('address', documentData.address || '');
            formData.append('recipientName', documentData.recipientName || '');

            // If ID exists, add it to update existing document
            if (documentData._id) {
                formData.append('_id', documentData._id);
                console.log('Updating existing document with ID:', documentData._id);
            } else {
                console.log('Creating new document');
            }
            
            // Send the request using our service
            const response = await saveDocument(formData);
            
            // Handle successful response
            console.log('Document saved successfully:', response);
            setSaveSuccess(true);
            
            // Update the documentData with the response data if needed
            if (response.data) {
                setDocumentData(prevData => ({
                    ...prevData,
                    ...response.data,
                    documentDate: response.data.documentDate ? new Date(response.data.documentDate).toISOString().split('T')[0] : ''
                }));
            }
            
            // Go back to preview mode
            setTimeout(() => {
                setIsFormSubmitted(false);
            }, 1500); // Show success message for 1.5 seconds before hiding
            
        } catch (error) {
            console.error('Error saving document:', error);
            console.error('Error details:', error.response?.data || error.message);
            if (error.response?.status === 401) {
                setSaveError('Authentication error. Please log in again.');
            } else {
                setSaveError(error.response?.data?.message || error.message || 'Failed to save document. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Create new blank document
    const handleCreateNewDocument = () => {
        setDocumentData({
            officialNumber: '',
            documentDate: '',
            fullName: '',
            content: '',
            address: '',
            recipientName: ''
        });
        setIsFormSubmitted(true);
        setShowDocumentList(false);
    };

    // Load selected document data
    const handleSelectDocument = (document) => {
        setDocumentData({
            _id: document._id,
            officialNumber: document.officialNumber,
            documentDate: document.documentDate ? new Date(document.documentDate).toISOString().split('T')[0] : '',
            fullName: document.fullName,
            content: document.content,
            address: document.address,
            recipientName: document.recipientName
        });
        setShowDocumentList(false);
    };

    // Render document list panel
    const renderDocumentList = () => {
        if (!showDocumentList) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">My Official Documents</h3>
                        <button onClick={() => setShowDocumentList(false)} className="text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {saveError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            <p>{saveError}</p>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p>Loading your documents...</p>
                        </div>
                    ) : userDocuments.length === 0 ? (
                        <div className="text-center py-4">No official documents found. Create your first one!</div>
                    ) : (
                        <div className="space-y-3">
                            {userDocuments.map(document => (
                                <div 
                                    key={document._id} 
                                    className="p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                                    onClick={() => handleSelectDocument(document)}
                                >
                                    <div>
                                        <div className="font-medium">{document.fullName}</div>
                                        <div className="text-sm text-gray-500">Document #: {document.officialNumber}</div>
                                        <div className="text-xs text-gray-400">
                                            {document.updatedAt ? `Updated: ${new Date(document.updatedAt).toLocaleDateString()}` : ''}
                                        </div>
                                    </div>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectDocument(document);
                                    }} className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">
                                        Select
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="mt-4 flex justify-between">
                        <button 
                            onClick={handleCreateNewDocument}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            Create New Document
                        </button>
                        <button 
                            onClick={() => setShowDocumentList(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="bg-gray-800 dark:bg-gray-900 text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="text-center flex-1 mx-4">
                        <div className="text-sm mb-1 font-medium">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div className="text-xs mb-2 font-light">Độc lập - Tự do - Hạnh phúc</div>
                    </div>
                </div>
            </div>
            
            {/* Render document list modal */}
            {renderDocumentList()}
            
            {/* Main content */}
            <div className="p-4 bg-gray-700 dark:bg-gray-800 text-white">
                <div className="space-y-4">
                    {/* Official document number */}
                    <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                        <div className="flex items-center">
                            <span className="w-1/3 text-sm font-medium">Số công văn:</span>
                            {isFormSubmitted ? (
                                <input 
                                    type="text" 
                                    className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter official number"
                                    name="officialNumber"
                                    value={documentData.officialNumber}
                                    onChange={handleDocumentChange}
                                />
                            ) : (
                                <div className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                    {documentData.officialNumber || 'Enter official number'}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Document date field (replaces CMND/CCCD field) */}
                    <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                        <div className="flex items-center">
                            <span className="w-1/3 text-sm font-medium">Ngày tháng năm:</span>
                            {isFormSubmitted ? (
                                <input 
                                    type="date" 
                                    className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Select date"
                                    name="documentDate"
                                    value={documentData.documentDate}
                                    onChange={handleDateChange}
                                />
                            ) : (
                                <div className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                    {documentData.documentDate ? new Date(documentData.documentDate).toLocaleDateString() : 'Select date'}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Full name */}
                    <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                        <div className="flex items-center">
                            <span className="w-1/3 text-sm font-medium">Kính gửi:</span>
                            {isFormSubmitted ? (
                                <input 
                                    type="text" 
                                    className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter full name"
                                    name="fullName"
                                    value={documentData.fullName}
                                    onChange={handleDocumentChange}
                                />
                            ) : (
                                <div className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                    {documentData.fullName || 'Enter full name'}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                        <div>
                            <span className="text-sm font-medium mb-2 block">Enter content:</span>
                            {isFormSubmitted ? (
                                <textarea 
                                    className="w-full p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[150px]"
                                    placeholder="Enter document content"
                                    name="content"
                                    value={documentData.content}
                                    onChange={handleDocumentChange}
                                />
                            ) : (
                                <div className="w-full p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300 min-h-[150px]">
                                    {documentData.content || 'Enter document content'}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Address */}
                    <div className="flex space-x-4">
                        <div className="w-1/2 bg-gray-600 dark:bg-gray-700 p-3 rounded">
                            <div>
                                <span className="text-sm font-medium mb-2 block">Nơi nhận:</span>
                                {isFormSubmitted ? (
                                    <input 
                                        type="text" 
                                        className="w-full p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter address"
                                        name="address"
                                        value={documentData.address}
                                        onChange={handleDocumentChange}
                                    />
                                ) : (
                                    <div className="w-full p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                        {documentData.address || 'Enter address'}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Recipient name */}
                        <div className="w-1/2 bg-gray-600 dark:bg-gray-700 p-3 rounded">
                            <div>
                                <span className="text-sm font-medium mb-2 block">Người viết đơn:</span>
                                {isFormSubmitted ? (
                                    <input 
                                        type="text" 
                                        className="w-full p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter recipient name"
                                        name="recipientName"
                                        value={documentData.recipientName}
                                        onChange={handleDocumentChange}
                                    />
                                ) : (
                                    <div className="w-full p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                        {documentData.recipientName || 'Enter recipient name'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 flex justify-end bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                {saveError && (
                    <div className="mr-auto text-red-500 text-sm">
                        {saveError}
                    </div>
                )}
                {saveSuccess && (
                    <div className="mr-auto text-green-500 text-sm">
                        Document saved successfully!
                    </div>
                )}
                {isFormSubmitted ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsFormSubmitted(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            disabled={isSaving}
                        >
                            Back
                        </button>
                        <button 
                            onClick={handleSaveDocument}
                            disabled={isSaving}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : 'Save'}
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowDocumentList(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            My Documents
                        </button>
                        <button 
                            onClick={() => setIsFormSubmitted(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Edit Document
                        </button>
                        <button 
                            onClick={handleCreateNewDocument}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                            New Document
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OfficialDocumentForm; 