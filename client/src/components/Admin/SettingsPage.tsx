/* eslint-disable */
import React, { useState } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import axios from 'axios';
import { KeyRound, Loader2, Lock, Check, AlertCircle, Save, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';

// Ключи для группировки по типу
const BOOLEAN_KEYS = ['CHECK_BALANCE', 'LIMIT_CONCURRENT_MESSAGES', 'LIMIT_MESSAGE_IP', 'LIMIT_MESSAGE_USER'];

// Группировка настроек по категориям
const SETTINGS_GROUPS = {
  'API ключи и модели': ['OPENAI_API_KEY', 'OPENAI_MODELS'],
  'Баланс': ['START_BALANCE', 'CHECK_BALANCE'],
  'Ограничения нарушений': [
    'LOGIN_VIOLATION_SCORE',
    'REGISTRATION_VIOLATION_SCORE',
    'CONCURRENT_VIOLATION_SCORE',
    'MESSAGE_VIOLATION_SCORE',
    'NON_BROWSER_VIOLATION_SCORE'
  ],
  'Параметры входа': [
    'LOGIN_MAX',
    'LOGIN_WINDOW',
    'REGISTER_MAX',
    'REGISTER_WINDOW'
  ],
  'Лимиты сообщений': [
    'LIMIT_CONCURRENT_MESSAGES',
    'CONCURRENT_MESSAGE_MAX',
    'LIMIT_MESSAGE_IP',
    'MESSAGE_IP_MAX',
    'MESSAGE_IP_WINDOW',
    'LIMIT_MESSAGE_USER',
    'MESSAGE_USER_MAX',
    'MESSAGE_USER_WINDOW'
  ]
};

// Все ключи из групп
const OTHER_KEYS = Object.values(SETTINGS_GROUPS).flat();

export default function SettingsPage() {
  const { token } = useAuthContext();
  const [secret, setSecret] = useState('');
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    setSaveSuccess('');
    try {
      const res = await axios.get('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-secret-key': secret,
        },
      });
      setSettings(res.data.settings);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await axios.patch(
        '/api/admin/settings',
        { settings, secret },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveSuccess('Настройки успешно сохранены');
    } catch (err: any) {
      setSaveError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <KeyRound className="mr-2 h-6 w-6" />
            Секретные настройки
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Управление ключами API и настройками системы
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Lock className="h-5 w-5 mr-2" />
          Аутентификация
        </h2>
        
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Секретный пароль
          </label>
          <div className="mt-1 flex">
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              className="flex-1 rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              placeholder="Введите пароль для доступа к настройкам"
            />
            <button
              onClick={loadSettings}
              disabled={!secret || loading}
              className="inline-flex items-center px-4 py-2 rounded-r-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {loading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
          
          {error && (
            <div className="mt-3 flex items-center text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {settings && (
        <form
          onSubmit={e => {
            e.preventDefault();
            updateSettings();
          }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-6"
        >
          {Object.entries(SETTINGS_GROUPS).map(([groupName, keys]) => (
            <div key={groupName} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
              <h3 className="text-lg font-medium mb-4">{groupName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keys.map(key => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {key}
                    </label>
                    
                    {BOOLEAN_KEYS.includes(key) ? (
                      <button 
                        type="button"
                        onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                        className={`flex items-center text-sm font-medium ${
                          settings[key] 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {settings[key] ? (
                          <><ToggleRight className="h-6 w-6 mr-2" /> Включено</>
                        ) : (
                          <><ToggleLeft className="h-6 w-6 mr-2" /> Отключено</>
                        )}
                      </button>
                    ) : (key === 'OPENAI_MODELS' || key === 'OPENAI_API_KEY') ? (
                      <input
                        type="text"
                        value={settings[key] || ''}
                        onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                        placeholder={key === 'OPENAI_API_KEY' ? 'sk-...' : 'gpt-4-turbo,gpt-4o,gpt-3.5-turbo'}
                      />
                    ) : (
                      <input
                        type="number"
                        value={settings[key] ?? 0}
                        onChange={e => setSettings({ ...settings, [key]: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              {saveSuccess && (
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4 mr-1" />
                  <span>{saveSuccess}</span>
                </div>
              )}
              {saveError && (
                <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>{saveError}</span>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 