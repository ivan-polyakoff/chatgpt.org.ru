/**
 * Очистка кеша Service Worker и принудительное обновление
 */
export async function clearServiceWorkerCache(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      // Получаем все активные Service Worker регистрации
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Service Worker unregistered successfully');
      }

      // Очищаем все кеши
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }

      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Error clearing Service Worker cache:', error);
    }
  }
}

/**
 * Проверка и автоматическое обновление Service Worker
 */
export async function checkForServiceWorkerUpdate(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Проверяем наличие обновлений
      await registration.update();
      
      // Если есть ожидающий Service Worker, активируем его
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('Service Worker updated successfully');
      }
    } catch (error) {
      console.error('Error checking for Service Worker update:', error);
    }
  }
}

/**
 * Принудительная перезагрузка страницы без кеша
 */
export function forceReload(): void {
  if (window.location.reload) {
    // Принудительная перезагрузка с очисткой кеша
    window.location.reload();
  }
} 