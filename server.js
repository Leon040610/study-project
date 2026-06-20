const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// 轻量 .env 加载器（不依赖 dotenv）
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // 去掉首尾引号
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
  console.log('[env] 已加载 .env 文件');
}
loadEnv();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json());

// ========== 文件上传配置 ==========
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // 修复中文文件名乱码
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${baseName}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// ========== 头像上传（独立 multer 实例） ==========
const AVATAR_DIR = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    let userId = 'guest';
    try {
      const auth = (req.headers && req.headers.authorization) || '';
      if (auth.startsWith('Bearer ')) {
        const u = tokenUserMap.get(auth.substring(7));
        if (u) userId = String(u.id);
      }
    } catch (e) { /* ignore */ }
    const extRaw = (file.originalname || '').toLowerCase();
    const ext = extRaw.endsWith('.png') ? '.png'
      : extRaw.endsWith('.webp') ? '.webp'
      : extRaw.endsWith('.jpeg') ? '.jpg'
      : path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, userId + '_' + Date.now() + ext);
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const mt = (file.mimetype || '').toLowerCase();
    const ok = /^image\/(png|jpe?g|webp)$/.test(mt);
    cb(ok ? null : new Error('仅支持 PNG / JPG / JPEG / WEBP 图片'), ok);
  }
});

// ========== 资源分类常量 ==========
const PRESET_CATEGORIES = [
  '编程开发', '数据科学', '数据库', '网络技术',
  '前端开发', '后端开发', '移动开发', '人工智能',
  '操作系统', '项目管理', '设计创意', '其他'
];
const RESERVED_CATEGORIES = [
  'admin', 'system', 'root', 'all', '全部', '默认', '系统', '管理'
];
const CATEGORY_PATTERN = /^[\u4e00-\u9fa5A-Za-z0-9 _\-+]+$/;

// ========== JSON 文件持久化 ==========
const DATA_FILE = path.join(__dirname, 'data.json');

const defaultData = {
  users: [],
  goals: [],
  plans: [],
  tasks: [],
  reminders: [],
  posts: [],
  comments: [],
  notificationLogs: [],
  userPreferences: [],
  reminderRules: [],
  announcements: [
    { id: 1, title: '系统更新通知', content: '系统将于本周六进行维护升级，届时将暂停服务2小时。', priority: 'high', createdAt: '2026-06-15' },
    { id: 2, title: '新功能上线', content: '日历视图功能已上线，可在首页查看今日任务安排。', priority: 'normal', createdAt: '2026-06-14' },
    { id: 3, title: '学习提醒', content: '请及时完成本周学习任务，保持学习进度。', priority: 'normal', createdAt: '2026-06-13' }
  ],
  resources: [
    { id: 'r1', title: 'JavaScript高级编程', description: '深入讲解JavaScript语言核心特性与最佳实践', category: '编程开发', type: 'ebook', downloadCount: 1256, rating: 4.8, fileUrl: '', author: 'Douglas Crockford', createdAt: '2026-06-15' },
    { id: 'r2', title: 'React官方教程', description: 'React 18 官方学习资源', category: '前端开发', type: 'ebook', downloadCount: 892, rating: 4.9, fileUrl: '', author: 'Meta', createdAt: '2026-06-14' },
    { id: 'r3', title: 'Python速成课程', description: '一周内学会Python编程', category: '编程开发', type: 'video', downloadCount: 654, rating: 4.7, fileUrl: '', author: 'Eric Matthes', createdAt: '2026-06-13' },
    { id: 'r4', title: '高等数学视频教程', description: '考研数学全套视频课程', category: '数据科学', type: 'video', downloadCount: 523, rating: 4.8, fileUrl: '', author: '考研名师', createdAt: '2026-06-12' },
    { id: 'r5', title: 'SQL学习手册', description: 'SQL数据库查询与优化技巧详解', category: '数据库', type: 'document', downloadCount: 432, rating: 4.6, fileUrl: '', author: 'DataCamp', createdAt: '2026-06-11' },
    { id: 'r6', title: 'Vue3实战项目', description: '使用Vue3构建企业级应用', category: '前端开发', type: 'video', downloadCount: 389, rating: 4.7, fileUrl: '', author: '社区贡献', createdAt: '2026-06-10' },
    { id: 'r7', title: '机器学习入门', description: '从零开始学习机器学习算法', category: '人工智能', type: 'ebook', downloadCount: 276, rating: 4.5, fileUrl: '', author: 'Andrew Ng', createdAt: '2026-06-09' },
    { id: 'r8', title: 'Linux命令速查', description: '常用Linux命令大全', category: '操作系统', type: 'document', downloadCount: 567, rating: 4.9, fileUrl: '', author: '社区贡献', createdAt: '2026-06-08' }
  ],
  userIdCounter: 1,
  goalIdCounter: 1,
  planIdCounter: 1,
  taskIdCounter: 1,
  reminderIdCounter: 1,
  postIdCounter: 1,
  commentIdCounter: 1,
  resourceIdCounter: 100,
  ruleIdCounter: 1
};

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

function saveData() {
  try {
    const data = {
      users, goals, plans, tasks, reminders, posts, comments, notificationLogs,
      userPreferences, reminderRules, announcements, resources,
      adminLogs, settings, backups,
      userIdCounter, goalIdCounter, planIdCounter, taskIdCounter, reminderIdCounter,
      postIdCounter, commentIdCounter, resourceIdCounter, ruleIdCounter
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('数据保存失败:', e.message);
  }
}

const persisted = loadData();
let users = persisted.users || [];
let goals = persisted.goals || [];
let plans = persisted.plans || [];
let tasks = persisted.tasks || [];
let reminders = persisted.reminders || [];
let adminLogs = persisted.adminLogs || [];
let settings = persisted.settings || null;
let backups = persisted.backups || [];
let posts = persisted.posts || [];
let comments = persisted.comments || [];
let notificationLogs = persisted.notificationLogs || [];
let userPreferences = persisted.userPreferences || [];
let reminderRules = persisted.reminderRules || [];
let announcements = persisted.announcements || defaultData.announcements;
let resources = persisted.resources || defaultData.resources;
let userIdCounter = persisted.userIdCounter || 1;
let goalIdCounter = persisted.goalIdCounter || 1;
let planIdCounter = persisted.planIdCounter || 1;
let taskIdCounter = persisted.taskIdCounter || 1;
let reminderIdCounter = persisted.reminderIdCounter || 1;
let postIdCounter = persisted.postIdCounter || 1;
let commentIdCounter = persisted.commentIdCounter || 1;
let resourceIdCounter = persisted.resourceIdCounter || 100;
let ruleIdCounter = persisted.ruleIdCounter || 1;

// ========== 认证模块 ==========
const tokenUserMap = new Map();

function generateToken(email) {
  return 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

function getUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const entry = tokenUserMap.get(token);
    if (!entry) return null;
    // 检查 token TTL
    const ttlDays = (settings?.security?.tokenTtlDays) || 7;
    const expiresAt = entry.created_at ? new Date(entry.created_at).getTime() + ttlDays * 86400000 : Infinity;
    if (Date.now() > expiresAt) {
      tokenUserMap.delete(token);
      return null;
    }
    return entry;
  }
  return null;
}

