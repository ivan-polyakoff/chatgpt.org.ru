import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '~/Providers';
import { CheckCircle2, Gift, X, Check, Star, Crown, Zap, Shield, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
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

// Порядок тарифов от низшего к высшему
const planOrder = ['free', 'mini', 'standard', 'pro'];

// Цветовые схемы для каждого тарифа
const planThemes = {
  free: {
    gradient: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
    border: 'border-gray-200 dark:border-gray-700',
    accent: 'text-gray-600 dark:text-gray-400',
    button: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200',
    icon: 'text-gray-500',
  },
  mini: {
    gradient: 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    accent: 'text-blue-600 dark:text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: 'text-blue-500',
  },
  standard: {
    gradient: 'from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20',
    border: 'border-purple-200 dark:border-purple-700',
    accent: 'text-purple-600 dark:text-purple-400',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    icon: 'text-purple-500',
  },
  pro: {
    gradient: 'from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-200 dark:border-amber-700',
    accent: 'text-amber-600 dark:text-amber-400',
    button: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white',
    icon: 'text-amber-500',
  },
};

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
  const [currentProcessingPlan, setCurrentProcessingPlan] = useState<string>('');
  
  // Получаем текущий план пользователя из данных подписки
  const currentPlanKey = userSubscriptionData?.subscription?.plan?.key?.toLowerCase() || 'free';
  
  // Определяем индекс текущего тарифа для сравнения
  const currentPlanIndex = planOrder.indexOf(currentPlanKey);

  // Функция для получения иконок планов
  const getPlanIcon = (planKey: string) => {
    const key = planKey.toLowerCase();
    switch (key) {
      case 'free':
        return <Star className="h-6 w-6" />;
      case 'mini':
        return <Zap className="h-6 w-6" />;
      case 'standard':
        return <Shield className="h-6 w-6" />;
      case 'pro':
        return <Crown className="h-6 w-6" />;
      default:
        return <Sparkles className="h-6 w-6" />;
    }
  };

  // Рендер функций для особенностей планов
  const renderPlanFeatures = (planKey: string) => {
    const key = planKey.toLowerCase();
    
    const featureItems = {
      free: [
        { text: '10 сообщений в 24 часа', highlight: true },
        { text: 'GPT o3 — для кодинга', highlight: true },
        { text: 'GPT 4o — для базовых задач', highlight: true },
        { text: 'GPT 4.1 Mini — быстрая модель', highlight: true },
        { text: 'Gemini 2.0 Flash — Быстрая модель для данных', highlight: true },
        { text: 'Поддержка в чате', highlight: false },
      ],
      mini: [
        { text: '100 сообщений в 24 часа', highlight: true },
        { text: 'GPT 5 Nano', highlight: true },
        { text: 'GPT o4 Mini — Быстрая и простая модель', highlight: true },
        { text: 'Gemini 2.5 Pro — передовая модель от Google', highlight: true },
        { text: 'Grok 3 — флагман от Илона Маска', highlight: true },
        { text: 'Генерация Изображений', highlight: true },
        { text: 'Приоритетная поддержка', highlight: false },
      ],
      standard: [
        { text: '100 сообщений в 24 часа', highlight: true },
        { text: 'Всё из тарифа MINI', highlight: true },
        { text: 'GPT 5 Mini', highlight: true },
        { text: 'Генерация изображений', highlight: true },
        { text: 'Приоритетная поддержка', highlight: true, special: true },
      ],
      pro: [
        { text: 'Неограниченные сообщения', highlight: true },
        { text: 'Всё из тарифа STANDARD', highlight: true },
        { text: 'GPT 5 (чат)', highlight: true },
        { text: 'GPT 4.1 — анализ больших данных, кодинг ', highlight: true },
        { text: 'Deepseek 3', highlight: true },
        { text: 'Приоритетный доступ к новинкам', highlight: true },
        { text: 'Премиум поддержка', highlight: true, special: true },
      ],
    };

    const features = featureItems[key] || featureItems.free;

    return (
      <ul className="space-y-3 mt-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle2 className={cn(
              "h-5 w-5 mr-3 flex-shrink-0 mt-0.5",
              feature.special ? "text-red-500" : feature.highlight ? "text-green-500" : "text-gray-400"
            )} />
            <span className={cn(
              "text-sm leading-relaxed",
              feature.special 
                ? "font-bold text-red-600 dark:text-red-400" 
                : feature.highlight 
                  ? "text-gray-900 dark:text-white font-medium" 
                  : "text-gray-600 dark:text-gray-400"
            )}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      
      // Принудительно обновляем данные подписки при открытии модала
      queryClient.invalidateQueries(['userSubscription']);
      
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
        setCurrentProcessingPlan('');
      }, 300);
    }
  }, [open, token, showToast, currentPlanKey, queryClient]);

  // Обработчик для управления нажатием на план
  const handlePlanClick = (plan: Plan, isSelectable: boolean) => {
    if (plan.key.toLowerCase() === 'pro') {
      return;
    }
    
    if (isSelectable) {
      setSelectedKey(plan.key);
    }
  };

  // Обработчик для кнопки тарифа - теперь сразу покупает
  const handlePlanButtonClick = async (e: React.MouseEvent, plan: Plan, isSelectable: boolean, isCurrent: boolean) => {
    e.stopPropagation();
    
    if (!isSelectable || isCurrent) {
      return;
    }
    
    // Сразу инициируем покупку
    setProcessing(true);
    setCurrentProcessingPlan(plan.key);
    
    try {
      const subscribeRes = await axios.post(
        '/api/subscriptions/subscribe',
        { planKey: plan.key },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.open(subscribeRes.data.paymentUrl, '_blank');
      
      setActivatedPlan(plan);
      
      const poll = setInterval(async () => {
        try {
          const confirmRes = await axios.post(
            '/api/subscriptions/confirm',
            { planKey: plan.key, operationId: subscribeRes.data.operationId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (confirmRes.data.success) {
            clearInterval(poll);
            setPaymentStatus(PaymentStatus.SUCCESS);
            showToast({ message: 'Подписка успешно активирована!' });
            // Принудительно обновляем кэш подписки
            queryClient.invalidateQueries(['userSubscription']);
            // Также принудительно перезагружаем данные подписки
            queryClient.refetchQueries(['userSubscription']);
            // Обновляем текущий план для немедленного отображения
            setTimeout(() => {
              queryClient.invalidateQueries(['userSubscription']);
            }, 1000);
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
      setCurrentProcessingPlan('');
    }
  };

  // Экран успешной оплаты
  const renderSuccessScreen = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative">
        <div className="h-24 w-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
          <Check className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-yellow-800" />
        </div>
      </div>
      
      <h3 className="mt-8 text-2xl font-bold text-gray-900 dark:text-white text-center">
        Подписка активирована!
      </h3>
      <p className="mt-3 text-center text-gray-600 dark:text-gray-300 max-w-md">
        Поздравляем! Вы успешно приобрели тариф <span className="font-bold text-purple-600 dark:text-purple-400">{activatedPlan?.name}</span>
      </p>
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">
        Подписка действует {activatedPlan?.durationDays} дней
      </p>
      
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => {
            onOpenChange(false);
            window.location.reload();
          }}
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200"
        >
          Начать использовать
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );

  // Экран ошибки
  const renderErrorScreen = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-24 w-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-xl">
        <X className="h-12 w-12 text-white" />
      </div>
      
      <h3 className="mt-8 text-2xl font-bold text-gray-900 dark:text-white text-center">
        Ошибка оплаты
      </h3>
      <p className="mt-3 text-center text-gray-600 dark:text-gray-300 max-w-md">
        Произошла ошибка при обработке платежа. Попробуйте еще раз или обратитесь в поддержку.
      </p>
      
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setPaymentStatus(PaymentStatus.IDLE)}
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
        >
          Попробовать снова
        </button>
        <button
          onClick={() => onOpenChange(false)}
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
        >
          Закрыть
        </button>
      </div>
    </div>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[95vh] w-[95vw] max-w-6xl translate-x-[-50%] translate-y-[-50%] overflow-auto rounded-3xl bg-white dark:bg-gray-900 shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] border border-gray-200/50 dark:border-gray-700/50">
          
          {/* Заголовок */}
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8 rounded-t-3xl">
            <Dialog.Title className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Выберите тарифный план
            </Dialog.Title>
            <p className="mt-2 text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Разблокируйте полный потенциал AI-ассистента
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {loading || isLoadingSubscription ? (
              <div className="flex justify-center items-center py-20">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                  <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
                </div>
              </div>
            ) : paymentStatus === PaymentStatus.SUCCESS ? (
              renderSuccessScreen()
            ) : paymentStatus === PaymentStatus.FAILURE ? (
              renderErrorScreen()
            ) : (
              <>
                {/* Сетка планов */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {plans.map((plan) => {
                    const planIndex = planOrder.indexOf(plan.key.toLowerCase());
                    const isCurrent = plan.key.toLowerCase() === currentPlanKey.toLowerCase();
                    const isHigherThanCurrent = planIndex > currentPlanIndex;
                    const isLowerThanCurrent = planIndex < currentPlanIndex;
                    const isSelected = plan.key === selectedKey;
                    const isSelectable = !isLowerThanCurrent;
                    const theme = planThemes[plan.key.toLowerCase()] || planThemes.free;
                    const isPopular = plan.key.toLowerCase() === 'standard';
                    
                    return (
                      <div 
                        key={plan.key}
                        onClick={() => handlePlanClick(plan, isSelectable)}
                        className={cn(
                          "relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col",
                          isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                          isSelected 
                            ? "ring-2 ring-purple-500 shadow-xl shadow-purple-500/25" 
                            : "hover:shadow-xl",
                          `bg-gradient-to-br ${theme.gradient}`,
                          theme.border
                        )}
                        style={{
                          border: isSelected ? '2px solid rgb(147 51 234)' : undefined
                        }}
                      >
                        {/* Популярный план */}
                        {isPopular && (
                          <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 text-xs font-bold rounded-bl-xl">
                            ПОПУЛЯРНЫЙ
                          </div>
                        )}
                        
                        {/* Текущий тариф */}
                        {isCurrent && (
                          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            ВАШ ТАРИФ
                          </div>
                        )}
                        
                        <div className="p-6 flex flex-col grow">
                          {/* Иконка и название */}
                          <div className="flex items-center justify-center mb-4">
                            <div className={cn("p-3 rounded-2xl", theme.icon)}>
                              {getPlanIcon(plan.key)}
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                            {plan.name}
                          </h3>
                          
                          {/* Цена */}
                          <div className="text-center mb-6">
                            <div className="flex items-baseline justify-center">
                              <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                                {plan.price}
                              </span>
                              <span className="text-xl text-gray-600 dark:text-gray-400 ml-1">
                                ₽
                              </span>
                            </div>
                            {plan.durationDays > 0 && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                / {plan.durationDays} дней
                              </span>
                            )}
                          </div>

                          {/* Лимит сообщений */}
                          <div className="text-center mb-4">
                            <span className={cn("px-3 py-1 rounded-full text-sm font-medium", theme.accent, "bg-white/60 dark:bg-gray-800/60")}>
                              {plan.messageLimit === 0 ? '∞ сообщений' : `${plan.messageLimit} сообщений`}
                            </span>
                          </div>
                          
                          {/* Особенности */}
                          <div className="min-h-[200px]">
                            {renderPlanFeatures(plan.key)}
                          </div>
                          <div className="mt-auto mb-[2px]">
                          <button
                            onClick={(e) => handlePlanButtonClick(e, plan, isSelectable, isCurrent)}
                            disabled={!isSelectable || isCurrent || processing}
                            className={cn(
                              'w-full py-3 px-4 rounded-xl text-center font-semibold transition-all duration-200 flex items-center justify-center group',
                              isSelectable && !isCurrent
                                ? theme.button + ' shadow-lg hover:shadow-xl'
                                : isCurrent
                                  ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300 border border-green-300 dark:border-green-700'
                                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                            )}
                          >
                            {processing && plan.key === currentProcessingPlan ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                                Обработка...
                              </>
                            ) : isCurrent ? (
                              'Ваш тариф'
                            ) : isLowerThanCurrent ? (
                              'Недоступно'
                            ) : (
                              <>
                                <Gift className="h-5 w-5 mr-2" />
                                Купить
                                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Нижняя панель с кнопками */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left space-y-1">
                    <div>💳 Безопасная оплата через ЮKassa  ❌ Без автоматических списаний</div>
                  </div>
                  
                  <div className="flex justify-center sm:justify-end">
                    <button
                      onClick={() => onOpenChange(false)}
                      className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 min-w-[120px]"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Кнопка закрытия */}
          <Dialog.Close className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="sr-only">Закрыть</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SubscriptionModal; 