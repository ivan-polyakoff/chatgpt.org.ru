const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    remainingMessages: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    paymentInfo: {
      operationId: String,
      paymentMethod: String,
      amount: Number,
    },
  },
  { timestamps: true }
);

// Индекс для более быстрого поиска активных подписок пользователя
UserSubscriptionSchema.index({ user: 1, endDate: 1 });

module.exports = mongoose.model('UserSubscription', UserSubscriptionSchema); 