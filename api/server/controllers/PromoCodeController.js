// Контроллер для работы с промокодами
const PromoCode = require('~/models/PromoCode');
const { logger } = require('~/config');

// GET /api/admin/promocodes
async function listPromoCodes(req, res) {
  try {
    const codes = await PromoCode.find().lean();
    res.json({ promoCodes: codes });
  } catch (err) {
    logger.error('Error listPromoCodes:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/admin/promocodes
async function createPromoCode(req, res) {
  try {
    const { code, discountPercent, maxUses } = req.body;
    if (!code || discountPercent == null || maxUses == null) {
      return res.status(400).json({ message: 'Code, discountPercent and maxUses are required' });
    }
    const newCode = await PromoCode.create({ code, discountPercent, maxUses });
    res.status(201).json(newCode);
  } catch (err) {
    logger.error('Error createPromoCode:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/admin/promocodes/:id
async function updatePromoCode(req, res) {
  try {
    const { id } = req.params;
    const { discountPercent, maxUses, usesCount } = req.body;
    const updates = {};
    if (discountPercent != null) { updates.discountPercent = discountPercent; }
    if (maxUses != null) { updates.maxUses = maxUses; }
    if (usesCount != null) { updates.usesCount = usesCount; }
    const updated = await PromoCode.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    res.json(updated);
  } catch (err) {
    logger.error('Error updatePromoCode:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/promocodes/validate
async function validatePromoCode(req, res) {
  try {
    // activate=false только проверяет промокод, без инкремента использования
    const { code, activate = true } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }
    const promo = await PromoCode.findOne({ code: code.toUpperCase().trim() });
    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    if (promo.usesCount >= promo.maxUses) {
      return res.status(400).json({ message: 'Promo code has no remaining uses' });
    }
    const userId = req.user.id;
    if (promo.usedBy.includes(userId)) {
      return res.status(400).json({ message: 'Promo code already used by this user' });
    }
    // Если просто проверка — возвращаем скидку без инкремента
    if (!activate) {
      return res.json({ discountPercent: promo.discountPercent });
    }
    // Активируем промокод: инкремент использования и сохранение
    promo.usesCount += 1;
    promo.usedBy.push(userId);
    await promo.save();
    res.json({ discountPercent: promo.discountPercent });
  } catch (err) {
    logger.error('Error validatePromoCode:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  validatePromoCode,
}; 