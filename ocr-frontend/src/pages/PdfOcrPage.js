import React, { useState, useEffect } from "react";
import axios from "axios";
import { useValidation } from "../context/ValidationContext";
import PdfViewer from "../components/PdfViewer";
import PdfResultViewer from "../components/PdfResultViewer";
import ExportModal from "../components/ExportModal";
import { processPdfFile, getPdfPageCount } from "../utils/pdfUtils";

function PdfOcrPage() {
    const { validateFile } = useValidation();
    const [pdfFile, setPdfFile] = useState(null);
    const [ocrResult, setOcrResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [, setServerStatus] = useState("checking");
    const [activeMode] = useState('text');
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableText, setEditableText] = useState("");
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [pdfPageCount, setPdfPageCount] = useState(0);
    const [, setPdfPages] = useState([]);
    const [currentPdfPage, setCurrentPdfPage] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState(() => {
        // Get user-specific uploads from localStorage
        const userId = JSON.parse(localStorage.getItem('user'))?.id || 'guest';
        const storageKey = `uploadedFiles_${userId}`;
        const savedFiles = localStorage.getItem(storageKey);
        return savedFiles ? JSON.parse(savedFiles) : [];
    });
    const [ocrResults, setOcrResults] = useState(() => {
        // Get user-specific OCR results from localStorage
        const userId = JSON.parse(localStorage.getItem('user'))?.id || 'guest';
        const storageKey = `ocrResults_${userId}`;
        const savedResults = localStorage.getItem(storageKey);
        return savedResults ? JSON.parse(savedResults) : {};
    });
    const [currentDocumentId, setCurrentDocumentId] = useState(() => {
        const savedDocumentId = localStorage.getItem('currentDocumentId_pdf');
        return savedDocumentId || null;
    });
    const [showUpload, setShowUpload] = useState(true);

    useEffect(() => {
        if (currentDocumentId && ocrResults[currentDocumentId]) {
            setOcrResult(ocrResults[currentDocumentId]);
            setShowUpload(false);
        }
    }, [currentDocumentId, ocrResults]);

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
        if (currentDocumentId) {
            localStorage.setItem('currentDocumentId_pdf', currentDocumentId);
        }
    }, [currentDocumentId]);

    useEffect(() => {
        // Save OCR results in user-specific storage
        const userId = JSON.parse(localStorage.getItem('user'))?.id || 'guest';
        const storageKey = `ocrResults_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(ocrResults));
    }, [ocrResults]);

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

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            await handleSelectedFile(file);
        }
    };

    const handleSelectedFile = async (file) => {
        setError(null);
        
        // Validate file is a PDF
        if (file.type !== 'application/pdf') {
            setError('Please select a PDF file');
            return;
        }
        
        const validation = validateFile(file);
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }
        
        setPdfFile(file);
        
        try {
            // Get PDF page count
            const pageCount = await getPdfPageCount(file);
            setPdfPageCount(pageCount);
        } catch (err) {
            console.error('Error processing PDF file:', err);
            setError('Error processing PDF file: ' + err.message);
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

    const handleUpload = async () => {
        if (!pdfFile) {
            setError('Please select a PDF file to upload');
            return;
        }

        setUploadProgress(0);
        setIsProcessing(true);
        setLoading(true);
        setOcrResult(null);
        setError(null);

        try {
            // First, try to process PDF on client-side for faster text extraction
            let pdfData = null;
            try {
                pdfData = await processPdfFile(pdfFile);
                setPdfPageCount(pdfData.pageCount);
                setPdfPages(pdfData.pages);
            } catch (err) {
                console.error('Error pre-processing PDF:', err);
                // Continue with server-side processing even if client-side fails
            }
            
            const formData = new FormData();
            formData.append("file", pdfFile);
            formData.append("mode", activeMode);
            formData.append("fileType", "pdf");

            // Get authentication token from localStorage
            const token = localStorage.getItem('token');
            const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

            // Determine which endpoint to use based on authentication
            const endpoint = token 
                ? "http://localhost:5000/api/ocr"  // Authenticated endpoint
                : "http://localhost:5000/api/public/ocr"; // Public endpoint

            const response = await axios.post(
                endpoint,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        ...authHeader
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            const newDocumentId = response.data.documentId || Date.now().toString();
            setCurrentDocumentId(newDocumentId);
            
            // Merge server OCR result with client-side PDF processing if available
            const resultData = {
                ...response.data,
                uploadTime: new Date().toISOString()
            };
            
            // If we have PDF pages and the server didn't return pages data
            if (pdfData && pdfData.pages && !response.data.pages) {
                resultData.pages = pdfData.pages;
                resultData.pageCount = pdfData.pageCount;
            }
            
            setOcrResult(resultData);
            setOcrResults(prev => ({
                ...prev,
                [newDocumentId]: resultData
            }));
            
            // Create new file info with Google Drive path (if available)
            const newFile = {
                id: newDocumentId,
                name: pdfFile.name,
                date: new Date().toISOString().split('T')[0],
                type: "pdf",
                mode: activeMode,
                resultId: newDocumentId,
                driveUrl: response.data.driveUrl || null
            };
            
            const updatedFiles = [newFile, ...uploadedFiles];
            setUploadedFiles(updatedFiles);
            
            // Save in user-specific storage
            const userId = JSON.parse(localStorage.getItem('user'))?.id || 'guest';
            const storageKey = `uploadedFiles_${userId}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedFiles));

            // Hide the upload form after successful processing
            setShowUpload(false);
            
        } catch (error) {
            console.error("Error processing OCR:", error);
            setError(error.response?.data?.error || "An error occurred while processing your PDF file. Please try again.");
            setOcrResult(null);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setUploadProgress(100);
                setTimeout(() => {
                    setIsProcessing(false);
                }, 500);
            }, 500);
        }
    };

    const handleNewUpload = () => {
        setPdfFile(null);
        setOcrResult(null);
        setError(null);
        setPdfPageCount(0);
        setPdfPages([]);
        setCurrentPdfPage(0);
        setShowUpload(true);
    };

    const handleExportResult = () => {
        setIsExportModalOpen(true);
    };

    const handleExportFormat = (format) => {
        if (!ocrResult) return;
        
        // If we're on a specific page, export just that page's text
        const content = ocrResult.pages && ocrResult.pages[currentPdfPage] 
            ? ocrResult.pages[currentPdfPage] 
            : ocrResult.text || ocrResult.markdown || "";
        
        const fileName = pdfFile?.name?.split('.').slice(0, -1).join('.') || "ocr-result";
        const pageLabel = ocrResult.pages && ocrResult.pages.length > 1 ? `-page${currentPdfPage + 1}` : "";
        const fullFileName = `${fileName}${pageLabel}`;
        
        if (format === 'txt') {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = `${fullFileName}.txt`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } 
        else if (format === 'docx' || format === 'pdf') {
            axios({
                url: `http://localhost:5000/export`,
                method: 'POST',
                data: { 
                    content: content,
                    format: format,
                    fileName: fullFileName
                },
                responseType: 'blob'
            })
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fullFileName}.${format}`;
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
        
        // Get text for current page or full document
        const textToEdit = ocrResult.pages && ocrResult.pages[currentPdfPage]
            ? ocrResult.pages[currentPdfPage]
            : ocrResult.text || ocrResult.markdown || "";
        
        setEditableText(textToEdit);
        setIsEditing(true);
    };

    const handleEditSave = () => {
        if (!ocrResult) return;
        
        // Update the specific page or full text
        if (ocrResult.pages && ocrResult.pages[currentPdfPage]) {
            const updatedPages = [...ocrResult.pages];
            updatedPages[currentPdfPage] = editableText;
            
            const updatedResult = { 
                ...ocrResult,
                pages: updatedPages,
                text: updatedPages.join('\n\n') // Update full text as well
            };
            
            setOcrResult(updatedResult);
            
            if (currentDocumentId) {
                setOcrResults(prev => ({
                    ...prev,
                    [currentDocumentId]: updatedResult
                }));
            }
        } else {
            // Update full document text
            const updatedResult = { ...ocrResult };
            if (ocrResult.text) {
                updatedResult.text = editableText;
            } else if (ocrResult.markdown) {
                updatedResult.markdown = editableText;
            }
            
            setOcrResult(updatedResult);
            
            if (currentDocumentId) {
                setOcrResults(prev => ({
                    ...prev,
                    [currentDocumentId]: updatedResult
                }));
            }
        }
        
        setIsEditing(false);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditableText("");
    };

    const handleEditChange = (e) => {
        setEditableText(e.target.value);
    };

    return (
        <div className="flex flex-col h-full">
            {showUpload ? (
                <div className="flex flex-col lg:flex-row gap-6 h-full">
                    <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF OCR
                        </h2>

                        <div className="flex-1 mb-4 overflow-auto">
                            {pdfFile && (
                                <div className="h-full">
                                    <PdfViewer 
                                        file={pdfFile} 
                                        scale={1.0}
                                        onPageChange={(page) => console.log(`Viewing page ${page + 1}`)}
                                    />
                                </div>
                            )}
                            
                            {!pdfFile && (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center text-gray-500 dark:text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-xl font-medium">No PDF Selected</p>
                                        <p className="mt-2">Upload a PDF document to extract text</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        <div 
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('pdf-file-input').click()}
                        >
                            <input 
                                id="pdf-file-input" 
                                type="file" 
                                accept="application/pdf" 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Drop your PDF here, or click to browse
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Upload PDF files up to 20MB
                            </p>
                        </div>

                        {pdfFile && (
                            <div className="mt-4">
                                <div className="mb-2 flex justify-between items-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">{pdfFile.name}</span>
                                        <span className="ml-2">({Math.round(pdfFile.size / 1024)} KB)</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                        onClick={() => setPdfFile(null)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                {pdfPageCount > 0 && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        <span className="font-medium">{pdfPageCount} page{pdfPageCount > 1 ? 's' : ''}</span>
                                    </div>
                                )}
                                <button 
                                    onClick={handleUpload}
                                    disabled={isProcessing || !pdfFile}
                                    className={`w-full flex items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                                        isProcessing || !pdfFile
                                            ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing... {uploadProgress}%
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Extract Text from PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    {ocrResult && (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    PDF OCR Results
                                </h2>
                                <button 
                                    onClick={handleNewUpload}
                                    className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    New PDF
                                </button>
                            </div>
                            <div className="flex-1">
                                <PdfResultViewer 
                                    ocrResult={ocrResult}
                                    pdfFile={pdfFile}
                                    handleEditStart={handleEditStart}
                                    isEditing={isEditing}
                                    editableText={editableText}
                                    handleEditChange={handleEditChange}
                                    handleEditSave={handleEditSave}
                                    handleEditCancel={handleEditCancel}
                                    currentPage={currentPdfPage}
                                    setCurrentPage={setCurrentPdfPage}
                                    onExport={handleExportResult}
                                />
                            </div>
                        </>
                    )}

                    {loading && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                                <p className="mt-4 text-gray-600 dark:text-gray-400">Processing your PDF...</p>
                                <div className="w-64 h-2 mt-4 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 transition-all duration-300" 
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">{uploadProgress}%</p>
                            </div>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-lg text-center dark:bg-red-900/20 dark:text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-lg font-semibold mb-2">Error Processing PDF</h3>
                                <p className="mb-4">{error}</p>
                                <button 
                                    onClick={handleNewUpload}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExportFormat}
                fileName={pdfFile?.name?.split('.').slice(0, -1).join('.') || "ocr-result"}
            />
        </div>
    );
}

export default PdfOcrPage; 