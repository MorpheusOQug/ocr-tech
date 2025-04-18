import React from "react";
import ReactMarkdown from 'react-markdown';

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
    return (
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
        </div>
    );
}

export default OCRResults; 