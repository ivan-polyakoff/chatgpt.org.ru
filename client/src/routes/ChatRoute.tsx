import { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Constants, EModelEndpoint } from 'librechat-data-provider';
import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import type { TPreset } from 'librechat-data-provider';
import {
  useGetConvoIdQuery,
  useHealthCheck,
  useGetEndpointsQuery,
  useGetStartupConfig,
} from '~/data-provider';
import { useNewConvo, useAppStartup, useAssistantListMap } from '~/hooks';
import { getDefaultModelSpec, getModelSpecIconURL } from '~/utils';
import { ToolCallsMapProvider } from '~/Providers';
import ChatView from '~/components/Chat/ChatView';
import useAuthRedirect from './useAuthRedirect';
import temporaryStore from '~/store/temporary';
import { Spinner } from '~/components/svg';
import { useRecoilCallback } from 'recoil';
import store from '~/store';

export default function ChatRoute() {
  useHealthCheck();
  const { data: startupConfig } = useGetStartupConfig();
  const { isAuthenticated, user } = useAuthRedirect();
  const setIsTemporary = useRecoilCallback(
    ({ set }) =>
      (value: boolean) => {
        set(temporaryStore.isTemporary, value);
      },
    [],
  );
  useAppStartup({ startupConfig, user });

  const index = 0;
  const { conversationId = '' } = useParams();

  const { hasSetConversation, conversation } = store.useCreateConversationAtom(index);
  const { newConversation } = useNewConvo();

  // Reset the guard flag whenever conversationId changes
  useEffect(() => {
    hasSetConversation.current = false;
  }, [conversationId]);

  const modelsQuery = useGetModelsQuery({
    enabled: isAuthenticated,
    refetchOnMount: 'always',
  });
  const initialConvoQuery = useGetConvoIdQuery(conversationId, {
    enabled: isAuthenticated && conversationId !== Constants.NEW_CONVO,
  });
  const endpointsQuery = useGetEndpointsQuery({ enabled: isAuthenticated });
  const assistantListMap = useAssistantListMap();
  
  // Мемоизируем функцию создания нового разговора, чтобы предотвратить лишние рендеры
  const createNewConversation = useCallback(
    (args: any) => {
      if (!hasSetConversation.current) {
        newConversation(args);
        hasSetConversation.current = true;
      }
    },
    [newConversation]
  );

  useEffect(() => {
    const shouldSetConvo =
      (startupConfig && !hasSetConversation.current && !modelsQuery.data?.initial) ?? false;
    /* Early exit if startupConfig is not loaded and conversation is already set and only initial models have loaded */
    if (!shouldSetConvo) {
      return;
    }

    // Проверяем, что у нас есть все необходимые данные для создания разговора
    const hasEndpoints = !!endpointsQuery.data;
    const hasModels = !!modelsQuery.data;
    const hasAssistants = !!(
      assistantListMap[EModelEndpoint.assistants] &&
      assistantListMap[EModelEndpoint.azureAssistants]
    );
    
    if (conversationId === Constants.NEW_CONVO && hasEndpoints && hasModels) {
      const spec = getDefaultModelSpec(startupConfig);

      createNewConversation({
        modelsData: modelsQuery.data,
        template: conversation ? conversation : undefined,
        ...(spec
          ? {
            preset: {
              ...spec.preset,
              iconURL: getModelSpecIconURL(spec),
              spec: spec.name,
            },
          }
          : {}),
      });
    } else if (initialConvoQuery.data && hasEndpoints && hasModels) {
      createNewConversation({
        template: initialConvoQuery.data,
        /* this is necessary to load all existing settings */
        preset: initialConvoQuery.data as TPreset,
        modelsData: modelsQuery.data,
        keepLatestMessage: true,
      });
    } else if (conversationId === Constants.NEW_CONVO && hasAssistants) {
      const spec = getDefaultModelSpec(startupConfig);
      createNewConversation({
        modelsData: modelsQuery.data,
        template: conversation ? conversation : undefined,
        ...(spec
          ? {
            preset: {
              ...spec.preset,
              iconURL: getModelSpecIconURL(spec),
              spec: spec.name,
            },
          }
          : {}),
      });
    } else if (hasAssistants && initialConvoQuery.data) {
      createNewConversation({
        template: initialConvoQuery.data,
        preset: initialConvoQuery.data as TPreset,
        modelsData: modelsQuery.data,
        keepLatestMessage: true,
      });
    }
    /* Используем мемоизированную функцию createNewConversation вместо прямого вызова newConversation */
  }, [
    startupConfig,
    initialConvoQuery.data,
    endpointsQuery.data,
    modelsQuery.data,
    assistantListMap,
    conversationId,
    createNewConversation,
    conversation,
  ]);

  if (endpointsQuery.isLoading || modelsQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" aria-live="polite" role="status">
        <Spinner className="text-text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // if not a conversation
  if (conversation?.conversationId === Constants.SEARCH) {
    return null;
  }
  // if conversationId not match
  if (conversation?.conversationId !== conversationId && !conversation) {
    return null;
  }
  // if conversationId is null
  if (!conversationId) {
    return null;
  }

  const isTemporaryChat = conversation && conversation.expiredAt ? true : false;

  if (conversationId !== Constants.NEW_CONVO && !isTemporaryChat) {
    setIsTemporary(false);
  } else if (isTemporaryChat) {
    setIsTemporary(isTemporaryChat);
  }

  return (
    <ToolCallsMapProvider conversationId={conversation.conversationId ?? ''}>
      <ChatView index={index} />
    </ToolCallsMapProvider>
  );
}
