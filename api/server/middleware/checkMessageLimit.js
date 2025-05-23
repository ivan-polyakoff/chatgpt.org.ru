const MessageUsage = require('~/models/MessageUsage');
const UserSubscription = require('~/models/UserSubscription');
const { getMessageLimit, isUnlimitedPlan } = require('~/config/messageLimits');
const { logger } = require('~/config');

/**
 * Middleware для проверки лимита сообщений пользователя
 */
async function checkMessageLimit(req, res, next) {
  try {
    const userId = req.user._id || req.user.id;
    const now = new Date();
    
    console.log(`[checkMessageLimit] Проверка лимита для пользователя: ${userId}`);
    
    // Получаем текущую подписку пользователя
    const userSubscription = await UserSubscription.findOne({ 
      user: userId,
      endDate: { $gt: now }
    }).populate('plan').lean();
    
    // Определяем тариф пользователя
    const planKey = userSubscription?.plan?.key || 'free';
    const messageLimit = getMessageLimit(planKey);
    
    console.log(`[checkMessageLimit] План пользователя: ${planKey}, лимит: ${messageLimit}`);
    
    // Если план безлимитный, пропускаем проверку
    if (isUnlimitedPlan(planKey)) {
      console.log(`[checkMessageLimit] Безлимитный план, пропускаем проверку`);
      return next();
    }
    
    // Получаем или создаем запись использования
    let messageUsage = await MessageUsage.findOne({ user: userId, planKey });
    
    if (!messageUsage) {
      // Создаем новую запись
      messageUsage = new MessageUsage({
        user: userId,
        planKey,
        messagesCount: 0,
        resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
      });
      await messageUsage.save();
      console.log(`[checkMessageLimit] Создана новая запись использования`);
    }
    
    // Проверяем, нужно ли сбросить счетчик
    if (now >= messageUsage.resetDate) {
      messageUsage.messagesCount = 0;
      messageUsage.resetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await messageUsage.save();
      console.log(`[checkMessageLimit] Счетчик сброшен`);
    }
    
    // Проверяем лимит
    if (messageUsage.messagesCount >= messageLimit) {
      const hoursUntilReset = Math.ceil((messageUsage.resetDate - now) / (1000 * 60 * 60));
      
      console.log(`[checkMessageLimit] Лимит превышен: ${messageUsage.messagesCount}/${messageLimit}`);
      
      // Отправляем ошибку в формате JSON для SSE
      return res.status(429).json({
        error: 'MESSAGE_LIMIT_EXCEEDED',
        message: `Вы достигли лимита сообщений для тарифа "${planKey}". Лимит сбросится через ${hoursUntilReset} час(ов).`,
        limit: messageLimit,
        used: messageUsage.messagesCount,
        resetIn: hoursUntilReset,
        planKey: planKey,
        conversationId: req.body.conversationId || null
      });
    }
    
    // Увеличиваем счетчик сообщений
    messageUsage.messagesCount += 1;
    messageUsage.lastMessageDate = now;
    await messageUsage.save();
    
    console.log(`[checkMessageLimit] Сообщение разрешено: ${messageUsage.messagesCount}/${messageLimit}`);
    
    next();
  } catch (error) {
    logger.error('[checkMessageLimit] Ошибка:', error);
    next(); // В случае ошибки пропускаем проверку
  }
}

module.exports = checkMessageLimit; 