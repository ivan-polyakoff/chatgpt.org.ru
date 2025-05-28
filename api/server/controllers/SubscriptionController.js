const SubscriptionPlan = require('~/models/SubscriptionPlan');
const UserSubscription = require('~/models/UserSubscription');
const axios = require('axios');
const subscriptionConfig = require('../../config/subscriptionConfig');
const { getModelsForPlan } = subscriptionConfig;
const { expireSubscriptions } = require('../tasks/expireSubscriptions');

// Получить список всех тарифных планов
async function getPlans(req, res) {
  try {
    const plans = await SubscriptionPlan.find().lean();
    res.json({ success: true, plans });
  } catch (err) {
    console.error('getPlans error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Получить текущую подписку пользователя
async function getCurrentSubscription(req, res) {
  try {
    console.log('[SubscriptionController] Запрос подписки для пользователя:', req.user._id);
    
    // Сначала обновляем статусы истекших подписок
    try {
      await expireSubscriptions();
    } catch (expireError) {
      console.error('[SubscriptionController] Ошибка при обновлении истекших подписок:', expireError);
      // Продолжаем выполнение, так как это не критическая ошибка
    }
    
    const now = new Date();
    // Находим активную подписку пользователя
    const userSub = await UserSubscription.findOne({ 
      user: req.user._id,
      status: 'active',
      endDate: { $gt: now }, // Только активные и не истекшие подписки
    }).populate('plan').lean();
    
    if (!userSub) {
      console.log('[SubscriptionController] Активная подписка не найдена, возвращаем бесплатный тариф');
      
      // Проверяем, есть ли истекшие подписки
      const expiredSub = await UserSubscription.findOne({
        user: req.user._id,
        status: 'expired'
      }).populate('plan').lean();
      
      if (expiredSub) {
        console.log('[SubscriptionController] Найдена истекшая подписка:', expiredSub.plan.name);
      }
      
      // Если нет активной подписки, считаем что это бесплатный тариф FREE
      const allowedModels = getModelsForPlan('free');
      console.log('[SubscriptionController] Модели для бесплатного тарифа:', allowedModels);
      
      return res.json({ 
        success: true, 
        subscription: {
          plan: {
            key: 'free',
            name: 'Бесплатный тариф',
            allowedModels: allowedModels,
            modelDescriptions: {},
          },
          active: false,
          expired: !!expiredSub,
          expiredPlan: expiredSub ? expiredSub.plan.name : null,
        },
      });
    }
    
    console.log('[SubscriptionController] Найдена активная подписка:', userSub.plan.key);
    
    // Проверяем наличие allowedModels в плане
    if (!userSub.plan.allowedModels) {
      userSub.plan.allowedModels = [];
    }
    
    console.log('[SubscriptionController] Доступные модели в БД:', userSub.plan.allowedModels);
    
    // Дополнительная обработка: если массив моделей пуст, 
    // используем модели из нашей конфигурации
    let modifiedUserSub = { ...userSub };
    
    if (!userSub.plan.allowedModels || userSub.plan.allowedModels.length === 0) {
      console.log('[SubscriptionController] Модели не найдены в плане, используем конфигурацию');
      
      // Получаем модели из конфигурации по типу тарифа
      const planKey = userSub.plan.key;
      const envModels = getModelsForPlan(planKey);
      
      // Устанавливаем модели из конфигурации
      modifiedUserSub.plan = { 
        ...modifiedUserSub.plan,
        allowedModels: envModels 
      };
      
      // Обновляем модели в базе данных
      try {
        await SubscriptionPlan.findByIdAndUpdate(
          userSub.plan._id,
          { $set: { allowedModels: envModels } }
        );
        console.log('[SubscriptionController] Обновлены модели в БД для плана:', planKey);
      } catch (dbErr) {
        console.error('[SubscriptionController] Ошибка обновления моделей в БД:', dbErr);
      }
      
      console.log('[SubscriptionController] Установлены модели из конфигурации:', envModels);
    }
    
    // Убеждаемся что описания моделей включены в ответ
    if (!modifiedUserSub.plan.modelDescriptions) {
      modifiedUserSub.plan.modelDescriptions = {};
    }
    
    // Проверяем сколько времени осталось до истечения
    const timeLeft = userSub.endDate - now;
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    
    console.log('[SubscriptionController] Отправляем клиенту подписку с моделями:', 
      modifiedUserSub.plan.allowedModels);
    console.log('[SubscriptionController] Дней до истечения:', daysLeft);
    
    res.json({ 
      success: true, 
      subscription: { 
        ...modifiedUserSub,
        active: true,
        daysLeft: daysLeft,
        expired: false,
      },
    });
  } catch (err) {
    console.error('[SubscriptionController] Ошибка получения подписки:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Инициировать платёж для выбранного тарифа
async function subscribe(req, res) {
  const { planKey } = req.body;
  if (!planKey) {
    return res.status(400).json({ success: false, message: 'planKey is required' });
  }
  try {
    const plan = await SubscriptionPlan.findOne({ key: planKey }).lean();
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    // Вызываем эндпоинт create-payment с передачей planKey для покупки подписки
    const response = await axios.post(
      `${req.protocol}://${req.get('host')}/api/transactions/create-payment`,
      { planKey },
      { headers: { Authorization: req.headers.authorization } },
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    res.json({
      success: true,
      paymentUrl: response.data.paymentUrl,
      operationId: response.data.operationId,
      useWebhooks: response.data.useWebhooks,
    });
  } catch (err) {
    console.error('subscribe error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}

// Подтвердить платёж и создать/обновить подписку пользователя
async function confirmSubscription(req, res) {
  const { operationId, planKey } = req.body;
  if (!operationId || !planKey) {
    return res.status(400).json({ success: false, message: 'operationId and planKey are required' });
  }
  try {
    // Проверяем статус оплаты
    const payResp = await axios.get(
      `${req.protocol}://${req.get('host')}/api/transactions/payment-status`,
      { params: { operationId }, headers: { Authorization: req.headers.authorization } },
    );
    if (!payResp.data.success) {
      return res.status(400).json({ success: false, message: 'Payment status error' });
    }
    const op = payResp.data.data;
    if (op.status !== 'APPROVED') {
      return res.status(400).json({ success: false, message: `Payment not approved: ${op.status}`, status: op.status });
    }
    // Получаем информацию о плане
    const plan = await SubscriptionPlan.findOne({ key: planKey });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    // Обновляем модели в плане, если они отсутствуют
    if (!plan.allowedModels || plan.allowedModels.length === 0) {
      console.log('[SubscriptionController] Обновляем модели для плана', planKey);
      const envModels = getModelsForPlan(planKey);
      
      plan.allowedModels = envModels;
      await plan.save();
      
      console.log('[SubscriptionController] Модели для плана обновлены:', envModels);
    }
    
    // Рассчитываем даты подписки
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    // Создаём или обновляем подписку пользователя
    let userSub = await UserSubscription.findOne({ user: req.user._id });
    const remainingMessages = plan.messageLimit;
    if (userSub && userSub.endDate > now) {
      userSub.plan = plan._id;
      userSub.startDate = now;
      userSub.endDate = endDate;
      userSub.remainingMessages = remainingMessages;
      userSub.status = 'active';
    } else {
      userSub = new UserSubscription({
        user: req.user._id,
        plan: plan._id,
        startDate: now,
        endDate,
        remainingMessages,
        status: 'active',
      });
    }
    await userSub.save();
    res.json({ success: true, subscription: userSub });
  } catch (err) {
    console.error('confirmSubscription error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}

module.exports = {
  getPlans,
  getCurrentSubscription,
  subscribe,
  confirmSubscription,
}; 