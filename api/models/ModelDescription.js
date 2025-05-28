const mongoose = require('mongoose');
const { Schema } = mongoose;

const modelDescriptionSchema = new Schema({
  modelName: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
  },
  displayName: {
    type: String,
    trim: true,
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['gpt-4', 'gpt-3.5', 'claude', 'gemini', 'other'],
    default: 'other',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
}, { timestamps: true });

// Только один индекс для категории и активности
modelDescriptionSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.models.ModelDescription || mongoose.model('ModelDescription', modelDescriptionSchema); 