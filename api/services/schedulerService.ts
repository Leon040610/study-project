/**
 * 任务扫描调度器
 * 定期扫描即将到期的学习任务，根据用户提醒规则触发通知
 */

import { sendNotification, type NotificationPayload, type NotificationChannel, type NotificationPriority } from './notificationService';
import { tasks, plans, saveTasks, savePlans, type Task, type Plan } from '../utils/sharedData';
import { ArrayFileStore, FileStore } from '../utils/fileStore';

// ---- 类型定义 ----

export interface ReminderRule {
  id: string;
  userId: string;
  planId?: string;        // 关联计划，空表示所有计划
  triggerType: 'fixed_time' | 'before_due' | 'recurring';
  triggerTime?: string;    // HH:mm 格式，用于 fixed_time 和 recurring
  advanceMinutes?: number; // 提前分钟数，用于 before_due
  frequency?: 'daily' | 'weekly' | 'weekdays'; // 重复频率
  channel: NotificationChannel;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  email: string;
  defaultChannel: NotificationChannel;
  advanceMinutes: number;     // 默认提前提醒时间
  quietHoursStart?: string;   // 免打扰开始 HH:mm
  quietHoursEnd?: string;     // 免打扰结束 HH:mm
  pushToken?: string;         // Web Push 订阅 token
  updatedAt: string;
}

// ---- 数据存储（JSON 文件持久化） ----

const ruleStore = new ArrayFileStore<ReminderRule>('reminder_rules');
const prefStore = new ArrayFileStore<UserPreferences>('user_preferences');

export const reminderRules = ruleStore.load();
export const userPreferences = prefStore.load();

// ---- 持久化方法（供路由层调用） ----
export function saveRules(): void { ruleStore.save(reminderRules); }
export function savePrefs(): void { prefStore.save(userPreferences); }

// ---- 已发送去重（避免同一任务重复提醒） ----

const sentCache: Map<string, string> = new Map(); // key: `${taskId}_${ruleId}` → sent ISO

// ---- 调度器配置 ----

const SCAN_INTERVAL_MS = 60_000; // 每分钟扫描一次

let schedulerTimer: NodeJS.Timeout | null = null;

/**
 * 判断当前时间是否在免打扰时段
 */
function isQuietHours(prefs: UserPreferences): boolean {
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
  const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // 处理跨天的情况（如 22:00 - 07:00）
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/**
 * 获取用户偏好
 */
function getUserPreferences(userId: string): UserPreferences | undefined {
  return userPreferences.find(p => p.userId === userId);
}

/**
 * 获取用户适用的提醒规则
 */
function getApplicableRules(userId: string, planId: string): ReminderRule[] {
  return reminderRules.filter(rule => {
    if (!rule.enabled) return false;
    if (rule.userId !== userId) return false;
    // 匹配特定计划或所有计划
    if (rule.planId && rule.planId !== planId) return false;
    return true;
  });
}

/**
 * 构建通知载荷
 */
function buildPayload(
  task: Task,
  plan: Plan | undefined,
  userEmail: string
): NotificationPayload {
  const priorityMap: Record<number, NotificationPriority> = {
    1: 'urgent',
    2: 'high',
    3: 'normal',
    4: 'low',
  };

  return {
    userId: plan?.user_id || '',
    userEmail,
    taskId: task.id,
    taskTitle: task.title,
    taskDescription: task.description,
    dueDate: task.due_date,
    priority: priorityMap[task.priority] || 'normal',
    planTitle: plan?.title,
  };
}

// 需要导入 NotificationPriority 类型 - 已在文件顶部导入

/**
 * 检查单个任务是否需要触发提醒
 */
function checkTaskReminders(task: Task, plan: Plan | undefined): void {
  if (task.completed) return;

  const userId = plan?.user_id;
  if (!userId) return;

  const prefs = getUserPreferences(userId);
  if (!prefs) return;

  // 免打扰检查
  if (isQuietHours(prefs)) return;

  const rules = getApplicableRules(userId, task.plan_id);
  const now = Date.now();
  const dueTime = new Date(task.due_date).getTime();

  for (const rule of rules) {
    const cacheKey = `${task.id}_${rule.id}`;
    const lastSent = sentCache.get(cacheKey);

    // 去重：同一规则对同一任务 1 小时内不重复发送
    if (lastSent && now - new Date(lastSent).getTime() < 3600_000) continue;

    let shouldTrigger = false;

    switch (rule.triggerType) {
      case 'before_due': {
        const advanceMs = (rule.advanceMinutes ?? prefs.advanceMinutes) * 60_000;
        const triggerTime = dueTime - advanceMs;
        // 在触发时间前后 2 分钟内
        shouldTrigger = now >= triggerTime && now < triggerTime + 120_000 && now < dueTime;
        break;
      }

      case 'fixed_time': {
        if (!rule.triggerTime) break;
        const [h, m] = rule.triggerTime.split(':').map(Number);
        const today = new Date();
        const triggerDate = new Date(today);
        triggerDate.setHours(h, m, 0, 0);
        const triggerTime = triggerDate.getTime();
        shouldTrigger = now >= triggerTime && now < triggerTime + 120_000 && now < dueTime;
        break;
      }

      case 'recurring': {
        if (!rule.triggerTime) break;
        const [h, m] = rule.triggerTime.split(':').map(Number);
        const today = new Date();
        const triggerDate = new Date(today);
        triggerDate.setHours(h, m, 0, 0);
        const triggerTime = triggerDate.getTime();

        // 检查频率
        const dayOfWeek = today.getDay();
        if (rule.frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) break;
        if (rule.frequency === 'weekly' && dayOfWeek !== 1) break; // 每周一

        shouldTrigger = now >= triggerTime && now < triggerTime + 120_000;
        break;
      }
    }

    if (shouldTrigger) {
      const payload = buildPayload(task, plan, prefs.email);
      console.log(`[调度器] 触发提醒: 任务="${task.title}" 规则=${rule.id} 渠道=${rule.channel}`);
      sendNotification(payload, rule.channel);
      sentCache.set(cacheKey, new Date().toISOString());
    }
  }
}

/**
 * 执行一次扫描
 */
export function scanTasks(): void {
  try {
    const allTasks = tasks;
    const allPlans = plans;

    if (allTasks.length === 0) return;

    let checkedCount = 0;

    for (const task of allTasks) {
      if (task.completed) continue;
      const plan = allPlans.find((p: Plan) => p.id === task.plan_id);
      checkTaskReminders(task, plan);
      checkedCount++;
    }

    // 清理过期的去重缓存（超过 24 小时）
    const cutoff = Date.now() - 24 * 3600_000;
    for (const [key, sentAt] of sentCache.entries()) {
      if (new Date(sentAt).getTime() < cutoff) {
        sentCache.delete(key);
      }
    }

    if (checkedCount > 0) {
      console.log(`[调度器] 扫描完成: 检查 ${checkedCount} 个任务`);
    }
  } catch (err) {
    console.error('[调度器] 扫描异常:', err);
  }
}

/**
 * 启动调度器
 */
export function startScheduler(): void {
  if (schedulerTimer) {
    console.log('[调度器] 已在运行中');
    return;
  }

  console.log(`[调度器] 启动，每 ${SCAN_INTERVAL_MS / 1000}s 扫描一次`);
  schedulerTimer = setInterval(scanTasks, SCAN_INTERVAL_MS);
}

/**
 * 停止调度器
 */
export function stopScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[调度器] 已停止');
  }
}

/**
 * 手动触发一次扫描（用于测试）
 */
export function triggerScanNow(): void {
  scanTasks();
}
