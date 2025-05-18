// PDF.js is loaded globally via CDN in index.html

/**
 * Load a PDF document from a file
 * @param {File|string} file - File object or URL of the PDF
 * @returns {Promise<Object>} - PDF document object
 */
export const loadPdfDocument = async (file) => {
  try {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded. Check your internet connection.');
    }
    
    let fileData;

    if (file instanceof File) {
      // If file is a File object, convert to ArrayBuffer
      fileData = await file.arrayBuffer();
    } else {
      // Otherwise, assume it's a URL or data URL
      fileData = file;
    }

    const loadingTask = window.pdfjsLib.getDocument(fileData);
    return await loadingTask.promise;
  } catch (error) {
    console.error('Error loading PDF document:', error);
    throw new Error('Failed to load PDF document: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Extract text content from a PDF page
 * @param {Object} page - PDF.js page object
 * @returns {Promise<string>} - Text content of the page
 */
export const extractTextFromPage = async (page) => {
  try {
    const textContent = await page.getTextContent();
    
    // Concatenate text items with proper spacing
    const text = textContent.items
      .map(item => item.str)
      .join(' ');
    
    return text;
  } catch (error) {
    console.error('Error extracting text from page:', error);
    throw new Error('Failed to extract text from page');
  }
};

/**
 * Extract text from all pages of a PDF document
 * @param {Object} pdfDocument - PDF.js document object
 * @returns {Promise<Array<string>>} - Array of text content for each page
 */
export const extractTextFromPdf = async (pdfDocument) => {
  try {
    const numPages = pdfDocument.numPages;
    const pages = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const text = await extractTextFromPage(page);
      pages.push(text);
    }

    return pages;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Count the number of pages in a PDF document
 * @param {File|string} file - File object or URL of the PDF
 * @returns {Promise<number>} - Number of pages in the PDF
 */
export const getPdfPageCount = async (file) => {
  try {
    const pdfDocument = await loadPdfDocument(file);
    const pageCount = pdfDocument.numPages;
    return pageCount;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    throw new Error('Failed to get PDF page count');
  }
};

/**
 * Process a PDF file to extract text content from all pages
 * @param {File|string} file - File object or URL of the PDF
 * @returns {Promise<{text: string, pages: Array<string>}>} - Text content and array of page text
 */
export const processPdfFile = async (file) => {
  try {
    const pdfDocument = await loadPdfDocument(file);
    const pagesText = await extractTextFromPdf(pdfDocument);
    
    // Join all text for full document text
    const fullText = pagesText.join('\n\n');
    
    return {
      text: fullText,
      pages: pagesText,
      pageCount: pdfDocument.numPages
    };
  } catch (error) {
    console.error('Error processing PDF file:', error);
    throw new Error('Failed to process PDF file');
  }
}; 