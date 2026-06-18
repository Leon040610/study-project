import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

interface Plan {
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

interface Task {
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

const plans: Plan[] = [];
const tasks: Task[] = [];

router.get('/', authenticate, (req, res) => {
  const userPlans = plans.filter(p => p.user_id === req.user?.id);
  res.json(userPlans);
});

router.post('/', authenticate, (req, res) => {
  const { title, goal, startDate, endDate, dailyMinutes } = req.body;
  
  if (!title || !goal || !startDate || !endDate) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  
  const plan: Plan = {
    id,
    user_id: req.user!.id,
    title,
    goal,
    start_date: startDate,
    end_date: endDate,
    daily_minutes: dailyMinutes || 60,
    progress: 0,
    created_at: now,
    updated_at: now,
  };
  
  plans.push(plan);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const subjects = ['基础知识', '核心概念', '实践练习', '综合复习', '模拟测试'];
  
  for (let i = 1; i <= Math.min(days, 14); i++) {
    const subjectIndex = (i - 1) % subjects.length;
    const weekNum = Math.ceil(i / 7);
    const dueDate = new Date(start);
    dueDate.setDate(start.getDate() + i - 1);
    
    tasks.push({
      id: Math.random().toString(36).substring(2, 15),
      plan_id: id,
      title: `第${weekNum}周 - ${subjects[subjectIndex]} - 第${i}天`,
      description: '',
      due_date: dueDate.toISOString().split('T')[0],
      completed: false,
      priority: 2,
      created_at: now,
      updated_at: now,
    });
  }
  
  res.status(201).json(plan);
});

router.get('/:id', authenticate, (req, res) => {
  const plan = plans.find(p => p.id === req.params.id && p.user_id === req.user?.id);
  
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' });
  }
  
  const planTasks = tasks.filter(t => t.plan_id === req.params.id);
  
  res.json({ plan, tasks: planTasks });
});

router.put('/:id', authenticate, (req, res) => {
  const index = plans.findIndex(p => p.id === req.params.id && p.user_id === req.user?.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '计划不存在' });
  }
  
  const { title, goal, startDate, endDate, dailyMinutes } = req.body;
  
  plans[index] = {
    ...plans[index],
    title: title || plans[index].title,
    goal: goal || plans[index].goal,
    start_date: startDate || plans[index].start_date,
    end_date: endDate || plans[index].end_date,
    daily_minutes: dailyMinutes !== undefined ? dailyMinutes : plans[index].daily_minutes,
    updated_at: new Date().toISOString(),
  };
  
  res.json(plans[index]);
});

router.delete('/:id', authenticate, (req, res) => {
  const index = plans.findIndex(p => p.id === req.params.id && p.user_id === req.user?.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '计划不存在' });
  }
  
  plans.splice(index, 1);
  const taskIndex = tasks.filter(t => t.plan_id !== req.params.id);
  tasks.length = 0;
  tasks.push(...taskIndex);
  
  res.json({ success: true });
});

export { router as planRouter };
