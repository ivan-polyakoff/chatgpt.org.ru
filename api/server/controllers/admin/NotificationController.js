const Notification = require('~/models/Notification');
const { logger } = require('~/config');

/**
 * Получить текущее активное оповещение
 */
async function getNotification(req, res) {
  logger.info('Admin getNotification called');
  try {
    const filter = req.user ? { readBy: { $nin: [req.user._id] } } : {};
    const notification = await Notification.findOne(filter).sort({ createdAt: -1 }).lean();
    logger.info(`Admin getNotification success: ${notification?._id}`);
    res.status(200).json({ notification });
  } catch (error) {
    logger.error('Admin getNotification error:', error);
    res.status(500).json({ message: 'Error getting notification', error: error.message });
  }
}

/**
 * Создать новое оповещение (старое автоматически скрывается)
 */
async function setNotification(req, res) {
  logger.info(`Admin setNotification called with message: ${req.body.message}`);
  try {
    await Notification.deleteMany({});
    const { message } = req.body;
    const notification = await Notification.create({ message });
    logger.info(`Admin setNotification created notification: ${notification._id}`);
    res.status(200).json({ notification });
  } catch (error) {
    logger.error('Admin setNotification error:', error);
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
}

/**
 * Удалить все оповещения
 */
async function deleteNotification(req, res) {
  logger.info('Admin deleteNotification called');
  try {
    await Notification.deleteMany({});
    logger.info('Admin deleteNotification deleted all notifications');
    res.status(204).send();
  } catch (error) {
    logger.error('Admin deleteNotification error:', error);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
}

/**
 * Пометить оповещение как прочитанное
 */
async function markReadNotification(req, res) {
  logger.info(`User ${req.user._id} markReadNotification called for id: ${req.body.id}`);
  try {
    const { id } = req.body;
    await Notification.updateOne(
      { _id: id },
      { $addToSet: { readBy: req.user._id } }
    );
    res.status(200).json({});
  } catch (error) {
    logger.error('markReadNotification error:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
}

module.exports = { getNotification, setNotification, deleteNotification, markReadNotification, }; 