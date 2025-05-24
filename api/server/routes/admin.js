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
const UserSubscription = require('~/models/UserSubscription');

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

// Управление моделями по тарифам
router.get('/models', getModels);
router.patch('/models', updateModels);

module.exports = router;