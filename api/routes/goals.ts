import express from 'express';
import { authenticate } from '../middleware/auth';
import { ArrayFileStore } from '../utils/fileStore';

const router = express.Router();

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  target_date: string;
  status: '进行中' | '已完成' | '已放弃';
  progress: number;
  completed_tasks: number;
  total_tasks: number;
  completed_date?: string;
  abandoned_date?: string;
  created_at: string;
  updated_at: string;
}

const goalStore = new ArrayFileStore<Goal>('goals');
const goals = goalStore.load();

// 将后端 snake_case 转为前端 camelCase
function toClientGoal(g: Goal) {
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    category: g.category,
    targetDate: g.target_date,
    status: g.status,
    progress: g.progress,
    completedDate: g.completed_date,
    abandonedDate: g.abandoned_date,
  };
}

router.get('/', authenticate, (req, res) => {
  const userGoals = goals.filter(g => g.user_id === req.user?.id);
  res.json(userGoals.map(toClientGoal));
});

router.post('/', authenticate, (req, res) => {
  const { title, description, category, targetDate } = req.body;
  
  if (!title || !category || !targetDate) {
    return res.status(400).json({ message: '缺少必填字段' });
  }
  
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  
  const goal: Goal = {
    id,
    user_id: req.user!.id,
    title,
    description: description || '',
    category,
    target_date: targetDate,
    status: '进行中',
    progress: 0,
    completed_tasks: 0,
    total_tasks: 0,
    created_at: now,
    updated_at: now,
  };
  
  goals.push(goal);
  goalStore.save(goals);
  res.status(201).json(toClientGoal(goal));
});

router.get('/:id', authenticate, (req, res) => {
  const goal = goals.find(g => g.id === req.params.id && g.user_id === req.user?.id);
  
  if (!goal) {
    return res.status(404).json({ message: '目标不存在' });
  }
  
  res.json(toClientGoal(goal));
});

router.put('/:id', authenticate, (req, res) => {
  const index = goals.findIndex(g => g.id === req.params.id && g.user_id === req.user?.id);
  
  if (index === -1) {
    return res.status(404).json({ message: '目标不存在' });
  }
  
  const { title, description, category, targetDate, status, progress, completedDate } = req.body;
  
  if (status && status !== goals[index].status) {
    goals[index].status = status;
    if (status === '已完成') {
      goals[index].completed_date = new Date().toISOString();
      goals[index].progress = 100;
      goals[index].completed_tasks = goals[index].total_tasks;
    } else if (status === '已放弃') {
      goals[index].abandoned_date = new Date().toISOString();
    }
  }
  
  goals[index] = {
    ...goals[index],
    title: title || goals[index].title,
    description: description !== undefined ? description : goals[index].description,
    category: category || goals[index].category,
    target_date: targetDate || goals[index].target_date,
    progress: progress !== undefined ? progress : goals[index].progress,
    completed_date: completedDate !== undefined ? completedDate : goals[index].completed_date,
    updated_at: new Date().toISOString(),
  };
  goalStore.save(goals);
  
  res.json(toClientGoal(goals[index]));
});

router.delete('/:id', authenticate, (req, res) => {
  const index = goals.findIndex(g => g.id === req.params.id && g.user_id === req.user?.id);
  
  if (index === -1) {
    return res.status(404).json({ message: '目标不存在' });
  }
  
  goals.splice(index, 1);
  goalStore.save(goals);
  res.json({ success: true });
});

export { router as goalRouter };