function authMiddleware(req, res, next) {
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ message: '未登录' });
  }
  req.user = user;
  next();
}

// 认证接口
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: '请填写必填字段' });
  }
  // 应用系统设置：是否允许注册
  if (settings?.security?.allowRegister === false) {
    return res.status(403).json({ message: '管理员已关闭新用户注册' });
  }
  // 应用系统设置：密码最小长度
  const minLen = settings?.security?.passwordMinLen || 6;
  if (password.length < minLen) {
    return res.status(400).json({ message: `密码长度至少 ${minLen} 位` });
  }
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ message: '该邮箱已注册' });
  }
  // 应用系统设置：新注册是否需要审核
  const requireApproval = settings?.security?.requireApproval === true;
  const user = {
    id: userIdCounter++, name, email, phone: phone || '', password,
    role: 'student',
    status: requireApproval ? 'pending' : 'active',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveData();
  // 需审核的账号不直接发 token
  if (requireApproval) {
    return res.json({ token: null, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'student', status: 'pending', created_at: user.createdAt }, message: '注册成功，等待管理员审核' });
  }
  const token = generateToken(email);
  tokenUserMap.set(token, { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'student', created_at: user.createdAt } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: '邮箱或密码错误' });
  }
  // 应用系统设置：维护模式（仅管理员可登录）
  if (settings?.site?.maintenance === true && user.role !== 'admin') {
    return res.status(503).json({ message: '系统维护中，仅管理员可登录' });
  }
  // 应用系统设置：待审核账号不可登录
  if (user.status === 'pending') {
    return res.status(403).json({ message: '账号待审核，请联系管理员' });
  }
  if (user.status === 'disabled') {
    return res.status(403).json({ message: '账号已被禁用' });
  }
  const token = generateToken(email);
  tokenUserMap.set(token, { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt } });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokenUserMap.delete(authHeader.substring(7));
  }
  res.json({ success: true });
});

app.get('/api/auth/profile', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  res.json(user);
});

app.put('/api/auth/profile', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.name) user.name = req.body.name;
  const dbUser = users.find(u => u.email === user.email);
  if (dbUser) {
    if (req.body.phone !== undefined) dbUser.phone = req.body.phone;
    if (req.body.name) dbUser.name = req.body.name;
    saveData();
  }
  res.json(user);
});

app.post('/api/auth/change-password', (req, res) => {
  res.json({ message: '密码修改成功' });
});

// ========== 头像上传 / 重置 ==========
app.post('/api/auth/avatar', (req, res) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || '上传失败' });
    }
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: '未登录' });
    if (!req.file) return res.status(400).json({ message: '未上传文件' });

    // 删除旧头像
    if (user.avatar) {
      try {
        const oldPath = path.join(__dirname, user.avatar.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (e) { /* ignore */ }
    }

    const relUrl = '/uploads/avatars/' + req.file.filename;
    user.avatar = relUrl;
    user.avatarUpdatedAt = new Date().toISOString();
    const dbUser = users.find(u => u.id === user.id);
    if (dbUser) {
      dbUser.avatar = relUrl;
      dbUser.avatarUpdatedAt = user.avatarUpdatedAt;
      saveData();
    }
    res.json({
      success: true,
      avatar: relUrl,
      avatarUpdatedAt: user.avatarUpdatedAt,
      message: '头像已更新'
    });
  });
});

app.delete('/api/auth/avatar', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  if (user.avatar) {
    try {
      const oldPath = path.join(__dirname, user.avatar.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (e) { /* ignore */ }
  }
  user.avatar = null;
  user.avatarUpdatedAt = new Date().toISOString();
  const dbUser = users.find(u => u.id === user.id);
  if (dbUser) {
    dbUser.avatar = null;
    dbUser.avatarUpdatedAt = user.avatarUpdatedAt;
    saveData();
  }
  res.json({ success: true, message: '头像已重置为默认' });
});

// ========== 学习目标 ==========
app.get('/api/goals', (req, res) => res.json(goals));

app.post('/api/goals', (req, res) => {
  const goal = {
    id: String(goalIdCounter++),
    ...req.body,
    progress: req.body.progress || 0,
    status: req.body.status || '进行中',
    createdAt: new Date().toISOString()
  };
  goals.push(goal);
  saveData();
  res.json(goal);
});

app.put('/api/goals/:id', (req, res) => {
  const goal = goals.find(g => String(g.id) === String(req.params.id));
  if (!goal) return res.status(404).json({ message: '目标不存在' });
  Object.assign(goal, req.body);
  saveData();
  res.json(goal);
});

app.delete('/api/goals/:id', (req, res) => {
  goals = goals.filter(g => String(g.id) !== String(req.params.id));
  saveData();
  res.json({ message: '删除成功' });
});

// ========== 学习计划 ==========
app.get('/api/plans', (req, res) => res.json(plans));

app.post('/api/plans', (req, res) => {
  const plan = {
    id: String(planIdCounter++),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  plans.push(plan);
  saveData();
  res.json(plan);
});

app.get('/api/plans/:id', (req, res) => {
  const plan = plans.find(p => String(p.id) === String(req.params.id));
  if (!plan) return res.status(404).json({ message: '计划不存在' });
  res.json(plan);
});

app.put('/api/plans/:id', (req, res) => {
  const plan = plans.find(p => String(p.id) === String(req.params.id));
  if (!plan) return res.status(404).json({ message: '计划不存在' });
  Object.assign(plan, req.body);
  saveData();
  res.json(plan);
});

app.delete('/api/plans/:id', (req, res) => {
  plans = plans.filter(p => String(p.id) !== String(req.params.id));
  saveData();
  res.json({ message: '删除成功' });
});

// ========== 任务 ==========
app.get('/api/tasks', (req, res) => res.json(tasks));

app.post('/api/tasks', (req, res) => {
  const task = {
    id: String(taskIdCounter++),
    ...req.body,
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  saveData();
  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => String(t.id) === String(req.params.id));
  if (!task) return res.status(404).json({ message: '任务不存在' });
  Object.assign(task, req.body);
  saveData();
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  tasks = tasks.filter(t => String(t.id) !== String(req.params.id));
  saveData();
  res.json({ message: '删除成功' });
});

// ========== 公告 ==========
app.get('/api/announcements', (req, res) => res.json(announcements));

// 创建公告（仅管理员）
app.post('/api/announcements', requireAdmin, (req, res) => {
  const { title, content, priority } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ message: '标题和内容不能为空' });
  }
  const item = {
    id: 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    title,
    content,
    priority: priority || 'normal',
    createdBy: req.currentUser.email,
    created_at: new Date().toISOString()
  };
  announcements.unshift(item);
  saveData();
  logAdminAction(req.currentUser, 'announcement.create', item.id, { title });
  res.json(item);
});

// 更新公告（仅管理员）
app.put('/api/announcements/:id', requireAdmin, (req, res) => {
  const item = announcements.find(a => a.id === req.params.id);
  if (!item) return res.status(404).json({ message: '公告不存在' });
  const { title, content, priority } = req.body || {};
  if (title !== undefined) item.title = title;
  if (content !== undefined) item.content = content;
  if (priority !== undefined) item.priority = priority;
  item.updated_at = new Date().toISOString();
  saveData();
  logAdminAction(req.currentUser, 'announcement.update', item.id, {});
  res.json(item);
});

