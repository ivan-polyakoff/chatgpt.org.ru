/* eslint-disable */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { Trash2, Search, AlertCircle, Users, Clock } from 'lucide-react';

export default function UsersPage() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery<any, any>(['admin-users'], async () => {
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error('Error fetching users');
    }
    return res.json();
  });

  // Получение данных о подписках пользователей
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery<any, any>(
    ['admin-subscriptions'],
    async () => {
      const res = await fetch('/api/admin/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Error fetching subscriptions');
      }
      return res.json();
    },
    {
      // Отключаем запрос, если есть ошибка получения пользователей
      enabled: !error
    }
  );

  // Мутация для удаления пользователя
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Ошибка удаления пользователя');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-subscriptions']);
    },
  });

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя ${userEmail}? Это действие нельзя отменить.`)) {
      try {
        await deleteUserMutation.mutateAsync(userId);
        alert('Пользователь успешно удален');
      } catch (error: any) {
        alert(`Ошибка удаления: ${error.message}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 my-4 rounded-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700 dark:text-red-300">Ошибка загрузки данных: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Функция для получения информации о подписке пользователя
  const getUserSubscription = (userId) => {
    if (!subscriptionsData || !subscriptionsData.subscriptions) return null;
    
    return subscriptionsData.subscriptions.find(
      sub => sub.user === userId || sub.user?._id === userId
    );
  };

  const filteredUsers = data.users.filter((user: any) => 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Users className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
            Пользователи
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Управление учетными записями пользователей системы
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-auto sm:min-w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            className="
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400
              block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
              rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              text-sm transition-colors
            "
            placeholder="Поиск по email..."
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <Users className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-blue-100">Всего пользователей</p>
              <p className="text-2xl font-bold">{data.users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <Clock className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-green-100">Активных подписок</p>
              <p className="text-2xl font-bold">
                {subscriptionsData?.subscriptions?.filter(s => s.status === 'active')?.length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <Search className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-purple-100">Результатов поиска</p>
              <p className="text-2xl font-bold">{filteredUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Роль
                    </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Подписка
                    </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Зарегистрирован
                    </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Статус
                    </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
                  </tr>
                </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((u: any) => {
                    const subscription = getUserSubscription(u.id);
                    return (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subscriptionsLoading ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Загрузка...</span>
                        ) : subscription ? (
                          <div>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                              {subscription.plan?.name || 'Нет данных'}
                            </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              До: {new Date(subscription.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Бесплатный
                          </span>
                        )}
                      </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.banned ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                            Заблокирован
                          </span>
                        ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            Активен
                          </span>
                        )}
                      </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      disabled={deleteUserMutation.isLoading}
                      className="
                        text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 
                        disabled:opacity-50 disabled:cursor-not-allowed 
                        flex items-center space-x-1 p-2 rounded-lg
                        hover:bg-red-50 dark:hover:bg-red-900/20
                        transition-all duration-200
                      "
                      title="Удалить пользователя"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleteUserMutation.isLoading && (
                        <span className="text-xs ml-1">Удаление...</span>
                      )}
                    </button>
                  </td>
                    </tr>
                  )})}
                </tbody>
              </table>
        </div>
      </div>

      {/* Footer stats */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex-1 flex justify-between sm:hidden">
          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700">
            Всего: {filteredUsers.length}
          </span>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Показано <span className="font-medium">{filteredUsers.length}</span> из{' '}
              <span className="font-medium">{data.users.length}</span> пользователей
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 