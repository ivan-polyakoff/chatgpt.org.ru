require('dotenv').config();
console.log('\nEnvironment Models:');
console.log('FREE:', process.env.OPENAI_MODELS_FREE);
console.log('\nChecking for dall-e-3:');
const freeModels = process.env.OPENAI_MODELS_FREE.split(',');
console.log('dall-e-3 in FREE?', freeModels.includes('dall-e-3'));
console.log('\nAll FREE models:', freeModels);

// Check API
const axios = require('axios');
async function checkAPI() {
  try {
    const response = await axios.get('https://api.navy/v1/models', {
      headers: { 'Authorization': 'Bearer sk-navy-2M06ML24KqShucClMG30qINcNCK5ql8FuYBrPBZOQBY' }
    });
    const models = response.data.data.map(m => m.id);
    console.log('\ndall-e-3 in API?', models.includes('dall-e-3'));
    console.log('Total models from API:', models.length);
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

checkAPI();
