import debounce from 'lodash/debounce';
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { isAgentsEndpoint, isAssistantsEndpoint } from 'librechat-data-provider';
import type * as t from 'librechat-data-provider';
import type { Endpoint, SelectedValues } from '~/common';
import { useAgentsMapContext, useAssistantsMapContext, useChatContext } from '~/Providers';
import { useEndpoints, useSelectorEffects, useKeyDialog } from '~/hooks';
import useSelectMention from '~/hooks/Input/useSelectMention';
import { useGetEndpointsQuery, useGetUserSubscriptionQuery } from '~/data-provider';
import { filterItems } from './utils';

type ModelSelectorContextType = {
  // State
  searchValue: string;
  selectedValues: SelectedValues;
  endpointSearchValues: Record<string, string>;
  searchResults: (t.TModelSpec | Endpoint)[] | null;
  // LibreChat
  modelSpecs: t.TModelSpec[];
  mappedEndpoints: Endpoint[];
  agentsMap: t.TAgentsMap | undefined;
  assistantsMap: t.TAssistantsMap | undefined;
  endpointsConfig: t.TEndpointsConfig;
  // Subscription
  allowedModels: string[];

  // Functions
  endpointRequiresUserKey: (endpoint: string) => boolean;
  setSelectedValues: React.Dispatch<React.SetStateAction<SelectedValues>>;
  setSearchValue: (value: string) => void;
  setEndpointSearchValue: (endpoint: string, value: string) => void;
  handleSelectSpec: (spec: t.TModelSpec) => void;
  handleSelectEndpoint: (endpoint: Endpoint) => void;
  handleSelectModel: (endpoint: Endpoint, model: string) => void;
} & ReturnType<typeof useKeyDialog>;

const ModelSelectorContext = createContext<ModelSelectorContextType | undefined>(undefined);

export function useModelSelectorContext() {
  const context = useContext(ModelSelectorContext);
  if (context === undefined) {
    throw new Error('useModelSelectorContext must be used within a ModelSelectorProvider');
  }
  return context;
}

interface ModelSelectorProviderProps {
  children: React.ReactNode;
  startupConfig: t.TStartupConfig | undefined;
}

