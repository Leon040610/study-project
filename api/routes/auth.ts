import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';

const router = express.Router();

interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  password: string;
  role: 'student' | 'admin';
  created_at: string;
  updated_at: string;
}

const users: Record<string, User> = {};

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

router.post('/register', async (req, res) => {
  const { email, phone, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ message: '缺少必填字段' });
  }
  
  if (users[email]) {
    return res.status(400).json({ message: '该邮箱已注册' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  const isAdmin = email === adminEmail;
  
  users[email] = {
    id,
    email,
    phone,
    name,
    password: hashedPassword,
    role: isAdmin ? 'admin' : 'student',
    created_at: now,
    updated_at: now,
  };
  
  const token = jwt.sign({ id, email, role: isAdmin ? 'admin' : 'student' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  
  res.status(201).json({
    user: { id, email, phone, name, role: isAdmin ? 'admin' : 'student', created_at: now, updated_at: now },
    token,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: '缺少必填字段' });
  }
  
  const user = users[email];
  
  if (!user) {
    return res.status(401).json({ message: '邮箱或密码错误' });
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return res.status(401).json({ message: '邮箱或密码错误' });
  }
  
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  
  res.json({
    user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, created_at: user.created_at, updated_at: user.updated_at },
    token,
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true });
});

router.get('/profile', authenticate, (req, res) => {
  const user = Object.values(users).find(u => u.id === req.user?.id);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, created_at: user.created_at, updated_at: user.updated_at });
});

router.put('/profile', authenticate, async (req, res) => {
  const user = Object.values(users).find(u => u.id === req.user?.id);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  const { name, phone } = req.body;
  
  if (name) user.name = name;
  if (phone) user.phone = phone;
  user.updated_at = new Date().toISOString();
  
  res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, created_at: user.created_at, updated_at: user.updated_at });
});

router.get('/captcha', (req, res) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < 4; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  res.json({
    image: `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="40" fill="#f1f5f9"/>
        <text x="20" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#1e40af">${captcha.charAt(0)}</text>
        <text x="45" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#0d9488">${captcha.charAt(1)}</text>
        <text x="70" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#f59e0b">${captcha.charAt(2)}</text>
        <text x="95" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#ef4444">${captcha.charAt(3)}</text>
      </svg>
    `).toString('base64')}`,
    captcha
  });
});

router.get('/users', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: '无权访问' });
  }
  
  const userList = Object.values(users).map(u => ({
    id: u.id,
    email: u.email,
    phone: u.phone,
    name: u.name,
    role: u.role,
    created_at: u.created_at,
    updated_at: u.updated_at,
  }));
  
  res.json(userList);
});

router.put('/users/:id', authenticate, async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: '无权访问' });
  }
  
  const user = Object.values(users).find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  const { role } = req.body;
  
  if (role && (role === 'student' || role === 'admin')) {
    user.role = role;
    user.updated_at = new Date().toISOString();
  }
  
  res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role, created_at: user.created_at, updated_at: user.updated_at });
});

router.delete('/users/:id', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: '无权访问' });
  }
  
  const user = Object.values(users).find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  delete users[user.email];
  res.json({ success: true });
});

export { router as authRouter };
