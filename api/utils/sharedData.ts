/**
 * 共享数据存储
 *
 * 所有路由模块通过此文件共享同一份数据引用，
 * 确保文件持久化的一致性。
 */

import { ArrayFileStore } from './fileStore';

// ---- 类型定义 ----

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

// ---- 文件存储实例（单例） ----

const planStore = new ArrayFileStore<Plan>('plans');
const taskStore = new ArrayFileStore<Task>('tasks');

// ---- 共享数据 ----

export const plans = planStore.load();
export const tasks = taskStore.load();

// ---- 持久化方法 ----

export function savePlans(): void { planStore.save(plans); }
export function saveTasks(): void { taskStore.save(tasks); }
