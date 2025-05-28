import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import axios from 'axios';
import { 
  PencilIcon, 
  CheckIcon, 
  XIcon, 
  TrashIcon,
  PlusIcon,
  LoaderCircle, 
  Loader2, 
  Bot, 
  Info, 
  Tag,
  BookOpen
} from 'lucide-react';

interface ModelDescription {
  _id: string;
  modelName: string;
  displayName?: string;
  description: string;
  category: string;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface EditingDescription {
  id: string | null;
  modelName: string;
  displayName: string;
  description: string;
  category: string;
  tags: string;
  isActive: boolean;
}

const CATEGORIES = [
  { value: 'gpt-4', label: 'GPT-4', color: 'bg-blue-100 text-blue-800' },
  { value: 'gpt-3.5', label: 'GPT-3.5', color: 'bg-green-100 text-green-800' },
  { value: 'claude', label: 'Claude', color: 'bg-purple-100 text-purple-800' },
  { value: 'gemini', label: 'Gemini', color: 'bg-orange-100 text-orange-800' },
  { value: 'other', label: 'Другие', color: 'bg-gray-100 text-gray-800' },
];

export default function ModelDescriptionsPage() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  
  const [editing, setEditing] = useState<EditingDescription>({
    id: null,
    modelName: '',
    displayName: '',
    description: '',
    category: 'other',
    tags: '',
    isActive: true,
  });
  const [showForm, setShowForm] = useState(false);

  // Запрос данных о описаниях моделей
  const { data: descriptions, isLoading, error } = useQuery(
    ['model-descriptions'],
    async () => {
      const res = await axios.get('/api/admin/model-descriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.descriptions as ModelDescription[];
    }
  );

  // Мутация для создания/обновления описания
  const saveMutation = useMutation(
    async (description: Omit<EditingDescription, 'id'> & { id?: string }) => {
      const { id, ...data } = description;
      const tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const payload = { ...data, tags: tagsArray };

      if (id) {
        const res = await axios.patch(
          `/api/admin/model-descriptions/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
      } else {
        const res = await axios.post(
          '/api/admin/model-descriptions',
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
      }
    },
    {
      onSuccess: (data) => {
        showToast({ message: data.message });
        queryClient.invalidateQueries(['model-descriptions']);
        handleCancel();
      },
      onError: (err: any) => {
        showToast({ message: err.response?.data?.message || 'Ошибка сохранения' });
      },
    }
  );

  // Мутация для удаления описания
  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await axios.delete(`/api/admin/model-descriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        showToast({ message: data.message });
        queryClient.invalidateQueries(['model-descriptions']);
      },
      onError: (err: any) => {
        showToast({ message: err.response?.data?.message || 'Ошибка удаления' });
      },
    }
  );

  const handleEdit = (description: ModelDescription) => {
    setEditing({
      id: description._id,
      modelName: description.modelName,
      displayName: description.displayName || '',
      description: description.description,
      category: description.category,
      tags: description.tags.join(', '),
      isActive: description.isActive,
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditing({
      id: null,
      modelName: '',
      displayName: '',
      description: '',
      category: 'other',
      tags: '',
      isActive: true,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!editing.modelName || !editing.description) {
      showToast({ message: 'Заполните обязательные поля' });
      return;
    }
    saveMutation.mutate(editing);
  };

  const handleCancel = () => {
    setEditing({
      id: null,
      modelName: '',
      displayName: '',
      description: '',
      category: 'other',
      tags: '',
      isActive: true,
    });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить это описание?')) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(cat => cat.value === category) || CATEGORIES[4];
  };

  const groupedDescriptions = descriptions?.reduce((acc, desc) => {
    if (!acc[desc.category]) {
      acc[desc.category] = [];
    }
    acc[desc.category].push(desc);
    return acc;
  }, {} as Record<string, ModelDescription[]>) || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
            Описания моделей
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Централизованное управление описаниями моделей ИИ
          </p>
        </div>
        
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Добавить описание</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="flex items-center space-x-2">
            <LoaderCircle className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Загрузка описаний...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-md">
          <div className="flex items-center">
            <XIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">Ошибка загрузки данных</p>
            </div>
          </div>
        </div>
      )}

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editing.id ? 'Редактировать описание' : 'Создать описание'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Название модели *
              </label>
              <input
                type="text"
                value={editing.modelName}
                onChange={(e) => setEditing(prev => ({ ...prev, modelName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="gpt-4o-latest"
                disabled={!!editing.id}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Отображаемое название
              </label>
              <input
                type="text"
                value={editing.displayName}
                onChange={(e) => setEditing(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="GPT-4o Latest"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Категория
              </label>
              <select
                value={editing.category}
                onChange={(e) => setEditing(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Теги (через запятую)
              </label>
              <input
                type="text"
                value={editing.tags}
                onChange={(e) => setEditing(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="быстрая, точная, новая"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Описание *
            </label>
            <textarea
              value={editing.description}
              onChange={(e) => setEditing(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Подробное описание возможностей модели..."
            />
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="isActive"
              checked={editing.isActive}
              onChange={(e) => setEditing(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Активное описание
            </label>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saveMutation.isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saveMutation.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              <span>Сохранить</span>
            </button>
            
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <XIcon className="h-4 w-4" />
              <span>Отмена</span>
            </button>
          </div>
        </div>
      )}

      {/* Список описаний */}
      {descriptions && Object.keys(groupedDescriptions).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedDescriptions).map(([category, items]) => {
            const categoryInfo = getCategoryInfo(category);
            return (
              <div key={category} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bot className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {categoryInfo.label}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryInfo.color}`}>
                        {items.length}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((desc) => (
                    <div key={desc._id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              {desc.displayName || desc.modelName}
                            </h4>
                            {desc.displayName && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                ({desc.modelName})
                              </span>
                            )}
                            {!desc.isActive && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Неактивно
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                            {desc.description}
                          </p>
                          
                          {desc.tags.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <Tag className="h-3 w-3 text-gray-400" />
                              <div className="flex flex-wrap gap-1">
                                {desc.tags.map((tag, index) => (
                                  <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(desc)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(desc._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Справка */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="h-6 w-6 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="ml-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Централизованные описания моделей
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• Создавайте описания один раз и используйте во всех тарифах</p>
              <p>• Описания автоматически подтягиваются в селектор моделей</p>
              <p>• Используйте категории для группировки похожих моделей</p>
              <p>• Теги помогают пользователям быстро найти нужную модель</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 