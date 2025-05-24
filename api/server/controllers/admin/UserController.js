// Контроллеры админ-панели: управление пользователями
const User = require('~/models/User');
const UserSubscription = require('~/models/UserSubscription');
const { getLogStores } = require('~/cache');
const { ViolationTypes } = require('librechat-data-provider');
const { logger } = require('~/config');
const keyvMongo = require('~/cache/keyvMongo');

// Кэш банов
const banCache = getLogStores(ViolationTypes.BAN);

// GET /api/admin/users
async function listUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const result = await Promise.all(
      users.map(async (u) => ({
        id: u._id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        banned: await banCache.has(u._id.toString()),
      })),
    );
    res.json({ users: result });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// GET /api/admin/users/:id
async function getUser(req, res) {
  try {
    const { id } = req.params;
    const u = await User.findById(id).lean();
    if (!u) {
      return res.status(404).json({ message: 'User not found' });
    }
    u.banned = await banCache.has(id);
    res.json(u);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// POST /api/admin/users/:id/ban
async function banUser(req, res) {
  try {
    const { id } = req.params;
    await banCache.set(id, { expiresAt: Date.now() + Number(process.env.BAN_DURATION || 0) });
    res.json({ message: 'User banned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// POST /api/admin/users/:id/unban
async function unbanUser(req, res) {
  const { id } = req.params;
  try {
    logger.info(`Admin unbanUser called for id: ${id}`);
    const before = await banCache.get(id);
    logger.info(`banCache.get before delete for id ${id}:`, before);
    const deleted = await banCache.delete(id);
    logger.info(`banCache.delete returned for id ${id}: ${deleted}`);
    // Clear memory banCache from middleware (namespace key)
    const key = `${ViolationTypes.BAN}:${id}`;
    await keyvMongo.delete(key);
    const after = await banCache.get(id);
    logger.info(`banCache.get after delete for id ${id}:`, after);
    if (deleted) {
      logger.info(`Admin unban user: ${id}`);
    } else {
      logger.warn(`Admin unban user: ${id} - no existing ban entry`);
    }
    res.json({ message: 'User unbanned', banned: Boolean(after) });
  } catch (err) {
    logger.error(`Error in Admin unbanUser for id ${id}:`, err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Проверяем, существует ли пользователь
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    // Нельзя удалить самого себя
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить собственную учетную запись',
      });
    }

    // Проверяем, что это не единственный администратор
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Нельзя удалить единственного администратора',
        });
      }
    }

    logger.info(`Admin attempting to delete user: ${user.email} (ID: ${id})`);

    // Удаляем связанные данные
    try {
      // Удаляем подписки пользователя
      await UserSubscription.deleteMany({ user: id });
      logger.info(`Deleted subscriptions for user: ${id}`);

      // Удаляем пользователя из кеша банов (если есть)
      await banCache.delete(id);
      const banKey = `${ViolationTypes.BAN}:${id}`;
      await keyvMongo.delete(banKey);
      logger.info(`Cleared ban cache for user: ${id}`);

      // Удаляем самого пользователя
      await User.findByIdAndDelete(id);
      logger.info(`Successfully deleted user: ${user.email} (ID: ${id})`);

    } catch (cleanupError) {
      logger.error(`Error during user cleanup for ${id}:`, cleanupError);
      // Продолжаем выполнение, даже если очистка не удалась полностью
    }

    res.json({
      success: true,
      message: `Пользователь ${user.email} успешно удален`,
    });

  } catch (err) {
    logger.error(`Error deleting user ${req.params.id}:`, err);
    res.status(500).json({
      success: false,
      message: 'Произошла ошибка при удалении пользователя',
      error: err.message,
    });
  }
}

module.exports = {
  listUsers,
  getUser,
  banUser,
  unbanUser,
  deleteUser,
};