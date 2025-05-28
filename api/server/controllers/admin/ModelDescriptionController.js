const ModelDescription = require('~/models/ModelDescription');
const { logger } = require('~/config');

/**
 * Получить все описания моделей
 * GET /api/admin/model-descriptions
 */
async function getModelDescriptions(req, res) {
  try {
    const descriptions = await ModelDescription.find()
      .sort({ category: 1, modelName: 1 })
      .lean();
    
    return res.json({ success: true, descriptions });
  } catch (err) {
    logger.error('[ModelDescriptionController] Ошибка получения описаний:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

/**
 * Создать новое описание модели
 * POST /api/admin/model-descriptions
 */
async function createModelDescription(req, res) {
  try {
    const { modelName, displayName, description, category, tags } = req.body;
    
    if (!modelName || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Не указаны обязательные поля: modelName и description' 
      });
    }
    
    // Проверяем, не существует ли уже описание для этой модели
    const existing = await ModelDescription.findOne({ modelName });
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: `Описание для модели "${modelName}" уже существует` 
      });
    }
    
    const newDescription = new ModelDescription({
      modelName: modelName.trim(),
      displayName: displayName?.trim(),
      description: description.trim(),
      category: category || 'other',
      tags: tags?.map(tag => tag.trim()).filter(Boolean) || [],
    });
    
    await newDescription.save();
    
    logger.info(`[ModelDescriptionController] Создано описание для модели: ${modelName}`);
    
    return res.json({ 
      success: true, 
      message: 'Описание модели успешно создано',
      description: newDescription.toObject(),
    });
  } catch (err) {
    logger.error('[ModelDescriptionController] Ошибка создания описания:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

/**
 * Обновить описание модели
 * PATCH /api/admin/model-descriptions/:id
 */
async function updateModelDescription(req, res) {
  try {
    const { id } = req.params;
    const { modelName, displayName, description, category, tags, isActive } = req.body;
    
    const modelDesc = await ModelDescription.findById(id);
    if (!modelDesc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Описание модели не найдено' 
      });
    }
    
    // Обновляем поля
    if (modelName !== undefined) modelDesc.modelName = modelName.trim();
    if (displayName !== undefined) modelDesc.displayName = displayName?.trim();
    if (description !== undefined) modelDesc.description = description.trim();
    if (category !== undefined) modelDesc.category = category;
    if (isActive !== undefined) modelDesc.isActive = isActive;
    if (tags !== undefined) modelDesc.tags = tags?.map(tag => tag.trim()).filter(Boolean) || [];
    
    await modelDesc.save();
    
    logger.info(`[ModelDescriptionController] Обновлено описание для модели: ${modelDesc.modelName}`);
    
    return res.json({ 
      success: true, 
      message: 'Описание модели успешно обновлено',
      description: modelDesc.toObject(),
    });
  } catch (err) {
    logger.error('[ModelDescriptionController] Ошибка обновления описания:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

/**
 * Удалить описание модели
 * DELETE /api/admin/model-descriptions/:id
 */
async function deleteModelDescription(req, res) {
  try {
    const { id } = req.params;
    
    const modelDesc = await ModelDescription.findById(id);
    if (!modelDesc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Описание модели не найдено' 
      });
    }
    
    const modelName = modelDesc.modelName;
    await ModelDescription.findByIdAndDelete(id);
    
    logger.info(`[ModelDescriptionController] Удалено описание для модели: ${modelName}`);
    
    return res.json({ 
      success: true, 
      message: `Описание модели "${modelName}" успешно удалено`,
    });
  } catch (err) {
    logger.error('[ModelDescriptionController] Ошибка удаления описания:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

/**
 * Получить описания в формате карты для быстрого доступа
 * GET /api/admin/model-descriptions/map
 */
async function getModelDescriptionsMap(req, res) {
  try {
    const descriptions = await ModelDescription.find({ isActive: true })
      .select('modelName displayName description category tags')
      .lean();
    
    // Преобразуем в карту для удобного доступа
    const descriptionsMap = {};
    descriptions.forEach(desc => {
      descriptionsMap[desc.modelName] = {
        displayName: desc.displayName || desc.modelName,
        description: desc.description,
        category: desc.category,
        tags: desc.tags || [],
      };
    });
    
    return res.json({ success: true, descriptions: descriptionsMap });
  } catch (err) {
    logger.error('[ModelDescriptionController] Ошибка получения карты описаний:', err);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

module.exports = {
  getModelDescriptions,
  createModelDescription,
  updateModelDescription,
  deleteModelDescription,
  getModelDescriptionsMap,
}; 