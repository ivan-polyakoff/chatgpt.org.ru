const User = require('~/models/User');
const { Message } = require('~/models/Message');
const { logger } = require('~/config');

// GET /api/admin/stats/users
async function getStats(req, res) {
  try {
    const userCount = await User.countDocuments();
    // Статистика запросов за последние 7 дней
    const days = 7;
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    const pipeline = [
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ];
    const agg = await Message.aggregate(pipeline);
    const requestsPerDay = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      requestsPerDay[key] = 0;
    }
    agg.forEach((item) => {
      requestsPerDay[item._id] = item.count;
    });
    res.json({ userCount, requestsPerDay });
  } catch (err) {
    logger.error('Error in StatsController.getStats:', err);
    res.status(500).json({ message: 'Server error', error: err.stack });
  }
}

module.exports = { getStats };