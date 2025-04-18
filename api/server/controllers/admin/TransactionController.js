// Контроллеры админ-панели: управление транзакциями
const { Transaction } = require('~/models/Transaction');
const User = require('~/models/User');

// GET /api/admin/transactions
async function listTransactions(req, res) {
  try {
    const txs = await Transaction.find().sort({ createdAt: -1 }).lean();
    const data = await Promise.all(
      txs.map(async (tx) => {
        const usr = await User.findById(tx.user).select('email').lean();
        return {
          id: tx._id,
          user: usr ? usr.email : null,
          tokenType: tx.tokenType,
          context: tx.context,
          rawAmount: tx.rawAmount,
          tokenValue: tx.tokenValue,
          rate: tx.rate,
          createdAt: tx.createdAt,
        };
      }),
    );
    res.json({ transactions: data });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// POST /api/admin/add-balance
async function addBalance(req, res) {
  try {
    const { email, tokens } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const amount = Number(tokens);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid token amount is required' });
    }
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const result = await Transaction.create({
      user: user._id,
      tokenType: 'credits',
      context: 'payment',
      rawAmount: amount,
    });
    return res.json({ success: true, message: 'Balance added successfully', balance: result.balance });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

module.exports = { listTransactions, addBalance };