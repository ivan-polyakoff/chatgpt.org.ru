/* eslint-disable */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { BarChart3, Users, TrendingUp, Activity, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StatsPage() {
  const { token } = useAuthContext();
  const { data, isLoading, error } = useQuery<{
    userCount: number;
    requestsPerDay: Record<string, number>;
  }, Error>(['admin-stats'], async () => {
    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error('Error fetching stats');
    }
    return res.json();
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 my-4 rounded-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700 dark:text-red-300">Ошибка загрузки данных: {error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const labels = Object.keys(data.requestsPerDay).sort();
  const values = labels.map((date) => data.requestsPerDay[date]);
  
  // Расчет суммы запросов
  const totalRequests = values.reduce((sum, value) => sum + value, 0);
  
  // Расчет среднего значения запросов в день
  const avgRequests = values.length > 0 ? Math.round(totalRequests / values.length) : 0;
  
  // Нахождение максимального значения запросов в день
  const maxRequests = Math.max(...values);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Запросы в день',
        data: values,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'white',
        titleColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        bodyColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
      },
    },
  };

  const statCards = [
    {
      title: 'Всего пользователей',
      value: data.userCount,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
      textColor: 'text-blue-100',
    },
    {
      title: 'Всего запросов',
      value: totalRequests,
      icon: Activity,
      gradient: 'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700',
      textColor: 'text-green-100',
    },
    {
      title: 'Среднее в день',
      value: avgRequests,
      icon: TrendingUp,
      gradient: 'from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700',
      textColor: 'text-yellow-100',
    },
    {
      title: 'Максимум запросов',
      value: maxRequests,
      icon: BarChart3,
      gradient: 'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
      textColor: 'text-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
          Статистика системы
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Обзор ключевых показателей и аналитика использования
        </p>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className={`bg-gradient-to-r ${card.gradient} rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-200`}>
            <div className="px-6 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-medium ${card.textColor} truncate`}>
                      {card.title}
                    </dt>
                    <dd>
                      <div className="text-2xl font-bold text-white">
                        {card.value.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Динамика запросов</h2>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Activity className="h-4 w-4 mr-1" />
            Последние {labels.length} дней
          </div>
        </div>
        <div className="h-80">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}