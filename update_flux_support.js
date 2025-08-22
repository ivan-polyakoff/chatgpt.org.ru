const fs = require('fs');

// Read the file
let content = fs.readFileSync('api/app/clients/OpenAIClient.js', 'utf8');

// 1. Add isImageGenerationModel method after isDallE3Model
const isDallE3Method = content.indexOf('isDallE3Model() {');
const endOfMethod = content.indexOf('}', isDallE3Method) + 1;

const newMethod = '\n  \n  // Проверяем, является ли модель моделью генерации изображений\n  isImageGenerationModel() {\n    const model = this.modelOptions.model.toLowerCase();\n    return model === \'dall-e-3\' || model.includes(\'dall-e\') || model.includes(\'flux\');\n  }';

content = content.slice(0, endOfMethod) + newMethod + content.slice(endOfMethod);

// 2. Replace isDallE3Model() with isImageGenerationModel()
content = content.replace('if (this.isDallE3Model())', 'if (this.isImageGenerationModel())');

// 3. Update generateDallE3Image to handle flux models
content = content.replace('async generateDallE3Image(prompt) {', 'async generateImage(prompt) {');

// 4. Update method calls
content = content.replace('const imageResult = await this.generateDallE3Image(prompt);', 'const imageResult = await this.generateImage(prompt);');

// 5. Update model parameter based on actual model
content = content.replace('model: "dall-e-3",', 'model: this.modelOptions.model,');

// Write back
fs.writeFileSync('api/app/clients/OpenAIClient.js', content);
console.log('Updated flux support');
