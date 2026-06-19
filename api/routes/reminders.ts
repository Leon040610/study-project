import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  reminderRules,
  userPreferences,
  type ReminderRule,
  type UserPreferences,
  startScheduler,
  triggerScanNow,
} from '../services/schedulerService';
import {
  getNotificationLogs,
  getNotificationStats,
  sendNotification,
  type NotificationChannel,
} from '../services/notificationService';

const router = express.Router();

// 启动调度器
startScheduler();

// ---- 提醒规则管理 ----

// 获取用户的提醒规则列表
router.get('/rules', authenticate, (req, res) => {
  const rules = reminderRules.filter(r => r.userId === req.user!.id);
  res.json(rules);
});

// 创建提醒规则
router.post('/rules', authenticate, (req, res) => {
  const { planId, triggerType, triggerTime, advanceMinutes, frequency, channel, enabled } = req.body;

  if (!triggerType || !channel) {
    return res.status(400).json({ error: '缺少必填字段: triggerType, channel' });
  }

  const validChannels: NotificationChannel[] = ['email', 'push', 'both'];
  if (!validChannels.includes(channel)) {
    return res.status(400).json({ error: '无效的渠道类型' });
  }

  const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  const rule: ReminderRule = {
    id,
    userId: req.user!.id,
    planId: planId || undefined,
    triggerType,
    triggerTime: triggerTime || undefined,
    advanceMinutes: advanceMinutes || undefined,
    frequency: frequency || undefined,
    channel,
    enabled: enabled !== undefined ? enabled : true,
    createdAt: now,
    updatedAt: now,
  };

  reminderRules.push(rule);
  res.status(201).json(rule);
});

// 更新提醒规则
router.put('/rules/:id', authenticate, (req, res) => {
  const index = reminderRules.findIndex(r => r.id === req.params.id && r.userId === req.user!.id);

  if (index === -1) {
    return res.status(404).json({ error: '提醒规则不存在' });
  }

  const { planId, triggerType, triggerTime, advanceMinutes, frequency, channel, enabled } = req.body;

  reminderRules[index] = {
    ...reminderRules[index],
    planId: planId !== undefined ? planId : reminderRules[index].planId,
    triggerType: triggerType || reminderRules[index].triggerType,
    triggerTime: triggerTime !== undefined ? triggerTime : reminderRules[index].triggerTime,
    advanceMinutes: advanceMinutes !== undefined ? advanceMinutes : reminderRules[index].advanceMinutes,
    frequency: frequency !== undefined ? frequency : reminderRules[index].frequency,
    channel: channel || reminderRules[index].channel,
    enabled: enabled !== undefined ? enabled : reminderRules[index].enabled,
    updatedAt: new Date().toISOString(),
  };

  res.json(reminderRules[index]);
});

// 删除提醒规则
router.delete('/rules/:id', authenticate, (req, res) => {
  const index = reminderRules.findIndex(r => r.id === req.params.id && r.userId === req.user!.id);

  if (index === -1) {
    return res.status(404).json({ error: '提醒规则不存在' });
  }

  reminderRules.splice(index, 1);
  res.json({ success: true });
});

// ---- 用户偏好设置 ----

// 获取用户偏好
router.get('/preferences', authenticate, (req, res) => {
  let prefs = userPreferences.find(p => p.userId === req.user!.id);

  // 首次访问创建默认偏好
  if (!prefs) {
    prefs = {
      userId: req.user!.id,
      email: req.user!.email,
      defaultChannel: 'both',
      advanceMinutes: 30,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      updatedAt: new Date().toISOString(),
    };
    userPreferences.push(prefs);
  }

  res.json(prefs);
});

// 更新用户偏好
router.put('/preferences', authenticate, (req, res) => {
  const { defaultChannel, advanceMinutes, quietHoursStart, quietHoursEnd, pushToken } = req.body;

  let index = userPreferences.findIndex(p => p.userId === req.user!.id);

  if (index === -1) {
    // 创建新偏好
    const prefs: UserPreferences = {
      userId: req.user!.id,
      email: req.user!.email,
      defaultChannel: defaultChannel || 'both',
      advanceMinutes: advanceMinutes ?? 30,
      quietHoursStart: quietHoursStart || '22:00',
      quietHoursEnd: quietHoursEnd || '07:00',
      pushToken: pushToken,
      updatedAt: new Date().toISOString(),
    };
    userPreferences.push(prefs);
    return res.json(prefs);
  }

  userPreferences[index] = {
    ...userPreferences[index],
    defaultChannel: defaultChannel || userPreferences[index].defaultChannel,
    advanceMinutes: advanceMinutes !== undefined ? advanceMinutes : userPreferences[index].advanceMinutes,
    quietHoursStart: quietHoursStart !== undefined ? quietHoursStart : userPreferences[index].quietHoursStart,
    quietHoursEnd: quietHoursEnd !== undefined ? quietHoursEnd : userPreferences[index].quietHoursEnd,
    pushToken: pushToken !== undefined ? pushToken : userPreferences[index].pushToken,
    updatedAt: new Date().toISOString(),
  };

  res.json(userPreferences[index]);
});

// ---- 通知日志 ----

// 获取通知日志
router.get('/logs', authenticate, (req, res) => {
  const status = req.query.status as string | undefined;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const logs = getNotificationLogs(req.user!.id, {
    status: status as any,
    limit,
    offset,
  });

  res.json(logs);
});

// 获取通知统计
router.get('/stats', authenticate, (req, res) => {
  const stats = getNotificationStats(req.user!.id);
  res.json(stats);
});

// ---- 手动触发 ----

// 手动触发一次扫描（管理员测试用）
router.post('/scan', authenticate, (req, res) => {
  triggerScanNow();
  res.json({ success: true, message: '扫描已触发' });
});

// 手动发送测试通知
router.post('/test', authenticate, (req, res) => {
  const prefs = userPreferences.find(p => p.userId === req.user!.id);
  const channel = prefs?.defaultChannel || 'both';

  sendNotification(
    {
      userId: req.user!.id,
      userEmail: req.user!.email,
      taskId: 'test_task',
      taskTitle: '测试提醒 - 学习任务即将到期',
      taskDescription: '这是一条测试通知，验证提醒功能是否正常工作。',
      dueDate: new Date(Date.now() + 30 * 60_000).toISOString(),
      priority: 'normal',
      planTitle: '测试计划',
    },
    channel
  );

  res.json({ success: true, message: '测试通知已发送' });
});

// ---- 兼容旧接口 ----

router.get('/', authenticate, (req, res) => {
  const rules = reminderRules.filter(r => r.userId === req.user!.id);
  res.json(rules);
});

export { router as reminderRouter };
