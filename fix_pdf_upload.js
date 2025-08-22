const fs = require('fs');

// Read the file
let content = fs.readFileSync('api/server/services/Files/VectorDB/crud.js', 'utf8');

// Add PDF extraction import at the top
const importStatement = "const { extractPdfText } = require('../pdfExtractor');";
if (\!content.includes('extractPdfText')) {
  const formDataIndex = content.indexOf("const FormData = require('form-data');");
  if (formDataIndex \!== -1) {
    const endOfLine = content.indexOf('\n', formDataIndex);
    content = content.slice(0, endOfLine + 1) + importStatement + '\n' + content.slice(endOfLine + 1);
  }
}

// Find and update the return statement in uploadVectors
const pattern = /return { filepath: file\.path, bytes: file\.size \|\| 0 };/;
const replacement = ;

content = content.replace(pattern, replacement);

// Write back
fs.writeFileSync('api/server/services/Files/VectorDB/crud.js', content);
console.log('Updated PDF handling');