export function ModelSelectorProvider({ children, startupConfig }: ModelSelectorProviderProps) {
  const agentsMap = useAgentsMapContext();
  const assistantsMap = useAssistantsMapContext();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const { data: userSubscription } = useGetUserSubscriptionQuery();
  const { conversation, newConversation } = useChatContext();
  const modelSpecs = useMemo(() => startupConfig?.modelSpecs?.list ?? [], [startupConfig]);
  const { mappedEndpoints, endpointRequiresUserKey } = useEndpoints({
    agentsMap,
    assistantsMap,
    startupConfig,
    endpointsConfig,
  });
  const { onSelectEndpoint, onSelectSpec } = useSelectMention({
    // presets,
    modelSpecs,
    assistantsMap,
    endpointsConfig,
    newConversation,
    returnHandlers: true,
  });

  // Получаем список разрешенных моделей из подписки пользователя
  const allowedModels = useMemo(() => {
    if (!userSubscription || !userSubscription.subscription) {
      console.log('[ModelSelectorContext] No subscription data found, using default models');
      return [];
    }
    
    // Для авторизованных пользователей возвращаем модели из их тарифного плана
    const planModels = userSubscription.subscription.plan.allowedModels || [];
    console.log('[ModelSelectorContext] Subscription data found:', userSubscription.subscription.plan.key);
    console.log('[ModelSelectorContext] Allowed models:', planModels);
    
    return planModels;
  }, [userSubscription]);

  // Проверяем содержание моделей в allowedModels для отладки
  useEffect(() => {
    console.log('[ModelSelectorContext] Current allowed models:', allowedModels);
  }, [allowedModels]);

  // Фильтруем доступные эндпоинты на основе разрешенных моделей
  const filteredEndpoints = useMemo(() => {
    console.log('[ModelSelectorContext] Allowed models for filtering:', allowedModels);
    console.log('[ModelSelectorContext] Available endpoints:', mappedEndpoints);
    
    // Если нет списка разрешенных моделей или он пуст,
    // показываем все модели без фильтрации
    if (!mappedEndpoints || !allowedModels || allowedModels.length === 0) {
      console.log('[ModelSelectorContext] Showing all models - no filter applied');
      return mappedEndpoints;
    }

    // Применяем фильтрацию к моделям
    const filtered = mappedEndpoints.map(endpoint => {
      if (!endpoint.models || !endpoint.models.length) {
        return endpoint;
      }

      console.log(`[ModelSelectorContext] Filtering models for endpoint: ${endpoint.label || endpoint.value}`);
      
      // Фильтруем модели для этого эндпоинта
      const filteredModels = endpoint.models.filter((model) => {
        if (model && typeof model === 'object') {
          // Поддерживаем объекты с полем value или name
          let modelValue = '';
          if ('value' in model) {
            modelValue = String(model.value);
          } else if ('name' in model) {
            modelValue = String((model as any).name);
          }
          // Проверяем, есть ли модель в списке разрешенных
          const isAllowed = modelValue && allowedModels.includes(modelValue);
          console.log(`[ModelSelectorContext] Model ${modelValue} allowed:`, isAllowed);
          return isAllowed;
        }
        return false;
      });

      console.log(`[ModelSelectorContext] Filtered models for endpoint ${endpoint.label || endpoint.value}:`, filteredModels);
      
      return {
        ...endpoint,
        models: filteredModels,
      };
    });
    
    console.log('[ModelSelectorContext] Final filtered endpoints:', filtered);
    return filtered;
  }, [mappedEndpoints, allowedModels]);

  // State
  const [selectedValues, setSelectedValues] = useState<SelectedValues>({
    endpoint: conversation?.endpoint || '',
    model: conversation?.model || '',
    modelSpec: conversation?.spec || '',
  });
  useSelectorEffects({
    agentsMap,
    conversation,
    assistantsMap,
    setSelectedValues,
  });

  const [searchValue, setSearchValueState] = useState('');
  const [endpointSearchValues, setEndpointSearchValues] = useState<Record<string, string>>({});

  const keyProps = useKeyDialog();

  // Memoized search results
  const searchResults = useMemo(() => {
    if (!searchValue) {
      return null;
    }
    const allItems = [...modelSpecs, ...filteredEndpoints];
    return filterItems(allItems, searchValue, agentsMap, assistantsMap || {});
  }, [searchValue, modelSpecs, filteredEndpoints, agentsMap, assistantsMap]);

  // Functions
  const setDebouncedSearchValue = useMemo(
    () =>
      debounce((value: string) => {
        setSearchValueState(value);
      }, 200),
    [],
  );
  const setEndpointSearchValue = (endpoint: string, value: string) => {
    setEndpointSearchValues((prev) => ({
      ...prev,
      [endpoint]: value,
    }));
  };

  const handleSelectSpec = (spec: t.TModelSpec) => {
    let model = spec.preset.model ?? null;
    onSelectSpec?.(spec);
    if (isAgentsEndpoint(spec.preset.endpoint)) {
      model = spec.preset.agent_id ?? '';
    } else if (isAssistantsEndpoint(spec.preset.endpoint)) {
      model = spec.preset.assistant_id ?? '';
    }
    setSelectedValues({
      endpoint: spec.preset.endpoint,
      model,
      modelSpec: spec.name,
    });
  };

  const handleSelectEndpoint = (endpoint: Endpoint) => {
    if (!endpoint.hasModels) {
      if (endpoint.value) {
        onSelectEndpoint?.(endpoint.value);
      }
      setSelectedValues({
        endpoint: endpoint.value,
        model: '',
        modelSpec: '',
      });
    }
  };

  const handleSelectModel = (endpoint: Endpoint, model: string) => {
    if (isAgentsEndpoint(endpoint.value)) {
      onSelectEndpoint?.(endpoint.value, {
        agent_id: model,
        model: agentsMap?.[model]?.model ?? '',
      });
    } else if (isAssistantsEndpoint(endpoint.value)) {
      onSelectEndpoint?.(endpoint.value, {
        assistant_id: model,
        model: assistantsMap?.[endpoint.value]?.[model]?.model ?? '',
      });
    } else if (endpoint.value) {
      onSelectEndpoint?.(endpoint.value, { model });
    }
    setSelectedValues({
      endpoint: endpoint.value,
      model,
      modelSpec: '',
    });
  };

  const value = {
    // State
    searchValue,
    searchResults,
    selectedValues,
    endpointSearchValues,
    // LibreChat
    agentsMap,
    modelSpecs,
    assistantsMap,
    mappedEndpoints: filteredEndpoints, // Используем отфильтрованные эндпоинты
    endpointsConfig,
    // Subscription
    allowedModels,

    // Functions
    handleSelectSpec,
    handleSelectModel,
    setSelectedValues,
    handleSelectEndpoint,
    setEndpointSearchValue,
    endpointRequiresUserKey,
    setSearchValue: setDebouncedSearchValue,
    // Dialog
    ...keyProps,
  };

  return <ModelSelectorContext.Provider value={value}>{children}</ModelSelectorContext.Provider>;
}
