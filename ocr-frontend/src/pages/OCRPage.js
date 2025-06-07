import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import DocumentsHistory from "./DocumentsHistory";
import Settings from "./Settings";
import IdCardsPage from "./IdCardsPage";
import OfficialDocumentsPage from "./OfficialDocumentsPage";
import ImageOCRPage from "./ImageOCRPage";
import PdfOcrPage from "./PdfOcrPage";

function OCRPage() {
    const { logout } = useAuth();
    const [serverStatus, setServerStatus] = useState("checking");
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activePage, setActivePage] = useState(() => {
        const savedPage = localStorage.getItem('activePage');
        return savedPage || 'image-ocr';
    });
    const [uploadedFiles, setUploadedFiles] = useState(() => {
        // Get user-specific uploads from localStorage
        const userId = JSON.parse(localStorage.getItem('user'))?.id || 'guest';
        const storageKey = `uploadedFiles_${userId}`;
        const savedFiles = localStorage.getItem(storageKey);
        return savedFiles ? JSON.parse(savedFiles) : [];
    });
    const navigate = useNavigate();

    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                await axios.get("http://localhost:5000/health");
                setServerStatus("online");
            } catch (error) {
                setServerStatus("offline");
                console.error("Server is offline:", error);
            }
        };
        
        checkServerStatus();
    }, []);

    useEffect(() => {
        localStorage.setItem('activePage', activePage);
    }, [activePage]);

    // Save uploadedFiles to localStorage when it changes
    useEffect(() => {
            const userId = JSON.parse(localStorage.getItem('user'))?.id || 'guest';
            const storageKey = `uploadedFiles_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(uploadedFiles));
    }, [uploadedFiles]);

    const renderContent = () => {
        switch (activePage) {
            case 'image-ocr':
                return <ImageOCRPage setUploadedFiles={setUploadedFiles} setActivePage={setActivePage} />;
            case 'pdf-ocr':
                return <PdfOcrPage setUploadedFiles={setUploadedFiles} setActivePage={setActivePage} />;
            case 'files':
                return <DocumentsHistory uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} setActivePage={setActivePage} />;
            case 'idcards':
                return <IdCardsPage />;
            case 'documents':
                return <OfficialDocumentsPage />;
            case 'settings':
                return <Settings />;
            default:
                return <ImageOCRPage setUploadedFiles={setUploadedFiles} setActivePage={setActivePage} />;
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
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
                                onClick={() => setActivePage('image-ocr')}
                                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                                    activePage === 'image-ocr'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {isSidebarOpen && <span>Image OCR</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActivePage('pdf-ocr')}
                                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                                    activePage === 'pdf-ocr'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {isSidebarOpen && <span>PDF OCR</span>}
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
                                onClick={() => setActivePage('idcards')}
                                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                                    activePage === 'idcards'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                {isSidebarOpen && <span>ID Cards</span>}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActivePage('documents')}
                                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                                    activePage === 'documents'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {isSidebarOpen && <span>Official Documents</span>}
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
                
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-800 shadow-md z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center">
                            {activePage === 'image-ocr' ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Image OCR
                                </>
                            ) : activePage === 'pdf-ocr' ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    PDF OCR
                                </>
                            ) : activePage === 'files' ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    Document History
                                </>
                            ) : activePage === 'idcards' ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                    </svg>
                                    ID Cards
                                </>
                            ) : activePage === 'documents' ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Official Documents
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