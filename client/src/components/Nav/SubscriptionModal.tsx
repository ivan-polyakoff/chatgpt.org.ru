import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import { CheckCircle2, Gift, X, Check } from 'lucide-react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import { useGetUserSubscriptionQuery } from '~/data-provider';

type SubscriptionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

interface Plan {
  key: string;
  name: string;
  price: number;
  durationDays: number;
  messageLimit: number;
  allowedModels: string[];
}

enum PaymentStatus {
  IDLE,
  PROCESSING,
  SUCCESS,
  FAILURE
}

/* eslint-disable */
// Порядок тарифов от низшего к высшему
const planOrder = ['free', 'mini', 'standard', 'pro'];

const SubscriptionModal = ({ open, onOpenChange }: SubscriptionModalProps) => {
  const localize = useLocalize();
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  
  // Получаем информацию о текущей подписке пользователя
  const { data: userSubscriptionData, isLoading: isLoadingSubscription } = useGetUserSubscriptionQuery();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.IDLE);
  const [activatedPlan, setActivatedPlan] = useState<Plan | null>(null);
  
  // Получаем текущий план пользователя из данных подписки
  const currentPlanKey = userSubscriptionData?.subscription?.plan?.key?.toLowerCase() || 'free';
  
  // Определяем индекс текущего тарифа для сравнения
  const currentPlanIndex = planOrder.indexOf(currentPlanKey);

  // Функция для получения красивых названий моделей
  const getDisplayName = (model: string): string => {
    const modelMap: Record<string, string> = {
      'gpt-4o-mini': 'GPT-4o Mini',
      'gemini-2.0-flash': 'Gemini Flash',
      'gemini-2.5-pro-exp-03-25': 'Gemini Pro',
      'chatgpt-4o-latest': 'GPT-4.0',
      'gpt-4.1': 'GPT-4.1',
      'gpt-4.5-preview': 'GPT-4.5',
      'o3-mini': ' Sonnet',
    };
    return modelMap[model] || model;
  };

  // Заменяем getPlanFeatures на renderPlanFeatures
  const renderPlanFeatures = (planKey: string) => {
    const key = planKey.toLowerCase();
    
    if (key === 'free') {
      return (
        <ul className="space-y-2 mt-4">
                    <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              15 сообщений раз в 24 часа
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              GPT-4.1 Mini — быстрый и экономичный вариант GPT-4.1
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
               O1 Mini — компактная версия  O1
            </span>
          </li>
        </ul>
      );
    } 
    else if (key === 'mini') {
      return (
        <ul className="space-y-2 mt-4">
                              <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              100 сообщений раз в 24 часа
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              <b>Всё из бесплатного тарифа</b> + расширенные модели
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              GPT-4o — мощная и современная модель от OpenAI
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
               O3 Mini — оптимизированная версия для кодинга
            </span>
          </li>
        </ul>
      );
    } 
    else if (key === 'standard') {
      return (
        <ul className="space-y-2 mt-4">
                              <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              1000 сообщений раз в 24 часа
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              <b>Всё из тарифа MINI</b> + дополнительные возможности
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
               O4 Mini — новейшая модель с улучшенными возможностями
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              Генерация изображений в чате
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="font-bold text-red-500 dark:text-red-400">
              VPN В ПОДАРОК
            </span>
          </li>
        </ul>
      );
    } 
    else if (key === 'pro') {
      return (
        <ul className="space-y-2 mt-4">
                              <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              Неограниченное количество сообщений
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              <b>Всё из тарифа STANDARD</b> + премиум модели
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              GPT-4.1 (полная версия) — максимальная мощность GPT
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
               O1 и O3 (полные версии) — премиальные модели 
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">
              Приоритетный доступ к новым моделям
            </span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="font-bold text-red-500 dark:text-red-400">
              VPN В ПОДАРОК + ПРЕМИАЛЬНАЯ ПОДДЕРЖКА
            </span>
          </li>
        </ul>
      );
    }
    
    // Для любых других значений (fallback)
    return (
      <ul className="space-y-2 mt-4">
        <li className="flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-gray-700 dark:text-gray-300">
            Доступ к нейросетям последнего поколения
          </span>
        </li>
      </ul>
    );
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      
      // Получаем список тарифных планов с сервера
      axios.get('/api/subscriptions', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setPlans(res.data.plans);
          
          // Если еще не выбран ни один план, устанавливаем текущий план из подписки
          if (selectedKey === '' && currentPlanKey) {
            setSelectedKey(currentPlanKey);
          }
        })
        .catch(err => showToast({ message: err.response?.data?.message || 'Ошибка загрузки тарифных планов' }))
        .finally(() => setLoading(false));
    } else {
      // Сбрасываем статус платежа при закрытии модального окна
      setTimeout(() => {
        setPaymentStatus(PaymentStatus.IDLE);
        setActivatedPlan(null);
      }, 300);
    }
  }, [open, token, showToast, currentPlanKey]);

  const handleBuy = async () => {
    if (!selectedKey) {
      return;
    }
    
    // Если пользователь пытается "купить" текущий тариф, просто закрываем окно
    if (selectedKey.toLowerCase() === currentPlanKey.toLowerCase()) {
      onOpenChange(false);
      return;
    }
    
    setProcessing(true);
    try {
      const subscribeRes = await axios.post(
        '/api/subscriptions/subscribe',
        { planKey: selectedKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.open(subscribeRes.data.paymentUrl, '_blank');
      
      // Находим выбранный план для отображения в сообщении успеха
      const selectedPlan = plans.find(p => p.key === selectedKey);
      if (selectedPlan) {
        setActivatedPlan(selectedPlan);
      }
      
      const poll = setInterval(async () => {
        try {
          const confirmRes = await axios.post(
            '/api/subscriptions/confirm',
            { planKey: selectedKey, operationId: subscribeRes.data.operationId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (confirmRes.data.success) {
            clearInterval(poll);
            setPaymentStatus(PaymentStatus.SUCCESS);
            showToast({ message: 'Подписка успешно активирована!' });
            queryClient.invalidateQueries(['subscription']);
          }
        } catch (err: any) {
          if (err.response?.status !== 400) {
            clearInterval(poll);
            setPaymentStatus(PaymentStatus.FAILURE);
            showToast({ message: err.response?.data?.message || 'Ошибка подтверждения подписки' });
          }
        }
      }, 2000);
    } catch (err: any) {
      setPaymentStatus(PaymentStatus.FAILURE);
      showToast({ message: err.response?.data?.message || 'Ошибка инициации оплаты' });
    } finally {
      setProcessing(false);
    }
  };

  // Отрисовка экрана успешной оплаты
  const renderSuccessScreen = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-20 w-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <Check className="h-10 w-10 text-green-600 dark:text-green-300" />
      </div>
      <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white">Подписка успешно оформлена!</h3>
      <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
        Вы приобрели тариф <span className="font-bold">{activatedPlan?.name}</span>
      </p>
      <p className="text-gray-600 dark:text-gray-300 mt-1">
        Ваша подписка действительна в течение {activatedPlan?.durationDays} дней
      </p>
      
      <button
        onClick={() => onOpenChange(false)}
        className="mt-8 inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Начать использовать
      </button>
    </div>
  );

  // Отрисовка экрана ошибки оплаты
  const renderErrorScreen = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-20 w-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
        <X className="h-10 w-10 text-red-600 dark:text-red-300" />
      </div>
      <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white">Ошибка оплаты</h3>
      <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
        Произошла ошибка при обработке платежа. Пожалуйста, проверьте данные и попробуйте снова.
      </p>
      
      <div className="flex mt-8 space-x-4">
        <button
          onClick={() => setPaymentStatus(PaymentStatus.IDLE)}
          className="inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Попробовать снова
        </button>
        <button
          onClick={() => onOpenChange(false)}
          className="inline-flex justify-center items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Закрыть
        </button>
      </div>
    </div>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[85vh] w-[90vw] max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] border border-gray-200 dark:border-gray-700">
          <Dialog.Title className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
            Выберите тарифный план
          </Dialog.Title>
          
          {loading || isLoadingSubscription ? (
            <div className="flex justify-center items-center py-12">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400"></div>
            </div>
          ) : paymentStatus === PaymentStatus.SUCCESS ? (
            renderSuccessScreen()
          ) : paymentStatus === PaymentStatus.FAILURE ? (
            renderErrorScreen()
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const planIndex = planOrder.indexOf(plan.key.toLowerCase());
                  
                  // Проверяем соотношение плана к текущему
                  const isCurrent = plan.key.toLowerCase() === currentPlanKey.toLowerCase();
                  const isHigherThanCurrent = planIndex > currentPlanIndex;
                  const isLowerThanCurrent = planIndex < currentPlanIndex;
                  const isSelected = plan.key === selectedKey;

                  // Определяем, доступна ли для выбора данная подписка
                  // Нельзя выбрать план ниже текущего
                  const isSelectable = !isLowerThanCurrent;
                  
                  return (
                    <div 
                      key={plan.key}
                      onClick={() => isSelectable && setSelectedKey(plan.key)}
                      className={cn(
                        "relative flex flex-col rounded-xl border-2 p-6 transition-all",
                        isSelectable ? "cursor-pointer hover:shadow-lg" : "cursor-not-allowed opacity-70",
                        isSelected 
                          ? "border-indigo-500 dark:border-indigo-400 shadow-md" 
                          : "border-gray-200 dark:border-gray-700"
                      )}
                    >
                      {/* VPN лента */}
                      {plan.price > 0 && plan.key !== 'mini' && (
                        <div className="absolute -top-3 -right-3 bg-red-600 text-white px-3 py-1 rotate-12 shadow-md text-xs font-bold rounded-sm">
                          VPN В ПОДАРОК
                        </div>
                      )}
                      
                      {/* Текущий тариф метка */}
                      {isCurrent && (
                        <div className="absolute -top-3 -left-3 bg-green-600 text-white px-3 py-1 -rotate-12 shadow-md text-xs font-bold rounded-sm">
                          ВАШ ТАРИФ
                        </div>
                      )}
                      
                      <h3 className="text-xl font-bold text-center mb-2 text-gray-800 dark:text-gray-100">{plan.name}</h3>
                      <div className="text-center mb-4">
                        <span className="text-3xl font-bold text-gray-800 dark:text-white">{plan.price} ₽</span>
                        {plan.durationDays > 0 && (
                          <span className="text-gray-500 dark:text-gray-400"> / {plan.durationDays} дней</span>
                        )}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="mb-2 text-center font-medium text-sm text-gray-500 dark:text-gray-400">
                          {plan.messageLimit === 0 ? 'Безлимитные сообщения' : `${plan.messageLimit} сообщений`}
                        </div>
                        
                        {renderPlanFeatures(plan.key)}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Предотвращаем повторное срабатывание родительского onClick
                          if (isSelectable && !isCurrent) {
                            window.open('https://t.me/covekss', '_blank');
                          }
                        }}
                        disabled={!isSelectable || isCurrent}
                        className={cn(
                          "mt-6 w-full py-2 rounded-md text-center font-medium",
                          isSelected
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : isCurrent
                              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                              : isLowerThanCurrent
                                ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        )}
                      >
                        {isCurrent ? 'Ваш тариф' : isLowerThanCurrent ? 'Недоступно' : isSelected ? 'Выбрано' : 'Выбрать'}
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBuy}
                  disabled={!selectedKey || processing || selectedKey.toLowerCase() === currentPlanKey.toLowerCase()}
                  className="px-6 py-2 font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                      Обработка...
                    </>
                  ) : selectedKey.toLowerCase() === currentPlanKey.toLowerCase() ? (
                    <>Текущий тариф</>
                  ) : (
                    <>
                      <Gift className="h-5 w-5 mr-2" />
                      Оформить подписку
                    </>
                  )}
                </button>
              </div>
            </>
          )}
          
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500 dark:ring-offset-gray-800 dark:focus:ring-gray-500 dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-400">
            <X className="h-5 w-5" />
            <span className="sr-only">Закрыть</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SubscriptionModal; 