const express = require('express');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const {
  listUsers,
  getUser,
  banUser,
  unbanUser,
} = require('~/server/controllers/admin/UserController');
const {
  listTransactions,
  addBalance,
} = require('~/server/controllers/admin/TransactionController');
const { getStats } = require('~/server/controllers/admin/StatsController');
const { listPromoCodes, createPromoCode, updatePromoCode } = require('~/server/controllers/PromoCodeController');
const { getSettings, updateSettings } = require('~/server/controllers/admin/SettingsController');

const router = express.Router();

// Применяем аутентификацию и проверку роли админа ко всем роутам
router.use(requireJwtAuth, checkAdmin);

// Список пользователей
router.get('/users', listUsers);
// Детали пользователя
router.get('/users/:id', getUser);
// Разбан пользователя
router.post('/users/:id/unban', unbanUser);

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

module.exports = router;