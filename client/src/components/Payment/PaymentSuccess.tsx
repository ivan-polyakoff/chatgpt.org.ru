import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessProps {
  tokens?: number;
  transactionId?: string;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ tokens = 500000, transactionId = 'TX-' + Math.random().toString(36).substring(2, 10).toUpperCase() }) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Оплата прошла успешно!</h2>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Ваш баланс был пополнен на <span className="font-semibold">{tokens.toLocaleString()}</span> токенов.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Номер транзакции: {transactionId}
            </p>
          </div>
          
          <div className="mt-8 w-full">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Статус:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Оплачено</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700 dark:text-gray-300">Дата:</span>
                <span className="text-gray-600 dark:text-gray-400">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => navigate('/')}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-800"
              >
                Вернуться к чату
              </button>
              
              <button
                onClick={() => window.print()}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Распечатать квитанцию
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 