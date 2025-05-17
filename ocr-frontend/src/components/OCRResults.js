import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import IdCardForm from './IdCardForm';
import { getIdCard, getUserIdCards } from '../services/idCardService';

function OCRResults({ 
    resultBoxRef, 
    loading, 
    ocrResult, 
    error, 
    setError, 
    user, 
    image, 
    preview, 
    activeMode, 
    setActiveMode,
    handleCopyResult,
    handleExportResult,
    handleEditStart,
    isEditing,
    editableText,
    handleEditChange,
    handleEditSave,
    handleEditCancel
}) {
    const [showOverlay, setShowOverlay] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [idCardData, setIdCardData] = useState({
        cardNumber: '',
        fullName: '',
        dateOfBirth: '',
        sex: '',
        nationality: 'Việt Nam',
        placeOfOrigin: '',
        placeOfResidence: '',
        dateOfExpiry: '',
        logoImage: null,
        personImage: null,
        qrImage: null
    });
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const [showIdCardsList, setShowIdCardsList] = useState(false);
    const [userCards, setUserCards] = useState([]);
    const [isLoadingCards, setIsLoadingCards] = useState(false);
    const [cardListError, setCardListError] = useState(null);
    
    // Load existing ID card data on component mount
    useEffect(() => {
        const fetchIdCardData = async () => {
            try {
                // Check if user is authenticated before attempting request
                if (!localStorage.getItem('token')) {
                    console.log('User not authenticated, skipping ID card fetch');
                    return;
                }
                
                const response = await getIdCard();
                if (response.success && response.data) {
                    // Format dates to ISO string format for date inputs
                    const formatDateForInput = (dateString) => {
                        if (!dateString) return '';
                        try {
                            const date = new Date(dateString);
                            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                        } catch (error) {
                            console.error('Error formatting date:', error);
                            return '';
                        }
                    };
                    
                    // Format data to match our frontend structure
                    setIdCardData({
                        cardNumber: response.data.cardNumber || '',
                        fullName: response.data.fullName || '',
                        dateOfBirth: formatDateForInput(response.data.dateOfBirth),
                        sex: response.data.sex || '',
                        nationality: response.data.nationality || 'Vietnam',
                        placeOfOrigin: response.data.placeOfOrigin || '',
                        placeOfResidence: response.data.placeOfResidence || '',
                        dateOfExpiry: formatDateForInput(response.data.dateOfExpiry),
                        // Map image URLs
                        personImage: response.data.portraitImage?.driveUrl || null,
                        logoImage: response.data.logoImage?.driveUrl || null,
                        qrImage: response.data.qrImage?.driveUrl || null
                    });
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    // Authentication error - could handle token refresh or logout here
                    console.warn('Authentication error when fetching ID card:', error.message);
                    // Don't show error to user as this is just initial loading
                } else {
                    console.error('Error fetching ID card:', error);
                }
            }
        };
        
        fetchIdCardData();
    }, []);
    
    const handleOverlayToggle = () => {
        setShowOverlay(!showOverlay);
        if (!showOverlay) {
            setSelectedForm(null);
            resetIdCardForm();
            setIsFormSubmitted(false);
        }
    };
    
    const handleFormSelect = (formType) => {
        setSelectedForm(formType);
        setIsFormSubmitted(false);
    };

    const resetIdCardForm = () => {
        setIdCardData({
            cardNumber: '',
            fullName: '',
            dateOfBirth: '',
            sex: '',
            nationality: 'Việt Nam',
            placeOfOrigin: '',
            placeOfResidence: '',
            dateOfExpiry: '',
            logoImage: null,
            personImage: null,
            qrImage: null
        });
    };
    
    const handleIdCardChange = (e) => {
        const { name, value } = e.target;
        setIdCardData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleImageUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setIdCardData(prev => ({
                    ...prev,
                    [field]: reader.result,
                    [`${field}File`]: file // Store the file object for API upload
                }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleIdCardSubmit = async () => {
        setCardListError(null);
        setIsLoadingCards(true);
        try {
            // Fetch user's saved ID cards
            const response = await getUserIdCards();
            if (response && response.data) {
                setUserCards(response.data);
                setShowIdCardsList(true);
            } else {
                // If no cards exist or error in format, go directly to new card form
                setIsFormSubmitted(true);
            }
        } catch (error) {
            console.error('Error fetching ID cards:', error);
            setCardListError(error.message || 'Failed to load ID cards');
            // If error, still allow creating a new card
            setIsFormSubmitted(true);
        } finally {
            setIsLoadingCards(false);
        }
    };

    const handleCreateNewCard = () => {
        // Reset form data
        setIdCardData({
            cardNumber: '',
            fullName: '',
            dateOfBirth: '',
            sex: '',
            nationality: 'Vietnam',
            placeOfOrigin: '',
            placeOfResidence: '',
            dateOfExpiry: '',
            logoImage: null,
            personImage: null,
            qrImage: null
        });
        setShowIdCardsList(false);
        setIsFormSubmitted(true);
    };

    const handleSelectCard = (card) => {
        setIdCardData({
            _id: card._id,
            cardNumber: card.cardNumber,
            fullName: card.fullName,
            dateOfBirth: card.dateOfBirth ? new Date(card.dateOfBirth).toISOString().split('T')[0] : '',
            sex: card.sex || '',
            nationality: card.nationality || 'Vietnam',
            placeOfOrigin: card.placeOfOrigin || '',
            placeOfResidence: card.placeOfResidence || '',
            dateOfExpiry: card.dateOfExpiry ? new Date(card.dateOfExpiry).toISOString().split('T')[0] : '',
            personImage: card.portraitImage?.driveUrl || null,
            logoImage: card.logoImage?.driveUrl || null,
            qrImage: card.qrImage?.driveUrl || null
        });
        setShowIdCardsList(false);
        setIsFormSubmitted(true);
    };

    // Render ID cards list
    const renderIdCardsList = () => {
        return (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Select ID Card</h4>
                    <button 
                        onClick={() => setShowIdCardsList(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {cardListError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p>{cardListError}</p>
                    </div>
                )}

                {isLoadingCards ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : userCards.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <p className="mb-2">You don't have any ID card saved</p>
                        <button 
                            onClick={handleCreateNewCard}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Create New Card
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 mb-6">
                            {userCards.map(card => (
                                <div 
                                    key={card._id} 
                                    className="p-4 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 cursor-pointer transition-colors flex justify-between items-center"
                                    onClick={() => handleSelectCard(card)}
                                >
                                    <div>
                                        <div className="font-medium text-gray-800 dark:text-gray-200">{card.fullName}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Số: {card.cardNumber}</div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            Updated: {new Date(card.updatedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                    <button 
                                        className="px-3 py-1 bg-blue-100 text-blue-600 dark:bg-blue-700 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectCard(card);
                                        }}
                                    >
                                        Select
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center border-t border-gray-200 dark:border-gray-700 pt-4">
                            <button 
                                onClick={handleCreateNewCard}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create New Card
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };
    
    return (
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
            {/* <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveMode('text')}
                        className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                            activeMode === 'text'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Text Recognition
                    </button>
                    <button 
                        onClick={() => setActiveMode('table')}
                        className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                            activeMode === 'table'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Table Extraction
                    </button>
                    <button 
                        onClick={() => setActiveMode('form')}
                        className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                            activeMode === 'form'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Form Data
                    </button>
                </div>
            </div> */}
            
            {/* Results area */}
            <div 
                ref={resultBoxRef}
                className="flex-1 p-6 overflow-y-auto flex flex-col space-y-4"
                style={{ maxHeight: 'calc(100vh - 16rem)' }}
            >
                {/* Empty state - no results yet */}
                {!loading && !ocrResult && !error && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h.01M12 12h.01M15 12h.01M20 12a8 8 0 01-8 8v0a8 8 0 01-8-8v0a8 8 0 018-8v0a8 8 0 018 8v0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Results Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Upload an image or document to begin processing
                            </p>
                            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                                Select a recognition mode and upload your file to extract text and data using our advanced OCR technology
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Loading state */}
                {loading && (
                    <div className="self-center py-10">
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-blue-600 dark:text-blue-400 mb-4">
                                <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 font-medium">Processing your document...</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">This may take a moment depending on the file size</p>
                        </div>
                    </div>
                )}
                
                {/* Error state */}
                {error && (
                    <div className="flex justify-center py-10">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg">
                            <div className="flex items-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Processing Error</h3>
                            </div>
                            <p className="text-red-700 dark:text-red-300">{error}</p>
                            <button 
                                className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                                onClick={() => setError(null)}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Results */}
                {ocrResult && (
                    <div className="flex flex-col space-y-6 animate-fade-in">
                        {/* User message bubble - what they uploaded */}
                        <div className="flex justify-end">
                            <div className="bg-blue-600 text-white p-4 rounded-lg rounded-tr-none max-w-md md:max-w-lg shadow-md">
                                <div className="flex items-center mb-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{user?.name || 'You'}</p>
                                        <p className="text-xs text-blue-200">
                                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                                <p className="mb-2">Uploaded <span className="font-semibold">{image?.name}</span> for {activeMode} recognition</p>
                                {preview && (
                                    <div className="mt-2">
                                        <img
                                            src={preview}
                                            alt="Uploaded Preview"
                                            className="max-h-[200px] rounded border border-blue-400 shadow-inner"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* System response bubble */}
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg rounded-tl-none max-w-md md:max-w-2xl shadow-md border-l-4 border-blue-500">
                                <div className="flex items-center mb-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-2 text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">OCR Tech</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                                
                                {isEditing ? (
                                    <div>
                                        <textarea
                                            value={editableText}
                                            onChange={handleEditChange}
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md font-mono text-sm text-gray-800 dark:text-gray-200 min-h-[200px]"
                                        />
                                        <div className="flex gap-2 mt-3">
                                            <button 
                                                onClick={handleEditSave}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                                            >
                                                Save
                                            </button>
                                            <button 
                                                onClick={handleEditCancel}
                                                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`prose dark:prose-invert max-w-none ${
                                        ocrResult.markdown ? 'prose-sm' : ''
                                    }`}>
                                        <ReactMarkdown>
                                            {ocrResult.markdown || ocrResult.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                
                                {/* Action buttons for the result */}
                                {!isEditing && (
                                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <button 
                                            id="copy-button"
                                            onClick={handleCopyResult}
                                            className="flex items-center px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 transition"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                            </svg>
                                            Copy
                                        </button>
                                        <button 
                                            onClick={handleExportResult}
                                            className="flex items-center px-3 py-1.5 text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-800/50 transition"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Export
                                        </button>
                                        <button 
                                            onClick={handleEditStart}
                                            className="flex items-center px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-800/50 transition"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit
                                        </button>
                                        
                                        <button 
                                            onClick={handleOverlayToggle}
                                            className="flex items-center px-3 py-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                            </svg>
                                            Form Overlay
                                        </button>
                                        
                                        {/* Hiển thị link Google Drive nếu có */}
                                        {ocrResult.driveUrl && (
                                            <a 
                                                href={ocrResult.driveUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center px-3 py-1.5 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 rounded hover:bg-orange-100 dark:hover:bg-orange-800/50 transition"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                Open in Drive
                                            </a>
                                        )}
                                        
                                        {/* Hiển thị thời gian xử lý */}
                                        {ocrResult.uploadTime && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-auto self-center">
                                                Processed: {new Date(ocrResult.uploadTime).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Form Overlay */}
            {showOverlay && ocrResult && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Document Form Analysis</h3>
                            <button 
                                onClick={handleOverlayToggle}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row h-[calc(90vh-8rem)] overflow-hidden">
                            {/* Left side: OCR content */}
                            <div className="md:w-1/2 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">OCR Result:</h4>
                                <div className="prose dark:prose-invert max-w-none">
                                    <ReactMarkdown>
                                        {ocrResult.markdown || ocrResult.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            
                            {/* Right side: Form selection */}
                            <div className="md:w-1/2 p-6 overflow-y-auto relative">
                                {!isFormSubmitted && !showIdCardsList && (
                                    <>
                                        <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Select Document Type</h4>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            <button 
                                                onClick={() => handleFormSelect('id_card')}
                                                className={`flex items-center p-4 border rounded-lg transition-all ${
                                                    selectedForm === 'id_card' 
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                }`}
                                            >
                                                <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-lg mr-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Căn Cước Công Dân</h5>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Extract ID card information</p>
                                                </div>
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleFormSelect('resolution')}
                                                className={`flex items-center p-4 border rounded-lg transition-all ${
                                                    selectedForm === 'resolution' 
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                }`}
                                            >
                                                <div className="bg-green-100 dark:bg-green-800 p-3 rounded-lg mr-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Nghị Quyết</h5>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Extract resolution document data</p>
                                                </div>
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleFormSelect('decision')}
                                                className={`flex items-center p-4 border rounded-lg transition-all ${
                                                    selectedForm === 'decision' 
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                }`}
                                            >
                                                <div className="bg-purple-100 dark:bg-purple-800 p-3 rounded-lg mr-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                </div>
                                                <div className="text-left">
                                                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Quyết Định</h5>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Extract decision document data</p>
                                                </div>
                                            </button>
                                        </div>
                                    </>
                                )}
                                
                                {/* ID Card Selection List */}
                                {selectedForm === 'id_card' && !isFormSubmitted && showIdCardsList && renderIdCardsList()}
                                
                                {/* ID Card Submit Button */}
                                {selectedForm === 'id_card' && !isFormSubmitted && !showIdCardsList && (
                                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                                            Selected: Căn Cước Công Dân
                                        </h5>
                                        <button 
                                            onClick={handleIdCardSubmit}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                )}
                                
                                {/* ID Card Form */}
                                {selectedForm === 'id_card' && isFormSubmitted && (
                                    <div className="absolute inset-0">
                                        <IdCardForm 
                                            idCardData={idCardData}
                                            setIdCardData={setIdCardData}
                                            isFormSubmitted={isFormSubmitted}
                                            setIsFormSubmitted={setIsFormSubmitted}
                                            handleIdCardChange={handleIdCardChange}
                                            handleImageUpload={handleImageUpload}
                                        />
                                    </div>
                                )}
                                
                                {(selectedForm === 'resolution' || selectedForm === 'decision') && !isFormSubmitted && (
                                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                                            Selected: {selectedForm === 'resolution' ? 'Nghị Quyết' : 'Quyết Định'}
                                        </h5>
                                        <button 
                                            onClick={() => setIsFormSubmitted(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OCRResults; 