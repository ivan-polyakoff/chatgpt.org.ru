const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const User = require('~/models/User');
const { Transaction } = require('~/models/Transaction');
const axios = require('axios');
const PromoCode = require('~/models/PromoCode');
const SubscriptionPlan = require('~/models/SubscriptionPlan');
const crypto = require('crypto');

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
    // Если operationId предоставлен, проверяем платеж в ЮKassa
    if (req.body.operationId) {
      tokens = parseInt(req.body.tokens, 10);
      try {
        const paymentId = req.body.operationId;
        const response = await axios.get(
          `https://api.yookassa.ru/v3/payments/${paymentId}`,
          {
            auth: {
              username: process.env.shopid,
              password: process.env.yookassa_secret_key,
            },
          },
        );
        
        const payment = response.data;
        if (payment.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            message: payment.status === 'waiting_for_capture' ? 'Платёж не завершён' : 'Платёж не одобрен',
            status: payment.status,
          });
        }
      } catch (err) {
        console.error('Error verifying YooKassa payment:', err.response?.data || err.message);
        return res.status(500).json({
          success: false,
          message: 'Ошибка проверки платежа',
          details: err.response?.data,
        });
      }
    } else {
      // Устаревший способ по email
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
    // Создаем транзакцию после проверки
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

// Создать платеж в ЮKassa
router.post('/create-payment', requireJwtAuth, async (req, res) => {
  const { tokens, amount, planKey } = req.body;
  const tokenPrices = { '500000': 390, '1000000': 690, '2500000': 1490, '5000000': 2490 };
  try {
    // Получаем email пользователя для чека
    const user = await User.findById(req.user._id).lean();
    if (!user || !user.email) {
      return res.status(400).json({ success: false, message: 'User email not found' });
    }

    // Цена и назначение платежа
    let rawPrice;
    let description;
    let itemDescription;
    let plan = null;
    
    if (planKey) {
      // Покупка подписки
      plan = await SubscriptionPlan.findOne({ key: planKey }).lean();
      if (!plan) {
        return res.status(404).json({ success: false, message: 'Plan not found' });
      }
      rawPrice = plan.price;
      description = `Покупка подписки ${plan.name}`;
      itemDescription = `Подписка "${plan.name}" на ${plan.durationDays} дней`;
    } else {
      // Пополнение баланса токенов
      if (!tokens || !tokenPrices[tokens]) {
        return res.status(400).json({ success: false, message: 'Invalid token amount' });
      }
      rawPrice = tokenPrices[tokens];
      description = `Пополнение баланса ${tokens} токенов`;
      itemDescription = `Пополнение баланса на ${tokens} токенов`;
    }
    
    // Если указан amount, переопределяем цену
    if (amount && !isNaN(parseFloat(amount))) {
      rawPrice = parseFloat(amount);
    }
    const price = rawPrice.toFixed(2);

    // Создаем платеж в ЮKassa
    const idempotenceKey = crypto.randomUUID();
    const payload = {
      amount: {
        value: price,
        currency: 'RUB',
      },
      capture: true,
      payment_method_data: {
        type: 'bank_card',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.CLIENT_URL || 'http://localhost:3080'}/balance?tokens=${tokens || ''}&planKey=${planKey || ''}`,
      },
      description: description,
      metadata: {
        tokens: tokens || '',
        planKey: planKey || '',
        userId: req.user._id.toString(),
      },
      // ОБЯЗАТЕЛЬНЫЙ объект receipt для соответствия 54-ФЗ
      receipt: {
        customer: {
          email: user.email
        },
        items: [
          {
            description: itemDescription,
            quantity: '1.00',
            amount: {
              value: price,
              currency: 'RUB'
            },
            vat_code: 1, // НДС 20% (можно настроить под ваше налогообложение)
            payment_mode: 'full_payment',
            payment_subject: 'service'
          }
        ]
      }
    };

    const response = await axios.post(
      'https://api.yookassa.ru/v3/payments',
      payload,
      {
        headers: {
          'Idempotence-Key': idempotenceKey,
          'Content-Type': 'application/json',
        },
        auth: {
          username: process.env.shopid,
          password: process.env.yookassa_secret_key,
        },
      },
    );

    return res.status(200).json({
      success: true,
      paymentUrl: response.data.confirmation.confirmation_url,
      operationId: response.data.id,
      useWebhooks: true,
    });
  } catch (error) {
    console.error('Error creating payment:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.response?.data || error.message,
    });
  }
});

// Проверка статуса платежа в ЮKassa
router.get('/payment-status', requireJwtAuth, async (req, res) => {
  try {
    const { operationId } = req.query;
    if (!operationId) {
      return res.status(400).json({ success: false, message: 'operationId is required' });
    }
    
    const response = await axios.get(
      `https://api.yookassa.ru/v3/payments/${operationId}`,
      {
        auth: {
          username: process.env.shopid,
          password: process.env.yookassa_secret_key,
        },
      },
    );
    
    // Преобразуем ответ ЮKassa в формат, совместимый с существующим кодом
    const paymentData = {
      status: response.data.status === 'succeeded' ? 'APPROVED' : 
              response.data.status === 'waiting_for_capture' ? 'WAITING_FOR_CAPTURE' :
              response.data.status === 'pending' ? 'CREATED' :
              response.data.status.toUpperCase(),
      amount: response.data.amount.value,
      currency: response.data.amount.currency,
      description: response.data.description,
      metadata: response.data.metadata,
      created_at: response.data.created_at,
      paid: response.data.paid,
    };
    
    return res.status(200).json({ success: true, data: paymentData });
  } catch (error) {
    console.error('Error fetching payment status:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      details: error.response?.data || error.message,
    });
  }
});

// Обработка уведомлений от ЮKassa (webhook)
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Received YooKassa webhook:', event);

    // Проверяем, что это уведомление о платеже
    if (event.event === 'payment.succeeded') {
      const payment = event.object;

      // Проверяем метаданные платежа
      if (payment.metadata) {
        const { tokens, planKey, userId } = payment.metadata;

        if (tokens && userId) {
          // Обработка пополнения баланса
          const tokenAmount = parseInt(tokens, 10);
          if (!isNaN(tokenAmount) && tokenAmount > 0) {
            // Создаем транзакцию с userId из метаданных
            await Transaction.create({
              user: userId,
              tokenType: 'credits',
              context: 'payment',
              rawAmount: tokenAmount,
            });

            console.log(`Successfully added ${tokenAmount} tokens via webhook for user ${userId}, payment ${payment.id}`);
          }
        } else if (planKey && userId) {
          // Обработка покупки подписки
          console.log(`Subscription payment received for plan ${planKey}, user ${userId}, payment ID: ${payment.id}`);
        }
      }
    }

    // Возвращаем 200 OK для подтверждения получения уведомления
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing YooKassa webhook:', error);
    // Даже в случае ошибки обработки, возвращаем 200 OK,
    // чтобы ЮKassa не пыталась повторно отправить уведомление
    return res.status(200).send('OK');
  }
});

module.exports = router; 