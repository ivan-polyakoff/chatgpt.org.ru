require('dotenv').config();
const mongoose = require('mongoose');
const SubscriptionPlan = require('../../models/SubscriptionPlan');

async function seedSubscriptionPlans() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  await mongoose.connect(uri, { bufferCommands: false });

  const plans = [
    {
      key: 'free',
      name: 'Бесплатный',
      price: 0,
      durationDays: 0,
      messageLimit: 10,
      allowedModels: process.env.OPENAI_MODELS_FREE ? process.env.OPENAI_MODELS_FREE.split(',') : [],
    },
    {
      key: 'mini',
      name: 'Мини',
      price: 250,
      durationDays: 14,
      messageLimit: 100,
      allowedModels: process.env.OPENAI_MODELS_MINI ? process.env.OPENAI_MODELS_MINI.split(',') : [],
    },
    {
      key: 'standard',
      name: 'Стандартный',
      price: 500,
      durationDays: 30,
      messageLimit: 1000,
      allowedModels: process.env.OPENAI_MODELS_STANDARD ? process.env.OPENAI_MODELS_STANDARD.split(',') : [],
    },
    {
      key: 'pro',
      name: 'Pro',
      price: 1000,
      durationDays: 30,
      messageLimit: 0,
      allowedModels: process.env.OPENAI_MODELS_PRO ? process.env.OPENAI_MODELS_PRO.split(',') : [],
    },
  ];

  for (const plan of plans) {
    await SubscriptionPlan.findOneAndUpdate(
      { key: plan.key },
      { $set: plan },
      { upsert: true, new: true },
    );
  }

  console.log('Subscription plans seeded');
  await mongoose.disconnect();
  process.exit(0);
}

seedSubscriptionPlans().catch(err => {
  console.error('Seeding failed', err);
  process.exit(1);
}); 