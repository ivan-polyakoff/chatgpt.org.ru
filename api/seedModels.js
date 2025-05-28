const mongoose = require('mongoose');
const seedModelDescriptions = require('./data/migrations/seedModelDescriptions');
require('dotenv').config();

async function seedModels() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    await seedModelDescriptions();
    console.log('Migration completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

seedModels(); 