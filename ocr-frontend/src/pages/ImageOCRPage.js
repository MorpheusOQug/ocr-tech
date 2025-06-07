import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useValidation } from "../context/ValidationContext";
import OCRResults from "../components/OCRResults";
import FileUpload from "../components/FileUpload";
import ExportModal from "../components/ExportModal";

function ImageOCRPage({ setUploadedFiles: updateUploadedFiles, setActivePage }) {
    const { user } = useAuth();
    const { validateFile } = useValidation();
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [ocrResult, setOcrResult] = useState(null);
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [serverStatus, setServerStatus] = useState("checking");
    const [activeMode, setActiveMode] = useState('text');
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableText, setEditableText] = useState("");
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [uploadedFiles, setLocalUploadedFiles] = useState(() => {
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
        const savedDocumentId = localStorage.getItem('currentDocumentId_image');
        return savedDocumentId || null;
    });
    const resultBoxRef = useRef(null);

    useEffect(() => {
        if (currentDocumentId && ocrResults[currentDocumentId]) {
            setOcrResult(ocrResults[currentDocumentId]);
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
            localStorage.setItem('currentDocumentId_image', currentDocumentId);
        }
    }, [currentDocumentId]);

    useEffect(() => {
        // Save OCR results in user-specific storage
        const userId = JSON.parse(localStorage.getItem('user'))?.id || 'guest';
        const storageKey = `ocrResults_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(ocrResults));
    }, [ocrResults]);

    useEffect(() => {
        if (resultBoxRef.current && ocrResult) {
            resultBoxRef.current.scrollTop = resultBoxRef.current.scrollHeight;
        }
    }, [ocrResult]);

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
        
        // Validate file is an image
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        
        const validation = validateFile(file);
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }
        
        setImage(file);
        
        // Generate preview for image files
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!image) {
            setError('Please select an image to upload');
            return;
        }

        setUploadProgress(0);
        setIsProcessing(true);
        setLoading(true);
        setOcrResult(null);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", image);
            formData.append("mode", activeMode);
            formData.append("fileType", "image");

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
            
            const resultData = {
                ...response.data,
                uploadTime: new Date().toISOString()
            };
            
            setOcrResult(resultData);
            setOcrResults(prev => ({
                ...prev,
                [newDocumentId]: resultData
            }));
            
            // Create new file info with Google Drive path (if available)
            const newFile = {
                id: newDocumentId,
                name: image.name,
                date: new Date().toISOString().split('T')[0],
                type: "image",
                mode: activeMode,
                resultId: newDocumentId,
                driveUrl: response.data.driveUrl || null
            };
            
            const updatedFiles = [newFile, ...uploadedFiles];
            setLocalUploadedFiles(updatedFiles);
            updateUploadedFiles(updatedFiles);
            
            // Save in user-specific storage
            const userId = JSON.parse(localStorage.getItem('user'))?.id || 'guest';
            const storageKey = `uploadedFiles_${userId}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedFiles));
            
        } catch (error) {
            console.error("Error processing OCR:", error);
            setError(error.response?.data?.error || "An error occurred while processing your image. Please try again.");
            setOcrResult(null);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setUploadProgress(100);
                setTimeout(() => {
                    setIsProcessing(false);
                    // Automatically clear image and preview after successful processing
                    if (!error) {
                        setImage(null);
                        setPreview(null);
                    }
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
        setIsExportModalOpen(true);
    };

    const handleExportFormat = (format) => {
        if (!ocrResult) return;
        
        const content = ocrResult.text || ocrResult.markdown || "";
        const fileName = image?.name?.split('.').slice(0, -1).join('.') || "ocr-result";
        
        if (format === 'txt') {
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
            axios({
                url: `http://localhost:5000/export`,
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
        
        setEditableText(ocrResult.text || ocrResult.markdown || "");
        setIsEditing(true);
    };

    const handleEditSave = () => {
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
        <div className="flex flex-col lg:flex-row gap-6 h-full">
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
                fileType="image"
                acceptTypes=".jpg,.jpeg,.png,.bmp,.gif,.webp"
                title="Upload Image"
                description="Drop your image here, or click to browse"
                setActivePage={setActivePage}
            />

            <ExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExportFormat}
                fileName={image?.name?.split('.').slice(0, -1).join('.') || "ocr-result"}
            />
        </div>
    );
}

export default ImageOCRPage; 