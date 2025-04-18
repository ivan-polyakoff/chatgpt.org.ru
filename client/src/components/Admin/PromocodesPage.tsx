/* eslint-disable */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { Tag, Plus, Save, Edit, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function PromocodesPage() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(['admin-promocodes'], async () => {
    const res = await fetch('/api/admin/promocodes', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Ошибка при загрузке промокодов');
    return res.json();
  });

  const createMutation = useMutation(
    async ({ code, discountPercent, maxUses }: any) => {
      const res = await fetch('/api/admin/promocodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, discountPercent, maxUses }),
      });
      if (!res.ok) throw new Error('Ошибка создания промокода');
      return res.json();
    },
    { 
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-promocodes']);
        setNewCode('');
        setNewDiscount(10);
        setNewMax(1);
      } 
    }
  );

  const updateMutation = useMutation(
    async ({ id, discountPercent, maxUses, usesCount }: any) => {
      const res = await fetch(`/api/admin/promocodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ discountPercent, maxUses, usesCount }),
      });
      if (!res.ok) throw new Error('Ошибка обновления');
      return res.json();
    },
    { onSuccess: () => queryClient.invalidateQueries(['admin-promocodes']) }
  );

  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState(10);
  const [newMax, setNewMax] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editMax, setEditMax] = useState(0);
  const [editUses, setEditUses] = useState(0);

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 my-4 rounded">
      <div className="flex items-center">
        <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
        <p className="text-red-600 dark:text-red-400">{(error as Error).message}</p>
      </div>
    </div>
  );

  const { promoCodes } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Tag className="mr-2 h-6 w-6" />
            Промокоды
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Управление промокодами и скидками для пользователей
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          Всего: {promoCodes.length}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Создать промокод
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ code: newCode.trim().toUpperCase(), discountPercent: newDiscount, maxUses: newMax });
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Код</label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="SUMMER2024"
              required
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Скидка, %</label>
            <input
              type="number"
              value={newDiscount}
              onChange={(e) => setNewDiscount(Number(e.target.value))}
              placeholder="10"
              min={1}
              max={100}
              required
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Макс. использований</label>
            <input
              type="number"
              value={newMax}
              onChange={(e) => setNewMax(Number(e.target.value))}
              placeholder="1"
              min={1}
              required
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="flex items-center w-full justify-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {createMutation.isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать
                </>
              )}
            </button>
          </div>
        </form>
        {createMutation.isSuccess && (
          <div className="mt-3 flex items-center text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 mr-1" />
            Промокод успешно создан
          </div>
        )}
        {createMutation.isError && (
          <div className="mt-3 flex items-center text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            {(createMutation.error as Error).message}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Код</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Скидка %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Макс. использ.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Активировано</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {promoCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Нет доступных промокодов
                  </td>
                </tr>
              ) : (
                promoCodes.map((p: any) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{p.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                        {p.discountPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{p.maxUses}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (p.usesCount / p.maxUses * 100))}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{p.usesCount}/{p.maxUses}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editId === p._id ? (
                        <div className="flex space-x-2 items-center">
                          <div>
                            <label className="sr-only">Скидка</label>
                            <input
                              type="number"
                              value={editDiscount}
                              onChange={(e) => setEditDiscount(Number(e.target.value))}
                              className="w-16 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 rounded text-sm"
                              min={1}
                              max={100}
                            />
                          </div>
                          <div>
                            <label className="sr-only">Макс.</label>
                            <input
                              type="number"
                              value={editMax}
                              onChange={(e) => setEditMax(Number(e.target.value))}
                              className="w-16 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 rounded text-sm"
                              min={1}
                            />
                          </div>
                          <div>
                            <label className="sr-only">Использовано</label>
                            <input
                              type="number"
                              value={editUses}
                              onChange={(e) => setEditUses(Number(e.target.value))}
                              className="w-16 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 rounded text-sm"
                              min={0}
                              max={editMax}
                            />
                          </div>
                          <button
                            onClick={() => {
                              updateMutation.mutate({
                                id: p._id,
                                discountPercent: editDiscount,
                                maxUses: editMax,
                                usesCount: editUses,
                              });
                              setEditId(null);
                            }}
                            disabled={updateMutation.isLoading}
                            className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setEditId(null)} 
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditId(p._id);
                            setEditDiscount(p.discountPercent);
                            setEditMax(p.maxUses);
                            setEditUses(p.usesCount);
                          }}
                          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Редактировать
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 