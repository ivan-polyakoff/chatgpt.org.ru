const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('modeldescriptions');
    
    // Показываем все текущие индексы
    const indexes = await collection.indexes();
    console.log('Текущие индексы:', JSON.stringify(indexes, null, 2));
    
    // Удаляем проблемный индекс если он есть
    try {
      await collection.dropIndex('modelId_1');
      console.log('Удален старый индекс modelId_1');
    } catch (e) {
      console.log('Индекс modelId_1 не найден (это нормально)');
    }
    
    // Удаляем всю коллекцию для чистого старта
    try {
      await collection.drop();
      console.log('Коллекция очищена');
    } catch (e) {
      console.log('Коллекция уже пуста');
    }
    
    console.log('Исправление завершено. Теперь можно создавать описания моделей.');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

fixIndexes(); 