import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

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

declare global {
  const tasks: Task[];
  const plans: Plan[];
}

const globalTasks: Task[] = [];
const globalPlans: Plan[] = [];

Object.assign(global, { tasks: globalTasks, plans: globalPlans });

router.put('/:id', authenticate, (req, res) => {
  const { completed } = req.body;
  const index = globalTasks.findIndex(t => t.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  globalTasks[index] = {
    ...globalTasks[index],
    completed,
    updated_at: new Date().toISOString(),
  };
  
  const planId = globalTasks[index].plan_id;
  const planIndex = globalPlans.findIndex(p => p.id === planId);
  
  if (planIndex !== -1) {
    const planTasks = globalTasks.filter(t => t.plan_id === planId);
    const completedCount = planTasks.filter(t => t.completed).length;
    const progress = (completedCount / planTasks.length) * 100;
    
    globalPlans[planIndex] = {
      ...globalPlans[planIndex],
      progress,
      updated_at: new Date().toISOString(),
    };
  }
  
  res.json(globalTasks[index]);
});

router.delete('/:id', authenticate, (req, res) => {
  const index = globalTasks.findIndex(t => t.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  globalTasks.splice(index, 1);
  
  res.json({ success: true });
});

export { router as taskRouter };
