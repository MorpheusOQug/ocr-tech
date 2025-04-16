const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Simple markdown parser for PDF generation
 * @param {string} text - Markdown text
 * @returns {Array} - Parsed markdown elements
 */
function parseMarkdown(text) {
  const elements = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Headers
    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', content: line.slice(2) });
    } else if (line.startsWith('## ')) {
      elements.push({ type: 'h2', content: line.slice(3) });
    } else if (line.startsWith('### ')) {
      elements.push({ type: 'h3', content: line.slice(4) });
    } 
    // Bold text
    else if (line.includes('**')) {
      elements.push({ type: 'paragraph', content: line, hasBold: true });
    } 
    // Lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push({ type: 'listItem', content: line.slice(2) });
    }
    // Regular paragraph
    else if (line.trim() !== '') {
      elements.push({ type: 'paragraph', content: line });
    }
    // Empty line
    else {
      elements.push({ type: 'space' });
    }
  }
  
  return elements;
}

/**
 * Export content to a DOCX file
 * @param {string} content - The text content to export
 * @param {string} fileName - The file name without extension
 * @returns {Promise<Buffer>} - The DOCX file as a buffer
 */
async function exportToDocx(content, fileName) {
  // Parse markdown content
  const elements = parseMarkdown(content);
  
  // Create document children
  const children = elements.map(element => {
    switch (element.type) {
      case 'h1':
        return new Paragraph({
          text: element.content,
          heading: HeadingLevel.HEADING_1,
        });
      case 'h2':
        return new Paragraph({
          text: element.content,
          heading: HeadingLevel.HEADING_2,
        });
      case 'h3':
        return new Paragraph({
          text: element.content,
          heading: HeadingLevel.HEADING_3,
        });
      case 'listItem':
        return new Paragraph({
          text: element.content,
          bullet: { level: 0 },
        });
      case 'space':
        return new Paragraph({});
      case 'paragraph':
      default:
        if (element.hasBold) {
          const parts = element.content.split(/(\*\*.*?\*\*)/g);
          return new Paragraph({
            children: parts.map(part => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return new TextRun({
                  text: part.slice(2, -2),
                  bold: true,
                });
              }
              return new TextRun(part);
            }),
          });
        }
        return new Paragraph({ text: element.content });
    }
  });

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Export content to a PDF file
 * @param {string} content - The text content to export
 * @param {string} fileName - The file name without extension
 * @returns {Promise<Buffer>} - The PDF file as a buffer
 */
async function exportToPdf(content, fileName) {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument();
      const buffers = [];
      
      // Handle document data events
      doc.on('data', buffer => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      
      // Parse markdown content
      const elements = parseMarkdown(content);
      
      // Add content to the PDF
      let y = 50;
      const margin = 50;
      const pageHeight = 800;
      
      // Add title
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .text(fileName, margin, y);
      
      y += 30;
      
      // Process each element
      elements.forEach(element => {
        // Check if we need a new page
        if (y > pageHeight - 50) {
          doc.addPage();
          y = 50;
        }
        
        switch (element.type) {
          case 'h1':
            doc.font('Helvetica-Bold').fontSize(18);
            doc.text(element.content, margin, y);
            y += 25;
            break;
          case 'h2':
            doc.font('Helvetica-Bold').fontSize(16);
            doc.text(element.content, margin, y);
            y += 22;
            break;
          case 'h3':
            doc.font('Helvetica-Bold').fontSize(14);
            doc.text(element.content, margin, y);
            y += 20;
            break;
          case 'listItem':
            doc.font('Helvetica').fontSize(12);
            doc.text(`• ${element.content}`, margin + 10, y);
            y += 20;
            break;
          case 'space':
            y += 10;
            break;
          case 'paragraph':
          default:
            doc.font('Helvetica').fontSize(12);
            // Handle bold text by splitting it into parts
            if (element.hasBold) {
              const parts = element.content.split(/(\*\*.*?\*\*)/g);
              let xPos = margin;
              
              for (const part of parts) {
                if (part.startsWith('**') && part.endsWith('**')) {
                  doc.font('Helvetica-Bold');
                  const text = part.slice(2, -2);
                  const width = doc.widthOfString(text);
                  doc.text(text, xPos, y);
                  xPos += width;
                  doc.font('Helvetica');
                } else {
                  const width = doc.widthOfString(part);
                  doc.text(part, xPos, y);
                  xPos += width;
                }
              }
              y += 20;
            } else {
              doc.text(element.content, margin, y);
              y += 20;
            }
        }
      });
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handler for exporting content to different formats
 * @param {string} content - The text content to export
 * @param {string} format - The format to export to ('docx' or 'pdf')
 * @param {string} fileName - The file name without extension
 * @returns {Promise<{buffer: Buffer, mimetype: string}>} - The exported file data
 */
async function handleExport(content, format, fileName) {
  let buffer;
  let mimetype;
  
  try {
    if (format === 'docx') {
      buffer = await exportToDocx(content, fileName);
      mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (format === 'pdf') {
      buffer = await exportToPdf(content, fileName);
      mimetype = 'application/pdf';
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
    
    return { buffer, mimetype };
  } catch (error) {
    console.error(`Error exporting to ${format}:`, error);
    throw error;
  }
}

module.exports = { handleExport }; 