import React, { useState, useRef, useEffect } from 'react';
import PdfViewer from './PdfViewer';

const PdfResultViewer = ({ 
  ocrResult, 
  pdfFile, 
  handleEditStart, 
  isEditing, 
  editableText, 
  handleEditChange, 
  handleEditSave, 
  handleEditCancel,
  currentPage,
  setCurrentPage
}) => {
  const [viewMode, setViewMode] = useState('split'); // 'split', 'pdf', or 'text'
  const resultBoxRef = useRef(null);
  
  // Use currentPage from parent or local state as fallback
  const currentPageIndex = currentPage !== undefined ? currentPage : 0;
  
  // Check if we have multiple pages in the result
  const isMultiPage = ocrResult?.pages && ocrResult.pages.length > 1;
  const pageTexts = ocrResult?.pages || [];
  const currentText = pageTexts[currentPageIndex] || ocrResult?.text || '';
  
  // For PDF preview
  const previewUrl = pdfFile instanceof File 
    ? URL.createObjectURL(pdfFile) 
    : (typeof pdfFile === 'string' ? pdfFile : null);
  
  // Clean up URL object to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfFile instanceof File && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [pdfFile, previewUrl]);

  // Sync page changes between PDF view and OCR text
  const handlePageChange = (newPageIndex) => {
    if (newPageIndex >= 0 && newPageIndex < (pageTexts.length || 1)) {
      if (setCurrentPage) {
        setCurrentPage(newPageIndex);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* View Mode Tabs */}
      <div className="flex mb-4">
        <button 
          className={`px-4 py-2 font-medium ${
            viewMode === 'split' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          } rounded-l-lg`}
          onClick={() => setViewMode('split')}
        >
          Split View
        </button>
        <button 
          className={`px-4 py-2 font-medium ${
            viewMode === 'pdf' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          onClick={() => setViewMode('pdf')}
        >
          PDF Only
        </button>
        <button 
          className={`px-4 py-2 font-medium ${
            viewMode === 'text' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          } rounded-r-lg`}
          onClick={() => setViewMode('text')}
        >
          Text Only
        </button>
      </div>

      <div className={`flex ${viewMode === 'split' ? 'flex-col md:flex-row' : 'flex-col'} h-full gap-4`}>
        {/* PDF Viewer Area */}
        {(viewMode === 'split' || viewMode === 'pdf') && previewUrl && (
          <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} h-[450px] border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-lg`}>
            <div className="h-full">
              <PdfViewer 
                file={previewUrl} 
                scale={1.0}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}

        {/* OCR Result Display */}
        {(viewMode === 'split' || viewMode === 'text') && (
          <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} flex flex-col h-[450px] bg-white dark:bg-gray-800 rounded-lg shadow-lg`}>
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">OCR Result</h3>
                <div className="flex space-x-2">
                  {isMultiPage && (
                    <div className="flex items-center space-x-2 mr-4">
                      <button 
                        onClick={() => handlePageChange(currentPageIndex - 1)}
                        disabled={currentPageIndex === 0}
                        className={`p-1 rounded ${
                          currentPageIndex === 0 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Page {currentPageIndex + 1} of {pageTexts.length}
                      </span>
                      <button 
                        onClick={() => handlePageChange(currentPageIndex + 1)}
                        disabled={currentPageIndex === pageTexts.length - 1}
                        className={`p-1 rounded ${
                          currentPageIndex === pageTexts.length - 1 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {!isEditing ? (
                    <button 
                      onClick={handleEditStart}
                      className="py-1 px-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button 
                        onClick={handleEditSave}
                        className="py-1 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save
                      </button>
                      <button 
                        onClick={handleEditCancel}
                        className="py-1 px-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors flex items-center text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div 
              ref={resultBoxRef}
              className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 overflow-auto"
            >
              {isEditing ? (
                <textarea
                  className="w-full h-full p-2 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editableText}
                  onChange={handleEditChange}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-mono text-sm">
                  {currentText}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfResultViewer; 