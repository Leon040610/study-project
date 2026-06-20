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
    return tokenUserMap.get(token);
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
  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ message: '该邮箱已注册' });
  }
  const user = { id: userIdCounter++, name, email, phone: phone || '', password, role: 'student', createdAt: new Date().toISOString() };
  users.push(user);
  saveData();
  const token = generateToken(email);
  tokenUserMap.set(token, { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, created_at: user.createdAt });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'student', created_at: user.createdAt } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: '邮箱或密码错误' });
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
    triggerTime: triggerTime || null,
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
  reminderRules[index] = {
    ...reminderRules[index],
    ...req.body,
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
  const triggerDate = rule.triggerTime ? new Date(rule.triggerTime) : new Date();
  return {
    taskTitle: rule.name || '计划任务提醒',
    taskDescription: rule.description || `您的学习计划"${plan ? plan.title : ''}"将在 ${rule.advanceMinutes} 分钟后开始`,
    dueDate: triggerDate.toISOString(),
    priority: 'normal',
    planTitle: plan ? plan.title : (rule.name || '学习计划')
  };
}

// 调度单条规则的检查
function scheduleRuleCheck(rule) {
  if (!rule.enabled || !rule.triggerTime) return;
  const triggerMs = new Date(rule.triggerTime).getTime();
  const advanceMs = (rule.advanceMinutes || 0) * 60_000;
  const fireAt = triggerMs - advanceMs;
  const delay = fireAt - Date.now();
  if (delay > 0 && delay < 24 * 3600_000) {
    setTimeout(() => fireReminderRule(rule.id), delay);
    console.log(`[Scheduler] 规则 ${rule.id} 将在 ${Math.round(delay/1000)}s 后触发`);
  }
}

// 触发提醒规则
async function fireReminderRule(ruleId) {
  const rule = reminderRules.find(r => r.id === ruleId);
  if (!rule || !rule.enabled) return;
  // 用 (date|frequency) 作为去重 key
  const fireKey = `${new Date().toISOString().slice(0, 13)}|${rule.frequency}`;
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
  }
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
  const channel = (prefs && prefs.defaultChannel) || 'both';
  // both: 邮件 + 站内推送（站内推送总是可达）
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

// 静态资源
app.use('/uploads', express.static(UPLOAD_DIR));

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // 启动时恢复所有启用的提醒规则
  if (typeof resumeScheduledRules === 'function') {
    resumeScheduledRules();
  }
});
