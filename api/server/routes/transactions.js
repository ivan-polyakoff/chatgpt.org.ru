const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const User = require('~/models/User');
const { Transaction } = require('~/models/Transaction');
const axios = require('axios');
const PromoCode = require('~/models/PromoCode');
const SubscriptionPlan = require('~/models/SubscriptionPlan');

/**
 * @route POST /api/transactions/add-balance
 * @description Add balance to a user
 * @payload { email: string, tokens: number }
 * @returns { success: boolean, message: string, balance?: number }
 */
router.post('/add-balance', requireJwtAuth, async (req, res) => {
  try {
    let tokens;
    let userId = req.user._id;
    // If operationId provided, verify sandbox payment
    if (req.body.operationId) {
      tokens = parseInt(req.body.tokens, 10);
      try {
        const statusRes = await axios.get(
          `${process.env.TOCHKA_SANDBOX_URL}/acquiring/v1.0/payments/${req.body.operationId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.TOCHKA_SANDBOX_TOKEN}`,
              CustomerCode: process.env.TOCHKA_CUSTOMER_CODE,
            },
          },
        );
        const resp = statusRes.data.Data;
        const op = Array.isArray(resp.Operation) ? resp.Operation[0] : resp;
        if (op.status !== 'APPROVED') {
          return res.status(400).json({
            success: false,
            message: op.status === 'CREATED' ? 'Платёж не завершён' : 'Платёж не одобрен',
            status: op.status,
          });
        }
      } catch (err) {
        if (err.response?.status === 400) {
          const errData = err.response.data;
          return res.status(400).json({
            success: false,
            message: errData.message || 'Платёж не оплачен',
            details: errData.Errors,
          });
        }
        console.error('Internal error verifying payment:', err.message);
        return res.status(500).json({ success: false, message: 'Server error verifying payment' });
      }
    } else {
      // Legacy flow by email
      const { email, tokens: tkns } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      if (!tkns || isNaN(tkns) || tkns <= 0) {
        return res.status(400).json({ success: false, message: 'Valid token amount is required' });
      }
      const user = await User.findOne({ email }).lean();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (!req.user.admin && req.user._id.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      tokens = parseInt(tkns, 10);
      userId = user._id;
    }
    // Create transaction after verification
    const result = await Transaction.create({ user: userId, tokenType: 'credits', context: 'payment', rawAmount: tokens });
    // Если передан promoCode и платеж одобрен, списываем его
    if (req.body.promoCode) {
      const promo = await PromoCode.findOne({ code: req.body.promoCode.toUpperCase().trim() });
      if (!promo) {
        return res.status(400).json({ success: false, message: 'Промокод не найден' });
      }
      if (promo.usesCount >= promo.maxUses) {
        return res.status(400).json({ success: false, message: 'Промокод больше недоступен' });
      }
      const userObjectId = req.user._id;
      if (promo.usedBy.includes(userObjectId)) {
        return res.status(400).json({ success: false, message: 'Промокод уже был использован этим пользователем' });
      }
      promo.usesCount += 1;
      promo.usedBy.push(userObjectId);
      await promo.save();
    }
    return res.status(200).json({ success: true, message: 'Balance added successfully', balance: result.balance });
  } catch (error) {
    console.error('Error in add-balance:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Создать ссылку на оплату в sandbox/production
router.post('/create-payment', requireJwtAuth, async (req, res) => {
  const { tokens, amount, planKey } = req.body;
  const tokenPrices = { '500000': 390, '1000000': 690, '2500000': 1490, '5000000': 2490 };
  try {
    // Цена и назначение платежа
    let rawPrice;
    let purpose;
    if (planKey) {
      // Покупка подписки
      const plan = await SubscriptionPlan.findOne({ key: planKey }).lean();
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Plan not found' });
      }
      rawPrice = plan.price;
      purpose = `Покупка подписки ${plan.name}`;
    } else {
      // Пополнение баланса токенов
      if (!tokens || !tokenPrices[tokens]) {
        return res.status(400).json({ success: false, message: 'Invalid token amount' });
      }
      rawPrice = tokenPrices[tokens];
      purpose = `Пополнение баланса ${tokens} токенов`;
    }
    // Если указан amount, переопределяем цену
    if (amount && !isNaN(parseFloat(amount))) {
      rawPrice = parseFloat(amount);
    }
    const price = rawPrice.toFixed(2);
    const mode = ['card', 'sbp'];
    const payload = {
      Data: {
        customerCode: process.env.TOCHKA_CUSTOMER_CODE,
        amount: price,
        purpose,
        paymentMode: mode,
        merchantId: process.env.TOCHKA_MERCHANT_ID,
        ttl: 60,
      },
    };
    const url = `${process.env.TOCHKA_SANDBOX_URL}/acquiring/v1.0/payments`;
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.TOCHKA_SANDBOX_TOKEN}`,
        CustomerCode: process.env.TOCHKA_CUSTOMER_CODE,
        'Content-Type': 'application/json',
      },
    });
    const { Data } = response.data;
    return res.status(200).json({
      success: true,
      paymentUrl: Data.paymentLink,
      operationId: Data.operationId,
      useWebhooks: process.env.USE_WEBHOOKS === 'true',
    });
  } catch (error) {
    console.error('Error creating payment:', error.response?.data || error.message);
    return res.status(500).json({ success: false, message: 'Server error', details: error.response?.data || error.message });
  }
});

// Endpoint to poll Tochka sandbox payment status
router.get('/payment-status', requireJwtAuth, async (req, res) => {
  try {
    const { operationId } = req.query;
    if (!operationId) {
      return res.status(400).json({ success: false, message: 'operationId is required' });
    }
    const response = await axios.get(
      `${process.env.TOCHKA_SANDBOX_URL}/acquiring/v1.0/payments/${operationId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TOCHKA_SANDBOX_TOKEN}`,
          CustomerCode: process.env.TOCHKA_CUSTOMER_CODE,
        },
      },
    );
    // Unified handling: sandbox returns flat Data; production returns Data.Operation array
    const respData = response.data.Data;
    const op = Array.isArray(respData.Operation) ? respData.Operation[0] : respData;
    return res.status(200).json({ success: true, data: op });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 