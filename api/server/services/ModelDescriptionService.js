// ~/server/services/ModelDescriptionService.js

const { getLogStores } = require('~/cache');
const { CacheKeys } = require('librechat-data-provider');
const ModelDescription = require('~/models/ModelDescription');

let memoryCache = null;
let cacheTime = null;

/**
 * Возвращает карту активных описаний моделей: { modelName -> metadata }
 */
async function getAllModelDescriptions() {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const now = Date.now();
  const CACHE_TTL = 5 * 60 * 1000; // 5 минут

  // 1. Локальный кэш
  if (memoryCache && cacheTime && now - cacheTime < CACHE_TTL) {
    return memoryCache;
  }

  // 2. Внешний кэш
  let descriptions = await cache.get(CacheKeys.MODEL_DESCRIPTIONS);

  if (!descriptions) {
    // 3. Из БД
    const dbDescriptions = await ModelDescription.find({ isActive: true })
      .select('modelName displayName description category tags')
      .lean();

    descriptions = {};
    dbDescriptions.forEach((desc) => {
      descriptions[desc.modelName] = {
        displayName: desc.displayName || desc.modelName,
        description: desc.description,
        category: desc.category,
        tags: desc.tags || [],
      };
    });

    // 4. Сохранить в кэш
    await cache.set(CacheKeys.MODEL_DESCRIPTIONS, descriptions, 300);
  }

  // 5. Обновить локальный кэш
  memoryCache = descriptions;
  cacheTime = now;

  return descriptions;
}

module.exports = { getAllModelDescriptions };