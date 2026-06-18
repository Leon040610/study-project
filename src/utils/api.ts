import { useAuthStore } from '@/store/authStore';
import type { 
  User, 
  Plan, 
  Task, 
  Reminder, 
  Resource,
  LoginData, 
  RegisterData, 
  PlanCreateData,
  ReminderCreateData 
} from '@/types';

const BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authAPI = {
  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  login: async (data: LoginData): Promise<{ user: User; token: string }> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  logout: async (): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getProfile: async (): Promise<User> => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

export const planAPI = {
  getAll: async (): Promise<Plan[]> => {
    const res = await fetch(`${BASE_URL}/plans`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  create: async (data: PlanCreateData): Promise<Plan> => {
    const res = await fetch(`${BASE_URL}/plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getById: async (id: string): Promise<{ plan: Plan; tasks: Task[] }> => {
    const res = await fetch(`${BASE_URL}/plans/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  update: async (id: string, data: Partial<PlanCreateData>): Promise<Plan> => {
    const res = await fetch(`${BASE_URL}/plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE_URL}/plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

export const taskAPI = {
  update: async (id: string, completed: boolean): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ completed }),
    });
    return res.json();
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

export const reminderAPI = {
  getAll: async (): Promise<Reminder[]> => {
    const res = await fetch(`${BASE_URL}/reminders`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  create: async (data: ReminderCreateData): Promise<Reminder> => {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: string, data: Partial<ReminderCreateData> & { enabled?: boolean }): Promise<Reminder> => {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE_URL}/reminders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};

export const resourceAPI = {
  getAll: async (): Promise<Resource[]> => {
    const res = await fetch(`${BASE_URL}/resources`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  getByCategory: async (category: string): Promise<Resource[]> => {
    const res = await fetch(`${BASE_URL}/resources/${category}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};
