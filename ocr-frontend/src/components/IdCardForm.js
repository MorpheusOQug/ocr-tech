import React, { useState, useEffect } from 'react';
import { saveIdCard, getUserIdCards, getIdCard } from '../services/idCardService';

// Sync with OCRResults.js card selection
export const selectIdCardById = async (cardId, setIdCardData) => {
    try {
        // Get the card data from API
        const response = await getIdCard(cardId);
        if (response && response.data) {
            setIdCardData({
                _id: response.data._id,
                cardNumber: response.data.cardNumber,
                fullName: response.data.fullName,
                dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
                sex: response.data.sex || '',
                nationality: response.data.nationality || 'Việt Nam',
                placeOfOrigin: response.data.placeOfOrigin || '',
                placeOfResidence: response.data.placeOfResidence || '',
                dateOfExpiry: response.data.dateOfExpiry ? new Date(response.data.dateOfExpiry).toISOString().split('T')[0] : '',
                personImage: response.data.portraitImage?.driveUrl || null,
                logoImage: response.data.logoImage?.driveUrl || null,
                qrImage: response.data.qrImage?.driveUrl || null
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error fetching card by ID:', error);
        return false;
    }
};

function IdCardForm({ 
    idCardData, 
    setIdCardData, 
    isFormSubmitted, 
    setIsFormSubmitted, 
    handleIdCardChange, 
    handleImageUpload 
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [userCards, setUserCards] = useState([]);
    const [showCardList, setShowCardList] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch user's ID cards when component mounts
    useEffect(() => {
        const fetchUserCards = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            try {
                setIsLoading(true);
                const response = await getUserIdCards();
                console.log('Received ID cards data:', response);
                if (response && response.data) {
                    setUserCards(response.data || []);
                } else {
                    console.error('Invalid response format:', response);
                    setSaveError('Failed to load ID cards. Invalid response format.');
                }
            } catch (error) {
                console.error('Error fetching user ID cards:', error);
                setSaveError(`Failed to load ID cards: ${error.message || 'Unknown error'}`);
                setUserCards([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserCards();
    }, [saveSuccess]); // Refetch when a new card is saved successfully

    // Custom date input handler
    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setIdCardData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveIdCard = async () => {
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                setSaveError('You need to be logged in to save the ID card.');
                return;
            }
            
            // Validate required fields
            if (!idCardData.cardNumber || !idCardData.fullName) {
                setSaveError('Card number and full name are required.');
                return;
            }
            
            console.log('Saving ID card with data:', { 
                cardNumber: idCardData.cardNumber,
                fullName: idCardData.fullName,
                hasId: !!idCardData._id
            });
            
            // Create a FormData object to handle file uploads
            const formData = new FormData();
            
            // Format dates for backend processing
            const formattedDateOfBirth = idCardData.dateOfBirth ? new Date(idCardData.dateOfBirth).toISOString() : '';
            const formattedDateOfExpiry = idCardData.dateOfExpiry ? new Date(idCardData.dateOfExpiry).toISOString() : '';
            
            // Add text fields to the form data
            formData.append('cardNumber', idCardData.cardNumber || '');
            formData.append('fullName', idCardData.fullName || '');
            formData.append('dateOfBirth', formattedDateOfBirth);
            formData.append('sex', idCardData.sex || '');
            formData.append('nationality', idCardData.nationality || 'Việt Nam');
            formData.append('placeOfOrigin', idCardData.placeOfOrigin || '');
            formData.append('placeOfResidence', idCardData.placeOfResidence || '');
            formData.append('dateOfExpiry', formattedDateOfExpiry);
            
            // Add image files if they exist
            if (idCardData.personImageFile) {
                formData.append('portraitImage', idCardData.personImageFile);
            }
            if (idCardData.logoImageFile) {
                formData.append('logoImage', idCardData.logoImageFile);
            }
            if (idCardData.qrImageFile) {
                formData.append('qrImage', idCardData.qrImageFile);
            }

            // If ID exists, add it to update existing card
            if (idCardData._id) {
                formData.append('_id', idCardData._id);
                console.log('Updating existing card with ID:', idCardData._id);
            } else {
                console.log('Creating new ID card');
            }
            
            // Send the request using our service
            const response = await saveIdCard(formData);
            
            // Handle successful response
            console.log('ID Card saved successfully:', response);
            setSaveSuccess(true);
            
            // Update the idCardData with the response data if needed
            if (response.data) {
                setIdCardData(prevData => ({
                    ...prevData,
                    ...response.data,
                    // Convert dates back to input format if present
                    dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
                    dateOfExpiry: response.data.dateOfExpiry ? new Date(response.data.dateOfExpiry).toISOString().split('T')[0] : '',
                    // If there are new image URLs, update them
                    personImage: response.data.portraitImage?.driveUrl || prevData.personImage,
                    logoImage: response.data.logoImage?.driveUrl || prevData.logoImage,
                    qrImage: response.data.qrImage?.driveUrl || prevData.qrImage
                }));
            }
            
            // Go back to preview mode
            setTimeout(() => {
                setIsFormSubmitted(false);
            }, 1500); // Show success message for 1.5 seconds before hiding
            
        } catch (error) {
            console.error('Error saving ID card:', error);
            console.error('Error details:', error.response?.data || error.message);
            if (error.response?.status === 401) {
                setSaveError('Authentication error. Please log in again.');
            } else {
                setSaveError(error.response?.data?.message || error.message || 'Failed to save ID card. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Create new blank ID card
    const handleCreateNewCard = () => {
        setIdCardData({
            cardNumber: '',
            fullName: '',
            dateOfBirth: '',
            sex: '',
            nationality: 'Việt Nam',
            placeOfOrigin: '',
            placeOfResidence: '',
            dateOfExpiry: '',
            personImage: '',
            logoImage: '',
            qrImage: ''
        });
        setIsFormSubmitted(true);
        setShowCardList(false);
    };

    // Load selected card data
    const handleSelectCard = (card) => {
        setIdCardData({
            _id: card._id,
            cardNumber: card.cardNumber,
            fullName: card.fullName,
            dateOfBirth: card.dateOfBirth ? new Date(card.dateOfBirth).toISOString().split('T')[0] : '',
            sex: card.sex || '',
            nationality: card.nationality || 'Việt Nam',
            placeOfOrigin: card.placeOfOrigin || '',
            placeOfResidence: card.placeOfResidence || '',
            dateOfExpiry: card.dateOfExpiry ? new Date(card.dateOfExpiry).toISOString().split('T')[0] : '',
            personImage: card.portraitImage?.driveUrl || '',
            logoImage: card.logoImage?.driveUrl || '',
            qrImage: card.qrImage?.driveUrl || ''
        });
        setShowCardList(false);
    };

    // Format display dates for view mode
    const formatDisplayDate = (isoDate) => {
        if (!isoDate) return '';
        try {
            const date = new Date(isoDate);
            return date.toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            });
        } catch (error) {
            return isoDate;
        }
    };

    // Render card list panel
    const renderCardList = () => {
        if (!showCardList) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">My ID Cards</h3>
                        <button onClick={() => setShowCardList(false)} className="text-gray-500">
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
                            <p>Loading your cards...</p>
                        </div>
                    ) : userCards.length === 0 ? (
                        <div className="text-center py-4">No ID cards found. Create your first one!</div>
                    ) : (
                        <div className="space-y-3">
                            {userCards.map(card => (
                                <div 
                                    key={card._id} 
                                    className="p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                                    onClick={() => handleSelectCard(card)}
                                >
                                    <div>
                                        <div className="font-medium">{card.fullName}</div>
                                        <div className="text-sm text-gray-500">Card #: {card.cardNumber}</div>
                                        <div className="text-xs text-gray-400">
                                            {card.updatedAt ? `Updated: ${new Date(card.updatedAt).toLocaleDateString()}` : ''}
                                        </div>
                                    </div>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectCard(card);
                                    }} className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm">
                                        Select
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="mt-4 flex justify-between">
                        <button 
                            onClick={handleCreateNewCard}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            Create New Card
                        </button>
                        <button 
                            onClick={() => setShowCardList(false)}
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
                        <div className="border-t border-gray-600 w-48 mx-auto"></div>
                        <h3 className='text-xl font-bold text-red-500'>CĂN CƯỚC CÔNG DÂN</h3>
                    </div>
                </div>
            </div>
            
            {/* Render card list modal */}
            {renderCardList()}
            
            {/* Main content */}
            <div className="p-4 bg-gray-700 dark:bg-gray-800 text-white">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 pr-4 mb-4 md:mb-0">
                        {/* Upload image */}
                        <div className="mb-4 w-full h-48 bg-white flex items-center justify-center cursor-pointer overflow-hidden relative rounded shadow border border-gray-300">
                            {idCardData.personImage ? (
                                <img src={idCardData.personImage} alt="Person" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-500 text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <div className="text-sm">Portrait</div>
                                    <div className="text-xs text-gray-400 mt-1">(Upload image)</div>
                                </div>
                            )}
                            {isFormSubmitted && (
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={(e) => handleImageUpload(e, 'personImage')}
                                    accept="image/*"
                                />
                            )}
                        </div>
                        
                        <div className="text-sm flex items-center bg-gray-600 dark:bg-gray-700 p-3 rounded">
                            <span className="font-medium mr-2">Có giá trị đến:</span>
                            {isFormSubmitted ? (
                                <input 
                                    type="date" 
                                    className="p-2 bg-gray-500 dark:bg-gray-600 rounded w-full text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    name="dateOfExpiry"
                                    value={idCardData.dateOfExpiry}
                                    onChange={handleDateChange}
                                />
                            ) : (
                                <span className="p-2 bg-gray-500 dark:bg-gray-600 rounded w-full text-gray-300">
                                    {formatDisplayDate(idCardData.dateOfExpiry) || 'DD/MM/YYYY'}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="md:w-2/3 md:pl-4">
                        <div className="space-y-3">
                            <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                                <div className="flex items-center">
                                    <span className="w-1/3 text-sm font-medium">Số / No:</span>
                                    {isFormSubmitted ? (
                                        <input 
                                            type="text" 
                                            className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="ENTER NUMBER"
                                            name="cardNumber"
                                            value={idCardData.cardNumber}
                                            onChange={handleIdCardChange}
                                        />
                                    ) : (
                                        <div className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                            {idCardData.cardNumber || 'ENTER NUMBER'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                                <div className="flex items-center">
                                    <span className="w-1/3 text-sm font-medium">Họ và tên / Full Name:</span>
                                    {isFormSubmitted ? (
                                        <input 
                                            type="text" 
                                            className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="ENTER FULL NAME"
                                            name="fullName"
                                            value={idCardData.fullName}
                                            onChange={handleIdCardChange}
                                        />
                                    ) : (
                                        <div className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                            {idCardData.fullName || 'ENTER FULL NAME'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                                <div className="flex items-center">
                                    <span className="w-1/3 text-sm font-medium">Ngày sinh / Date of birth:</span>
                                    {isFormSubmitted ? (
                                        <input 
                                            type="date" 
                                            className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            name="dateOfBirth"
                                            value={idCardData.dateOfBirth}
                                            onChange={handleDateChange}
                                        />
                                    ) : (
                                        <div className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                            {formatDisplayDate(idCardData.dateOfBirth) || 'DD/MM/YYYY'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                                <div className="flex items-center">
                                    <span className="w-1/3 text-sm font-medium">Giới tính / Sex:</span>
                                    {isFormSubmitted ? (
                                        <select 
                                            className="w-1/3 p-2 bg-gray-500 dark:bg-gray-600 rounded mr-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            name="sex"
                                            value={idCardData.sex}
                                            onChange={handleIdCardChange}
                                        >
                                            <option value="">-- Chọn --</option>
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    ) : (
                                        <div className="w-1/3 p-2 bg-gray-500 dark:bg-gray-600 rounded mr-2 text-gray-300">
                                            {idCardData.sex || 'Nam/Nữ'}
                                        </div>
                                    )}
                                    <span className="w-1/6 text-sm font-medium">Quốc tịch:</span>
                                    {isFormSubmitted ? (
                                        <input 
                                            type="text" 
                                            className="w-1/4 p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            name="nationality"
                                            value={idCardData.nationality}
                                            onChange={handleIdCardChange}
                                        />
                                    ) : (
                                        <div className="w-1/4 p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                            {idCardData.nationality || 'Việt Nam'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                                <div className="flex items-center">
                                    <span className="w-1/3 text-sm font-medium">Quê quán / Place of origin:</span>
                                    {isFormSubmitted ? (
                                        <input 
                                            type="text" 
                                            className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter place"
                                            name="placeOfOrigin"
                                            value={idCardData.placeOfOrigin}
                                            onChange={handleIdCardChange}
                                        />
                                    ) : (
                                        <div className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                            {idCardData.placeOfOrigin || 'Enter place'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-gray-600 dark:bg-gray-700 p-3 rounded">
                                <div className="flex items-center">
                                    <span className="w-1/3 text-sm font-medium">Nơi thường trú / Place of residence:</span>
                                    {isFormSubmitted ? (
                                        <input 
                                            type="text" 
                                            className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter place"
                                            name="placeOfResidence"
                                            value={idCardData.placeOfResidence}
                                            onChange={handleIdCardChange}
                                        />
                                    ) : (
                                        <div className="w-2/3 p-2 bg-gray-500 dark:bg-gray-600 rounded text-gray-300">
                                            {idCardData.placeOfResidence || 'Enter place'}
                                        </div>
                                    )}
                                </div>
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
                        ID Card saved successfully!
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
                            onClick={handleSaveIdCard}
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
                            onClick={() => setShowCardList(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            My Cards
                        </button>
                        <button 
                            onClick={() => setIsFormSubmitted(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Edit Card
                        </button>
                        <button 
                            onClick={handleCreateNewCard}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                            New Card
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IdCardForm; 