import { memo, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import {
  Constants,
  supportsFiles,
  mergeFileConfig,
  isAgentsEndpoint,
  isEphemeralAgent,
  EndpointFileConfig,
  fileConfig as defaultFileConfig,
} from 'librechat-data-provider';
import { useChatContext } from '~/Providers';
import { useGetFileConfig } from '~/data-provider';
import { ephemeralAgentByConvoId } from '~/store';
import AttachFileMenu from './AttachFileMenu';
import AttachFile from './AttachFile';

function AttachFileChat({ disableInputs }: { disableInputs: boolean }) {
  const { conversation } = useChatContext();

  const { endpoint: _endpoint, endpointType, model } = conversation ?? { endpoint: null };

  // Проверка на модель DALL-E 3
  const isDallE3 = useMemo(() => {
    if (!model) {
      return false;
    }
    const modelLower = model.toLowerCase();
    return modelLower === 'dall-e-3' || modelLower.includes('dall-e-3');
  }, [model]);

  const key = conversation?.conversationId ?? Constants.NEW_CONVO;
  const ephemeralAgent = useRecoilValue(ephemeralAgentByConvoId(key));
  const isAgents = useMemo(
    () => isAgentsEndpoint(_endpoint) || isEphemeralAgent(_endpoint, ephemeralAgent),
    [_endpoint, ephemeralAgent],
  );

  const { data: fileConfig = defaultFileConfig } = useGetFileConfig({
    select: (data) => mergeFileConfig(data),
  });

  const endpointFileConfig = fileConfig.endpoints[_endpoint ?? ''] as
    | EndpointFileConfig
    | undefined;

  const endpointSupportsFiles: boolean = supportsFiles[endpointType ?? _endpoint ?? ''] ?? false;
  const isUploadDisabled = (disableInputs || endpointFileConfig?.disabled || isDallE3) ?? false;

  if (isDallE3) {
    // Для DALL-E 3 не отображаем кнопку загрузки файлов
    return null;
  }

  if (isAgents) {
    return <AttachFileMenu disabled={disableInputs} />;
  }

  if (endpointSupportsFiles && !isUploadDisabled) {
    return <AttachFile disabled={disableInputs} />;
  }

  return null;
}

export default memo(AttachFileChat);
