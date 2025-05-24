import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import './locales/i18n';
import App from './App';
import './style.css';
import './mobile.css';
import { ApiErrorBoundaryProvider } from './hooks/ApiErrorBoundaryContext';

// Обработка Service Worker
if ('serviceWorker' in navigator) {
  // При загрузке страницы проверяем обновления Service Worker
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('SW registered: ', registration);
      
      // Обработка обновлений
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('New SW found, installing...');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Новый Service Worker установлен, но старый всё ещё контролирует страницу
                console.log('New content is available; please refresh.');
                
                // Автоматически активируем новый Service Worker
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              } else {
                // Первая установка Service Worker
                console.log('Content is cached for offline use.');
              }
            }
          });
        }
      });
      
      // Обработка активации нового Service Worker
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        
        console.log('SW controller changed, reloading page...');
        refreshing = true;
        
        // Очищаем кеши перед перезагрузкой
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              if (cacheName.includes('workbox-precache')) {
                console.log('Clearing cache:', cacheName);
                caches.delete(cacheName);
              }
            });
          }).finally(() => {
            window.location.reload();
          });
        } else {
          window.location.reload();
        }
      });
      
    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  });
  
  // Обработка сообщений от Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('Cache updated, new content available');
    }
  });
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ApiErrorBoundaryProvider>
    <App />
  </ApiErrorBoundaryProvider>,
);
