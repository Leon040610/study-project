const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ========== JSON 文件持久化 ==========
const DATA_FILE = path.join(__dirname, 'data.json');

// 默认初始数据
const defaultData = {
  users: [],
  goals: [],
  plans: [],
  tasks: [],
  reminders: [],
  announcements: [
    { id: 1, title: '系统更新通知', content: '系统将于本周六进行维护升级，届时将暂停服务2小时。', priority: 'high', createdAt: '2026-06-15' },
    { id: 2, title: '新功能上线', content: '日历视图功能已上线，可在首页查看今日任务安排。', priority: 'normal', createdAt: '2026-06-14' },
    { id: 3, title: '学习提醒', content: '请及时完成本周学习任务，保持学习进度。', priority: 'normal', createdAt: '2026-06-13' }
  ],
  resources: [
    { id: 1, title: 'JavaScript高级编程', type: 'book', category: '编程', url: 'https://example.com/js-book' },
    { id: 2, title: 'React官方文档', type: 'doc', category: '编程', url: 'https://react.dev' },
    { id: 3, title: 'Python入门教程', type: 'video', category: '编程', url: 'https://example.com/python-video' },
    { id: 4, title: '数据结构与算法', type: 'book', category: '算法', url: 'https://example.com/algorithm-book' },
    { id: 5, title: '机器学习实战', type: 'book', category: 'AI', url: 'https://example.com/ml-book' },
  ],
  userIdCounter: 1,
  goalIdCounter: 1,
  planIdCounter: 1,
  taskIdCounter: 1,
  reminderIdCounter: 1
};

// 从文件加载数据，文件不存在则使用默认数据
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return data;
    }
  } catch (e) {
    console.log('数据文件读取失败，使用默认数据:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

// 保存数据到文件
function saveData() {
  try {
    const data = {
      users, goals, plans, tasks, reminders, announcements, resources,
      userIdCounter, goalIdCounter, planIdCounter, taskIdCounter, reminderIdCounter
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('数据保存失败:', e.message);
  }
}

// 启动时加载数据
const persisted = loadData();
let users = persisted.users || [];
let goals = persisted.goals || [];
let plans = persisted.plans || [];
let tasks = persisted.tasks || [];
let reminders = persisted.reminders || [];
let announcements = persisted.announcements || defaultData.announcements;
let resources = persisted.resources || defaultData.resources;
let userIdCounter = persisted.userIdCounter || 1;
let goalIdCounter = persisted.goalIdCounter || 1;
let planIdCounter = persisted.planIdCounter || 1;
let taskIdCounter = persisted.taskIdCounter || 1;
let reminderIdCounter = persisted.reminderIdCounter || 1;

function generateToken(email) {
  return 'token_' + Date.now() + '_' + email;
}

// 认证接口
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: '请填写必填字段' });
  }
  
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ message: '该邮箱已注册' });
  }
  
  const user = { id: userIdCounter++, name, email, phone: phone || '', password, role: 'student', createdAt: new Date() };
  users.push(user);
  saveData();
  
  const token = generateToken(email);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'student', created_at: user.createdAt } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: '邮箱或密码错误' });
  }
  
  const token = generateToken(email);
  // 将用户信息存入 token 映射，用于后续获取 profile
  tokenUserMap.set(token, { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt } });
});

// token 到用户信息的映射
const tokenUserMap = new Map();

app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userInfo = tokenUserMap.get(token);
    if (userInfo) {
      return res.json(userInfo);
    }
  }
  // 如果没有找到 token 对应的用户，返回 401
  res.status(401).json({ message: '未登录' });
});

app.put('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userInfo = tokenUserMap.get(token);
    if (userInfo) {
      // 更新用户信息
      if (req.body.phone !== undefined) userInfo.phone = req.body.phone;
      if (req.body.name) userInfo.name = req.body.name;
      tokenUserMap.set(token, userInfo);
      // 同步更新 users 数组中的用户信息
      const dbUser = users.find(u => u.email === userInfo.email);
      if (dbUser) {
        if (req.body.phone !== undefined) dbUser.phone = req.body.phone;
        if (req.body.name) dbUser.name = req.body.name;
        saveData();
      }
      return res.json(userInfo);
    }
  }
  res.status(401).json({ message: '未登录' });
});

app.post('/api/auth/change-password', (req, res) => {
  res.json({ message: '密码修改成功' });
});

// 学习目标接口
app.get('/api/goals', (req, res) => {
  res.json(goals);
});

app.post('/api/goals', (req, res) => {
  const goal = {
    id: String(goalIdCounter++),
    ...req.body,
    progress: req.body.progress || 0,
    status: req.body.status || '进行中',
    createdAt: new Date()
  };
  goals.push(goal);
  saveData();
  res.json(goal);
});

app.put('/api/goals/:id', (req, res) => {
  const goal = goals.find(g => g.id === req.params.id || String(g.id) === String(req.params.id));
  if (!goal) return res.status(404).json({ message: '目标不存在' });
  Object.assign(goal, req.body);
  saveData();
  res.json(goal);
});

app.delete('/api/goals/:id', (req, res) => {
  goals = goals.filter(g => g.id !== req.params.id && String(g.id) !== String(req.params.id));
  saveData();
  res.json({ message: '删除成功' });
});

// 学习计划接口
app.get('/api/plans', (req, res) => {
  res.json(plans);
});

app.post('/api/plans', (req, res) => {
  const plan = {
    id: String(planIdCounter++),
    ...req.body,
    createdAt: new Date()
  };
  plans.push(plan);
  saveData();
  res.json(plan);
});

app.get('/api/plans/:id', (req, res) => {
  const plan = plans.find(p => p.id === req.params.id || String(p.id) === String(req.params.id));
  if (!plan) return res.status(404).json({ message: '计划不存在' });
  res.json(plan);
});

app.put('/api/plans/:id', (req, res) => {
  const plan = plans.find(p => p.id === req.params.id || String(p.id) === String(req.params.id));
  if (!plan) return res.status(404).json({ message: '计划不存在' });
  Object.assign(plan, req.body);
  saveData();
  res.json(plan);
});

app.delete('/api/plans/:id', (req, res) => {
  plans = plans.filter(p => p.id !== req.params.id && String(p.id) !== String(req.params.id));
  saveData();
  res.json({ message: '删除成功' });
});

// 任务接口
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const task = {
    id: String(taskIdCounter++),
    ...req.body,
    completed: false,
    createdAt: new Date()
  };
  tasks.push(task);
  saveData();
  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id || String(t.id) === String(req.params.id));
  if (!task) return res.status(404).json({ message: '任务不存在' });
  Object.assign(task, req.body);
  saveData();
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  tasks = tasks.filter(t => t.id !== req.params.id && String(t.id) !== String(req.params.id));
  saveData();
  res.json({ message: '删除成功' });
});

// 提醒接口
app.get('/api/reminders', (req, res) => {
  res.json(reminders);
});

app.post('/api/reminders', (req, res) => {
  const reminder = {
    id: reminderIdCounter++,
    ...req.body,
    createdAt: new Date(),
  };
  reminders.push(reminder);
  saveData();
  res.json(reminder);
});

// 资源接口
app.get('/api/resources', (req, res) => {
  const category = req.query.category;
  if (category) {
    res.json(resources.filter(r => r.category === category));
  } else {
    res.json(resources);
  }
});

// 公告接口
app.get('/api/announcements', (req, res) => {
  res.json(announcements);
});

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
