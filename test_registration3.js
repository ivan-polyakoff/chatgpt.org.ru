const axios = require('axios');

async function testRegistration() {
  const userData = {
    email: 'shuttle.dee@gmail.com',
    password: 'TestPassword123\!',
    confirm_password: 'TestPassword123\!',
    name: 'Test User',
    username: 'shuttledee_test'
  };
  
  try {
    console.log('Attempting registration with:', userData.email);
    const response = await axios.post('http://localhost:3080/api/auth/register', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Registration success\!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Also monitor the mail log
console.log('\nStarting registration test and monitoring mail log...\n');
testRegistration();
