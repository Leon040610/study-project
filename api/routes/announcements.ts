import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
  created_at: string;
  updated_at: string;
}

const announcements: Announcement[] = [
  {
    id: '1',
    title: '系统更新通知',
    content: '系统将于本周六进行维护升级，届时将暂停服务2小时。请提前保存您的学习进度。',
    priority: 'high',
    created_at: new Date('2026-06-15').toISOString(),
    updated_at: new Date('2026-06-15').toISOString(),
  },
  {
    id: '2',
    title: '新功能上线',
    content: '日历视图功能已上线，可在首页查看今日任务安排，支持任务拖拽和日期筛选。',
    priority: 'normal',
    created_at: new Date('2026-06-14').toISOString(),
    updated_at: new Date('2026-06-14').toISOString(),
  },
];

router.get('/', (req, res) => {
  res.json(announcements);
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  const { title, content, priority } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ message: '缺少必填字段' });
  }
  
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  
  const announcement: Announcement = {
    id,
    title,
    content,
    priority: (priority as 'high' | 'normal' | 'low') || 'normal',
    created_at: now,
    updated_at: now,
  };
  
  announcements.push(announcement);
  res.status(201).json(announcement);
});

router.get('/:id', (req, res) => {
  const announcement = announcements.find(a => a.id === req.params.id);
  
  if (!announcement) {
    return res.status(404).json({ message: '公告不存在' });
  }
  
  res.json(announcement);
});

router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const index = announcements.findIndex(a => a.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: '公告不存在' });
  }
  
  const { title, content, priority } = req.body;
  
  announcements[index] = {
    ...announcements[index],
    title: title || announcements[index].title,
    content: content || announcements[index].content,
    priority: (priority as 'high' | 'normal' | 'low') || announcements[index].priority,
    updated_at: new Date().toISOString(),
  };
  
  res.json(announcements[index]);
});

router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const index = announcements.findIndex(a => a.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: '公告不存在' });
  }
  
  announcements.splice(index, 1);
  res.json({ success: true });
});

export { router as announcementRouter };