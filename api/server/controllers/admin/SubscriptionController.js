const SubscriptionPlan = require('~/models/SubscriptionPlan');
const UserSubscription = require('~/models/UserSubscription');
const User = require('~/models/User');
const { sendEmail, checkEmailConfig } = require('~/server/utils');
const { logger } = require('~/config');

/**
 * Assigns a subscription plan to a user by email via admin panel.
 * POST /api/admin/assign-subscription
 * Body: { email: string, planKey: string }
 */
async function assignSubscription(req, res) {
  try {
    const { email, planKey } = req.body;
    if (!email || !planKey) {
      return res.status(400).json({ message: 'Email and planKey are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = await SubscriptionPlan.findOne({ key: planKey });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const now = new Date();
    const endDate = plan.durationDays > 0
      ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
      : new Date('9999-12-31');

    let subscription = await UserSubscription.findOne({ user: user._id });
    if (subscription) {
      subscription.plan = plan._id;
      subscription.startDate = now;
      subscription.endDate = endDate;
      subscription.remainingMessages = plan.messageLimit;
      await subscription.save();
    } else {
      subscription = await UserSubscription.create({
        user: user._id,
        plan: plan._id,
        startDate: now,
        endDate,
        remainingMessages: plan.messageLimit,
      });
    }

    if (checkEmailConfig()) {
      await sendEmail({
        email: user.email,
        subject: 'Вам назначена подписка',
        payload: {
          appName: process.env.APP_TITLE || 'LibreChat',
          name: user.name || user.username || user.email,
          planName: plan.name,
          durationDays: plan.durationDays,
          year: new Date().getFullYear(),
        },
        template: 'assignSubscription.handlebars',
      });
    }

    return res.json({ message: 'Subscription assigned', subscription });
  } catch (err) {
    logger.error('[assignSubscription] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { assignSubscription }; 