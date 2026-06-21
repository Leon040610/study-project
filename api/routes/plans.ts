import express from 'express';
import { authenticate } from '../middleware/auth';
import { plans, tasks, savePlans, saveTasks, type Plan, type Task } from '../utils/sharedData';

const router = express.Router();

// 将后端 snake_case 转为前端 camelCase
function toClientPlan(p: Plan) {
  return {
    id: p.id,
    title: p.title,
    goalTitle: p.goal,
    category: p.goal,
    startDate: p.start_date,
    endDate: p.end_date,
    description: '',
    progress: p.progress,
  };
}

function toClientTask(t: Task) {
  // 通过 plan_id 查找 plan title
  const plan = plans.find(p => p.id === t.plan_id);
  return {
    id: t.id,
    title: t.title,
    planTitle: plan?.title || '',
    date: t.due_date,
    completed: t.completed,
    completedDates: t.completed_dates || {},
    startDate: t.start_date || t.due_date,
    endDate: t.end_date || t.due_date,
  };
}

router.get('/', authenticate, (req, res) => {
  const userPlans = plans.filter(p => p.user_id === req.user?.id);
  res.json(userPlans.map(toClientPlan));
});

router.post('/', authenticate, (req, res) => {
  // 兼容前端字段名：goalTitle 或 goal 或 category
  const { title, goal, goalTitle, category, startDate, endDate, dailyMinutes, description } = req.body;
  const goalValue = goal || goalTitle || category;
  
  if (!title || !goalValue || !startDate || !endDate) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  
  const plan: Plan = {
    id,
    user_id: req.user!.id,
    title,
    goal: goalValue,
    start_date: startDate,
    end_date: endDate,
    daily_minutes: dailyMinutes || 60,
    progress: 0,
    created_at: now,
    updated_at: now,
  };
  
  plans.push(plan);
  savePlans();
  
  // 不再自动生成任务，任务由前端通过 POST /tasks 创建
  
  res.status(201).json(toClientPlan(plan));
});

router.get('/:id', authenticate, (req, res) => {
  const plan = plans.find(p => p.id === req.params.id && p.user_id === req.user?.id);
  
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' });
  }
  
  const planTasks = tasks.filter(t => t.plan_id === req.params.id);
  
  res.json({ plan: toClientPlan(plan), tasks: planTasks.map(toClientTask) });
});

router.put('/:id', authenticate, (req, res) => {
  const index = plans.findIndex(p => p.id === req.params.id && p.user_id === req.user?.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '计划不存在' });
  }
  
  const { title, goal, goalTitle, category, startDate, endDate, dailyMinutes } = req.body;
  const goalValue = goal || goalTitle || category;
  
  plans[index] = {
    ...plans[index],
    title: title || plans[index].title,
    goal: goalValue || plans[index].goal,
    start_date: startDate || plans[index].start_date,
    end_date: endDate || plans[index].end_date,
    daily_minutes: dailyMinutes !== undefined ? dailyMinutes : plans[index].daily_minutes,
    updated_at: new Date().toISOString(),
  };
  savePlans();
  
  res.json(toClientPlan(plans[index]));
});

router.delete('/:id', authenticate, (req, res) => {
  const index = plans.findIndex(p => p.id === req.params.id && p.user_id === req.user?.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '计划不存在' });
  }
  
  plans.splice(index, 1);
  savePlans();
  const remainingTasks = tasks.filter(t => t.plan_id !== req.params.id);
  tasks.length = 0;
  tasks.push(...remainingTasks);
  saveTasks();
  
  res.json({ success: true });
});

export { router as planRouter };
