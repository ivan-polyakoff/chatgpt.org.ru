const axios = require('axios');

async function testModelsAPI() {
  try {
    // Test direct API call
    const response = await axios.get('http://localhost:3080/api/models');
    
    console.log('\nOpenAI models returned by API:');
    if (response.data.openAI) {
      console.log('Total models:', response.data.openAI.length);
      console.log('\nSearching for dall-e-3:');
      const hasDallE = response.data.openAI.includes('dall-e-3');
      console.log('Has dall-e-3?', hasDallE);
      
      if (!hasDallE) {
        console.log('\nChecking for similar names:');
        response.data.openAI.forEach(model => {
          if (model.toLowerCase().includes('dall') || model.toLowerCase().includes('image')) {
            console.log(' -', model);
          }
        });
      }
      
      console.log('\nFirst 10 models:', response.data.openAI.slice(0, 10));
      console.log('\nLast 10 models:', response.data.openAI.slice(-10));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testModelsAPI();
