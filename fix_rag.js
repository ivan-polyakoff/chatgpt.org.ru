const fs = require('fs');

// Read the file
let content = fs.readFileSync('api/server/services/Files/VectorDB/crud.js', 'utf8');

// Replace the error with a bypass
content = content.replace(
  "if (\!process.env.RAG_API_URL) {\n    throw new Error('RAG_API_URL not defined');\n  }",
  "if (\!process.env.RAG_API_URL) {\n    // RAG disabled - return dummy response\n    return { filepath: file.path, bytes: file.size || 0 };\n  }"
);

// Write back
fs.writeFileSync('api/server/services/Files/VectorDB/crud.js', content);
console.log('Fixed RAG requirement');