// 删除公告（仅管理员）
app.delete('/api/announcements/:id', requireAdmin, (req, res) => {
  const idx = announcements.findIndex(a => a.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: '公告不存在' });
  const [removed] = announcements.splice(idx, 1);
  saveData();
  logAdminAction(req.currentUser, 'announcement.delete', removed.id, {});
  res.json({ success: true });
});

// ========== 资源分类（用户自定义） ==========

// 列出所有分类：预设 + 当前用户自定义
app.get('/api/resources/categories', (req, res) => {
  const user = getUserFromToken(req);
  const custom = (user && Array.isArray(user.customCategories)) ? user.customCategories : [];
  // 收集所有资源中实际使用到的分类（兜底兼容已有数据）
  const used = Array.from(new Set(resources.map(r => r.category).filter(Boolean)));
  const merged = Array.from(new Set([...PRESET_CATEGORIES, ...used, ...custom]));
  res.json({ preset: PRESET_CATEGORIES, custom, all: merged });
});

// 创建自定义分类
app.post('/api/resources/categories', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const name = ((req.body && req.body.name) || '').trim();
  if (!name) return res.status(400).json({ message: '类别名称不能为空' });
  if (name.length < 2 || name.length > 20) {
    return res.status(400).json({ message: '类别名称长度需在 2-20 字符之间' });
  }
  if (!CATEGORY_PATTERN.test(name)) {
    return res.status(400).json({ message: '类别名称仅支持中英文、数字、空格、下划线、连字符' });
  }
  if (RESERVED_CATEGORIES.includes(name.toLowerCase())) {
    return res.status(400).json({ message: '该名称为系统保留关键词，不可使用' });
  }
  if (!Array.isArray(user.customCategories)) user.customCategories = [];
  if (PRESET_CATEGORIES.includes(name) || user.customCategories.includes(name)) {
    return res.status(409).json({ message: '该类别已存在' });
  }
  if (user.customCategories.length >= 20) {
    return res.status(400).json({ message: '自定义类别最多 20 个' });
  }
  user.customCategories.push(name);
  const dbUser = users.find(u => u.id === user.id);
  if (dbUser) {
    dbUser.customCategories = user.customCategories;
    saveData();
  }
  res.json({ success: true, name, categories: user.customCategories });
});

// 删除自定义分类
app.delete('/api/resources/categories/:name', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const name = decodeURIComponent(req.params.name || '').trim();
  if (!Array.isArray(user.customCategories)) user.customCategories = [];
  const idx = user.customCategories.indexOf(name);
  if (idx === -1) return res.status(404).json({ message: '自定义类别不存在' });
  user.customCategories.splice(idx, 1);
  const dbUser = users.find(u => u.id === user.id);
  if (dbUser) {
    dbUser.customCategories = user.customCategories;
    saveData();
  }
  res.json({ success: true, categories: user.customCategories });
});

// ========== 资源模块 ==========

// 列表
app.get('/api/resources', (req, res) => {
  const { category, type, keyword } = req.query;
  let result = resources;
  if (category) result = result.filter(r => r.category === category);
  if (type) result = result.filter(r => r.type === type);
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    result = result.filter(r =>
      r.title.toLowerCase().includes(kw) ||
      (r.description && r.description.toLowerCase().includes(kw))
    );
  }
  res.json(result);
});

// 详情
app.get('/api/resources/:id', (req, res) => {
  const resource = resources.find(r => String(r.id) === String(req.params.id));
  if (!resource) return res.status(404).json({ message: '资源不存在' });
  res.json(resource);
});

// 创建（仅元数据）
app.post('/api/resources', (req, res) => {
  const { title, description, category, type, author, fileUrl, mimeType, fileSize, originalName } = req.body;
  if (!title || !category || !type) {
    return res.status(400).json({ message: '缺少必填字段' });
  }
  const resource = {
    id: 'r' + (resourceIdCounter++),
    title,
    description: description || '',
    category,
    type,
    author: author || '匿名用户',
    downloadCount: 0,
    rating: 0,
    fileUrl: fileUrl || '',
    mimeType: mimeType || '',
    fileSize: fileSize || 0,
    originalName: originalName || '',
    createdAt: new Date().toISOString()
  };
  resources.push(resource);
  saveData();
  res.status(201).json(resource);
});

// 文件上传（multipart）
app.post('/api/resources/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未收到文件' });
    }
    const fileUrl = `/api/resources/file/${req.file.filename}`;
    res.json({
      success: true,
      fileUrl,
      fileName: req.file.filename,
      originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error('上传失败:', err);
    res.status(500).json({ message: '上传失败: ' + err.message });
  }
});

// 文件下载（路径 /api/resources/file/:filename）
app.get('/api/resources/file/:filename', (req, res) => {
  const filename = req.params.filename;
  // 防止路径遍历
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: '非法文件名' });
  }
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: '文件不存在' });
  }
  res.download(filePath);
});

// 通过资源 ID 触发下载（同时增加计数）
app.get('/api/resources/:id/download', (req, res) => {
  const resource = resources.find(r => String(r.id) === String(req.params.id));
  if (!resource) return res.status(404).json({ message: '资源不存在' });
  if (!resource.fileUrl) {
    return res.status(404).json({ message: '该资源无可下载文件' });
  }
  // 提取文件名
  const filename = resource.fileUrl.split('/').pop();
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: '文件不存在' });
  }
  resource.downloadCount = (resource.downloadCount || 0) + 1;
  saveData();
  // 使用 RFC 5987 编码中文文件名
  const downloadName = resource.originalName || (resource.title + path.extname(filename));
  const encodedName = encodeURIComponent(downloadName);
  res.setHeader('Content-Disposition',
    `attachment; filename="${downloadName.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodedName}`);
  res.download(filePath);
});

// 删除资源
app.delete('/api/resources/:id', (req, res) => {
  const index = resources.findIndex(r => String(r.id) === String(req.params.id));
  if (index === -1) return res.status(404).json({ message: '资源不存在' });
  const resource = resources[index];
  // 删除关联文件
  if (resource.fileUrl) {
    const filename = resource.fileUrl.split('/').pop();
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
  }
  resources.splice(index, 1);
  saveData();
  res.json({ success: true });
});

// ========== 帖子模块 ==========

// 帖子列表
app.get('/api/posts', (req, res) => {
  const { category, keyword } = req.query;
  let result = posts.slice();
  if (category) result = result.filter(p => p.category === category);
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.content.toLowerCase().includes(kw)
    );
  }
  // 倒序
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(result);
});

// 帖子详情（含评论）
app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => String(p.id) === String(req.params.id));
  if (!post) return res.status(404).json({ message: '帖子不存在' });
  // 浏览数 +1
  post.viewCount = (post.viewCount || 0) + 1;
  saveData();
  const postComments = comments.filter(c => String(c.postId) === String(post.id));
  // 是否点赞
  const user = getUserFromToken(req);
  const liked = user ? (post.likedUsers || []).includes(user.id) : false;
  res.json({ ...post, comments: postComments, liked });
});

