export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  start_date: string;
  end_date: string;
  daily_minutes: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  plan_id: string;
  title: string;
  description?: string;
  due_date: string;
  completed: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  plan_id: string;
  reminder_time: string;
  method: 'email' | 'push';
  frequency: 'daily' | 'weekly';
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  type: 'book' | 'video' | 'article' | 'course';
  url: string;
  description?: string;
  author?: string;
  rating: number;
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  phone?: string;
  password: string;
  name: string;
}

export interface PlanCreateData {
  title: string;
  goal: string;
  startDate: string;
  endDate: string;
  dailyMinutes: number;
}

export interface ReminderCreateData {
  planId: string;
  time: string;
  method: 'email' | 'push';
  frequency: 'daily' | 'weekly';
}
