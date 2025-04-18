/* eslint-disable */
import { useState, useEffect } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useToastContext } from '~/Providers';
import { cn } from '~/utils';
import { useLocalize } from '~/hooks';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

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

const TopUpBalance = ({ open, onOpenChange, user }: TopUpBalanceProps) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { token } = useAuthContext();
  const queryClient = useQueryClient();
  
  const [tokens, setTokens] = useState('500000');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.IDLE);

  // Calculate base price и apply discount
  const basePrice = Math.max(8, parseFloat(tokens) * (8 / 500000));
  const price = discount > 0
    ? +(basePrice * (100 - discount) / 100).toFixed(2)
    : basePrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate card number (simple validation)
    if (!cardNumber || cardNumber.length < 16) {
      showToast({ message: 'Пожалуйста, введите корректный номер карты' });
      return;
    }

    // Set to processing state
    setPaymentStatus(PaymentStatus.PROCESSING);

    try {
      // Simulate payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would call a payment service here
      // For demo, we'll just simulate a successful payment 
      
      // Add tokens to the user's balance through a server endpoint
      await axios.post('/api/transactions/add-balance', {
        email: user.email,
        tokens: parseInt(tokens, 10)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      // Update balance state in the app
      queryClient.invalidateQueries(['balance']);
      
      setPaymentStatus(PaymentStatus.SUCCESS);
      
      // Reset form after successful payment
      setTimeout(() => {
        setTokens('500000');
        setCardNumber('');
        setExpiryDate('');
        setCvv('');
      }, 1000);
      
    } catch (error) {
      console.error('Payment error:', error);
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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-800 dark:text-gray-200">
            {paymentStatus === PaymentStatus.SUCCESS 
              ? 'Оплата прошла успешно!'
              : paymentStatus === PaymentStatus.FAILURE
                ? 'Ошибка оплаты'
                : 'Пополнить баланс токенов'}
          </Dialog.Title>
          
          <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {paymentStatus === PaymentStatus.SUCCESS 
              ? `Ваш баланс был пополнен на ${tokens} токенов`
              : paymentStatus === PaymentStatus.FAILURE
                ? 'К сожалению, возникла ошибка при обработке платежа. Пожалуйста, попробуйте снова.'
                : 'Выберите количество токенов для пополнения.'}
          </Dialog.Description>
          
          {paymentStatus === PaymentStatus.IDLE && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="promo" className="block text-sm font-medium text-gray-700">Промокод</label>
                <div className="mt-1 flex space-x-2">
                  <input
                    id="promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Введите код"
                    className="flex-1 rounded-md border-gray-300 px-3 py-2"
                  />
                  <button
                    type="button"
                    disabled={!promoCode || promoLoading}
                    onClick={async () => {
                      setPromoError(''); setPromoLoading(true);
                      try {
                        const res = await axios.post(
                          '/api/promocodes/validate',
                          { code: promoCode },
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
                    className="bg-gray-600 text-white px-4 rounded"
                  >{promoLoading ? '...' : 'Проверить'}</button>
                </div>
                {discount > 0 && <p className="mt-1 text-green-600">Скидка {discount}% применена</p>}
                {promoError && <p className="mt-1 text-red-600">{promoError}</p>}
              </div>
              
              <div>
                <label htmlFor="tokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Количество токенов
                </label>
                <select
                  id="tokens"
                  value={tokens}
                  onChange={(e) => setTokens(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="500000">500,000 токенов (8 USD)</option>
                  <option value="1000000">1,000,000 токенов (16 USD)</option>
                  <option value="2500000">2,500,000 токенов (40 USD)</option>
                  <option value="5000000">5,000,000 токенов (80 USD)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="card" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Номер карты
                </label>
                <input
                  type="text"
                  id="card"
                  maxLength={16}
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Срок действия
                  </label>
                  <input
                    type="text"
                    id="expiry"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 2) {
                        value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
                      }
                      setExpiryDate(value);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                
                <div className="w-24">
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    placeholder="123"
                    maxLength={3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mt-4">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Токены:</span>
                  <span>{parseInt(tokens, 10).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300 mt-1">
                  <span>Цена:</span>
                  <span>${price.toFixed(2)} USD</span>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="mr-2 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:bg-indigo-800"
                >
                  Оплатить ${price.toFixed(2)}
                </button>
              </div>
            </form>
          )}
          
          {paymentStatus === PaymentStatus.PROCESSING && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-indigo-500"></div>
              <p className="mt-4 text-gray-700 dark:text-gray-300">Обработка платежа...</p>
            </div>
          )}
          
          {paymentStatus === PaymentStatus.SUCCESS && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-gray-700 dark:text-gray-300">Спасибо за пополнение! Токены добавлены на ваш счет.</p>
              
              <button
                onClick={() => onOpenChange(false)}
                className="mt-6 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:bg-indigo-800"
              >
                Готово
              </button>
            </div>
          )}
          
          {paymentStatus === PaymentStatus.FAILURE && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-16 w-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-gray-700 dark:text-gray-300">Произошла ошибка при обработке платежа. Пожалуйста, проверьте данные карты и попробуйте снова.</p>
              
              <div className="flex mt-6 space-x-3">
                <button
                  onClick={() => setPaymentStatus(PaymentStatus.IDLE)}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:bg-indigo-800"
                >
                  Попробовать снова
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
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