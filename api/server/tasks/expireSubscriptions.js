const mongoose = require('mongoose');
const UserSubscription = require('../../models/UserSubscription');
const { logger } = require('../../config');

/**
 * Задача для обновления статуса истекших подписок
 */
async function expireSubscriptions() {
  try {
    const now = new Date();
    
    // Находим все активные подписки, у которых истек срок действия
    const expiredSubscriptions = await UserSubscription.find({
      status: 'active',
      endDate: { $lt: now },
    });

    if (expiredSubscriptions.length === 0) {
      logger.info('[ExpireSubscriptions] Нет истекших подписок для обновления');
      return { expired: 0 };
    }

    // Обновляем статус на 'expired'
    const result = await UserSubscription.updateMany(
      {
        status: 'active',
        endDate: { $lt: now },
      },
      {
        $set: { status: 'expired' },
      }
    );

    logger.info(`[ExpireSubscriptions] Обновлено статусов истекших подписок: ${result.modifiedCount}`);
    
    // Логируем детали истекших подписок
    for (const sub of expiredSubscriptions) {
      await sub.populate('user plan');
      logger.info(`[ExpireSubscriptions] Истекла подписка: ${sub.user.email} - план ${sub.plan.name}, истек ${sub.endDate.toISOString()}`);
    }

    return { expired: result.modifiedCount };
    
  } catch (error) {
    logger.error('[ExpireSubscriptions] Ошибка при обновлении истекших подписок:', error);
    throw error;
  }
}

/**
 * Запуск задачи как standalone скрипт
 */
async function runAsScript() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, { bufferCommands: false });
      console.log('[ExpireSubscriptions] Подключение к MongoDB установлено');
    }

    const result = await expireSubscriptions();
    console.log(`[ExpireSubscriptions] Задача завершена. Обновлено подписок: ${result.expired}`);
    
    if (process.argv.includes('--standalone')) {
      await mongoose.disconnect();
      process.exit(0);
    }
    
    return result;
  } catch (error) {
    console.error('[ExpireSubscriptions] Ошибка выполнения задачи:', error);
    if (process.argv.includes('--standalone')) {
      process.exit(1);
    }
    throw error;
  }
}

// Если скрипт запущен напрямую
if (require.main === module) {
  runAsScript();
}

module.exports = {
  expireSubscriptions,
  runAsScript,
}; 