const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const User = require('~/models/User');
const { Transaction } = require('~/models/Transaction');

/**
 * @route POST /api/transactions/add-balance
 * @description Add balance to a user
 * @payload { email: string, tokens: number }
 * @returns { success: boolean, message: string, balance?: number }
 */
router.post('/add-balance', requireJwtAuth, async (req, res) => {
  try {
    const { email, tokens } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    if (!tokens || isNaN(tokens) || tokens <= 0) {
      return res.status(400).json({ success: false, message: 'Valid token amount is required' });
    }
    
    // Find user
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // For security, only allow admins or the user themselves to add balance
    if (!req.user.admin && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to add balance to this user' });
    }
    
    // Create transaction to add balance
    const result = await Transaction.create({
      user: user._id,
      tokenType: 'credits',
      context: 'payment',
      rawAmount: tokens,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Balance added successfully',
      balance: result.balance,
    });
    
  } catch (error) {
    console.error('Error adding balance:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 