// 发布帖子
app.post('/api/posts', (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ message: '缺少必填字段' });
  }
  const user = getUserFromToken(req);
  const post = {
    id: 'p' + (postIdCounter++),
    userId: user ? user.id : 0,
    authorName: user ? user.name : '游客',
    title,
    content,
    category,
    viewCount: 0,
    commentCount: 0,
    likes: 0,
    likedUsers: [],
    createdAt: new Date().toISOString()
  };
  posts.push(post);
  saveData();
  res.status(201).json(post);
});

// 删除帖子
app.delete('/api/posts/:id', (req, res) => {
  const user = getUserFromToken(req);
  const index = posts.findIndex(p => String(p.id) === String(req.params.id));
  if (index === -1) return res.status(404).json({ message: '帖子不存在' });
  const post = posts[index];
  if (user && post.userId !== user.id) {
    return res.status(403).json({ message: '无权删除他人帖子' });
  }
  posts.splice(index, 1);
  // 关联评论一起删除
  for (let i = comments.length - 1; i >= 0; i--) {
    if (String(comments[i].postId) === String(req.params.id)) {
      comments.splice(i, 1);
    }
  }
  saveData();
  res.json({ success: true });
});

// 点赞/取消点赞
app.post('/api/posts/:id/like', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const post = posts.find(p => String(p.id) === String(req.params.id));
  if (!post) return res.status(404).json({ message: '帖子不存在' });
  post.likedUsers = post.likedUsers || [];
  const idx = post.likedUsers.indexOf(user.id);
  if (idx === -1) {
    post.likedUsers.push(user.id);
    post.likes = (post.likes || 0) + 1;
    saveData();
    res.json({ liked: true, likes: post.likes });
  } else {
    post.likedUsers.splice(idx, 1);
    post.likes = Math.max(0, (post.likes || 0) - 1);
    saveData();
    res.json({ liked: false, likes: post.likes });
  }
});

// 添加评论
app.post('/api/posts/:id/comments', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const post = posts.find(p => String(p.id) === String(req.params.id));
  if (!post) return res.status(404).json({ message: '帖子不存在' });
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: '评论内容不能为空' });
  }
  const comment = {
    id: 'c' + (commentIdCounter++),
    postId: post.id,
    userId: user.id,
    authorName: user.name,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  comments.push(comment);
  post.commentCount = (post.commentCount || 0) + 1;
  saveData();
  res.status(201).json(comment);
});

// ========== 提醒模块 ==========

// 旧的简单接口
app.get('/api/reminders', (req, res) => res.json(reminders));
app.post('/api/reminders', (req, res) => {
  const reminder = {
    id: reminderIdCounter++,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  reminders.push(reminder);
  saveData();
  res.json(reminder);
});

// 提醒偏好
app.get('/api/reminders/preferences', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  let prefs = userPreferences.find(p => p.userId === user.id);
  if (!prefs) {
    prefs = {
      userId: user.id,
      email: user.email,
      defaultChannel: 'both',
      advanceMinutes: 30,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      updatedAt: new Date().toISOString()
    };
    userPreferences.push(prefs);
    saveData();
  }
  res.json(prefs);
});

app.put('/api/reminders/preferences', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const { defaultChannel, advanceMinutes, quietHoursStart, quietHoursEnd } = req.body;
  let index = userPreferences.findIndex(p => p.userId === user.id);
  if (index === -1) {
    const prefs = {
      userId: user.id,
      email: user.email,
      defaultChannel: defaultChannel || 'both',
      advanceMinutes: advanceMinutes !== undefined ? advanceMinutes : 30,
      quietHoursStart: quietHoursStart || '22:00',
      quietHoursEnd: quietHoursEnd || '07:00',
      updatedAt: new Date().toISOString()
    };
    userPreferences.push(prefs);
    saveData();
    return res.json(prefs);
  }
  userPreferences[index] = {
    ...userPreferences[index],
    defaultChannel: defaultChannel || userPreferences[index].defaultChannel,
    advanceMinutes: advanceMinutes !== undefined ? advanceMinutes : userPreferences[index].advanceMinutes,
    quietHoursStart: quietHoursStart !== undefined ? quietHoursStart : userPreferences[index].quietHoursStart,
    quietHoursEnd: quietHoursEnd !== undefined ? quietHoursEnd : userPreferences[index].quietHoursEnd,
    updatedAt: new Date().toISOString()
  };
  saveData();
  res.json(userPreferences[index]);
});

// 标准化 triggerTime 为 "HH:mm"（兼容历史 ISO 字符串）
function normalizeTriggerTime(t) {
  if (t == null || t === '') return null;
  if (typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t)) return t;
  // 历史 ISO 字符串 → 取服务器本地时区的 HH:mm
  const d = new Date(t);
  if (isNaN(d.getTime())) return null;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// 启动时迁移历史 reminderRules.triggerTime（ISO 字符串 → "HH:mm"）
function migrateReminderRulesTimeFormat() {
  let migrated = 0;
  for (const r of reminderRules) {
    const original = r.triggerTime;
    const normalized = normalizeTriggerTime(original);
    if (original && original !== normalized) {
      r.triggerTime = normalized;
      migrated++;
    }
  }
  if (migrated > 0) {
    console.log(`[Migration] 已将 ${migrated} 条提醒规则的 triggerTime 迁移为 "HH:mm" 格式`);
    saveData();
  }
}

// 提醒规则
app.get('/api/reminders/rules', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const rules = reminderRules.filter(r => r.userId === user.id);
  res.json(rules);
});

app.post('/api/reminders/rules', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const { triggerType, triggerTime, advanceMinutes, frequency, channel, enabled, planId, name, description } = req.body;
  if (!triggerType || !channel) {
    return res.status(400).json({ message: '缺少必填字段' });
  }
  const rule = {
    id: 'rule' + (ruleIdCounter++),
    userId: user.id,
    planId: planId || null,
    name: name || `${triggerType} 提醒`,
    description: description || '',
    triggerType,
    triggerTime: normalizeTriggerTime(triggerTime),
    advanceMinutes: advanceMinutes || 30,
    frequency: frequency || 'daily',
    channel,
    enabled: enabled !== undefined ? enabled : true,
    lastTriggeredAt: null,
    lastTriggeredKey: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  reminderRules.push(rule);
  saveData();
  // 立即调度一次（如果时间合适）
  scheduleRuleCheck(rule);
  res.status(201).json(rule);
});

app.put('/api/reminders/rules/:id', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const index = reminderRules.findIndex(r => r.id === req.params.id && r.userId === user.id);
  if (index === -1) return res.status(404).json({ message: '规则不存在' });
  const incoming = { ...req.body };
  if ('triggerTime' in incoming) {
    incoming.triggerTime = normalizeTriggerTime(incoming.triggerTime);
  }
  reminderRules[index] = {
    ...reminderRules[index],
    ...incoming,
    updatedAt: new Date().toISOString()
  };
  saveData();
  res.json(reminderRules[index]);
});

app.delete('/api/reminders/rules/:id', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const index = reminderRules.findIndex(r => r.id === req.params.id && r.userId === user.id);
  if (index === -1) return res.status(404).json({ message: '规则不存在' });
  reminderRules.splice(index, 1);
  saveData();
  res.json({ success: true });
});

