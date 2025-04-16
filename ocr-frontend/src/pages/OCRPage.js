import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useValidation } from "../context/ValidationContext";
import { useNavigate } from "react-router-dom";
import DocumentsHistory from "./DocumentsHistory";
import Settings from "./Settings";
import OCRResults from "../components/OCRResults";
import FileUpload from "../components/FileUpload";
import ExportModal from "../components/ExportModal";

function OCRPage() {
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);
    const { user, logout } = useAuth();
    const { validateFile } = useValidation();
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
    const [activePage, setActivePage] = useState(() => {
        const savedPage = localStorage.getItem('activePage');
        return savedPage || 'home';
    });
    const resultBoxRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableText, setEditableText] = useState("");
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const navigate = useNavigate();

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

    // Save activePage to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activePage', activePage);
    }, [activePage]);

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
        
        // Validate file using validation context
        const validation = validateFile(file);
        if (!validation.isValid) {
            setError(validation.error);
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
        if (!image) {
            setError('Please select a file to upload');
            return;
        }

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
        if (file) {
            handleSelectedFile(file);
        }
    };

    const handleCopyResult = () => {
        if (!ocrResult) return;
        
        const textToCopy = ocrResult.text || ocrResult.markdown || "";
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Optional: Show a brief success notification
                const originalText = document.querySelector('#copy-button').innerHTML;
                document.querySelector('#copy-button').innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                `;
                
                setTimeout(() => {
                    document.querySelector('#copy-button').innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                setError("Failed to copy text to clipboard.");
            });
    };

    const handleExportResult = () => {
        // Open the export modal instead of directly exporting
        setIsExportModalOpen(true);
    };

    const handleExportFormat = (format) => {
        if (!ocrResult) return;
        
        const content = ocrResult.text || ocrResult.markdown || "";
        const fileName = image?.name?.split('.').slice(0, -1).join('.') || "ocr-result";
        
        // Handle different export formats
        if (format === 'txt') {
            // Export as plain text
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = `${fileName}.txt`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } 
        else if (format === 'docx' || format === 'pdf') {
            // In a real application, you would use a library like docx-js or pdfmake
            // For simplicity, we'll send the request to the backend to generate these files
            axios({
                url: `http://127.0.0.1:8000/export`,
                method: 'POST',
                data: { 
                    content: content,
                    format: format,
                    fileName: fileName
                },
                responseType: 'blob'
            })
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            })
            .catch(err => {
                console.error(`Failed to export as ${format}:`, err);
                setError(`Failed to export as ${format}. The server may not support this format.`);
            });
        }
    };

    const handleEditStart = () => {
        if (!ocrResult) return;
        
        // Set the editable text state with the current OCR result
        setEditableText(ocrResult.text || ocrResult.markdown || "");
        setIsEditing(true);
    };

    const handleEditSave = () => {
        // Save the edited text
        const updatedResult = { ...ocrResult };
        if (ocrResult.text) {
            updatedResult.text = editableText;
        } else if (ocrResult.markdown) {
            updatedResult.markdown = editableText;
        }
        
        setOcrResult(updatedResult);
        setIsEditing(false);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditableText("");
    };

    const handleEditChange = (e) => {
        setEditableText(e.target.value);
    };

    const renderContent = () => {
        switch (activePage) {
            case 'home':
                return (
                    <div className="flex flex-col lg:flex-row gap-6 h-full">
                        {/* Left Column: Results Section */}
                        <OCRResults 
                            resultBoxRef={resultBoxRef}
                            loading={loading}
                            ocrResult={ocrResult}
                            error={error}
                            setError={setError}
                            user={user}
                            image={image}
                            preview={preview}
                            activeMode={activeMode}
                            setActiveMode={setActiveMode}
                            handleCopyResult={handleCopyResult}
                            handleExportResult={handleExportResult}
                            handleEditStart={handleEditStart}
                            isEditing={isEditing}
                            editableText={editableText}
                            handleEditChange={handleEditChange}
                            handleEditSave={handleEditSave}
                            handleEditCancel={handleEditCancel}
                        />

                        {/* Right Column: Upload Section */}
                        <FileUpload 
                            image={image}
                            preview={preview}
                            isProcessing={isProcessing}
                            uploadProgress={uploadProgress}
                            handleDragOver={handleDragOver}
                            handleDrop={handleDrop}
                            handleFileChange={handleFileChange}
                            handleUpload={handleUpload}
                            setImage={setImage}
                            setPreview={setPreview}
                            setError={setError}
                            uploadedFiles={uploadedFiles}
                            setActivePage={setActivePage}
                        />
                    </div>
                );
            case 'files':
                return <DocumentsHistory uploadedFiles={uploadedFiles} setActivePage={setActivePage} />;
            case 'settings':
                return <Settings />;
            default:
                return null;
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 7h16" />
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

            {/* Export Modal */}
            <ExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExportFormat}
                fileName={image?.name?.split('.').slice(0, -1).join('.') || "ocr-result"}
            />
        </div>
    );
}

export default OCRPage; 