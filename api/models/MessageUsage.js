const mongoose = require('mongoose');

const messageUsageSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  planKey: { 
    type: String, 
    required: true, 
    default: 'free' 
  },
  messagesCount: { 
    type: Number, 
    default: 0 
  },
  resetDate: { 
    type: Date, 
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа от создания
  },
  lastMessageDate: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  indexes: [
    { user: 1, planKey: 1 },
    { resetDate: 1 }
  ]
});

// Индекс для быстрого поиска по пользователю
messageUsageSchema.index({ user: 1 });

const MessageUsage = mongoose.model('MessageUsage', messageUsageSchema);

module.exports = MessageUsage; 