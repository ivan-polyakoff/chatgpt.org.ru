import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import axios from 'axios';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function TestSubscriptionsPage() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();

  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPlanKey, setTestPlanKey] = useState('free');

  // Загружаем списки тарифов
  const { data: plans } = useQuery(
    ['subscription-plans'],
    async () => {
      const res = await axios.get('/api/subscriptions', { headers: { Authorization: `Bearer ${token}` } });
      return res.data.plans;
    }
  );

  // Мутация для назначения подписки
  const assignMutation = useMutation(
    async ({ email, planKey }: { email: string; planKey: string }) => {
      const res = await axios.post(
        '/api/admin/assign-subscription',
        { email, planKey, forceAssign: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    {
      onSuccess: (data) => {
        showToast({ 
          message: data.wasDowngrade 
            ? `Тариф понижен: ${data.message}` 
            : `Подписка назначена: ${data.message}` 
        });
        queryClient.invalidateQueries(['test-subscriptions']);
      },
      onError: (err: any) => {
        showToast({ message: err.response?.data?.message || 'Ошибка назначения подписки' });
      },
    }
  );

  // Мутация для обновления истекших подписок
  const expireMutation = useMutation(
    async () => {
      const res = await axios.post(
        '/api/admin/expire-subscriptions',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    {
      onSuccess: (data) => {
        showToast({ message: `Обновлено истекших подписок: ${data.expired}` });
        queryClient.invalidateQueries(['test-subscriptions']);
      },
      onError: (err: any) => {
        showToast({ message: err.response?.data?.message || 'Ошибка обновления подписок' });
      },
    }
  );

  // Получение статистики подписок
  const { data: stats, refetch: refetchStats } = useQuery(
    ['test-subscriptions'],
    async () => {
      const res = await axios.get('/api/admin/subscriptions', { headers: { Authorization: `Bearer ${token}` } });
      return res.data.subscriptions;
    }
  );

  const handleTestAssign = () => {
    if (!testEmail || !testPlanKey) {
      showToast({ message: 'Заполните email и выберите план' });
      return;
    }
    assignMutation.mutate({ email: testEmail, planKey: testPlanKey });
  };

  const activeSubscriptions = stats?.filter((sub: any) => sub.status === 'active') || [];
  const expiredSubscriptions = stats?.filter((sub: any) => sub.status === 'expired') || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <CheckCircle className="h-7 w-7 mr-3 text-green-600 dark:text-green-400" />
          Тестирование подписок
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Тестирование функций назначения и истечения подписок
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Активные подписки</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activeSubscriptions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-6 border border-red-200 dark:border-red-700">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-red-600 dark:text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Истекшие подписки</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{expiredSubscriptions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Всего подписок</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Тест назначения подписки */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Тест назначения подписки
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email пользователя
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тарифный план
            </label>
            <select
              value={testPlanKey}
              onChange={(e) => setTestPlanKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500"
            >
              {plans?.map((plan: any) => (
                <option key={plan.key} value={plan.key}>
                  {plan.name} — {plan.price} ₽
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleTestAssign}
            disabled={assignMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {assignMutation.isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <span>Назначить подписку</span>
          </button>

          <button
            onClick={() => refetchStats()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Обновить данные</span>
          </button>
        </div>
      </div>

      {/* Тест обновления истекших подписок */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Обновление истекших подписок
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Эта функция автоматически обновляет статус подписок, срок которых истек, на 'expired'.
        </p>

        <button
          onClick={() => expireMutation.mutate()}
          disabled={expireMutation.isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {expireMutation.isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          <span>Обновить истекшие подписки</span>
        </button>
      </div>
    </div>
  );
} 