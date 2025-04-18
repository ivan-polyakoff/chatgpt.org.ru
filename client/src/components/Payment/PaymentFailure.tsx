import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentFailure: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Оплата не прошла</h2>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              К сожалению, во время обработки платежа произошла ошибка. Ваши средства не были списаны.
            </p>
          </div>
          
          <div className="mt-8 w-full">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Статус:</span>
                <span className="text-red-600 dark:text-red-400 font-medium">Ошибка</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700 dark:text-gray-300">Дата:</span>
                <span className="text-gray-600 dark:text-gray-400">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Возможные причины ошибки:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>Недостаточно средств на карте</li>
                <li>Банк отклонил транзакцию</li>
                <li>Введены неверные данные карты</li>
                <li>Временные технические проблемы</li>
              </ul>
            </div>
            
            <div className="flex flex-col space-y-3 mt-6">
              <button
                onClick={() => window.history.back()}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-800"
              >
                Попробовать снова
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Вернуться к чату
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure; 