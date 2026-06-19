import express from 'express';
import { authenticate } from '../middleware/auth';
import { tasks, plans, saveTasks, savePlans } from '../utils/sharedData';

const router = express.Router();

// 获取当前用户的所有任务（通过关联计划过滤）
router.get('/', authenticate, (req, res) => {
  const userPlanIds = plans.filter(p => p.user_id === req.user?.id).map(p => p.id);
  const userTasks = tasks.filter(t => userPlanIds.includes(t.plan_id));
  res.json(userTasks);
});

router.put('/:id', authenticate, (req, res) => {
  const { completed } = req.body;
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
    completed,
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
  res.json(tasks[index]);
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
