const express = require('express');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const {
  listUsers,
  getUser,
  banUser,
  unbanUser,
  deleteUser,
} = require('~/server/controllers/admin/UserController');
const {
  listTransactions,
  addBalance,
} = require('~/server/controllers/admin/TransactionController');
const { getStats } = require('~/server/controllers/admin/StatsController');
const { listPromoCodes, createPromoCode, updatePromoCode } = require('~/server/controllers/PromoCodeController');
const { getSettings, updateSettings } = require('~/server/controllers/admin/SettingsController');
const { assignSubscription } = require('~/server/controllers/admin/SubscriptionController');
const { getModels, updateModels } = require('~/server/controllers/admin/ModelsController');
const { expireSubscriptions } = require('../tasks/expireSubscriptions');
const UserSubscription = require('~/models/UserSubscription');
const {
  getModelDescriptions,
  createModelDescription,
  updateModelDescription,
  deleteModelDescription,
  getModelDescriptionsMap,
} = require('~/server/controllers/admin/ModelDescriptionController');

const router = express.Router();

// Применяем аутентификацию и проверку роли админа ко всем роутам
router.use(requireJwtAuth, checkAdmin);

// Список пользователей
router.get('/users', listUsers);
// Детали пользователя
router.get('/users/:id', getUser);
// Разбан пользователя
router.post('/users/:id/unban', unbanUser);
// Удаление пользователя
router.delete('/users/:id', deleteUser);

// Получение всех подписок для админки
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await UserSubscription.find()
      .populate('user')
      .populate('plan')
      .lean();
    
    res.json({ success: true, subscriptions });
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ success: false, message: 'Ошибка получения подписок' });
  }
});

// Транзакции и баланс
router.get('/transactions', listTransactions);
router.post('/add-balance', addBalance);
// Статистика
router.get('/stats', getStats);
// Промокоды: список, создание, редактирование
router.get('/promocodes', listPromoCodes);
router.post('/promocodes', createPromoCode);
router.patch('/promocodes/:id', updatePromoCode);

// Секретные настройки: получение и обновление
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

// Назначить подписку пользователю по email
router.post('/assign-subscription', assignSubscription);

// Обновить истекшие подписки
router.post('/expire-subscriptions', async (req, res) => {
  try {
    const result = await expireSubscriptions();
    res.json({ 
      success: true, 
      expired: result.expired,
      message: `Обновлено статусов истекших подписок: ${result.expired}`
    });
  } catch (error) {
    console.error('Error expiring subscriptions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении истекших подписок' 
    });
  }
});

// Управление моделями по тарифам
router.get('/models', getModels);
router.patch('/models', updateModels);

// Описания моделей
router.get('/model-descriptions', getModelDescriptions);
router.get('/model-descriptions/map', getModelDescriptionsMap);
router.post('/model-descriptions', createModelDescription);
router.patch('/model-descriptions/:id', updateModelDescription);
router.delete('/model-descriptions/:id', deleteModelDescription);

module.exports = router;