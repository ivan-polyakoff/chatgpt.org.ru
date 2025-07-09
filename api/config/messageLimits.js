/**
 * Конфигурация лимитов сообщений для разных тарифов
 * Берется из переменных окружения или используются значения по умолчанию
 */

// Функция для получения числа из переменной окружения
function getLimitFromEnv(envKey, defaultValue = 0) {
  const value = process.env[envKey];
  if (value && !isNaN(parseInt(value))) {
    return parseInt(value);
  }
  return defaultValue;
}

// Лимиты сообщений для разных тарифов (из переменных окружения)
const MESSAGE_LIMITS = {
  free: getLimitFromEnv('MESSAGE_LIMIT_FREE', 10),
  mini: getLimitFromEnv('MESSAGE_LIMIT_MINI', 100),
  standard: getLimitFromEnv('MESSAGE_LIMIT_STANDARD', 1000),
  pro: getLimitFromEnv('MESSAGE_LIMIT_PRO', 0), // 0 = безлимитный
};

// Функция для получения лимита по ключу тарифа
function getMessageLimit(planKey = 'free') {
  const normalizedKey = planKey.toLowerCase();
  console.log(`[messageLimits] Запрос лимита для тарифа: ${planKey}, используем ключ: ${normalizedKey}`);
  const limit = MESSAGE_LIMITS[normalizedKey] !== undefined ? MESSAGE_LIMITS[normalizedKey] : MESSAGE_LIMITS.free;
  console.log(`[messageLimits] Лимит для тарифа ${normalizedKey}:`, limit);
  return limit;
}

// Проверка является ли тариф безлимитным
function isUnlimitedPlan(planKey = 'free') {
  return getMessageLimit(planKey) === 0;
}

module.exports = {
  MESSAGE_LIMITS,
  getMessageLimit,
  isUnlimitedPlan,
}; 