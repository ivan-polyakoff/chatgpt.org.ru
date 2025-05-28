/* eslint-disable */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import axios from 'axios';
import { PencilIcon, CheckIcon, XIcon, LoaderCircle, Loader2, Bot, Info, Sparkles } from 'lucide-react';

interface ModelData {
  planKey: string;
  planName: string;
  allowedModels: string[];
  modelDescriptions?: Record<string, string>;
}

interface EditingState {
  planKey: string;
  models: string;
  descriptions: Record<string, string>;
}

export default function ModelsPage() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  
  // Состояние для редактируемых моделей
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<EditingState>({
    planKey: '',
    models: '',
    descriptions: {}
  });
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
    async ({ planKey, models, descriptions }: { planKey: string; models: string[]; descriptions: Record<string, string> }) => {
      const res = await axios.patch(
        '/api/admin/models',
        { planKey, models, descriptions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    {
      onSuccess: () => {
        showToast({ message: 'Модели и описания успешно обновлены' });
        queryClient.invalidateQueries(['admin-models']);
        setEditingPlan(null);
        setEditingState({ planKey: '', models: '', descriptions: {} });
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
    setEditingState({
      planKey: plan.planKey,
      models: plan.allowedModels.join(', '),
      descriptions: plan.modelDescriptions || {}
    });
  };
  
  // Обработчик изменения описания модели
  const handleDescriptionChange = (modelName: string, description: string) => {
    setEditingState(prev => ({
      ...prev,
      descriptions: {
        ...prev.descriptions,
        [modelName]: description
      }
    }));
  };
  
  // Обработчик сохранения
  const handleSave = (planKey: string) => {
    // Разбиваем строку на массив, удаляем пробелы
    const modelsArray = editingState.models
      .split(',')
      .map(model => model.trim())
      .filter(Boolean);
    
    // Фильтруем описания только для существующих моделей
    const filteredDescriptions: Record<string, string> = {};
    modelsArray.forEach(model => {
      if (editingState.descriptions[model]) {
        filteredDescriptions[model] = editingState.descriptions[model];
      }
    });
    
    updateModelsMutation.mutate({ 
      planKey, 
      models: modelsArray, 
      descriptions: filteredDescriptions 
    });
  };
  
  // Обработчик отмены редактирования
  const handleCancel = () => {
    setEditingPlan(null);
    setEditingState({ planKey: '', models: '', descriptions: {} });
  };

  // Получаем текущие модели для редактирования
  const getCurrentModels = () => {
    return editingState.models
      .split(',')
      .map(model => model.trim())
      .filter(Boolean);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Bot className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
          Управление моделями ИИ
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Настройка доступных моделей и их описаний для каждого тарифного плана
        </p>
      </div>
      
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="flex items-center space-x-2">
            <LoaderCircle className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Загрузка моделей...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">Ошибка загрузки данных: {errorMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {data && (
        <div className="grid gap-6">
          {data.map((plan) => (
            <div 
              key={plan.planKey} 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden"
            >
              {/* Plan Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {plan.planName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ключ плана: <span className="font-mono text-blue-600 dark:text-blue-400">{plan.planKey}</span>
                      </p>
                    </div>
                  </div>
                  
                  {editingPlan !== plan.planKey ? (
                    <button
                      onClick={() => handleEdit(plan)}
                      className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Редактировать</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(plan.planKey)}
                        disabled={updateModelsMutation.isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updateModelsMutation.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckIcon className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">Сохранить</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={updateModelsMutation.isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Отмена</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {editingPlan === plan.planKey ? (
                  <div className="space-y-6">
                    {/* Models Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Доступные модели (через запятую)
                      </label>
                      <textarea
                        value={editingState.models}
                        onChange={(e) => setEditingState(prev => ({ ...prev, models: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500"
                        placeholder="gpt-4-turbo, gpt-4o, gpt-3.5-turbo, claude-3-sonnet"
                        rows={3}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Введите названия моделей через запятую. Описания можно добавить ниже.
                      </p>
                    </div>
                    
                    {/* Model Descriptions */}
                    {getCurrentModels().length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Описания моделей
                        </label>
                        <div className="space-y-4">
                          {getCurrentModels().map((modelName) => (
                            <div key={modelName} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="font-medium text-gray-900 dark:text-white">{modelName}</span>
                              </div>
                              <textarea
                                value={editingState.descriptions[modelName] || ''}
                                onChange={(e) => handleDescriptionChange(modelName, e.target.value)}
                                placeholder={`Описание для модели ${modelName}...`}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 text-sm"
                                rows={2}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Bot className="h-4 w-4 mr-2" />
                        Доступные модели ({plan.allowedModels?.length || 0})
                      </h4>
                      {plan.allowedModels && plan.allowedModels.length > 0 ? (
                        <div className="grid gap-3">
                          {plan.allowedModels.map((model) => (
                            <div
                              key={model}
                              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                      {model}
                                    </span>
                                  </div>
                                  {plan.modelDescriptions?.[model] ? (
                                    <div className="mt-2">
                                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        <Info className="h-3 w-3" />
                                        <span>Описание:</span>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {plan.modelDescriptions[model]}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-1">
                                      Описание не добавлено
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Нет настроенных моделей для этого плана
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Info className="h-6 w-6 text-blue-500 dark:text-blue-400 mt-0.5" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Справка по управлению моделями
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Добавляйте модели через запятую в поле "Доступные модели"</li>
                <li>Описания помогают пользователям выбрать подходящую модель</li>
                <li>Описания отображаются в интерфейсе выбора моделей</li>
                <li>Можно использовать HTML теги для форматирования описаний</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 