import React, { useState } from 'react';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import SubscriptionModal from '~/components/Nav/SubscriptionModal';

interface SystemMessageLimitReachedProps {
  message: string;
  limit: number;
  used: number;
  resetIn: number;
  planKey: string;
}

export default function SystemMessageLimitReached({
  message,
  limit,
  used,
  resetIn,
  planKey,
}: SystemMessageLimitReachedProps) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const getPlanName = (key: string) => {
    const planNames: Record<string, string> = {
      free: 'Бесплатный',
      mini: 'Mini',
      standard: 'Standard',
      pro: 'Pro',
    };
    return planNames[key.toLowerCase()] || key;
  };

  const getTimeText = (hours: number) => {
    if (hours === 1) {
      return '1 час';
    }
    if (hours < 5) {
      return `${hours} часа`;
    }
    return `${hours} часов`;
  };

  return (
    <>
      <div className="mx-auto max-w-3xl p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  Лимит сообщений исчерпан
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {message}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-3 dark:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Текущий план
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                    {getPlanName(planKey)}
                  </p>
                </div>
                
                <div className="rounded-lg bg-white p-3 dark:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Использовано
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                    {used}/{limit}
                  </p>
                </div>
                
                <div className="rounded-lg bg-white p-3 dark:bg-gray-800">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Сброс через
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                    {getTimeText(resetIn)}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-center font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Расширить лимиты</span>
                  </div>
                </button>
                
                <div className="flex-1 rounded-lg border border-gray-300 bg-white p-3 text-center dark:border-gray-600 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Или дождитесь автоматического сброса лимита через{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {getTimeText(resetIn)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <SubscriptionModal 
        open={showSubscriptionModal} 
        onOpenChange={setShowSubscriptionModal} 
      />
    </>
  );
} 