const axios = require('axios');

async function testRegistration() {
  const userData = {
    email: 'shuttle.dee@gmail.com',
    password: 'TestPassword123\!',
    name: 'Test User',
    username: 'shuttledee_test'
  };
  
  try {
    console.log('Attempting registration with:', userData.email);
    const response = await axios.post('http://localhost:3080/api/register', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Registration response:', response.data);
  } catch (error) {
    console.error('Registration failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testRegistration();
