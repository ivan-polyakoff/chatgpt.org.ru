import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import { CheckCircle2, X, ArrowRight, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [planName, setPlanName] = useState('');
  const [tokens, setTokens] = useState('');

  const planKey = searchParams.get('planKey');
  const tokensParam = searchParams.get('tokens');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        if (planKey) {
          // Это покупка подписки
          setTokens('');
          
          // Получаем информацию о плане
          const plansRes = await axios.get('/api/subscriptions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const plan = plansRes.data.plans.find(p => p.key === planKey);
          setPlanName(plan?.name || planKey);
          
          setSuccess(true);
          showToast({ message: 'Подписка успешно активирована!' });
          
          // Обновляем данные о подписке
          queryClient.invalidateQueries(['userSubscription']);
          
        } else if (tokensParam) {
          // Это пополнение токенов
          setTokens(tokensParam);
          setPlanName('');
          setSuccess(true);
          showToast({ message: 'Баланс успешно пополнен!' });
        } else {
          // Нет данных о покупке
          setSuccess(false);
        }
      } catch (error) {
        console.error('Error checking payment:', error);
        setSuccess(false);
        showToast({ message: 'Ошибка при проверке платежа' });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      checkPaymentStatus();
    } else {
      setLoading(false);
      setSuccess(false);
    }
  }, [planKey, tokensParam, token, showToast, queryClient]);

  const handleContinue = () => {
    navigate('/c/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        {success ? (
          <>
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="h-24 w-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {planKey ? 'Подписка активирована!' : 'Баланс пополнен!'}
            </h1>
            
            {planKey ? (
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Поздравляем! Вы успешно приобрели тариф{' '}
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {planName}
                </span>
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Ваш баланс успешно пополнен на{' '}
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {tokens} токенов
                </span>
              </p>
            )}
            
            <button
              onClick={handleContinue}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200"
            >
              Начать использовать
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-xl mb-6">
              <X className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ошибка платежа
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Произошла ошибка при обработке платежа. Попробуйте еще раз или обратитесь в поддержку.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/c/new')}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
              >
                Вернуться в чат
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult; 