/**
 * Конфигурация моделей для разных типов подписок
 * Приоритет использования: переменные окружения, затем значения по умолчанию
 */

// Загружаем переменные окружения, если используется dotenv
// require('dotenv').config(); // раскомментируйте, если используете dotenv

// Функция для получения массива моделей из переменной окружения
function getModelsFromEnv(envKey, defaultValue = []) {
  if (process.env[envKey] && process.env[envKey].trim()) {
    return process.env[envKey].split(',').map(model => model.trim()).filter(Boolean);
  }
  return defaultValue;
}

// Модели для разных тарифов, берутся из переменных окружения
const FREE_MODELS = getModelsFromEnv('OPENAI_MODELS_FREE', []);
const MINI_MODELS = getModelsFromEnv('OPENAI_MODELS_MINI', []);
const STANDARD_MODELS = getModelsFromEnv('OPENAI_MODELS_STANDARD', []);
const PRO_MODELS = getModelsFromEnv('OPENAI_MODELS_PRO', []);

// Карта соответствия типов подписок и доступных моделей
const SUBSCRIPTION_MODELS = {
  FREE: FREE_MODELS,
  MINI: MINI_MODELS,
  STANDARD: STANDARD_MODELS,
  PRO: PRO_MODELS,
};

// Функция для получения моделей по типу подписки
function getModelsForPlan(planKey = 'FREE') {
  const normalizedKey = planKey.toUpperCase();
  console.log(`[subscriptionConfig] Запрос моделей для тарифа: ${planKey}, используем ключ: ${normalizedKey}`);
  const models = SUBSCRIPTION_MODELS[normalizedKey] || FREE_MODELS;
  console.log(`[subscriptionConfig] Модели для тарифа ${normalizedKey}:`, models);
  return models;
}

// Экспортируем константы и функции
module.exports = {
  FREE_MODELS,
  MINI_MODELS,
  STANDARD_MODELS,
  PRO_MODELS,
  getModelsForPlan,
};