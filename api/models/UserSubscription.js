const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSubscriptionSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  remainingMessages: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.models.UserSubscription || mongoose.model('UserSubscription', userSubscriptionSchema); 