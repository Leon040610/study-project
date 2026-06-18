import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

interface Reminder {
  id: string;
  plan_id: string;
  reminder_time: string;
  method: 'email' | 'push';
  frequency: 'daily' | 'weekly';
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const reminders: Reminder[] = [];

router.get('/', authenticate, (req, res) => {
  const userReminders = reminders.filter(r => {
    return true;
  });
  res.json(userReminders);
});

router.post('/', authenticate, (req, res) => {
  const { planId, time, method, frequency } = req.body;
  
  if (!planId || !time || !method || !frequency) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  
  const reminder: Reminder = {
    id,
    plan_id: planId,
    reminder_time: time,
    method,
    frequency,
    enabled: true,
    created_at: now,
    updated_at: now,
  };
  
  reminders.push(reminder);
  
  res.status(201).json(reminder);
});

router.put('/:id', authenticate, (req, res) => {
  const index = reminders.findIndex(r => r.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '提醒不存在' });
  }
  
  const { time, method, frequency, enabled } = req.body;
  
  reminders[index] = {
    ...reminders[index],
    reminder_time: time || reminders[index].reminder_time,
    method: method || reminders[index].method,
    frequency: frequency || reminders[index].frequency,
    enabled: enabled !== undefined ? enabled : reminders[index].enabled,
    updated_at: new Date().toISOString(),
  };
  
  res.json(reminders[index]);
});

router.delete('/:id', authenticate, (req, res) => {
  const index = reminders.findIndex(r => r.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '提醒不存在' });
  }
  
  reminders.splice(index, 1);
  
  res.json({ success: true });
});

export { router as reminderRouter };
