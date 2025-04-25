const UserSubscription = require('~/models/UserSubscription');
const SubscriptionPlan = require('~/models/SubscriptionPlan');

async function checkSubscription(req, res, next) {
  try {
    const userId = req.user._id;
    const userSub = await UserSubscription.findOne({ user: userId });
    if (!userSub) {
      return res.status(402).json({ error: 'У вас нет активной подписки, пожалуйста, приобретите тариф.' });
    }
    const now = new Date();
    if (userSub.endDate < now) {
      return res.status(402).json({ error: 'Срок действия подписки истёк, пожалуйста, продлите её.' });
    }
    // Проверяем лимит сообщений
    if (userSub.remainingMessages <= 0) {
      return res.status(429).json({ error: 'Достигнут лимит сообщений для вашего тарифа.' });
    }
    // Проверяем модель
    const { model } = req.body;
    if (model) {
      const plan = await SubscriptionPlan.findById(userSub.plan).lean();
      if (plan.allowedModels && plan.allowedModels.length > 0 && !plan.allowedModels.includes(model)) {
        return res.status(403).json({ error: 'Ваш тарифный план не поддерживает выбранную модель.' });
      }
    }
    // Сохраняем подписку для дальнейшего использования
    req.userSubscription = userSub;
    next();
  } catch (err) {
    console.error('checkSubscription error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = checkSubscription; 