// 手动触发指定规则（立即发送通知）
app.post('/api/reminders/rules/:id/trigger', async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const rule = reminderRules.find(r => r.id === req.params.id && r.userId === user.id);
  if (!rule) return res.status(404).json({ message: '规则不存在' });
  const dbUser = users.find(u => u.id === user.id);
  const payload = buildRulePayload(rule, dbUser);
  const channels = rule.channel === 'both' ? ['email', 'push'] : [rule.channel];
  const now = new Date().toISOString();
  const newLogs = [];
  for (const ch of channels) {
    const r = await dispatchNotification({
      user: { id: user.id, email: dbUser ? dbUser.email : user.email, phone: dbUser ? dbUser.phone : user.phone },
      channel: ch,
      payload,
      source: 'rule'
    });
    const log = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      taskId: 'rule_' + rule.id,
      ruleId: rule.id,
      channel: ch,
      status: r.status,
      attempts: 1,
      maxAttempts: 3,
      createdAt: now,
      sentAt: r.status === 'sent' ? new Date().toISOString() : null,
      payload,
      details: r.details
    };
    notificationLogs.push(log);
    newLogs.push(log);
  }
  rule.lastTriggeredAt = now;
  saveData();
  res.json({ success: true, logs: newLogs, rule });
});

// 构造规则 payload
function buildRulePayload(rule, dbUser) {
  // 尝试找到关联计划
  let plan = null;
  if (rule.planId) {
    plan = plans.find(p => String(p.id) === String(rule.planId) || String(p.id) === String(rule.planId));
  }
  // 关键修复：基于 triggerTime("HH:mm") + 服务器本地时区派生 dueDate
  const dueDate = nextTriggerDate(rule).toISOString();
  return {
    taskTitle: rule.name || '计划任务提醒',
    taskDescription: rule.description || `您的学习计划"${plan ? plan.title : ''}"将在 ${rule.advanceMinutes} 分钟后开始`,
    dueDate,
    priority: 'normal',
    planTitle: plan ? plan.title : (rule.name || '学习计划')
  };
}

// 关键修复：基于 "HH:mm" + frequency + 服务器本地时区计算下次触发的绝对时间戳
function nextTriggerDate(rule) {
  if (!rule.triggerTime) return new Date();
  const [h, m] = String(rule.triggerTime).split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return new Date();
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(h, m, 0, 0);

  const freq = rule.frequency || 'daily';
  // 推进到符合 frequency 的下一个候选日
  for (let i = 0; i < 8; i++) {
    const probe = new Date(candidate);
    probe.setDate(candidate.getDate() + i);
    if (probe.getTime() <= now.getTime()) continue;
    if (matchesFrequency(probe, freq)) return probe;
  }
  return candidate;
}

function matchesFrequency(date, freq) {
  const day = date.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  if (freq === 'daily') return true;
  if (freq === 'weekdays') return day >= 1 && day <= 5;
  if (freq === 'weekly') return day === 1;
  return true;
}

// 调度单条规则的检查（每次触发后自动重新调度下次）
function scheduleRuleCheck(rule) {
  if (!rule.enabled || !rule.triggerTime) return;
  const triggerDate = nextTriggerDate(rule);
  const triggerMs = triggerDate.getTime();
  const advanceMs = (rule.advanceMinutes || 0) * 60_000;
  const fireAt = triggerMs - advanceMs;
  const delay = fireAt - Date.now();
  if (delay > 0 && delay < 24 * 3600_000) {
    setTimeout(() => fireReminderRule(rule.id), delay);
    console.log(`[Scheduler] 规则 ${rule.id} 将在 ${Math.round(delay/1000)}s 后触发（${triggerDate.toLocaleString()} 本地）`);
  } else if (delay <= 0) {
    // 防御性：若当前时间已过计划触发时间，立即触发一次并重新调度
    setTimeout(() => fireReminderRule(rule.id), 1000);
  }
}

// 触发提醒规则
async function fireReminderRule(ruleId) {
  const rule = reminderRules.find(r => r.id === ruleId);
  if (!rule || !rule.enabled) return;
  // 用 (本地日期|frequency) 作为去重 key（避免跨时区/午夜的边界问题）
  const fireKey = `${formatLocalDateKey(new Date())}|${rule.frequency}`;
  if (rule.lastTriggeredKey === fireKey) return; // 本时段已触发
  const user = users.find(u => u.id === rule.userId);
  if (!user) return;
  const payload = buildRulePayload(rule, user);
  const channels = rule.channel === 'both' ? ['email', 'push'] : [rule.channel];
  const now = new Date().toISOString();
  for (const ch of channels) {
    const r = await dispatchNotification({
      user: { id: user.id, email: user.email, phone: user.phone },
      channel: ch,
      payload,
      source: 'rule-scheduled'
    });
    notificationLogs.push({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      taskId: 'rule_' + rule.id,
      ruleId: rule.id,
      channel: ch,
      status: r.status,
      attempts: 1,
      maxAttempts: 3,
      createdAt: now,
      sentAt: r.status === 'sent' ? new Date().toISOString() : null,
      payload,
      details: r.details
    });
  }
  rule.lastTriggeredAt = now;
  rule.lastTriggeredKey = fireKey;
  saveData();
  console.log(`[Scheduler] 规则 ${rule.id} 已自动触发`);
  // 一次性规则触发后自动禁用
  if (rule.frequency === 'once') {
    rule.enabled = false;
    saveData();
  } else {
    // 关键修复：循环规则在触发后重新调度下一次
    scheduleRuleCheck(rule);
  }
}

// 生成 "YYYY-MM-DD" 本地日期 key
function formatLocalDateKey(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

// 启动时恢复所有未触发的规则
function resumeScheduledRules() {
  for (const rule of reminderRules) {
    if (rule.enabled) scheduleRuleCheck(rule);
  }
}

// 通知渠道状态（供前端显示）
app.get('/api/reminders/channel-status', (req, res) => {
  const cfg = require('./notification-service').loadSmtpConfig();
  res.json({
    smtp: {
      configured: isSmtpConfigured(),
      host: cfg.host ? cfg.host.replace(/(.{2}).+(@.+)/, '$1***$2') : null,
      user: cfg.user ? cfg.user.replace(/(.{2}).+(@.+)/, '$1***$2') : null,
      fromName: cfg.fromName
    },
    sms: { configured: false, mode: 'console-simulated', note: '短信当前为控制台模拟，配置第三方网关后可真实发送' }
  });
});

// 通知日志
app.get('/api/reminders/logs', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const status = req.query.status;
  const limit = parseInt(req.query.limit) || 50;
  let logs = notificationLogs.filter(l => l.userId === user.id);
  if (status) logs = logs.filter(l => l.status === status);
  logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(logs.slice(0, limit));
});

// 统计
app.get('/api/reminders/stats', (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const logs = notificationLogs.filter(l => l.userId === user.id);
  res.json({
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    retrying: logs.filter(l => l.status === 'retrying').length
  });
});

// 发送测试通知（多渠道模拟）
const { dispatchNotification, isSmtpConfigured } = require('./notification-service');

