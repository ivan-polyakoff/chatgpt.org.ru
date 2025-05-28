const User = require('~/models/User');
const UserSubscription = require('~/models/UserSubscription');
const SubscriptionPlan = require('~/models/SubscriptionPlan');
const { sendEmail, checkEmailConfig } = require('~/server/utils');
const { logger } = require('~/config');

/**
 * Назначить подписку пользователю по email
 */
async function assignSubscription(req, res) {
  const { email, planKey, durationDays, forceAssign = true } = req.body;

  if (!email || !planKey) {
    return res.status(400).json({
      success: false,
      message: 'Не указаны обязательные параметры: email и planKey',
    });
  }

  try {
    // Находим пользователя по email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    // Находим план подписки
    const plan = await SubscriptionPlan.findOne({ key: planKey });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'План подписки не найден',
      });
    }

    // Рассчитываем дату окончания подписки
    const now = new Date();
    const endDate = new Date(now.getTime() + (durationDays || plan.durationDays) * 24 * 60 * 60 * 1000);

    // Находим текущую подписку пользователя
    let subscription = await UserSubscription.findOne({ user: user._id });
    let wasDowngrade = false;

    if (subscription) {
      // Проверяем, была ли это понижение тарифа
      const currentPlan = await SubscriptionPlan.findById(subscription.plan);
      if (currentPlan && currentPlan.price > plan.price) {
        wasDowngrade = true;
        logger.info(`[AdminSubscription] Понижение тарифа: ${currentPlan.name} -> ${plan.name} для ${email}`);
      }

      // Принудительно обновляем существующую подписку
      subscription.plan = plan._id;
      subscription.startDate = now;
      subscription.endDate = endDate;
      subscription.remainingMessages = plan.messageLimit;
      subscription.status = 'active';
      
      logger.info(`[AdminSubscription] Обновление подписки для ${email}: ${plan.name}`);
    } else {
      // Создаем новую подписку
      subscription = new UserSubscription({
        user: user._id,
        plan: plan._id,
        startDate: now,
        endDate,
        remainingMessages: plan.messageLimit,
        status: 'active',
      });
      
      logger.info(`[AdminSubscription] Создание новой подписки для ${email}: ${plan.name}`);
    }

    await subscription.save();

    // Отправляем email уведомление (опционально)
    let emailSent = false;
    if (checkEmailConfig()) {
      try {
        await sendEmail({
          email: user.email,
          subject: wasDowngrade ? 'Ваша подписка изменена' : 'Вам назначена подписка',
          payload: {
            appName: process.env.APP_TITLE || 'LibreChat',
            name: user.name || user.username || user.email,
            planName: plan.name,
            durationDays: durationDays || plan.durationDays,
            year: new Date().getFullYear(),
            wasDowngrade,
          },
          template: 'assignSubscription.handlebars',
        });
        emailSent = true;
        logger.info(`[AdminSubscription] Email уведомление отправлено на ${user.email}`);
      } catch (emailError) {
        logger.error('[AdminSubscription] Ошибка отправки email:', emailError);
        // Не прерываем выполнение, если отправка email не удалась
      }
    }

    const statusMessage = wasDowngrade 
      ? `Тариф изменен на "${plan.name}" для пользователя ${email}` 
      : `Подписка "${plan.name}" успешно назначена пользователю ${email}`;

    return res.json({
      success: true,
      message: statusMessage + (!emailSent ? ' (уведомление на email не отправлено)' : ''),
      subscription: {
        ...subscription.toObject(),
        plan: plan.toObject(),
      },
      emailSent,
      wasDowngrade,
    });
  } catch (error) {
    logger.error('[AdminSubscription] Ошибка назначения подписки:', error);
    return res.status(500).json({
      success: false,
      message: 'Произошла ошибка при назначении подписки',
    });
  }
}

module.exports = {
  assignSubscription,
};