import React, { useState } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRecoilState } from 'recoil';
import store from '~/store';
import { Bell, Trash2, Send, Clock, AlertCircle, BarChart3 } from 'lucide-react';

export default function NotificationsPage() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hideNotification, setHideNotification] = useRecoilState(store.hideNotification);

  // Получение статистики уведомлений
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const res = await axios.get('/api/notifications/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/notifications', { message }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Оповещение отправлено успешно!');
      setMessage('');
      setHideNotification([]); // сброс скрытых, чтобы новое оповещение показалось всем
      queryClient.invalidateQueries(['notification']);
      queryClient.invalidateQueries(['notification-stats']);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить все уведомления? Это действие нельзя отменить.')) {
      return;
    }

    setDeleteLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.delete('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(response.data.message || 'Все уведомления удалены');
      queryClient.invalidateQueries(['notification']);
      queryClient.invalidateQueries(['notification-stats']);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Bell className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
          Управление оповещениями
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Создание и управление системными уведомлениями для пользователей
        </p>
      </div>

      {/* Stats */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <Bell className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-blue-100">Всего уведомлений</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-green-100">Активных</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 rounded-lg p-6 text-white">
            <div className="flex items-center">
              <Clock className="h-8 w-8" />
              <div className="ml-4">
                <p className="text-yellow-100">Истекших</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-green-500 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Создать новое оповещение</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Уведомления автоматически удаляются через 24 часа
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Текст оповещения
              </label>
              <textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Введите текст уведомления для пользователей..."
                required
                rows={4}
                className="
                  w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                  focus:border-blue-500 dark:focus:border-blue-400
                  transition-colors resize-none
                "
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Поддерживается HTML разметка для ссылок и форматирования
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="
                  flex-1 flex items-center justify-center px-6 py-3 rounded-lg
                  bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600
                  text-white font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Send className="h-5 w-5 mr-2" />
                {loading ? 'Отправка...' : 'Отправить оповещение'}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="
                  flex items-center justify-center px-6 py-3 rounded-lg
                  bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600
                  text-white font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Trash2 className="h-5 w-5 mr-2" />
                {deleteLoading ? 'Удаление...' : 'Удалить все'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Info section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Clock className="h-6 w-6 text-blue-500 dark:text-blue-400 mt-0.5" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Информация о времени жизни уведомлений
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Уведомления автоматически удаляются через 24 часа после создания</li>
                <li>Пользователи видят только непрочитанные и неистекшие уведомления</li>
                <li>Создание нового уведомления удаляет все предыдущие</li>
                <li>Кнопка "Удалить все" немедленно удаляет все уведомления в системе</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}