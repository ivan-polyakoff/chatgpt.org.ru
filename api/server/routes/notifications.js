const express = require('express');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const optionalJwtAuth = require('~/server/middleware/optionalJwtAuth');
const {
  getNotification,
  setNotification,
  deleteNotification,
  markReadNotification,
} = require('~/server/controllers/admin/NotificationController');

const router = express.Router();

// Публичный маршрут для получения активного оповещения
router.get('/', optionalJwtAuth, getNotification);

// Админские маршруты для управления оповещениями
router.post('/', requireJwtAuth, checkAdmin, setNotification);
router.delete('/', requireJwtAuth, checkAdmin, deleteNotification);
router.post('/read', requireJwtAuth, markReadNotification);

module.exports = router; 