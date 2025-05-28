const mongoose = require('mongoose');
const SubscriptionPlan = require('../../models/SubscriptionPlan');

async function addModelDescriptions() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  await mongoose.connect(uri, { bufferCommands: false });

  console.log('Добавление поля modelDescriptions в планы подписки...');

  try {
    // Обновляем все планы, добавляя пустое поле modelDescriptions если его нет
    const result = await SubscriptionPlan.updateMany(
      { modelDescriptions: { $exists: false } },
      { $set: { modelDescriptions: {} } }
    );

    console.log(`Обновлено планов: ${result.modifiedCount}`);
    console.log('Миграция завершена успешно');
  } catch (error) {
    console.error('Ошибка миграции:', error);
  }

  await mongoose.disconnect();
  process.exit(0);
}

addModelDescriptions().catch(err => {
  console.error('Миграция не удалась:', err);
  process.exit(1);
}); 