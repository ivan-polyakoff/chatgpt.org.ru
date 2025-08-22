const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * Extract text from PDF file
 * @param {string} filepath - Path to PDF file
 * @returns {Promise<{text: string, pages: number}>}
 */
async function extractPdfText(filepath) {
  try {
    const dataBuffer = fs.readFileSync(filepath);
    const data = await pdf(dataBuffer);
    
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

module.exports = { extractPdfText };
