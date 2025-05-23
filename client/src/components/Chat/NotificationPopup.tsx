import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useGetNotificationQuery } from '~/data-provider/Misc/queries';
import { Bell, X } from 'lucide-react';

export default function NotificationPopup() {
  const { data, isLoading, error } = useGetNotificationQuery();
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const messageRef = useRef(null);

  // Стили для ссылок в уведомлениях
  const linkStyles = `
    a {
      color: #3b82f6; /* синий цвет для светлой темы */
      text-decoration: underline;
      font-weight: 500;
      transition: color 0.2s;
    }
    a:hover {
      color: #2563eb;
      text-decoration: underline;
    }
    .dark a {
      color: #60a5fa; /* более светлый синий для темной темы */
    }
    .dark a:hover {
      color: #93c5fd;
    }
  `;

  // Анимация появления
  useEffect(() => {
    if (data?.notification) {
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [data?.notification]);

  // Обработка ссылок в HTML
  useEffect(() => {
    if (messageRef.current && data?.notification) {
      // Устанавливаем HTML содержимое
      messageRef.current.innerHTML = data.notification.message;
      
      // Добавляем стили для ссылок
      const styleElement = document.createElement('style');
      styleElement.textContent = linkStyles;
      messageRef.current.appendChild(styleElement);
      
      // Обработка всех ссылок после рендеринга
      const links = messageRef.current.querySelectorAll('a');
      links.forEach(link => {
        // По умолчанию открываем ссылки в новой вкладке
        if (!link.getAttribute('target')) {
          link.setAttribute('target', '_blank');
        }
        
        // Проверка на относительные ссылки без протокола
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/')) {
          link.setAttribute('href', `https://${href}`);
        }
        
        // Обработка специального атрибута href_self
        const hrefSelf = link.getAttribute('href_self');
        if (hrefSelf) {
          link.removeAttribute('href_self');
          link.setAttribute('href', hrefSelf);
          link.setAttribute('target', '_self');
        }
        
        // Добавление rel="noopener noreferrer" для безопасности
        link.setAttribute('rel', 'noopener noreferrer');
      });
    }
  }, [data?.notification]);

  if (isLoading || error || !data?.notification) {
    return null;
  }

  const { _id } = data.notification;

  const handleClose = async () => {
    try {
      console.log('Marking notification as read:', _id);
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: _id }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('Notification marked as read successfully');
    } catch (e) {
      console.error('markReadNotification error:', e);
    } finally {
      setIsVisible(false);
      setTimeout(() => {
        console.log('Invalidating notification queries');
        queryClient.invalidateQueries(['notification']);
      }, 300); // Задержка для завершения анимации исчезновения
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[9999] backdrop-blur-sm bg-black/30 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`relative max-w-md w-[90%] sm:w-[450px] mx-auto bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-300 ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
        {/* Полоса заголовка */}
        <div className="bg-blue-600 dark:bg-blue-700 py-3 px-4 flex items-center justify-between">
          <div className="flex items-center text-white font-medium">
            <Bell className="h-5 w-5 mr-2" />
            <span>Уведомление</span>
          </div>
          <button 
            onClick={handleClose}
            className="text-white hover:text-blue-200 transition-colors"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Содержимое */}
        <div className="p-5">
          <div 
            ref={messageRef}
            className="mb-5 text-gray-800 dark:text-gray-100 text-base break-words whitespace-pre-wrap"
            style={{ wordBreak: 'break-word' }}
          />
          
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}