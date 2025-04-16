const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const PDFDocument = require('pdfkit');

/**
 * Simple markdown parser
 * @param {string} text - Markdown text
 * @returns {Array} - Parsed markdown elements
 */
function parseMarkdown(text) {
  const elements = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
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
    else if (line !== '') {
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
 * Generate a DOCX document
 * @param {string} content - Document content
 * @param {string} outputFile - Output file path
 */
async function generateDocx(content, outputFile) {
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

  // Generate buffer and save to file
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputFile, buffer);
}

/**
 * Generate a PDF document
 * @param {string} content - Document content
 * @param {string} outputFile - Output file path
 */
function generatePdf(content, outputFile) {
  return new Promise((resolve, reject) => {
    try {
      // Parse markdown content
      const elements = parseMarkdown(content);
      
      // Create PDF document
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(outputFile);
      
      // Pipe PDF to write stream
      doc.pipe(writeStream);
      
      // Setup completion handler
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      
      // Add content to the PDF
      let y = 50;
      const margin = 50;
      const pageHeight = 800;
      
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
                } else if (part) {
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

async function main() {
  try {
    // Get command line arguments
    const [, , contentFile, format, fileName] = process.argv;
    
    if (!contentFile || !format || !fileName) {
      console.error('Usage: node generate-document.js <contentFile> <format> <fileName>');
      process.exit(1);
    }
    
    // Read content from file
    const content = fs.readFileSync(contentFile, 'utf-8');
    const outputFile = `${fileName}.${format}`;
    
    // Generate document
    if (format === 'docx') {
      await generateDocx(content, outputFile);
    } else if (format === 'pdf') {
      await generatePdf(content, outputFile);
    } else {
      console.error(`Unsupported format: ${format}`);
      process.exit(1);
    }
    
    console.log(`Document generated: ${outputFile}`);
  } catch (error) {
    console.error('Error generating document:', error);
    process.exit(1);
  }
}

main(); 