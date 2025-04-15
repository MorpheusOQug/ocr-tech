import React from "react";

function FileUpload({ 
    image, 
    preview, 
    isProcessing, 
    uploadProgress, 
    handleDragOver, 
    handleDrop, 
    handleFileChange, 
    handleUpload, 
    setImage, 
    setPreview, 
    setError, 
    uploadedFiles,
    setActivePage
}) {
    return (
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
    );
}

export default FileUpload; 