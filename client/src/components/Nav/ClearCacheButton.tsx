import React from 'react';
import { Trash2 } from 'lucide-react';
import { useToastContext } from '~/Providers';
import { Button } from '~/components/ui';

const ClearCacheButton: React.FC = () => {
  const { showToast } = useToastContext();

  const clearCache = async () => {
    try {
      // Очищаем все кеши
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(async (cacheName) => {
            console.log('Удаляю кеш:', cacheName);
            await caches.delete(cacheName);
          })
        );
      }

      // Отключаем и заново регистрируем Service Worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.log('Отключаю Service Worker');
          await registration.unregister();
        }
      }

      showToast({
        message: 'Кеш очищен! Страница будет перезагружена через 2 секунды.',
        status: 'success'
      });

      // Перезагружаем страницу через 2 секунды
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Ошибка при очистке кеша:', error);
      showToast({
        message: 'Ошибка при очистке кеша. Попробуйте обновить страницу вручную (Ctrl+Shift+R).',
        status: 'error'
      });
    }
  };

  return (
    <Button
      onClick={clearCache}
      variant="outline"
      size="sm"
      className="h-8 w-8 p-0"
      title="Очистить кеш и перезагрузить"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
};

export default ClearCacheButton; 