const SubscriptionPlan = require('~/models/SubscriptionPlan');
const { logger } = require('~/config');

/**
 * Получить все доступные модели по тарифам
 * GET /api/admin/models
 */
async function getModels(req, res) {
  try {
    const plans = await SubscriptionPlan.find().lean();
    
    // Подготовим структуру данных с моделями по тарифам
    const modelsData = plans.map(plan => ({
      planKey: plan.key,
      planName: plan.name,
      allowedModels: plan.allowedModels || [],
      modelDescriptions: plan.modelDescriptions || {},
    }));
    
    return res.json({ success: true, modelsData });
  } catch (err) {
    logger.error('[ModelsController] Ошибка получения моделей:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

/**
 * Обновить список моделей и их описания для конкретного тарифа
 * PATCH /api/admin/models
 * Body: { planKey: string, models: string[], descriptions?: Record<string, string> }
 */
async function updateModels(req, res) {
  try {
    const { planKey, models, descriptions } = req.body;
    
    if (!planKey) {
      return res.status(400).json({ success: false, message: 'Не указан ключ тарифного плана' });
    }
    
    if (!Array.isArray(models)) {
      return res.status(400).json({ success: false, message: 'Модели должны быть массивом' });
    }
    
    // Находим тариф по ключу
    const plan = await SubscriptionPlan.findOne({ key: planKey });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Тарифный план не найден' });
    }
    
    // Обновляем список разрешенных моделей
    plan.allowedModels = models;
    
    // Обновляем описания моделей, если они переданы
    if (descriptions && typeof descriptions === 'object') {
      // Инициализируем описания если их нет
      if (!plan.modelDescriptions) {
        plan.modelDescriptions = {};
      }
      
      // Фильтруем описания только для существующих моделей
      const filteredDescriptions = {};
      models.forEach(model => {
        if (descriptions[model]) {
          filteredDescriptions[model] = descriptions[model];
        }
      });
      
      plan.modelDescriptions = filteredDescriptions;
    }
    
    await plan.save();
    
    logger.info(`[ModelsController] Обновлены модели для плана ${planKey}: ${models.join(', ')}`);
    if (descriptions) {
      logger.info(`[ModelsController] Обновлены описания для плана ${planKey}`);
    }
    
    return res.json({ 
      success: true, 
      message: 'Модели и описания успешно обновлены', 
      planKey,
      models,
      descriptions: plan.modelDescriptions || {}
    });
  } catch (err) {
    logger.error('[ModelsController] Ошибка обновления моделей:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

module.exports = { getModels, updateModels }; 