// ~/server/controllers/ModelDescriptionController.js

const { getAllModelDescriptions } = require('~/server/services/ModelDescriptionService');
const { logger } = require('~/config');

/**
 * Получить описания моделей (для всех авторизованных)
 * GET /api/models/descriptions
 */
async function getModelDescriptionsPublic(req, res) {
  try {
    const descriptions = await getAllModelDescriptions();
    return res.json({ success: true, descriptions });
  } catch (err) {
    logger.error('[ModelDescriptionController] Ошибка загрузки описаний:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

module.exports = { getModelDescriptionsPublic };