const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { validatePromoCode } = require('~/server/controllers/PromoCodeController');

// Валидация промокода при покупке
// POST /api/promocodes/validate
router.post('/validate', requireJwtAuth, validatePromoCode);

module.exports = router; 