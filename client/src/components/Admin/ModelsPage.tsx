/* eslint-disable */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import axios from 'axios';
import { PencilIcon, CheckIcon, XIcon, LoaderCircle, Loader2 } from 'lucide-react';

interface ModelData {
  planKey: string;
  planName: string;
  allowedModels: string[];
}

export default function ModelsPage() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  
  // Состояние для редактируемых моделей
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editedModels, setEditedModels] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Запрос данных о моделях
  const { data, isLoading, error } = useQuery(
    ['admin-models'],
    async () => {
      const res = await axios.get('/api/admin/models', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.modelsData as ModelData[];
    },
    {
      onError: (err: any) => {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else if (typeof err === 'string') {
          setErrorMessage(err);
        } else {
          setErrorMessage('Ошибка загрузки данных');
        }
      }
    }
  );
  
  // Мутация для обновления моделей
  const updateModelsMutation = useMutation(
    async ({ planKey, models }: { planKey: string; models: string[] }) => {
      const res = await axios.patch(
        '/api/admin/models',
        { planKey, models },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    {
      onSuccess: () => {
        showToast({ message: 'Модели успешно обновлены' });
        queryClient.invalidateQueries(['admin-models']);
        setEditingPlan(null);
        setEditedModels('');
      },
      onError: (err: any) => {
        showToast({
          message: err.response?.data?.message || 'Ошибка обновления моделей'
        });
      }
    }
  );
  
  // Обработчик начала редактирования
  const handleEdit = (plan: ModelData) => {
    setEditingPlan(plan.planKey);
    setEditedModels(plan.allowedModels.join(', '));
  };
  
  // Обработчик сохранения
  const handleSave = (planKey: string) => {
    // Разбиваем строку на массив, удаляем пробелы
    const modelsArray = editedModels
      .split(',')
      .map(model => model.trim())
      .filter(Boolean);
    
    updateModelsMutation.mutate({ planKey, models: modelsArray });
  };
  
  // Обработчик отмены редактирования
  const handleCancel = () => {
    setEditingPlan(null);
    setEditedModels('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Управление моделями</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Настройка доступных моделей для каждого тарифного плана
        </p>
      </div>
      
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Ошибка загрузки данных: {errorMessage}
        </div>
      )}
      
      {data && (
        <div className="grid gap-4">
          {data.map((plan) => (
            <div 
              key={plan.planKey} 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">
                  План: {plan.planName} <span className="text-gray-500 dark:text-gray-400 text-sm">({plan.planKey})</span>
                </h3>
                
                {editingPlan !== plan.planKey ? (
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSave(plan.planKey)}
                      disabled={updateModelsMutation.isLoading}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full disabled:opacity-50"
                    >
                      {updateModelsMutation.isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={updateModelsMutation.isLoading}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full disabled:opacity-50"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              
              {editingPlan === plan.planKey ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Доступные модели (через запятую):
                  </label>
                  <textarea
                    value={editedModels}
                    onChange={(e) => setEditedModels(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="gpt-4-turbo, gpt-4o, gpt-3.5-turbo"
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Введите названия моделей через запятую, например: gpt-4-turbo, gpt-4o, gpt-3.5-turbo
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Доступные модели:</div>
                  {plan.allowedModels && plan.allowedModels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {plan.allowedModels.map((model) => (
                        <span
                          key={model}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                      Нет настроенных моделей
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 