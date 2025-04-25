const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const SubscriptionController = require('~/server/controllers/SubscriptionController');

// GET /api/subscriptions - список тарифных планов
router.get('/', requireJwtAuth, SubscriptionController.getPlans);

// GET /api/subscriptions/current - получение текущей подписки пользователя
router.get('/current', requireJwtAuth, SubscriptionController.getCurrentSubscription);

// POST /api/subscriptions/subscribe - инициация оплаты выбранного тарифа
router.post('/subscribe', requireJwtAuth, SubscriptionController.subscribe);

// POST /api/subscriptions/confirm - подтверждение оплаты и создание/обновление подписки
router.post('/confirm', requireJwtAuth, SubscriptionController.confirmSubscription);

module.exports = router; 