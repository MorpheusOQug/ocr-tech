import React, { useState, useEffect } from 'react';
import { getUserIdCards, deleteIdCard } from '../services/idCardService';
import IdCardForm from '../components/IdCardForm';

function IdCardsPage() {
    const [idCards, setIdCards] = useState([]);
    const [loadingIdCards, setLoadingIdCards] = useState(false);
    const [idCardError, setIdCardError] = useState(null);
    const [selectedIdCard, setSelectedIdCard] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [currentCard, setCurrentCard] = useState(null);
    const [currentCardData, setCurrentCardData] = useState({});

    // Fetch ID cards on component mount
    useEffect(() => {
        fetchIdCards();
    }, []);

    const fetchIdCards = async () => {
        setLoadingIdCards(true);
        setIdCardError(null);
        
        try {
            // Check if token exists
            const token = localStorage.getItem('token');
            if (!token) {
                setIdCardError('Authentication required. Please log in.');
                setLoadingIdCards(false);
                return;
            }
            
            // Fixed: Using getUserIdCards() instead of getIdCards()
            const response = await getUserIdCards();
            if (response.success && response.data) {
                setIdCards(response.data);
            } else {
                setIdCardError('Failed to fetch ID cards');
            }
        } catch (error) {
            console.error('Error fetching ID cards:', error);
            setIdCardError(error.response?.data?.message || 'Failed to fetch ID cards');
        } finally {
            setLoadingIdCards(false);
        }
    };

    // Handle Edit button click
    const handleEditCard = async (card) => {
        setCurrentCard(card);
        setCurrentCardData({
            _id: card._id,
            cardNumber: card.cardNumber,
            fullName: card.fullName,
            dateOfBirth: card.dateOfBirth ? new Date(card.dateOfBirth).toISOString().split('T')[0] : '',
            sex: card.sex || '',
            nationality: card.nationality || 'Việt Nam',
            placeOfOrigin: card.placeOfOrigin || '',
            placeOfResidence: card.placeOfResidence || '',
            dateOfExpiry: card.dateOfExpiry ? new Date(card.dateOfExpiry).toISOString().split('T')[0] : '',
            personImage: card.portraitImage?.driveUrl || null,
            logoImage: card.logoImage?.driveUrl || null,
            qrImage: card.qrImage?.driveUrl || null
        });
        setEditMode(true);
    };
    
    // Handle Delete button click
    const handleDeleteCard = async (cardId) => {
        if (window.confirm('Are you sure you want to delete this ID card?')) {
            try {
                await deleteIdCard(cardId);
                // Refresh the list after deletion
                fetchIdCards();
                setSelectedIdCard(null);
            } catch (error) {
                console.error('Error deleting ID card:', error);
                setIdCardError('Failed to delete ID card');
            }
        }
    };

    if (editMode && currentCard) {
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
                        Editing ID Card: {currentCard.fullName}
                    </h2>
                </div>
                
                <IdCardForm 
                    idCardData={currentCardData}
                    setIdCardData={setCurrentCardData}
                    isFormSubmitted={true}
                    setIsFormSubmitted={(value) => {
                        if (!value) {
                            setEditMode(false);
                            fetchIdCards();
                        }
                    }}
                    handleIdCardChange={(e) => {
                        const { name, value } = e.target;
                        setCurrentCardData(prev => ({
                            ...prev,
                            [name]: value
                        }));
                    }}
                    handleImageUpload={(e, field) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                setCurrentCardData(prev => ({
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

    return (
        <div className="w-full h-full">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Saved ID Cards</h2>
                <div className="flex gap-3">
                    <button 
                        onClick={() => {
                            setEditMode(true);
                            setCurrentCard(null);
                            setCurrentCardData({
                                cardNumber: '',
                                fullName: '',
                                dateOfBirth: '',
                                sex: '',
                                nationality: 'Việt Nam',
                                placeOfOrigin: '',
                                placeOfResidence: '',
                                dateOfExpiry: '',
                                personImage: null,
                                logoImage: null,
                                qrImage: null
                            });
                        }} 
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Card
                    </button>
                    <button 
                        onClick={fetchIdCards} 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {loadingIdCards ? (
                <div className="flex justify-center py-20">
                    <div className="flex flex-col items-center">
                        <div className="text-blue-600 dark:text-blue-400 mb-4">
                            <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">Loading ID cards...</p>
                    </div>
                </div>
            ) : idCardError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 dark:text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300 text-lg mb-4">{idCardError}</p>
                    <button 
                        onClick={fetchIdCards} 
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : idCards.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-10 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No ID Cards Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        You haven't saved any ID cards yet. Use the OCR Scanner to extract and save ID card information.
                    </p>
                    <button 
                        onClick={() => {
                            setEditMode(true);
                            setCurrentCard(null);
                            setCurrentCardData({
                                cardNumber: '',
                                fullName: '',
                                dateOfBirth: '',
                                sex: '',
                                nationality: 'Việt Nam',
                                placeOfOrigin: '',
                                placeOfResidence: '',
                                dateOfExpiry: '',
                                personImage: null,
                                logoImage: null,
                                qrImage: null
                            });
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Create New ID Card
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {idCards.map((card) => (
                        <div 
                            key={card._id} 
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setSelectedIdCard(card._id === selectedIdCard ? null : card)}
                        >
                            <div className="bg-gray-800 text-white p-3">
                                <div className="text-center">
                                    <div className="text-sm mb-1 font-medium">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                                    <div className="text-xs font-light">Độc lập - Tự do - Hạnh phúc</div>
                                    <h3 className="text-lg font-bold text-red-500 mt-1">CĂN CƯỚC CÔNG DÂN</h3>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-700 text-white">
                                <div className="flex">
                                    <div className="w-1/3 pr-3">
                                        {card.portraitImage?.driveUrl ? (
                                            <img 
                                                src={card.portraitImage.driveUrl} 
                                                alt="Portrait" 
                                                className="w-full h-24 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-full h-24 bg-gray-600 flex items-center justify-center rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-2/3">
                                        <div className="mb-2">
                                            <span className="text-sm font-medium text-gray-300">No:</span>
                                            <span className="text-base font-semibold ml-2">{card.cardNumber}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-sm font-medium text-gray-300">FullName:</span>
                                            <span className="text-base font-semibold ml-2">{card.fullName}</span>
                                        </div>
                                        {card.dateOfBirth && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-300">Date of Birth:</span>
                                                <span className="text-sm ml-2">
                                                    {new Date(card.dateOfBirth).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                Updated: {new Date(card.updatedAt || card.createdAt).toLocaleString()}
                            </div>
                            
                            {/* Expanded view when selected */}
                            {selectedIdCard === card._id && (
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {card.sex && (
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Giới tính:</span>
                                                <span className="ml-2 text-gray-600 dark:text-gray-400">{card.sex}</span>
                                            </div>
                                        )}
                                        {card.nationality && (
                                            <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Quốc tịch:</span>
                                                <span className="ml-2 text-gray-600 dark:text-gray-400">{card.nationality}</span>
                                            </div>
                                        )}
                                        {card.placeOfOrigin && (
                                            <div className="col-span-2">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Quê quán:</span>
                                                <span className="ml-2 text-gray-600 dark:text-gray-400">{card.placeOfOrigin}</span>
                                            </div>
                                        )}
                                        {card.placeOfResidence && (
                                            <div className="col-span-2">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Nơi thường trú:</span>
                                                <span className="ml-2 text-gray-600 dark:text-gray-400">{card.placeOfResidence}</span>
                                            </div>
                                        )}
                                        {card.dateOfExpiry && (
                                            <div className="col-span-2">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Có giá trị đến:</span>
                                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                                    {new Date(card.dateOfExpiry).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button 
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditCard(card);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCard(card._id);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default IdCardsPage; 