/* eslint-disable */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import axios from 'axios';
import * as Dialog from '@radix-ui/react-dialog';

// Страница админки для назначения подписки пользователю по email
export default function SubscriptionsPage() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const localize = useLocalize();
  const queryClient = useQueryClient();

  // Загружаем списки тарифов
  const { data: plans, isLoading: loadingPlans, error: plansError } = useQuery(
    ['subscription-plans'],
    async () => {
      const res = await axios.get('/api/subscriptions', { headers: { Authorization: `Bearer ${token}` } });
      return res.data.plans;
    }
  );

  const [email, setEmail] = useState('');
  const [planKey, setPlanKey] = useState('');

  const assignMutation = useMutation(
    async () => {
      const res = await axios.post(
        '/api/admin/assign-subscription',
        { email, planKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    {
      onSuccess: () => {
        showToast({ message: 'Подписка успешно назначена' });
        queryClient.invalidateQueries(['subscription-plans']);
        setEmail('');
        setPlanKey('');
      },
      onError: (err: any) => {
        showToast({ message: err.response?.data?.message || 'Ошибка назначения подписки' });
      },
    }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Подписки</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Назначьте тариф пользователю по email</p>

      {loadingPlans && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
        </div>
      )}
      {plansError && (
        <div className="text-red-600">Ошибка загрузки тарифов: {(plansError as Error).message}</div>
      )}

      {!loadingPlans && plans && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email пользователя</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Тарифный план</label>
            <select
              value={planKey}
              onChange={(e) => setPlanKey(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Выберите план</option>
              {plans.map((plan: any) => (
                <option key={plan.key} value={plan.key}>
                  {plan.name} — {plan.price} ₽ / {plan.durationDays || '∞'} дней
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={() => assignMutation.mutate()}
          disabled={!email || !planKey || assignMutation.isLoading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {assignMutation.isLoading ? 'Назначение...' : 'Назначить подписку'}
        </button>
      </div>
    </div>
  );
} 