import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from 'react-markdown';

function OCRPage() {
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);
    const { user } = useAuth();
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [ocrResult, setOcrResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [serverStatus, setServerStatus] = useState("checking");
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeMode, setActiveMode] = useState('text');
    const [uploadedFiles, setUploadedFiles] = useState([
        { id: 1, name: 'document1.jpg', date: '2024-03-10', status: 'completed', type: 'image' },
        { id: 2, name: 'scan2.png', date: '2024-03-09', status: 'completed', type: 'image' },
        { id: 3, name: 'text3.jpg', date: '2024-03-08', status: 'completed', type: 'image' },
    ]);
    const [activePage, setActivePage] = useState('home');
    const resultBoxRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    // Check server connection when component loads
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                await axios.get("http://127.0.0.1:8000/health");
                setServerStatus("online");
            } catch (error) {
                setServerStatus("offline");
                console.error("Server is offline:", error);
            }
        };
        
        checkServerStatus();
    }, []);

    // Scroll to bottom of results when new content is added
    useEffect(() => {
        if (resultBoxRef.current && ocrResult) {
            resultBoxRef.current.scrollTop = resultBoxRef.current.scrollHeight;
        }
    }, [ocrResult]);

    // Simulate upload progress
    useEffect(() => {
        let interval;
        if (isProcessing && uploadProgress < 100) {
            interval = setInterval(() => {
                setUploadProgress(prev => {
                    const newProgress = prev + 5;
                    return newProgress <= 100 ? newProgress : 100;
                });
            }, 150);
        }
        return () => clearInterval(interval);
    }, [isProcessing, uploadProgress]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleSelectedFile(file);
        }
    };

    const handleSelectedFile = (file) => {
        setError(null); // Clear any previous errors
        
        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'application/pdf'];
        if (!validImageTypes.includes(file.type)) {
            setError('Please upload a valid image (JPG, PNG, GIF, BMP) or PDF file.');
            return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size exceeds 10MB limit. Please upload a smaller file.');
            return;
        }
        
        setImage(file);
        // Only create preview for images, not PDFs
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            // For PDFs, just show the file name as preview
            setPreview(null);
        }
    };

    const handleUpload = async () => {
        if (!image) return;

        // Animate upload process
        setUploadProgress(0);
        setIsProcessing(true);
        setLoading(true);
        setOcrResult(null);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", image);
            formData.append("mode", activeMode); // Send the active mode to backend

            const response = await axios.post(
                "http://127.0.0.1:8000/ocr",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            setOcrResult(response.data);
            
            // Add to uploaded files
            const newFile = {
                id: Date.now(),
                name: image.name,
                date: new Date().toISOString().split('T')[0],
                status: 'completed',
                type: image.type.startsWith('image/') ? 'image' : 'document'
            };
            
            setUploadedFiles(prev => [newFile, ...prev]);
            
            // Store in localStorage for persistence
            localStorage.setItem('uploadedFiles', JSON.stringify([newFile, ...uploadedFiles]));
            
        } catch (error) {
            console.error("Error processing OCR:", error);
            setError(error.response?.data?.error || "An error occurred while processing your file. Please try again.");
            setOcrResult(null);
        } finally {
            setLoading(false);
            // Ensure progress reaches 100% before stopping
            setTimeout(() => {
                setUploadProgress(100);
                setTimeout(() => {
                    setIsProcessing(false);
                }, 500);
            }, 500);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
            handleSelectedFile(file);
        }
    };

    const renderContent = () => {
        switch (activePage) {
            case 'home':
                return (
                    <div className="flex flex-col lg:flex-row gap-6 h-full">
                        {/* Left Column: Results Section */}
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
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
                            </div>
                            
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
                                                <div className={`prose dark:prose-invert max-w-none ${
                                                    ocrResult.markdown ? 'prose-sm' : ''
                                                }`}>
                                                    <ReactMarkdown>
                                                        {ocrResult.markdown || ocrResult.text}
                                                    </ReactMarkdown>
                                                </div>
                                                
                                                {/* Action buttons for the result */}
                                                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                    <button className="flex items-center px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 transition">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                                        </svg>
                                                        Copy
                                                    </button>
                                                    <button className="flex items-center px-3 py-1.5 text-xs bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-800/50 transition">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                        </svg>
                                                        Export
                                                    </button>
                                                    <button className="flex items-center px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-800/50 transition">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Upload Section */}
                        <div className="lg:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 overflow-hidden">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Upload Document</h3>
                            
                            <div 
                                className={`relative border-2 border-dashed rounded-xl transition-all duration-300 ${
                                    isProcessing ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 
                                    'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                                }`}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                {/* Upload Progress Bar */}
                                {isProcessing && (
                                    <div className="absolute top-0 left-0 h-1.5 bg-blue-500" style={{ width: `${uploadProgress}%`, transition: 'width 0.3s ease-in-out' }}></div>
                                )}
                                
                                <div className="p-6 flex flex-col items-center justify-center">
                                    {!image ? (
                                        <div className="text-center">
                                            <div className="mb-4 bg-blue-100 dark:bg-blue-900/30 p-4 inline-flex rounded-full">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                                Drop your file here
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                                or browse from your computer
                                            </p>
                                            <label className="inline-flex items-center px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group">
                                                <span className="group-hover:translate-x-1 transition-transform duration-300">Choose File</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                <input
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                                Supported formats: JPG, PNG, GIF, BMP, PDF
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="w-full flex flex-col items-center">
                                            <div className="w-full flex flex-wrap md:flex-nowrap items-center justify-between gap-4 mb-4">
                                                <div className="flex items-center">
                                                    {preview ? (
                                                        <div className="h-16 w-16 rounded overflow-hidden mr-4 border dark:border-gray-700 flex-shrink-0">
                                                            <img
                                                                src={preview}
                                                                alt="Preview"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="h-16 w-16 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4 flex-shrink-0">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-md font-medium text-gray-800 dark:text-white truncate">{image.name}</h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {(image.size / 1024).toFixed(1)} KB
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Preview section */}
                                            {preview && (
                                                <div className="mt-2 w-full">
                                                    <div className="relative rounded-lg overflow-hidden border dark:border-gray-700">
                                                        <img
                                                            src={preview}
                                                            alt="Preview"
                                                            className="w-full max-h-[200px] object-contain"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Action buttons */}
                                            <div className="flex justify-between w-full mt-4 pt-4 border-t dark:border-gray-700">
                                                <button
                                                    onClick={() => {
                                                        setImage(null);
                                                        setPreview(null);
                                                        setError(null);
                                                    }}
                                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                                <button 
                                                    onClick={handleUpload} 
                                                    disabled={isProcessing}
                                                    className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-white ${
                                                        isProcessing 
                                                            ? 'bg-blue-400 cursor-not-allowed' 
                                                            : 'bg-blue-600 hover:bg-blue-700'
                                                    } transition-all duration-300 shadow-md`}
                                                >
                                                    {isProcessing ? (
                                                        <>
                                                            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            <span>Processing...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span>Process Document</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Recent files section */}
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Recent Uploads</h4>
                                <div className="space-y-2">
                                    {uploadedFiles.slice(0, 3).map((file) => (
                                        <div key={file.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
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
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{file.date}</p>
                                            </div>
                                            <button className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    {uploadedFiles.length > 3 && (
                                        <button 
                                            onClick={() => setActivePage('files')}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium w-full text-center py-2"
                                        >
                                            View All Files
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'files':
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
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {uploadedFiles.map((file) => (
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
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300">
                                                        {file.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {file.type || "document"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-3">
                                                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View
                                                        </button>
                                                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            Download
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center">
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
                            
                            {uploadedFiles.length === 0 && (
                                <div className="text-center py-12">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No files yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                        Upload your first document to start extracting text using OCR technology
                                    </p>
                                    <button 
                                        onClick={() => setActivePage('home')}
                                        className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Upload Document
                                    </button>
                                </div>
                            )}
                            
                            {uploadedFiles.length > 0 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Showing {uploadedFiles.length} documents
                                    </p>
                                    <div className="flex space-x-1">
                                        <button className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                                            Previous
                                        </button>
                                        <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm">
                                            1
                                        </button>
                                        <button className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Settings</h2>
                        
                        <div className="space-y-6">
                            <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
                                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">OCR Settings</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Recognition Mode</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose the default mode for OCR processing</p>
                                        </div>
                                        <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 text-sm">
                                            <option value="text">Text Recognition</option>
                                            <option value="table">Table Extraction</option>
                                            <option value="form">Form Data</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Language</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select primary language for better recognition</p>
                                        </div>
                                        <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 text-sm">
                                            <option value="en">English</option>
                                            <option value="fr">French</option>
                                            <option value="es">Spanish</option>
                                            <option value="de">German</option>
                                            <option value="pt">Portuguese</option>
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence Threshold</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum confidence score for OCR results (higher is more accurate)</p>
                                        </div>
                                        <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 text-sm">
                                            <option value="0.6">60%</option>
                                            <option value="0.7">70%</option>
                                            <option value="0.8">80%</option>
                                            <option value="0.9">90%</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
                                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Account Settings</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive email notifications when OCR processing is complete</p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Save OCR History</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Keep history of processed documents</p>
                                        </div>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input type="checkbox" name="toggle2" id="toggle2" checked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                            <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"></label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-2 flex justify-end space-x-3">
                                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors">
                                    Cancel
                                </button>
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 h-screen shadow-lg transition-all duration-300 flex flex-col flex-shrink-0 z-10`}>
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    {isSidebarOpen && (
                        <span className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            OCR Tech
                        </span>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isSidebarOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            )}
                        </svg>
                    </button>
                </div>
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => setActivePage('home')}
                                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                                    activePage === 'home'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {isSidebarOpen && <span>OCR Scanner</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActivePage('files')}
                                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                                    activePage === 'files'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                {isSidebarOpen && <span>Document History</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActivePage('settings')}
                                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                                    activePage === 'settings'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {isSidebarOpen && <span>Settings</span>}
                            </button>
                        </li>
                    </ul>
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </div>
                
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-800 shadow-md z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center">
                            {activePage === 'home' ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    OCR Scanner
                                </>
                            ) : activePage === 'files' ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    Document History
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Settings
                                </>
                            )}
                        </h1>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Server:</span>
                                <span className={`inline-block w-2 h-2 rounded-full ${
                                    serverStatus === "checking" ? "bg-gray-400" :
                                    serverStatus === "online" ? "bg-green-500" :
                                    "bg-red-500"
                                }`}></span>
                                <span className={`ml-1 text-xs font-medium ${
                                    serverStatus === "checking" ? "text-gray-500 dark:text-gray-400" :
                                    serverStatus === "online" ? "text-green-600 dark:text-green-400" :
                                    "text-red-600 dark:text-red-400"
                                }`}>
                                    {serverStatus}
                                </span>
                            </div>
                            <button
                                onClick={toggleDarkMode}
                                className={`p-2 rounded-lg transition-colors duration-300 ${
                                    darkMode 
                                        ? 'bg-gray-700 text-yellow-400' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                                aria-label="Toggle dark mode"
                            >
                                {darkMode ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                            <div className="flex items-center ml-3">
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                {isSidebarOpen && (
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                            {user?.name || 'User'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default OCRPage; 