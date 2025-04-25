import axios from 'axios';
import type { AxiosResponse } from 'axios';

export interface TSubscriptionPlan {
  _id: string;
  key: string;
  name: string;
  price: number;
  durationDays: number;
  messageLimit: number;
  allowedModels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TUserSubscription {
  _id: string;
  user: string;
  plan: TSubscriptionPlan;
  startDate: string;
  endDate: string;
  remainingMessages: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TUserSubscriptionResponse {
  success: boolean;
  subscription: TUserSubscription;
}

export interface TSubscriptionPlansResponse {
  success: boolean;
  plans: TSubscriptionPlan[];
}

// Создаем отдельный сервис для работы с подписками
export const subscriptionService = {
  // Получение текущей подписки пользователя
  getUserSubscription: async (): Promise<TUserSubscriptionResponse> => {
    const response: AxiosResponse<TUserSubscriptionResponse> = await axios.get(
      '/api/subscriptions/current'
    );
    return response.data;
  },
  
  // Получение списка тарифных планов
  getSubscriptionPlans: async (): Promise<TSubscriptionPlansResponse> => {
    const response = await axios.get('/api/subscriptions');
    return response.data;
  },
  
  // Инициирование подписки
  initiateSubscription: async (planKey: string) => {
    const response = await axios.post('/api/subscriptions/subscribe', { planKey });
    return response.data;
  },
  
  // Подтверждение подписки
  confirmSubscription: async (operationId: string, planKey: string) => {
    const response = await axios.post('/api/subscriptions/confirm', { 
      operationId, 
      planKey 
    });
    return response.data;
  }
};

// Экспортируем константу для ключа запроса
export const SUBSCRIPTION_QUERY_KEY = 'userSubscription';

export default subscriptionService; 