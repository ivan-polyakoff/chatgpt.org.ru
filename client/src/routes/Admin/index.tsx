/* eslint-disable */
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthRedirect from '../useAuthRedirect';
import UsersPage from '~/components/Admin/UsersPage';
import TransactionsPage from '~/components/Admin/TransactionsPage';
import StatsPage from '~/components/Admin/StatsPage';
import PromocodesPage from '~/components/Admin/PromocodesPage';
import SettingsPage from '~/components/Admin/SettingsPage';
import SubscriptionsPage from '~/components/Admin/SubscriptionsPage';
import { Moon, Sun, User, DollarSign, BarChart3, Tag, KeyRound, Gift } from 'lucide-react';

function AdminLayout() {
  const { user, isAuthenticated } = useAuthRedirect();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('admin-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('admin-theme', 'dark');
    }
  };

  // Дождаться аутентификации
  if (!isAuthenticated) {
    return null;
  }
  // Проверка роли
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return (
    <div className={`flex h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 dark:from-indigo-800 dark:to-indigo-950 text-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-1">Админ-панель</h1>
          <p className="text-blue-200 dark:text-indigo-200 text-sm mb-6">Управление системой</p>
        </div>
        <nav className="px-4 space-y-2">
          <NavLink 
            to="users" 
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-blue-700 dark:bg-indigo-950 dark:text-white font-medium shadow-md' 
                  : 'text-blue-100 hover:bg-blue-700 dark:hover:bg-indigo-800'
              }`
            }
          >
            <User className="h-5 w-5 mr-3" />
            Пользователи
          </NavLink>
          <NavLink 
            to="transactions" 
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-blue-700 dark:bg-indigo-950 dark:text-white font-medium shadow-md' 
                  : 'text-blue-100 hover:bg-blue-700 dark:hover:bg-indigo-800'
              }`
            }
          >
            <DollarSign className="h-5 w-5 mr-3" />
            Транзакции
          </NavLink>
          <NavLink 
            to="stats" 
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-blue-700 dark:bg-indigo-950 dark:text-white font-medium shadow-md' 
                  : 'text-blue-100 hover:bg-blue-700 dark:hover:bg-indigo-800'
              }`
            }
          >
            <BarChart3 className="h-5 w-5 mr-3" />
            Статистика
          </NavLink>
          <NavLink 
            to="promocodes" 
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-blue-700 dark:bg-indigo-950 dark:text-white font-medium shadow-md' 
                  : 'text-blue-100 hover:bg-blue-700 dark:hover:bg-indigo-800'
              }`
            }
          >
            <Tag className="h-5 w-5 mr-3" />
            Промокоды
          </NavLink>
          <NavLink 
            to="settings" 
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-blue-700 dark:bg-indigo-950 dark:text-white font-medium shadow-md' 
                  : 'text-blue-100 hover:bg-blue-700 dark:hover:bg-indigo-800'
              }`
            }
          >
            <KeyRound className="h-5 w-5 mr-3" />
            Секретные настройки
          </NavLink>
          <NavLink 
            to="subscriptions"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white text-blue-700 dark:bg-indigo-950 dark:text-white font-medium shadow-md'
                  : 'text-blue-100 hover:bg-blue-700 dark:hover:bg-indigo-800'
              }`
            }
          >
            <Gift className="h-5 w-5 mr-3" />
            Подписки
          </NavLink>
        </nav>
        <div className="absolute bottom-0 w-64 p-6 border-t border-blue-700 dark:border-indigo-800">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-blue-700 dark:hover:bg-indigo-800 transition-colors"
              aria-label="Переключить тему"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <span className="text-blue-200 dark:text-indigo-200 text-sm">{darkMode ? 'Темная тема' : 'Светлая тема'}</span>
          </div>
          <div className="flex items-center text-blue-200 dark:text-indigo-200 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Администратор: {user?.email}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 dark:text-white rounded-xl shadow-sm p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const adminRoutes = {
  path: 'admin/*',
  element: <AdminLayout />,  
  children: [
    { index: true, element: <Navigate to="/admin/users" replace /> },
    { path: 'users', element: <UsersPage /> },
    { path: 'transactions', element: <TransactionsPage /> },
    { path: 'stats', element: <StatsPage /> },
    { path: 'promocodes', element: <PromocodesPage /> },
    { path: 'settings', element: <SettingsPage /> },
    { path: 'subscriptions', element: <SubscriptionsPage /> },
  ],
};

export default adminRoutes; 