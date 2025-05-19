import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

const PdfViewer = ({ file, scale = 1.0, onPageChange }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdf, setPdf] = useState(null);
  
  const canvasRef = useRef(null);
  // Reference to track if a render operation is in progress
  const renderingRef = useRef(false);
  // Reference to store the current render task for cancellation
  const renderTaskRef = useRef(null);

  // Load the PDF document when file changes
  useEffect(() => {
    if (!file) return;
    
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        // Convert File object to ArrayBuffer
        let fileData;
        if (file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          fileData = { data: arrayBuffer };
        } else if (typeof file === 'string') {
          // For URL strings, check if it's a valid URL
          if (file.startsWith('blob:') || file.startsWith('http:') || file.startsWith('https:') || file.startsWith('data:')) {
            fileData = { url: file };
          } else {
            throw new Error(`Invalid URL format: ${file}`);
          }
        } else {
          fileData = file;
        }
        
        const loadingTask = pdfjsLib.getDocument(fileData);
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
      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      
      // Reset rendering flag
      renderingRef.current = false;
      
      setPdf((currentPdf) => {
        if (currentPdf) {
          currentPdf.destroy();
        }
        return null;
      });
    };
  }, [file]);

  // Render the current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      // If already rendering, cancel the previous render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      
      // Set rendering flag
      renderingRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
        const page = await pdf.getPage(currentPage);
        
        // Scale the viewport to fit the canvas
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        
        // Check if canvas is still available (component not unmounted)
        if (!canvas) {
          return;
        }
        
        const context = canvas.getContext('2d');
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Clear the canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render the page content
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // Store the render task for potential cancellation
        renderTaskRef.current = page.render(renderContext);
        
        // Wait for render to complete
        await renderTaskRef.current.promise;
        
        // Clear the reference after successful render
        renderTaskRef.current = null;
      } catch (err) {
        // Check for cancellation errors - they can have different formats
        const isCancelled = 
          (err.name === 'RenderingCancelledException') || 
          (err.message && err.message.includes('Rendering cancelled')) ||
          (err.type === 'canvas' && err.message && err.message.includes('cancelled'));
          
        if (!isCancelled) {
          console.error('Error rendering PDF page:', err);
          setError('Failed to render PDF page: ' + (err.message || 'Unknown error'));
        } else {
          console.log('Rendering was cancelled for page transition');
        }
      } finally {
        // Only update loading state if component is still mounted
        if (canvasRef.current) {
          setLoading(false);
          renderingRef.current = false;
        }
      }
    };

    // Use a small delay to avoid rapid successive renders
    const timerId = setTimeout(() => {
      renderPage();
    }, 50);

    return () => {
      clearTimeout(timerId);
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
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
            disabled={currentPage <= 1 || loading}
            className={`px-3 py-1 rounded-lg ${currentPage <= 1 || loading ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
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
            disabled={currentPage >= numPages || loading}
            className={`px-3 py-1 rounded-lg ${currentPage >= numPages || loading ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer; 