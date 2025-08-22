const path = require('path');
require('dotenv').config();
const mongoose = require('./api/models/mongoose');
const User = require('./api/models/User');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/librechat');
    
    const user = await User.findOne({ email: 'shuttle.dee@gmail.com' })
      .select('email username name role emailVerified createdAt')
      .lean();
    
    if (user) {
      console.log('User found:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('User not found with email: shuttle.dee@gmail.com');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUser();
