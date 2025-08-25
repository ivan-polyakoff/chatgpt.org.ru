import React, { useMemo } from 'react';
import type { ModelSelectorProps } from '~/common';
import { ModelSelectorProvider, useModelSelectorContext } from './ModelSelectorContext';
import { renderModelSpecs, renderEndpoints, renderSearchResults } from './components';
import { getSelectedIcon, getDisplayValue } from './utils';
import { CustomMenu as Menu } from './CustomMenu';
import DialogManager from './DialogManager';
import { useLocalize } from '~/hooks';

function ModelSelectorContent() {
  const localize = useLocalize();

  const {
    // LibreChat
    modelSpecs,
    mappedEndpoints,
    endpointsConfig,
    // State
    searchValue,
    searchResults,
    selectedValues,
    // Subscription
    userSubscription,
    isLoadingSubscription,

    // Functions
    setSearchValue,
    setSelectedValues,
    getFilteredModels,
    // Dialog
    keyDialogOpen,
    onOpenChange,
    keyDialogEndpoint,
  } = useModelSelectorContext();

  const selectedIcon = useMemo(
    () =>
      getSelectedIcon({
        mappedEndpoints: mappedEndpoints ?? [],
        selectedValues,
        modelSpecs,
        endpointsConfig,
      }),
    [mappedEndpoints, selectedValues, modelSpecs, endpointsConfig],
  );
  const selectedDisplayValue = useMemo(
    () =>
      getDisplayValue({
        localize,
        modelSpecs,
        selectedValues,
        mappedEndpoints,
      }),
    [localize, modelSpecs, selectedValues, mappedEndpoints],
  );

  // Фильтруем доступные эндпоинты, чтобы применить ограничения на модели OpenAI
  const filteredEndpoints = useMemo(() => {
    if (!mappedEndpoints) {
      return [];
    }

    // Для эндпоинтов без моделей изменений нет
    return mappedEndpoints.filter((endpoint) => {
      // Отключаем Agents и Plugins
      return (endpoint.value !== 'agents' && endpoint.value !== 'gptPlugins');
    }).map(endpoint => {
      if (!endpoint.hasModels || endpoint.value !== 'openAI') {
        return endpoint;
      }

      // Для OpenAI фильтруем доступные модели в зависимости от подписки
      const modelNames = endpoint.models ? endpoint.models.map(model => model.name) : [];
      const filteredModelNames = getFilteredModels('openAI', modelNames);
      
      // Преобразуем обратно в формат моделей
      const filteredModels = endpoint.models?.filter(model => 
        filteredModelNames.includes(model.name)
      ) || [];
      
      return {
        ...endpoint,
        models: filteredModels,
      };
    });
  }, [mappedEndpoints, getFilteredModels]);

  const trigger = (
    <button
      className="my-1 flex h-10 w-full max-w-[70vw] items-center justify-center gap-2 rounded-xl border border-border-light bg-surface-secondary px-3 py-2 text-sm text-text-primary hover:bg-surface-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      aria-label={localize('com_ui_select_model')}
    >
      {selectedIcon && React.isValidElement(selectedIcon) && (
        <div className="flex flex-shrink-0 items-center justify-center overflow-hidden">
          {selectedIcon}
        </div>
      )}
      <span className="flex-grow truncate text-left">{selectedDisplayValue}</span>
    </button>
  );

  // Показываем состояние загрузки если загружаем данные о подписке
  if (isLoadingSubscription) {
    return (
      <div className="relative flex w-full max-w-md flex-col items-center gap-2">
        <div className="flex w-full items-center justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex w-full max-w-md flex-col items-center gap-2">
      <Menu
        values={selectedValues}
        onValuesChange={(values: Record<string, any>) => {
          setSelectedValues({
            endpoint: values.endpoint || '',
            model: values.model || '',
            modelSpec: values.modelSpec || '',
          });
        }}
        onSearch={(value) => setSearchValue(value)}
        combobox={<input placeholder={localize('com_endpoint_search_models')} />}
        trigger={trigger}
      >
        {searchResults ? (
          renderSearchResults(searchResults, localize, searchValue)
        ) : (
          <>
            {renderModelSpecs(modelSpecs, selectedValues.modelSpec || '')}
            {renderEndpoints(filteredEndpoints)}
          </>
        )}
      </Menu>
      <DialogManager
        keyDialogOpen={keyDialogOpen}
        onOpenChange={onOpenChange}
        endpointsConfig={endpointsConfig || {}}
        keyDialogEndpoint={keyDialogEndpoint || undefined}
      />
    </div>
  );
}

export default function ModelSelector({ startupConfig }: ModelSelectorProps) {
  return (
    <ModelSelectorProvider startupConfig={startupConfig}>
      <ModelSelectorContent />
    </ModelSelectorProvider>
  );
}