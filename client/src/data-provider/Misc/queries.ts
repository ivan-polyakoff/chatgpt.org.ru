import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';
import { useAuthContext } from '~/hooks/AuthContext';

export const useGetBannerQuery = (
  config?: UseQueryOptions<t.TBannerResponse>,
): QueryObserverResult<t.TBannerResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TBannerResponse>([QueryKeys.banner], () => dataService.getBanner(), {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    ...config,
    enabled: (config?.enabled ?? true) === true && queriesEnabled,
  });
};

export const useGetUserBalance = (
  config?: UseQueryOptions<string>,
): QueryObserverResult<string> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<string>([QueryKeys.balance], () => dataService.getUserBalance(), {
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    ...config,
    enabled: (config?.enabled ?? true) === true && queriesEnabled,
  });
};

export const useGetSearchEnabledQuery = (
  config?: UseQueryOptions<boolean>,
): QueryObserverResult<boolean> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<boolean>([QueryKeys.searchEnabled], () => dataService.getSearchEnabled(), {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    ...config,
    enabled: (config?.enabled ?? true) === true && queriesEnabled,
  });
};

export interface TNotificationResponse {
  notification: {
    _id: string;
    message: string;
    createdAt: string;
  } | null;
}

export const useGetNotificationQuery = (
  config?: UseQueryOptions<TNotificationResponse>,
): QueryObserverResult<TNotificationResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  const { token } = useAuthContext();
  return useQuery<TNotificationResponse>(['notification'], async () => {
    const res = await fetch('/api/notifications', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error('Ошибка при загрузке оповещений');
    }
    return res.json();
  }, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    ...config,
    enabled: (config?.enabled ?? true) === true && queriesEnabled,
  });
};