app.post('/api/reminders/test', async (req, res) => {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  const prefs = userPreferences.find(p => p.userId === user.id);
  // 优先使用请求体中的 channel（前端当前选中的渠道），其次用户偏好，最后默认 both
  const reqChannel = (req.body && req.body.channel) || '';
  const channel = reqChannel || (prefs && prefs.defaultChannel) || 'both';
  const channels = channel === 'both' ? ['email', 'push'] : [channel];

  const now = new Date().toISOString();
  const payload = {
    taskTitle: '测试提醒 - 学习任务即将到期',
    taskDescription: '这是一条测试通知，验证提醒功能是否正常工作。',
    dueDate: new Date(Date.now() + 30 * 60_000).toISOString(),
    priority: 'normal',
    planTitle: '测试计划'
  };

  const dbUser = users.find(u => u.id === user.id);
  const newLogs = [];
  for (const ch of channels) {
    const dispatchResult = await dispatchNotification({
      user: { id: user.id, email: dbUser ? dbUser.email : user.email, phone: dbUser ? dbUser.phone : user.phone },
      channel: ch,
      payload,
      source: 'test'
    });
    const log = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      taskId: 'test_task',
      channel: ch,
      status: dispatchResult.status,
      attempts: 1,
      maxAttempts: 3,
      createdAt: now,
      sentAt: dispatchResult.status === 'sent' ? new Date().toISOString() : null,
      payload,
      details: dispatchResult.details
    };
    notificationLogs.push(log);
    newLogs.push(log);
  }
  saveData();

  // 汇总本次发送结果
  const sent = newLogs.filter(l => l.status === 'sent').length;
  const failed = newLogs.length - sent;
  res.json({
    success: sent > 0,
    message: sent > 0
      ? `测试通知已发送 (${sent}/${newLogs.length} 渠道成功)${failed > 0 ? '，部分渠道失败' : ''}`
      : '测试通知发送失败，请检查邮箱/手机配置',
    logs: newLogs,
    channel,
    smtpConfigured: isSmtpConfigured(),
    summary: { sent, failed, total: newLogs.length }
  });
});

