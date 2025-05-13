import React, { useState } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useRecoilState } from 'recoil';
import store from '~/store';

export default function NotificationsPage() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hideNotification, setHideNotification] = useRecoilState(store.hideNotification);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/notifications', { message }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Оповещение отправлено');
      setMessage('');
      setHideNotification([]); // сброс скрытых, чтобы новое оповещение показалось всем
      queryClient.invalidateQueries(['notification']);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* eslint-disable-next-line */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Оповещения</h1>
      {/* eslint-disable-next-line */}
      <p className="text-sm text-gray-500 dark:text-gray-400">Создайте новое оповещение для пользователей чата</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Текст оповещения"
          required
          className="w-full p-3 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          rows={4}
        />
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Отправка...' : 'Отправить оповещение'}
        </button>
      </form>
    </div>
  );
}