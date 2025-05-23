const Notification = require('~/models/Notification');
const { logger } = require('~/config');

/**
 * Получить текущее активное оповещение
 */
async function getNotification(req, res) {
  logger.info(`getNotification called by user: ${req.user?._id || 'anonymous'}`);
  try {
    const filter = req.user ? { readBy: { $nin: [req.user._id] } } : {};
    logger.info(`getNotification filter: ${JSON.stringify(filter)}`);
    
    const notification = await Notification.findOne(filter).sort({ createdAt: -1 }).lean();
    
    if (notification) {
      logger.info(`getNotification found notification ${notification._id} with readBy: ${JSON.stringify(notification.readBy)}`);
    } else {
      logger.info('getNotification: no unread notifications found');
    }
    
    res.status(200).json({ notification });
  } catch (error) {
    logger.error('getNotification error:', error);
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
    
    // Проверяем, существует ли уведомление
    const notification = await Notification.findById(id);
    if (!notification) {
      logger.error(`Notification ${id} not found`);
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Проверяем, не было ли уже прочитано
    if (notification.readBy.includes(req.user._id)) {
      logger.info(`Notification ${id} already read by user ${req.user._id}`);
      return res.status(200).json({ message: 'Already marked as read' });
    }
    
    const result = await Notification.updateOne(
      { _id: id },
      { $addToSet: { readBy: req.user._id } },
    );
    
    logger.info(`markReadNotification result: ${JSON.stringify(result)}`);
    res.status(200).json({});
  } catch (error) {
    logger.error('markReadNotification error:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
}

module.exports = { getNotification, setNotification, deleteNotification, markReadNotification }; 