import { useState, useEffect, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { SearchIcon, BrainCircuitIcon } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { useChatContext } from '~/Providers';
import CheckboxButton from '~/components/ui/CheckboxButton';
import store from '~/store';

// Хранит предыдущую модель, когда включен режим поиска или размышлений
const previousModelState = {
  model: '',
  endpoint: '',
};

const SearchAndThinkingButtons = ({ conversationId }: { conversationId?: string | null }) => {
  const localize = useLocalize();
  const { conversation, setConversation } = useChatContext();
  
  // Состояния для кнопок
  const [searchMode, setSearchMode] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);

  // Константы моделей
  const PERPLEXITY_MODEL = 'searchgpt-latest';
  const PERPLEXITY_ENDPOINT = 'openAI';
  const THINKING_MODEL = 'o3';
  const THINKING_ENDPOINT = 'openAI';

  // Сохраняем текущую модель, если она ещё не сохранена
  const saveCurrentModel = useCallback(() => {
    if (!previousModelState.model || !previousModelState.endpoint) {
      previousModelState.model = conversation?.model || '';
      previousModelState.endpoint = conversation?.endpoint || '';
      console.log('Сохранена текущая модель:', previousModelState.model);
    }
  }, [conversation]);

  // Восстанавливаем предыдущую модель
  const restorePreviousModel = useCallback(() => {
    // Проверяем, что сохраненная модель существует
    if (previousModelState.model && previousModelState.endpoint) {
      setConversation((prev) => ({
        ...prev,
        model: previousModelState.model,
        endpoint: previousModelState.endpoint,
      }));
      console.log('Восстановлена модель:', previousModelState.model);
    }
  }, [setConversation]);

  // Обработчик для кнопки "Поиск"
  const handleSearchToggle = useCallback((isChecked: boolean) => {
    if (isChecked) {
      // Если включаем режим поиска
      if (!searchMode && !thinkingMode) {
        // Если ранее ни один режим не был активен, сохраняем текущую модель
        saveCurrentModel();
      }
      
      // Деактивируем режим размышлений, если он был активен
      if (thinkingMode) {
        setThinkingMode(false);
      }
      
      // Устанавливаем модель Perplexity
      setConversation((prev) => ({
        ...prev,
        model: PERPLEXITY_MODEL,
        endpoint: PERPLEXITY_ENDPOINT,
      }));
      
      setSearchMode(true);
      console.log('Режим поиска активирован, модель переключена на Perplexity');
    } else {
      // Если выключаем режим поиска
      setSearchMode(false);
      
      // Восстанавливаем предыдущую модель только если режим размышлений тоже не активен
      if (!thinkingMode) {
        restorePreviousModel();
        // Очищаем сохраненную модель после восстановления
        previousModelState.model = '';
        previousModelState.endpoint = '';
      }
    }
  }, [searchMode, thinkingMode, setConversation, saveCurrentModel, restorePreviousModel]);

  // Обработчик для кнопки "Размышления"
  const handleThinkingToggle = useCallback((isChecked: boolean) => {
    if (isChecked) {
      // Если включаем режим размышлений
      if (!searchMode && !thinkingMode) {
        // Если ранее ни один режим не был активен, сохраняем текущую модель
        saveCurrentModel();
      }
      
      // Деактивируем режим поиска, если он был активен
      if (searchMode) {
        setSearchMode(false);
      }
      
      // Устанавливаем модель o3
      setConversation((prev) => ({
        ...prev,
        model: THINKING_MODEL,
        endpoint: THINKING_ENDPOINT,
      }));
      
      setThinkingMode(true);
      console.log('Режим размышлений активирован, модель переключена на o3');
    } else {
      // Если выключаем режим размышлений
      setThinkingMode(false);
      
      // Восстанавливаем предыдущую модель только если режим поиска тоже не активен
      if (!searchMode) {
        restorePreviousModel();
        // Очищаем сохраненную модель после восстановления
        previousModelState.model = '';
        previousModelState.endpoint = '';
      }
    }
  }, [searchMode, thinkingMode, setConversation, saveCurrentModel, restorePreviousModel]);

  useEffect(() => {
    // Сбрасываем состояния при изменении conversationId
    if (conversationId) {
      setSearchMode(false);
      setThinkingMode(false);
      // Очищаем сохраненную модель при смене разговора
      previousModelState.model = '';
      previousModelState.endpoint = '';
    }
  }, [conversationId]);

  return (
    <div className="flex space-x-2">
      <CheckboxButton
        className="max-w-fit"
        defaultChecked={searchMode}
        setValue={handleSearchToggle}
        label={localize('com_search_mode')}
        isCheckedClassName="border-blue-600/40 bg-blue-500/10 hover:bg-blue-700/10"
        icon={<SearchIcon className="icon-md" />}
      />
      <CheckboxButton
        className="max-w-fit"
        defaultChecked={thinkingMode}
        setValue={handleThinkingToggle}
        label={localize('com_thinking_mode')}
        isCheckedClassName="border-purple-600/40 bg-purple-500/10 hover:bg-purple-700/10"
        icon={<BrainCircuitIcon className="icon-md" />}
      />
    </div>
  );
};

export default SearchAndThinkingButtons; 