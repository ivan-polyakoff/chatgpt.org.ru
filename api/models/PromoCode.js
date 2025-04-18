const mongoose = require('mongoose');
const { Schema } = mongoose;

// Модель промокодов для управления скидками
const promoCodeSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercent: { type: Number, required: true },
  maxUses: { type: Number, required: true },
  usesCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.models.PromoCode || mongoose.model('PromoCode', promoCodeSchema); 