// 验证码（保持兼容）
app.get('/api/auth/captcha', (req, res) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < 4; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  res.json({
    image: `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="40" fill="#f1f5f9"/>
        <text x="20" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#1e40af">${captcha.charAt(0)}</text>
        <text x="45" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#0d9488">${captcha.charAt(1)}</text>
        <text x="70" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#f59e0b">${captcha.charAt(2)}</text>
        <text x="95" y="28" font-family="Arial" font-size="24" font-weight="bold" fill="#ef4444">${captcha.charAt(3)}</text>
      </svg>`
    ).toString('base64')}`,
    captcha
  });
});

// ========== 管理员模块 ==========
// 角色：user（默认）/ admin
// 数据结构：{ adminLogs: [], settings: {site, security, mail}, backups: [] }

function ensureAdminFields() {
  if (!Array.isArray(adminLogs)) adminLogs = [];
  if (!settings) {
    settings = {
      site: { name: '智慧学习平台', subtitle: '一站式个人学习管理', description: '一站式个人学习管理', icp: '', supportEmail: 'admin@example.com', maintenance: false },
      security: { tokenTtlDays: 7, passwordMinLen: 6, maxLoginFail: 5, allowRegister: true, requireApproval: false },
      mail: { enabled: false, host: '', port: 465, secure: true, from: 'no-reply@example.com', user: '', pass: '' }
    };
  }
  // 兼容旧字段迁移
  if (!settings.site.subtitle) settings.site.subtitle = '';
  if (!settings.site.icp) settings.site.icp = '';
  if (!settings.site.supportEmail) settings.site.supportEmail = settings.site.contact || '';
  if (settings.site.maintenance === undefined) settings.site.maintenance = false;
  if (settings.security.tokenTtlDays === undefined) settings.security.tokenTtlDays = 7;
  if (settings.security.passwordMinLen === undefined) settings.security.passwordMinLen = settings.security.passwordMinLength || 6;
  if (settings.security.maxLoginFail === undefined) settings.security.maxLoginFail = settings.security.maxLoginAttempts || 5;
  if (settings.security.allowRegister === undefined) settings.security.allowRegister = true;
  if (settings.security.requireApproval === undefined) settings.security.requireApproval = false;
  if (settings.mail.enabled === undefined) settings.mail.enabled = false;
  if (settings.mail.host === undefined) settings.mail.host = settings.mail.smtpHost || '';
  if (settings.mail.port === undefined) settings.mail.port = settings.mail.smtpPort || 465;
  if (settings.mail.secure === undefined) settings.mail.secure = settings.mail.smtpSecure !== false;
  if (settings.mail.user === undefined) settings.mail.user = settings.mail.smtpUser || '';
  if (settings.mail.pass === undefined) settings.mail.pass = '';
  if (!Array.isArray(backups)) backups = [];
}
ensureAdminFields();

function logAdminAction(actor, action, target, meta = {}) {
  adminLogs.unshift({
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    actor: actor ? actor.email : 'system',
    actorId: actor ? actor.id : null,
    action,
    target: target ? String(target) : '',
    meta,
    ip: '',
    createdAt: new Date().toISOString()
  });
  if (adminLogs.length > 1000) adminLogs.length = 1000;
  saveData();
}

function requireAdmin(req, res, next) {
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ message: '未登录' });
  if (user.role !== 'admin') return res.status(403).json({ message: '需要管理员权限' });
  req.currentUser = user;
  next();
}

const BACKUP_DIR = path.join(__dirname, 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// 管理端：统计
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const now = Date.now();
  const last7d = now - 7 * 86400000;
  const last30d = now - 30 * 86400000;
  const newUsers7d = users.filter(u => new Date(u.createdAt || 0).getTime() > last7d).length;
  const newUsers30d = users.filter(u => new Date(u.createdAt || 0).getTime() > last30d).length;
  const posts7d = posts.filter(p => new Date(p.createdAt || 0).getTime() > last7d).length;
  const resources7d = resources.filter(r => new Date(r.createdAt || 0).getTime() > last7d).length;
  // 按分类统计资源
  const categoryMap = {};
  for (const r of resources) {
    const k = r.category || '未分类';
    categoryMap[k] = (categoryMap[k] || 0) + 1;
  }
  // 按日期统计活跃度（最近 14 天）
  const daily = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const nextKey = new Date(now - (i - 1) * 86400000).toISOString().slice(0, 10);
    const uCount = users.filter(u => (u.createdAt || '').slice(0, 10) === key).length;
    const pCount = posts.filter(p => (p.createdAt || '').slice(0, 10) >= key && (p.createdAt || '').slice(0, 10) < nextKey).length;
    const rCount = resources.filter(r => (r.createdAt || '').slice(0, 10) >= key && (r.createdAt || '').slice(0, 10) < nextKey).length;
    daily.push({ date: key, users: uCount, posts: pCount, resources: rCount });
  }
  res.json({
    userTotal: users.length,
    userDisabled: users.filter(u => u.disabled).length,
    newUsers7d,
    newUsers30d,
    postTotal: posts.length,
    postPending: posts.filter(p => p.status === 'pending').length,
    posts7d,
    resourceTotal: resources.length,
    resources7d,
    downloadTotal: resources.reduce((s, r) => s + (r.downloadCount || 0), 0),
    likeTotal: posts.reduce((s, p) => s + (p.likes || 0), 0),
    commentTotal: posts.reduce((s, p) => s + (p.comments ? p.comments.length : 0), 0),
    resourceByCategory: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
    daily
  });
});

// 管理端：用户列表（搜索 + 分页）
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const { q = '', page = 1, pageSize = 10, role = '', status = '' } = req.query;
  let list = users.slice();
  if (q) {
    const k = String(q).toLowerCase();
    list = list.filter(u =>
      (u.email || '').toLowerCase().includes(k) ||
      (u.name || '').toLowerCase().includes(k) ||
      (u.studentId || '').toLowerCase().includes(k)
    );
  }
  if (role) list = list.filter(u => (u.role || 'user') === role);
  if (status === 'active') list = list.filter(u => !u.disabled);
  if (status === 'disabled') list = list.filter(u => u.disabled);
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const total = list.length;
  const p = Math.max(1, parseInt(page));
  const ps = Math.max(1, Math.min(50, parseInt(pageSize)));
  const items = list.slice((p - 1) * ps, p * ps).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    studentId: u.studentId,
    role: u.role || 'user',
    disabled: !!u.disabled,
    avatar: u.avatar,
    createdAt: u.createdAt
  }));
  res.json({ total, page: p, pageSize: ps, items });
});

app.put('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body || {};
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: '非法角色' });
  const u = users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ message: '用户不存在' });
  u.role = role;
  saveData();
  logAdminAction(req.currentUser, 'user.role.change', u.id, { role });
  res.json({ success: true, role: u.role });
});

app.put('/api/admin/users/:id/status', requireAdmin, (req, res) => {
  const { disabled } = req.body || {};
  const u = users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ message: '用户不存在' });
  u.disabled = !!disabled;
  saveData();
  logAdminAction(req.currentUser, u.disabled ? 'user.disable' : 'user.enable', u.id, {});
  res.json({ success: true, disabled: u.disabled });
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  const u = users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ message: '用户不存在' });
  if (u.id === req.currentUser.id) return res.status(400).json({ message: '不能删除自己' });
  users = users.filter(x => x.id !== u.id);
  // 连带清理
  resources = resources.filter(r => r.userId !== u.id);
  posts = posts.filter(p => p.userId !== u.id);
  saveData();
  logAdminAction(req.currentUser, 'user.delete', u.id, { email: u.email });
  res.json({ success: true });
});

// 管理端：操作日志
app.get('/api/admin/logs', requireAdmin, (req, res) => {
  const { q = '', action = '', page = 1, pageSize = 20 } = req.query;
  let list = adminLogs.slice();
  if (action) list = list.filter(l => l.action === action);
  if (q) {
    const k = String(q).toLowerCase();
    list = list.filter(l =>
      (l.actor || '').toLowerCase().includes(k) ||
      (l.target || '').toLowerCase().includes(k) ||
      (l.action || '').toLowerCase().includes(k)
    );
  }
  const total = list.length;
  const p = Math.max(1, parseInt(page));
  const ps = Math.max(1, Math.min(200, parseInt(pageSize)));
  const items = list.slice((p - 1) * ps, p * ps);
  res.json({ total, page: p, pageSize: ps, items });
});

app.get('/api/admin/logs/export', requireAdmin, (req, res) => {
  logAdminAction(req.currentUser, 'logs.export', '', {});
  const lines = ['id,time,actor,action,target,meta'];
  for (const l of adminLogs) {
    const meta = JSON.stringify(l.meta || {}).replace(/"/g, '""');
    lines.push([l.id, l.createdAt, l.actor, l.action, l.target, '"' + meta + '"'].join(','));
  }
  const csv = '\uFEFF' + lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="admin-logs.csv"');
  res.send(csv);
});

// 管理端：系统设置
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  res.json(settings);
});

// 公开设置（登录页/注册页可用，仅返回安全相关的公开字段）
app.get('/api/settings/public', (req, res) => {
  res.json({
    siteName: settings?.site?.name || '智慧学习平台',
    siteSubtitle: settings?.site?.subtitle || '',
    siteDescription: settings?.site?.description || '',
    icp: settings?.site?.icp || '',
    supportEmail: settings?.site?.supportEmail || '',
    maintenance: settings?.site?.maintenance === true,
    allowRegister: settings?.security?.allowRegister !== false,
    passwordMinLen: settings?.security?.passwordMinLen || 6
  });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const body = req.body || {};
  const changed = [];
  if (body.site) {
    Object.assign(settings.site, body.site);
    changed.push('site');
  }
  if (body.security) {
    Object.assign(settings.security, body.security);
    changed.push('security');
    // 若关闭注册或开启审核，记录日志
    if (body.security.allowRegister === false) changed.push('allowRegister=false');
    if (body.security.requireApproval === true) changed.push('requireApproval=true');
  }
  if (body.mail) {
    Object.assign(settings.mail, body.mail);
    changed.push('mail');
  }
  saveData();
  logAdminAction(req.currentUser, 'settings.update', '', { keys: changed });
  res.json({ success: true, settings });
});

// 管理端：备份与恢复
app.post('/api/admin/backup', requireAdmin, (req, res) => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${ts}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  const payload = {
    version: 1,
    createdAt: new Date().toISOString(),
    data: {
      users, goals, plans, tasks, reminders, posts, comments, notificationLogs,
      userPreferences, reminderRules, announcements, resources,
      adminLogs, settings, backups
    }
  };
  fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf-8');
  const stat = fs.statSync(filepath);
  const item = {
    id: 'bk_' + Date.now(),
    name: filename,
    filename,
    size: stat.size,
    operator: req.currentUser.email,
    createdBy: req.currentUser.email,
    createdAt: payload.createdAt,
    snapshot: {
      userCount: users.length,
      postCount: posts.length,
      resourceCount: resources.length
    }
  };
  backups.unshift(item);
  if (backups.length > 50) {
    for (const old of backups.slice(50)) {
      try {
        const p = path.join(BACKUP_DIR, old.filename);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch (e) { /* ignore */ }
    }
    backups = backups.slice(0, 50);
  }
  saveData();
  logAdminAction(req.currentUser, 'backup.create', item.id, { filename });
  res.json({ success: true, backup: item });
});

app.get('/api/admin/backups', requireAdmin, (req, res) => {
  res.json({ items: backups });
});

app.post('/api/admin/backup/restore', requireAdmin, (req, res) => {
  const { id } = req.body || {};
  const item = backups.find(b => b.id === id);
  if (!item) return res.status(404).json({ message: '备份不存在' });
  const filepath = path.join(BACKUP_DIR, item.filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ message: '备份文件已丢失' });
  try {
    const payload = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    if (!payload.data) throw new Error('备份文件格式错误');
    const d = payload.data;
    if (Array.isArray(d.users)) users = d.users;
    if (Array.isArray(d.goals)) goals = d.goals;
    if (Array.isArray(d.plans)) plans = d.plans;
    if (Array.isArray(d.tasks)) tasks = d.tasks;
    if (Array.isArray(d.reminders)) reminders = d.reminders;
    if (Array.isArray(d.posts)) posts = d.posts;
    if (Array.isArray(d.comments)) comments = d.comments;
    if (Array.isArray(d.notificationLogs)) notificationLogs = d.notificationLogs;
    if (Array.isArray(d.userPreferences)) userPreferences = d.userPreferences;
    if (Array.isArray(d.reminderRules)) reminderRules = d.reminderRules;
    if (Array.isArray(d.announcements)) announcements = d.announcements;
    if (Array.isArray(d.resources)) resources = d.resources;
    if (Array.isArray(d.adminLogs)) adminLogs = d.adminLogs;
    if (d.settings) settings = d.settings;
    if (Array.isArray(d.backups)) backups = d.backups;
    ensureAdminFields();
    saveData();
    logAdminAction(req.currentUser, 'backup.restore', item.id, { filename: item.filename });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: '恢复失败: ' + e.message });
  }
});

app.delete('/api/admin/backup/:id', requireAdmin, (req, res) => {
  const item = backups.find(b => b.id === req.params.id);
  if (!item) return res.status(404).json({ message: '备份不存在' });
  try {
    const p = path.join(BACKUP_DIR, item.filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (e) { /* ignore */ }
  backups = backups.filter(b => b.id !== item.id);
  saveData();
  logAdminAction(req.currentUser, 'backup.delete', item.id, { filename: item.filename });
  res.json({ success: true });
});

app.get('/api/admin/backup/:id/download', requireAdmin, (req, res) => {
  const item = backups.find(b => b.id === req.params.id);
  if (!item) return res.status(404).json({ message: '备份不存在' });
  const filepath = path.join(BACKUP_DIR, item.filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ message: '备份文件已丢失' });
  res.download(filepath, item.name + '.json');
  logAdminAction(req.currentUser, 'backup.download', item.id, { filename: item.filename });
});

// 管理端：帖子列表（筛选 + 分页）
app.get('/api/admin/posts', requireAdmin, (req, res) => {
  const { q = '', status = '', author = '', page = 1, pageSize = 10, sort = 'newest' } = req.query;
  let list = posts.slice();
  if (status) list = list.filter(p => (p.status || 'published') === status);
  if (author) list = list.filter(p => p.author === author || p.userEmail === author);
  if (q) {
    const k = String(q).toLowerCase();
    list = list.filter(p =>
      (p.title || '').toLowerCase().includes(k) ||
      (p.content || '').toLowerCase().includes(k) ||
      (p.author || '').toLowerCase().includes(k)
    );
  }
  if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  if (sort === 'oldest') list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  if (sort === 'likes') list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  const total = list.length;
  const p = Math.max(1, parseInt(page));
  const ps = Math.max(1, Math.min(50, parseInt(pageSize)));
  res.json({ total, page: p, pageSize: ps, items: list.slice((p - 1) * ps, p * ps) });
});

app.put('/api/admin/posts/:id', requireAdmin, (req, res) => {
  const post = posts.find(x => x.id === req.params.id);
  if (!post) return res.status(404).json({ message: '帖子不存在' });
  const { title, content, status, category } = req.body || {};
  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  if (status !== undefined) post.status = status;
  if (category !== undefined) post.category = category;
  post.updatedAt = new Date().toISOString();
  saveData();
  logAdminAction(req.currentUser, 'post.update', post.id, { status: post.status });
  res.json({ success: true, post });
});

app.put('/api/admin/posts/:id/review', requireAdmin, (req, res) => {
  const post = posts.find(x => x.id === req.params.id);
  if (!post) return res.status(404).json({ message: '帖子不存在' });
  const { approved } = req.body || {};
  post.status = approved ? 'published' : 'rejected';
  post.reviewedAt = new Date().toISOString();
  post.reviewedBy = req.currentUser.email;
  saveData();
  logAdminAction(req.currentUser, approved ? 'post.approve' : 'post.reject', post.id, {});
  res.json({ success: true, status: post.status });
});

app.post('/api/admin/posts/batch-delete', requireAdmin, (req, res) => {
  const { ids = [] } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: '请选择要删除的帖子' });
  const before = posts.length;
  posts = posts.filter(p => !ids.includes(p.id));
  const removed = before - posts.length;
  saveData();
  logAdminAction(req.currentUser, 'post.batch.delete', ids.join(','), { count: removed });
  res.json({ success: true, removed });
});

// 管理端：资源列表（搜索 + 分页）
app.get('/api/admin/resources', requireAdmin, (req, res) => {
  const { q = '', category = '', page = 1, pageSize = 10 } = req.query;
  let list = resources.slice();
  if (category) list = list.filter(r => r.category === category);
  if (q) {
    const k = String(q).toLowerCase();
    list = list.filter(r =>
      (r.title || '').toLowerCase().includes(k) ||
      (r.description || '').toLowerCase().includes(k) ||
      (r.uploader || '').toLowerCase().includes(k)
    );
  }
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const total = list.length;
  const p = Math.max(1, parseInt(page));
  const ps = Math.max(1, Math.min(50, parseInt(pageSize)));
  res.json({ total, page: p, pageSize: ps, items: list.slice((p - 1) * ps, p * ps), categories: PRESET_CATEGORIES });
});

app.put('/api/admin/resources/:id', requireAdmin, (req, res) => {
  const r = resources.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ message: '资源不存在' });
  const { title, description, category, type, fileUrl, fileName } = req.body || {};
  if (title !== undefined) r.title = title;
  if (description !== undefined) r.description = description;
  if (category !== undefined) r.category = category;
  if (type !== undefined) r.type = type;
  if (fileUrl !== undefined) r.fileUrl = fileUrl;
  if (fileName !== undefined) r.fileName = fileName;
  r.updatedAt = new Date().toISOString();
  saveData();
  logAdminAction(req.currentUser, 'resource.update', r.id, {});
  res.json({ success: true, resource: r });
});

app.post('/api/admin/resources/batch-delete', requireAdmin, (req, res) => {
  const { ids = [] } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: '请选择要删除的资源' });
  const before = resources.length;
  resources = resources.filter(r => !ids.includes(r.id));
  const removed = before - resources.length;
  saveData();
  logAdminAction(req.currentUser, 'resource.batch.delete', ids.join(','), { count: removed });
  res.json({ success: true, removed });
});

app.post('/api/admin/resources/batch-upload', requireAdmin, (req, res) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || '上传失败' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: '未上传文件' });
    const category = ((req.body && req.body.category) || '其他').trim();
    const type = ((req.body && req.body.type) || 'document').trim();
    const created = [];
    for (const f of req.files) {
      const id = 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const r = {
        id,
        title: f.originalname,
        description: '',
        category,
        type,
        fileUrl: '/uploads/' + f.filename,
        fileName: f.originalname,
        fileSize: f.size,
        uploader: req.currentUser.email,
        userId: req.currentUser.id,
        downloadCount: 0,
        rating: 0,
        createdAt: new Date().toISOString()
      };
      resources.unshift(r);
      created.push(r);
    }
    saveData();
    logAdminAction(req.currentUser, 'resource.batch.upload', '', { count: created.length, category });
    res.json({ success: true, count: created.length, items: created });
  });
});

// 静态资源（仅服务 uploads 等显式目录，根路径 fallback 已移除）
app.use('/uploads', express.static(UPLOAD_DIR));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // 启动时迁移历史 triggerTime（ISO 字符串 → "HH:mm"）
  try { migrateReminderRulesTimeFormat(); } catch (e) { console.error('Migration failed:', e.message); }
  // 启动时恢复所有启用的提醒规则
  if (typeof resumeScheduledRules === 'function') {
    resumeScheduledRules();
  }
});
