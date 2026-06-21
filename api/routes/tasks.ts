import express from 'express';
import { authenticate } from '../middleware/auth';
import { tasks, plans, saveTasks, savePlans, type Task } from '../utils/sharedData';

const router = express.Router();

// 将后端 snake_case 转为前端 camelCase
function toClientTask(t: Task) {
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

// 获取当前用户的所有任务（通过关联计划过滤）
router.get('/', authenticate, (req, res) => {
  const userPlanIds = plans.filter(p => p.user_id === req.user?.id).map(p => p.id);
  const userTasks = tasks.filter(t => userPlanIds.includes(t.plan_id));
  res.json(userTasks.map(toClientTask));
});

// 创建新任务
router.post('/', authenticate, (req, res) => {
  const { title, planTitle, date, startDate, endDate } = req.body;
  
  if (!title || !planTitle || !date) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  
  // 通过 planTitle 查找关联计划
  const plan = plans.find(p => p.title === planTitle && p.user_id === req.user?.id);
  if (!plan) {
    return res.status(404).json({ error: '关联计划不存在' });
  }
  
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  
  const task: Task = {
    id,
    plan_id: plan.id,
    title,
    description: '',
    due_date: date,
    start_date: startDate || date,
    end_date: endDate || date,
    completed: false,
    completed_dates: {},
    priority: 2,
    created_at: now,
    updated_at: now,
  };
  
  tasks.push(task);
  saveTasks();
  
  res.status(201).json(toClientTask(task));
});

router.put('/:id', authenticate, (req, res) => {
  const { completed, completedDates } = req.body;
  const index = tasks.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }

  // 验证任务归属：通过关联计划确认当前用户有权操作
  const taskPlan = plans.find(p => p.id === tasks[index].plan_id);
  if (!taskPlan || taskPlan.user_id !== req.user?.id) {
    return res.status(403).json({ error: '无权操作此任务' });
  }

  tasks[index] = {
    ...tasks[index],
    completed: completed !== undefined ? completed : tasks[index].completed,
    completed_dates: completedDates !== undefined ? completedDates : tasks[index].completed_dates,
    updated_at: new Date().toISOString(),
  };

  const planId = tasks[index].plan_id;
  const planIndex = plans.findIndex(p => p.id === planId);

  if (planIndex !== -1) {
    const planTasks = tasks.filter(t => t.plan_id === planId);
    const completedCount = planTasks.filter(t => t.completed).length;
    const progress = (completedCount / planTasks.length) * 100;

    plans[planIndex] = {
      ...plans[planIndex],
      progress,
      updated_at: new Date().toISOString(),
    };
    savePlans();
  }

  saveTasks();
  res.json(toClientTask(tasks[index]));
});

router.delete('/:id', authenticate, (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }

  // 验证任务归属：通过关联计划确认当前用户有权操作
  const taskPlan = plans.find(p => p.id === tasks[index].plan_id);
  if (!taskPlan || taskPlan.user_id !== req.user?.id) {
    return res.status(403).json({ error: '无权操作此任务' });
  }

  tasks.splice(index, 1);
  saveTasks();

  res.json({ success: true });
});

export { router as taskRouter };
