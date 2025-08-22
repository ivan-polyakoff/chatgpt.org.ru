const fs = require('fs');

// Read the file
let content = fs.readFileSync('api/app/clients/OpenAIClient.js', 'utf8');

// Replace the hardcoded URL with environment variable
content = content.replace(
  "const apiUrl = 'https://forgetapi.ru/v1/images/generations';",
  "const apiUrl = process.env.IMAGE_API_BASE_URL || 'https://api.navy/v1/images/generations';"
);

// Replace the model name
content = content.replace(
  'model: "gpt-image-1"',
  'model: "dall-e-3"'
);

// Write back
fs.writeFileSync('api/app/clients/OpenAIClient.js', content);
console.log('Fixed image generation API URL and model');
