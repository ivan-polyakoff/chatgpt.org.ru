import React from 'react';
import { EarthIcon, Lock, CheckCircle } from 'lucide-react';
import { isAgentsEndpoint, isAssistantsEndpoint } from 'librechat-data-provider';
import type { Endpoint } from '~/common';
import { useModelSelectorContext } from '../ModelSelectorContext';
import { CustomMenuItem as MenuItem } from '../CustomMenu';
import { TooltipAnchor } from '~/components';
import { useLocalize } from '~/hooks';

interface EndpointModelItemProps {
  modelId: string | null;
  endpoint: Endpoint;
  isSelected: boolean;
}

export default function EndpointModelItem({ modelId, endpoint, isSelected }: EndpointModelItemProps) {
  const localize = useLocalize();
  const { handleSelectModel, userSubscription, modelDescriptions } = useModelSelectorContext();

  if (!modelId) {
    return null;
  }

  // Получаем описание модели из централизованной системы
  const modelDescription = modelDescriptions[modelId];

  // Получаем доступные модели из подписки
  const allowedModels = userSubscription?.subscription?.plan?.allowedModels || [];
  const isAvailableForSubscription = endpoint.value !== 'openAI' || allowedModels.includes(modelId);

  let modelName = modelId;
  let avatarUrl = '';
  let isGlobal = false;

  // Используем отображаемое название из описания, если есть
  if (modelDescription?.displayName) {
    modelName = modelDescription.displayName;
  }

  // Получаем URL аватара для модели
  if (endpoint.modelIcons && endpoint.modelIcons[modelId]) {
    avatarUrl = endpoint.modelIcons[modelId] || '';
  }

  // Получаем информацию о модели из эндпоинта
  const modelInfo = endpoint?.models?.find((m) => m.name === modelId);
  isGlobal = modelInfo?.isGlobal ?? false;

  // Используем кастомные имена если доступны
  if (endpoint && modelId && isAgentsEndpoint(endpoint.value) && endpoint.agentNames?.[modelId]) {
    modelName = endpoint.agentNames[modelId];
    const modelInfo = endpoint?.models?.find((m) => m.name === modelId);
    isGlobal = modelInfo?.isGlobal ?? false;
  } else if (
    endpoint &&
    modelId &&
    isAssistantsEndpoint(endpoint.value) &&
    endpoint.assistantNames?.[modelId]
  ) {
    modelName = endpoint.assistantNames[modelId];
  }

  return (
    <MenuItem
      key={modelId}
      onClick={() => isAvailableForSubscription && handleSelectModel(endpoint, modelId ?? '')}
      className={`group relative w-full px-3 py-2.5 rounded-lg border transition-all duration-200 ${
        isAvailableForSubscription
          ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600'
          : 'cursor-not-allowed opacity-60'
      } ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-600 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Аватар модели или иконка эндпоинта */}
          {avatarUrl ? (
            <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden">
              <img src={avatarUrl} alt={modelName} className="w-full h-full object-cover" />
            </div>
          ) : (isAgentsEndpoint(endpoint.value) || isAssistantsEndpoint(endpoint.value)) && endpoint.icon ? (
            <div className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
              {endpoint.icon}
            </div>
          ) : null}
          
          {/* Название модели */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className={`font-medium truncate ${
                isSelected 
                  ? 'text-blue-900 dark:text-blue-100' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {modelName}
              </span>
              
              {/* Показываем техническое название, если используется displayName */}
              {modelDescription?.displayName && modelDescription.displayName !== modelId && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                  ({modelId})
                </span>
              )}
              
              {/* Статусы */}
              <div className="flex items-center space-x-1">
                {isGlobal && (
                  <EarthIcon className="w-4 h-4 text-green-500 dark:text-green-400" />
                )}
                {isSelected && (
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
            </div>
            
            {/* Описание модели из централизованной системы */}
            {modelDescription?.description && (
              <p className={`text-xs mt-1 leading-relaxed ${
                isSelected 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {modelDescription.description}
              </p>
            )}
            
            {/* Теги модели */}
            {modelDescription?.tags && modelDescription.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {modelDescription.tags.slice(0, 2).map((tag: string, index: number) => (
                  <span 
                    key={index} 
                    className={`px-1.5 py-0.5 text-xs rounded text-nowrap ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
                {modelDescription.tags.length > 2 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    +{modelDescription.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Иконка блокировки для недоступных моделей */}
        {!isAvailableForSubscription && (
          <TooltipAnchor
            description="Модель недоступна в вашем тарифном плане"
            render={
              <div className="flex-shrink-0 ml-2">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            }
          />
        )}
      </div>
    </MenuItem>
  );
}

export function renderEndpointModels(
  endpoint: Endpoint | null,
  models: Array<{ name: string; isGlobal?: boolean }>,
  selectedModel: string | null,
  filteredModels?: string[],
) {
  const modelsToRender = filteredModels || models.map((model) => model.name);

  return modelsToRender.map(
    (modelId) =>
      endpoint && (
        <EndpointModelItem
          key={modelId}
          modelId={modelId}
          endpoint={endpoint}
          isSelected={selectedModel === modelId}
        />
      ),
  );
}
