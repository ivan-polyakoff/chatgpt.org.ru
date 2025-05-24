const User = require('~/models/User');
const UserSubscription = require('~/models/UserSubscription');
const SubscriptionPlan = require('~/models/SubscriptionPlan');
const { sendEmail, checkEmailConfig } = require('~/server/utils');
const { logger } = require('~/config');

/**
 * Назначить подписку пользователю по email
 */
async function assignSubscription(req, res) {
  const { email, planKey, durationDays } = req.body;

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

    // Находим текущую подписку пользователя или создаем новую
    let subscription = await UserSubscription.findOne({ user: user._id });

    if (subscription) {
      // Обновляем существующую подписку
      subscription.plan = plan._id;
      subscription.startDate = now;
      subscription.endDate = endDate;
      subscription.remainingMessages = plan.messageLimit;
      subscription.status = 'active';
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
    }

    await subscription.save();

    // Отправляем email уведомление (опционально)
    let emailSent = false;
    if (checkEmailConfig()) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Вам назначена подписка',
          payload: {
            appName: process.env.APP_TITLE || 'LibreChat',
            name: user.name || user.username || user.email,
            planName: plan.name,
            durationDays: plan.durationDays,
            year: new Date().getFullYear(),
          },
          template: 'assignSubscription.handlebars',
        });
        emailSent = true;
        console.log(`Email notification sent to ${user.email} about subscription assignment`);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Не прерываем выполнение, если отправка email не удалась
      }
    }

    return res.json({
      success: true,
      message: `Подписка "${plan.name}" успешно назначена пользователю ${email}${!emailSent ? ' (уведомление на email не отправлено)' : ''}`,
      subscription: {
        ...subscription.toObject(),
        plan: plan.toObject(),
      },
      emailSent,
    });
  } catch (error) {
    console.error('Error assigning subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'Произошла ошибка при назначении подписки',
    });
  }
}

module.exports = {
  assignSubscription,
};