/* eslint-disable */
import { useState, useEffect } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CreditCard, Wallet, ArrowRight } from 'lucide-react';
import { useToastContext } from '~/Providers';
import { cn } from '~/utils';
import { useLocalize } from '~/hooks';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useGetUserBalance } from '~/data-provider';

type TopUpBalanceProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
};

enum PaymentStatus {
  IDLE,
  PROCESSING,
  SUCCESS,
  FAILURE
}

enum PaymentMethod {
  CARD,
  MIR,
  SBP
}

// Маппинг токенов к их ценам
interface TokenPrice {
  [key: string]: number;
}

const tokenPrices: TokenPrice = {
  '500000': 390,
  '1000000': 690,
  '2500000': 1490, 
  '5000000': 2490
};

const TopUpBalance = ({ open, onOpenChange, user }: TopUpBalanceProps) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  const balanceQuery = useGetUserBalance();
  
  const [tokens, setTokens] = useState('500000');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.IDLE);

  // Calculate price from tokenPrices и apply discount
  const basePrice = tokenPrices[tokens] || 0;
  const price = discount > 0
    ? +(basePrice * (100 - discount) / 100).toFixed(2)
    : basePrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus(PaymentStatus.PROCESSING);
    try {
      // Создаём ссылку на оплату
      const createRes = await axios.post('/api/transactions/create-payment', { tokens: parseInt(tokens, 10), amount: price }, { headers: { Authorization: `Bearer ${token}` } });
      if (!createRes.data.success) throw new Error(createRes.data.message);
      const { paymentUrl, operationId, useWebhooks } = createRes.data;
      // Открываем страницу оплаты в новой вкладке
      window.open(paymentUrl, '_blank');
      // Если опрос, проверяем статус
      if (!useWebhooks) {
        const poll = setInterval(async () => {
          try {
            const statusRes = await axios.get('/api/transactions/payment-status', {
              params: { operationId },
              headers: { Authorization: `Bearer ${token}` },
            });
            // Поддержка разных форматов: Operation пустой или массив
            let op = statusRes.data.data;
            if (op.Operation && Array.isArray(op.Operation)) {
              op = op.Operation[0];
            }
            const status = op.status;
            if (status === 'APPROVED') {
              clearInterval(poll);
              // Добавляем баланс после подтверждённой оплаты
              await axios.post(
                '/api/transactions/add-balance',
                { operationId, tokens: parseInt(tokens, 10), promoCode },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              queryClient.invalidateQueries(['balance']);
              setPaymentStatus(PaymentStatus.SUCCESS);
            } else if (status === 'EXPIRED') {
              clearInterval(poll);
              setPaymentStatus(PaymentStatus.FAILURE);
              showToast({ message: 'Срок действия платежной ссылки истёк' });
            } else if (['ON-REFUND', 'REFUNDED', 'REFUNDED_PARTIALLY'].includes(status)) {
              clearInterval(poll);
              setPaymentStatus(PaymentStatus.FAILURE);
              showToast({ message: 'Платёж был возвращён' });
            }
            // если CREATED или другие, продолжаем опрос
          } catch (err) {
            console.error('Status check error:', err);
          }
        }, 2000);
      } else {
        showToast({ message: 'Ожидайте подтверждения оплаты через webhook' });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const detail = error.response?.data?.details || error.response?.data?.message || error.message || 'Ошибка создания платежа';
      showToast({ message: detail });
      setPaymentStatus(PaymentStatus.FAILURE);
    }
  };

  // Reset payment status when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setPaymentStatus(PaymentStatus.IDLE);
      }, 300);
    }
  }, [open]);

  // Card formatter with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/\D/g, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [] as Array<string>;
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] border border-gray-200 dark:border-gray-700"
        >
          <Dialog.Title className="text-xl font-semibold leading-6 text-gray-800 dark:text-gray-100 flex items-center">
            {paymentStatus === PaymentStatus.SUCCESS 
              ? '✅ Оплата прошла успешно!'
              : paymentStatus === PaymentStatus.FAILURE
                ? '❌ Ошибка оплаты'
                : '💰 Пополнить баланс токенов'}
          </Dialog.Title>
          
          <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {paymentStatus === PaymentStatus.SUCCESS 
              ? `Ваш баланс был пополнен на ${tokens} токенов`
              : paymentStatus === PaymentStatus.FAILURE
                ? 'К сожалению, возникла ошибка при обработке платежа. Пожалуйста, попробуйте снова.'
                : 'Выберите количество токенов и предпочитаемый способ оплаты.'}
          </Dialog.Description>
          
          {paymentStatus === PaymentStatus.IDLE && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl mb-4">
                <div className="flex justify-between text-gray-700 dark:text-gray-200">
                  <span className="font-medium">
                    Баланс пользователя: 
                  </span>
                  <span className="font-mono">{balanceQuery.data ? parseFloat(balanceQuery.data).toFixed(2) : '0.00'} токенов</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="promo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Промокод (если есть)
                </label>
                <div className="mt-1 flex space-x-2">
                  <input
                    id="promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Введите промокод для скидки"
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={!promoCode || promoLoading}
                    onClick={async () => {
                      setPromoError(''); setPromoLoading(true);
                      try {
                        const res = await axios.post(
                          '/api/promocodes/validate',
                          { code: promoCode, activate: false },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setDiscount(res.data.discountPercent);
                      } catch (err: any) {
                        setPromoError(err.response?.data?.message || 'Ошибка проверки');
                        setDiscount(0);
                      } finally {
                        setPromoLoading(false);
                      }
                    }}
                    className={`px-4 rounded-md text-white font-medium ${promoLoading || !promoCode ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {promoLoading ? 'Проверка...' : 'Применить'}
                  </button>
                </div>
                {discount > 0 && <p className="mt-1 text-green-600 text-sm">✓ Скидка {discount}% применена!</p>}
                {promoError && <p className="mt-1 text-red-600 text-sm">⚠️ {promoError}</p>}
              </div>
              
              <div>
                <label htmlFor="tokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Количество токенов
                </label>
                <select
                  id="tokens"
                  value={tokens}
                  onChange={(e) => setTokens(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white py-2"
                >
                  <option value="500000">500,000 токенов (390 рублей)</option>
                  <option value="1000000">1,000,000 токенов (690 рублей)</option>
                  <option value="2500000">2,500,000 токенов (1490 рублей)</option>
                  <option value="5000000">5,000,000 токенов (2490 рублей)</option>
                </select>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mt-4">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Количество токенов:</span>
                  <span className="font-mono font-medium">{parseInt(tokens, 10).toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-gray-300 mt-1">
                    <span>Скидка по промокоду:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">-{discount}%</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 dark:text-white font-medium mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-800">
                  <span>Итого к оплате:</span>
                  <span className="font-mono">{price.toFixed(2)} рублей</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
                >
                  Оплатить {price.toFixed(2)} ₽
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </form>
          )}
          
          {paymentStatus === PaymentStatus.PROCESSING && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400"></div>
              <p className="mt-6 text-gray-700 dark:text-gray-300">Обработка платежа...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Пожалуйста, не закрывайте окно</p>
            </div>
          )}
          
          {paymentStatus === PaymentStatus.SUCCESS && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-20 w-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white">Оплата успешно завершена!</h3>
              <p className="mt-2 text-center text-gray-600 dark:text-gray-300">
                {parseInt(tokens, 10).toLocaleString()} токенов добавлены на ваш счет
              </p>
              
              <button
                onClick={() => onOpenChange(false)}
                className="mt-8 inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Готово
              </button>
            </div>
          )}
          
          {paymentStatus === PaymentStatus.FAILURE && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-20 w-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-medium text-gray-900 dark:text-white">Ошибка платежа</h3>
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
                  className="inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
          
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500 dark:ring-offset-gray-800 dark:focus:ring-gray-500 dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-400">
            <X className="h-4 w-4" />
            <span className="sr-only">Закрыть</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default TopUpBalance; 