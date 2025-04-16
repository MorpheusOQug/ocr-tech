const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testExport() {
  console.log('Testing export functionality...');
  
  const content = `# OCR Result Test
  
## Introduction
This is a sample OCR result to test exporting functionality.

### Text Recognition
The text recognition worked **perfectly** and extracted all content from the image.

- Item 1
- Item 2
- Item 3

Plain paragraph with normal text. This is a test document generated to verify the export functions work correctly.`;

  // Test DOCX Export
  try {
    console.log('Testing DOCX export...');
    console.log('Sending request to http://localhost:5000/export');
    const docxResponse = await axios({
      url: 'http://localhost:5000/export',
      method: 'POST',
      data: {
        content,
        format: 'docx',
        fileName: 'test-export'
      },
      responseType: 'arraybuffer',
      timeout: 10000 // 10 second timeout
    });
    
    fs.writeFileSync(path.join(__dirname, 'test-export.docx'), docxResponse.data);
    console.log('✅ DOCX export successful! File saved as test-export.docx');
  } catch (error) {
    console.error('❌ DOCX export failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Server may not be running.');
    }
  }
  
  // Try the Node.js default port in case we're using that instead
  try {
    console.log('\nTrying on port 8000 instead...');
    const docxResponse = await axios({
      url: 'http://localhost:8000/export',
      method: 'POST',
      data: {
        content,
        format: 'docx',
        fileName: 'test-export'
      },
      responseType: 'arraybuffer',
      timeout: 10000 // 10 second timeout
    });
    
    fs.writeFileSync(path.join(__dirname, 'test-export.docx'), docxResponse.data);
    console.log('✅ DOCX export successful on port 8000! File saved as test-export.docx');
  } catch (error) {
    console.error('❌ DOCX export on port 8000 failed:', error.message);
  }
  
  // Test PDF Export
  try {
    console.log('Testing PDF export...');
    const pdfResponse = await axios({
      url: 'http://localhost:5000/export',
      method: 'POST',
      data: {
        content,
        format: 'pdf',
        fileName: 'test-export'
      },
      responseType: 'arraybuffer'
    });
    
    fs.writeFileSync(path.join(__dirname, 'test-export.pdf'), pdfResponse.data);
    console.log('✅ PDF export successful! File saved as test-export.pdf');
  } catch (error) {
    console.error('❌ PDF export failed:', error.message);
  }
}

testExport().catch(console.error); 