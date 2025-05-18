import React, { useState, useEffect, useRef } from 'react';

const PdfViewer = ({ file, scale = 1.0, onPageChange }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdf, setPdf] = useState(null);
  
  const canvasRef = useRef(null);

  // Load the PDF document when file changes
  useEffect(() => {
    if (!file) return;
    
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        if (!window.pdfjsLib) {
          throw new Error('PDF.js library not loaded. Check your internet connection.');
        }
        
        const loadingTask = window.pdfjsLib.getDocument(file);
        const pdfDocument = await loadingTask.promise;
        
        setPdf(pdfDocument);
        setNumPages(pdfDocument.numPages);
        setCurrentPage(1); // Reset to first page when loading new document
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadPdf();

    // Cleanup on unmount or when file changes
    return () => {
      if (pdf) {
        pdf.destroy();
        setPdf(null);
      }
    };
  }, [file, pdf]);

  // Render the current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      setLoading(true);
      try {
        const page = await pdf.getPage(currentPage);
        
        // Scale the viewport to fit the canvas
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render the page content
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering PDF page:', err);
        setError('Failed to render PDF page');
      } finally {
        setLoading(false);
      }
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  // Notify parent component when page changes
  useEffect(() => {
    if (onPageChange && currentPage > 0 && numPages > 0) {
      // Convert 1-based page index to 0-based for consistency with array indices
      onPageChange(currentPage - 1);
    }
  }, [currentPage, numPages, onPageChange]);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="pdf-viewer flex flex-col items-center h-full">
      <div className="relative flex-1 w-full overflow-auto">
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-80 z-10 dark:bg-gray-800 dark:bg-opacity-80">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="text-red-500 p-4 bg-red-50 rounded-lg dark:bg-red-900/20 max-w-md text-center">
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-2">Try refreshing the page or check if the PDF is valid.</p>
            </div>
          </div>
        )}
        
        <div className="min-h-0 h-full flex items-center justify-center overflow-auto">
          <canvas ref={canvasRef} className="max-w-full max-h-full" />
        </div>
      </div>
      
      {numPages > 1 && (
        <div className="flex justify-between items-center w-full p-2 border-t dark:border-gray-700">
          <button 
            onClick={goToPreviousPage} 
            disabled={currentPage <= 1}
            className={`px-3 py-1 rounded-lg ${currentPage <= 1 ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            Previous
          </button>
          
          <div className="text-center">
            <span className="text-gray-700 dark:text-gray-300 text-sm">
              Page {currentPage} of {numPages}
            </span>
          </div>
          
          <button 
            onClick={goToNextPage} 
            disabled={currentPage >= numPages}
            className={`px-3 py-1 rounded-lg ${currentPage >= numPages ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer; 