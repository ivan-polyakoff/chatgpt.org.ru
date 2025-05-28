const mongoose = require('mongoose');
const { Schema } = mongoose;

const subscriptionPlanSchema = new Schema({
  key: { type: String, required: true, unique: true }, // уникальный идентификатор плана
  name: { type: String, required: true },               // название плана
  price: { type: Number, required: true },              // стоимость в рублях
  durationDays: { type: Number, required: true },       // длительность плана в днях (0 для бессрочных)
  messageLimit: { type: Number, required: true },       // лимит сообщений за 24 часа (0 для неограниченных)
  allowedModels: { type: [String], required: true },    // доступные модели OpenAI
  modelDescriptions: { type: Map, of: String, default: {} }, // описания моделей
}, { timestamps: true });

module.exports = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema); 