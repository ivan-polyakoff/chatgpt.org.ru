/* eslint-disable */
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthRedirect from '../useAuthRedirect';
import { useAuthContext } from '~/hooks/AuthContext';
import UsersPage from '~/components/Admin/UsersPage';
import TransactionsPage from '~/components/Admin/TransactionsPage';
import StatsPage from '~/components/Admin/StatsPage';
import PromocodesPage from '~/components/Admin/PromocodesPage';
import SettingsPage from '~/components/Admin/SettingsPage';
import SubscriptionsPage from '~/components/Admin/SubscriptionsPage';
import ModelsPage from '~/components/Admin/ModelsPage';
import ModelDescriptionsPage from '~/components/Admin/ModelDescriptionsPage';
import NotificationsPage from '~/components/Admin/NotificationsPage';
import { 
  Moon, 
  Sun, 
  User, 
  DollarSign, 
  BarChart3, 
  Tag, 
  KeyRound, 
  Gift, 
  Code, 
  Bell, 
  Menu, 
  X,
  LogOut,
  BookOpen
} from 'lucide-react';

function AdminLayout() {
  const { user, isAuthenticated } = useAuthRedirect();
  const { logout } = useAuthContext();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
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

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      logout();
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

  const navigationItems = [
    { to: 'users', icon: User, label: 'Пользователи' },
    { to: 'transactions', icon: DollarSign, label: 'Транзакции' },
    { to: 'stats', icon: BarChart3, label: 'Статистика' },
    { to: 'promocodes', icon: Tag, label: 'Промокоды' },
    { to: 'notifications', icon: Bell, label: 'Оповещения' },
    { to: 'settings', icon: KeyRound, label: 'Секретные настройки' },
    { to: 'subscriptions', icon: Gift, label: 'Подписки' },
    { to: 'models', icon: Code, label: 'Модели' },
    { to: 'model-descriptions', icon: BookOpen, label: 'Описания моделей' },
  ];

  return (
    <div className={`flex h-screen transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-gradient-to-b from-blue-600 to-blue-800 dark:from-gray-800 dark:to-gray-900 
        text-white shadow-2xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-700 dark:border-gray-700">
          <div>
          <h1 className="text-2xl font-bold mb-1">Админ-панель</h1>
            <p className="text-blue-200 dark:text-gray-300 text-sm">Управление системой</p>
        </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map(({ to, icon: Icon, label }) => (
          <NavLink 
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-white text-blue-700 dark:bg-gray-700 dark:text-white font-medium shadow-lg transform scale-105' 
                  : 'text-blue-100 dark:text-gray-200 hover:bg-blue-700 dark:hover:bg-gray-700 hover:text-white'
                }
              `}
          >
              <Icon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
              <span className="font-medium">{label}</span>
          </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-blue-700 dark:border-gray-700 p-6 space-y-4">
          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <button 
              onClick={toggleTheme} 
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-blue-700 dark:hover:bg-gray-700 transition-colors"
              aria-label="Переключить тему"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="text-sm">{darkMode ? 'Светлая тема' : 'Темная тема'}</span>
            </button>
          </div>

          {/* User info */}
          <div className="text-blue-200 dark:text-gray-300 text-sm">
            <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="font-medium">Администратор</span>
            </div>
            <div className="truncate text-xs opacity-75">{user?.email}</div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900">
        {/* Mobile header */}
        <header className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Открыть меню"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Админ-панель</h1>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Переключить тему"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[calc(100vh-12rem)] lg:min-h-[calc(100vh-8rem)]">
                <div className="p-4 lg:p-6">
          <Outlet />
                </div>
              </div>
            </div>
        </div>
      </main>
      </div>
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
    { path: 'notifications', element: <NotificationsPage /> },
    { path: 'settings', element: <SettingsPage /> },
    { path: 'subscriptions', element: <SubscriptionsPage /> },
    { path: 'models', element: <ModelsPage /> },
    { path: 'model-descriptions', element: <ModelDescriptionsPage /> },
  ],
};

export default adminRoutes; 